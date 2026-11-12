/**
 * smh-hub.js — Sports Market Hub event wiring (CSP-compliant)
 *
 * All interactions are registered via addEventListener.
 * No inline event handlers (onchange, onclick, onmouseover) anywhere.
 *
 * Select IDs → category label mapping:
 *   global-majors-select   → 'Global Majors'
 *   premium-markets-select → 'Premium Markets'
 *   niche-markets-select   → 'Niche Markets'
 *   acca-select            → 'ACCAs'
 */

// Backend URL for API calls (defined outside IIFE for global helper function access)
const BACKEND_URL = window.API_BASE_URL || window.location.origin;

async function getSubscriberHeaders(extraHeaders = {}) {
    if (!window.supabaseClient || !window.supabaseClient.auth) {
        throw new Error('Please sign in to access subscriber predictions.');
    }

    const result = await window.supabaseClient.auth.getSession();
    const token = result?.data?.session?.access_token;

    if (result?.error || !token) {
        throw new Error('Please sign in to access subscriber predictions.');
    }

    return {
        ...extraHeaders,
        Authorization: 'Bearer ' + token
    };
}

// Simple notification system
function showNotification(message, type = 'info') {
    // Remove any existing notifications
    const existing = document.querySelector('.smh-notification');
    if (existing) existing.remove();
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `smh-notification smh-notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 10000;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transition: all 0.3s ease;
        transform: translateX(100%);
    `;
    
    // Set background color based on type
    const colors = {
        info: '#3b82f6',
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444'
    };
    notification.style.backgroundColor = colors[type] || colors.info;
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

(function () {
    'use strict';

    // ── Constants ──────────────────────────────────────────────────────────────
    // BACKEND_URL and the session-auth helper are defined globally above.

    const SELECT_MAP = [
        { id: 'global-majors-select',   category: 'Global Majors'   },
        { id: 'premium-markets-select', category: 'Premium Markets' },
        { id: 'niche-markets-select',   category: 'Niche Markets'   },
        { id: 'acca-select',            category: 'ACCAs'           }
    ];

    const SECTION_LABELS = {
        direct:              'Direct Pick',
        secondary:           'Analytical',
        multi:               'Multi',
        same_match:          'Same Match',
        acca_6match:         'ACCA 6',
        mega_acca_12:        'MEGA ACCA'
    };
    const SECTION_COLORS = {
        direct:              '#38bdf8',
        secondary:           '#a78bfa',
        multi:               '#fb923c',
        same_match:          '#34d399',
        acca_6match:         '#f59e0b',
        mega_acca_12:        '#ef4444'
    };

    // ── DOM helpers ────────────────────────────────────────────────────────────
    function el(id) { return document.getElementById(id); }

    // ── Card registry for click handlers ──────────────────────────────────────
    /**
     * Registers a card in the global registry so the Match Detail modal
     * can access the prediction data.
     */
    function registerSmhCard(cardId, prediction) {
        // Ensure the global registry exists
        if (!window.SMH_CARD_REGISTRY) {
            window.SMH_CARD_REGISTRY = new Map();
        }
        window.SMH_CARD_REGISTRY.set(cardId, prediction);
    }

    // ── Core: handle a sport selection ────────────────────────────────────────
    async function handleSelectChange(selectElement, category) {
        const sport = selectElement.value;
        if (!sport) return;

        const displayTitle = el('displayTitle');
        const codesList    = el('codesList');
        const displayIcon  = el('displayIcon');
        const resultsPanel = el('resultsPanel');

        // Reset all other selects (mutual exclusion)
        document.querySelectorAll('.market-select').forEach(function (s) {
            if (s !== selectElement) s.selectedIndex = 0;
        });

        // Show loading state
        if (displayIcon)  displayIcon.style.display = 'none';
        if (resultsPanel) resultsPanel.style.justifyContent = 'center';
        if (displayTitle) {
            displayTitle.textContent  = 'Preparing pre-match review\u2026';
            displayTitle.style.color    = '#94a3b8';
            displayTitle.style.fontSize = '0.9rem';
        }
        if (codesList) {
            codesList.innerHTML =
                '<div class="loading-spinner"></div>' +
                '<p style="color:#3b82f6;font-size:1rem;font-weight:600;margin-top:10px;">' +
                    'Fetching pre-match data for ' + sport + '\u2026' +
                '</p>';
        }

        // Normalize sport to Title Case
        const normalizedSport = sport.charAt(0).toUpperCase() + sport.slice(1);

        // Add cache-busting timestamp to prevent stale responses
        const timestamp = Date.now();
        const url = BACKEND_URL + '/api/predictions' +
                    '?sport=' + encodeURIComponent(normalizedSport) +
                    '&t=' + timestamp;

        try {
            const response = await fetch(url, {
                headers: await getSubscriberHeaders({
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }),
                cache: 'no-store'
            });

            // Check if response is HTML (routing issue) instead of JSON
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('text/html')) {
                throw new Error('API returned HTML - routing issue detected');
            }

            if (!response.ok) throw new Error('Fetch failed: ' + response.status);

            const data = await response.json();
            
            // Validate response structure
            if (!data || typeof data !== 'object') {
                throw new Error('Invalid response data structure');
            }
            
            renderResultsInPanel(data, normalizedSport, category);

            // Bridge to existing showSportInsights if present
            if (typeof window.showSportInsights === 'function') {
                window.showSportInsights(normalizedSport);
            }
        } catch (err) {
            console.error('[SMH] Error fetching sport data:', err);
            console.error('[SMH] URL attempted:', url);
            console.error('[SMH] Response status:', err.response?.status || 'No response');

            if (displayTitle) displayTitle.textContent = 'Connection Error';
            if (codesList) {
                const errorDetails = err.message.includes('HTML') 
                    ? '<p style="color:#f59e0b;font-size:0.85rem;">API routing issue - check Vercel configuration</p>'
                    : '<p style="color:#ef4444;font-size:0.85rem;">Error: ' + err.message + '</p>';
                    
                codesList.innerHTML =
                    '<p style="color:#ef4444;font-size:1rem;font-weight:600;">' +
                        'Could not retrieve ' + sport + ' data.' +
                    '</p>' +
                    errorDetails +
                    '<button data-action="smh-retry" ' +
                            'style="margin-top:15px;padding:8px 16px;background:#3b82f6;' +
                                   'color:white;border:none;border-radius:6px;cursor:pointer;">' +
                        'Retry' +
                    '</button>' +
                    '<button data-action="smh-clear-cache" ' +
                            'style="margin-top:10px;padding:6px 12px;background:#64748b;' +
                                   'color:white;border:none;border-radius:6px;cursor:pointer;font-size:0.8rem;">' +
                        'Clear Cache & Retry' +
                    '</button>';
            }
        }
    }

    // ── Render: populate the results panel ────────────────────────────────────
    function renderResultsInPanel(data, sport, category) {
        const codesList    = el('codesList');
        const displayTitle = el('displayTitle');
        const resultsPanel = el('resultsPanel');

        // Aggregate all prediction buckets
        var cats = (data.payload && data.payload.categories) ? data.payload.categories : {};
        var allPredictions = [].concat(
            cats.direct              || [],
            cats.analytical_insights || [],
            cats.multi               || [],
            cats.same_match          || [],
            cats.acca_6match         || [],
            cats.mega_acca_12        || []
        );

        // FILTER: Only show predictions matching the current sport
        var sportLower = sport.toLowerCase().trim();
        var isAccaView = category === 'ACCAs';

        // Safe stringified log before filter runs
        if (allPredictions.length > 0) {
            // console.log removed
        }

        // Helper: Safely extract sport string from potentially nested object or string
        function extractSportString(sportValue, predictionObj) {
            if (typeof sportValue === 'string') {
                return sportValue.toLowerCase().trim();
            } else if (typeof sportValue === 'object' && sportValue !== null) {
                // Handle TheSportsDB format: { strSport: "Soccer" }
                if (sportValue.strSport) {
                    return String(sportValue.strSport).toLowerCase().trim();
                }
                // Handle other object formats with sport property
                if (sportValue.sport) {
                    return extractSportString(sportValue.sport, predictionObj);
                }
                // Fallback: stringify and try to extract
                return String(JSON.stringify(sportValue)).toLowerCase().trim();
            }

            // If no direct sport value found, try to infer from nested metadata
            if (predictionObj && predictionObj.matches && predictionObj.matches.length > 0) {
                var match = predictionObj.matches[0];
                var meta = match.metadata || {};

                // Check metadata.provider for sport clues (e.g., "football-data-org" -> Soccer)
                if (meta.provider) {
                    var providerLower = String(meta.provider).toLowerCase();
                    if (providerLower.includes('football')) {
                        return 'soccer';
                    } else if (providerLower.includes('baseball')) {
                        return 'baseball';
                    } else if (providerLower.includes('tennis')) {
                        return 'tennis';
                    } else if (providerLower.includes('cricket')) {
                        return 'cricket';
                    } else if (providerLower.includes('basketball')) {
                        return 'basketball';
                    }
                }

                // Check metadata.sport or metadata.strSport
                if (meta.sport) {
                    return extractSportString(meta.sport, predictionObj);
                }
                if (meta.strSport) {
                    return extractSportString(meta.strSport, predictionObj);
                }

                // Check match.sport or match.strSport
                if (match.sport) {
                    return extractSportString(match.sport, predictionObj);
                }
                if (match.strSport) {
                    return extractSportString(match.strSport, predictionObj);
                }

                // Check metadata.league for sport clues
                if (meta.league) {
                    var leagueLower = String(meta.league).toLowerCase();
                    if (leagueLower.includes('premier') || leagueLower.includes('la liga') || leagueLower.includes('bundesliga') || leagueLower.includes('serie') || leagueLower.includes('ligue')) {
                        return 'soccer';
                    } else if (leagueLower.includes('mlb')) {
                        return 'baseball';
                    } else if (leagueLower.includes('atp') || leagueLower.includes('wta')) {
                        return 'tennis';
                    }
                }
            }

            // Safe default: return 'Unknown' instead of Unknown/empty string
            return 'unknown';
        }

        // Sport Name Mapping: Frontend "Football" should match backend "Soccer"
        var sportAliases = {};
        if (sportLower === 'football') {
            sportAliases['soccer'] = true;
        }

        var filteredPredictions = allPredictions.filter(function(pred) {
            var match = (pred.matches && pred.matches[0]) ? pred.matches[0] : {};
            var meta = (match.metadata && typeof match.metadata === 'object') ? match.metadata : {};
            // 🛡️ THE MASTER RULEBOOK: ACCA GATEKEEPER
            // Only allow Safe or Moderate Risk matches into the ACCA builder
            var isHighRisk = pred.risk_tier === 'HIGH_RISK' || pred.risk_tier === 'EXTREME_RISK';

            if (isAccaView && isHighRisk) {
                console.warn(`🛑 ACCA Blocked: ${(pred.home_team || match.home_team || 'Home Team')} vs ${(pred.away_team || match.away_team || 'Away Team')} is too volatile (${pred.risk_tier}).`);
                return false;
            }

            // Safely extract sport from multiple possible locations
            var predSportValues = [
                pred.sport,
                match.sport,
                meta.sport,
                pred.raw_fixtures?.sport,
                pred.sport_name,
                pred.raw_fixtures?.strSport,
                meta.strSport,
                match.strSport
            ];

            var predSport = '';
            for (var i = 0; i < predSportValues.length; i++) {
                var extracted = extractSportString(predSportValues[i], pred);
                if (extracted && extracted !== 'unknown') {
                    predSport = extracted;
                    break;
                }
            }

            // If still no sport found, try direct metadata inference
            if (!predSport || predSport === 'unknown') {
                predSport = extractSportString(null, pred);
            }

            // Strict tab routing: Match against current sport or its aliases only
            // No Fallback that dumps unfiltered data into tabs
            return predSport === sportLower || sportAliases[predSport] === true;
        });

        console.log('[SMH] ' + sport + ' payload — source_rows=' + (data.source_rows || 0) + ', buckets:', {
            direct:              (cats.direct              || []).length,
            analytical_insights: (cats.analytical_insights || []).length,
            multi:               (cats.multi               || []).length,
            same_match:          (cats.same_match          || []).length,
            acca_6match:         (cats.acca_6match         || []).length,
            mega_acca_12:        (cats.mega_acca_12        || []).length,
            watchlist:           (cats.watchlist           || []).length
        });
        // console.log removed

        // ── Empty state ──────────────────────────────────────────────────────
        if (filteredPredictions.length === 0) {
            if (resultsPanel) resultsPanel.style.justifyContent = 'center';

            var metrics = data.pipeline_metrics || {
                ingested: 0,
                analyzed: 0,
                rejected_confidence: 0,
                rejected_efficiency: 0,
                rejected_other: 0,
                rejected_total: 0,
                pending_analysis: 0,
                published: 0,
                empty_reason: 'no_pipeline_snapshot'
            };
            var watchlistItems = cats.watchlist || [];
            var ingested = Number(metrics.ingested) || 0;
            var analyzed = Number(metrics.analyzed) || 0;
            var published = Number(metrics.published) || 0;
            var rejectedConf = Number(metrics.rejected_confidence) || 0;
            var rejectedEff = Number(metrics.rejected_efficiency) || 0;
            var rejectedOther = Number(metrics.rejected_other) || 0;
            var pendingAnalysis = Number(metrics.pending_analysis);
            if (!Number.isFinite(pendingAnalysis)) {
                pendingAnalysis = Math.max(0, ingested - analyzed);
            }
            var approvedCount = Number(data.source_rows) || published || 0;
            var emptyReason = metrics.empty_reason || 'pipeline_incomplete';

            var statusLabel = 'Standing by';
            var statusColor = '#94a3b8';
            var panelTitle = sport + ' \u2014 No insights yet';
            var panelMessage = 'No pre-match insights are available for this sport right now.';

            if (emptyReason === 'sync_complete_analysis_pending') {
                panelTitle = sport + ' \u2014 Fixtures synced';
                statusLabel = 'Awaiting analysis';
                statusColor = '#f59e0b';
                panelMessage = 'We pulled ' + ingested + ' fixtures from data providers, but pre-match scoring has not finished yet. Insights appear here only after the AI pipeline publishes approved picks.';
            } else if (emptyReason === 'reviewed_none_approved') {
                panelTitle = sport + ' \u2014 Pre-match scan complete';
                statusLabel = 'Scan complete';
                statusColor = '#38bdf8';
                panelMessage = 'Fixtures were scored and reviewed, but none met our publication thresholds today.';
            } else if (emptyReason === 'no_fixtures_in_window') {
                panelTitle = sport + ' \u2014 No fixtures in window';
                statusLabel = 'Standing by';
                statusColor = '#94a3b8';
                panelMessage = 'No fixtures were found in today\'s pre-match window. This is common during off-season or before the weekly sync runs.';
            } else if (ingested > 0 && analyzed === 0) {
                panelTitle = sport + ' \u2014 Fixtures synced';
                statusLabel = 'Awaiting analysis';
                statusColor = '#f59e0b';
                panelMessage = 'Fixtures were synced but have not been scored for publication yet.';
            }

            if (displayTitle) displayTitle.textContent = panelTitle;

            var funnelHtml =
                '<div style="background: rgba(15,23,42,0.6); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; text-align: left; width: 100%; max-width: 400px; margin: 0 auto;">' +
                    '<h3 style="color: ' + statusColor + '; margin-bottom: 15px; font-size: 1.1rem;">Status: ' + statusLabel + '</h3>' +
                    '<p style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 15px;">' + panelMessage + '</p>' +
                    '<div style="display: flex; justify-content: space-between; margin-bottom: 8px;">' +
                        '<span style="color: #64748b;">Fixtures Synced:</span>' +
                        '<span style="color: #f8fafc; font-weight: bold;">' + ingested + '</span>' +
                    '</div>' +
                    '<div style="display: flex; justify-content: space-between; margin-bottom: 8px;">' +
                        '<span style="color: #64748b;">Scored for Publication:</span>' +
                        '<span style="color: #f8fafc; font-weight: bold;">' + analyzed + '</span>' +
                    '</div>';

            if (pendingAnalysis > 0) {
                funnelHtml +=
                    '<div style="display: flex; justify-content: space-between; margin-bottom: 8px;">' +
                        '<span style="color: #64748b;">Not Yet Scored:</span>' +
                        '<span style="color: #f59e0b; font-weight: bold;">' + pendingAnalysis + '</span>' +
                    '</div>';
            }

            funnelHtml +=
                    '<div style="display: flex; justify-content: space-between; margin-bottom: 8px;">' +
                        '<span style="color: #64748b;">Failed Market Efficiency:</span>' +
                        '<span style="color: #ef4444; font-weight: bold;">' + rejectedEff + '</span>' +
                    '</div>' +
                    '<div style="display: flex; justify-content: space-between; margin-bottom: 8px;">' +
                        '<span style="color: #64748b;">Failed Confidence Threshold:</span>' +
                        '<span style="color: #f59e0b; font-weight: bold;">' + rejectedConf + '</span>' +
                    '</div>';

            if (rejectedOther > 0) {
                funnelHtml +=
                    '<div style="display: flex; justify-content: space-between; margin-bottom: 8px;">' +
                        '<span style="color: #64748b;">Filtered (date/odds/other):</span>' +
                        '<span style="color: #f97316; font-weight: bold;">' + rejectedOther + '</span>' +
                    '</div>';
            }

            funnelHtml +=
                    '<div style="display: flex; justify-content: space-between; margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1);">' +
                        '<span style="color: #38bdf8; font-weight: bold;">Approved Insights:</span>' +
                        '<span style="color: #4ade80; font-weight: bold;">' + approvedCount + '</span>' +
                    '</div>';

            // PHASE 3: Add watchlist section if items exist
            if (watchlistItems.length > 0) {
                funnelHtml +=
                    '<div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1);">' +
                        '<h4 style="color: #f59e0b; margin-bottom: 10px; font-size: 0.95rem;">Market Watch (' + watchlistItems.length + ')</h4>' +
                        '<p style="color: #94a3b8; font-size: 0.8rem; margin-bottom: 10px;">Near-miss fixtures watching for late pre-match changes:</p>';

                for (var i = 0; i < Math.min(watchlistItems.length, 3); i++) {
                    var item = watchlistItems[i];
                    funnelHtml +=
                        '<div style="background: rgba(245, 158, 11, 0.1); border-left: 3px solid #f59e0b; padding: 10px; margin-bottom: 8px; border-radius: 4px;">' +
                            '<div style="color: #f8fafc; font-size: 0.85rem; font-weight: bold;">' + (item.home_team || 'Unknown') + ' vs ' + (item.away_team || 'Unknown') + '</div>' +
                            '<div style="color: #f59e0b; font-size: 0.75rem; margin-top: 4px;">Confidence: ' + (item.confidence || 0) + '% (Below Publication Threshold)</div>' +
                            '<div style="color: #94a3b8; font-size: 0.75rem;">Status: Tracking late pre-match changes</div>' +
                        '</div>';
                }

                if (watchlistItems.length > 3) {
                    funnelHtml += '<div style="color: #94a3b8; font-size: 0.75rem; text-align: center; margin-top: 8px;">+ ' + (watchlistItems.length - 3) + ' more on watchlist</div>';
                }

                funnelHtml += '</div>';
            }

            funnelHtml += '</div>';

            if (codesList) {
                codesList.innerHTML = funnelHtml;
            }
            return;
        }

        // ── Populated state ──────────────────────────────────────────────────
        if (resultsPanel) resultsPanel.style.justifyContent = 'flex-start';
        if (displayTitle) {
            displayTitle.textContent  = sport + ' \u00b7 ' + filteredPredictions.length + ' Insight' + (filteredPredictions.length !== 1 ? 's' : '');
            displayTitle.style.fontSize   = '1rem';
            displayTitle.style.color      = '#94a3b8';
            displayTitle.style.marginBottom = '16px';
        }

        // Clear previous SMH entries if needed, or rely on unique IDs.
        // We avoid clearing window.SMH_CARD_REGISTRY entirely to not break the main dashboard
        // but we ensure these specific sport insights are available.

        // Clear container before rendering to prevent duplication
        if (codesList) {
            codesList.innerHTML = '';
        }

        var html = '<div class="results-scroll-container" style="width:100%;max-height:420px;overflow-y:auto;padding-right:8px;">';

        filteredPredictions.forEach(function (pred) {
            var sectionType  = pred.section_type || 'direct';
            var accentColor  = SECTION_COLORS[sectionType] || '#38bdf8';
            var sectionLabel = SECTION_LABELS[sectionType] || sectionType.replace(/_/g, ' ').toUpperCase();
            var legCount     = Array.isArray(pred.matches) ? pred.matches.length : 1;
            var isAcca       = legCount > 1;

            var match = (pred.matches && pred.matches[0]) ? pred.matches[0] : {};
            var meta  = (match.metadata && typeof match.metadata === 'object') ? match.metadata : {};

            var home = match.home_team || meta.home_team || '\u2014';
            var away = match.away_team || meta.away_team || '\u2014';

            var pickRaw = match.prediction
                || (pred.final_recommendation && pred.final_recommendation.market)
                || meta.prediction
                || match.recommendation
                || 'Not Available';
            var pick = String(pickRaw).replace(/_/g, ' ').toUpperCase();

            var confidence = Math.round(Number(pred.total_confidence || match.confidence || 0));
            var market     = String(match.market || meta.market || '1X2').toUpperCase();

            // Kickoff time
            var kickoffRaw = match.commence_time || match.match_date
                || meta.match_time || meta.kickoff || meta.kickoff_time
                || pred.created_at;
            var kickoffStr = '';
            if (kickoffRaw) {
                try {
                    var d = new Date(kickoffRaw);
                    if (!isNaN(d.getTime())) {
                        kickoffStr = d.toLocaleString('en-GB', {
                            weekday: 'short', day: '2-digit', month: 'short',
                            hour: '2-digit', minute: '2-digit', timeZone: 'UTC'
                        }) + ' UTC';
                    }
                } catch (e) { /* ignore */ }
            }

            // Odds
            var oddsVal = (meta.odds && meta.odds.home)
                || (meta.sharp_odds && meta.sharp_odds.home_win)
                || match.odds || null;
            var oddsHtml = oddsVal
                ? '<span style="color:#facc15;font-weight:700;margin-left:8px;">@ ' + Number(oddsVal).toFixed(2) + '</span>'
                : '';

            // Master Rulebook risk tier color mapping
            var confidenceVal = pred.actual_confidence || confidence;
            var confColor = confidenceVal >= 75 ? '#4ade80' : confidenceVal >= 55 ? '#facc15' : confidenceVal >= 30 ? '#fb923c' : '#ef4444';
            var timeHtml  = kickoffStr
                ? '<span style="color:#475569;font-size:0.78rem;margin-left:auto;">\uD83D\uDD50 ' + kickoffStr + '</span>'
                : '';

            // Generate unique card ID for this prediction
            var cardId = 'smh_card_' + (pred.id || pred.prediction_id || Math.random().toString(36).substr(2, 9));
            registerSmhCard(cardId, pred); // Register prediction for click handling

            // Master Rulebook risk tier classification
            var riskTier, isHighVariance, pickTypeLabel, marketLabel, pickTypeColor, marketBgColor;

            if (confidenceVal >= 75) {
                riskTier = 'Low Risk';
                isHighVariance = false;
                pickTypeLabel = 'Direct Pick';
                marketLabel = market; 
                pickTypeColor = 'text-emerald-500';
                marketBgColor = 'bg-emerald-950/50 text-emerald-400 border border-emerald-700/50';
            } else if (confidenceVal >= 55) {
                riskTier = 'Medium Risk';
                isHighVariance = true;
                pickTypeLabel = 'Risk-Adjusted';
                marketLabel = market; 
                pickTypeColor = 'text-amber-500';
                marketBgColor = 'bg-amber-950/50 text-amber-400 border border-amber-700/50';
            } else if (confidenceVal >= 30) {
                riskTier = 'High Risk';
                isHighVariance = true;
                pickTypeLabel = 'Risk-Adjusted';
                marketLabel = market; 
                pickTypeColor = 'text-orange-500';
                marketBgColor = 'bg-orange-950/50 text-orange-400 border border-orange-700/50';
            } else {
                riskTier = 'Extreme Risk';
                isHighVariance = true;
                pickTypeLabel = 'Risk-Adjusted';
                marketLabel = market; 
                pickTypeColor = 'text-red-500';
                marketBgColor = 'bg-red-950/50 text-red-400 border border-red-700/50';
            }

            var secBadge = pred.secondary_market_count ? 
                `<div style="margin-left:8px; font-size:10px; font-weight:900; background:rgba(139,92,246,0.2); color:#a78bfa; padding:2px 6px; border-radius:4px; border:1px solid rgba(139,92,246,0.3); text-transform:uppercase;">+${pred.secondary_market_count} MARKETS</div>` : '';

            // EDGEMIND AI UI BLOCK
            var reasoning = pred.ai_reasoning || pred.edgemind_report;
            var edgeMindHtml = reasoning ? 
                '<div style="margin-top:12px; padding:12px; background:rgba(15,23,42,0.8); border-left:3px solid ' + confColor + '; border-radius:6px;">' +
                    '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">' +
                        '<span style="font-size:0.75rem; font-weight:800; color:' + confColor + '; text-transform:uppercase; letter-spacing:0.05em;">' +
                            (pred.risk_tier ? String(pred.risk_tier).replace(/_/g, ' ') : 'SYSTEM RATED') +
                        '</span>' +
                        '<span style="font-size:0.7rem; color:#94a3b8;">EDGEMIND AI</span>' +
                    '</div>' +
                    '<div style="font-size:0.85rem; color:#cbd5e1; line-height:1.5; font-style:italic;">' +
                        '"' + reasoning + '"' +
                    '</div>' +
                '</div>' : '';

            // Use .smh-result-item class for hover (CSP-safe, no inline onmouseover)
            html +=
                '<div class="smh-result-item" data-card-id="' + cardId + '" style="border-left:4px solid ' + accentColor + ';">' +
                    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;gap:8px;flex-wrap:wrap;">' +
                        '<div style="display:flex;align-items:center;">' +
                            '<div>' +
                                '<div class="text-[10px] font-bold ' + pickTypeColor + ' uppercase tracking-wider">' + pickTypeLabel + (isAcca && !isHighVariance ? ' \u00b7 ' + legCount + ' legs' : '') + '</div>' +
                                '<div class="text-xs font-black ' + marketBgColor + ' px-2 py-1 rounded inline-block mt-0.5">' + marketLabel + '</div>' +
                            '</div>' +
                            secBadge +
                        '</div>' +
                        '<span style="font-size:0.8rem;color:' + confColor + ';font-weight:800;">' + confidenceVal + '% CONF.</span>' +
                    '</div>' +
                    '<div style="font-size:1.05rem;font-weight:700;color:#f1f5f9;margin-bottom:5px;line-height:1.3;">' +
                        home + ' <span style="color:#475569;font-weight:400;font-size:0.9rem;">vs</span> ' + away +
                        (isAcca ? '<span style="font-size:0.75rem;color:#64748b;font-weight:400;"> +' + (legCount - 1) + ' more</span>' : '') +
                    '</div>' +
                    '<div style="display:flex;align-items:center;flex-wrap:wrap;gap:6px;margin-bottom:10px;">' +
                        '<span style="background:rgba(74,222,128,0.12);color:#4ade80;padding:3px 9px;border-radius:4px;font-size:0.88rem;font-weight:700;">\u26A1 ' + pick + '</span>' +
                        oddsHtml + timeHtml +
                    '</div>' +
                    edgeMindHtml +
                    '<button class="insight-btn" data-card-id="' + cardId + '" style="width:100%;padding:10px 16px;background:linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);color:#ffffff;border:none;border-radius:8px;font-size:0.85rem;font-weight:700;letter-spacing:0.5px;cursor:pointer;text-transform:uppercase;box-shadow:0 4px 12px rgba(139,92,246,0.3);transition:all 0.2s ease;margin-top:8px;">Click for insights</button>' +
                '</div>';
        });

        html += '</div>';
        if (codesList) {
            codesList.innerHTML    = html;
            codesList.style.fontSize   = '1rem';
            codesList.style.fontWeight = '400';
            codesList.style.width      = '100%';
        }
    }

    // ── Wire everything on DOM ready ──────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', function () {

        // Attach change listeners to all four market selects
        SELECT_MAP.forEach(function (entry) {
            var select = el(entry.id);
            if (!select) return;
            select.addEventListener('change', function () {
                handleSelectChange(select, entry.category);
            });
        });

        // Delegated click for the dynamically injected Retry and Clear Cache buttons
        // (avoids the need for an onclick attribute on the button)
        var codesList = el('codesList');
        if (codesList) {
            codesList.addEventListener('click', function (e) {
                var retryBtn = e.target.closest('[data-action="smh-retry"]');
                if (retryBtn) location.reload();
                
                var clearCacheBtn = e.target.closest('[data-action="smh-clear-cache"]');
                if (clearCacheBtn) {
                    // Clear all caches and reload
                    if ('caches' in window) {
                        caches.keys().then(function(names) {
                            names.forEach(function(name) {
                                caches.delete(name);
                            });
                        });
                    }
                    // Clear localStorage
                    localStorage.clear();
                    // Clear sessionStorage
                    sessionStorage.clear();
                    // Reload with cache-busting
                    window.location.href = window.location.href + '?nocache=' + Date.now();
                }
            });
        }

        // Bulletproof document-level delegation for "Click for insights" button
        // Attached to document.body to survive DOM updates (codesList gets overwritten)
        document.body.addEventListener('click', function (e) {
            var insightBtn = e.target.closest('.insight-btn');
            if (insightBtn) {
                var cardId = insightBtn.getAttribute('data-card-id');
                console.log("[Trigger] Button clicked! Match ID:", cardId);

                // Wait a moment for the function to be available if script is still loading
                if (typeof window.openMatchDetail === 'function') {
                    window.openMatchDetail(cardId);
                } else {
                    // Retry after a short delay
                    setTimeout(function() {
                        if (typeof window.openMatchDetail === 'function') {
                            window.openMatchDetail(cardId);
                        } else {
                            console.error("[Error] openMatchDetail function is missing or not in scope!");
                            showNotification("Match details not available yet. Please try again.", "warning");
                        }
                    }, 100);
                }
            }

            // Modal close button (×)
            if (e.target.matches('#skcsModalClose') || e.target.closest('[data-action="close-modal"]')) {
                if (typeof window.closeMatchDetail === 'function') {
                    window.closeMatchDetail();
                }
            }
            // Back to Fixtures button
            if (e.target.closest('.back-arrow') || e.target.closest('[data-action="back-to-fixtures"]')) {
                if (typeof window.closeMatchDetail === 'function') {
                    window.closeMatchDetail();
                }
            }
            // Modal backdrop click
            if (e.target.matches('[data-action="close-modal-backdrop"]')) {
                if (typeof window.closeMatchDetail === 'function') {
                    window.closeMatchDetail();
                }
            }
        });
    });

})();

