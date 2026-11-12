'use strict';

const crypto=require('node:crypto');
const {put}=require('@vercel/blob');
const {loadMarketProjectionFromPrivateBlob}=require('../../lib/nationsLeagueMarketWebsiteProjection');
const {
  loadWebsiteSnapshotFromEnvironment,
  load1X2ProbabilityProjectionFromEnvironment,
  attach1X2Probabilities
}=require('../../lib/nationsLeagueWebsiteSnapshot');
const {buildSameMatchOffers}=require('../../lib/sameMatchOfferEngine');

const PATH='soccer-markets-001/2026-11-12/w8.json';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');

function expand(groups){
  const out={};
  for(const [family,rows] of Object.entries(groups||{})){
    out[family]=rows.map(row=>({
      code:row[0],
      probability_pct:Number(row[1]),
      ...(row.length>2?{label:row[2]}:{})
    }));
  }
  return out;
}

module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(process.env.VERCEL_ENV!=='preview')return res.status(404).json({ok:false});
  if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({ok:false});}
  try{
    const source=await loadMarketProjectionFromPrivateBlob();
    if(source.v!=='SM001W7')throw new Error('W7 source required');
    let snapshot=loadWebsiteSnapshotFromEnvironment(process.env.SOCCER_WEB_001_SNAPSHOT_GZIP_BASE64);
    snapshot=attach1X2Probabilities(snapshot,load1X2ProbabilityProjectionFromEnvironment(process.env.SOCCER_WEB_001_1X2_JSON));
    const byId=Object.fromEntries(snapshot.fixtures.filter(x=>x.status==='SAVED_PREMATCH').map(x=>[x.fixture_id,x]));
    const now=Date.now();
    const s={};
    for(const [fixtureId,groups] of Object.entries(source.f||{})){
      const fixture=byId[fixtureId];
      if(!fixture)throw new Error('Missing fixture '+fixtureId);
      if(now>=Date.parse(fixture.kickoff_at)-60000)throw new Error('PREMATCH_CUTOFF_FAILED:'+fixtureId);
      s[fixtureId]=buildSameMatchOffers({
        market_probabilities:expand(groups),
        probabilities_pct:fixture.outcome_probabilities_pct,
        fixture:{home_team:fixture.home_team,away_team:fixture.away_team},
        h2h_matches:null,
        include_player_markets:false,
        max_legs_override:source.s?.[fixtureId]?.max_legs
      });
    }
    const view={v:'SM001W8',src:source.src,n:38,at:new Date().toISOString(),f:source.f,s};
    const raw=Buffer.from(JSON.stringify(view));
    const sha=hash(raw);
    const blob=await put(PATH,raw,{access:'private',addRandomSuffix:false,allowOverwrite:false,contentType:'application/json'});
    const distribution={};
    for(const x of Object.values(s))distribution[x.max_legs]=(distribution[x.max_legs]||0)+1;
    return res.status(200).json({
      ok:true,version:view.v,generated_at:view.at,fixture_count:Object.keys(s).length,
      projection_hash:sha,source_hash:view.src,pathname:blob.pathname||PATH,url:blob.url||null,
      max_legs_distribution:distribution
    });
  }catch(error){
    return res.status(503).json({ok:false,error:String(error&&error.message||error)});
  }
};
