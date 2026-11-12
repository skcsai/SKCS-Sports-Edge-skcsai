'use strict';
const {loadMarketProjectionFromEnvironment}=require('../../lib/nationsLeagueMarketWebsiteProjection');

module.exports=function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method!=='GET')return res.status(405).json({ok:false});
  try{
    const p=loadMarketProjectionFromEnvironment(process.env.SOCCER_MARKETS_001_PROJECTION_GZIP_BASE64);
    const turkey='CANARY:API_SPORTS_FOOTBALL:5:2026:1528958';
    return res.status(200).json({
      ok:true,
      version:p.v,
      fixture_count:Object.keys(p.f).length,
      source_hash:p.src,
      turkey_family_count:Object.keys(p.f[turkey]||{}).length
    });
  }catch(error){
    return res.status(503).json({ok:false,error:String(error&&error.message||'projection unavailable')});
  }
};
