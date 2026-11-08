param(
    [switch]$Apply
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$VaultName = 'kv-skcs-edge036-zan1'
$SecretName = 'cron-secret'
$SecretsOfficerRole = 'Key Vault Secrets Officer'
$SecureRoot = Join-Path $env:LOCALAPPDATA 'SKCS\SecureTemp\ESEC-001-I5'
$SecretFile = Join-Path $SecureRoot 'azure-cron-secret.secret'
$TemporarySecretsOfficerCreated = $false
$VaultScope = $null
$CurrentPrincipalId = $null

function Remove-SensitiveFile {
    param([Parameter(Mandatory=$true)][string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) { return }
    try {
        $item = Get-Item -LiteralPath $Path -Force
        if (-not $item.PSIsContainer) {
            $length = [int64]$item.Length
            if ($length -gt 0) {
                $stream = [System.IO.File]::Open(
                    $Path,
                    [System.IO.FileMode]::Open,
                    [System.IO.FileAccess]::Write,
                    [System.IO.FileShare]::None
                )
                try {
                    $buffer = New-Object byte[] ([Math]::Min([int64]65536, $length))
                    $remaining = $length
                    while ($remaining -gt 0) {
                        $count = [int][Math]::Min([int64]$buffer.Length, $remaining)
                        $stream.Write($buffer, 0, $count)
                        $remaining -= $count
                    }
                    $stream.Flush($true)
                }
                finally {
                    $stream.Dispose()
                }
            }
        }
    }
    catch {
        # Best-effort overwrite; deletion still follows.
    }
    Remove-Item -LiteralPath $Path -Force -ErrorAction SilentlyContinue
}

function Get-SecretExists {
    $priorErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    $countText = (& az keyvault secret list --vault-name $VaultName --query "[?name=='$SecretName'] | length(@)" -o tsv --only-show-errors 2>$null)
    $exitCode = $LASTEXITCODE
    $ErrorActionPreference = $priorErrorActionPreference
    if ($exitCode -ne 0) {
        throw 'Unable to inspect Key Vault secret metadata.'
    }
    return ([int]($countText.Trim())) -gt 0
}

New-Item -ItemType Directory -Force -Path $SecureRoot | Out-Null
Remove-SensitiveFile -Path $SecretFile

try {
    $preExisting = Get-SecretExists

    if (-not $Apply) {
        [pscustomobject]@{
            Project = 'ESEC-001-I5'
            Mode = 'DRY_RUN'
            SecretName = $SecretName
            PreExisting = $preExisting
            Action = $(if ($preExisting) { 'BLOCKED_ALREADY_EXISTS' } else { 'READY_TO_CREATE' })
            SecretValuesDisplayed = $false
        } | ConvertTo-Json -Depth 4
        return
    }

    if ($preExisting) {
        throw 'cron-secret already exists. I5 refuses to overwrite or rotate an existing scheduler secret.'
    }

    $VaultScope = (& az keyvault show --name $VaultName --query id -o tsv --only-show-errors).Trim()
    $CurrentPrincipalId = (& az ad signed-in-user show --query id -o tsv --only-show-errors).Trim()
    if (-not $VaultScope -or -not $CurrentPrincipalId) {
        throw 'Unable to resolve vault scope or deployment principal for temporary RBAC.'
    }

    $existingSecretsOfficer = (& az role assignment list --assignee $CurrentPrincipalId --scope $VaultScope --include-inherited --query "[?roleDefinitionName=='Key Vault Secrets Officer'] | length(@)" -o tsv --only-show-errors).Trim()
    if ($existingSecretsOfficer -eq '0') {
        $priorRoleErrorActionPreference = $ErrorActionPreference
        $ErrorActionPreference = 'Continue'
        & az role assignment create --assignee-object-id $CurrentPrincipalId --assignee-principal-type User --role $SecretsOfficerRole --scope $VaultScope --only-show-errors *> $null
        $roleCreateExitCode = $LASTEXITCODE
        $ErrorActionPreference = $priorRoleErrorActionPreference
        if ($roleCreateExitCode -ne 0) {
            throw 'Temporary Key Vault Secrets Officer grant failed.'
        }
        $TemporarySecretsOfficerCreated = $true
    }

    $bytes = New-Object byte[] 48
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try {
        $rng.GetBytes($bytes)
    }
    finally {
        $rng.Dispose()
    }

    $secretValue = [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+','-').Replace('/','_')
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($SecretFile, $secretValue, $utf8NoBom)
    $secretValue = $null
    [Array]::Clear($bytes, 0, $bytes.Length)

    $secretWritten = $false
    for ($attempt = 1; $attempt -le 6; $attempt++) {
        $priorSecretErrorActionPreference = $ErrorActionPreference
        $ErrorActionPreference = 'Continue'
        & az keyvault secret set --vault-name $VaultName --name $SecretName --file $SecretFile --encoding utf-8 --content-type 'scheduler-secret' --tags 'skcsProject=ESEC-001-I5' 'source=generated-azure-only' 'rotation=coordinate-with-all-azure-scheduler-callers' --only-show-errors *> $null
        $secretSetExitCode = $LASTEXITCODE
        $ErrorActionPreference = $priorSecretErrorActionPreference
        if ($secretSetExitCode -eq 0) {
            $secretWritten = $true
            break
        }
        Start-Sleep -Seconds 10
    }

    if (-not $secretWritten) {
        throw 'Azure Key Vault cron-secret creation failed.'
    }

    Remove-SensitiveFile -Path $SecretFile

    [pscustomobject]@{
        Project = 'ESEC-001-I5'
        Mode = 'APPLY'
        SecretName = $SecretName
        Created = $true
        ExistingSecretOverwritten = $false
        SecretValuesDisplayed = $false
    } | ConvertTo-Json -Depth 4
}
finally {
    Remove-SensitiveFile -Path $SecretFile

    if ($TemporarySecretsOfficerCreated -and $VaultScope -and $CurrentPrincipalId) {
        $priorDeleteErrorActionPreference = $ErrorActionPreference
        $ErrorActionPreference = 'Continue'
        & az role assignment delete --assignee $CurrentPrincipalId --role $SecretsOfficerRole --scope $VaultScope --only-show-errors *> $null
        $roleDeleteExitCode = $LASTEXITCODE
        $ErrorActionPreference = $priorDeleteErrorActionPreference
        if ($roleDeleteExitCode -ne 0) {
            Write-Error 'Temporary Key Vault Secrets Officer cleanup failed; manual governance intervention required.'
        }
    }
}