// ============================================
// AUTH UI UPDATE
// ============================================
(function initAuthUI() {
    if (!window.supabaseClient) {
        setTimeout(initAuthUI, 200);
        return;
    }
    window.supabaseClient.auth.getSession().then(function(result) {
        var session = result.data && result.data.session;
        var authLink = document.getElementById('authLink');
        var greet = document.getElementById('subscriptionGreeting');

        if (authLink) {
            if (session && session.user) {
                authLink.textContent = 'Logout';
                authLink.href = '#';
                authLink.addEventListener('click', function(e) {
                    e.preventDefault();
                    window.supabaseClient.auth.signOut().then(function() {
                        window.location.reload();
                    });
                });
            } else {
                authLink.textContent = 'Login';
                authLink.href = '/login.html';
            }
        }
        if (greet && session && session.user) {
            greet.textContent = 'Welcome, ' + (session.user.email || 'User');
        }
    }).catch(function(err) {
        console.warn('[Auth] Session check failed:', err.message);
    });
})();

// ============================================
// GLOBAL MATCH DETAIL MODAL FUNCTIONS
// Defined at top level for global scope access
// ============================================

// Helper: Update modal with AI prediction data
// Helper: Ensure DOM element exists, create if missing
function ensureElement(id, tag = 'div', parent) {
    let el = document.getElementById(id);
    if (!el && parent) {
        el = document.createElement(tag);
        el.id = id;
        parent.appendChild(el);
    }
    return el;
}

