'use strict';

const {
  PROJECTION_HASH,
  SOURCE_EVIDENCE_HASH,
  loadMarketProjectionFromEnvironment
}=require('../../lib/nationsLeagueMarketWebsiteProjection');

module.exports=function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method!=='GET'){
    res.setHeader('Allow','GET');
    return res.status(405).json({error:'Method not allowed'});
  }
  try{
    const view=loadMarketProjectionFromEnvironment(process.env.SOCCER_MARKETS_001_PROJECTION_GZIP_BASE64);
    return res.status(200).json({
      ok:true,
      schema_version:view.v,
      fixture_count:Object.keys(view.f).length,
      source_evidence_sha256:SOURCE_EVIDENCE_HASH,
      projection_sha256:PROJECTION_HASH
    });
  }catch(error){
    console.error('[SOCCER-MARKETS-001] projection health failed:',error.message);
    return res.status(503).json({ok:false,error:'private_projection_unavailable'});
  }
};
