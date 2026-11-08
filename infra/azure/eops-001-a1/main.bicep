targetScope = 'resourceGroup'

@description('Name of the existing Edge Container Apps environment.')
param environmentName string = 'cae-skcs-edge036-zan-001'

@description('Name of the existing Edge user-assigned managed identity.')
param identityName string = 'id-skcs-edge036-zan-001'

@description('Name of the existing ACR that will hold the bounded Edge canary image.')
param acrName string = 'acrskcsnscs020zan1'

@description('Resource group containing the existing ACR.')
param acrResourceGroupName string = 'rg-skcs-nscs-collector-zan-001'

@description('Container image tag produced by the separately governed Stage A build proof.')
param image string = '${acrName}.azurecr.io/skcs-edge:eops-a1-canary'

@description('Name of the proposed Stage A canary app. This template is not authorization to deploy it.')
param containerAppName string = 'ca-skcs-edge-a1-canary'

resource environment 'Microsoft.App/managedEnvironments@2024-03-01' existing = {
  name: environmentName
}

resource identity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' existing = {
  name: identityName
}

module acrPull 'acr-pull.bicep' = {
  name: 'eops-001-a1-acr-pull'
  scope: resourceGroup(acrResourceGroupName)
  params: {
    acrName: acrName
    principalId: identity.properties.principalId
  }
}

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
    }
    template: {
      containers: [
        {
          name: 'edge'
          image: image
          env: [
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