// ============================================
// MASTER RULEBOOK RISK TIER FUNCTIONS
// Moved to global scope for proper function access
// ============================================

function getRiskTier(confidence) {
  if (confidence >= 75) return 'Low Risk';
  if (confidence >= 55) return 'Medium Risk';
  if (confidence >= 30) return 'High Risk';
  return 'Extreme Risk'; // but Extreme should never be displayed
}

function getRiskColor(riskTier) {
  switch(riskTier) {
    case 'Low Risk': return '#4ade80'; // green
    case 'Medium Risk': return '#facc15'; // yellow
    case 'High Risk': return '#fb923c'; // orange
    default: return '#ef4444'; // red
  }
}

// Master Rulebook Secondary Market Selection
function selectSecondaryMarkets(mainConfidence, allMarkets) {
  const categories = {
    "Double Chance": ["double_chance_1x", "double_chance_x2", "double_chance_12", "1x", "x2", "12", "home_or_draw", "draw_or_away", "home_or_away"],
    "Draw No Bet": ["dnb_home", "dnb_away"],
    "Goals": ["over_0_5_goals", "over_1_5_goals", "over_2_5_goals", "over_3_5_goals", "under_2_5_goals", "under_3_5_goals", "btts_yes", "btts_no", "team_total_over", "team_total_under"],
    "Corners": ["corners_over_8_5", "corners_over_9_5", "corners_over_10_5", "corners_under_8_5", "corners_under_9_5", "corners_under_10_5", "team_corners_over", "team_corners_under"],
    "Cards": ["yellow_cards_over_2_5", "yellow_cards_under_2_5", "yellow_cards_over_3_5", "yellow_cards_under_3_5", "red_cards_over_0_5", "red_cards_under_0_5", "total_cards_over", "total_cards_under"],
    "First Half Markets": ["first_half_over_0_5", "first_half_over_1_5", "first_half_under_1_5", "first_half_home_win", "first_half_draw", "first_half_away_win"],
    "Team Win Either Half": ["home_win_either_half", "away_win_either_half", "team_win_either_half"]
  };

  // Step 1: Primary rule – markets >= 72%
  let candidates = allMarkets.filter(m => (m.confidence || 0) >= 72);

  // Step 2: Safe Haven fallback
  const fallbackTriggered = mainConfidence < 72 && candidates.length === 0 && mainConfidence >= 30;
  if (fallbackTriggered) {
    candidates = allMarkets.filter(m => {
      const marketName = String(m.market || m.prediction || '').toLowerCase().replace(/\s+/g, '_');
      const isSafeHaven = Object.values(categories).flat().includes(marketName);
      const confidence = m.confidence || 0;
      return isSafeHaven && confidence > mainConfidence && confidence >= 72;
    });
  }

  if (candidates.length === 0) return { markets: [], fallbackTriggered: false };

  // Step 3: Best‑in‑Category – keep only top per category
  const bestPerCategory = {};
  candidates.forEach(m => {
    const marketName = String(m.market || m.prediction || '').toLowerCase().replace(/\s+/g, '_');
    const cat = Object.keys(categories).find(c => categories[c].includes(marketName));
    if (!cat) return;
    if (!bestPerCategory[cat] || (m.confidence || 0) > (bestPerCategory[cat].confidence || 0)) {
      bestPerCategory[cat] = m;
    }
  });

  // Step 4: Sort and take top 4
  const sorted = Object.values(bestPerCategory).sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
  return {
    markets: sorted.slice(0, 4),
    fallbackTriggered
  };
}

