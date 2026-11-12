'use strict';
const authenticate=require('../auth/me');
const {
 createEvidenceHandler,
 loadWebsiteSnapshotFromEnvironment,
 loadWebsiteSnapshotFromAzureBytes,
 load1X2ProbabilityProjectionFromEnvironment,
 attach1X2Probabilities
}=require('../../lib/nationsLeagueWebsiteSnapshot');
const {
 ACTIVE_PROJECTION_VERSION,
 MAX_PROJECTION_BYTES,
 validateMarketProjectionBytes,
 loadMarketProjectionFromEnvironment,
 loadMarketProjectionFromPrivateBlob,
 attachMarketProbabilities
}=require('../../lib/nationsLeagueMarketWebsiteProjection');
const {readPrivateBlob}=require('../../lib/azurePrivateBlob');

module.exports=createEvidenceHandler(authenticate,async()=>{
 const azureAccount=String(process.env.AZURE_EVIDENCE_STORAGE_ACCOUNT||'').trim();
 const azureContainer=String(process.env.AZURE_EVIDENCE_STORAGE_CONTAINER||'').trim();
 const azureWebsiteBlob=String(process.env.SOCCER_WEB_001_AZURE_BLOB||'').trim();
 const azureMarketBlob=String(process.env.SOCCER_MARKETS_001_AZURE_BLOB||'').trim();
 const azureConfigured=Boolean(azureAccount||azureContainer||azureWebsiteBlob||azureMarketBlob);

 if(azureConfigured&&(!azureAccount||!azureContainer||!azureWebsiteBlob||!azureMarketBlob)){
   throw new Error('Azure evidence transport configuration incomplete');
 }

 let snapshot;
 if(azureConfigured){
   const websiteBytes=await readPrivateBlob({
     account:azureAccount,
     container:azureContainer,
     blob:azureWebsiteBlob,
     maxBytes:131072
   });
   snapshot=loadWebsiteSnapshotFromAzureBytes(
     websiteBytes,
     process.env.SOCCER_WEB_001_AZURE_SHA256
   );
 }else{
   snapshot=loadWebsiteSnapshotFromEnvironment(process.env.SOCCER_WEB_001_SNAPSHOT_GZIP_BASE64);
   const probabilityConfig=process.env.SOCCER_WEB_001_1X2_JSON;
   if(probabilityConfig){
     snapshot=attach1X2Probabilities(
       snapshot,
       load1X2ProbabilityProjectionFromEnvironment(probabilityConfig)
     );
   }
 }

 let marketView=null;
 let transport=null;
 if(azureConfigured){
   const marketBytes=await readPrivateBlob({
     account:azureAccount,
     container:azureContainer,
     blob:azureMarketBlob,
     maxBytes:MAX_PROJECTION_BYTES
   });
   marketView=validateMarketProjectionBytes(marketBytes);
   if(marketView.v!==ACTIVE_PROJECTION_VERSION){
     throw new Error('Azure market projection is not active');
   }
   transport='AZURE_PRIVATE_BLOB_W7';
 }else if(process.env.BLOB_STORE_ID){
   try{
     marketView=await loadMarketProjectionFromPrivateBlob();
     transport='PRIVATE_BLOB_W7';
   }catch(error){
     const marketConfig=process.env.SOCCER_MARKETS_001_PROJECTION_GZIP_BASE64;
     if(!marketConfig)throw error;
     marketView=loadMarketProjectionFromEnvironment(marketConfig);
     transport='ENV_ROLLBACK';
   }
 }else{
   const marketConfig=process.env.SOCCER_MARKETS_001_PROJECTION_GZIP_BASE64;
   if(marketConfig){
     marketView=loadMarketProjectionFromEnvironment(marketConfig);
     transport='ENV_ROLLBACK';
   }
 }

 if(marketView){
   snapshot=attachMarketProbabilities(snapshot,marketView,transport);
 }
 return snapshot;
});
