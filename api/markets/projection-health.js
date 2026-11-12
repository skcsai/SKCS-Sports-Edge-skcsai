'use strict';

const {
  loadMarketProjectionFromPrivateBlob,
  PROJECTION_HASH,
  SOURCE_EVIDENCE_HASH,
  ACTIVE_PROJECTION_VERSION
}=require('../../lib/nationsLeagueMarketWebsiteProjection');

module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');

  if(process.env.VERCEL_ENV!=='preview'){
    return res.status(404).json({ok:false});
  }
  if(req.method!=='GET'){
    res.setHeader('Allow','GET');
    return res.status(405).json({ok:false});
  }
  try{
    const projection=await loadMarketProjectionFromPrivateBlob();
    const fixtureId='CANARY:API_SPORTS_FOOTBALL:5:2026:1528958';
    return res.status(200).json({
      ok:true,
      version:projection.v,
      expected_version:ACTIVE_PROJECTION_VERSION,
      generated_at:projection.at,
      fixture_count:Object.keys(projection.f||{}).length,
      fixture_family_count:Object.keys(projection.f?.[fixtureId]||{}).length,
      projection_hash:PROJECTION_HASH,
      source_hash:SOURCE_EVIDENCE_HASH
    });
  }catch(_error){
    return res.status(503).json({ok:false,error:'projection unavailable'});
  }
};
