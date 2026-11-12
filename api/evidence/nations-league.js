'use strict';
const authenticate=require('../auth/me');
const {createEvidenceHandler,loadWebsiteSnapshotFromEnvironment}=require('../../lib/nationsLeagueWebsiteSnapshot');
module.exports=createEvidenceHandler(authenticate,()=>loadWebsiteSnapshotFromEnvironment(process.env.SOCCER_WEB_001_SNAPSHOT_GZIP_BASE64));
