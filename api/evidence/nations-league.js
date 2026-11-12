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
 attachMarketProbabilities
}=require('../../lib/nationsLeagueMarketWebsiteProjection');

module.exports=createEvidenceHandler(authenticate,()=>{
 let snapshot=loadWebsiteSnapshotFromEnvironment(process.env.SOCCER_WEB_001_SNAPSHOT_GZIP_BASE64);
 const probabilityConfig=process.env.SOCCER_WEB_001_1X2_JSON;
 if(probabilityConfig){
   snapshot=attach1X2Probabilities(snapshot,load1X2ProbabilityProjectionFromEnvironment(probabilityConfig));
 }
 const marketConfig=process.env.SOCCER_MARKETS_001_PROJECTION_GZIP_BASE64;
 if(marketConfig){
   snapshot=attachMarketProbabilities(snapshot,loadMarketProjectionFromEnvironment(marketConfig));
 }
 return snapshot;
});