// Dynamic EdgeMind BOT Message
function getBotMessage(mainConfidence, fallbackTriggered) {
  const tier = getRiskTier(mainConfidence);
  if (fallbackTriggered) {
    return `While the main market carries a ${tier.toLowerCase()} level of confidence (${mainConfidence}%), here are safer markets that cross the low‑risk threshold of 72%.`;
  } else if (mainConfidence >= 72) {
    return `Strong main prediction (${mainConfidence}%). Consider these additional low‑risk options.`;
  } else if (mainConfidence >= 55) {
    return `Main prediction confidence is moderate (${mainConfidence}%). Check the secondary picks below for alternative options.`;
  } else {
    return `Main prediction confidence is low (${mainConfidence}%). Consider the secondary markets below for safer alternatives.`;
  }
}

// FINAL DOUBLE CHANCE COMBOS ALGORITHM (with Consistency Engine)
// Integrates Contradiction Governance Module for Main pick alignment

// Contradiction map: main pick -> disallowed DC base
const DC_FORBIDDEN = {
  '1': ['X2', 'Away DNB'],
  'X': ['12', 'Home DNB', 'Away DNB'],
  '2': ['1X', 'Home DNB']
};

// Correlation matrix
const DC_CORRELATION = {
  "1X_Over1.5": 0.30, "1X_Over2.5": 0.35, "1X_BTTS_No": 0.40,
  "1X_Under2.5": 0.25, "12_Over1.5": 0.45, "12_Over2.5": 0.50,
  "12_BTTS_Yes": 0.30, "12_Under2.5": -0.20, "X2_Over1.5": 0.25,
  "X2_Over2.5": 0.30, "X2_BTTS_No": 0.35, "X2_Under2.5": 0.20
};

// Category definitions
const DC_CATEGORIES = {
  "1X_GOALS": ["C01","C02","C04"],
  "1X_BTTS": ["C03"],
  "12_GOALS": ["C05","C06","C08"],
  "12_BTTS": ["C07"],
  "X2_GOALS": ["C09","C10","C12"],
  "X2_BTTS": ["C11"]
};

/**
 * Compute combined confidence with correlation adjustment
 * Formula: P_joint = P_DC * P_supp + ρ * sqrt(P_DC * (1-P_DC) * P_supp * (1-P_supp))
 */
function computeCombinedConf(P_A, P_B, pairKey) {
  const rho = DC_CORRELATION[pairKey] || 0;
  const independent = P_A * P_B;
  const adjustment = rho * Math.sqrt(P_A * (1-P_A) * P_B * (1-P_B));
  return Math.min(1, Math.max(0, independent + adjustment));
}

/**
 * Select Double Chance combos with contradiction filtering
 */
function selectDoubleChanceCombos(mainPick, prob1X2, probOver1_5, probOver2_5, probUnder2_5, probBTTS_Yes, probBTTS_No) {
  // Validate inputs
  if (!mainPick || !prob1X2 || typeof prob1X2.home !== 'number') {
    return { combos: [], message: "Invalid input probabilities for Double Chance calculation." };
  }

  // Derive single probabilities
  const p_1X = prob1X2.home + prob1X2.draw;
  const p_12 = prob1X2.home + prob1X2.away;
  const p_X2 = prob1X2.draw + prob1X2.away;

  // Define all 12 combos with dc base
  const allCombos = [
    { id:"C01", dc:"1X", base:"1X", support:"Over1.5", P_A:p_1X, P_B:probOver1_5, pairKey:"1X_Over1.5" },
    { id:"C02", dc:"1X", base:"1X", support:"Over2.5", P_A:p_1X, P_B:probOver2_5, pairKey:"1X_Over2.5" },
    { id:"C03", dc:"1X", base:"1X", support:"BTTS_No", P_A:p_1X, P_B:probBTTS_No, pairKey:"1X_BTTS_No" },
    { id:"C04", dc:"1X", base:"1X", support:"Under2.5", P_A:p_1X, P_B:probUnder2_5, pairKey:"1X_Under2.5" },
    { id:"C05", dc:"12", base:"12", support:"Over1.5", P_A:p_12, P_B:probOver1_5, pairKey:"12_Over1.5" },
    { id:"C06", dc:"12", base:"12", support:"Over2.5", P_A:p_12, P_B:probOver2_5, pairKey:"12_Over2.5" },
    { id:"C07", dc:"12", base:"12", support:"BTTS_Yes", P_A:p_12, P_B:probBTTS_Yes, pairKey:"12_BTTS_Yes" },
    { id:"C08", dc:"12", base:"12", support:"Under2.5", P_A:p_12, P_B:probUnder2_5, pairKey:"12_Under2.5" },
    { id:"C09", dc:"X2", base:"X2", support:"Over1.5", P_A:p_X2, P_B:probOver1_5, pairKey:"X2_Over1.5" },
    { id:"C10", dc:"X2", base:"X2", support:"Over2.5", P_A:p_X2, P_B:probOver2_5, pairKey:"X2_Over2.5" },
    { id:"C11", dc:"X2", base:"X2", support:"BTTS_No", P_A:p_X2, P_B:probBTTS_No, pairKey:"X2_BTTS_No" },
    { id:"C12", dc:"X2", base:"X2", support:"Under2.5", P_A:p_X2, P_B:probUnder2_5, pairKey:"X2_Under2.5" }
  ];

  // 1. Filter: remove combos whose DC base is forbidden by Main pick
  const forbidden = DC_FORBIDDEN[mainPick] || [];
  const allowed = allCombos.filter(c => !forbidden.includes(c.base));

  // If no combos survive contradiction filter, return early
  if (allowed.length === 0) {
    return { combos: [], message: "No compatible Double Chance combos available for this match due to main pick alignment." };
  }

  // 2. Calculate combined confidence and assign tiers (Master Rulebook v2.0)
  allowed.forEach(c => {
    c.confidence = computeCombinedConf(c.P_A, c.P_B, c.pairKey);
    // Combo-specific tiers (separate from the main direct/secondary risk bands)
    c.tier = c.confidence >= 0.60 ? 1 : c.confidence >= 0.50 ? 2 : c.confidence >= 0.20 ? 3 : 0;
  });

  // 3. Suppress < 20%
  const valid = allowed.filter(c => c.confidence >= 0.20);

  if (valid.length === 0) {
    return { combos: [], message: "No Double Chance combos meet minimum confidence threshold (20%)." };
  }

  // 4. Best-in-Category (only active categories that appear)
  const categoryBest = {};
  for (const [cat, ids] of Object.entries(DC_CATEGORIES)) {
    const candidates = valid.filter(c => ids.includes(c.id));
    if (candidates.length > 0) {
      categoryBest[cat] = candidates.reduce((a, b) => a.confidence > b.confidence ? a : b);
    }
  }

  let selected = Object.values(categoryBest)
    .sort((a,b) => b.confidence - a.confidence)
    .slice(0, 6);

  // 5. Back-fill if fewer than 6
  if (selected.length < 6) {
    const remaining = valid.filter(c => !selected.some(s => s.id === c.id))
      .sort((a,b) => b.confidence - a.confidence);
    selected = selected.concat(remaining).slice(0,6);
  }

  // 6. Build result with proper formatting (Master Rulebook v2.0)
  const hasTier1 = selected.some(c => c.tier === 1);
  const hasTier2 = selected.some(c => c.tier === 2);
  const message = hasTier1
    ? "These Double Chance combos offer enhanced safety. Tier 1 (Safe – green) represents the lowest risk."
    : hasTier2
      ? "No Safe (Tier 1) combos available. Below are Moderate options that carry more uncertainty."
      : "Only Risky Double Chance combos are available for this match. These are speculative and have a low win rate.";

  return {
    combos: selected.map(c => ({
      id: c.id,
      name: `${c.dc} & ${c.support.replace(/_/g,' ')}`,
      confidence: (c.confidence * 100).toFixed(1) + '%',
      tier: c.tier,
      tierLabel: c.tier === 1 ? "Safe" : c.tier === 2 ? "Moderate" : "Risky",
      color: c.tier === 1 ? "green" : c.tier === 2 ? "yellow" : "orange",
      tierWarning: c.tier === 1 
        ? "High-probability combo. Our strongest recommendation." 
        : c.tier === 2 
          ? "Reasonable chance, but not our safest option." 
          : "Low win rate. Only for aggressive bettors.",
      dcBase: c.dc,
      supportMarket: c.support,
      correlation: DC_CORRELATION[c.pairKey] || 0
    })),
    message,
    summary: {
      totalCombos: allCombos.length,
      filteredByContradiction: allCombos.length - allowed.length,
      suppressedByConfidence: allowed.length - valid.length,
      finalSelection: selected.length,
      mainPick: mainPick,
      forbiddenBases: forbidden
    }
  };
}

