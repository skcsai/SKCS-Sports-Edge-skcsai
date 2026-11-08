param(
    [switch]$Apply
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$VaultName = 'kv-skcs-edge036-zan1'
$VercelTeam = 'team_Bqvh1YcUBj0NVvB1n0iDuIfx'
$VercelProject = 'prj_QfXfVUk9aiRhk3ljFWy8Kb4xFXkn'
$SecureRoot = Join-Path $env:LOCALAPPDATA 'SKCS\SecureTemp\ESEC-001-I4'
$EnvFile = Join-Path $SecureRoot 'vercel-production.env'
$SecretDir = Join-Path $SecureRoot 'secrets'
$ManifestFile = Join-Path $SecureRoot 'manifest.json'
$SecretsOfficerRole = 'Key Vault Secrets Officer'
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
                $stream = [System.IO.File]::Open($Path, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Write, [System.IO.FileShare]::None)
                try {
                    $buffer = New-Object byte[] ([Math]::Min([int64]65536, $length))
                    $remaining = $length
                    while ($remaining -gt 0) {
                        $count = [int][Math]::Min([int64]$buffer.Length, $remaining)
                        $stream.Write($buffer, 0, $count)
                        $remaining -= $count
                    }
                    $stream.Flush($true)
                } finally {
                    $stream.Dispose()
                }
            }
        }
    } catch {
        # Best-effort overwrite; deletion still follows.
    }
    Remove-Item -LiteralPath $Path -Force -ErrorAction SilentlyContinue
}

function Clear-SecureTemp {
    if (Test-Path -LiteralPath $SecretDir) {
        Get-ChildItem -LiteralPath $SecretDir -File -Force -ErrorAction SilentlyContinue | ForEach-Object {
            Remove-SensitiveFile -Path $_.FullName
        }
        Remove-Item -LiteralPath $SecretDir -Force -Recurse -ErrorAction SilentlyContinue
    }
    Remove-SensitiveFile -Path $EnvFile
    Remove-SensitiveFile -Path $ManifestFile
}

New-Item -ItemType Directory -Force -Path $SecureRoot | Out-Null
New-Item -ItemType Directory -Force -Path $SecretDir | Out-Null
Clear-SecureTemp
New-Item -ItemType Directory -Force -Path $SecretDir | Out-Null

try {
    if ($Apply) {
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
    }

    $priorErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    & vercel env pull $EnvFile --environment production --project $VercelProject --scope $VercelTeam -y --no-color *> $null
    $vercelExitCode = $LASTEXITCODE
    $ErrorActionPreference = $priorErrorActionPreference
    if ($vercelExitCode -ne 0 -or -not (Test-Path -LiteralPath $EnvFile)) {
        throw 'Vercel production environment pull failed.'
    }

    $extractor = @'
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envFile = process.argv[1];
const outDir = process.argv[2];
const manifestFile = process.argv[3];

const desired = [
  { env: 'DATABASE_URL', kv: 'database-url', contentType: 'postgres-connection-string' },
  { env: 'SUPABASE_URL', kv: 'supabase-url', contentType: 'service-url' },
  { env: 'SUPABASE_ANON_KEY', kv: 'supabase-anon-key', contentType: 'public-client-key' },
  { env: 'SUPABASE_SERVICE_ROLE_KEY', kv: 'supabase-service-role-key', contentType: 'privileged-server-key' },
  { env: 'ADMIN_API_KEY', kv: 'admin-api-key', contentType: 'operator-api-key' },
  { env: 'X_APISPORTS_KEY', kv: 'x-apisports-key', contentType: 'provider-api-key' },
  { env: 'ODDS_API_KEY', kv: 'odds-api-key', contentType: 'provider-api-key' },
  { env: 'CRON_SECRET', kv: 'cron-secret', contentType: 'scheduler-secret' },
  { env: 'SKCS_REFRESH_KEY', kv: 'skcs-refresh-key', contentType: 'operator-refresh-key' }
];

const parsed = dotenv.parse(fs.readFileSync(envFile));
const manifest = { generatedBy: 'ESEC-001-I4', items: [] };

for (const item of desired) {
  const value = Object.prototype.hasOwnProperty.call(parsed, item.env) ? parsed[item.env] : undefined;
  const isMissing = value === undefined || value === '';
  const isProviderProtected = value === '[SENSITIVE]';
  const status = isMissing ? 'BLOCKED_MISSING_SOURCE'
    : isProviderProtected ? 'BLOCKED_PROVIDER_NONEXPORTABLE'
    : 'READY_FOR_IMPORT';

  manifest.items.push({
    env: item.env,
    keyVaultName: item.kv,
    contentType: item.contentType,
    status
  });

  if (status === 'READY_FOR_IMPORT') {
    fs.writeFileSync(path.join(outDir, item.kv + '.secret'), value, { encoding: 'utf8', mode: 0o600 });
  }
}

fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2), { encoding: 'utf8', mode: 0o600 });
'@

    & node -e $extractor $EnvFile $SecretDir $ManifestFile
    if ($LASTEXITCODE -ne 0) {
        throw 'Secret extraction failed.'
    }

    $manifest = Get-Content -LiteralPath $ManifestFile -Raw | ConvertFrom-Json
    $ready = @($manifest.items | Where-Object { $_.status -eq 'READY_FOR_IMPORT' })
    $blocked = @($manifest.items | Where-Object { $_.status -ne 'READY_FOR_IMPORT' })

    if ($Apply) {
        foreach ($item in $ready) {
            $secretPath = Join-Path $SecretDir ($item.keyVaultName + '.secret')
            if (-not (Test-Path -LiteralPath $secretPath)) {
                throw ('Expected protected secret file missing for ' + $item.keyVaultName)
            }

            $secretWritten = $false
            for ($attempt = 1; $attempt -le 6; $attempt++) {
                $priorSecretErrorActionPreference = $ErrorActionPreference
                $ErrorActionPreference = 'Continue'
                & az keyvault secret set --vault-name $VaultName --name $item.keyVaultName --file $secretPath --encoding utf-8 --content-type $item.contentType --tags 'skcsProject=ESEC-001-I4' 'source=vercel-production' 'rotation=coordinate-before-source-retirement' --only-show-errors *> $null
                $secretSetExitCode = $LASTEXITCODE
                $ErrorActionPreference = $priorSecretErrorActionPreference
                if ($secretSetExitCode -eq 0) {
                    $secretWritten = $true
                    break
                }
                Start-Sleep -Seconds 10
            }

            if (-not $secretWritten) {
                throw ('Azure Key Vault import failed for ' + $item.keyVaultName)
            }

            Remove-SensitiveFile -Path $secretPath
        }
    }

    [pscustomobject]@{
        Project = 'ESEC-001-I4'
        Mode = $(if ($Apply) { 'APPLY' } else { 'DRY_RUN' })
        ReadyCount = $ready.Count
        BlockedCount = $blocked.Count
        ReadyNames = @($ready | ForEach-Object { $_.keyVaultName })
        Blocked = @($blocked | ForEach-Object {
            [pscustomobject]@{
                Name = $_.keyVaultName
                Status = $_.status
            }
        })
        SecretValuesDisplayed = $false
    } | ConvertTo-Json -Depth 5
}
finally {
    Clear-SecureTemp

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
