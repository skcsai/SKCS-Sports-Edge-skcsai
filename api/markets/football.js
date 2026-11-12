'use strict';

const {families,TABS,STATUS}=require('../../lib/footballMarketRegistry');

module.exports=function handler(req,res){
  res.setHeader('Cache-Control','public, max-age=300, stale-while-revalidate=3600');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method!=='GET'){
    res.setHeader('Allow','GET');
    return res.status(405).json({error:'Method not allowed'});
  }
  return res.status(200).json({
    schema_version:'soccer-markets-001-registry-v1',
    sport:'football',
    tabs:[
      {id:TABS.ONE_X_TWO,label:'1X2',order:1},
      {id:TABS.SECONDARY,label:'Secondary Outcomes',order:2},
      {id:TABS.SAME_MATCH,label:'Same Match Bet',order:3},
      {id:TABS.DOUBLE_CHANCE,label:'Double Chance & Combinations',order:4}
    ],
    statuses:STATUS,
    families:families.map(f=>({
      id:f.id,tab:f.tab,label:f.label,status:f.status,
      outcomes:f.outcomes||[],
      parameter_schema:f.parameter_schema||null,
      probability_semantics:f.probability_semantics,
      engine:f.engine,
      gate_family:f.gate_family
    }))
  });
};