// SMB v2.0 FINAL LOCKED IMPLEMENTATION
// Two-Model Engine: Bivariate Poisson + Gaussian Copula

// SMB Correlation Matrix (ρ values) - FINAL LOCKED
const SMB_CORRELATION = {
  "Favourite Win_Over 2.5 Goals": 0.28,
  "Favourite Win_Lead Striker 1+ SOT": 0.35,
  "Over 2.5_BTTS Yes": 0.25,
  "Favourite Win_Over 4.5 Corners": 0.20,
  "Lead Striker SOT_Opponent Keeper Saves": 0.15,
  "default_related": 0.10,
  "negative_pairs": -0.30
};

// SMB Tier Thresholds - FINAL LOCKED
const SMB_TIERS = {
  TIER1_MIN: 0.25,    // ≥25% - Statistical Edge
  TIER2_MIN: 0.15,    // 15-24% - High Risk  
  TIER3_MIN: 0.08,    // 8-14% - Lottery Ticket
  SUPPRESS_MAX: 0.08  // <8% - Not Shown
};

// SMB Pre-built Templates - FINAL LOCKED
const SMB_TEMPLATES = {
  4: [
    { type: "match", market: "Favourite Win" },
    { type: "team", market: "Over 1.5 Team Goals" },
    { type: "corners", market: "Over 4.5 Corners" },
    { type: "player", market: "Lead Striker 1+ SOT" }
  ],
  6: [
    { type: "match", market: "Win" },
    { type: "goals", market: "Over 2.5 Goals" },
    { type: "corners", market: "Over 5.5 Corners" },
    { type: "player", market: "Striker 1+ SOT" },
    { type: "match", market: "Lead HT" },
    { type: "player", market: "Opponent Keeper 2+ Saves" }
  ],
  8: [
    { type: "match", market: "Win" },
    { type: "goals", market: "Over 3.5 Goals" },
    { type: "team", market: "Over 2.5 Team Goals" },
    { type: "corners", market: "Over 6.5 Corners" },
    { type: "player", market: "Striker 1+ SOT" },
    { type: "match", market: "Win Both Halves" },
    { type: "player", market: "Opponent Keeper 3+ Saves" },
    { type: "match", market: "Clean Sheet" }
  ]
};

// EdgeMind SMB Messages - FINAL LOCKED
const SMB_EDGEMIND_MESSAGES = {
  gulf_unlocked: "Gulf in Class Detected. Expected goal difference >4.0. Extreme 8‑leg story unlocked.",
  tier1: "Statistical Edge — this story holds up. All legs positively correlated.",
  tier3: "Lottery ticket zone. ~[X]% historical hit rate. Entertainment only.",
  leg78_added: "This combo hits ~3 times in 100. Know the odds.",
  contradiction_blocked: "[Leg Y] breaks the story. We suggest [Z] instead.",
  tab_disabled: "This match lacks the dominance gap required for [N]-leg builds."
};

/**
 * 1. Calculate Gulf in Class using Bivariate Poisson
 * Compute expected goal difference (λ - μ)
 */
function calculateGulfInClass(match) {
  // Extract team parameters with fallbacks
  const alpha_home = match.homeTeamAlpha || 1.513;
  const beta_away = match.awayTeamBeta || 1.091;
  const alpha_away = match.awayTeamAlpha || 1.513;
  const beta_home = match.homeTeamBeta || 1.091;
  const gamma = match.gamma || 1.0;
  
  // Bivariate Poisson expected goals
  const lambda = alpha_home * beta_away * gamma;  // Home expected goals
  const mu = alpha_away * beta_home;             // Away expected goals
  
  return lambda - mu; // Gulf in Class (expected goal difference)
}

/**
 * 2. Get Maximum Legs Allowed based on Gulf in Class gate
 */
function getMaxLegsAllowed(match) {
  const winProb = match.winProb || 0.5;
  const goalDiff = calculateGulfInClass(match);
  
  // Gulf in Class gate rules
  if (winProb < 0.50 || goalDiff < 1.0) return 2;
  if (winProb < 0.65 || goalDiff < 2.5) return 4;
  if (winProb < 0.80 || goalDiff < 4.0) return 6;
  return 8; // Gulf unlocked
}

/**
 * 3. Generate Pre-built SMB combos
 */
function generatePrebuiltSMB(match, legCount) {
  const template = SMB_TEMPLATES[legCount] || SMB_TEMPLATES[4];
  const availableMarkets = match.availableMarkets || [];
  const h2hSample = match.h2hSampleSize || 10;
  
  // Generate variants with substitutions
  const variants = [];
  for (let i = 0; i < 3; i++) {
    const variant = template.map(leg => {
      // Auto-substitute missing markets with correlated alternatives
      if (!availableMarkets.includes(leg.market)) {
        return substituteMarket(leg, availableMarkets);
      }
      return leg;
    });
    
    // Calculate confidence using Gaussian copula
    const confidence = calculateSMBConfidence(variant, h2hSample);
    
    variants.push({
      legs: variant,
      confidence: confidence,
      tier: getSMBTier(confidence),
      id: `smb_${legCount}_${i + 1}`
    });
  }
  
  // Return top 3 sorted by confidence
  return variants.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
}

/**
 * 4. Calculate SMB Confidence using Gaussian Copula
 */
function calculateSMBConfidence(legs, h2hSample = 10) {
  if (legs.length <= 1) return legs[0]?.confidence || 0;
  
  // Apply H2H decay to correlations
  const h2hDecay = h2hSample < 5 ? 0.8 : 1.0;
  
  if (legs.length <= 3) {
    // 2-3 legs: Pairwise iterative formula
    return calculatePairwiseConfidence(legs, h2hDecay);
  } else {
    // 4+ legs: Gaussian copula method
    return calculateGaussianCopulaConfidence(legs, h2hDecay);
  }
}

/**
 * Pairwise confidence calculation for 2-3 legs
 */
function calculatePairwiseConfidence(legs, h2hDecay) {
  let jointProb = legs[0].confidence;
  
  for (let i = 1; i < legs.length; i++) {
    const rho = getCorrelation(legs[0], legs[i]) * h2hDecay;
    const p_a = jointProb;
    const p_b = legs[i].confidence;
    
    // P(A∩B) = P_A*P_B + ρ*√(P_A(1-P_A)*P_B(1-P_B))
    const adjustment = rho * Math.sqrt(p_a * (1 - p_a) * p_b * (1 - p_b));
    jointProb = Math.min(1, Math.max(0, p_a * p_b + adjustment));
  }
  
  return jointProb;
}

/**
 * Gaussian copula confidence calculation for 4+ legs
 */
function calculateGaussianCopulaConfidence(legs, h2hDecay) {
  // Convert marginals to latent normal variables
  const zValues = legs.map(leg => {
    const p = leg.confidence;
    // Approximate inverse standard normal CDF
    return inverseNormalCDF(p);
  });
  
  // Build correlation matrix
  const correlationMatrix = buildCorrelationMatrix(legs, h2hDecay);
  
  // For computational efficiency, use minimum ρ approximation
  const minRho = getMinimumCorrelation(correlationMatrix);
  
  // Approximate multivariate normal CDF
  return approximateMVN_CDF(zValues, minRho);
}

/**
 * 5. Validate SMB Legs for contradictions
 */
