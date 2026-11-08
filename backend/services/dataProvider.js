'use strict';

const axios = require('axios');
const config = require('../config');
const {
    APISportsClient,
    OddsAPIClient,
    SportsDataOrgClient,
    SportsDataIOClient,
    RapidAPIClient,
    CricketDataClient,
    getSoccerSeasonYear,
    resolveSportsDataIOCompetitionId,
    resolveSportsDataIOSportEndpoint
} = require('../apiClients');
const { getScoreboard } = require('./espnHiddenApiService');
const ProviderQuotaExceededError = require('../errors/ProviderQuotaExceededError');
const {
    fetchBigBallsFootballFixtures,
    isBigBallsPrimaryFootball
} = require('./bigBallsFootballBridge');

const SUPPORTED_LEAGUES = ['4328', '4332', '4331', '4335', '4334', '4387', '4424', '4380', '4391'];
/** TheSportsDB league id → API-Sports league id (see docs/SKCS_ENGINE_V2_PHASE0B5_REPLAY.md) */
const THESPORTSDB_TO_APISPORTS_LEAGUE = Object.freeze({
    '4328': '39',   // Premier League
    '4335': '140',  // La Liga
    '4331': '78',   // Bundesliga
    '4332': '135',  // Serie A
    '4334': '61'    // Ligue 1
});

const LEAGUE_SPORT_MAP = {
    '4328': 'Football',          // EPL
    '4332': 'Football',          // Serie A
    '4331': 'Football',          // Bundesliga
    '4335': 'Football',          // La Liga
    '4334': 'Football',          // Ligue 1
    '4387': 'Basketball',        // NBA
    '4424': 'MLB',          // MLB
    '4380': 'NHL',            // NHL
    '4391': 'NFL'  // NFL
};
const THESPORTSDB_SUPPORTED_SPORTS = new Set(Object.values(LEAGUE_SPORT_MAP));

const THESPORTSDB_BASE_URL = 'https://www.thesportsdb.com/api/v1/json';
const THESPORTSDB_DELAY_MS = Math.max(0, Number(process.env.THESPORTSDB_DELAY_MS || 25000));
const TIER1_HTTP_DELAY_MS = Math.max(2400, Number(process.env.TIER1_HTTP_DELAY_MS || 2400));

