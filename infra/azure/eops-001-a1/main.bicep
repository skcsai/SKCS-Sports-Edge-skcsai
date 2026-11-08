targetScope = 'resourceGroup'

@description('Name of the existing Edge Container Apps environment.')
param environmentName string = 'cae-skcs-edge036-zan-001'

@description('Name of the existing Edge user-assigned managed identity.')
param identityName string = 'id-skcs-edge036-zan-001'

@description('Name of the existing Edge Key Vault.')
param keyVaultName string = 'kv-skcs-edge036-zan1'

@description('Name of the existing ACR that will hold the bounded Edge canary image.')
param acrName string = 'acrskcsnscs020zan1'

@description('Resource group containing the existing ACR.')
param acrResourceGroupName string = 'rg-skcs-nscs-collector-zan-001'

@description('Container image tag produced by the separately governed Stage A build proof.')
param image string = '${acrName}.azurecr.io/skcs-edge:eops-a1-canary'

@description('Name of the proposed Stage A canary app. This template is not authorization to deploy it.')
param containerAppName string = 'ca-skcs-edge-a1-canary'

@description('Enable production Key Vault secret bindings. False keeps the side-effect-free Stage A canary independent of unprovisioned secrets.')
param productionSecretsEnabled bool = false

@description('Versionless Key Vault secret names. Values are never embedded in this template.')
param databaseUrlSecretName string = 'database-url'
param supabaseUrlSecretName string = 'supabase-url'
param supabaseAnonKeySecretName string = 'supabase-anon-key'
param supabaseServiceRoleKeySecretName string = 'supabase-service-role-key'
param cronSecretName string = 'cron-secret'
param adminApiKeySecretName string = 'admin-api-key'
param apiSportsKeySecretName string = 'x-apisports-key'
param oddsApiKeySecretName string = 'odds-api-key'

resource environment 'Microsoft.App/managedEnvironments@2024-03-01' existing = {
  name: environmentName
}

resource identity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' existing = {
  name: identityName
}

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: keyVaultName
}

module acrPull 'acr-pull.bicep' = {
  name: 'eops-001-a1-acr-pull'
  scope: resourceGroup(acrResourceGroupName)
  params: {
    acrName: acrName
    principalId: identity.properties.principalId
  }
}

var productionSecrets = [
  {
    name: 'database-url'
    keyVaultUrl: '${keyVault.properties.vaultUri}secrets/${databaseUrlSecretName}'
    identity: identity.id
  }
  {
    name: 'supabase-url'
    keyVaultUrl: '${keyVault.properties.vaultUri}secrets/${supabaseUrlSecretName}'
    identity: identity.id
  }
  {
    name: 'supabase-anon-key'
    keyVaultUrl: '${keyVault.properties.vaultUri}secrets/${supabaseAnonKeySecretName}'
    identity: identity.id
  }
  {
    name: 'supabase-service-role-key'
    keyVaultUrl: '${keyVault.properties.vaultUri}secrets/${supabaseServiceRoleKeySecretName}'
    identity: identity.id
  }
  {
    name: 'cron-secret'
    keyVaultUrl: '${keyVault.properties.vaultUri}secrets/${cronSecretName}'
    identity: identity.id
  }
  {
    name: 'admin-api-key'
    keyVaultUrl: '${keyVault.properties.vaultUri}secrets/${adminApiKeySecretName}'
    identity: identity.id
  }
  {
    name: 'x-apisports-key'
    keyVaultUrl: '${keyVault.properties.vaultUri}secrets/${apiSportsKeySecretName}'
    identity: identity.id
  }
  {
    name: 'odds-api-key'
    keyVaultUrl: '${keyVault.properties.vaultUri}secrets/${oddsApiKeySecretName}'
    identity: identity.id
  }
]

var baseEnvironment = [
  {
    name: 'NODE_ENV'
    value: 'production'
  }
  {
    name: 'PORT'
    value: '8080'
  }
  {
    name: 'SKCS_STARTUP_MODE'
    value: 'canary'
  }
]

var productionSecretEnvironment = [
  {
    name: 'DATABASE_URL'
    secretRef: 'database-url'
  }
  {
    name: 'SUPABASE_URL'
    secretRef: 'supabase-url'
  }
  {
    name: 'SUPABASE_ANON_KEY'
    secretRef: 'supabase-anon-key'
  }
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY'
    secretRef: 'supabase-service-role-key'
  }
  {
    name: 'CRON_SECRET'
    secretRef: 'cron-secret'
  }
  {
    name: 'ADMIN_API_KEY'
    secretRef: 'admin-api-key'
  }
  {
    name: 'X_APISPORTS_KEY'
    secretRef: 'x-apisports-key'
  }
  {
    name: 'ODDS_API_KEY'
    secretRef: 'odds-api-key'
  }
]

resource canary 'Microsoft.App/containerApps@2024-03-01' = {
  name: containerAppName
  location: resourceGroup().location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${identity.id}': {}
    }
  }
  properties: {
    managedEnvironmentId: environment.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: 8080
        transport: 'auto'
        allowInsecure: false
      }
      registries: [
        {
          server: '${acrName}.azurecr.io'
          identity: identity.id
        }
      ]
      secrets: productionSecretsEnabled ? productionSecrets : []
    }
    template: {
      containers: [
        {
          name: 'edge'
          image: image
          env: concat(baseEnvironment, productionSecretsEnabled ? productionSecretEnvironment : [])
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/api/health'
                port: 8080
                scheme: 'HTTP'
              }
              initialDelaySeconds: 15
              periodSeconds: 30
              timeoutSeconds: 5
              failureThreshold: 3
            }
            {
              type: 'Readiness'
              httpGet: {
                path: '/api/health'
                port: 8080
                scheme: 'HTTP'
              }
              initialDelaySeconds: 5
              periodSeconds: 10
              timeoutSeconds: 5
              failureThreshold: 3
            }
          ]
        }
      ]
      scale: {
        minReplicas: 0
        maxReplicas: 1
        rules: [
          {
            name: 'http'
            http: {
              metadata: {
                concurrentRequests: '20'
              }
            }
          }
        ]
      }
    }
  }
  dependsOn: [
    acrPull
  ]
}

output proposedContainerAppId string = canary.id
output existingEnvironmentId string = environment.id
output existingIdentityId string = identity.id
output existingRegistryId string = acrPull.outputs.registryId
output existingKeyVaultId string = keyVault.id
output productionSecretsEnabled bool = productionSecretsEnabled