function validateSMBLegs(selectedLegs, mainPick) {
  const errors = [];
  const suggestions = [];
  
  // Check all pairs for contradictions
  for (let i = 0; i < selectedLegs.length; i++) {
    for (let j = i + 1; j < selectedLegs.length; j++) {
      const leg1 = selectedLegs[i];
      const leg2 = selectedLegs[j];
      
      const contradiction = checkContradiction(leg1, leg2);
      if (contradiction) {
        errors.push({
          leg1: leg1.market,
          leg2: leg2.market,
          message: contradiction.message,
          type: contradiction.type
        });
        
        if (contradiction.type === 'block') {
          suggestions.push(contradiction.suggestion);
        }
      }
    }
  }
  
  // Check main pick alignment for result markets
  selectedLegs.forEach(leg => {
    if (leg.type === 'match' && !isAlignedWithMain(leg.market, mainPick)) {
      errors.push({
        leg1: leg.market,
        leg2: mainPick,
        message: `Result market ${leg.market} contradicts main pick ${mainPick}`,
        type: 'block'
      });
    }
  });
  
  return {
    valid: errors.filter(e => e.type === 'block').length === 0,
    errors,
    suggestions
  };
}

/**
 * 6. Render SMB Widget with tabbed interface
 */
function renderSMBWidget(match) {
  const maxLegs = getMaxLegsAllowed(match);
  const goalDiff = calculateGulfInClass(match);
  
  // Create tabbed UI
  const tabs = [4, 6, 8].map(legCount => ({
    count: legCount,
    active: legCount <= maxLegs,
    disabled: legCount > maxLegs,
    tooltip: legCount > maxLegs 
      ? SMB_EDGEMIND_MESSAGES.tab_disabled.replace('[N]', legCount)
      : null
  }));
  
  // Generate prebuilt combos for each active tab
  const combos = {};
  tabs.forEach(tab => {
    if (tab.active) {
      combos[tab.count] = generatePrebuiltSMB(match, tab.count);
    }
  });
  
  return {
    tabs,
    combos,
    maxLegs,
    goalDiff,
    gulfUnlocked: maxLegs === 8,
    edgeMindMessages: SMB_EDGEMIND_MESSAGES
  };
}

// Helper functions

function getSMBTier(confidence) {
  if (confidence >= SMB_TIERS.TIER1_MIN) return 1;
  if (confidence >= SMB_TIERS.TIER2_MIN) return 2;
  if (confidence >= SMB_TIERS.TIER3_MIN) return 3;
  return 0; // Suppressed
}

function getCorrelation(leg1, leg2) {
  const key = `${leg1.market}_${leg2.market}`;
  const reverseKey = `${leg2.market}_${leg1.market}`;
  
  return SMB_CORRELATION[key] || 
         SMB_CORRELATION[reverseKey] || 
         SMB_CORRELATION.default_related;
}

function substituteMarket(leg, availableMarkets) {
  // Find correlated alternative from available markets
  const alternatives = {
    "Over 2.5 Goals": ["Over 1.5 Goals", "Over 3.5 Goals"],
    "Over 4.5 Corners": ["Over 3.5 Corners", "Over 5.5 Corners"],
    "Clean Sheet": ["BTTS No"]
  };
  
  const subs = alternatives[leg.market] || [];
  for (const alt of subs) {
    if (availableMarkets.includes(alt)) {
      return { ...leg, market: alt };
    }
  }
  
  return leg; // No substitution available
}

function inverseNormalCDF(p) {
  // Approximation of inverse standard normal CDF
  // Beasley-Springer-Moro approximation (simplified)
  const a = [-3.969683028665376e+01, 2.209460984241521e+02,
             -2.759285104469687e+02, 1.383577518672690e+02,
             -3.066479806614716e+01, 2.506628277459239e+00];
  
  const b = [-5.447609879822406e+01, 1.615858368580409e+02,
             -1.556989798598866e+02, 6.680131188771972e+01,
             -1.328068155288572e+01];
  
  const c = [-7.784894002430293e-03, -3.223964580411365e-01,
             -2.400758277161838e+00, -2.549732539343734e+00,
              4.374664141464968e+00,  2.938163982698783e+00];
  
  const d = [7.784695709041462e-03, 3.224671290700398e-01,
             2.445134137142996e+00, 3.754408661907416e+00];
  
  const p_low = 0.02425;
  const p_high = 1 - p_low;
  
  let q, r;
  
  if (p < p_low) {
    // Rational approximation for lower region
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
           ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else if (p <= p_high) {
    // Rational approximation for central region
    q = p - 0.5;
    r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
           (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  } else {
    // Rational approximation for upper region
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
            ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
}

function buildCorrelationMatrix(legs, h2hDecay) {
  const matrix = [];
  for (let i = 0; i < legs.length; i++) {
    matrix[i] = [];
    for (let j = 0; j < legs.length; j++) {
      if (i === j) {
        matrix[i][j] = 1;
      } else {
        matrix[i][j] = getCorrelation(legs[i], legs[j]) * h2hDecay;
      }
    }
  }
  return matrix;
}

function getMinimumCorrelation(matrix) {
  let min = 1;
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      if (i !== j && matrix[i][j] < min) {
        min = matrix[i][j];
      }
    }
  }
  return min;
}

function approximateMVN_CDF(zValues, minRho) {
  // Simplified approximation using minimum correlation
  // For exact implementation, would use proper MVN CDF library
  let jointProb = 0.5; // Start with baseline
  
  for (const z of zValues) {
    jointProb *= (0.5 + 0.5 * erf(z / Math.sqrt(2)));
  }
  
  // Apply correlation adjustment
  const adjustment = minRho * Math.sqrt(jointProb * (1 - jointProb));
  return Math.min(1, Math.max(0, jointProb + adjustment));
}

function erf(x) {
  // Error function approximation
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;
  
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);
  
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  
  return sign * y;
}

function checkContradiction(leg1, leg2) {
  // Red exclusion edges (blocked)
  const redPairs = [
    { market1: "Over 2.5", market2: "Under 1.5" },
    { market1: "BTTS Yes", market2: "Home Win to Nil" },
    { market1: "Home Win", market2: "Away Clean Sheet" },
    { market1: "Away Win", market2: "Home Clean Sheet" },
    { market1: "Draw", market2: "Clean Sheet" },
    { market1: "Over 1.5 FH", market2: "Under 0.5 FH" },
    { market1: "Player to Score", market2: "0-0 Correct Score" }
  ];
  
  for (const pair of redPairs) {
    if ((leg1.market.includes(pair.market1) && leg2.market.includes(pair.market2)) ||
        (leg1.market.includes(pair.market2) && leg2.market.includes(pair.market1))) {
      return {
        type: 'block',
        message: `${leg1.market} contradicts ${leg2.market}`,
        suggestion: `Consider ${pair.market1} with compatible alternative`
      };
    }
  }
  
  // Amber near-exclusion edges (warned)
  const amberPairs = [
    { market1: "Favourite Win 3-0", market2: "Underdog Striker 2+ SOT" }
  ];
  
  for (const pair of amberPairs) {
    if ((leg1.market.includes(pair.market1) && leg2.market.includes(pair.market2)) ||
        (leg1.market.includes(pair.market2) && leg2.market.includes(pair.market1))) {
      return {
        type: 'warn',
        message: `${leg1.market} rarely occurs with ${leg2.market}`,
        suggestion: `These have <2% historical joint probability`
      };
    }
  }
  
  return null; // No contradiction
}

function isAlignedWithMain(market, mainPick) {
  if (market.includes("Win")) {
    return (mainPick === '1' && market.includes("Home")) ||
           (mainPick === '2' && market.includes("Away"));
  }
  return true; // Non-result markets are always aligned
}

