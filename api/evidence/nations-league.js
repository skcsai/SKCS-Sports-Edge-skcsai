'use strict';
const authenticate=require('../auth/me');
const {
 createEvidenceHandler,
 loadWebsiteSnapshotFromEnvironment,
 load1X2ProbabilityProjectionFromEnvironment,
 attach1X2Probabilities
}=require('../../lib/nationsLeagueWebsiteSnapshot');
module.exports=createEvidenceHandler(authenticate,()=>attach1X2Probabilities(
 loadWebsiteSnapshotFromEnvironment(process.env.SOCCER_WEB_001_SNAPSHOT_GZIP_BASE64),
 load1X2ProbabilityProjectionFromEnvironment(process.env.SOCCER_WEB_001_1X2_JSON)
));
