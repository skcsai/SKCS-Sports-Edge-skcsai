// SKCS Contradiction Governance Module
// Ensures internal consistency across all market selections relative to Main 1X2 pick

/**
 * Contradiction mapping for Main 1X2 picks
 * Markets that contradict the main prediction and must be suppressed
 */
const CONTRADICT_MAP = {
  '1': ['X2', 'Away DNB', 'draw_or_away', 'away_win_either_half'],   // X2, Draw No Bet (Away), and related
  'X': ['12', 'no_draw'],                               // 12 (no draw), BTTS Yes (implies scoring)
  '2': ['1X', 'Home DNB', 'home_or_draw', 'home_win_either_half']    // 1X, Draw No Bet (Home), and related
};

/**
 * Double Chance compatibility mapping
 * Which DC outcomes are compatible with each Main pick
 */
const DC_COMPATIBILITY = {
  '1': ['1X', '12'],  // Main = Home: show Home/Draw and Home/Away
  'X': ['1X', 'X2'],  // Main = Draw: show Home/Draw and Draw/Away  
  '2': ['12', 'X2']   // Main = Away: show Home/Away and Draw/Away
};

/**
 * Draw No Bet classification
 * Maps DNB to corresponding DC outcomes
 */
const DNB_CLASSIFICATION = {
  'Home DNB': '1X',
  'Away DNB': 'X2',
  'dnb_home': '1X',
  'dnb_away': 'X2'
};

/**
 * Check if a market outcome is compatible with the Main 1X2 pick
 * @param {string} marketOutcome - The market outcome to check
 * @param {string} mainPick - The main 1X2 pick ('1', 'X', or '2')
 * @returns {boolean} True if compatible, false if contradictory
 */