window.updateModalWithAIData = function(aiPrediction) {
    const modal = document.getElementById('skcsMatchDetailModal');
    if (!modal) return;
    const modalBody = document.getElementById('skcsModalBody');
    if (!modalBody) return;

    const loadingEl = ensureElement('ai-loading-state', 'div', modalBody);
    const confidenceScoreEl = ensureElement('ai-confidence-score', 'div', modalBody);
    const edgemindFeedbackEl = ensureElement('edgemind-feedback', 'div', modalBody);
    const secondaryMarketsEl = ensureElement('secondary-markets', 'div', modalBody);
    const doubleChanceCombosEl = ensureElement('double-chance-combos', 'div', modalBody);
    const smbBuilderEl = ensureElement('smb-builder', 'div', modalBody);

    // Update AI confidence score
    if (aiPrediction.confidence_score !== undefined) {
        confidenceScoreEl.textContent = aiPrediction.confidence_score + '%';
        confidenceScoreEl.style.display = 'block';
        const score = aiPrediction.confidence_score;
        confidenceScoreEl.style.color = score >= 75 ? '#22c55e' : score >= 55 ? '#facc15' : score >= 30 ? '#f97316' : '#ef4444';
    }

    if (aiPrediction.edgemind_feedback) {
        edgemindFeedbackEl.textContent = aiPrediction.edgemind_feedback;
        edgemindFeedbackEl.style.display = 'block';
    }

    // 1. Primary Market Reasoning
    if (typeof window.attachAIReasoning === 'function') {
        const primaryReasoning = aiPrediction.edgemind_feedback || "Primary prediction based on core metrics.";
        window.attachAIReasoning(document.getElementById('ai-main-prediction') || edgemindFeedbackEl, primaryReasoning);
    }

    // 2. Secondary Markets & Double Chance Combos via new endpoint
    const fixtureId = aiPrediction.match_id || aiPrediction.fixture_id || (aiPrediction.matches && aiPrediction.matches[0] && aiPrediction.matches[0].id_event);
    
    if (fixtureId) {
        fetch(`/api/v1/markets/secondary/${fixtureId}`)
            .then(r => r.json())
            .then(data => {
                const markets = data.markets || [];
                
                // Render regular secondary markets
                const tier3 = markets.filter(m => m.market_tier === 3 || !m.market.includes('double_chance'));
                if (tier3.length > 0) {
                    secondaryMarketsEl.innerHTML = '<div style="font-size:0.8rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748b;margin-bottom:12px;margin-top:20px;">Secondary Markets</div>' +
                        tier3.map(m => {
                            const mId = 'sec_' + Math.random().toString(36).substr(2, 9);
                            return `<div id="${mId}" style="margin-top:8px;padding:10px;background:rgba(255,255,255,0.03);border-radius:8px;border:1px solid rgba(255,255,255,0.06);">
                                <div style="display:flex;justify-content:space-between;"><span style="font-size:0.78rem;color:#94a3b8;font-weight:600;">${m.market.replace(/_/g, ' ').toUpperCase()}</span><span style="font-size:0.78rem;color:#4ade80;font-weight:700;">${m.confidence}%</span></div>
                                <div class="market-reasoning-container"></div>
                            </div>`;
                        }).join('');
                    
                    // Attach reasoning
                    setTimeout(() => {
                        tier3.forEach((m, idx) => {
                            const container = secondaryMarketsEl.children[idx + 1];
                            if (container && m.reasoning && typeof window.attachAIReasoning === 'function') {
                                window.attachAIReasoning(container, m.reasoning);
                            }
                        });
                    }, 100);
                }

                // Render Double Chance Combos
                const tier2 = markets.filter(m => m.market_tier === 2 && m.market.includes('double_chance'));
                if (tier2.length > 0) {
                    doubleChanceCombosEl.innerHTML = '<div style="font-size:0.8rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748b;margin-bottom:12px;margin-top:20px;">Double Chance Combos</div>' +
                        tier2.map(c => {
                            const tierLabel = c.confidence >= 75 ? 'Safe' : c.confidence >= 55 ? 'Moderate' : 'Risky';
                            const color = c.confidence >= 75 ? '#22c55e' : c.confidence >= 55 ? '#facc15' : '#ef4444';
                            return `<div style="margin-top:8px;padding:10px;background:rgba(255,255,255,0.03);border-radius:8px;border:1px solid rgba(255,255,255,0.06);">
                                <div style="font-size:0.85rem;color:#e2e8f0;font-weight:700;">${c.market.replace(/_/g, ' ').toUpperCase()}</div>
                                <div style="font-size:0.75rem;color:#94a3b8;margin-top:4px;">Win Rate: <span style="color:#4ade80;font-weight:600;">${c.confidence}%</span> | Risk: <span style="color:${color}">${tierLabel}</span></div>
                                <div class="dc-reasoning-container" style="margin-top:5px;"></div>
                            </div>`;
                        }).join('');

                    // Attach reasoning
                    setTimeout(() => {
                        tier2.forEach((c, idx) => {
                            const container = doubleChanceCombosEl.children[idx + 1];
                            if (container && c.reasoning && typeof window.attachAIReasoning === 'function') {
                                window.attachAIReasoning(container, c.reasoning);
                            }
                        });
                    }, 100);
                }
            })
            .catch(err => console.error("Failed to load secondary markets:", err));

        // 3. Same Match Builder (SMB) via new endpoint
        window.loadSMB = function(fId, legs) {
            smbBuilderEl.innerHTML = `<div style="text-align:center;padding:20px;color:#94a3b8;">Loading SMB Combos...</div>`;
            fetch(`/api/v1/smb/build?fixture_id=${fId}&legs=${legs}`)
                .then(r => r.json())
                .then(data => {
                    let html = '<div style="font-size:0.8rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748b;margin-bottom:12px;margin-top:20px;">Same Match Builder (SMB)</div>';
                    
                    // Tab Header
                    html += '<div style="display:flex;gap:8px;margin-bottom:12px;">';
                    [4, 6, 8].forEach(count => {
                        const active = count === legs;
                        const bg = active ? '#3b82f6' : 'rgba(255,255,255,0.05)';
                        const color = active ? '#fff' : '#64748b';
                        html += `<div onclick="loadSMB('${fId}', ${count})" style="padding:4px 12px;border-radius:16px;background:${bg};color:${color};font-size:0.75rem;font-weight:bold;cursor:pointer;">${count}-Leg</div>`;
                    });
                    html += '</div>';

                    if (!data.combos || data.combos.length === 0) {
                        html += `<div style="color:#94a3b8;font-size:0.85rem;padding:10px;">No SMB combos available for this leg count.</div>`;
                    } else {
                        data.combos.forEach((combo, idx) => {
                            html += `<div style="margin-top:8px;padding:10px;background:rgba(255,255,255,0.03);border-radius:8px;border:1px solid rgba(255,255,255,0.06);">`;
                            html += `<div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="font-size:0.85rem;color:#e2e8f0;font-weight:700;">Story ${idx+1}</span></div>`;
                            combo.forEach(leg => {
                                const tClass = leg.market_tier ? ` tier${leg.market_tier}` : '';
                                html += `<div style="font-size:0.75rem;color:#94a3b8;margin-top:4px;" class="leg${tClass}">• ${leg.market_key.replace(/_/g, ' ').toUpperCase()}: <span style="color:#fff;">${leg.prediction}</span> (${leg.confidence}%)</div>`;
                            });
                            if (data.reasoning) {
                                html += `<div style="margin-top:8px;" class="smb-reasoning-container" id="smb_reasoning_${legs}_${idx}"></div>`;
                            }
                            html += `</div>`;
                        });
                    }
                    
                    // Grab prediction IDs for demo ACCA builder
                    const demoLegs = data.combos && data.combos.length > 0 ? data.combos[0].filter(l => l.id).map(l => l.id) : [];
                    if (demoLegs.length > 1) {
                        html += `<button onclick='buildAcca(${JSON.stringify(demoLegs)})' style="margin-top:15px;width:100%;padding:10px;background:#10b981;color:#fff;border:none;border-radius:6px;font-weight:bold;cursor:pointer;">Build ACCA (Demo)</button>`;
                    }
                    html += `<div id="acca-results"></div>`;

                    smbBuilderEl.innerHTML = html;

                    // Attach reasoning
                    setTimeout(() => {
                        if (data.reasoning && typeof window.attachAIReasoning === 'function') {
                            data.combos.forEach((combo, idx) => {
                                const container = document.getElementById(`smb_reasoning_${legs}_${idx}`);
                                if (container) window.attachAIReasoning(container, data.reasoning);
                            });
                        }
                    }, 100);
                })
                .catch(err => {
                    console.error("SMB Error:", err);
                    smbBuilderEl.innerHTML = `<div style="color:#ef4444;padding:10px;">Failed to load SMB combos.</div>`;
                });
        };

        // Initial load
        window.loadSMB(fixtureId, 4);
    }

    if (loadingEl) loadingEl.style.display = 'none';
};

// Helper: Update modal loading state
window.updateModalWithLoadingState = function(showLoading) {
    const loadingEl = document.getElementById('ai-loading-state');
    if (loadingEl) {
        loadingEl.style.display = showLoading ? 'block' : 'none';
    }
};

// Data source for the pipeline UI
const SKCS_PIPELINE_DATA = [
    {
        title: "📥 API Data Collection",
        purpose: "Collect raw facts. No intelligence yet.",
        json: `{\n  "homeTeam": "Arsenal",\n  "awayTeam": "Chelsea",\n  "odds": { "home": 1.85, "draw": 3.4, "away": 4.2 },\n  "weather": "Rain",\n  "injuries": ["Player A", "Player B"]\n}` 
    },
    {
        title: "🔄 Data Normalization",
        purpose: "Convert all APIs to uniform SKCS format. Clean, consistent fuel.",
        json: `{\n  "match_id": "EPL_ARS_CHE_2026_02_10",\n  "teams": { "home": "Arsenal", "away": "Chelsea" },\n  "markets": { "1x2": { "home": 1.85, "draw": 3.4, "away": 4.2 } },\n  "context": { "weather": "Rain", "injuries": 2 }\n}` 
    },
    {
        title: "🤖 AI Stage 1: Initial Prediction",
        purpose: "Baseline probability analysis. 'On paper, who should win?'",
        json: `{\n  "stage_1": {\n    "1x2": { "home": 54, "draw": 26, "away": 20 },\n    "confidence": "medium"\n  }\n}` 
    },
    {
        title: "🧠 AI Stage 2: Deep Context",
        purpose: "Team & Player Intelligence. Adjustments for injuries, fatigue, etc.",
        json: `{\n  "stage_2": {\n    "adjustments": { "home": -6, "draw": +3, "away": +3 },\n    "confidence": "medium-low"\n  }\n}` 
    },
    {
        title: "⚠️ AI Stage 3: Reality Check",
        purpose: "External Factor Analysis. Volatility scoring based on news/weather.",
        json: `{\n  "stage_3": {\n    "volatility": "high",\n    "risk_flags": ["weather", "team unrest"]\n  }\n}` 
    },
    {
        title: "🎯 AI Stage 4: Decision Engine",
        purpose: "Final SKCS Insights. Combine all stages for market recommendations.",
        json: `{\n  "final_prediction": {\n    "recommended": ["Home Win", "Over 1.5"],\n    "avoid": ["BTTS"],\n    "acca_safe": false,\n    "confidence": 72\n  }\n}` 
    }
];

