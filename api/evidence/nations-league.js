'use strict';
const authenticate=require('../auth/me');
const {
 createEvidenceHandler,
 loadWebsiteSnapshotFromEnvironment,
 load1X2ProbabilityProjectionFromEnvironment,
 attach1X2Probabilities
}=require('../../lib/nationsLeagueWebsiteSnapshot');
const {
 loadMarketProjectionFromEnvironment,
 loadMarketProjectionFromPrivateBlob,
 attachMarketProbabilities
}=require('../../lib/nationsLeagueMarketWebsiteProjection');

module.exports=createEvidenceHandler(authenticate,async()=>{
 let snapshot=loadWebsiteSnapshotFromEnvironment(process.env.SOCCER_WEB_001_SNAPSHOT_GZIP_BASE64);
 const probabilityConfig=process.env.SOCCER_WEB_001_1X2_JSON;
 if(probabilityConfig){
   snapshot=attach1X2Probabilities(snapshot,load1X2ProbabilityProjectionFromEnvironment(probabilityConfig));
 }

 let marketView=null;
 let transport=null;
 if(process.env.BLOB_STORE_ID){
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