function isCompatibleWithMain(marketOutcome, mainPick) {
  if (!mainPick || !marketOutcome) return true;
  
  const normalizedMarket = String(marketOutcome).toLowerCase().replace(/[\s_-]/g, '');
  const forbidden = CONTRADICT_MAP[mainPick] || [];
  
  // Check direct contradictions
  for (const forbiddenMarket of forbidden) {
    const normalizedForbidden = String(forbiddenMarket).toLowerCase().replace(/[\s_-]/g, '');
    if (normalizedMarket.includes(normalizedForbidden) || normalizedForbidden.includes(normalizedMarket)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Check if a Double Chance outcome is compatible with the Main pick
 * @param {string} dcOutcome - The Double Chance outcome (e.g., '1X', 'X2', '12')
 * @param {string} mainPick - The main 1X2 pick ('1', 'X', or '2')
 * @returns {boolean} True if compatible, false if contradictory
 */
function isDCCompatibleWithMain(dcOutcome, mainPick) {
  if (!mainPick || !dcOutcome) return true;
  
  const normalizedDC = String(dcOutcome).toUpperCase().replace(/[\s_-]/g, '');
  const compatibleDCs = DC_COMPATIBILITY[mainPick] || [];
  
  return compatibleDCs.includes(normalizedDC);
}

/**
 * Classify Draw No Bet markets to DC outcomes
 * @param {string} dnbMarket - The DNB market name
 * @returns {string|null} The corresponding DC outcome or null if not DNB
 */
function classifyDNBtoDC(dnbMarket) {
  if (!dnbMarket) return null;
  
  const normalized = String(dnbMarket).toLowerCase().replace(/[\s_-]/g, '');
  
  for (const [dnbType, dcOutcome] of Object.entries(DNB_CLASSIFICATION)) {
    const normalizedDNB = dnbType.toLowerCase().replace(/[\s_-]/g, '');
    if (normalized.includes(normalizedDNB) || normalizedDNB.includes(normalized)) {
      return dcOutcome;
    }
  }
  
  return null;
}

/**
 * Filter secondary markets to remove contradictions with Main pick
 * @param {Array} markets - Array of market objects {market, confidence, category}
 * @param {string} mainPick - The main 1X2 pick ('1', 'X', or '2')
 * @returns {Array} Filtered markets compatible with main pick
 */
function filterMarketsByMainPick(markets, mainPick) {
  if (!mainPick || !Array.isArray(markets)) return markets;
  
  return markets.filter(market => {
    const marketName = market.market || market.prediction || '';
    
    // Check direct contradiction
    if (!isCompatibleWithMain(marketName, mainPick)) {
      return false;
    }
    
    // Special handling for Double Chance markets
    if (isDoubleChanceMarket(marketName)) {
      const dcOutcome = extractDCOutcome(marketName);
      if (!isDCCompatibleWithMain(dcOutcome, mainPick)) {
        return false;
      }
    }
    
    // Special handling for Draw No Bet markets
    if (isDNBMarket(marketName)) {
      const dcOutcome = classifyDNBtoDC(marketName);
      if (dcOutcome && !isDCCompatibleWithMain(dcOutcome, mainPick)) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Check if a market is a Double Chance market
 * @param {string} marketName - The market name to check
 * @returns {boolean} True if it's a DC market
 */
function isDoubleChanceMarket(marketName) {
  if (!marketName) return false;
  
  const normalized = String(marketName).toLowerCase().replace(/[\s_-]/g, '');
  const dcPatterns = ['1x', 'x2', '12', 'doublechance', 'double_chance'];
  
  return dcPatterns.some(pattern => normalized.includes(pattern));
}

/**
 * Check if a market is a Draw No Bet market
 * @param {string} marketName - The market name to check
 * @returns {boolean} True if it's a DNB market
 */
function isDNBMarket(marketName) {
  if (!marketName) return false;
  
  const normalized = String(marketName).toLowerCase().replace(/[\s_-]/g, '');
  const dnbPatterns = ['dnb', 'drawnobet', 'draw_no_bet'];
  
  return dnbPatterns.some(pattern => normalized.includes(pattern));
}

/**
 * Extract Double Chance outcome from market name
 * @param {string} marketName - The market name
 * @returns {string} The DC outcome ('1X', 'X2', or '12')
 */
function extractDCOutcome(marketName) {
  if (!marketName) return null;
  
  const normalized = String(marketName).toUpperCase().replace(/[\s_-]/g, '');
  
  if (normalized.includes('1X')) return '1X';
  if (normalized.includes('X2')) return 'X2';
  if (normalized.includes('12')) return '12';
  
  return null;
}

/**
 * Get compatible Double Chance outcomes for a Main pick
 * @param {string} mainPick - The main 1X2 pick ('1', 'X', or '2')
 * @returns {Array} Array of compatible DC outcomes
 */
function getCompatibleDCOutcomes(mainPick) {
  return DC_COMPATIBILITY[mainPick] || [];
}

/**
 * Generate contradiction warning message (for speculative alternatives)
 * @param {string} marketName - The contradictory market
 * @param {string} mainPick - The main prediction
 * @returns {string} The warning message
 */
function getContradictionWarning(marketName, mainPick) {
  return `This alternative outcome (${marketName}) is opposite to the main prediction (${mainPick}) and should be considered speculative.`;
}

/**
 * Validate Same Match Builder legs for contradictions
 * @param {Array} legs - Array of SMB legs
 * @param {string} mainPick - The main 1X2 pick for the match
 * @returns {Object} {valid: boolean, legs: Array, removed: Array}
 */
function validateSMBCLegs(legs, mainPick) {
  if (!mainPick || !Array.isArray(legs)) {
    return { valid: true, legs: legs, removed: [] };
  }
  
  const validLegs = [];
  const removedLegs = [];
  
  for (const leg of legs) {
    const marketName = leg.market || leg.prediction || '';
    
    if (isCompatibleWithMain(marketName, mainPick)) {
      validLegs.push(leg);
    } else {
      removedLegs.push({
        ...leg,
        reason: 'Contradicts main prediction',
        warning: getContradictionWarning(marketName, mainPick)
      });
    }
  }
  
  return {
    valid: validLegs.length > 0,
    legs: validLegs,
    removed: removedLegs
  };
}

/**
 * Validate ACCA legs for contradictions within matches
 * @param {Array} accaLegs - Array of ACCA legs with match info
 * @returns {Object} {valid: boolean, legs: Array, removed: Array}
 */
function validateACCALegs(accaLegs) {
  const validLegs = [];
  const removedLegs = [];
  
  for (const leg of accaLegs) {
    const mainPick = leg.mainPick;
    const marketName = leg.market || leg.prediction || '';
    
    // Only check contradictions if we have a main pick for this match
    if (mainPick && !isCompatibleWithMain(marketName, mainPick)) {
      removedLegs.push({
        ...leg,
        reason: 'Contradicts main prediction in match',
        warning: getContradictionWarning(marketName, mainPick)
      });
    } else {
      validLegs.push(leg);
    }
  }
  
  return {
    valid: validLegs.length > 0,
    legs: validLegs,
    removed: removedLegs
  };
}

module.exports = {
  CONTRADICT_MAP,
  DC_COMPATIBILITY,
  DNB_CLASSIFICATION,
  isCompatibleWithMain,
  isDCCompatibleWithMain,
  classifyDNBtoDC,
  filterMarketsByMainPick,
  isDoubleChanceMarket,
  isDNBMarket,
  extractDCOutcome,
  getCompatibleDCOutcomes,
  getContradictionWarning,
  validateSMBCLegs,
  validateACCALegs
};