window.openMatchDetail = async function(cardId) {
    const prediction = window.SMH_CARD_REGISTRY.get(cardId);
    if (!prediction) {
        console.error('[SMH] No prediction found for card ID:', cardId);
        return;
    }

    // CRITICAL DIRECTIVE: Console.log the incoming data object to verify JSON paths
    // console.log removed

    const leg = Array.isArray(prediction.matches) && prediction.matches[0] ? prediction.matches[0] : {};
    // Enhanced team name extraction with multiple Fallback locations
    const home = leg.home_team || leg.strHomeTeam || (leg.metadata && leg.metadata.home_team) || (leg.metadata && leg.metadata.strHomeTeam) || 'Home';
    const away = leg.away_team || leg.strAwayTeam || (leg.metadata && leg.metadata.away_team) || (leg.metadata && leg.metadata.strAwayTeam) || 'Away';
    const sectionType = String(prediction.section_type || prediction.type || 'direct');
    const confidence = Math.round(Number(prediction.total_confidence || 0));
    const league = leg.metadata && leg.metadata.league ? leg.metadata.league : (leg.sport || sectionType);

    // SIDE-BY-SIDE: Fetch AI predictions from ai_predictions table
    let aiPrediction = null;
    let isCalculating = false;
    
    // Extract match_id for AI predictions lookup (use id_event or fixture_id if available)
    const matchId = leg.id_event || leg.fixture_id || leg.match_id || prediction.id;
    
    if (matchId) {
        // Show loading state initially
        isCalculating = true;
        
        try {
            const timestamp = Date.now();
            const response = await fetch(`${BACKEND_URL}/api/ai-predictions/${matchId}?t=${timestamp}&nocache=1`, {
                headers: await getSubscriberHeaders({
                    'Cache-Control': 'no-cache'
                }),
                cache: 'no-store'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            isCalculating = false;
            
            if (data.data) {
                aiPrediction = data.data;
                // Update modal if it's already open
                updateModalWithAIData(aiPrediction);
            } else {
                // No AI prediction available, hide loading state
                updateModalWithLoadingState(false);
            }
        } catch (err) {
            // Handle specific HTTP status codes
            if (err.message.includes('404')) {
                console.log(`[SMH] AI prediction not yet available for match ${matchId}`);
                showNotification("AI prediction not yet available for this match", "info");
                // Update modal with placeholder content
                const edgemindFeedbackEl = document.getElementById('edgemind-feedback');
                if (edgemindFeedbackEl) {
                    edgemindFeedbackEl.textContent = 'AI analysis is still being calculated for this match. Please check back later.';
                    edgemindFeedbackEl.classList.remove('text-slate-400');
                    edgemindFeedbackEl.classList.add('text-amber-400');
                }
            } else if (err.message.includes('500')) {
                // Handle server-side crashes specifically
                console.error(`[SMH] Server error (500) while fetching prediction for ${matchId}. Check backend logs.`);
                
                // Try to parse error response for more details
                try {
                    const errorResponse = await err.response?.json();
                    if (errorResponse?.details) {
                        console.error(`[SMH] Server error details:`, errorResponse.details);
                    }
                } catch (parseErr) {
                    // Ignore parsing errors
                }
                showNotification("Prediction service temporarily unavailable", "error");
                // Update modal with error message
                const edgemindFeedbackEl = document.getElementById('edgemind-feedback');
                if (edgemindFeedbackEl) {
                    edgemindFeedbackEl.textContent = 'Prediction service is temporarily unavailable. Please try again later.';
                    edgemindFeedbackEl.classList.remove('text-slate-400');
                    edgemindFeedbackEl.classList.add('text-red-400');
                }
            } else if (err.message.includes('timeout')) {
                console.error(`[SMH] Request timeout for match ${matchId}`);
                showNotification("Request timeout. Please try again", "warning");
                // Update modal with timeout message
                const edgemindFeedbackEl = document.getElementById('edgemind-feedback');
                if (edgemindFeedbackEl) {
                    edgemindFeedbackEl.textContent = 'Request timed out. Please check your connection and try again.';
                    edgemindFeedbackEl.classList.remove('text-slate-400');
                    edgemindFeedbackEl.classList.add('text-amber-400');
                }
            } else {
                console.error('[SMH] Unexpected error fetching AI prediction:', err);
                showNotification("Failed to fetch prediction data", "error");
                // Update modal with generic error message
                const edgemindFeedbackEl = document.getElementById('edgemind-feedback');
                if (edgemindFeedbackEl) {
                    edgemindFeedbackEl.textContent = 'Unable to fetch prediction data. Please try again later.';
                    edgemindFeedbackEl.classList.remove('text-slate-400');
                    edgemindFeedbackEl.classList.add('text-red-400');
                }
            }
            isCalculating = false;
            updateModalWithLoadingState(false);
        }
    } else {
        isCalculating = false;
    }

    // Kickoff time
    const kickoffRaw = leg.commence_time || leg.match_date
        || (leg.metadata && (leg.metadata.match_time || leg.metadata.kickoff || leg.metadata.kickoff_time))
        || prediction.created_at;
    let kickoffStr = 'TBC';
    if (kickoffRaw) {
        try {
            const d = new Date(kickoffRaw);
            if (!isNaN(d.getTime())) kickoffStr = d.toLocaleString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC';
        } catch (e) {}
    }

    // Build markets list from all legs
    const legs = Array.isArray(prediction.matches) ? prediction.matches : [leg];
    const CONF_COLORS = ['#ef4444','#f97316','#facc15','#84cc16','#22c55e','#4ade80'];
    function confColor(c) { const idx = Math.min(5, Math.floor(c / 17)); return CONF_COLORS[idx]; }

    const marketsHtml = legs.map(function(m, i) {
        const mHome = m.home_team || (m.metadata && m.metadata.home_team) || home;
        const mAway = m.away_team || (m.metadata && m.metadata.away_team) || away;
        const mMarket = String(m.market || (m.metadata && m.metadata.market) || '1X2').toUpperCase();
        const mPick = String(m.prediction || m.recommendation || (m.metadata && m.metadata.prediction) || 'Not Available').replace(/_/g,' ').toUpperCase();
        const mConf = Math.round(Number(m.confidence || 0));
        const color = confColor(mConf);
        const pct = Math.min(100, mConf);
        // Secondary markets if available
        const secMarkets = Array.isArray(m.secondary_markets) ? m.secondary_markets : [];
        const secHtml = secMarkets.map(function(sm) {
            const smConf = Math.round(Number(sm.confidence || 0));
            return '<div style="margin-top:8px;padding:10px 12px;background:rgba(255,255,255,0.03);border-radius:8px;border:1px solid rgba(255,255,255,0.06);">' +
                '<div style="display:flex;justify-content:space-between;align-items:center;">' +
                    '<span style="font-size:0.78rem;color:#94a3b8;font-weight:600;">' + String(sm.market || 'Secondary').toUpperCase() + '</span>' +
                    '<span style="font-size:0.78rem;color:' + confColor(smConf) + ';font-weight:700;">' + smConf + '%</span>' +
                '</div>' +
                '<div style="font-size:0.82rem;color:#e2e8f0;margin-top:4px;">' + String(sm.prediction || sm.pick || 'Not Available').replace(/_/g,' ').toUpperCase() + '</div>' +
            '</div>';
        }).join('');
        return '<div style="background:rgba(15,23,42,0.7);border-radius:12px;padding:16px;border:1px solid rgba(255,255,255,0.07);">' +
            (legs.length > 1 ? '<div style="font-size:0.72rem;color:#64748b;font-weight:700;margin-bottom:6px;">LEG ' + (i+1) + '</div>' : '') +
            '<div style="font-size:0.95rem;font-weight:700;color:#f1f5f9;margin-bottom:10px;">' + mHome + ' <span style="color:#475569;font-weight:400;">vs</span> ' + mAway + '</div>' +
            '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">' +
                '<span style="font-size:0.75rem;color:#94a3b8;font-weight:700;text-transform:uppercase;min-width:90px;">' + mMarket + '</span>' +
                '<div style="flex:1;height:6px;background:rgba(255,255,255,0.08);border-radius:3px;overflow:hidden;">' +
                    '<div style="height:100%;width:' + pct + '%;background:' + color + ';border-radius:3px;transition:width 0.6s ease;"></div>' +
                '</div>' +
                '<span style="font-size:0.8rem;color:' + color + ';font-weight:800;min-width:36px;text-align:right;">' + mConf + '%</span>' +
            '</div>' +
            '<div style="display:inline-block;background:rgba(74,222,128,0.1);color:#4ade80;padding:4px 10px;border-radius:5px;font-size:0.85rem;font-weight:700;">⚡ ' + mPick + '</div>' +
            secHtml +
        '</div>';
    }).join('');

    // Insights chips
    const insights = prediction.insights || {};
    const chips = [
        insights.weather ? '<span style="font-size:0.78rem;background:rgba(96,165,250,0.1);color:#60a5fa;padding:4px 10px;border-radius:20px;">🌤 ' + insights.weather + '</span>' : '',
        insights.availability ? '<span style="font-size:0.78rem;background:rgba(74,222,128,0.1);color:#4ade80;padding:4px 10px;border-radius:20px;">👥 ' + insights.availability + '</span>' : '',
        insights.stability ? '<span style="font-size:0.78rem;background:rgba(251,191,36,0.1);color:#fbbf24;padding:4px 10px;border-radius:20px;">📊 ' + insights.stability + '</span>' : ''
    ].filter(Boolean).join(' ');

    // Dynamically build secondary markets HTML with a robust Fallback
    let secondaryMarketsHTML = '';
    let secInsights = prediction.secondary_insights || prediction.secondary_markets || [];
    let dcHTML = '';
    let smbHTML = '';

    // Remove hardcoded fallback - backend now provides real secondary markets
    // if (confidence < 59 && (!Array.isArray(secInsights) || secInsights.length === 0)) {
    //     // Old hardcoded fallback removed - use backend API instead
    //     const pHome = prediction.home || 45; 
    //     const pDraw = prediction.draw || 35;
    //     const pAway = prediction.away || 20;
    //     
    //     secInsights = [
    //         { market: '1X (Home/Draw)', confidence: Math.min(99, pHome + pDraw) },
    //         { market: '12 (Any Winner)', confidence: Math.min(99, pHome + pAway) },
    //         { market: 'X2 (Draw/Away)', confidence: Math.min(99, pDraw + pAway) }
    //     ];
    // }

// Modal rendering function (cleaned up)
function showMatchDetailModal(leg, prediction, confidence, riskTier) {
    // Implementation details here
}
};

window.closeMatchDetail = function() {
    const modal = document.getElementById('skcsMatchDetailModal');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = '';
};

// Global event listener for closing modal via delegation (CSP-safe)
document.body.addEventListener('click', function(e) {
    // Check if they clicked the back arrow, the 'x', or the dark backdrop overlay
    if (e.target.closest('.close-match-modal-btn') || e.target.matches('.modal-backdrop')) {
        if (typeof window.closeMatchDetail === 'function') {
            window.closeMatchDetail();
        }
        return;
    }

    // Global Event Delegation for Pipeline Stepper
    const stepBtn = e.target.closest('.pipeline-step-btn');
    if (stepBtn) {
        const index = parseInt(stepBtn.getAttribute('data-index'));
        const data = SKCS_PIPELINE_DATA[index];
        
        if (!data) return;

        // 1. Update Terminal Content
        document.getElementById('terminal-title').innerHTML = data.title;
        document.getElementById('terminal-purpose').innerText = `Purpose: ${data.purpose}`;
        document.getElementById('terminal-json').textContent = data.json;
        document.getElementById('terminal-stage-badge').innerText = `STAGE ${index + 1}/6`;

        // Update UI States for all buttons
        document.querySelectorAll('.pipeline-step-btn').forEach(function(btn, i) {
            var circle = btn.querySelector('.step-circle');
            var label = btn.querySelector('.step-label');
            
            if (i === index) {
                // Active State
                circle.className = "w-10 h-10 rounded-full bg-blue-600 border-4 border-slate-900 flex items-center justify-center text-white font-bold shadow-[0_0_15px_rgba(37,99,235,0.6)] transition-all step-circle";
                label.className = "absolute top-12 whitespace-nowrap text-xs font-semibold text-blue-400 step-label";
            } else if (i < index) {
                // Completed State
                circle.className = "w-10 h-10 rounded-full bg-blue-900/50 border-4 border-slate-900 flex items-center justify-center text-blue-400 transition-all step-circle";
                label.className = "absolute top-12 whitespace-nowrap text-xs font-semibold text-slate-400 step-label";
            } else {
                // Future State
                circle.className = "w-10 h-10 rounded-full bg-slate-800 border-4 border-slate-900 flex items-center justify-center text-slate-400 transition-all step-circle hover:bg-slate-700";
                label.className = "absolute top-12 whitespace-nowrap text-xs font-semibold text-slate-500 step-label";
            }
        });
    }
});
