'use strict';

// Compatibility export. Canonical football market registry lives in lib/ so
// both Edge backend and Vercel serverless functions consume one source of truth.
module.exports=require('../../lib/footballMarketRegistry');
