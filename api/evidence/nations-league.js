'use strict';
const authenticate=require('../auth/me');
const {
 createEvidenceHandler,
 loadWebsiteSnapshotFromEnvironment,
 load1X2ProbabilityProjectionFromEnvironment,
 attach1X2Probabilities
}=require('../../lib/nationsLeagueWebsiteSnapshot');
module.exports=createEvidenceHandler(authenticate,()=>{
 const snapshot=loadWebsiteSnapshotFromEnvironment(process.env.SOCCER_WEB_001_SNAPSHOT_GZIP_BASE64);
 const probabilityConfig=process.env.SOCCER_WEB_001_1X2_JSON;
 return probabilityConfig?attach1X2Probabilities(snapshot,load1X2ProbabilityProjectionFromEnvironment(probabilityConfig)):snapshot;
});