function isObject(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

const sportsClient = axios.create({
    baseURL: THESPORTSDB_BASE_URL,
    timeout: 15000
});

const SPORT_KEY_MAP = {
    'soccer_epl': 'Football',
    'soccer_england_efl_cup': 'Football',
    'soccer_uefa_champs_league': 'Football',
    'basketball_nba': 'Basketball',
    'basketball_euroleague': 'Basketball',
    'americanfootball_nfl': 'NFL',
    'icehockey_nhl': 'NHL',
    'baseball_mlb': 'MLB',
    'mma_mixed_martial_arts': 'MMA',
    'aussierules_afl': 'AFL',
    'rugbyunion_six_nations': 'Rugby',
    'rugbyunion_international': 'Rugby'
};

function normalizeSportKey(sportKey) {
    return SPORT_KEY_MAP[sportKey] || sportKey;
}

function normalizeMode(mode) {
    if (mode === 'test' || mode === 'live') return mode;
    throw new Error(`Invalid DATA_MODE: ${mode}`);
}

function humanizeCompetitionLabel(value) {
    const key = String(value || '').trim();
    if (!key) return null;

    const aliases = {
        soccer_epl: 'Premier League',
        soccer_england_efl_cup: 'EFL Cup',
        soccer_uefa_champs_league: 'UEFA Champions League',
        soccer_uefa_europa_league: 'UEFA Europa League',
        soccer_spain_la_liga: 'La Liga',
        soccer_germany_bundesliga: 'Bundesliga',
        soccer_italy_serie_a: 'Serie A',
        soccer_france_ligue_one: 'Ligue 1',
        basketball_nba: 'NBA',
        basketball_euroleague: 'EuroLeague',
        americanfootball_nfl: 'NFL',
        icehockey_nhl: 'NHL',
        baseball_mlb: 'MLB',
        mma_mixed_martial_arts: 'MMA',
        aussierules_afl: 'AFL',
        rugbyunion_international: 'International Rugby',
        rugbyunion_six_nations: 'Six Nations'
    };

    if (aliases[key]) return aliases[key];

    return key
        .split('_')
        .filter(Boolean)
        .map(part => part.length <= 3 ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function parsePositiveInt(value, fallback, min, max) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    const rounded = Math.floor(n);
    return Math.max(min, Math.min(max, rounded));
}

function normalizeRequestedSport(sport) {
    const key = String(sport || '').trim().toLowerCase();
    if (!key) return null;
    if (key === 'football' || key === 'soccer') return 'Football';
    if (key === 'basketball' || key === 'nba') return 'Basketball';
    if (key === 'rugby') return 'Rugby';
    if (key === 'mma' || key === 'fighting') return 'MMA';
    if (key === 'mlb' || key === 'baseball') return 'MLB';
    if (key === 'nhl' || key === 'hockey') return 'NHL';
    if (key === 'nfl' || key === 'american-football' || key === 'american football') return 'NFL';
    return key.charAt(0).toUpperCase() + key.slice(1);
}

function isTier1PrioritySport(sport) {
    const normalized = normalizeRequestedSport(sport);
    return normalized === 'Football'
        || normalized === 'Basketball'
        || normalized === 'Rugby'
        || normalized === 'MMA';
}

function normalizeCompetitionText(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

const FOOTBALL_TARGET_LEAGUE_IDS = Object.freeze(new Set([
    '39', '40', '41', '42',
    '140', '141',
    '78', '79', '80',
    '135', '136', '137',
    '61', '62', '63',
    '94', '95',
    '88', '89',
    '144', '145',
    '179', '180',
    '203', '204',
    '207', '208',
    '218', '219',
    '197',
    '113', '114',
    '103', '104',
    '119', '120',
    '106', '107',
    '345',
    '172',
    '318',
    '224',
    '118',
    '253', '254',
    '262',
    '71', '72',
    '128',
    '239',
    '265',
    '268',
    '130',
    '98', '99',
    '169', '170',
    '255',
    '292',
    '307',
    '301',
    '188',
    '288', '289',
    '233',
    '195',
    '315',
    '326'
]));
const FOOTBALL_TARGET_COMPETITION_ALIASES = Object.freeze([
    'premier league',
    'championship',
    'league one',
    'league two',
    'la liga',
    'segunda',
    'bundesliga',
    '2 bundesliga',
    '3 liga',
    'serie a',
    'serie b',
    'serie c',
    'ligue 1',
    'ligue 2',
    'national 1',
    'primeira liga',
    'liga portugal 2',
    'eredivisie',
    'eerste divisie',
    'pro league',
    'challenger pro league',
    'scottish premiership',
    'scottish championship',
    'super lig',
    '1 lig',
    'super league',
    'challenge league',
    'allsvenskan',
    'superettan',
    'eliteserien',
    'obos',
    'superliga',
    'ekstraklasa',
    'i liga',
    'first league',
    'first division',
    'veikkausliiga',
    'urvalsdeild',
    'major league soccer',
    'mls',
    'usl championship',
    'liga mx',
    'brasileirao',
    'liga profesional',
    'primera a',
    'primera division',
    'j1 league',
    'j2 league',
    'chinese super league',
    'china league one',
    'chinese league one',
    'campeonato brasileiro',
    'brasileirao serie b',
    'serie b brazil',
    'k league 1',
    'saudi pro league',
    'uae pro league',
    'a league',
    'dstv premiership',
    'motsepe',
    'egyptian premier league',
    'ghana premier league',
    'kenyan premier league'
]);
const FOOTBALL_TARGET_COMPETITION_ALIAS_SET = new Set(
    FOOTBALL_TARGET_COMPETITION_ALIASES.map(normalizeCompetitionText).filter(Boolean)
);

const TENNIS_TARGET_TOURNAMENT_ALIASES = Object.freeze([
    'us open',
    'bnp paribas open',
    'indian wells open',
    'indian wells',
    'miami open',
    'miami open presented by itau',
    'cincinnati open',
    'internazionali bnl d italia',
    'italian open',
    'rome masters',
    'nitto atp finals',
    'atp finals turin',
    'atp finals',
    'roland garros',
    'french open',
    'rolex paris masters',
    'paris masters',
    'mutua madrid open',
    'madrid open',
    'barcelona open banc sabadell',
    'trofeo conde de godo',
    'barcelona open',
    'the championships wimbledon',
    'wimbledon',
    'hsbc championships',
    'queens club',
    'australian open',
    'brisbane international',
    'adelaide international',
    'china open',
    'rolex shanghai masters',
    'shanghai masters',
    'ieb argentina open',
    'argentina open',
    'buenos aires',
    'porsche tennis grand prix',
    'boss open',
    'stuttgart open',
    'terra wortmann open',
    'halle open',
    'tata open maharashtra',
    'rio open presented by claro',
    'rio open',
    'abierto mexicano telcel presentado por hsbc',
    'acapulco',
    'mifel tennis open by telcel oppo',
    'mifel tennis open',
    'los cabos',
    'dubai duty free tennis championships',
    'dubai tennis championships',
    'mubadala abu dhabi open',
    'abu dhabi open',
    'kinoshita group japan open tennis championships',
    'japan open tennis championships',
    'toray pan pacific open tennis',
    'pan pacific open',
    'swiss indoors basel',
    'basel open',
    'erste bank open',
    'vienna open'
]);
const TENNIS_TARGET_TOURNAMENT_ALIAS_SET = new Set(
    TENNIS_TARGET_TOURNAMENT_ALIASES.map(normalizeCompetitionText).filter(Boolean)
);
const BASKETBALL_TARGET_COMPETITION_ALIASES = Object.freeze([
    'national basketball association',
    'nba',
    'nba cup',
    'nba playoffs',
    'liga endesa',
    'liga acb',
    'copa del rey',
    'supercopa endesa',
    'easycredit bbl',
    'basketball bundesliga',
    'bbl pokal',
    'lnb pro a',
    'ligue nationale de basket pro a',
    'leaders cup',
    'french cup',
    'lega basket serie a',
    'lba',
    'coppa italia',
    'supercoppa italiana',
    'stoiximan greek basketball league',
    'greek basketball league',
    'gbl',
    'greek cup',
    'turkiye sigorta basketball super league',
    'turkish basketball super league',
    'bsl',
    'turkish cup',
    'vtb united league',
    'edinaya liga vtb',
    'vtb united league cup',
    'national basketball league',
    'nbl',
    'nbl cup',
    'chinese basketball association',
    'cba',
    'cba cup',
    'liga nacional de basquetbol',
    'liga nacional de basquet',
    'supercopa de la liga',
    'super 20 cup',
    'novo basquete brasil',
    'nbb',
    'supercopa do brasil de basquete',
    'canadian elite basketball league',
    'cebl',
    'cebl championship weekend',
    'b league',
    'b league b1',
    'emperors cup',
    'korean basketball league',
    'kbl',
    'kbl cup',
    'super league basketball',
    'slb',
    'slb cup',
    'slb trophy',
    'turkish airlines euroleague',
    'euroleague',
    'euroleague final four',
    'bkt eurocup',
    'eurocup',
    'eurocup finals'
]);
const BASKETBALL_TARGET_COMPETITION_ALIAS_SET = new Set(
    BASKETBALL_TARGET_COMPETITION_ALIASES.map(normalizeCompetitionText).filter(Boolean)
);
const RUGBY_TARGET_COMPETITION_ALIASES = Object.freeze([
    // Rugby Union
    'gallagher premiership rugby',
    'premiership rugby',
    'premiership rugby cup',
    'top 14',
    'vodacom united rugby championship',
    'united rugby championship',
    'urc',
    'dhl super rugby pacific',
    'super rugby pacific',
    'carling currie cup premier division',
    'currie cup premier division',
    'currie cup',
    'ntt japan rugby league one',
    'japan rugby league one',
    'league one division 1',
    'bunnings npc',
    'npc',
    'major league rugby',
    'mlr',
    // Rugby League
    'nrl telstra premiership',
    'nrl premiership',
    'nrl',
    'state of origin',
    'nrl womens premiership',
    'nrlw',
    'betfred super league',
    'super league',
    'betfred challenge cup',
    'challenge cup',
    'betfred championship',
    'rugby championship'
]);
const RUGBY_TARGET_COMPETITION_ALIAS_SET = new Set(
    RUGBY_TARGET_COMPETITION_ALIASES.map(normalizeCompetitionText).filter(Boolean)
);
const CRICKET_TARGET_COMPETITION_ALIASES = Object.freeze([
    // ICC international events
    'icc mens t20 world cup',
    'icc women s t20 world cup',
    'icc womens t20 world cup',
    'icc world test championship',
    'world test championship',
    'wtc',
    'icc mens cricket world cup',
    'icc men s cricket world cup',
    'icc men s cricket world cup qualifier',
    'icc mens cricket world cup qualifier',
    'icc women s championship',
    'icc womens championship',
    // Major T20 leagues
    'indian premier league',
    'ipl',
    'women s premier league',
    'womens premier league',
    'wpl',
    'big bash league',
    'bbl',
    'vitality blast',
    'caribbean premier league',
    'cpl',
    'pakistan super league',
    'psl',
    'sa20',
    'betway sa20',
    'super smash',
    'bangladesh premier league',
    'bpl',
    'lanka premier league',
    'lpl',
    'major league cricket',
    'mlc',
    'csa t20 challenge',
    'csa t20 knock out competition',
    'provincial t20 cup',
    // First-class / domestic long-form
    'sheffield shield',
    'county championship',
    'rothesay county championship',
    'ranji trophy',
    'plunket shield',
    'csa 4 day domestic series',
    'csa 3 day provincial cup',
    // List A / one-day domestic
    'metro bank one day cup',
    'marsh one day cup',
    'vijay hazare trophy',
    'the ford trophy',
    'ford trophy',
    'pakistan cup',
    'csa provincial one day challenge',
    'csa one day cup',
    'csa provincial one day challenge div 2',
    // Other naming variants seen in feeds
    'cricket world cup qualifier',
    'world cup qualifier'
]);
const CRICKET_TARGET_COMPETITION_ALIAS_SET = new Set(
    CRICKET_TARGET_COMPETITION_ALIASES.map(normalizeCompetitionText).filter(Boolean)
);
const BASEBALL_TARGET_COMPETITION_ALIASES = Object.freeze([
    'world baseball classic',
    'wbsc premier12',
    'premier12',
    'caribbean series',
    'serie del caribe',
    'major league baseball',
    'mlb',
    'world series',
    'nippon professional baseball',
    'npb',
    'japan series',
    'climax series',
    'kbo league',
    'korean series',
    'chinese professional baseball league',
    'cpbl',
    'taiwan series',
    'liga mexicana de beisbol',
    'lmb',
    'serie del rey',
    'liga mexicana del pacifico',
    'lmp',
    'dominican professional baseball league',
    'lidom',
    'venezuelan professional baseball league',
    'lvbp',
    'cuban national series',
    'serie nacional',
    'serie a gold',
    'italian baseball league',
    'honkbal hoofdklasse',
    'holland series',
    'australian baseball league',
    'abl',
    'baseball united',
    'united series',
    'frontier league',
    'puerto rican winter league',
    'lbprc'
]);
const BASEBALL_TARGET_COMPETITION_ALIAS_SET = new Set(
    BASEBALL_TARGET_COMPETITION_ALIASES.map(normalizeCompetitionText).filter(Boolean)
);
const HOCKEY_TARGET_COMPETITION_ALIASES = Object.freeze([
    // Field hockey
    'fih hockey world cup',
    'men s fih pro league',
    'women s fih pro league',
    'fih pro league',
    'euro hockey league',
    'hockey india league',
    'pan american junior field hockey cup',
    'tulp hoofdklasse',
    'hoofdklasse',
    'men s belgian hockey league',
    'belgian hockey league',
    'feldhockey bundesliga',
    'hockey one league',
    // Ice hockey
    'iihf ice hockey world championship',
    'iihf world junior championship',
    'winter olympics',
    'national hockey league',
    'nhl',
    'stanley cup',
    'kontinental hockey league',
    'khl',
    'gagarin cup',
    'swedish hockey league',
    'shl',
    'deutsche eishockey liga',
    'del',
    'swiss national league',
    'czech extraliga',
    'liiga',
    'american hockey league',
    'ahl',
    'echl',
    'asia league ice hockey',
    'alih',
    'australian ice hockey league',
    'aihl',
    'calder cup',
    'kelly cup'
]);
const HOCKEY_TARGET_COMPETITION_ALIAS_SET = new Set(
    HOCKEY_TARGET_COMPETITION_ALIASES.map(normalizeCompetitionText).filter(Boolean)
);
const MMA_TARGET_COMPETITION_ALIASES = Object.freeze([
    // Global promotions
    'ultimate fighting championship',
    'ufc',
    'ufc fight night',
    'the ultimate fighter',
    'professional fighters league',
    'pfl',
    'one championship',
    'one fight night',
    'one friday fights',
    'brave combat federation',
    'brave cf',
    // Regional / domestic
    'rizin fighting federation',
    'rizin',
    'super rizin',
    'rizin landmark',
    'xtb ksw',
    'ksw',
    'konfrontacja sztuk walki',
    'cage warriors',
    'cw',
    'legacy fighting alliance',
    'lfa',
    'invicta fighting championships',
    'invicta fc',
    'uae warriors',
    // Amateur / governance comps frequently surfaced in feeds
    'immaf',
    'international mixed martial arts federation',
    'amma',
    'asian mma association',
    'gamma',
    'global association of mixed martial arts',
    'asian games mma'
]);
const MMA_TARGET_COMPETITION_ALIAS_SET = new Set(
    MMA_TARGET_COMPETITION_ALIASES.map(normalizeCompetitionText).filter(Boolean)
);
const AFL_TARGET_COMPETITION_ALIASES = Object.freeze([
    'afl',
    'australian football league',
    'afl finals',
    'afl wildcard round',
    'afl elimination finals',
    'afl semi finals',
    'afl preliminary finals',
    'afl grand final',
    'nab afl women s competition',
    'nab aflw',
    'aflw',
    'aflw finals',
    'aflw grand final',
    'w awards',
    'state of origin',
    'afl international cup',
    'australian rules',
    'aussie rules'
]);
const AFL_TARGET_COMPETITION_ALIAS_SET = new Set(
    AFL_TARGET_COMPETITION_ALIASES.map(normalizeCompetitionText).filter(Boolean)
);
const VOLLEYBALL_TARGET_COMPETITION_ALIASES = Object.freeze([
    // International / major
    'fivb volleyball men s world championship',
    'fivb volleyball women s world championship',
    'volleyball men s world championship',
    'volleyball women s world championship',
    'volleyball nations league',
    'vnl',
    'men s cev champions league volley',
    'women s cev champions league volley',
    'cev champions league volley',
    'fivb volleyball world cup',
    'sitting volleyball world championships',
    'world paravolley world championships',
    'fivb beach volleyball world championship',
    'beach volleyball world championship',
    'beach pro tour',
    'beach world series',
    'olympic qualifying',
    // Domestic professional
    'superlega credem banca',
    'serie a1',
    'plusliga',
    'tauron liga',
    'superliga masculina de volei',
    'superliga feminina',
    'russian volleyball super league',
    'efeler ligi',
    'sultanlar ligi',
    'v league',
    'sv league',
    'german bundesliga volleyball',
    '1 bundesliga volleyball',
    'deutsche volleyball bundesliga',
    'french lnv ligue a',
    'marmara spikeligue',
    // NCAA
    'national collegiate men s volleyball championship',
    'ncaa men s volleyball championship',
    'national collegiate women s volleyball championship',
    'ncaa women s volleyball championship'
]);
const VOLLEYBALL_TARGET_COMPETITION_ALIAS_SET = new Set(
    VOLLEYBALL_TARGET_COMPETITION_ALIASES.map(normalizeCompetitionText).filter(Boolean)
);
const HANDBALL_TARGET_COMPETITION_ALIASES = Object.freeze([
    // International / major competitions
    'ihf world men s handball championship',
    'ihf world women s handball championship',
    'ihf world championship',
    'ehf european men s handball championship',
    'ehf euro',
    'asian men s handball championship',
    'asian women s handball championship',
    'ihf men s beach handball world championships',
    'ihf women s beach handball world championships',
    'beach handball world championships',
    'ihf men s u 20 world championship',
    'ihf women s u 16 world championship',
    'fisu world university handball championship',
    'mediterranean games handball',
    // European club competitions
    'ehf champions league men',
    'ehf champions league women',
    'ehf european league men',
    'ehf european league women',
    'ehf champions league',
    'ehf european league',
    'ehf final4',
    // Domestic men
    'daikin handball bundesliga',
    'handball bundesliga',
    'liga nexus energia asobal',
    'asobal',
    'liqui moly starligue',
    'lnh division 1',
    'herreligaen',
    'nemzeti bajnoksag i',
    'nb i',
    'pgnig superliga',
    'polish superliga',
    'super liga srbije',
    'liga nationala',
    'mol liga',
    'bundesliga austria handball',
    'swiss handball league',
    'nla handball',
    'superliga croatia handball',
    'eredvisie handball',
    'eredivisie handball',
    'liga a belgium handball',
    // Domestic women
    'bundesliga women hbf',
    'liga guerreras iberdrola',
    'ligue butagaz energie',
    'lfh division 1',
    'damehandboldligaen',
    'nemzeti bajnoksag i women',
    'orlen superliga women',
    'rema 1000 ligaen women',
    'she women s league',
    'super liga zene',
    'liga nationala women',
    'eredivisie women handball',
    // Governance names that can appear as event labels
    'international handball federation',
    'european handball federation',
    'asian handball federation',
    'african handball confederation',
    'oceania continent handball federation',
    'pan american team handball federation'
]);
const HANDBALL_TARGET_COMPETITION_ALIAS_SET = new Set(
    HANDBALL_TARGET_COMPETITION_ALIASES.map(normalizeCompetitionText).filter(Boolean)
);
const AMERICAN_FOOTBALL_TARGET_COMPETITION_ALIASES = Object.freeze([
    'national football league',
    'nfl',
    'nfl regular season',
    'nfl preseason',
    'nfl postseason',
    'wild card weekend',
    'divisional playoffs',
    'conference championships',
    'afc championship',
    'nfc championship',
    'super bowl',
    'super bowl lx',
    'super bowl lxi',
    'pro bowl',
    'pro bowl games',
    'nfl scouting combine',
    'nfl draft',
    'nfl free agency',
    'nfl international series',
    'afc',
    'nfc'
]);
const AMERICAN_FOOTBALL_TARGET_COMPETITION_ALIAS_SET = new Set(
    AMERICAN_FOOTBALL_TARGET_COMPETITION_ALIASES.map(normalizeCompetitionText).filter(Boolean)
);

function collectTennisCompetitionCandidates(row) {
    const raw = row && typeof row.raw_provider_data === 'object' ? row.raw_provider_data : {};
    const tournament = raw && typeof raw.tournament === 'object' ? raw.tournament : {};
    const uniqueTournament = tournament && typeof tournament.uniqueTournament === 'object'
        ? tournament.uniqueTournament
        : {};
    const competition = raw && typeof raw.competition === 'object' ? raw.competition : {};
    const league = raw && typeof raw.league === 'object' ? raw.league : {};
    const values = [
        row?.league,
        row?.tournament,
        row?.competition,
        raw?.name,
        raw?.event_name,
        tournament?.name,
        uniqueTournament?.name,
        competition?.name,
        league?.name,
        league?.title,
        raw?.category?.name
    ];
    return values
        .map((value) => String(value || '').trim())
        .filter(Boolean);
}

function isAllowedTennisCompetition(row) {
    const candidates = collectTennisCompetitionCandidates(row);
    if (!candidates.length) return false;
    return candidates.some((candidate) => {
        const normalized = normalizeCompetitionText(candidate);
        if (!normalized) return false;
        for (const alias of TENNIS_TARGET_TOURNAMENT_ALIAS_SET) {
            if (normalized.includes(alias)) return true;
        }
        return false;
    });
}

function isAllowedFootballCompetition(row) {
    const raw = row && typeof row.raw_provider_data === 'object' ? row.raw_provider_data : {};
    const leagueId = String(
        row?.league_id
        || raw?.league?.id
        || raw?.competition?.id
        || raw?.tournament?.id
        || ''
    ).trim();
    if (leagueId && FOOTBALL_TARGET_LEAGUE_IDS.has(leagueId)) return true;

    const candidates = collectTennisCompetitionCandidates(row);
    if (!candidates.length) return false;
    return candidates.some((candidate) => {
        const normalized = normalizeCompetitionText(candidate);
        if (!normalized) return false;
        for (const alias of FOOTBALL_TARGET_COMPETITION_ALIAS_SET) {
            if (normalized.includes(alias)) return true;
        }
        return false;
    });
}

function isAllowedBasketballCompetition(row) {
    const candidates = collectTennisCompetitionCandidates(row);
    if (!candidates.length) return false;
    return candidates.some((candidate) => {
        const normalized = normalizeCompetitionText(candidate);
        if (!normalized) return false;
        for (const alias of BASKETBALL_TARGET_COMPETITION_ALIAS_SET) {
            if (normalized.includes(alias)) return true;
        }
        return false;
    });
}

function isAllowedRugbyCompetition(row) {
    const candidates = collectTennisCompetitionCandidates(row);
    if (!candidates.length) return false;
    return candidates.some((candidate) => {
        const normalized = normalizeCompetitionText(candidate);
        if (!normalized) return false;
        for (const alias of RUGBY_TARGET_COMPETITION_ALIAS_SET) {
            if (normalized.includes(alias)) return true;
        }
        return false;
    });
}

function isAllowedCricketCompetition(row) {
    const candidates = collectTennisCompetitionCandidates(row);
    if (!candidates.length) return false;
    return candidates.some((candidate) => {
        const normalized = normalizeCompetitionText(candidate);
        if (!normalized) return false;
        for (const alias of CRICKET_TARGET_COMPETITION_ALIAS_SET) {
            if (normalized.includes(alias)) return true;
        }
        return false;
    });
}

function isAllowedBaseballCompetition(row) {
    const candidates = collectTennisCompetitionCandidates(row);
    if (!candidates.length) return false;
    return candidates.some((candidate) => {
        const normalized = normalizeCompetitionText(candidate);
        if (!normalized) return false;
        for (const alias of BASEBALL_TARGET_COMPETITION_ALIAS_SET) {
            if (normalized.includes(alias)) return true;
        }
        return false;
    });
}

function isAllowedHockeyCompetition(row) {
    const candidates = collectTennisCompetitionCandidates(row);
    if (!candidates.length) return false;
    return candidates.some((candidate) => {
        const normalized = normalizeCompetitionText(candidate);
        if (!normalized) return false;
        for (const alias of HOCKEY_TARGET_COMPETITION_ALIAS_SET) {
            if (normalized.includes(alias)) return true;
        }
        return false;
    });
}

function isAllowedMmaCompetition(row) {
    const candidates = collectTennisCompetitionCandidates(row);
    if (!candidates.length) return false;
    return candidates.some((candidate) => {
        const normalized = normalizeCompetitionText(candidate);
        if (!normalized) return false;
        for (const alias of MMA_TARGET_COMPETITION_ALIAS_SET) {
            if (normalized.includes(alias)) return true;
        }
        return false;
    });
}

function isAllowedAflCompetition(row) {
    const candidates = collectTennisCompetitionCandidates(row);
    if (!candidates.length) return false;
    return candidates.some((candidate) => {
        const normalized = normalizeCompetitionText(candidate);
        if (!normalized) return false;
        for (const alias of AFL_TARGET_COMPETITION_ALIAS_SET) {
            if (normalized.includes(alias)) return true;
        }
        return false;
    });
}

function isAllowedVolleyballCompetition(row) {
    const candidates = collectTennisCompetitionCandidates(row);
    if (!candidates.length) return false;
    return candidates.some((candidate) => {
        const normalized = normalizeCompetitionText(candidate);
        if (!normalized) return false;
        for (const alias of VOLLEYBALL_TARGET_COMPETITION_ALIAS_SET) {
            if (normalized.includes(alias)) return true;
        }
        return false;
    });
}

function isAllowedHandballCompetition(row) {
    const candidates = collectTennisCompetitionCandidates(row);
    if (!candidates.length) return false;
    return candidates.some((candidate) => {
        const normalized = normalizeCompetitionText(candidate);
        if (!normalized) return false;
        for (const alias of HANDBALL_TARGET_COMPETITION_ALIAS_SET) {
            if (normalized.includes(alias)) return true;
        }
        return false;
    });
}

function isAllowedAmericanFootballCompetition(row) {
    const candidates = collectTennisCompetitionCandidates(row);
    if (!candidates.length) return false;
    return candidates.some((candidate) => {
        const normalized = normalizeCompetitionText(candidate);
        if (!normalized) return false;
        for (const alias of AMERICAN_FOOTBALL_TARGET_COMPETITION_ALIAS_SET) {
            if (normalized.includes(alias)) return true;
        }
        return false;
    });
}

const COMPETITION_ALLOWLIST_SPORTS = Object.freeze(new Set([
    'football',
    'tennis',
    'basketball',
    'rugby',
    'cricket',
    'baseball',
    'hockey',
    'mma',
    'afl',
    'volleyball',
    'handball',
    'american_football'
]));

function isCompetitionAllowedForSport(sport, row) {
    const rowSport = normalizeRequestedSport(sport || row?.sport || '');
    if (!rowSport || !COMPETITION_ALLOWLIST_SPORTS.has(rowSport)) return true;

    if (rowSport === 'football') return isAllowedFootballCompetition(row);
    if (rowSport === 'tennis') return isAllowedTennisCompetition(row);
    if (rowSport === 'basketball') return isAllowedBasketballCompetition(row);
    if (rowSport === 'rugby') return isAllowedRugbyCompetition(row);
    if (rowSport === 'cricket') return isAllowedCricketCompetition(row);
    if (rowSport === 'baseball') return isAllowedBaseballCompetition(row);
    if (rowSport === 'hockey') return isAllowedHockeyCompetition(row);
    if (rowSport === 'mma') return isAllowedMmaCompetition(row);
    if (rowSport === 'afl') return isAllowedAflCompetition(row);
    if (rowSport === 'volleyball') return isAllowedVolleyballCompetition(row);
    if (rowSport === 'handball') return isAllowedHandballCompetition(row);
    if (rowSport === 'american_football') return isAllowedAmericanFootballCompetition(row);

    return true;
}

function applyCompetitionAllowlist(rows, requestedSport) {
    const sourceRows = Array.isArray(rows) ? rows : [];
    return sourceRows.filter((row) => isCompetitionAllowedForSport(requestedSport, row));
}

function dedupePredictionInputs(rows) {
    const out = [];
    const seen = new Set();
    for (const row of Array.isArray(rows) ? rows : []) {
        if (!row) continue;
        const sport = normalizeRequestedSport(row.sport) || String(row.sport || '').trim().toLowerCase();
        const matchId = String(row.match_id || row.provider_fixture_id || '').trim();
        const kickoff = String(row.date || row.commence_time || row.kickoff || row.kickoff_time || row.match_time || '').trim();
        if (!sport || !matchId) continue;
        const key = `${sport}|${matchId}|${kickoff}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(row);
    }
    return out;
}

function normalizeTheSportsDbStartTime(event) {
    const timestamp = String(event?.strTimestamp || '').trim();
    if (timestamp) {
        const parsedTimestamp = new Date(timestamp);
        if (!Number.isNaN(parsedTimestamp.getTime())) {
            return parsedTimestamp.toISOString();
        }
    }

    const dateValue = String(event?.dateEvent || '').trim();
    const timeValue = String(event?.strTime || '').trim();
    if (dateValue && timeValue) {
        const composed = new Date(`${dateValue}T${timeValue}`);
        if (!Number.isNaN(composed.getTime())) {
            return composed.toISOString();
        }
    }

    if (dateValue) {
        const dateOnly = new Date(`${dateValue}T00:00:00Z`);
        if (!Number.isNaN(dateOnly.getTime())) {
            return dateOnly.toISOString();
        }
    }

    return null;
}

function deriveSeasonLabel(referenceDate = new Date()) {
    const year = referenceDate.getUTCFullYear();
    const month = referenceDate.getUTCMonth() + 1;
    if (month >= 7) {
        return `${year}-${year + 1}`;
    }
    return `${year - 1}-${year}`;
}

/** Same calendar rule as syncService.getSeasonStartYear — API-Sports season param (e.g. 2025 for 2025-26), but league-aware. */
function deriveApiSportsSeasonYear(sport, leagueId, referenceDate = new Date()) {
    const d = referenceDate instanceof Date ? referenceDate : new Date(referenceDate);
    const month = d.getUTCMonth() + 1;
    const year = d.getUTCFullYear();
    
    const normalizedSport = String(sport || '').trim().toLowerCase();
    const id = String(leagueId || '').trim();

    // Calendar-year/summer football leagues: J1 (98), J2 (99), CSL (169), China League One (170), MLS (253), USL (255), Brazil A (71), Brazil B (72)
    const summerLeagues = ['98', '99', '169', '170', '253', '255', '71', '72'];
    const isSummerFootballLeague = normalizedSport === 'football' && summerLeagues.includes(id);
    const isMlb = normalizedSport === 'mlb' || id === '4424';

    if (isSummerFootballLeague || isMlb) {
        return year;
    }

    return month >= 8 ? year : year - 1;
}

function resolveApiSportsLeagueId(leagueId, sport) {
    const id = String(leagueId || '').trim();
    if (!id) return null;
    const sportKey = normalizeRequestedSport(sport);
    if (sportKey === 'football' || String(sport || '').toLowerCase() === 'football') {
        if (THESPORTSDB_TO_APISPORTS_LEAGUE[id]) {
            return THESPORTSDB_TO_APISPORTS_LEAGUE[id];
        }
        if (FOOTBALL_TARGET_LEAGUE_IDS.has(id)) {
            return id;
        }
        return null;
    }
    return id;
}

function apiSportsSeasonPlanBlocked(errors) {
    if (!errors || typeof errors !== 'object') return false;
    const text = JSON.stringify(errors).toLowerCase();
    return text.includes('free plans do not have access to this season')
        || text.includes('try from 2022 to 2024');
}

function footballApiSportsSeasonFallbacks(primarySeason) {
    const primary = Number(primarySeason);
    const ordered = [2024, 2023, 2022];
    if (Number.isFinite(primary) && !ordered.includes(primary)) {
        ordered.unshift(primary);
    }
    return [...new Set(ordered.map(String))];
}

function buildUtcWindow(fromDate, toDate) {
    const startRaw = String(fromDate || '').trim() || todayStr();
    const endRaw = String(toDate || '').trim() || startRaw;
    const start = new Date(`${startRaw}T00:00:00Z`);
    const endInclusive = new Date(`${endRaw}T00:00:00Z`);
    endInclusive.setUTCDate(endInclusive.getUTCDate() + 1);
    return {
        start,
        endExclusive: endInclusive
    };
}

function isFixtureInsideUtcWindow(startTime, windowStart, windowEndExclusive) {
    if (!startTime) return false;
    const parsed = new Date(startTime);
    if (Number.isNaN(parsed.getTime())) return false;
    return parsed >= windowStart && parsed < windowEndExclusive;
}

function isFixtureFinished(event) {
    const status = String(event?.strStatus || '').trim().toLowerCase();
    if (!status) return false;
    return status.includes('match finished')
        || status.includes('finished')
        || status.includes('full time')
        || status === 'ft';
}

function enumerateDateRange(fromDate, toDate, maxDays = 31) {
    const start = new Date(`${String(fromDate || todayStr()).trim()}T00:00:00Z`);
    const end = new Date(`${String(toDate || todayStr()).trim()}T00:00:00Z`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
        return [todayStr()];
    }
    const out = [];
    const cursor = new Date(start);
    while (cursor <= end && out.length < maxDays) {
        out.push(cursor.toISOString().slice(0, 10));
        cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return out;
}

function mapTheSportsDbFixture(event, fallbackLeagueId) {
    const leagueId = String(event?.idLeague || fallbackLeagueId || '').trim();
    const fixtureId = String(event?.idEvent || '').trim();

    if (!leagueId || !fixtureId) return null;

    const homeTeam = event?.strHomeTeam || null;
    const awayTeam = event?.strAwayTeam || null;
    if (!homeTeam || !awayTeam) {
        console.warn(`[dataProvider] Skipping TheSportsDB fixture ${fixtureId}: missing team name (home=${homeTeam}, away=${awayTeam})`);
        return null;
    }

    return {
        fixture_id: fixtureId,
        league_id: leagueId,
        home_team: homeTeam,
        away_team: awayTeam,
        start_time: normalizeTheSportsDbStartTime(event),
        status: String(event?.strStatus || 'NS').trim() || 'NS',
        league_name: event?.strLeague || event?.strLeagueAlternate || null,
        country: event?.strCountry || null,
        home_logo: event?.strHomeTeamBadge || event?.strHomeBadge || event?.strHomeLogo || null,
        away_logo: event?.strAwayTeamBadge || event?.strAwayBadge || event?.strAwayLogo || null,
        sport: LEAGUE_SPORT_MAP[leagueId] || 'football',
        raw_provider_data: event
    };
}

function toPredictionInputFromSportsDbFixture(fixture) {
    return {
        match_id: `tsdb-${fixture.fixture_id}`,
        sport: fixture.sport || 'football',
        home_team: fixture.home_team,
        away_team: fixture.away_team,
        date: fixture.start_time,
        status: fixture.status,
        market: '1X2',
        prediction: null,
        confidence: null,
        volatility: null,
        odds: null,
        provider: 'the-sports-db',
        provider_name: 'TheSportsDB',
        league: fixture.league_name || null,
        country: fixture.country || null,
        league_id: fixture.league_id,
        home_logo: fixture.home_logo || null,
        away_logo: fixture.away_logo || null,
        raw_provider_data: fixture.raw_provider_data || null
    };
}

function resolveTheSportsDbKey() {
    const configured = String(config.theSportsDbKey || process.env.SPORTS_DB_KEY || '').trim();
    if (configured) return configured;

    const isLiveProduction = String(process.env.DATA_MODE || '').toLowerCase() === 'live'
        && String(process.env.NODE_ENV || '').toLowerCase() === 'production';
    if (isLiveProduction) {
        console.warn('[dataProvider] THESPORTSDB_KEY missing on production — skipping TheSportsDB (set key on Render web service and restart).');
        return '';
    }

    return String(process.env.THESPORTSDB_DEFAULT_KEY || '3').trim();
}

async function fetchUpcomingFixtures(options = {}) {
    const sportsDbKey = resolveTheSportsDbKey();
    if (!sportsDbKey) {
        console.warn('[dataProvider] TheSportsDB key missing (THESPORTSDB_KEY or SPORTS_DB_KEY) - skipping provider');
        return [];
    }

    const requestedLeagueIds = Array.isArray(options.leagueIds) && options.leagueIds.length > 0
        ? options.leagueIds.map((id) => String(id || '').trim()).filter(Boolean)
        : SUPPORTED_LEAGUES;
    const uniqueLeagueIds = [...new Set(requestedLeagueIds)];
    const requestedWindowDays = parsePositiveInt(options.windowDays, 3, 1, 21);
    const toDate = options.toDate || futureStr(requestedWindowDays);
    const fromDate = options.fromDate || todayStr();
    const maxFixturesPerLeague = parsePositiveInt(
        options.maxFixturesPerLeague ?? process.env.THESPORTSDB_MAX_FIXTURES_PER_LEAGUE,
        60,
        5,
        300
    );
    const includeSeasonBackfill = String(options.includeSeasonBackfill ?? process.env.THESPORTSDB_SEASON_BACKFILL ?? 'true').toLowerCase() !== 'false';
    const includeDaySweep = String(options.includeDaySweep ?? process.env.THESPORTSDB_DAY_SWEEP ?? 'true').toLowerCase() !== 'false';
    const seasonLabel = String(options.seasonLabel || deriveSeasonLabel(new Date())).trim();
    const { start: windowStart, endExclusive: windowEndExclusive } = buildUtcWindow(fromDate, toDate);
    const requestedSport = normalizeRequestedSport(options.requestedSport || 'football');
    const enforceTier1Delay = isTier1PrioritySport(requestedSport);
    const effectiveDelayMs = enforceTier1Delay ? Math.max(TIER1_HTTP_DELAY_MS, THESPORTSDB_DELAY_MS) : THESPORTSDB_DELAY_MS;
    const daySweepSportLabel = ({
        football: 'Soccer',
        basketball: 'Basketball',
        baseball: 'Baseball',
        hockey: 'Ice Hockey',
        american_football: 'American Football',
        rugby: 'Rugby',
        cricket: 'Cricket',
        tennis: 'Tennis'
    })[requestedSport] || null;
    const daySweepByLeague = new Map();

    if (includeDaySweep && daySweepSportLabel) {
        const dateList = enumerateDateRange(fromDate, toDate, 21);
        const leagueFilter = new Set(uniqueLeagueIds);
        for (let i = 0; i < dateList.length; i += 1) {
            const date = dateList[i];
            try {
                const dayResponse = await sportsClient.get(`/${sportsDbKey}/eventsday.php`, {
                    params: { d: date, s: daySweepSportLabel }
                });
                const events = Array.isArray(dayResponse.data?.events) ? dayResponse.data.events : [];
                for (const event of events) {
                    const mapped = mapTheSportsDbFixture(event, event?.idLeague);
                    if (!mapped) continue;
                    if (!leagueFilter.has(String(mapped.league_id || '').trim())) continue;
                    if (isFixtureFinished(event)) continue;
                    if (!isFixtureInsideUtcWindow(mapped.start_time, windowStart, windowEndExclusive)) continue;
                    const key = String(mapped.league_id);
                    if (!daySweepByLeague.has(key)) daySweepByLeague.set(key, []);
                    daySweepByLeague.get(key).push(mapped);
                }
            } catch (error) {
                console.error(`[dataProvider] TheSportsDB eventsday ${date} failed:`, error.message);
            }

            if (i < dateList.length - 1) {
                await sleep(effectiveDelayMs);
            }
        }
    }

    const out = [];

    for (let i = 0; i < uniqueLeagueIds.length; i++) {
        const leagueId = uniqueLeagueIds[i];
        const leagueRows = [];
        if (daySweepByLeague.has(leagueId)) {
            leagueRows.push(...daySweepByLeague.get(leagueId));
        }
        try {
            const response = await sportsClient.get(`/${sportsDbKey}/eventsnextleague.php`, {
                params: { id: leagueId }
            });
            const events = Array.isArray(response.data?.events) ? response.data.events : [];
            const mapped = events
                .map((event) => mapTheSportsDbFixture(event, leagueId))
                .filter(Boolean);

            leagueRows.push(...mapped.filter((fixture) => (
                isFixtureInsideUtcWindow(fixture.start_time, windowStart, windowEndExclusive)
            )));
        } catch (error) {
            console.error(`[dataProvider] TheSportsDB league=${leagueId} next failed:`, error.message);
        }

        if (includeSeasonBackfill && seasonLabel) {
            try {
                const seasonResponse = await sportsClient.get(`/${sportsDbKey}/eventsseason.php`, {
                    params: { id: leagueId, s: seasonLabel }
                });
                const seasonEvents = Array.isArray(seasonResponse.data?.events) ? seasonResponse.data.events : [];
                const seasonMapped = seasonEvents
                    .filter((event) => !isFixtureFinished(event))
                    .map((event) => mapTheSportsDbFixture(event, leagueId))
                    .filter((fixture) => fixture && isFixtureInsideUtcWindow(fixture.start_time, windowStart, windowEndExclusive));
                leagueRows.push(...seasonMapped);
            } catch (error) {
                console.error(`[dataProvider] TheSportsDB league=${leagueId} season failed:`, error.message);
            }
        }

        const dedupedLeagueRows = [];
        const seenFixtureIds = new Set();
        for (const row of leagueRows) {
            const fixtureId = String(row?.fixture_id || '').trim();
            if (!fixtureId || seenFixtureIds.has(fixtureId)) continue;
            seenFixtureIds.add(fixtureId);
            dedupedLeagueRows.push(row);
        }

        dedupedLeagueRows.sort((a, b) => {
            const aTime = new Date(a?.start_time || 0).getTime();
            const bTime = new Date(b?.start_time || 0).getTime();
            return aTime - bTime;
        });

        const trimmed = dedupedLeagueRows.slice(0, maxFixturesPerLeague);
        out.push(...trimmed);
        console.log(
            `[dataProvider] TheSportsDB league=${leagueId} next+season=${dedupedLeagueRows.length} kept=${trimmed.length} window=${fromDate}->${toDate}`
        );

        if (i < uniqueLeagueIds.length - 1) {
            await sleep(effectiveDelayMs);
        }
    }

    return out;
}

function derivePredictionFromH2HOutcomes(event) {
    const bookmakers = Array.isArray(event?.bookmakers) ? event.bookmakers : [];

    for (const bookmaker of bookmakers) {
        const markets = Array.isArray(bookmaker?.markets) ? bookmaker.markets : [];
        const h2h = markets.find((market) => market?.key === 'h2h');
        const outcomes = Array.isArray(h2h?.outcomes) ? h2h.outcomes : [];
        if (outcomes.length < 2) continue;

        const ranked = outcomes
            .filter((outcome) => typeof outcome?.price === 'number' && Number.isFinite(outcome.price))
            .sort((a, b) => a.price - b.price);

        const best = ranked[0];
        const second = ranked[1] || null;
        if (!best) continue;

        const bestName = String(best.name || '').trim();
        const prediction = bestName === event.home_team
            ? 'home_win'
            : bestName === event.away_team
                ? 'away_win'
                : null;

        if (!prediction) continue;

        const gap = second ? Math.max(0, second.price - best.price) : 0.2;
        const confidence = Math.max(55, Math.min(92, 57 + gap * 40));
        const volatility = confidence >= 72 ? 'low' : confidence >= 64 ? 'medium' : 'high';

        return {
            prediction,
            confidence: Math.round(confidence * 100) / 100,
            volatility,
            bookmaker: bookmaker.title || null
        };
    }

    return null;
}

function buildTestData() {
    // 8 deterministic test entries
    return [
        { match_id: 'test-001', sport: 'football', home_team: 'Arsenal', away_team: 'Chelsea', market: '1X2', prediction: 'home_win', odds: 1.85 },
        { match_id: 'test-002', sport: 'football', home_team: 'Liverpool', away_team: 'Everton', market: 'double_chance', prediction: 'home_or_draw', odds: 1.25 },
        { match_id: 'test-003', sport: 'football', home_team: 'Barcelona', away_team: 'Atletico', market: 'over_2_5', prediction: 'over_2_5', odds: 1.95 },
        { match_id: 'test-004', sport: 'football', home_team: 'Inter', away_team: 'Juventus', market: 'btts_yes', prediction: 'btts_yes', odds: 1.90 },
        { match_id: 'test-005', sport: 'basketball', home_team: 'Lakers', away_team: 'Warriors', market: '1X2', prediction: 'home_win', odds: 1.70 },
        { match_id: 'test-006', sport: 'football', home_team: 'PSG', away_team: 'Marseille', market: 'over_2_5', prediction: 'over_2_5', odds: 1.80 },
        { match_id: 'test-007', sport: 'football', home_team: 'Bayern', away_team: 'Dortmund', market: 'btts_yes', prediction: 'btts_yes', odds: 1.75 },
        { match_id: 'test-008', sport: 'football', home_team: 'Ajax', away_team: 'Feyenoord', market: 'double_chance', prediction: 'home_or_draw', odds: 1.35 }
    ].map(p => ({
        ...p,
        confidence: null,
        volatility: null
    }));
}

async function fetchOddsData(sportKey) {
    const client = new OddsAPIClient();
    const data = await client.getOdds(sportKey);
    if (!data) return [];

    const normalizedSport = normalizeSportKey(sportKey);

    const out = [];
    for (const event of data) {
        const homeTeam = event.home_team || null;
        const awayTeam = event.away_team || null;
        if (!homeTeam || !awayTeam) {
            console.warn(`[dataProvider] Skipping OddsAPI event ${event.id}: missing team name (home=${homeTeam}, away=${awayTeam})`);
            continue;
        }

        const marketView = derivePredictionFromH2HOutcomes(event);
        out.push({
            match_id: `odds-${event.id}`,
            sport: normalizedSport,
            home_team: homeTeam,
            away_team: awayTeam,
            date: event.commence_time || null,
            market: '1X2',
            prediction: marketView?.prediction || null,
            confidence: marketView?.confidence || null,
            volatility: marketView?.volatility || null,
            odds: { bookmakers: event.bookmakers },
            provider: 'odds-api',
            provider_name: 'odds-api',
            league: event.sport_title || humanizeCompetitionLabel(sportKey),
            bookmaker: marketView?.bookmaker || null,
            raw_provider_data: event
        });
    }

    return out;
}

async function fetchSportsDataOrg(sport, leagueCode) {
    const client = new SportsDataOrgClient();
    const data = await client.getFixtures(sport, leagueCode);
    if (!data || data.length === 0) return [];

    return data.map(match => client.normalizeFixture(match, sport));
}

function filterSportsDataIOGamesByDate(games, date) {
    const target = String(date || '').slice(0, 10);
    if (!target) return games;

    return (Array.isArray(games) ? games : []).filter((game) => {
        const raw = game?.DateTime || game?.Date || game?.Day || '';
        return String(raw).slice(0, 10) === target;
    });
}

async function fetchSportsDataIO(sport, leagueId, date = todayStr(), options = {}) {
    const client = new SportsDataIOClient();
    const competitionId = resolveSportsDataIOCompetitionId(
        options.competitionId || options.competition || leagueId
    );
    if (!competitionId) return [];

    const sportEndpoint = resolveSportsDataIOSportEndpoint(sport);
    let data = [];

    if (sportEndpoint === 'soccer' && options.preferGamesByDate !== true) {
        const season = options.season || getSoccerSeasonYear(date, competitionId);
        const schedule = await client.getSchedule(sport, competitionId, season);
        data = filterSportsDataIOGamesByDate(schedule, date);
    } else {
        data = await client.getFixtures(sport, competitionId, date);
    }

    if (!data || data.length === 0) return [];

    const normalized = data
        .map((game) => client.normalizeFixture(game, sport))
        .filter(Boolean);

    if (options.allowFinalForDisplay) {
        return normalized;
    }

    return normalized.filter((fixture) => isPreMatchSportsDataIOStatus(fixture.status));
}

async function fetchRapidAPI(sport, leagueId, season) {
    const client = new RapidAPIClient();
    const data = await client.getFixtures(sport, leagueId, season);
    if (!data || data.length === 0) return [];

    return data.map(f => client.normalizeFixture(f, sport));
}

async function fetchCricketData() {
    const client = new CricketDataClient();
    const data = await client.getFixtures();
    if (!data || data.length === 0) return [];

    return data.map(match => client.normalizeFixture(match));
}

function todayStr() {
    return new Date().toISOString().slice(0, 10);
}

function futureStr(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
}

function isSupportedSportsDataIOSport(sport) {
    const normalized = String(normalizeRequestedSport(sport) || '').trim().toLowerCase();
    return [
        'football',
        'soccer',
        'basketball',
        'nba',
        'nfl',
        'american_football',
        'baseball',
        'mlb',
        'hockey',
        'nhl'
    ].includes(normalized);
}

function isPreMatchSportsDataIOStatus(status) {
    const normalized = String(status || '').trim().toUpperCase();
    if (!normalized) return true;
    if ([
        'FINAL',
        'INPROGRESS',
        'AWARDED',
        'CANCELED',
        'CANCELLED',
        'SUSPENDED',
        'BREAK'
    ].includes(normalized)) {
        return false;
    }
    return [
        'NS',
        'TBD',
        'SCHEDULED',
        'NOT STARTED',
        'UPCOMING',
        'POSTPONED',
        'DELAYED',
        'PREGAME'
    ].includes(normalized);
}

function normalizeFixture(f, sport) {
    // Football v3 format
    if (f?.fixture?.id) {
        const homeTeam = f.teams?.home?.name || null;
        const awayTeam = f.teams?.away?.name || null;
        if (!homeTeam || !awayTeam) {
            console.warn(`[dataProvider] Skipping fixture ${f.fixture.id}: missing team name (home=${homeTeam}, away=${awayTeam})`);
            return null;
        }
        return {
            match_id: String(f.fixture.id),
            sport,
            home_team: homeTeam,
            away_team: awayTeam,
            date: f.fixture?.date || null,
            status: f.fixture?.status?.short || null,
            market: '1X2',
            prediction: null,
            confidence: null,
            volatility: null,
        odds: null,
        provider: 'api-sports',
        provider_name: 'api-sports',
        league: f.league?.name || null,
        country: f.league?.country || null,
        round: f.league?.round || null,
        venue: f.fixture?.venue?.name || null,
        raw_provider_data: f
    };
    }
    // Other sports v1/v2 format (games, races, fights)
    const id = f.id || f.game?.id || f.fight?.id || f.race?.id;
    const home = f.teams?.home?.name || f.players?.home?.name || f.competitors?.[0]?.name || null;
    const away = f.teams?.away?.name || f.players?.away?.name || f.competitors?.[1]?.name || null;
    const date = f.date || f.game?.date || f.fight?.date || f.race?.date || null;
    const status = f.status?.short || f.game?.status?.short || null;
    const league = f.league?.name || f.competition?.name || f.tournament?.name || humanizeCompetitionLabel(sport);
    const country = f.league?.country || f.country || f.competition?.country || null;
    const venue = f.venue?.name || f.game?.venue?.name || f.race?.circuit?.name || null;

    if (!home || !away) {
        console.warn(`[dataProvider] Skipping fixture: missing team name (home=${home}, away=${away})`);
        return null;
    }

    return {
        match_id: id ? String(id) : `live-${sport}-${home}-${away}`,
        sport,
        home_team: home,
        away_team: away,
        date,
        status,
        market: '1X2',
        prediction: null,
        confidence: null,
        volatility: null,
        odds: null,
        provider: 'api-sports',
        provider_name: 'api-sports',
        league,
        country,
        venue,
        stage: f.stage || f.competition?.stage || f.tournament?.stage || null,
        raw_provider_data: f
    };
}

async function buildLiveData(options = {}) {
    const sport = options.sport || 'football';
    const leagueId = options.leagueId || null;
    const season = options.season || null;
    const syncState = isObject(options.syncState) ? options.syncState : null;
    const today = todayStr();
    const requestedWindowDays = Number(options.windowDays ?? process.env.LIVE_FETCH_WINDOW_DAYS ?? 3);
    const windowDays = Number.isFinite(requestedWindowDays)
        ? parsePositiveInt(requestedWindowDays, 3, 1, 14)
        : 3;
    const windowEnd = futureStr(windowDays);

    // ── DIAGNOSTIC LOGGING ─────────────────────────────────────────────
    console.log(`[DIAG] buildLiveData START — sport=${sport} leagueId=${leagueId} season=${season} dateRange=${today}→${windowEnd} windowDays=${windowDays}`);
    console.log(`[DIAG] API Keys status: X_APISPORTS_KEY=${process.env.X_APISPORTS_KEY ? 'SET' : 'MISSING'}`);
    console.log(`[DIAG] API Keys status: THESPORTSDB_KEY=${process.env.THESPORTSDB_KEY ? 'SET' : 'MISSING'}`);
    console.log(`[DIAG] API Keys status: ODDS_API_KEY=${process.env.ODDS_API_KEY ? 'SET' : 'MISSING'}`);
    console.log(`[DIAG] API Keys status: RAPIDAPI_KEY=${process.env.RAPIDAPI_KEY ? 'SET' : 'MISSING'}`);
    console.log(`[DIAG] API Keys status: X_AUTH_TOKEN=${process.env.X_AUTH_TOKEN ? 'SET' : 'MISSING'}`);
    console.log(`[DIAG] API Keys status: SPORTSDATA_IO_KEY=${process.env.SPORTSDATA_IO_KEY ? 'SET' : 'MISSING'}`);
    console.log(`[DIAG] DATA_MODE=${process.env.DATA_MODE || 'default'}`);
    // ────────────────────────────────────────────────────────────────────
    const maxFixturesPerSource = parsePositiveInt(
        process.env.LIVE_MAX_FIXTURES_PER_SOURCE,
        600,
        80,
        2000
    );
    const minFixturesTarget = parsePositiveInt(
        process.env.LIVE_MIN_FIXTURES_TARGET,
        60,
        5,
        2000
    );
    const requestedLeagueId = leagueId ? String(leagueId).trim() : null;
    const isSupportedLeagueId = requestedLeagueId ? SUPPORTED_LEAGUES.includes(requestedLeagueId) : false;
    const requestedSport = normalizeRequestedSport(sport);
    const includeAllSports = String(sport || '').toLowerCase() === 'all';
    const shouldFetchAllLeagues = !requestedLeagueId || String(sport || '').toLowerCase() === 'all';
    const useTheSportsDbForSport = includeAllSports
        || !requestedSport
        || THESPORTSDB_SUPPORTED_SPORTS.has(requestedSport);
    const leagueIdsForSportsDb = useTheSportsDbForSport && shouldFetchAllLeagues
        ? SUPPORTED_LEAGUES.filter((id) => (
            includeAllSports
            || !requestedSport
            || normalizeRequestedSport(LEAGUE_SPORT_MAP[id]) === requestedSport
        ))
        : (useTheSportsDbForSport && isSupportedLeagueId ? [requestedLeagueId] : []);

    const client = new APISportsClient();
    let aggregated = [];
    const appendAggregated = (rows, sourceLabel) => {
        const next = dedupePredictionInputs([...(aggregated || []), ...(Array.isArray(rows) ? rows : [])]);
        aggregated = next.slice(0, maxFixturesPerSource);
        console.log(`[dataProvider] ${sport}: aggregate after ${sourceLabel} -> ${aggregated.length}`);
        return aggregated.length >= minFixturesTarget;
    };

    // --- Source 0: Big Balls Data (gated primary for mapped football leagues) ---
    if (isBigBallsPrimaryFootball() && (requestedSport === 'football' || String(sport).toLowerCase() === 'football') && requestedLeagueId) {
        try {
            console.log(`[dataProvider] football: Big Balls PRIMARY path for leagueId=${requestedLeagueId}`);
            const bbdFixtures = await fetchBigBallsFootballFixtures({
                leagueId: requestedLeagueId,
                fromDate: today,
                toDate: windowEnd,
                limit: maxFixturesPerSource
            });
            const filtered = applyCompetitionAllowlist(bbdFixtures, 'football');
            if (filtered.length > 0) {
                console.log(`[dataProvider] football: Big Balls PRIMARY returned ${filtered.length} fixtures`);
                if (appendAggregated(filtered, 'BigBallsData')) {
                    return aggregated;
                }
            }
            console.warn(`[dataProvider] football: Big Balls PRIMARY returned 0 fixtures for leagueId=${requestedLeagueId}`);
        } catch (error) {
            console.error(`[dataProvider] football: Big Balls PRIMARY error:`, error.message);
        }
    }

    // --- Source 1: TheSportsDB (fallback for supported multi-league ingestion) ---
    console.log(`[DIAG] TheSportsDB check: requestedLeagueId=${requestedLeagueId} isSupported=${isSupportedLeagueId} shouldFetchAll=${shouldFetchAllLeagues} useTheSportsDb=${useTheSportsDbForSport} leagueIdsForSportsDb=[${leagueIdsForSportsDb.join(',')}]`);
    if (leagueIdsForSportsDb.length > 0) {
        try {
            console.log(`[dataProvider] ${sport}: fetching TheSportsDB leagues=${leagueIdsForSportsDb.join(',')}`);
            const fixtures = await fetchUpcomingFixtures({
                leagueIds: leagueIdsForSportsDb,
                fromDate: today,
                toDate: windowEnd,
                windowDays,
                maxFixturesPerLeague: parsePositiveInt(process.env.THESPORTSDB_MAX_FIXTURES_PER_LEAGUE, 60, 5, 300),
                includeSeasonBackfill: true,
                includeDaySweep: true,
                requestedSport: requestedSport || sport
            });
            const filteredFixtures = fixtures.filter((fixture) => (
                includeAllSports || !requestedSport || normalizeRequestedSport(fixture.sport) === requestedSport
            ));

            if (filteredFixtures.length > 0) {
                const out = applyCompetitionAllowlist(
                    dedupePredictionInputs(filteredFixtures
                    .slice(0, maxFixturesPerSource)
                    .map(toPredictionInputFromSportsDbFixture)),
                    requestedSport || sport
                );
                console.log(`[dataProvider] ${sport}: TheSportsDB fetched=${filteredFixtures.length} returned=${out.length}`);
                if (out.length > 0 && appendAggregated(out, 'TheSportsDB')) {
                    return aggregated;
                }
            }

            console.warn(`[dataProvider] ${sport}: 0 fixtures from TheSportsDB`);
        } catch (error) {
            console.error(`[dataProvider] ${sport}: TheSportsDB error:`, error.message);
        }
    }

    // --- Source 1: SportSRC (primary) ---
    try {
        const { SportSrcClient } = require('../apiClients');
        const sportSrcClient = new SportSrcClient();
        console.log(`[dataProvider] ${sport}: Fetching fixtures from SportSRC`);
        
        let data = await sportSrcClient.getMatches(sport);
        let rawFixtures = Array.isArray(data) ? data : [];
        
        if (rawFixtures.length > 0) {
            console.log(`[dataProvider] ${sport}: SportSRC returned ${rawFixtures.length} raw fixtures`);
            console.log("[SportSRC RAW SAMPLE]", JSON.stringify(rawFixtures[0], null, 2));
            const { normalizeSportSRCMatch } = require('../utils/sportsrcNormalizer');
            
            const normalizedFixtures = [];
            for (const match of rawFixtures) {
                const norm = normalizeSportSRCMatch(match, sport);
                if (norm) {
                    normalizedFixtures.push(norm);
                }
            }
            
            const out = applyCompetitionAllowlist(
                dedupePredictionInputs(normalizedFixtures.slice(0, maxFixturesPerSource)),
                requestedSport || sport
            );
            
            console.log(`[dataProvider] ${sport}: SportSRC fetched=${normalizedFixtures.length} returned=${out.length}`);
            if (out.length > 0 && appendAggregated(out, 'SportSRC')) {
                return aggregated;
            }
        } else {
            console.warn(`[dataProvider] ${sport}: 0 fixtures from SportSRC`);
        }
    } catch (error) {
        console.error(`[dataProvider] ${sport}: SportSRC ERROR:`, error.message);
    }


    // --- Source 2: Odds API (fallback) ---
    const oddsKey = options.oddsKey;
    if (oddsKey) {
        try {
            console.log(`[dataProvider] ${sport}: trying Odds API fallback (${oddsKey})`);
            const oddsData = await fetchOddsData(oddsKey);
            if (oddsData.length > 0) {
                const out = applyCompetitionAllowlist(
                    dedupePredictionInputs(oddsData),
                    requestedSport || sport
                );
                console.log(`[dataProvider] ${sport}: Odds API returned ${out.length} events`);
                if (out.length > 0 && appendAggregated(out, 'Odds API')) {
                    return aggregated;
                }
            }
        } catch (oddsErr) {
            console.error(`[dataProvider] ${sport}: Odds API fallback failed:`, oddsErr.message);
        }
    }

    // --- Source 3: FootballData.org (fallback) ---
    if (normalizeRequestedSport(sport) === 'football') {
        try {
            console.log(`[dataProvider] ${sport}: trying FootballData.org fallback`);
            const sdoData = await fetchSportsDataOrg(sport, leagueId);
            if (sdoData.length > 0) {
                const out = applyCompetitionAllowlist(
                    dedupePredictionInputs(sdoData),
                    requestedSport || sport
                );
                console.log(`[dataProvider] ${sport}: FootballData.org returned ${out.length} events`);
                if (out.length > 0 && appendAggregated(out, 'FootballData.org')) {
                    return aggregated;
                }
            }
        } catch (sdoErr) {
            console.error(`[dataProvider] ${sport}: FootballData.org fallback failed:`, sdoErr.message);
        }
    }

    // --- Source 4: SportsData.io (fallback) ---
    if (String(process.env.DISABLE_SPORTSDATA_IO || '').toLowerCase() !== 'true') {
    if (!isSupportedSportsDataIOSport(sport)) {
        console.log(`[dataProvider] ${sport}: skipping SportsData.io fallback (unsupported sport mapping)`);
    } else {
    try {
        console.log(`[dataProvider] ${sport}: trying SportsData.io fallback`);
        const sportsDataIoDate = String(options.fixtureDate || options.date || today).trim() || today;
        const sdiData = await fetchSportsDataIO(sport, leagueId, sportsDataIoDate, options);
        if (sdiData.length > 0) {
            const out = applyCompetitionAllowlist(
                dedupePredictionInputs(sdiData),
                requestedSport || sport
            );
            console.log(`[dataProvider] ${sport}: SportsData.io returned ${out.length} events`);
            if (out.length > 0 && appendAggregated(out, 'SportsData.io')) {
                return aggregated;
            }
        }
    } catch (sdiErr) {
        console.error(`[dataProvider] ${sport}: SportsData.io fallback failed:`, sdiErr.message);
    }
    }
    } else {
        console.warn(`[dataProvider] ${sport}: SportsData.io disabled by DISABLE_SPORTSDATA_IO`);
    }

    // --- Source 5: RapidAPI (fallback) ---
    try {
        console.log(`[dataProvider] ${sport}: trying RapidAPI fallback`);
        const rapidData = await fetchRapidAPI(sport, leagueId, season);
        if (rapidData.length > 0) {
            const out = applyCompetitionAllowlist(
                dedupePredictionInputs(rapidData),
                requestedSport || sport
            );
            console.log(`[dataProvider] ${sport}: RapidAPI returned ${out.length} events`);
            if (out.length > 0 && appendAggregated(out, 'RapidAPI')) {
                return aggregated;
            }
        }
    } catch (rapidErr) {
        console.error(`[dataProvider] ${sport}: RapidAPI fallback failed:`, rapidErr.message);
    }

    // --- Source 6: CricketData (cricket-specific fallback) ---
    if (sport === 'cricket') {
        try {
            console.log(`[dataProvider] cricket: trying CricketData API fallback`);
            const cricketData = await fetchCricketData();
            if (cricketData.length > 0) {
                const out = applyCompetitionAllowlist(
                    dedupePredictionInputs(cricketData),
                    requestedSport || sport
                );
                console.log(`[dataProvider] cricket: CricketData API returned ${out.length} events`);
                if (out.length > 0 && appendAggregated(out, 'CricketData')) {
                    return aggregated;
                }
            }
        } catch (cricketErr) {
            console.error(`[dataProvider] cricket: CricketData API fallback failed:`, cricketErr.message);
        }
    }

    // --- Source 7: ESPN Hidden API (free fallback, no API key required) ---
    // ESPN integration added as final fallback when all other sources return zero.
    // Maps SKCS sports to ESPN identifiers and uses site.api.espn.com endpoints.
    try {
        console.log(`[dataProvider] ${sport}: trying ESPN Hidden API fallback (free, no key required)`);
        
        // Map SKCS sport names to ESPN sport/league identifiers
        const espnSportMap = {
            'Football': { sport: 'soccer' },
            'Basketball': { sport: 'basketball', leagues: ['nba'] },
            'NFL': { sport: 'football', leagues: ['nfl'] },
            'NHL': { sport: 'hockey', leagues: ['nhl'] },
            'MLB': { sport: 'baseball', leagues: ['mlb'] },
            'MMA': { sport: 'mma', leagues: ['ufc'] },
            'Tennis': { sport: 'tennis', leagues: ['atp'] },
            'Cricket': { sport: 'cricket', leagues: ['icc.t20'] }
        };

        const espnFootballLeagueMap = {
            '15': 'fifa.world', '4362': 'fifa.world', // FIFA World Cup
            '39': 'eng.1', '4328': 'eng.1',   // EPL
            '140': 'esp.1', '4335': 'esp.1',  // La Liga
            '135': 'ita.1', '4332': 'ita.1',  // Serie A
            '78': 'ger.1', '4331': 'ger.1',   // Bundesliga
            '61': 'fra.1', '4334': 'fra.1',   // Ligue 1
            '2': 'uefa.champions', '3': 'uefa.champions', // UCL
            '253': 'usa.1',                   // MLS
        };
        
        const espnConfig = espnSportMap[requestedSport] || espnSportMap[sport];
        
        if (espnConfig) {
            const espnFixtures = [];
            
            let targetLeagues = espnConfig.leagues || [];
            if (espnConfig.sport === 'soccer') {
                const mappedLeague = espnFootballLeagueMap[String(leagueId)];
                if (mappedLeague) {
                    targetLeagues = [mappedLeague];
                } else {
                    targetLeagues = []; // Do not fallback to all leagues if unmapped
                }
            }
            
            const espnFromDate = String(today || '').replace(/-/g, '');
            const espnToDate = String(windowEnd || '').replace(/-/g, '');
            const espnDateParam = (espnFromDate && espnToDate) ? `${espnFromDate}-${espnToDate}` : null;
            
            for (const league of targetLeagues) {
                try {
                    const espnData = await getScoreboard(espnConfig.sport, league, espnDateParam);
                    
                    if (espnData && espnData.events && Array.isArray(espnData.events)) {
                        // Transform ESPN events to match fixture format
                        const transformed = espnData.events
                            .filter(event => {
                                // Filter out completed games, keep upcoming and in-progress
                                const status = event.status?.type?.state || 'post';
                                return status === 'pre' || status === 'in';
                            })
                            .map(event => {
                                const competitors = event.competitions?.[0]?.competitors || [];
                                const homeTeam = competitors.find(c => c.homeAway === 'home')?.team?.displayName || 'Unknown';
                                const awayTeam = competitors.find(c => c.homeAway === 'away')?.team?.displayName || 'Unknown';
                                const date = event.date || event.competitions?.[0]?.date;
                                
                                return {
                                    match_id: `espn-${event.id}`,
                                    sport: sport,
                                    home_team: homeTeam,
                                    away_team: awayTeam,
                                    date: date,
                                    status: event.status?.type?.state === 'in' ? 'LIVE' : 'NS',
                                    league: event.league?.name || league,
                                    country: event.league?.country || null,
                                    venue: event.competitions?.[0]?.venue?.fullName || null,
                                    provider: 'espn_hidden_api',
                                    provider_name: 'ESPN Hidden API',
                                    raw_provider_data: event
                                };
                            });
                        
                        espnFixtures.push(...transformed);
                    }
                } catch (leagueErr) {
                    console.warn(`[dataProvider] ESPN ${espnConfig.sport}/${league} failed:`, leagueErr.message);
                }
            }
            
            if (espnFixtures.length > 0) {
                // Deduplicate against existing aggregated fixtures
                const existingKeys = new Set(
                    aggregated.map(f => `${f.home_team}|${f.away_team}|${f.date}`)
                );
                const newFixtures = espnFixtures.filter(f => {
                    const key = `${f.home_team}|${f.away_team}|${f.date}`;
                    return !existingKeys.has(key);
                });
                
                if (newFixtures.length > 0) {
                    const out = applyCompetitionAllowlist(
                        dedupePredictionInputs(newFixtures),
                        requestedSport || sport
                    );
                    console.log(`[dataProvider] ${sport}: ESPN Hidden API contributed ${out.length} fixtures (from ${espnFixtures.length} total, ${newFixtures.length} unique)`);
                    if (out.length > 0 && appendAggregated(out, 'ESPN Hidden API')) {
                        return aggregated;
                    }
                } else {
                    console.log(`[dataProvider] ${sport}: ESPN returned ${espnFixtures.length} fixtures but all were duplicates`);
                }
            } else {
                console.log(`[dataProvider] ${sport}: ESPN returned 0 fixtures`);
            }
        } else {
            console.log(`[dataProvider] ${sport}: ESPN not configured for this sport, skipping`);
        }
    } catch (espnErr) {
        console.error(`[dataProvider] ${sport}: ESPN Hidden API fallback failed:`, espnErr.message);
        // Never crash the sync - log and continue
    }

    if (aggregated.length > 0) {
        // Remove duplicate fixtures (same teams, keep earliest date)
        aggregated = Object.values(
            aggregated.reduce((acc, event) => {
                const homeTeam = event.home_team || event.homeTeam || '';
                const awayTeam = event.away_team || event.awayTeam || '';
                const key = `${homeTeam}||${awayTeam}`;
                const eventTime = new Date(event.commence_time || event.date || event.commenceTime || 0).getTime();
                const existingTime = acc[key] ? new Date(acc[key].commence_time || acc[key].date || acc[key].commenceTime || 0).getTime() : Infinity;
                if (!acc[key] || eventTime < existingTime) {
                    acc[key] = event;
                }
                return acc;
            }, {})
        );
        console.log(`[dataProvider] ${sport}: after deduplication, returning aggregated ${aggregated.length} fixtures`);
        return aggregated;
    }

    console.warn(`[dataProvider] ${sport}: All data sources exhausted, returning empty`);
    return [];
}

async function getPredictionInputs(options = {}) {
    const mode = normalizeMode(config.DATA_MODE);

    if (mode === 'test') {
        const data = buildTestData();
        console.log('[dataProvider] mode=test returned=%s', data.length);
        return { mode, predictions: data };
    }

    const data = await buildLiveData(options);
    return { mode, predictions: data };
}

module.exports = {
    SUPPORTED_LEAGUES,
    fetchUpcomingFixtures,
    getPredictionInputs,
    buildLiveData,
    applyCompetitionAllowlist,
    isCompetitionAllowedForSport,
    normalizeRequestedSport,
    normalizeCompetitionText,
    COMPETITION_ALLOWLIST_SPORTS
};
