(() => {
  // src/core/constants.js
  var SETTINGS_KEY = "sp_settings_v1";
  var TRANSLATION_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1e3;
  var PRICE_CACHE_TTL_MS = 60 * 60 * 1e3;
  var FX_RATES_TTL_MS = 24 * 60 * 60 * 1e3;
  var REGION_REQUEST_TIMEOUT_MS = 45e3;
  var DEFAULT_TRANSLATION = {
    /** Master switch for the whole translation feature. */
    enabled: true,
    /** Provider id from the provider registry. */
    provider: "google-free",
    /** 'manual' — show a per-block translate button; 'auto' — translate as soon as content appears. */
    trigger: "manual",
    /** 'below' — render translation under the original; 'replace' — swap original text. */
    display: "below",
    /** ISO 639-1 code or 'auto' (Steam/browser language). */
    targetLanguage: "auto",
    /** Render cached translations immediately without pressing the button. */
    showCached: true,
    /** Which content scopes are translated (keys of the target registry). */
    scopes: {
      gameDescription: true,
      gameReviews: true,
      profileComments: true,
      gameNews: true
    }
  };
  var DEFAULT_GAMEPAGE = {
    /** Master switch for hiding blocks on store game pages. */
    enabled: true,
    /** Block ids (see features/gamepage/blocks.js) mapped to hidden flags. */
    hidden: {
      media: false,
      purchase: false,
      description: false,
      dlc: false,
      sysreq: false,
      reviews: false,
      curators: false,
      events: false,
      details: false,
      recommendations: false,
      sale: false,
      edition: false
    }
  };
  var DEFAULT_PRICES = {
    /** Master switch for the regional prices block. */
    enabled: true,
    /** Load prices automatically; otherwise show a per-page load button. */
    autoLoad: true,
    /** Store country codes (`cc` API param) to compare, in display order. */
    regions: ["US", "DE", "GB", "PL", "UA", "KZ", "TR"],
    /** Block placement: 'purchase' (below buy options), 'sidebar', 'description'. */
    position: "purchase",
    /** Row order: 'custom' (as listed), 'priceAsc', 'discountDesc'. */
    sort: "custom",
    /** Show the original (pre-discount) price next to the final one. */
    showOriginal: true,
    /** Show the Steam-green discount badge. */
    showDiscount: true,
    /** Show the converted-price difference against the visitor's own price. */
    showSavings: true,
    /** Highlight the cheapest comparable region. */
    highlightCheapest: true,
    /** Pin the visitor's own store price as the first row. */
    showHomeRow: true,
    /** Convert prices into this currency: 'auto' (own store currency), 'off', or an ISO code. */
    convertTo: "auto",
    /** Show the converted price next to Steam's own formatted price. */
    showConverted: true,
    /** Start with the comparison block collapsed to save space. */
    collapsed: false,
    /** Exchange rates cache lifetime, ms (1h / 6h / 24h / 7d). */
    fxTtl: FX_RATES_TTL_MS
  };
  var DEFAULT_REGION = {
    /** Master switch for the region bypass. */
    enabled: true,
    /** 'auto' — replace blocked pages immediately; 'manual' — show an offer button first. */
    mode: "auto",
    /** Optional Steam store country override (`cc`) for guest requests, '' = keep mine. */
    countryCode: "",
    /** Route the anonymous fetch through an HTTP gateway (IP-based locks). */
    proxyEnabled: false,
    /** Gateway address without scheme (host) plus optional port. */
    proxyHost: "",
    proxyPort: "",
    /** Optional HTTP Basic auth for the gateway. */
    proxyUser: "",
    proxyPass: "",
    /** How the target URL is appended to host:port: 'gateway' | 'path' | 'query'. */
    proxyMode: "gateway",
    /** Show the guest-fetch notice banner on bypassed pages (hidden by default). */
    showBanner: false
  };
  var DEFAULT_LINKS = {
    /** Master switch for the external links block. */
    enabled: true,
    /** Block placement: 'purchase' (above buy options), 'sidebar', 'description'. */
    position: "purchase",
    /** Open links in a new tab. */
    openInNewTab: true,
    /** User links: { id, name, url (template with {name} / {appid}), icon, enabled }. */
    items: [
      {
        id: "steamdb",
        name: "SteamDB",
        url: "https://steamdb.info/app/{appid}/",
        icon: "https://steamdb.info/favicon.ico",
        enabled: true
      },
      {
        id: "protondb",
        name: "ProtonDB",
        url: "https://www.protondb.com/apps/{appid}",
        icon: "https://www.protondb.com/favicon.ico",
        enabled: true
      },
      {
        id: "hltb",
        name: "HowLongToBeat",
        url: "https://howlongtobeat.com/?q={name}",
        icon: "https://howlongtobeat.com/favicon.ico",
        enabled: true
      }
    ]
  };
  var DEFAULT_SETTINGS = {
    /** UI language: 'auto' or one of SUPPORTED_LOCALES. */
    language: "auto",
    translation: DEFAULT_TRANSLATION,
    /** Hidden blocks on store game pages (`/app/<id>`). */
    gamepage: DEFAULT_GAMEPAGE,
    /** Regional price comparison on store game pages. */
    prices: DEFAULT_PRICES,
    /** External links to other stores and databases on game pages. */
    links: DEFAULT_LINKS,
    /** Region bypass for store pages blocked with “unavailable in your region”. */
    region: DEFAULT_REGION,
    /** Toast notifications: master switch, screen corner, auto-hide ms (0 = sticky). */
    toasts: {
      enabled: true,
      position: "bottom-right",
      duration: 5e3
    }
  };
  function getDefaults() {
    return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  }

  // src/core/debug.js
  var Codes = {
    /** A bus listener threw while handling an event. */
    BUS_LISTENER: "SP-1001",
    /** Persisting settings to GM storage failed. */
    SETTINGS_PERSIST: "SP-1002",
    /** No provider is registered for the configured provider id. */
    UNKNOWN_PROVIDER: "SP-1101",
    /** Provider request failed (network, timeout, HTTP status). */
    REQUEST_FAILED: "SP-1110",
    /** Provider answered 200 but the payload was unusable. */
    BAD_RESPONSE: "SP-1111",
    /** Translating one content block failed (logged once, with cause). */
    TRANSLATE_FAILED: "SP-1201",
    /** Reading the translation cache from GM storage failed. */
    CACHE_LOAD: "SP-1210",
    /** Writing the translation cache to GM storage failed. */
    CACHE_PERSIST: "SP-1211",
    /** A target selector threw during a DOM scan. */
    BAD_SELECTOR: "SP-1220",
    /** A regional price request failed (network, timeout, HTTP status). */
    PRICE_REQUEST: "SP-1310",
    /** A regional price response was unusable. */
    PRICE_RESPONSE: "SP-1311",
    /** Exchange rates could not be loaded from any provider. */
    FX_RATES: "SP-1313",
    /** Reading or writing the regional price cache failed. */
    PRICE_CACHE: "SP-1312",
    /** Region bypass guest request failed (network, timeout, HTTP status). */
    REGION_REQUEST: "SP-1410",
    /** Region bypass guest response held no usable store content. */
    REGION_RESPONSE: "SP-1411",
    /** Region bypass run failed (logged once at the outermost point). */
    REGION_FAILED: "SP-1413",
    /** Guest content transplant failed (rewrite fallback takes over). */
    TRANSPLANT: "SP-1414",
    /** Queue action (wishlist/follow/ignore) on a restored page failed. */
    REGION_QUEUE: "SP-1415"
  };
  var BADGE_STYLE = "background:#8a3030;color:#fff;border-radius:2px;padding:1px 6px;font-weight:bold";
  var CODE_STYLE = "font-weight:bold";
  var INFO_STYLE = "color:#8f98a0";
  function isVerbose() {
    try {
      if (typeof window !== "undefined" && window.__SP_DEBUG__ === true) return true;
    } catch {
    }
    try {
      return localStorage.getItem("sp_debug") === "1";
    } catch {
      return false;
    }
  }
  function fail(code, message, details, cause) {
    const error = new Error(`[${code}] ${message}`);
    error.code = code;
    if (details !== void 0) error.details = details;
    if (cause !== void 0) error.cause = cause;
    return error;
  }
  function print(printer, badgeStyle, code, message, details) {
    if (details === void 0) {
      printer(`%cSteam Plus%c ${code} ${message}`, badgeStyle, CODE_STYLE);
    } else {
      printer(`%cSteam Plus%c ${code} ${message}`, badgeStyle, CODE_STYLE, details);
    }
  }
  function logError(code, message, details) {
    print(console.error, BADGE_STYLE, code, message, details);
  }
  function logInfo(area, message, details) {
    if (!isVerbose()) return;
    if (details === void 0) {
      console.info(`%cSteam Plus \xB7 ${area}%c ${message}`, INFO_STYLE, "");
    } else {
      console.info(`%cSteam Plus \xB7 ${area}%c ${message}`, INFO_STYLE, "", details);
    }
  }

  // src/i18n/meta.js
  var SUPPORTED_LOCALES = [
    "en",
    "ru",
    "de",
    "es",
    "fr",
    "pt-BR",
    "zh-CN",
    "ja",
    "ko",
    "pl"
  ];

  // src/i18n/locales/en.js
  var en_default = {
    "menu.settings": "Settings Steam Plus",
    "tab.general": "General",
    "tab.translation": "Translation",
    "tab.gamepage": "Game page",
    "tab.prices": "Prices",
    "tab.cache": "Cache",
    "tab.about": "About",
    "tab.general.desc": "Interface language and notifications.",
    "tab.translation.desc": "Translate descriptions, reviews, comments and news.",
    "tab.gamepage.desc": "Hide unneeded blocks on game pages.",
    "tab.prices.desc": "Compare regional prices and convert currency.",
    "tab.links": "External links",
    "tab.links.desc": "Quick links to other stores and databases.",
    "tab.region": "Region",
    "tab.region.desc": "Load store pages blocked in your region.",
    "tab.cache.desc": "Stored translations and storage usage.",
    "tab.about.desc": "Version, author and source code.",
    "panel.subtitle": "Translation \xB7 game page \xB7 prices \xB7 links \xB7 region \xB7 cache \xB7 interface",
    "panel.back": "Back",
    "common.on": "On",
    "common.off": "Off",
    "common.auto": "Auto",
    "common.close": "Close",
    "common.cancel": "Cancel",
    "common.save": "Save",
    "common.reset": "Reset to defaults",
    "common.saved": "Saved",
    "common.settings": "Settings",
    "general.language": "Interface language",
    "general.languageDesc": "Language of the Steam Plus settings panel.",
    "general.saveHint": "Changes apply when you press Save below.",
    "reset.confirm": "Reset all settings to their defaults?",
    "general.toasts": "Notifications",
    "toasts.enabled": "Toast notifications",
    "toasts.enabledDesc": "Show success and error popups for settings and translations.",
    "toasts.position": "Position on screen",
    "toasts.duration": "Auto-hide after (seconds)",
    "toasts.durationDesc": "0 keeps notifications until dismissed.",
    "toastPos.bottom-right": "Bottom right",
    "toastPos.bottom-left": "Bottom left",
    "toastPos.top-right": "Top right",
    "toastPos.top-left": "Top left",
    "translation.title": "Translation",
    "translation.behavior": "Behavior",
    "translation.desc": "Translate Steam content: descriptions, reviews, comments and news.",
    "translation.enabled": "Translation enabled",
    "translation.enabledDesc": "Master switch for the translation feature.",
    "translation.provider": "Translation provider",
    "translation.providerDesc": "Service used to translate texts.",
    "provider.google-free": "Google (free)",
    "translation.trigger": "Translation mode",
    "translation.triggerDesc": "Translate automatically when content appears, or via a button.",
    "trigger.auto": "Automatically",
    "trigger.manual": "Via button",
    "translation.display": "Translation display",
    "translation.displayDesc": "Replace the original text or show the translation below it.",
    "display.below": "Below original",
    "display.replace": "Replace text",
    "translation.targetLanguage": "Target language",
    "translation.targetLanguageDesc": "Language to translate content into.",
    "targetLanguage.auto": "Same as Steam / browser",
    "translation.showCached": "Show saved translations instantly",
    "translation.showCachedDesc": "If a translation is already cached, display it right away without pressing the button.",
    "translation.scopes": "What to translate",
    "translation.scopesDesc": "Choose which content types are translated.",
    "scope.gameDescription": "Game descriptions",
    "scope.gameReviews": "Game reviews",
    "scope.profileComments": "Profile comments",
    "scope.gameNews": "News and events",
    "gamepage.title": "Game page",
    "gamepage.desc": "Declutter Steam game pages: hide blocks you never read.",
    "gamepage.enabled": "Hide game page blocks",
    "gamepage.enabledDesc": "Master switch for hiding blocks on game pages.",
    "gamepage.blocks": "Hidden blocks",
    "gamepage.blocksDesc": "Choose which blocks to hide on game pages (store app pages).",
    "block.media": "Screenshots & trailers",
    "block.purchase": "Buy options & bundles",
    "block.description": "About this game",
    "block.dlc": "Content for this game (DLC)",
    "block.sysreq": "System requirements",
    "block.reviews": "User reviews",
    "block.curators": "What curators say",
    "block.events": "Events & announcements",
    "block.details": "Details & sidebar info",
    "block.recommendations": "Franchise & recommendations",
    "block.sale": "Sale event banner",
    "block.edition": "Edition & bundle contents",
    "prices.title": "Regional prices",
    "prices.desc": "Compare the game price across Steam store regions, right on the game page.",
    "prices.enabled": "Regional prices enabled",
    "prices.enabledDesc": "Master switch for the regional price comparison block.",
    "prices.autoLoad": "Load prices automatically",
    "prices.autoLoadDesc": "Off shows a load button on every game page instead.",
    "prices.position": "Block position",
    "prices.positionDesc": "Where the comparison block appears on game pages.",
    "pricesPos.purchase": "Above buy options",
    "pricesPos.sidebar": "Sidebar",
    "pricesPos.description": "Below description",
    "prices.sort": "Row order",
    "prices.sortDesc": "Price order uses approximate exchange rates.",
    "pricesSort.custom": "As listed",
    "pricesSort.priceAsc": "Lowest price first",
    "pricesSort.discountDesc": "Biggest discount first",
    "prices.conversion": "Currency conversion",
    "prices.conversionDesc": "Convert every price into one currency using live exchange rates.",
    "prices.convertTo": "Display currency",
    "prices.convertToDesc": "Auto uses the currency of the store you are browsing.",
    "convertTo.auto": "Auto (your store currency)",
    "convertTo.off": "Off (no conversion)",
    "prices.showConverted": "Show converted price",
    "prices.fxCache": "Rates cache lifetime",
    "prices.fxCacheDesc": "How long exchange rates are reused before a fresh request.",
    "fxTtl.1h": "1 hour",
    "fxTtl.6h": "6 hours",
    "fxTtl.24h": "24 hours",
    "fxTtl.7d": "7 days",
    "prices.fxCached": "Cached rates: {provider}, {date}",
    "prices.fxCacheEmpty": "No cached rates yet \u2014 open any game page once.",
    "prices.fxClear": "Clear rates cache",
    "prices.regions": "Compared regions",
    "prices.regionsDesc": "Store regions to fetch prices for (up to 24).",
    "prices.display": "Display",
    "prices.showOriginal": "Original price",
    "prices.showDiscount": "Discount badge",
    "prices.showSavings": "Savings vs your price",
    "prices.highlightCheapest": "Highlight cheapest",
    "prices.showHomeRow": "Your price row",
    "prices.collapsed": "Start collapsed",
    "prices.collapsedDesc": "Collapse the comparison block by default to save space; expand it with the header toggle.",
    "prices.colRegion": "Region",
    "prices.colPrice": "Price",
    "prices.colDiscount": "Discount",
    "prices.colSavings": "Savings",
    "prices.yours": "Your price",
    "prices.cheapest": "Lowest",
    "prices.load": "Load prices",
    "prices.loading": "Loading prices\u2026",
    "prices.retry": "Retry",
    "prices.failed": "Could not load prices",
    "prices.noRegions": "Select at least one region in settings",
    "prices.updated": "Updated {time}",
    "prices.refresh": "Refresh prices",
    "prices.collapse": "Collapse block",
    "prices.expand": "Expand block",
    "prices.fxHint": "Exchange rates: {provider} ({date}).",
    "links.title": "External links",
    "links.desc": "Quick links to other stores and databases, right on the game page.",
    "links.enabled": "External links enabled",
    "links.enabledDesc": "Master switch for the external links block.",
    "links.position": "Block position",
    "links.positionDesc": "Where the links block appears on game pages.",
    "links.newTab": "Open in new tab",
    "links.newTabDesc": "Open external links in a new tab.",
    "links.list": "Links",
    "links.listDesc": "Links shown on game pages. Unresolvable templates are skipped.",
    "links.templateHelp": "URL template: use {name} for the game title and {appid} for the Steam id \u2014 e.g. https://store.epicgames.com/en-US/browse?q={name} or https://steamdb.info/app/{appid}/",
    "links.name": "Name",
    "links.namePlaceholder": "GOG",
    "links.url": "Link address",
    "links.urlPlaceholder": "https://www.gog.com/games?query={name}",
    "links.icon": "Icon address (optional)",
    "links.iconPlaceholder": "https://www.gog.com/favicon.ico",
    "links.add": "Add link",
    "links.remove": "Remove this link",
    "links.moveUp": "Move up",
    "links.moveDown": "Move down",
    "links.empty": "No links yet \u2014 add one below.",
    "links.restore": "Restore defaults",
    "links.preview": "Preview",
    "links.open": "Open",
    "region.title": "Region bypass",
    "region.desc": "Reload store pages blocked with \u201Cunavailable in your region\u201D via an anonymous guest fetch (no account cookies).",
    "region.enabled": "Region bypass enabled",
    "region.enabledDesc": "Master switch for reloading blocked store pages.",
    "region.showBanner": "Show notice banner",
    "region.showBannerDesc": "Show a notice that the page was loaded via an anonymous guest fetch. Hidden by default; applies on the next reload.",
    "region.mode": "On blocked pages",
    "region.modeDesc": "Automatic replaces the error page immediately; manual shows an offer button first.",
    "regionMode.auto": "Automatically",
    "regionMode.manual": "Via button",
    "region.country": "Store country (cc)",
    "region.countryDesc": "Optional two-letter store country override for guest requests. Empty keeps your own country.",
    "region.countryPlaceholder": "US",
    "region.proxy": "Proxy gateway",
    "region.proxyDesc": "For IP-based locks: route the anonymous fetch through an HTTP gateway in an unrestricted region.",
    "region.proxyEnabled": "Use proxy gateway",
    "region.proxyMode": "Gateway mode",
    "region.proxyModeDesc": "How the store URL is appended to host:port.",
    "regionProxyMode.gateway": "host:port/https://\u2026",
    "regionProxyMode.path": "host:port/store.steampowered.com/\u2026",
    "regionProxyMode.query": "host:port/?url=\u2026",
    "region.proxyHost": "Host",
    "region.proxyPort": "Port",
    "region.proxyUser": "Username",
    "region.proxyPass": "Password",
    "region.bannerBadge": "Region blocked",
    "region.bannerTitle": "This page is unavailable in your region",
    "region.bannerBody": "Shown via anonymous guest fetch (no account cookies)",
    "region.bannerViaProxy": "via proxy gateway",
    "region.reload": "Reload",
    "region.retry": "Retry",
    "region.offer": "This page is blocked in your region. Load the store page without account cookies?",
    "region.offerButton": "Show store page",
    "region.loading": "Loading store page without account cookies\u2026",
    "region.errorBlocked": "Still blocked by IP/region. Enable a proxy gateway in settings and point it to an unrestricted region.",
    "region.errorBlockedProxy": "Still blocked. The proxy IP is likely in a restricted region \u2014 try another exit node.",
    "region.errorAgeGate": "Steam returned an age gate. Press Retry \u2014 birthtime cookies are sent automatically.",
    "region.errorFailed": "Failed to load: {error}",
    "cache.usage": "Storage usage",
    "cache.contents": "Stored translations",
    "cache.clear": "Clear cache",
    "cache.cleared": "Cache cleared ({count})",
    "cache.empty": "Cache is empty",
    "cache.clearHint": "Removes all stored translations from this browser profile.",
    "cache.listEmpty": "No stored translations yet \u2014 translate something and it will appear here.",
    "cache.listMore": "\u2026and {count} more",
    "cache.removeEntry": "Remove this entry",
    "cache.entries": "{count} entries",
    "cache.used": "{used} in {count} entries",
    "cache.free": "Free",
    "cache.pct": "{pct}% full",
    "about.blurb": "Improves Steam store and community pages: content translation with caching, and more to come.",
    "about.repo": "GitHub",
    "about.repoHint": "Source code, updates, and issue reports",
    "toast.saved": "Settings saved",
    "toast.rateLimited": "Translation throttled",
    "toast.rateLimitedDesc": "Google is throttling requests right now. Blocks retry automatically \u2014 or press Retry later.",
    "toast.translateFailed": "Translation failed",
    "toast.translateFailedDesc": "Something went wrong. Press Retry on the block to try again.",
    "toast.unknownProvider": "Unknown translation provider",
    "toast.unknownProviderDesc": "Check the provider in settings and save again.",
    "toast.cacheCleared": "Target language changed \u2014 translation cache cleared.",
    "translate.button": "Translate",
    "translate.original": "Original",
    "translate.loading": "Translating...",
    "translate.loadingShort": "Translating",
    "translate.error": "Translation failed",
    "translate.retry": "Retry",
    "queue.addToWishlist": "Add to your wishlist",
    "queue.onWishlist": "On Wishlist",
    "queue.addedNotice": "Item added to your wishlist!",
    "queue.oops": "Oops, sorry!",
    "queue.follow": "Follow",
    "queue.following": "Following",
    "queue.ignore": "Ignore",
    "queue.ignored": "Ignored",
    "queue.viewQueue": "View Your Queue",
    "queue.manageWishlist": "Manage your wishlist",
    "queue.removeWishlist": "Remove from your wishlist",
    "queue.ignoreDefault": "Ignore This (Default)",
    "queue.ignoreDefaultSub": "Hide from store, ignore notifications, and don\u2019t use this to generate other recommendations.",
    "queue.playedElsewhere": "Played on Another Platform",
    "queue.playedElsewhereSub": "Hide from store. Can be used to generate recommendations.",
    "queue.actionFailed": "Could not save changes",
    "queue.actionFailedDesc": "There was a problem saving your changes. Please try again later."
  };

  // src/i18n/locales/ru.js
  var ru_default = {
    "menu.settings": "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 Steam Plus",
    "tab.general": "\u041E\u0431\u0449\u0438\u0435",
    "tab.translation": "\u041F\u0435\u0440\u0435\u0432\u043E\u0434",
    "tab.gamepage": "\u0421\u0442\u0440\u0430\u043D\u0438\u0446\u0430 \u0438\u0433\u0440\u044B",
    "tab.prices": "\u0426\u0435\u043D\u044B",
    "tab.cache": "\u041A\u044D\u0448",
    "tab.about": "\u041E \u0441\u043A\u0440\u0438\u043F\u0442\u0435",
    "tab.general.desc": "\u042F\u0437\u044B\u043A \u0438\u043D\u0442\u0435\u0440\u0444\u0435\u0439\u0441\u0430 \u0438 \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F.",
    "tab.translation.desc": "\u041F\u0435\u0440\u0435\u0432\u043E\u0434 \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0439, \u043E\u0431\u0437\u043E\u0440\u043E\u0432, \u043A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u0435\u0432 \u0438 \u043D\u043E\u0432\u043E\u0441\u0442\u0435\u0439.",
    "tab.gamepage.desc": "\u0421\u043A\u0440\u044B\u0432\u0430\u0439\u0442\u0435 \u043B\u0438\u0448\u043D\u0438\u0435 \u0431\u043B\u043E\u043A\u0438 \u043D\u0430 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430\u0445 \u0438\u0433\u0440.",
    "tab.prices.desc": "\u0421\u0440\u0430\u0432\u043D\u0435\u043D\u0438\u0435 \u0446\u0435\u043D \u043F\u043E \u0440\u0435\u0433\u0438\u043E\u043D\u0430\u043C \u0438 \u043A\u043E\u043D\u0432\u0435\u0440\u0442\u0430\u0446\u0438\u044F \u0432\u0430\u043B\u044E\u0442.",
    "tab.links": "\u0412\u043D\u0435\u0448\u043D\u0438\u0435 \u0441\u0441\u044B\u043B\u043A\u0438",
    "tab.links.desc": "\u0411\u044B\u0441\u0442\u0440\u044B\u0435 \u0441\u0441\u044B\u043B\u043A\u0438 \u043D\u0430 \u0434\u0440\u0443\u0433\u0438\u0435 \u043C\u0430\u0433\u0430\u0437\u0438\u043D\u044B \u0438 \u0431\u0430\u0437\u044B \u0434\u0430\u043D\u043D\u044B\u0445.",
    "tab.region": "\u0420\u0435\u0433\u0438\u043E\u043D",
    "tab.region.desc": "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0441\u0442\u0440\u0430\u043D\u0438\u0446 \u043C\u0430\u0433\u0430\u0437\u0438\u043D\u0430, \u0437\u0430\u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0445 \u0432 \u0432\u0430\u0448\u0435\u043C \u0440\u0435\u0433\u0438\u043E\u043D\u0435.",
    "tab.cache.desc": "\u0421\u043E\u0445\u0440\u0430\u043D\u0451\u043D\u043D\u044B\u0435 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u044B \u0438 \u0437\u0430\u043D\u044F\u0442\u043E\u0435 \u043C\u0435\u0441\u0442\u043E.",
    "tab.about.desc": "\u0412\u0435\u0440\u0441\u0438\u044F, \u0430\u0432\u0442\u043E\u0440 \u0438 \u0438\u0441\u0445\u043E\u0434\u043D\u044B\u0439 \u043A\u043E\u0434.",
    "panel.subtitle": "\u041F\u0435\u0440\u0435\u0432\u043E\u0434 \xB7 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430 \u0438\u0433\u0440\u044B \xB7 \u0446\u0435\u043D\u044B \xB7 \u0441\u0441\u044B\u043B\u043A\u0438 \xB7 \u0440\u0435\u0433\u0438\u043E\u043D \xB7 \u043A\u044D\u0448 \xB7 \u0438\u043D\u0442\u0435\u0440\u0444\u0435\u0439\u0441",
    "panel.back": "\u041D\u0430\u0437\u0430\u0434",
    "common.on": "\u0412\u043A\u043B.",
    "common.off": "\u0412\u044B\u043A\u043B.",
    "common.auto": "\u0410\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438",
    "common.close": "\u0417\u0430\u043A\u0440\u044B\u0442\u044C",
    "common.cancel": "\u041E\u0442\u043C\u0435\u043D\u0430",
    "common.save": "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C",
    "common.reset": "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438",
    "common.saved": "\u0421\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u043E",
    "common.settings": "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438",
    "general.language": "\u042F\u0437\u044B\u043A \u0438\u043D\u0442\u0435\u0440\u0444\u0435\u0439\u0441\u0430",
    "general.languageDesc": "\u042F\u0437\u044B\u043A \u043F\u0430\u043D\u0435\u043B\u0438 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043A Steam Plus.",
    "general.saveHint": "\u0418\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F \u043F\u0440\u0438\u043C\u0435\u043D\u044F\u0442\u0441\u044F \u043F\u043E\u0441\u043B\u0435 \u043D\u0430\u0436\u0430\u0442\u0438\u044F \xAB\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C\xBB \u0432\u043D\u0438\u0437\u0443.",
    "reset.confirm": "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u0432\u0441\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u043A \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u044F\u043C \u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E?",
    "general.toasts": "\u0423\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F",
    "toasts.enabled": "\u0412\u0441\u043F\u043B\u044B\u0432\u0430\u044E\u0449\u0438\u0435 \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F",
    "toasts.enabledDesc": "\u041F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C \u0432\u0441\u043F\u043B\u044B\u0432\u0430\u044E\u0449\u0438\u0435 \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F \u043E\u0431 \u0443\u0441\u043F\u0435\u0445\u0430\u0445 \u0438 \u043E\u0448\u0438\u0431\u043A\u0430\u0445 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043A \u0438 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0430.",
    "toasts.position": "\u041F\u043E\u043B\u043E\u0436\u0435\u043D\u0438\u0435 \u043D\u0430 \u044D\u043A\u0440\u0430\u043D\u0435",
    "toasts.duration": "\u0421\u043A\u0440\u044B\u0432\u0430\u0442\u044C \u0447\u0435\u0440\u0435\u0437 (\u0441\u0435\u043A\u0443\u043D\u0434)",
    "toasts.durationDesc": "0 \u2014 \u043D\u0435 \u0441\u043A\u0440\u044B\u0432\u0430\u0442\u044C \u0434\u043E \u0437\u0430\u043A\u0440\u044B\u0442\u0438\u044F \u0432\u0440\u0443\u0447\u043D\u0443\u044E.",
    "toastPos.bottom-right": "\u0421\u043F\u0440\u0430\u0432\u0430 \u0432\u043D\u0438\u0437\u0443",
    "toastPos.bottom-left": "\u0421\u043B\u0435\u0432\u0430 \u0432\u043D\u0438\u0437\u0443",
    "toastPos.top-right": "\u0421\u043F\u0440\u0430\u0432\u0430 \u0432\u0432\u0435\u0440\u0445\u0443",
    "toastPos.top-left": "\u0421\u043B\u0435\u0432\u0430 \u0432\u0432\u0435\u0440\u0445\u0443",
    "translation.title": "\u041F\u0435\u0440\u0435\u0432\u043E\u0434",
    "translation.behavior": "\u041F\u043E\u0432\u0435\u0434\u0435\u043D\u0438\u0435",
    "translation.desc": "\u041F\u0435\u0440\u0435\u0432\u043E\u0434 \u043A\u043E\u043D\u0442\u0435\u043D\u0442\u0430 Steam: \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0439, \u043E\u0442\u0437\u044B\u0432\u043E\u0432, \u043A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u0435\u0432 \u0438 \u043D\u043E\u0432\u043E\u0441\u0442\u0435\u0439.",
    "translation.enabled": "\u041F\u0435\u0440\u0435\u0432\u043E\u0434 \u0432\u043A\u043B\u044E\u0447\u0451\u043D",
    "translation.enabledDesc": "\u0413\u043B\u043E\u0431\u0430\u043B\u044C\u043D\u044B\u0439 \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0430\u0442\u0435\u043B\u044C \u0444\u0443\u043D\u043A\u0446\u0438\u0438 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0430.",
    "translation.provider": "\u041F\u0440\u043E\u0432\u0430\u0439\u0434\u0435\u0440 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0430",
    "translation.providerDesc": "\u0421\u0435\u0440\u0432\u0438\u0441, \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u043C\u044B\u0439 \u0434\u043B\u044F \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0430 \u0442\u0435\u043A\u0441\u0442\u043E\u0432.",
    "provider.google-free": "Google (\u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u044B\u0439)",
    "translation.trigger": "\u0420\u0435\u0436\u0438\u043C \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0430",
    "translation.triggerDesc": "\u041F\u0435\u0440\u0435\u0432\u043E\u0434\u0438\u0442\u044C \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438 \u043F\u0440\u0438 \u043F\u043E\u044F\u0432\u043B\u0435\u043D\u0438\u0438 \u043A\u043E\u043D\u0442\u0435\u043D\u0442\u0430 \u0438\u043B\u0438 \u043F\u043E \u043A\u043D\u043E\u043F\u043A\u0435.",
    "trigger.auto": "\u0410\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438",
    "trigger.manual": "\u041F\u043E \u043A\u043D\u043E\u043F\u043A\u0435",
    "translation.display": "\u041E\u0442\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0435 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0430",
    "translation.displayDesc": "\u0417\u0430\u043C\u0435\u043D\u044F\u0442\u044C \u043E\u0440\u0438\u0433\u0438\u043D\u0430\u043B\u044C\u043D\u044B\u0439 \u0442\u0435\u043A\u0441\u0442 \u0438\u043B\u0438 \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C \u043F\u0435\u0440\u0435\u0432\u043E\u0434 \u043F\u043E\u0434 \u043D\u0438\u043C.",
    "display.below": "\u041F\u043E\u0434 \u043E\u0440\u0438\u0433\u0438\u043D\u0430\u043B\u043E\u043C",
    "display.replace": "\u0417\u0430\u043C\u0435\u043D\u044F\u0442\u044C \u0442\u0435\u043A\u0441\u0442",
    "translation.targetLanguage": "\u042F\u0437\u044B\u043A \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0430",
    "translation.targetLanguageDesc": "\u041D\u0430 \u043A\u0430\u043A\u043E\u0439 \u044F\u0437\u044B\u043A \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0438\u0442\u044C \u043A\u043E\u043D\u0442\u0435\u043D\u0442.",
    "targetLanguage.auto": "\u041A\u0430\u043A \u0432 Steam / \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0435",
    "translation.showCached": "\u0421\u0440\u0430\u0437\u0443 \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C \u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D\u043D\u044B\u0435 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u044B",
    "translation.showCachedDesc": "\u0415\u0441\u043B\u0438 \u043F\u0435\u0440\u0435\u0432\u043E\u0434 \u0443\u0436\u0435 \u0435\u0441\u0442\u044C \u0432 \u043A\u044D\u0448\u0435, \u043F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u0435\u0433\u043E \u0441\u0440\u0430\u0437\u0443 \u0431\u0435\u0437 \u043D\u0430\u0436\u0430\u0442\u0438\u044F \u043A\u043D\u043E\u043F\u043A\u0438.",
    "translation.scopes": "\u0427\u0442\u043E \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0438\u0442\u044C",
    "translation.scopesDesc": "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0442\u0438\u043F\u044B \u043A\u043E\u043D\u0442\u0435\u043D\u0442\u0430, \u043A\u043E\u0442\u043E\u0440\u044B\u0435 \u043D\u0443\u0436\u043D\u043E \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0438\u0442\u044C.",
    "scope.gameDescription": "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u044F \u0438\u0433\u0440",
    "scope.gameReviews": "\u041E\u0442\u0437\u044B\u0432\u044B \u043A \u0438\u0433\u0440\u0430\u043C",
    "scope.profileComments": "\u041A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u0438 \u0432 \u043F\u0440\u043E\u0444\u0438\u043B\u0435",
    "scope.gameNews": "\u041D\u043E\u0432\u043E\u0441\u0442\u0438 \u0438 \u0441\u043E\u0431\u044B\u0442\u0438\u044F",
    "gamepage.title": "\u0421\u0442\u0440\u0430\u043D\u0438\u0446\u0430 \u0438\u0433\u0440\u044B",
    "gamepage.desc": "\u041D\u0430\u0432\u0435\u0434\u0438\u0442\u0435 \u043F\u043E\u0440\u044F\u0434\u043E\u043A \u043D\u0430 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430\u0445 \u0438\u0433\u0440 Steam: \u0441\u043A\u0440\u044B\u0432\u0430\u0439\u0442\u0435 \u043D\u0435\u043D\u0443\u0436\u043D\u044B\u0435 \u0431\u043B\u043E\u043A\u0438.",
    "gamepage.enabled": "\u0421\u043A\u0440\u044B\u0432\u0430\u0442\u044C \u0431\u043B\u043E\u043A\u0438 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B \u0438\u0433\u0440\u044B",
    "gamepage.enabledDesc": "\u0413\u043B\u0430\u0432\u043D\u044B\u0439 \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0430\u0442\u0435\u043B\u044C \u0441\u043A\u0440\u044B\u0442\u0438\u044F \u0431\u043B\u043E\u043A\u043E\u0432 \u043D\u0430 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430\u0445 \u0438\u0433\u0440.",
    "gamepage.blocks": "\u0421\u043A\u0440\u044B\u0442\u044B\u0435 \u0431\u043B\u043E\u043A\u0438",
    "gamepage.blocksDesc": "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0431\u043B\u043E\u043A\u0438, \u043A\u043E\u0442\u043E\u0440\u044B\u0435 \u043D\u0443\u0436\u043D\u043E \u0441\u043A\u0440\u044B\u0432\u0430\u0442\u044C \u043D\u0430 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430\u0445 \u0438\u0433\u0440 (\u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0439 \u043C\u0430\u0433\u0430\u0437\u0438\u043D\u0430).",
    "block.media": "\u0421\u043A\u0440\u0438\u043D\u0448\u043E\u0442\u044B \u0438 \u0442\u0440\u0435\u0439\u043B\u0435\u0440\u044B",
    "block.purchase": "\u0412\u0430\u0440\u0438\u0430\u043D\u0442\u044B \u043F\u043E\u043A\u0443\u043F\u043A\u0438 \u0438 \u043D\u0430\u0431\u043E\u0440\u044B",
    "block.description": "\u041E\u0431 \u0438\u0433\u0440\u0435",
    "block.dlc": "\u041A\u043E\u043D\u0442\u0435\u043D\u0442 \u0434\u043B\u044F \u0438\u0433\u0440\u044B (DLC)",
    "block.sysreq": "\u0421\u0438\u0441\u0442\u0435\u043C\u043D\u044B\u0435 \u0442\u0440\u0435\u0431\u043E\u0432\u0430\u043D\u0438\u044F",
    "block.reviews": "\u041E\u0442\u0437\u044B\u0432\u044B \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0435\u0439",
    "block.curators": "\u041C\u043D\u0435\u043D\u0438\u0435 \u043A\u0443\u0440\u0430\u0442\u043E\u0440\u043E\u0432",
    "block.events": "\u0421\u043E\u0431\u044B\u0442\u0438\u044F \u0438 \u0430\u043D\u043E\u043D\u0441\u044B",
    "block.details": "\u0414\u0435\u0442\u0430\u043B\u0438 \u0438 \u0431\u043E\u043A\u043E\u0432\u0430\u044F \u043F\u0430\u043D\u0435\u043B\u044C",
    "block.recommendations": "\u0424\u0440\u0430\u043D\u0448\u0438\u0437\u0430 \u0438 \u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0430\u0446\u0438\u0438",
    "block.sale": "\u0411\u0430\u043D\u043D\u0435\u0440 \u0441\u043E\u0431\u044B\u0442\u0438\u044F \u0440\u0430\u0441\u043F\u0440\u043E\u0434\u0430\u0436\u0438",
    "block.edition": "\u0421\u043E\u0441\u0442\u0430\u0432 \u0438\u0437\u0434\u0430\u043D\u0438\u0439 \u0438 \u043A\u043E\u043C\u043F\u043B\u0435\u043A\u0442\u043E\u0432",
    "prices.title": "\u0420\u0435\u0433\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0435 \u0446\u0435\u043D\u044B",
    "prices.desc": "\u0421\u0440\u0430\u0432\u043D\u0438\u0432\u0430\u0439\u0442\u0435 \u0446\u0435\u043D\u0443 \u0438\u0433\u0440\u044B \u0432 \u0440\u0430\u0437\u043D\u044B\u0445 \u0440\u0435\u0433\u0438\u043E\u043D\u0430\u0445 Steam \u043F\u0440\u044F\u043C\u043E \u043D\u0430 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0435 \u0438\u0433\u0440\u044B.",
    "prices.enabled": "\u0420\u0435\u0433\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0435 \u0446\u0435\u043D\u044B \u0432\u043A\u043B\u044E\u0447\u0435\u043D\u044B",
    "prices.enabledDesc": "\u0413\u043B\u0430\u0432\u043D\u044B\u0439 \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0430\u0442\u0435\u043B\u044C \u0431\u043B\u043E\u043A\u0430 \u0441\u0440\u0430\u0432\u043D\u0435\u043D\u0438\u044F \u0440\u0435\u0433\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0445 \u0446\u0435\u043D.",
    "prices.autoLoad": "\u0417\u0430\u0433\u0440\u0443\u0436\u0430\u0442\u044C \u0446\u0435\u043D\u044B \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438",
    "prices.autoLoadDesc": "\u0415\u0441\u043B\u0438 \u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D\u043E, \u043D\u0430 \u043A\u0430\u0436\u0434\u043E\u0439 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0435 \u0438\u0433\u0440\u044B \u0431\u0443\u0434\u0435\u0442 \u043A\u043D\u043E\u043F\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438.",
    "prices.position": "\u041F\u043E\u043B\u043E\u0436\u0435\u043D\u0438\u0435 \u0431\u043B\u043E\u043A\u0430",
    "prices.positionDesc": "\u0413\u0434\u0435 \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C \u0431\u043B\u043E\u043A \u0441\u0440\u0430\u0432\u043D\u0435\u043D\u0438\u044F \u043D\u0430 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430\u0445 \u0438\u0433\u0440.",
    "pricesPos.purchase": "\u041D\u0430\u0434 \u0432\u0430\u0440\u0438\u0430\u043D\u0442\u0430\u043C\u0438 \u043F\u043E\u043A\u0443\u043F\u043A\u0438",
    "pricesPos.sidebar": "\u0411\u043E\u043A\u043E\u0432\u0430\u044F \u043F\u0430\u043D\u0435\u043B\u044C",
    "pricesPos.description": "\u041F\u043E\u0434 \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0435\u043C",
    "prices.sort": "\u041F\u043E\u0440\u044F\u0434\u043E\u043A \u0441\u0442\u0440\u043E\u043A",
    "prices.sortDesc": "\u041F\u043E\u0440\u044F\u0434\u043E\u043A \u043F\u043E \u0446\u0435\u043D\u0435 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442 \u043F\u0440\u0438\u043C\u0435\u0440\u043D\u044B\u0435 \u043A\u0443\u0440\u0441\u044B \u0432\u0430\u043B\u044E\u0442.",
    "pricesSort.custom": "\u041A\u0430\u043A \u0432 \u0441\u043F\u0438\u0441\u043A\u0435",
    "pricesSort.priceAsc": "\u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u0434\u0435\u0448\u0435\u0432\u043B\u0435",
    "pricesSort.discountDesc": "\u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u0431\u043E\u043B\u044C\u0448\u0435 \u0441\u043A\u0438\u0434\u043A\u0430",
    "prices.conversion": "\u041A\u043E\u043D\u0432\u0435\u0440\u0442\u0430\u0446\u0438\u044F \u0432\u0430\u043B\u044E\u0442",
    "prices.conversionDesc": "\u041F\u0435\u0440\u0435\u0441\u0447\u0438\u0442\u044B\u0432\u0430\u0442\u044C \u0432\u0441\u0435 \u0446\u0435\u043D\u044B \u0432 \u043E\u0434\u043D\u0443 \u0432\u0430\u043B\u044E\u0442\u0443 \u043F\u043E \u0436\u0438\u0432\u043E\u043C\u0443 \u043A\u0443\u0440\u0441\u0443.",
    "prices.convertTo": "\u0412\u0430\u043B\u044E\u0442\u0430 \u043E\u0442\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F",
    "prices.convertToDesc": "\u0410\u0432\u0442\u043E \u2014 \u0432\u0430\u043B\u044E\u0442\u0430 \u043C\u0430\u0433\u0430\u0437\u0438\u043D\u0430, \u043A\u043E\u0442\u043E\u0440\u044B\u0439 \u0432\u044B \u043F\u0440\u043E\u0441\u043C\u0430\u0442\u0440\u0438\u0432\u0430\u0435\u0442\u0435.",
    "convertTo.auto": "\u0410\u0432\u0442\u043E (\u0432\u0430\u043B\u044E\u0442\u0430 \u0432\u0430\u0448\u0435\u0433\u043E \u043C\u0430\u0433\u0430\u0437\u0438\u043D\u0430)",
    "convertTo.off": "\u0412\u044B\u043A\u043B (\u0431\u0435\u0437 \u043A\u043E\u043D\u0432\u0435\u0440\u0442\u0430\u0446\u0438\u0438)",
    "prices.showConverted": "\u041F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C \u0446\u0435\u043D\u0443 \u0432 \u043F\u0435\u0440\u0435\u0441\u0447\u0451\u0442\u0435",
    "prices.fxCache": "\u0412\u0440\u0435\u043C\u044F \u0436\u0438\u0437\u043D\u0438 \u043A\u044D\u0448\u0430 \u043A\u0443\u0440\u0441\u043E\u0432",
    "prices.fxCacheDesc": "\u041A\u0430\u043A \u0434\u043E\u043B\u0433\u043E \u043F\u0435\u0440\u0435\u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C \u043A\u0443\u0440\u0441\u044B \u0432\u0430\u043B\u044E\u0442 \u0434\u043E \u043D\u043E\u0432\u043E\u0433\u043E \u0437\u0430\u043F\u0440\u043E\u0441\u0430.",
    "fxTtl.1h": "1 \u0447\u0430\u0441",
    "fxTtl.6h": "6 \u0447\u0430\u0441\u043E\u0432",
    "fxTtl.24h": "24 \u0447\u0430\u0441\u0430",
    "fxTtl.7d": "7 \u0434\u043D\u0435\u0439",
    "prices.fxCached": "\u041A\u044D\u0448 \u043A\u0443\u0440\u0441\u043E\u0432: {provider}, {date}",
    "prices.fxCacheEmpty": "\u041A\u044D\u0448\u0430 \u043A\u0443\u0440\u0441\u043E\u0432 \u043F\u043E\u043A\u0430 \u043D\u0435\u0442 \u2014 \u043E\u0442\u043A\u0440\u043E\u0439\u0442\u0435 \u043B\u044E\u0431\u0443\u044E \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0443 \u0438\u0433\u0440\u044B.",
    "prices.fxClear": "\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C \u043A\u044D\u0448 \u043A\u0443\u0440\u0441\u043E\u0432",
    "prices.regions": "\u0421\u0440\u0430\u0432\u043D\u0438\u0432\u0430\u0435\u043C\u044B\u0435 \u0440\u0435\u0433\u0438\u043E\u043D\u044B",
    "prices.regionsDesc": "\u0420\u0435\u0433\u0438\u043E\u043D\u044B \u043C\u0430\u0433\u0430\u0437\u0438\u043D\u0430, \u0434\u043B\u044F \u043A\u043E\u0442\u043E\u0440\u044B\u0445 \u0437\u0430\u0433\u0440\u0443\u0436\u0430\u0442\u044C \u0446\u0435\u043D\u044B (\u0434\u043E 24).",
    "prices.display": "\u041E\u0442\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0435",
    "prices.showOriginal": "\u0418\u0441\u0445\u043E\u0434\u043D\u0430\u044F \u0446\u0435\u043D\u0430",
    "prices.showDiscount": "\u0411\u0435\u0439\u0434\u0436 \u0441\u043A\u0438\u0434\u043A\u0438",
    "prices.showSavings": "\u0412\u044B\u0433\u043E\u0434\u0430 \u043E\u0442\u043D\u043E\u0441\u0438\u0442\u0435\u043B\u044C\u043D\u043E \u0432\u0430\u0448\u0435\u0439 \u0446\u0435\u043D\u044B",
    "prices.highlightCheapest": "\u0412\u044B\u0434\u0435\u043B\u044F\u0442\u044C \u0434\u0435\u0448\u0435\u0432\u043B\u0435 \u0432\u0441\u0435\u0433\u043E",
    "prices.showHomeRow": "\u0421\u0442\u0440\u043E\u043A\u0430 \u0432\u0430\u0448\u0435\u0439 \u0446\u0435\u043D\u044B",
    "prices.collapsed": "\u0421\u0432\u043E\u0440\u0430\u0447\u0438\u0432\u0430\u0442\u044C \u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E",
    "prices.collapsedDesc": "\u0411\u043B\u043E\u043A \u0441\u0440\u0430\u0432\u043D\u0435\u043D\u0438\u044F \u0441\u0432\u0451\u0440\u043D\u0443\u0442 \u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E, \u0447\u0442\u043E\u0431\u044B \u0437\u0430\u043D\u0438\u043C\u0430\u0442\u044C \u043C\u0435\u043D\u044C\u0448\u0435 \u043C\u0435\u0441\u0442\u0430; \u0440\u0430\u0437\u0432\u043E\u0440\u0430\u0447\u0438\u0432\u0430\u0435\u0442\u0441\u044F \u043A\u043D\u043E\u043F\u043A\u043E\u0439 \u0432 \u0437\u0430\u0433\u043E\u043B\u043E\u0432\u043A\u0435.",
    "prices.colRegion": "\u0420\u0435\u0433\u0438\u043E\u043D",
    "prices.colPrice": "\u0426\u0435\u043D\u0430",
    "prices.colDiscount": "\u0421\u043A\u0438\u0434\u043A\u0430",
    "prices.colSavings": "\u0412\u044B\u0433\u043E\u0434\u0430",
    "prices.yours": "\u0412\u0430\u0448\u0430 \u0446\u0435\u043D\u0430",
    "prices.cheapest": "\u0414\u0435\u0448\u0435\u0432\u043B\u0435 \u0432\u0441\u0435\u0433\u043E",
    "prices.load": "\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0446\u0435\u043D\u044B",
    "prices.loading": "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0446\u0435\u043D\u2026",
    "prices.retry": "\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C",
    "prices.failed": "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0446\u0435\u043D\u044B",
    "prices.noRegions": "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0445\u043E\u0442\u044F \u0431\u044B \u043E\u0434\u0438\u043D \u0440\u0435\u0433\u0438\u043E\u043D \u0432 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430\u0445",
    "prices.updated": "\u041E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u043E \u0432 {time}",
    "prices.refresh": "\u041E\u0431\u043D\u043E\u0432\u0438\u0442\u044C \u0446\u0435\u043D\u044B",
    "prices.collapse": "\u0421\u0432\u0435\u0440\u043D\u0443\u0442\u044C \u0431\u043B\u043E\u043A",
    "prices.expand": "\u0420\u0430\u0437\u0432\u0435\u0440\u043D\u0443\u0442\u044C \u0431\u043B\u043E\u043A",
    "prices.fxHint": "\u041A\u0443\u0440\u0441\u044B \u0432\u0430\u043B\u044E\u0442: {provider} ({date}).",
    "links.title": "\u0412\u043D\u0435\u0448\u043D\u0438\u0435 \u0441\u0441\u044B\u043B\u043A\u0438",
    "links.desc": "\u0411\u044B\u0441\u0442\u0440\u044B\u0435 \u0441\u0441\u044B\u043B\u043A\u0438 \u043D\u0430 \u0434\u0440\u0443\u0433\u0438\u0435 \u043C\u0430\u0433\u0430\u0437\u0438\u043D\u044B \u0438 \u0431\u0430\u0437\u044B \u0434\u0430\u043D\u043D\u044B\u0445 \u043F\u0440\u044F\u043C\u043E \u043D\u0430 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0435 \u0438\u0433\u0440\u044B.",
    "links.enabled": "\u0412\u043D\u0435\u0448\u043D\u0438\u0435 \u0441\u0441\u044B\u043B\u043A\u0438 \u0432\u043A\u043B\u044E\u0447\u0435\u043D\u044B",
    "links.enabledDesc": "\u0413\u043B\u0430\u0432\u043D\u044B\u0439 \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0430\u0442\u0435\u043B\u044C \u0431\u043B\u043E\u043A\u0430 \u0432\u043D\u0435\u0448\u043D\u0438\u0445 \u0441\u0441\u044B\u043B\u043E\u043A.",
    "links.position": "\u041F\u043E\u043B\u043E\u0436\u0435\u043D\u0438\u0435 \u0431\u043B\u043E\u043A\u0430",
    "links.positionDesc": "\u0413\u0434\u0435 \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C \u0431\u043B\u043E\u043A \u0441\u0441\u044B\u043B\u043E\u043A \u043D\u0430 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430\u0445 \u0438\u0433\u0440.",
    "links.newTab": "\u041E\u0442\u043A\u0440\u044B\u0432\u0430\u0442\u044C \u0432 \u043D\u043E\u0432\u043E\u0439 \u0432\u043A\u043B\u0430\u0434\u043A\u0435",
    "links.newTabDesc": "\u041E\u0442\u043A\u0440\u044B\u0432\u0430\u0442\u044C \u0432\u043D\u0435\u0448\u043D\u0438\u0435 \u0441\u0441\u044B\u043B\u043A\u0438 \u0432 \u043D\u043E\u0432\u043E\u0439 \u0432\u043A\u043B\u0430\u0434\u043A\u0435.",
    "links.list": "\u0421\u0441\u044B\u043B\u043A\u0438",
    "links.listDesc": "\u0421\u0441\u044B\u043B\u043A\u0438 \u043D\u0430 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430\u0445 \u0438\u0433\u0440. \u041D\u0435\u0440\u0430\u0431\u043E\u0447\u0438\u0435 \u0448\u0430\u0431\u043B\u043E\u043D\u044B \u043F\u0440\u043E\u043F\u0443\u0441\u043A\u0430\u044E\u0442\u0441\u044F.",
    "links.templateHelp": "\u0428\u0430\u0431\u043B\u043E\u043D \u0430\u0434\u0440\u0435\u0441\u0430: {name} \u2014 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0438\u0433\u0440\u044B, {appid} \u2014 id \u0432 Steam. \u041D\u0430\u043F\u0440\u0438\u043C\u0435\u0440: https://store.epicgames.com/en-US/browse?q={name} \u0438\u043B\u0438 https://steamdb.info/app/{appid}/",
    "links.name": "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435",
    "links.namePlaceholder": "GOG",
    "links.url": "\u0410\u0434\u0440\u0435\u0441 \u0441\u0441\u044B\u043B\u043A\u0438",
    "links.urlPlaceholder": "https://www.gog.com/games?query={name}",
    "links.icon": "\u0410\u0434\u0440\u0435\u0441 \u0438\u043A\u043E\u043D\u043A\u0438 (\u043D\u0435\u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E)",
    "links.iconPlaceholder": "https://www.gog.com/favicon.ico",
    "links.add": "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0441\u0441\u044B\u043B\u043A\u0443",
    "links.remove": "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u0441\u0441\u044B\u043B\u043A\u0443",
    "links.moveUp": "\u041F\u0435\u0440\u0435\u043C\u0435\u0441\u0442\u0438\u0442\u044C \u0432\u044B\u0448\u0435",
    "links.moveDown": "\u041F\u0435\u0440\u0435\u043C\u0435\u0441\u0442\u0438\u0442\u044C \u043D\u0438\u0436\u0435",
    "links.empty": "\u041F\u043E\u043A\u0430 \u043D\u0435\u0442 \u0441\u0441\u044B\u043B\u043E\u043A \u2014 \u0434\u043E\u0431\u0430\u0432\u044C\u0442\u0435 \u043D\u0438\u0436\u0435.",
    "links.restore": "\u0412\u0435\u0440\u043D\u0443\u0442\u044C \u0441\u0442\u0430\u043D\u0434\u0430\u0440\u0442\u043D\u044B\u0435",
    "links.preview": "\u041F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440",
    "links.open": "\u041E\u0442\u043A\u0440\u044B\u0442\u044C",
    "region.title": "\u041E\u0431\u0445\u043E\u0434 \u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u043A\u0438",
    "region.desc": "\u041F\u0435\u0440\u0435\u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0441\u0442\u0440\u0430\u043D\u0438\u0446 \u043C\u0430\u0433\u0430\u0437\u0438\u043D\u0430 \u0441 \u043E\u0448\u0438\u0431\u043A\u043E\u0439 \xAB\u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u043E \u0432 \u0432\u0430\u0448\u0435\u043C \u0440\u0435\u0433\u0438\u043E\u043D\u0435\xBB \u0447\u0435\u0440\u0435\u0437 \u0430\u043D\u043E\u043D\u0438\u043C\u043D\u044B\u0439 \u0433\u043E\u0441\u0442\u0435\u0432\u043E\u0439 \u0437\u0430\u043F\u0440\u043E\u0441 (\u0431\u0435\u0437 cookies \u0430\u043A\u043A\u0430\u0443\u043D\u0442\u0430).",
    "region.enabled": "\u041E\u0431\u0445\u043E\u0434 \u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u043A\u0438 \u0432\u043A\u043B\u044E\u0447\u0451\u043D",
    "region.enabledDesc": "\u0413\u043B\u0430\u0432\u043D\u044B\u0439 \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0430\u0442\u0435\u043B\u044C \u043F\u0435\u0440\u0435\u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u0437\u0430\u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0445 \u0441\u0442\u0440\u0430\u043D\u0438\u0446.",
    "region.showBanner": "\u041F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C \u043F\u043B\u0430\u0448\u043A\u0443-\u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u0435",
    "region.showBannerDesc": "\u041F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0435\u0442, \u0447\u0442\u043E \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430 \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D\u0430 \u0447\u0435\u0440\u0435\u0437 \u0430\u043D\u043E\u043D\u0438\u043C\u043D\u044B\u0439 \u0433\u043E\u0441\u0442\u0435\u0432\u043E\u0439 \u0437\u0430\u043F\u0440\u043E\u0441. \u041F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E \u0441\u043A\u0440\u044B\u0442\u0430; \u043F\u0440\u0438\u043C\u0435\u043D\u044F\u0435\u0442\u0441\u044F \u043F\u043E\u0441\u043B\u0435 \u043F\u0435\u0440\u0435\u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438.",
    "region.mode": "\u041D\u0430 \u0437\u0430\u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0445 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430\u0445",
    "region.modeDesc": "\u0410\u0432\u0442\u043E \u0441\u0440\u0430\u0437\u0443 \u0437\u0430\u043C\u0435\u043D\u044F\u0435\u0442 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0443 \u043E\u0448\u0438\u0431\u043A\u0438; \u0432\u0440\u0443\u0447\u043D\u0443\u044E \u2014 \u0441\u043D\u0430\u0447\u0430\u043B\u0430 \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0435\u0442 \u043A\u043D\u043E\u043F\u043A\u0443.",
    "regionMode.auto": "\u0410\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438",
    "regionMode.manual": "\u041F\u043E \u043A\u043D\u043E\u043F\u043A\u0435",
    "region.country": "\u0421\u0442\u0440\u0430\u043D\u0430 \u043C\u0430\u0433\u0430\u0437\u0438\u043D\u0430 (cc)",
    "region.countryDesc": "\u041D\u0435\u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u044B\u0439 \u0434\u0432\u0443\u0445\u0431\u0443\u043A\u0432\u0435\u043D\u043D\u044B\u0439 \u043A\u043E\u0434 \u0441\u0442\u0440\u0430\u043D\u044B \u0434\u043B\u044F \u0433\u043E\u0441\u0442\u0435\u0432\u044B\u0445 \u0437\u0430\u043F\u0440\u043E\u0441\u043E\u0432. \u041F\u0443\u0441\u0442\u043E \u2014 \u0432\u0430\u0448\u0430 \u0441\u0442\u0440\u0430\u043D\u0430.",
    "region.countryPlaceholder": "US",
    "region.proxy": "\u041F\u0440\u043E\u043A\u0441\u0438-\u0448\u043B\u044E\u0437",
    "region.proxyDesc": "\u041F\u0440\u0438 IP-\u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u043A\u0435: \u043D\u0430\u043F\u0440\u0430\u0432\u043B\u044F\u0442\u044C \u0430\u043D\u043E\u043D\u0438\u043C\u043D\u044B\u0439 \u0437\u0430\u043F\u0440\u043E\u0441 \u0447\u0435\u0440\u0435\u0437 HTTP-\u0448\u043B\u044E\u0437 \u0432 \u043E\u0442\u043A\u0440\u044B\u0442\u043E\u043C \u0440\u0435\u0433\u0438\u043E\u043D\u0435.",
    "region.proxyEnabled": "\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C \u043F\u0440\u043E\u043A\u0441\u0438-\u0448\u043B\u044E\u0437",
    "region.proxyMode": "\u0420\u0435\u0436\u0438\u043C \u0448\u043B\u044E\u0437\u0430",
    "region.proxyModeDesc": "\u041A\u0430\u043A \u0430\u0434\u0440\u0435\u0441 \u043C\u0430\u0433\u0430\u0437\u0438\u043D\u0430 \u0434\u043E\u0431\u0430\u0432\u043B\u044F\u0435\u0442\u0441\u044F \u043A host:port.",
    "regionProxyMode.gateway": "host:port/https://\u2026",
    "regionProxyMode.path": "host:port/store.steampowered.com/\u2026",
    "regionProxyMode.query": "host:port/?url=\u2026",
    "region.proxyHost": "\u0425\u043E\u0441\u0442",
    "region.proxyPort": "\u041F\u043E\u0440\u0442",
    "region.proxyUser": "\u0418\u043C\u044F \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F",
    "region.proxyPass": "\u041F\u0430\u0440\u043E\u043B\u044C",
    "region.bannerBadge": "\u0420\u0435\u0433\u0438\u043E\u043D \u0437\u0430\u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u0430\u043D",
    "region.bannerTitle": "\u0421\u0442\u0440\u0430\u043D\u0438\u0446\u0430 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u0430 \u0432 \u0432\u0430\u0448\u0435\u043C \u0440\u0435\u0433\u0438\u043E\u043D\u0435",
    "region.bannerBody": "\u041F\u043E\u043A\u0430\u0437\u0430\u043D\u043E \u0447\u0435\u0440\u0435\u0437 \u0430\u043D\u043E\u043D\u0438\u043C\u043D\u044B\u0439 \u0433\u043E\u0441\u0442\u0435\u0432\u043E\u0439 \u0437\u0430\u043F\u0440\u043E\u0441 (\u0431\u0435\u0437 cookies \u0430\u043A\u043A\u0430\u0443\u043D\u0442\u0430)",
    "region.bannerViaProxy": "\u0447\u0435\u0440\u0435\u0437 \u043F\u0440\u043E\u043A\u0441\u0438-\u0448\u043B\u044E\u0437",
    "region.reload": "\u041E\u0431\u043D\u043E\u0432\u0438\u0442\u044C",
    "region.retry": "\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C",
    "region.offer": "\u0421\u0442\u0440\u0430\u043D\u0438\u0446\u0430 \u0437\u0430\u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u0430\u043D\u0430 \u0432 \u0432\u0430\u0448\u0435\u043C \u0440\u0435\u0433\u0438\u043E\u043D\u0435. \u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0435\u0451 \u0431\u0435\u0437 cookies \u0430\u043A\u043A\u0430\u0443\u043D\u0442\u0430?",
    "region.offerButton": "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0443",
    "region.loading": "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B \u0431\u0435\u0437 cookies \u0430\u043A\u043A\u0430\u0443\u043D\u0442\u0430\u2026",
    "region.errorBlocked": "\u0412\u0441\u0451 \u0435\u0449\u0451 \u0437\u0430\u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u0430\u043D\u043E \u043F\u043E IP/\u0440\u0435\u0433\u0438\u043E\u043D\u0443. \u0412\u043A\u043B\u044E\u0447\u0438\u0442\u0435 \u043F\u0440\u043E\u043A\u0441\u0438-\u0448\u043B\u044E\u0437 \u0438 \u043D\u0430\u043F\u0440\u0430\u0432\u044C\u0442\u0435 \u0435\u0433\u043E \u0432 \u043E\u0442\u043A\u0440\u044B\u0442\u044B\u0439 \u0440\u0435\u0433\u0438\u043E\u043D.",
    "region.errorBlockedProxy": "\u0412\u0441\u0451 \u0435\u0449\u0451 \u0437\u0430\u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u0430\u043D\u043E. IP \u043F\u0440\u043E\u043A\u0441\u0438, \u0432\u0435\u0440\u043E\u044F\u0442\u043D\u043E, \u0442\u043E\u0436\u0435 \u0432 \u0437\u0430\u043A\u0440\u044B\u0442\u043E\u043C \u0440\u0435\u0433\u0438\u043E\u043D\u0435 \u2014 \u043F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0434\u0440\u0443\u0433\u0443\u044E \u0442\u043E\u0447\u043A\u0443 \u0432\u044B\u0445\u043E\u0434\u0430.",
    "region.errorAgeGate": "Steam \u043F\u043E\u043A\u0430\u0437\u0430\u043B \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0443 \u0432\u043E\u0437\u0440\u0430\u0441\u0442\u0430. \u041D\u0430\u0436\u043C\u0438\u0442\u0435 \xAB\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C\xBB \u2014 cookies \u0432\u043E\u0437\u0440\u0430\u0441\u0442\u0430 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u044F\u044E\u0442\u0441\u044F \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438.",
    "region.errorFailed": "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C: {error}",
    "cache.usage": "\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u0438\u0435 \u0445\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0430",
    "cache.contents": "\u0421\u043E\u0445\u0440\u0430\u043D\u0451\u043D\u043D\u044B\u0435 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u044B",
    "cache.clear": "\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C \u043A\u044D\u0448",
    "cache.cleared": "\u041A\u044D\u0448 \u043E\u0447\u0438\u0449\u0435\u043D ({count})",
    "cache.empty": "\u041A\u044D\u0448 \u043F\u0443\u0441\u0442",
    "cache.clearHint": "\u0423\u0434\u0430\u043B\u044F\u0435\u0442 \u0432\u0441\u0435 \u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D\u043D\u044B\u0435 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u044B \u0438\u0437 \u044D\u0442\u043E\u0433\u043E \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0430.",
    "cache.listEmpty": "\u041F\u043E\u043A\u0430 \u043D\u0435\u0442 \u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D\u043D\u044B\u0445 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u043E\u0432 \u2014 \u043F\u0435\u0440\u0435\u0432\u0435\u0434\u0438\u0442\u0435 \u0447\u0442\u043E-\u043D\u0438\u0431\u0443\u0434\u044C, \u0438 \u043E\u043D\u043E \u043F\u043E\u044F\u0432\u0438\u0442\u0441\u044F \u0437\u0434\u0435\u0441\u044C.",
    "cache.listMore": "\u2026\u0438 \u0435\u0449\u0451 {count}",
    "cache.removeEntry": "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u044D\u0442\u0443 \u0437\u0430\u043F\u0438\u0441\u044C",
    "cache.entries": "\u0417\u0430\u043F\u0438\u0441\u0435\u0439: {count}",
    "cache.used": "{used} \u0432 {count} \u0437\u0430\u043F\u0438\u0441\u044F\u0445",
    "cache.free": "\u0421\u0432\u043E\u0431\u043E\u0434\u043D\u043E",
    "cache.pct": "\u0417\u0430\u043F\u043E\u043B\u043D\u0435\u043D\u043E \u043D\u0430 {pct}%",
    "about.blurb": "\u0423\u043B\u0443\u0447\u0448\u0430\u0435\u0442 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B \u043C\u0430\u0433\u0430\u0437\u0438\u043D\u0430 \u0438 \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u0430 Steam: \u043F\u0435\u0440\u0435\u0432\u043E\u0434 \u043A\u043E\u043D\u0442\u0435\u043D\u0442\u0430 \u0441 \u043A\u044D\u0448\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435\u043C, \u0434\u0430\u043B\u044C\u0448\u0435 \u2014 \u0431\u043E\u043B\u044C\u0448\u0435.",
    "about.repo": "GitHub",
    "about.repoHint": "\u0418\u0441\u0445\u043E\u0434\u043D\u044B\u0439 \u043A\u043E\u0434, \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F \u0438 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F \u043E\u0431 \u043E\u0448\u0438\u0431\u043A\u0430\u0445",
    "toast.saved": "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u044B",
    "toast.rateLimited": "\u041F\u0435\u0440\u0435\u0432\u043E\u0434 \u0432\u0440\u0435\u043C\u0435\u043D\u043D\u043E \u043E\u0433\u0440\u0430\u043D\u0438\u0447\u0435\u043D",
    "toast.rateLimitedDesc": "Google \u0432\u0440\u0435\u043C\u0435\u043D\u043D\u043E \u043E\u0433\u0440\u0430\u043D\u0438\u0447\u0438\u0432\u0430\u0435\u0442 \u0437\u0430\u043F\u0440\u043E\u0441\u044B. \u0411\u043B\u043E\u043A\u0438 \u043F\u043E\u0432\u0442\u043E\u0440\u044F\u0442 \u043F\u043E\u043F\u044B\u0442\u043A\u0443 \u0441\u0430\u043C\u0438 \u2014 \u0438\u043B\u0438 \u043D\u0430\u0436\u043C\u0438\u0442\u0435 \xAB\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C\xBB \u043F\u043E\u0437\u0436\u0435.",
    "toast.translateFailed": "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0430",
    "toast.translateFailedDesc": "\u0427\u0442\u043E-\u0442\u043E \u043F\u043E\u0448\u043B\u043E \u043D\u0435 \u0442\u0430\u043A. \u041D\u0430\u0436\u043C\u0438\u0442\u0435 \xAB\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C\xBB \u043D\u0430 \u0431\u043B\u043E\u043A\u0435.",
    "toast.unknownProvider": "\u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u044B\u0439 \u043F\u0440\u043E\u0432\u0430\u0439\u0434\u0435\u0440 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0430",
    "toast.unknownProviderDesc": "\u041F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u043F\u0440\u043E\u0432\u0430\u0439\u0434\u0435\u0440 \u0432 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430\u0445 \u0438 \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u0435 \u0441\u043D\u043E\u0432\u0430.",
    "toast.cacheCleared": "\u042F\u0437\u044B\u043A \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0430 \u0438\u0437\u043C\u0435\u043D\u0451\u043D \u2014 \u043A\u044D\u0448 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u043E\u0432 \u043E\u0447\u0438\u0449\u0435\u043D.",
    "translate.button": "\u041F\u0435\u0440\u0435\u0432\u0435\u0441\u0442\u0438",
    "translate.original": "\u041E\u0440\u0438\u0433\u0438\u043D\u0430\u043B",
    "translate.loading": "\u041F\u0435\u0440\u0435\u0432\u043E\u0434\u2026",
    "translate.loadingShort": "\u041F\u0435\u0440\u0435\u0432\u043E\u0434",
    "translate.error": "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0430",
    "translate.retry": "\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C",
    "queue.addToWishlist": "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0432 \u0436\u0435\u043B\u0430\u0435\u043C\u043E\u0435",
    "queue.onWishlist": "\u0412 \u0436\u0435\u043B\u0430\u0435\u043C\u043E\u043C",
    "queue.addedNotice": "\u0418\u0433\u0440\u0430 \u0434\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u0430 \u0432 \u0436\u0435\u043B\u0430\u0435\u043C\u043E\u0435!",
    "queue.oops": "\u0423\u043F\u0441, \u0438\u0437\u0432\u0438\u043D\u0438\u0442\u0435!",
    "queue.follow": "\u041E\u0442\u0441\u043B\u0435\u0436\u0438\u0432\u0430\u0442\u044C",
    "queue.following": "\u041E\u0442\u0441\u043B\u0435\u0436\u0438\u0432\u0430\u0435\u0442\u0441\u044F",
    "queue.ignore": "\u0418\u0433\u043D\u043E\u0440\u0438\u0440\u043E\u0432\u0430\u0442\u044C",
    "queue.ignored": "\u0418\u0433\u043D\u043E\u0440\u0438\u0440\u0443\u0435\u0442\u0441\u044F",
    "queue.viewQueue": "\u041F\u043E\u0441\u043C\u043E\u0442\u0440\u0435\u0442\u044C \u043E\u0447\u0435\u0440\u0435\u0434\u044C",
    "queue.manageWishlist": "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0441\u043F\u0438\u0441\u043A\u043E\u043C \u0436\u0435\u043B\u0430\u0435\u043C\u043E\u0433\u043E",
    "queue.removeWishlist": "\u0423\u0431\u0440\u0430\u0442\u044C \u0438\u0437 \u0436\u0435\u043B\u0430\u0435\u043C\u043E\u0433\u043E",
    "queue.ignoreDefault": "\u0418\u0433\u043D\u043E\u0440\u0438\u0440\u043E\u0432\u0430\u0442\u044C (\u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E)",
    "queue.ignoreDefaultSub": "\u0421\u043A\u0440\u044B\u0442\u044C \u0438\u0437 \u043C\u0430\u0433\u0430\u0437\u0438\u043D\u0430, \u043E\u0442\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F \u0438 \u043D\u0435 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C \u0434\u043B\u044F \u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0430\u0446\u0438\u0439.",
    "queue.playedElsewhere": "\u0418\u0433\u0440\u0430\u043B \u043D\u0430 \u0434\u0440\u0443\u0433\u043E\u0439 \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0435",
    "queue.playedElsewhereSub": "\u0421\u043A\u0440\u044B\u0442\u044C \u0438\u0437 \u043C\u0430\u0433\u0430\u0437\u0438\u043D\u0430. \u041C\u043E\u0436\u0435\u0442 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C\u0441\u044F \u0434\u043B\u044F \u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0430\u0446\u0438\u0439.",
    "queue.actionFailed": "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F",
    "queue.actionFailedDesc": "\u0412\u043E\u0437\u043D\u0438\u043A\u043B\u0430 \u043F\u0440\u043E\u0431\u043B\u0435\u043C\u0430 \u043F\u0440\u0438 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0438 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0439. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u043F\u043E\u0437\u0436\u0435."
  };

  // src/i18n/locales/de.js
  var de_default = {
    "menu.settings": "Einstellungen Steam Plus",
    "tab.general": "Allgemein",
    "tab.translation": "\xDCbersetzung",
    "tab.gamepage": "Spielseite",
    "tab.prices": "Preise",
    "tab.cache": "Cache",
    "tab.about": "\xDCber das Skript",
    "tab.general.desc": "Oberfl\xE4chensprache und Benachrichtigungen.",
    "tab.translation.desc": "Beschreibungen, Rezensionen, Kommentare und News \xFCbersetzen.",
    "tab.gamepage.desc": "Unerw\xFCnschte Bl\xF6cke auf Spieleseiten ausblenden.",
    "tab.prices.desc": "Regionale Preise vergleichen und W\xE4hrung umrechnen.",
    "tab.links": "Externe Links",
    "tab.links.desc": "Schnellzugriff auf andere Shops und Datenbanken.",
    "tab.region": "Region",
    "tab.region.desc": "In deiner Region blockierte Store-Seiten laden.",
    "tab.cache.desc": "Gespeicherte \xDCbersetzungen und Speichernutzung.",
    "tab.about.desc": "Version, Autor und Quellcode.",
    "panel.subtitle": "\xDCbersetzung \xB7 Spielseite \xB7 Preise \xB7 Links \xB7 Region \xB7 Cache \xB7 Oberfl\xE4che",
    "panel.back": "Zur\xFCck",
    "common.on": "Ein",
    "common.off": "Aus",
    "common.auto": "Automatisch",
    "common.close": "Schlie\xDFen",
    "common.cancel": "Abbrechen",
    "common.save": "Speichern",
    "common.reset": "Auf Standard zur\xFCcksetzen",
    "common.saved": "Gespeichert",
    "common.settings": "Einstellungen",
    "general.language": "Sprache der Oberfl\xE4che",
    "general.languageDesc": "Sprache des Steam-Plus-Einstellungsbereichs.",
    "general.saveHint": "\xC4nderungen werden nach einem Klick auf Speichern \xFCbernommen.",
    "reset.confirm": "Alle Einstellungen auf die Standardwerte zur\xFCcksetzen?",
    "general.toasts": "Benachrichtigungen",
    "toasts.enabled": "Popup-Benachrichtigungen",
    "toasts.enabledDesc": "Erfolgs- und Fehlermeldungen f\xFCr Einstellungen und \xDCbersetzungen anzeigen.",
    "toasts.position": "Position auf dem Bildschirm",
    "toasts.duration": "Automatisch ausblenden nach (Sekunden)",
    "toasts.durationDesc": "0 = bleibt, bis es geschlossen wird.",
    "toastPos.bottom-right": "Unten rechts",
    "toastPos.bottom-left": "Unten links",
    "toastPos.top-right": "Oben rechts",
    "toastPos.top-left": "Oben links",
    "translation.title": "\xDCbersetzung",
    "translation.behavior": "Verhalten",
    "translation.desc": "\xDCbersetzung von Steam-Inhalten: Beschreibungen, Rezensionen, Kommentare und Neuigkeiten.",
    "translation.enabled": "\xDCbersetzung aktiv",
    "translation.enabledDesc": "Hauptschalter der \xDCbersetzungsfunktion.",
    "translation.provider": "\xDCbersetzungsanbieter",
    "translation.providerDesc": "Dienst, der zum \xDCbersetzen der Texte verwendet wird.",
    "provider.google-free": "Google (kostenlos)",
    "translation.trigger": "\xDCbersetzungsmodus",
    "translation.triggerDesc": "Automatisch beim Erscheinen von Inhalten oder per Schaltfl\xE4che \xFCbersetzen.",
    "trigger.auto": "Automatisch",
    "trigger.manual": "Per Schaltfl\xE4che",
    "translation.display": "Anzeige der \xDCbersetzung",
    "translation.displayDesc": "Originaltext ersetzen oder die \xDCbersetzung darunter anzeigen.",
    "display.below": "Unter dem Original",
    "display.replace": "Text ersetzen",
    "translation.targetLanguage": "Zielsprache",
    "translation.targetLanguageDesc": "In welche Sprache der Inhalt \xFCbersetzt wird.",
    "targetLanguage.auto": "Wie Steam / Browser",
    "translation.showCached": "Gespeicherte \xDCbersetzungen sofort anzeigen",
    "translation.showCachedDesc": "Liegt eine \xDCbersetzung bereits im Cache, wird sie ohne Klick angezeigt.",
    "translation.scopes": "Was \xFCbersetzt wird",
    "translation.scopesDesc": "W\xE4hlen Sie die Inhaltstypen aus, die \xFCbersetzt werden sollen.",
    "scope.gameDescription": "Spielbeschreibungen",
    "scope.gameReviews": "Spieler-Rezensionen",
    "scope.profileComments": "Profilkommentare",
    "scope.gameNews": "Neuigkeiten und Events",
    "gamepage.title": "Spielseite",
    "gamepage.desc": "Steam-Spielseiten aufr\xE4umen: Bl\xF6cke ausblenden, die du nie liest.",
    "gamepage.enabled": "Bl\xF6cke der Spielseite ausblenden",
    "gamepage.enabledDesc": "Hauptschalter zum Ausblenden von Bl\xF6cken auf Spielseiten.",
    "gamepage.blocks": "Ausgeblendete Bl\xF6cke",
    "gamepage.blocksDesc": "W\xE4hle, welche Bl\xF6cke auf Spielseiten (Store-App-Seiten) ausgeblendet werden.",
    "block.media": "Screenshots & Trailer",
    "block.purchase": "Kaufoptionen & Bundles",
    "block.description": "\xDCber dieses Spiel",
    "block.dlc": "Inhalte f\xFCr dieses Spiel (DLC)",
    "block.sysreq": "Systemanforderungen",
    "block.reviews": "Nutzerrezensionen",
    "block.curators": "Was Kuratoren sagen",
    "block.events": "Events & Ank\xFCndigungen",
    "block.details": "Details & Seitenleiste",
    "block.recommendations": "Franchise & Empfehlungen",
    "block.sale": "Sale-Event-Banner",
    "block.edition": "Inhalte von Editionen & Paketen",
    "prices.title": "Regionale Preise",
    "prices.desc": "Vergleiche den Spielpreis \xFCber Steam-Store-Regionen direkt auf der Spielseite.",
    "prices.enabled": "Regionale Preise aktiviert",
    "prices.enabledDesc": "Hauptschalter f\xFCr den regionalen Preisvergleich.",
    "prices.autoLoad": "Preise automatisch laden",
    "prices.autoLoadDesc": "Aus zeigt stattdessen eine Lade-Schaltfl\xE4che auf jeder Spielseite.",
    "prices.position": "Blockposition",
    "prices.positionDesc": "Wo der Vergleichsblock auf Spielseiten erscheint.",
    "pricesPos.purchase": "\xDCber den Kaufoptionen",
    "pricesPos.sidebar": "Seitenleiste",
    "pricesPos.description": "Unter der Beschreibung",
    "prices.sort": "Zeilenfolge",
    "prices.sortDesc": "Die Preisreihenfolge nutzt ungef\xE4hre Wechselkurse.",
    "pricesSort.custom": "Wie aufgelistet",
    "pricesSort.priceAsc": "G\xFCnstigste zuerst",
    "pricesSort.discountDesc": "Gr\xF6\xDFter Rabatt zuerst",
    "prices.conversion": "W\xE4hrungsumrechnung",
    "prices.conversionDesc": "Alle Preise mit Live-Wechselkursen in eine W\xE4hrung umrechnen.",
    "prices.convertTo": "Anzeigew\xE4hrung",
    "prices.convertToDesc": "Auto nutzt die W\xE4hrung des ge\xF6ffneten Stores.",
    "convertTo.auto": "Auto (deine Store-W\xE4hrung)",
    "convertTo.off": "Aus (keine Umrechnung)",
    "prices.showConverted": "Umrechnung anzeigen",
    "prices.fxCache": "Cache-Dauer der Kurse",
    "prices.fxCacheDesc": "Wie lange Wechselkurse wiederverwendet werden, bevor sie neu geladen werden.",
    "fxTtl.1h": "1 Stunde",
    "fxTtl.6h": "6 Stunden",
    "fxTtl.24h": "24 Stunden",
    "fxTtl.7d": "7 Tage",
    "prices.fxCached": "Gespeicherte Kurse: {provider}, {date}",
    "prices.fxCacheEmpty": "Noch keine gespeicherten Kurse \u2014 \xF6ffne einmal eine Spielseite.",
    "prices.fxClear": "Kurs-Cache leeren",
    "prices.regions": "Verglichene Regionen",
    "prices.regionsDesc": "Store-Regionen, f\xFCr die Preise geladen werden (bis zu 24).",
    "prices.display": "Anzeige",
    "prices.showOriginal": "Originalpreis",
    "prices.showDiscount": "Rabatt-Badge",
    "prices.showSavings": "Ersparnis gg\xFC. deinem Preis",
    "prices.highlightCheapest": "G\xFCnstigste hervorheben",
    "prices.showHomeRow": "Eigene Preiszeile",
    "prices.collapsed": "Standardm\xE4\xDFig eingeklappt",
    "prices.collapsedDesc": "Der Vergleichsblock startet eingeklappt und spart Platz; per Schalter in der Kopfzeile aufklappen.",
    "prices.colRegion": "Region",
    "prices.colPrice": "Preis",
    "prices.colDiscount": "Rabatt",
    "prices.colSavings": "Ersparnis",
    "prices.yours": "Dein Preis",
    "prices.cheapest": "G\xFCnstigste",
    "prices.load": "Preise laden",
    "prices.loading": "Preise werden geladen\u2026",
    "prices.retry": "Wiederholen",
    "prices.failed": "Preise konnten nicht geladen werden",
    "prices.noRegions": "W\xE4hle mindestens eine Region in den Einstellungen",
    "prices.updated": "Aktualisiert {time}",
    "prices.refresh": "Preise aktualisieren",
    "prices.collapse": "Block einklappen",
    "prices.expand": "Block aufklappen",
    "prices.fxHint": "Wechselkurse: {provider} ({date}).",
    "links.title": "Externe Links",
    "links.desc": "Schnellzugriff auf andere Shops und Datenbanken direkt auf der Spielseite.",
    "links.enabled": "Externe Links aktiviert",
    "links.enabledDesc": "Hauptschalter f\xFCr den Block externer Links.",
    "links.position": "Blockposition",
    "links.positionDesc": "Wo der Links-Block auf Spielseiten erscheint.",
    "links.newTab": "In neuem Tab \xF6ffnen",
    "links.newTabDesc": "Externe Links in einem neuen Tab \xF6ffnen.",
    "links.list": "Links",
    "links.listDesc": "Links auf Spielseiten. Unaufl\xF6sbare Vorlagen werden \xFCbersprungen.",
    "links.templateHelp": "URL-Vorlage: {name} f\xFCr den Spieltitel, {appid} f\xFCr die Steam-ID \u2014 z. B. https://store.epicgames.com/en-US/browse?q={name} oder https://steamdb.info/app/{appid}/",
    "links.name": "Name",
    "links.namePlaceholder": "GOG",
    "links.url": "Linkadresse",
    "links.urlPlaceholder": "https://www.gog.com/games?query={name}",
    "links.icon": "Symboladresse (optional)",
    "links.iconPlaceholder": "https://www.gog.com/favicon.ico",
    "links.add": "Link hinzuf\xFCgen",
    "links.remove": "Diesen Link entfernen",
    "links.moveUp": "Nach oben",
    "links.moveDown": "Nach unten",
    "links.empty": "Noch keine Links \u2014 unten hinzuf\xFCgen.",
    "links.restore": "Standards wiederherstellen",
    "links.preview": "Vorschau",
    "links.open": "\xD6ffnen",
    "region.title": "Regionsperre umgehen",
    "region.desc": "Store-Seiten mit \u201Ein deiner Region nicht verf\xFCgbar\u201C per anonymer Gastanfrage neu laden (ohne Account-Cookies).",
    "region.enabled": "Regionsperre umgehen",
    "region.enabledDesc": "Hauptschalter zum Neuladen blockierter Store-Seiten.",
    "region.showBanner": "Hinweisbanner anzeigen",
    "region.showBannerDesc": "Zeigt, dass die Seite per anonymer Gastanfrage geladen wurde. Standardm\xE4\xDFig verborgen; greift ab dem n\xE4chsten Neuladen.",
    "region.mode": "Auf blockierten Seiten",
    "region.modeDesc": "Automatisch ersetzt die Fehlerseite sofort; manuell zeigt zuerst eine Schaltfl\xE4che.",
    "regionMode.auto": "Automatisch",
    "regionMode.manual": "Per Knopf",
    "region.country": "Store-Land (cc)",
    "region.countryDesc": "Optionale zweibuchstabige L\xE4nderkennung f\xFCr Gastanfragen. Leer l\xE4sst dein Land.",
    "region.countryPlaceholder": "US",
    "region.proxy": "Proxy-Gateway",
    "region.proxyDesc": "Bei IP-Sperren: die anonyme Anfrage \xFCber ein HTTP-Gateway in einer freien Region leiten.",
    "region.proxyEnabled": "Proxy-Gateway verwenden",
    "region.proxyMode": "Gateway-Modus",
    "region.proxyModeDesc": "Wie die Store-URL an Host:Port angeh\xE4ngt wird.",
    "regionProxyMode.gateway": "host:port/https://\u2026",
    "regionProxyMode.path": "host:port/store.steampowered.com/\u2026",
    "regionProxyMode.query": "host:port/?url=\u2026",
    "region.proxyHost": "Host",
    "region.proxyPort": "Port",
    "region.proxyUser": "Benutzername",
    "region.proxyPass": "Passwort",
    "region.bannerBadge": "Region blockiert",
    "region.bannerTitle": "Diese Seite ist in deiner Region nicht verf\xFCgbar",
    "region.bannerBody": "Per anonymer Gastanfrage gezeigt (ohne Account-Cookies)",
    "region.bannerViaProxy": "\xFCber Proxy-Gateway",
    "region.reload": "Neu laden",
    "region.retry": "Wiederholen",
    "region.offer": "Diese Seite ist in deiner Region blockiert. Store-Seite ohne Account-Cookies laden?",
    "region.offerButton": "Store-Seite anzeigen",
    "region.loading": "Store-Seite wird ohne Account-Cookies geladen\u2026",
    "region.errorBlocked": "Weiterhin per IP/Region blockiert. Aktiviere ein Proxy-Gateway in eine freie Region.",
    "region.errorBlockedProxy": "Weiterhin blockiert. Die Proxy-IP liegt wohl ebenfalls in einer Sperrregion \u2014 versuche einen anderen Exit-Knoten.",
    "region.errorAgeGate": "Steam zeigt eine Alterspr\xFCfung. Dr\xFCcke Wiederholen \u2014 Alters-Cookies werden automatisch gesendet.",
    "region.errorFailed": "Laden fehlgeschlagen: {error}",
    "cache.usage": "Speichernutzung",
    "cache.contents": "Gespeicherte \xDCbersetzungen",
    "cache.clear": "Cache leeren",
    "cache.cleared": "Cache geleert ({count})",
    "cache.empty": "Cache ist leer",
    "cache.clearHint": "Entfernt alle gespeicherten \xDCbersetzungen aus diesem Browserprofil.",
    "cache.listEmpty": "Noch keine gespeicherten \xDCbersetzungen \u2014 \xFCbersetzen Sie etwas, dann erscheint es hier.",
    "cache.listMore": "\u2026und {count} weitere",
    "cache.removeEntry": "Diesen Eintrag entfernen",
    "cache.entries": "{count} Eintr\xE4ge",
    "cache.used": "{used} in {count} Eintr\xE4gen",
    "cache.free": "Frei",
    "cache.pct": "{pct} % voll",
    "about.blurb": "Verbessert Steam-Shop- und Community-Seiten: Inhalts\xFCbersetzung mit Cache, vieles mehr ist geplant.",
    "about.repo": "GitHub",
    "about.repoHint": "Quellcode, Updates und Fehlermeldungen",
    "toast.saved": "Einstellungen gespeichert",
    "toast.rateLimited": "\xDCbersetzung gedrosselt",
    "toast.rateLimitedDesc": "Google drosselt gerade Anfragen. Bl\xF6cke versuchen es automatisch erneut \u2014 oder sp\xE4ter auf Wiederholen klicken.",
    "toast.translateFailed": "\xDCbersetzung fehlgeschlagen",
    "toast.translateFailedDesc": "Etwas ist schiefgelaufen. Am Block auf Wiederholen klicken.",
    "toast.unknownProvider": "Unbekannter \xDCbersetzungsanbieter",
    "toast.unknownProviderDesc": "Anbieter in den Einstellungen pr\xFCfen und erneut speichern.",
    "toast.cacheCleared": "Zielsprache ge\xE4ndert \u2014 \xDCbersetzungs-Cache geleert.",
    "translate.button": "\xDCbersetzen",
    "translate.original": "Original",
    "translate.loading": "\xDCbersetze\u2026",
    "translate.loadingShort": "\xDCbersetzen",
    "translate.error": "\xDCbersetzungsfehler",
    "translate.retry": "Erneut versuchen",
    "queue.addToWishlist": "Auf die Wunschliste",
    "queue.onWishlist": "Auf der Wunschliste",
    "queue.addedNotice": "Artikel wurde auf die Wunschliste gesetzt!",
    "queue.oops": "Hoppla!",
    "queue.follow": "Folgen",
    "queue.following": "Gefolgt",
    "queue.ignore": "Ignorieren",
    "queue.ignored": "Ignoriert",
    "queue.viewQueue": "Warteschlange anzeigen",
    "queue.manageWishlist": "Wunschliste verwalten",
    "queue.removeWishlist": "Von der Wunschliste entfernen",
    "queue.ignoreDefault": "Ignorieren (Standard)",
    "queue.ignoreDefaultSub": "Im Shop ausblenden, Benachrichtigungen ignorieren und nicht f\xFCr Empfehlungen verwenden.",
    "queue.playedElsewhere": "Auf einer anderen Plattform gespielt",
    "queue.playedElsewhereSub": "Im Shop ausblenden. Kann f\xFCr Empfehlungen verwendet werden.",
    "queue.actionFailed": "\xC4nderungen konnten nicht gespeichert werden",
    "queue.actionFailedDesc": "Beim Speichern der \xC4nderungen ist ein Problem aufgetreten. Bitte versuchen Sie es sp\xE4ter erneut."
  };

  // src/i18n/locales/es.js
  var es_default = {
    "menu.settings": "Ajustes Steam Plus",
    "tab.general": "General",
    "tab.translation": "Traducci\xF3n",
    "tab.gamepage": "P\xE1gina del juego",
    "tab.prices": "Precios",
    "tab.cache": "Cach\xE9",
    "tab.about": "Acerca del script",
    "tab.general.desc": "Idioma de la interfaz y notificaciones.",
    "tab.translation.desc": "Traduce descripciones, rese\xF1as, comentarios y noticias.",
    "tab.gamepage.desc": "Oculta bloques innecesarios en las p\xE1ginas de juegos.",
    "tab.prices.desc": "Compara precios regionales y convierte divisas.",
    "tab.links": "Enlaces externos",
    "tab.links.desc": "Accesos r\xE1pidos a otras tiendas y bases de datos.",
    "tab.region": "Regi\xF3n",
    "tab.region.desc": "Carga p\xE1ginas de la tienda bloqueadas en tu regi\xF3n.",
    "tab.cache.desc": "Traducciones guardadas y uso de almacenamiento.",
    "tab.about.desc": "Versi\xF3n, autor y c\xF3digo fuente.",
    "panel.subtitle": "Traducci\xF3n \xB7 p\xE1gina del juego \xB7 precios \xB7 enlaces \xB7 regi\xF3n \xB7 cach\xE9 \xB7 interfaz",
    "panel.back": "Volver",
    "common.on": "S\xED",
    "common.off": "No",
    "common.auto": "Autom\xE1tico",
    "common.close": "Cerrar",
    "common.cancel": "Cancelar",
    "common.save": "Guardar",
    "common.reset": "Restablecer valores",
    "common.saved": "Guardado",
    "common.settings": "Ajustes",
    "general.language": "Idioma de la interfaz",
    "general.languageDesc": "Idioma del panel de ajustes de Steam Plus.",
    "general.saveHint": "Los cambios se aplican al pulsar Guardar.",
    "reset.confirm": "\xBFRestablecer todos los ajustes a los valores predeterminados?",
    "general.toasts": "Notificaciones",
    "toasts.enabled": "Notificaciones emergentes",
    "toasts.enabledDesc": "Mostrar avisos de \xE9xito y error de ajustes y traducciones.",
    "toasts.position": "Posici\xF3n en pantalla",
    "toasts.duration": "Ocultar tras (segundos)",
    "toasts.durationDesc": "0 = se queda hasta cerrarlo.",
    "toastPos.bottom-right": "Abajo a la derecha",
    "toastPos.bottom-left": "Abajo a la izquierda",
    "toastPos.top-right": "Arriba a la derecha",
    "toastPos.top-left": "Arriba a la izquierda",
    "translation.title": "Traducci\xF3n",
    "translation.behavior": "Comportamiento",
    "translation.desc": "Traducci\xF3n de contenido de Steam: descripciones, rese\xF1as, comentarios y noticias.",
    "translation.enabled": "Traducci\xF3n activada",
    "translation.enabledDesc": "Interruptor global de la funci\xF3n de traducci\xF3n.",
    "translation.provider": "Proveedor de traducci\xF3n",
    "translation.providerDesc": "Servicio utilizado para traducir los textos.",
    "provider.google-free": "Google (gratuito)",
    "translation.trigger": "Modo de traducci\xF3n",
    "translation.triggerDesc": "Traducir autom\xE1ticamente al aparecer el contenido o mediante un bot\xF3n.",
    "trigger.auto": "Autom\xE1tico",
    "trigger.manual": "Con bot\xF3n",
    "translation.display": "Visualizaci\xF3n de la traducci\xF3n",
    "translation.displayDesc": "Reemplazar el texto original o mostrar la traducci\xF3n debajo.",
    "display.below": "Debajo del original",
    "display.replace": "Reemplazar texto",
    "translation.targetLanguage": "Idioma de traducci\xF3n",
    "translation.targetLanguageDesc": "Idioma al que se traducir\xE1 el contenido.",
    "targetLanguage.auto": "Como Steam / navegador",
    "translation.showCached": "Mostrar traducciones guardadas al instante",
    "translation.showCachedDesc": "Si la traducci\xF3n ya est\xE1 en cach\xE9, se muestra sin pulsar el bot\xF3n.",
    "translation.scopes": "Qu\xE9 traducir",
    "translation.scopesDesc": "Selecciona los tipos de contenido que se traducir\xE1n.",
    "scope.gameDescription": "Descripciones de juegos",
    "scope.gameReviews": "Rese\xF1as de juegos",
    "scope.profileComments": "Comentarios del perfil",
    "scope.gameNews": "Noticias y eventos",
    "gamepage.title": "P\xE1gina del juego",
    "gamepage.desc": "Ordena las p\xE1ginas de juegos de Steam: oculta los bloques que nunca lees.",
    "gamepage.enabled": "Ocultar bloques de la p\xE1gina del juego",
    "gamepage.enabledDesc": "Interruptor principal para ocultar bloques en las p\xE1ginas de juegos.",
    "gamepage.blocks": "Bloques ocultos",
    "gamepage.blocksDesc": "Elige qu\xE9 bloques ocultar en las p\xE1ginas de juegos (p\xE1ginas de la tienda).",
    "block.media": "Capturas y tr\xE1ileres",
    "block.purchase": "Opciones de compra y paquetes",
    "block.description": "Acerca de este juego",
    "block.dlc": "Contenido para este juego (DLC)",
    "block.sysreq": "Requisitos del sistema",
    "block.reviews": "Rese\xF1as de usuarios",
    "block.curators": "Lo que dicen los mentores",
    "block.events": "Eventos y anuncios",
    "block.details": "Detalles e info lateral",
    "block.recommendations": "Franquicia y recomendaciones",
    "block.sale": "Banner del evento de oferta",
    "block.edition": "Contenido de ediciones y paquetes",
    "prices.title": "Precios regionales",
    "prices.desc": "Compara el precio del juego entre regiones de Steam directamente en la p\xE1gina del juego.",
    "prices.enabled": "Precios regionales activados",
    "prices.enabledDesc": "Interruptor principal del bloque de comparaci\xF3n de precios.",
    "prices.autoLoad": "Cargar precios autom\xE1ticamente",
    "prices.autoLoadDesc": "Desactivado muestra un bot\xF3n de carga en cada p\xE1gina del juego.",
    "prices.position": "Posici\xF3n del bloque",
    "prices.positionDesc": "D\xF3nde aparece el bloque de comparaci\xF3n en las p\xE1ginas de juegos.",
    "pricesPos.purchase": "Encima de las opciones de compra",
    "pricesPos.sidebar": "Barra lateral",
    "pricesPos.description": "Debajo de la descripci\xF3n",
    "prices.sort": "Orden de filas",
    "prices.sortDesc": "El orden por precio usa tipos de cambio aproximados.",
    "pricesSort.custom": "Como en la lista",
    "pricesSort.priceAsc": "Precio m\xE1s bajo primero",
    "pricesSort.discountDesc": "Mayor descuento primero",
    "prices.conversion": "Conversi\xF3n de moneda",
    "prices.conversionDesc": "Convierte todos los precios a una moneda con tipos de cambio en vivo.",
    "prices.convertTo": "Moneda de visualizaci\xF3n",
    "prices.convertToDesc": "Auto usa la moneda de la tienda que est\xE1s viendo.",
    "convertTo.auto": "Auto (moneda de tu tienda)",
    "convertTo.off": "No (sin conversi\xF3n)",
    "prices.showConverted": "Mostrar precio convertido",
    "prices.fxCache": "Duraci\xF3n de la cach\xE9",
    "prices.fxCacheDesc": "Cu\xE1nto tiempo se reutilizan los tipos de cambio antes de pedirlos de nuevo.",
    "fxTtl.1h": "1 hora",
    "fxTtl.6h": "6 horas",
    "fxTtl.24h": "24 horas",
    "fxTtl.7d": "7 d\xEDas",
    "prices.fxCached": "Tipos en cach\xE9: {provider}, {date}",
    "prices.fxCacheEmpty": "A\xFAn no hay tipos en cach\xE9 \u2014 abre cualquier p\xE1gina de juego una vez.",
    "prices.fxClear": "Borrar cach\xE9 de tipos",
    "prices.regions": "Regiones comparadas",
    "prices.regionsDesc": "Regiones de la tienda para las que cargar precios (hasta 24).",
    "prices.display": "Visualizaci\xF3n",
    "prices.showOriginal": "Precio original",
    "prices.showDiscount": "Insignia de descuento",
    "prices.showSavings": "Ahorro frente a tu precio",
    "prices.highlightCheapest": "Resaltar el m\xE1s barato",
    "prices.showHomeRow": "Fila de tu precio",
    "prices.collapsed": "Empezar contra\xEDdo",
    "prices.collapsedDesc": "El bloque de comparaci\xF3n aparece contra\xEDdo para ocupar menos; ampl\xEDalo con el bot\xF3n del encabezado.",
    "prices.colRegion": "Regi\xF3n",
    "prices.colPrice": "Precio",
    "prices.colDiscount": "Descuento",
    "prices.colSavings": "Ahorro",
    "prices.yours": "Tu precio",
    "prices.cheapest": "M\xE1s barato",
    "prices.load": "Cargar precios",
    "prices.loading": "Cargando precios\u2026",
    "prices.retry": "Reintentar",
    "prices.failed": "No se pudieron cargar los precios",
    "prices.noRegions": "Selecciona al menos una regi\xF3n en los ajustes",
    "prices.updated": "Actualizado {time}",
    "prices.refresh": "Actualizar precios",
    "prices.collapse": "Contraer bloque",
    "prices.expand": "Expandir bloque",
    "prices.fxHint": "Tipos de cambio: {provider} ({date}).",
    "links.title": "Enlaces externos",
    "links.desc": "Accesos r\xE1pidos a otras tiendas y bases de datos en la p\xE1gina del juego.",
    "links.enabled": "Enlaces externos activados",
    "links.enabledDesc": "Interruptor principal del bloque de enlaces externos.",
    "links.position": "Posici\xF3n del bloque",
    "links.positionDesc": "D\xF3nde aparece el bloque de enlaces en las p\xE1ginas de juegos.",
    "links.newTab": "Abrir en pesta\xF1a nueva",
    "links.newTabDesc": "Abrir los enlaces externos en una pesta\xF1a nueva.",
    "links.list": "Enlaces",
    "links.listDesc": "Enlaces en las p\xE1ginas de juegos. Las plantillas no v\xE1lidas se omiten.",
    "links.templateHelp": "Plantilla de URL: {name} para el t\xEDtulo del juego, {appid} para el id de Steam. Ej.: https://store.epicgames.com/en-US/browse?q={name} o https://steamdb.info/app/{appid}/",
    "links.name": "Nombre",
    "links.namePlaceholder": "GOG",
    "links.url": "Direcci\xF3n del enlace",
    "links.urlPlaceholder": "https://www.gog.com/games?query={name}",
    "links.icon": "Direcci\xF3n del icono (opcional)",
    "links.iconPlaceholder": "https://www.gog.com/favicon.ico",
    "links.add": "A\xF1adir enlace",
    "links.remove": "Eliminar este enlace",
    "links.moveUp": "Subir",
    "links.moveDown": "Bajar",
    "links.empty": "A\xFAn no hay enlaces \u2014 a\xF1ade uno abajo.",
    "links.restore": "Restaurar valores",
    "links.preview": "Vista previa",
    "links.open": "Abrir",
    "region.title": "Bypass de regi\xF3n",
    "region.desc": "Recarga p\xE1ginas con \xABno disponible en tu regi\xF3n\xBB mediante una petici\xF3n an\xF3nima de invitado (sin cookies de cuenta).",
    "region.enabled": "Bypass de regi\xF3n activado",
    "region.enabledDesc": "Interruptor principal para recargar p\xE1ginas bloqueadas.",
    "region.showBanner": "Mostrar aviso",
    "region.showBannerDesc": "Muestra que la p\xE1gina se carg\xF3 por petici\xF3n an\xF3nima de invitado. Oculto por defecto; se aplica al recargar.",
    "region.mode": "En p\xE1ginas bloqueadas",
    "region.modeDesc": "Autom\xE1tico reemplaza la p\xE1gina de error al instante; manual muestra primero un bot\xF3n.",
    "regionMode.auto": "Autom\xE1ticamente",
    "regionMode.manual": "Con bot\xF3n",
    "region.country": "Pa\xEDs de la tienda (cc)",
    "region.countryDesc": "C\xF3digo de pa\xEDs de dos letras opcional para las peticiones de invitado. Vac\xEDo mantiene tu pa\xEDs.",
    "region.countryPlaceholder": "US",
    "region.proxy": "Gateway proxy",
    "region.proxyDesc": "Para bloqueos por IP: env\xEDa la petici\xF3n an\xF3nima por un gateway HTTP en una regi\xF3n libre.",
    "region.proxyEnabled": "Usar gateway proxy",
    "region.proxyMode": "Modo del gateway",
    "region.proxyModeDesc": "C\xF3mo se a\xF1ade la URL de la tienda a host:puerto.",
    "regionProxyMode.gateway": "host:puerto/https://\u2026",
    "regionProxyMode.path": "host:puerto/store.steampowered.com/\u2026",
    "regionProxyMode.query": "host:puerto/?url=\u2026",
    "region.proxyHost": "Host",
    "region.proxyPort": "Puerto",
    "region.proxyUser": "Usuario",
    "region.proxyPass": "Contrase\xF1a",
    "region.bannerBadge": "Regi\xF3n bloqueada",
    "region.bannerTitle": "Esta p\xE1gina no est\xE1 disponible en tu regi\xF3n",
    "region.bannerBody": "Mostrada por petici\xF3n an\xF3nima de invitado (sin cookies de cuenta)",
    "region.bannerViaProxy": "v\xEDa gateway proxy",
    "region.reload": "Recargar",
    "region.retry": "Reintentar",
    "region.offer": "Esta p\xE1gina est\xE1 bloqueada en tu regi\xF3n. \xBFCargarla sin cookies de cuenta?",
    "region.offerButton": "Mostrar p\xE1gina",
    "region.loading": "Cargando la p\xE1gina sin cookies de cuenta\u2026",
    "region.errorBlocked": "Sigue bloqueada por IP/regi\xF3n. Activa un gateway proxy hacia una regi\xF3n libre.",
    "region.errorBlockedProxy": "Sigue bloqueada. La IP del proxy tambi\xE9n est\xE1 en una regi\xF3n restringida \u2014 prueba otro nodo de salida.",
    "region.errorAgeGate": "Steam mostr\xF3 una verificaci\xF3n de edad. Pulsa Reintentar \u2014 las cookies de edad se env\xEDan solas.",
    "region.errorFailed": "No se pudo cargar: {error}",
    "cache.usage": "Uso de almacenamiento",
    "cache.contents": "Traducciones guardadas",
    "cache.clear": "Borrar cach\xE9",
    "cache.cleared": "Cach\xE9 borrada ({count})",
    "cache.empty": "La cach\xE9 est\xE1 vac\xEDa",
    "cache.clearHint": "Elimina todas las traducciones guardadas de este perfil de navegador.",
    "cache.listEmpty": "A\xFAn no hay traducciones guardadas: traduce algo y aparecer\xE1 aqu\xED.",
    "cache.listMore": "\u2026y {count} m\xE1s",
    "cache.removeEntry": "Eliminar esta entrada",
    "cache.entries": "{count} entradas",
    "cache.used": "{used} en {count} entradas",
    "cache.free": "Libre",
    "cache.pct": "{pct} % lleno",
    "about.blurb": "Mejora las p\xE1ginas de la tienda y la comunidad de Steam: traducci\xF3n de contenido con cach\xE9 y mucho m\xE1s en camino.",
    "about.repo": "GitHub",
    "about.repoHint": "C\xF3digo fuente, actualizaciones e informes de errores",
    "toast.saved": "Ajustes guardados",
    "toast.rateLimited": "Traducci\xF3n limitada",
    "toast.rateLimitedDesc": "Google est\xE1 limitando las solicitudes. Los bloques reintentan solos, o pulsa Reintentar m\xE1s tarde.",
    "toast.translateFailed": "Error de traducci\xF3n",
    "toast.translateFailedDesc": "Algo sali\xF3 mal. Pulsa Reintentar en el bloque.",
    "toast.unknownProvider": "Proveedor desconocido",
    "toast.unknownProviderDesc": "Revisa el proveedor en ajustes y guarda de nuevo.",
    "toast.cacheCleared": "Idioma cambiado \u2014 cach\xE9 de traducciones borrada.",
    "translate.button": "Traducir",
    "translate.original": "Original",
    "translate.loading": "Traduciendo\u2026",
    "translate.loadingShort": "Traduciendo",
    "translate.error": "Error de traducci\xF3n",
    "translate.retry": "Reintentar",
    "queue.addToWishlist": "A\xF1adir a tu lista de deseados",
    "queue.onWishlist": "En tu lista de deseados",
    "queue.addedNotice": "\xA1Art\xEDculo a\xF1adido a tu lista de deseados!",
    "queue.oops": "\xA1Vaya, lo sentimos!",
    "queue.follow": "Seguir",
    "queue.following": "Siguiendo",
    "queue.ignore": "Ignorar",
    "queue.ignored": "Ignorado",
    "queue.viewQueue": "Ver tu cola",
    "queue.manageWishlist": "Gestionar tu lista de deseados",
    "queue.removeWishlist": "Quitar de tu lista de deseados",
    "queue.ignoreDefault": "Ignorar esto (predeterminado)",
    "queue.ignoreDefaultSub": "Ocultar de la tienda, ignorar notificaciones y no usar para generar otras recomendaciones.",
    "queue.playedElsewhere": "Jugado en otra plataforma",
    "queue.playedElsewhereSub": "Ocultar de la tienda. Puede usarse para generar recomendaciones.",
    "queue.actionFailed": "No se pudieron guardar los cambios",
    "queue.actionFailedDesc": "Hubo un problema al guardar los cambios. Int\xE9ntalo de nuevo m\xE1s tarde."
  };

  // src/i18n/locales/fr.js
  var fr_default = {
    "menu.settings": "Param\xE8tres Steam Plus",
    "tab.general": "G\xE9n\xE9ral",
    "tab.translation": "Traduction",
    "tab.gamepage": "Page du jeu",
    "tab.prices": "Prix",
    "tab.cache": "Cache",
    "tab.about": "\xC0 propos du script",
    "tab.general.desc": "Langue de l\u2019interface et notifications.",
    "tab.translation.desc": "Traduit descriptions, avis, commentaires et actualit\xE9s.",
    "tab.gamepage.desc": "Masque les blocs inutiles des pages de jeux.",
    "tab.prices.desc": "Compare les prix r\xE9gionaux et convertit les devises.",
    "tab.links": "Liens externes",
    "tab.links.desc": "Acc\xE8s rapides aux autres boutiques et bases de donn\xE9es.",
    "tab.region": "R\xE9gion",
    "tab.region.desc": "Charge les pages du magasin bloqu\xE9es dans votre r\xE9gion.",
    "tab.cache.desc": "Traductions enregistr\xE9es et utilisation du stockage.",
    "tab.about.desc": "Version, auteur et code source.",
    "panel.subtitle": "Traduction \xB7 page du jeu \xB7 prix \xB7 liens \xB7 r\xE9gion \xB7 cache \xB7 interface",
    "panel.back": "Retour",
    "common.on": "Activ\xE9",
    "common.off": "D\xE9sactiv\xE9",
    "common.auto": "Automatique",
    "common.close": "Fermer",
    "common.cancel": "Annuler",
    "common.save": "Enregistrer",
    "common.reset": "Valeurs par d\xE9faut",
    "common.saved": "Enregistr\xE9",
    "common.settings": "Param\xE8tres",
    "general.language": "Langue de l\u2019interface",
    "general.languageDesc": "Langue du panneau de param\xE8tres de Steam Plus.",
    "general.saveHint": "Les modifications sont appliqu\xE9es via Enregistrer ci-dessous.",
    "reset.confirm": "R\xE9tablir tous les param\xE8tres sur leurs valeurs par d\xE9faut ?",
    "general.toasts": "Notifications",
    "toasts.enabled": "Notifications pop-up",
    "toasts.enabledDesc": "Afficher les pop-ups de succ\xE8s et d\u2019erreur des param\xE8tres et traductions.",
    "toasts.position": "Position \xE0 l\u2019\xE9cran",
    "toasts.duration": "Masquage auto apr\xE8s (secondes)",
    "toasts.durationDesc": "0 = reste jusqu\u2019\xE0 fermeture manuelle.",
    "toastPos.bottom-right": "En bas \xE0 droite",
    "toastPos.bottom-left": "En bas \xE0 gauche",
    "toastPos.top-right": "En haut \xE0 droite",
    "toastPos.top-left": "En haut \xE0 gauche",
    "translation.title": "Traduction",
    "translation.behavior": "Comportement",
    "translation.desc": "Traduction du contenu Steam : descriptions, \xE9valuations, commentaires et actualit\xE9s.",
    "translation.enabled": "Traduction activ\xE9e",
    "translation.enabledDesc": "Interrupteur global de la fonction de traduction.",
    "translation.provider": "Fournisseur de traduction",
    "translation.providerDesc": "Service utilis\xE9 pour traduire les textes.",
    "provider.google-free": "Google (gratuit)",
    "translation.trigger": "Mode de traduction",
    "translation.triggerDesc": "Traduire automatiquement \xE0 l\u2019apparition du contenu ou via un bouton.",
    "trigger.auto": "Automatique",
    "trigger.manual": "Par bouton",
    "translation.display": "Affichage de la traduction",
    "translation.displayDesc": "Remplacer le texte original ou afficher la traduction en dessous.",
    "display.below": "Sous l\u2019original",
    "display.replace": "Remplacer le texte",
    "translation.targetLanguage": "Langue de traduction",
    "translation.targetLanguageDesc": "Langue vers laquelle le contenu sera traduit.",
    "targetLanguage.auto": "Comme Steam / navigateur",
    "translation.showCached": "Afficher aussit\xF4t les traductions enregistr\xE9es",
    "translation.showCachedDesc": "Si la traduction est d\xE9j\xE0 en cache, elle s\u2019affiche sans clic.",
    "translation.scopes": "Contenu \xE0 traduire",
    "translation.scopesDesc": "Choisissez les types de contenu \xE0 traduire.",
    "scope.gameDescription": "Descriptions de jeux",
    "scope.gameReviews": "\xC9valuations de jeux",
    "scope.profileComments": "Commentaires de profil",
    "scope.gameNews": "Actualit\xE9s et \xE9v\xE9nements",
    "gamepage.title": "Page du jeu",
    "gamepage.desc": "\xC9pure les pages de jeux Steam : masque les blocs que tu ne lis jamais.",
    "gamepage.enabled": "Masquer les blocs de la page du jeu",
    "gamepage.enabledDesc": "Interrupteur principal pour masquer les blocs sur les pages de jeux.",
    "gamepage.blocks": "Blocs masqu\xE9s",
    "gamepage.blocksDesc": "Choisis les blocs \xE0 masquer sur les pages de jeux (pages applicatives du magasin).",
    "block.media": "Captures & bandes-annonces",
    "block.purchase": "Options d\u2019achat & packs",
    "block.description": "\xC0 propos de ce jeu",
    "block.dlc": "Contenu pour ce jeu (DLC)",
    "block.sysreq": "Configuration requise",
    "block.reviews": "\xC9valuations des utilisateurs",
    "block.curators": "Ce qu\u2019en disent les curateurs",
    "block.events": "\xC9v\xE9nements & annonces",
    "block.details": "D\xE9tails & panneau lat\xE9ral",
    "block.recommendations": "Franchise & recommandations",
    "block.sale": "Banni\xE8re d\u2019\xE9v\xE9nement promo",
    "block.edition": "Contenu des \xE9ditions & packs",
    "prices.title": "Prix r\xE9gionaux",
    "prices.desc": "Compare le prix du jeu entre les r\xE9gions Steam, directement sur la page du jeu.",
    "prices.enabled": "Prix r\xE9gionaux activ\xE9s",
    "prices.enabledDesc": "Interrupteur principal du bloc de comparaison des prix.",
    "prices.autoLoad": "Charger les prix automatiquement",
    "prices.autoLoadDesc": "D\xE9sactiv\xE9 affiche un bouton de chargement sur chaque page de jeu.",
    "prices.position": "Position du bloc",
    "prices.positionDesc": "O\xF9 le bloc de comparaison appara\xEEt sur les pages de jeux.",
    "pricesPos.purchase": "Au-dessus des options d\u2019achat",
    "pricesPos.sidebar": "Panneau lat\xE9ral",
    "pricesPos.description": "Sous la description",
    "prices.sort": "Ordre des lignes",
    "prices.sortDesc": "L\u2019ordre par prix utilise des taux de change approximatifs.",
    "pricesSort.custom": "Comme list\xE9",
    "pricesSort.priceAsc": "Prix le plus bas d\u2019abord",
    "pricesSort.discountDesc": "Plus grosse remise d\u2019abord",
    "prices.conversion": "Conversion de devise",
    "prices.conversionDesc": "Convertit tous les prix dans une devise avec des taux en direct.",
    "prices.convertTo": "Devise d\u2019affichage",
    "prices.convertToDesc": "Auto utilise la devise du magasin que tu parcours.",
    "convertTo.auto": "Auto (devise de ton magasin)",
    "convertTo.off": "Non (pas de conversion)",
    "prices.showConverted": "Afficher le prix converti",
    "prices.fxCache": "Dur\xE9e du cache des taux",
    "prices.fxCacheDesc": "Combien de temps les taux sont r\xE9utilis\xE9s avant une nouvelle requ\xEAte.",
    "fxTtl.1h": "1 heure",
    "fxTtl.6h": "6 heures",
    "fxTtl.24h": "24 heures",
    "fxTtl.7d": "7 jours",
    "prices.fxCached": "Taux en cache : {provider}, {date}",
    "prices.fxCacheEmpty": "Aucun taux en cache \u2014 ouvre une page de jeu une fois.",
    "prices.fxClear": "Vider le cache des taux",
    "prices.regions": "R\xE9gions compar\xE9es",
    "prices.regionsDesc": "R\xE9gions du magasin pour lesquelles charger les prix (24 max).",
    "prices.display": "Affichage",
    "prices.showOriginal": "Prix d\u2019origine",
    "prices.showDiscount": "Badge de remise",
    "prices.showSavings": "\xC9conomies par rapport \xE0 ton prix",
    "prices.highlightCheapest": "Surligner le moins cher",
    "prices.showHomeRow": "Ligne de ton prix",
    "prices.collapsed": "Commencer r\xE9duit",
    "prices.collapsedDesc": "Le bloc comparatif d\xE9marre r\xE9duit pour gagner de la place ; d\xE9plie-le via le bouton d\u2019en-t\xEAte.",
    "prices.colRegion": "R\xE9gion",
    "prices.colPrice": "Prix",
    "prices.colDiscount": "Remise",
    "prices.colSavings": "\xC9conomies",
    "prices.yours": "Ton prix",
    "prices.cheapest": "Moins cher",
    "prices.load": "Charger les prix",
    "prices.loading": "Chargement des prix\u2026",
    "prices.retry": "R\xE9essayer",
    "prices.failed": "Impossible de charger les prix",
    "prices.noRegions": "S\xE9lectionne au moins une r\xE9gion dans les r\xE9glages",
    "prices.updated": "Mis \xE0 jour {time}",
    "prices.refresh": "Actualiser les prix",
    "prices.collapse": "R\xE9duire le bloc",
    "prices.expand": "D\xE9plier le bloc",
    "prices.fxHint": "Taux de change : {provider} ({date}).",
    "links.title": "Liens externes",
    "links.desc": "Acc\xE8s rapides aux autres boutiques et bases de donn\xE9es sur la page du jeu.",
    "links.enabled": "Liens externes activ\xE9s",
    "links.enabledDesc": "Interrupteur principal du bloc de liens externes.",
    "links.position": "Position du bloc",
    "links.positionDesc": "Emplacement du bloc de liens sur les pages de jeux.",
    "links.newTab": "Ouvrir dans un nouvel onglet",
    "links.newTabDesc": "Ouvrir les liens externes dans un nouvel onglet.",
    "links.list": "Liens",
    "links.listDesc": "Liens affich\xE9s sur les pages de jeux. Les mod\xE8les invalides sont ignor\xE9s.",
    "links.templateHelp": "Mod\xE8le d\u2019URL : {name} pour le titre du jeu, {appid} pour l\u2019identifiant Steam \u2014 ex. https://store.epicgames.com/en-US/browse?q={name} ou https://steamdb.info/app/{appid}/",
    "links.name": "Nom",
    "links.namePlaceholder": "GOG",
    "links.url": "Adresse du lien",
    "links.urlPlaceholder": "https://www.gog.com/games?query={name}",
    "links.icon": "Adresse de l\u2019ic\xF4ne (facultatif)",
    "links.iconPlaceholder": "https://www.gog.com/favicon.ico",
    "links.add": "Ajouter un lien",
    "links.remove": "Supprimer ce lien",
    "links.moveUp": "Monter",
    "links.moveDown": "Descendre",
    "links.empty": "Aucun lien \u2014 ajoutez-en un ci-dessous.",
    "links.restore": "Restaurer les valeurs",
    "links.preview": "Aper\xE7u",
    "links.open": "Ouvrir",
    "region.title": "Contournement r\xE9gional",
    "region.desc": "Recharge les pages \xAB indisponible dans votre r\xE9gion \xBB via une requ\xEAte invit\xE9e anonyme (sans cookies de compte).",
    "region.enabled": "Contournement r\xE9gional activ\xE9",
    "region.enabledDesc": "Interrupteur principal pour recharger les pages bloqu\xE9es.",
    "region.showBanner": "Afficher le bandeau",
    "region.showBannerDesc": "Indique que la page vient d\u2019une requ\xEAte invit\xE9e anonyme. Masqu\xE9 par d\xE9faut ; appliqu\xE9 au prochain rechargement.",
    "region.mode": "Sur les pages bloqu\xE9es",
    "region.modeDesc": "Auto remplace la page d\u2019erreur aussit\xF4t ; manuel affiche d\u2019abord un bouton.",
    "regionMode.auto": "Automatiquement",
    "regionMode.manual": "Via bouton",
    "region.country": "Pays du magasin (cc)",
    "region.countryDesc": "Code pays \xE0 deux lettres, optionnel, pour les requ\xEAtes invit\xE9es. Vide garde votre pays.",
    "region.countryPlaceholder": "US",
    "region.proxy": "Passerelle proxy",
    "region.proxyDesc": "Pour les verrous IP : fait passer la requ\xEAte anonyme par une passerelle HTTP dans une r\xE9gion libre.",
    "region.proxyEnabled": "Utiliser la passerelle proxy",
    "region.proxyMode": "Mode passerelle",
    "region.proxyModeDesc": "Fa\xE7on d\u2019ajouter l\u2019URL du magasin \xE0 h\xF4te:port.",
    "regionProxyMode.gateway": "h\xF4te:port/https://\u2026",
    "regionProxyMode.path": "h\xF4te:port/store.steampowered.com/\u2026",
    "regionProxyMode.query": "h\xF4te:port/?url=\u2026",
    "region.proxyHost": "H\xF4te",
    "region.proxyPort": "Port",
    "region.proxyUser": "Utilisateur",
    "region.proxyPass": "Mot de passe",
    "region.bannerBadge": "R\xE9gion bloqu\xE9e",
    "region.bannerTitle": "Cette page est indisponible dans votre r\xE9gion",
    "region.bannerBody": "Affich\xE9e via une requ\xEAte invit\xE9e anonyme (sans cookies de compte)",
    "region.bannerViaProxy": "via la passerelle proxy",
    "region.reload": "Recharger",
    "region.retry": "R\xE9essayer",
    "region.offer": "Cette page est bloqu\xE9e dans votre r\xE9gion. La charger sans cookies de compte ?",
    "region.offerButton": "Afficher la page",
    "region.loading": "Chargement sans cookies de compte\u2026",
    "region.errorBlocked": "Toujours bloqu\xE9 par IP/r\xE9gion. Activez une passerelle proxy vers une r\xE9gion libre.",
    "region.errorBlockedProxy": "Toujours bloqu\xE9. L\u2019IP du proxy est sans doute aussi restreinte \u2014 essayez un autre n\u0153ud de sortie.",
    "region.errorAgeGate": "Steam affiche un contr\xF4le d\u2019\xE2ge. Appuyez sur R\xE9essayer \u2014 les cookies d\u2019\xE2ge partent seuls.",
    "region.errorFailed": "\xC9chec du chargement : {error}",
    "cache.usage": "Utilisation du stockage",
    "cache.contents": "Traductions enregistr\xE9es",
    "cache.clear": "Vider le cache",
    "cache.cleared": "Cache vid\xE9 ({count})",
    "cache.empty": "Le cache est vide",
    "cache.clearHint": "Supprime toutes les traductions enregistr\xE9es de ce profil de navigateur.",
    "cache.listEmpty": "Aucune traduction enregistr\xE9e pour l\u2019instant \u2014 traduisez un contenu et il appara\xEEtra ici.",
    "cache.listMore": "\u2026et {count} autres",
    "cache.removeEntry": "Supprimer cette entr\xE9e",
    "cache.entries": "{count} entr\xE9es",
    "cache.used": "{used} dans {count} entr\xE9es",
    "cache.free": "Libre",
    "cache.pct": "{pct} % plein",
    "about.blurb": "Am\xE9liore les pages du magasin et de la communaut\xE9 Steam : traduction du contenu avec cache, et bien plus \xE0 venir.",
    "about.repo": "GitHub",
    "about.repoHint": "Code source, mises \xE0 jour et signalements de probl\xE8mes",
    "toast.saved": "Param\xE8tres enregistr\xE9s",
    "toast.rateLimited": "Traduction limit\xE9e",
    "toast.rateLimitedDesc": "Google limite actuellement les requ\xEAtes. Les blocs r\xE9essaient automatiquement \u2014 ou cliquez sur R\xE9essayer plus tard.",
    "toast.translateFailed": "\xC9chec de la traduction",
    "toast.translateFailedDesc": "Une erreur est survenue. Cliquez sur R\xE9essayer sur le bloc.",
    "toast.unknownProvider": "Fournisseur inconnu",
    "toast.unknownProviderDesc": "V\xE9rifiez le fournisseur dans les param\xE8tres et enregistrez.",
    "toast.cacheCleared": "Langue cible modifi\xE9e \u2014 cache de traduction vid\xE9.",
    "translate.button": "Traduire",
    "translate.original": "Original",
    "translate.loading": "Traduction\u2026",
    "translate.loadingShort": "Traduction",
    "translate.error": "Erreur de traduction",
    "translate.retry": "R\xE9essayer",
    "queue.addToWishlist": "Ajouter \xE0 votre liste de souhaits",
    "queue.onWishlist": "Dans la liste de souhaits",
    "queue.addedNotice": "Article ajout\xE9 \xE0 votre liste de souhaits !",
    "queue.oops": "Oups, d\xE9sol\xE9 !",
    "queue.follow": "Suivre",
    "queue.following": "Suivi",
    "queue.ignore": "Ignorer",
    "queue.ignored": "Ignor\xE9",
    "queue.viewQueue": "Voir votre file",
    "queue.manageWishlist": "G\xE9rer votre liste de souhaits",
    "queue.removeWishlist": "Retirer de votre liste de souhaits",
    "queue.ignoreDefault": "Ignorer ceci (par d\xE9faut)",
    "queue.ignoreDefaultSub": "Masquer du magasin, ignorer les notifications et ne pas utiliser pour g\xE9n\xE9rer d\u2019autres recommandations.",
    "queue.playedElsewhere": "Jou\xE9 sur une autre plateforme",
    "queue.playedElsewhereSub": "Masquer du magasin. Peut \xEAtre utilis\xE9 pour g\xE9n\xE9rer des recommandations.",
    "queue.actionFailed": "Impossible d\u2019enregistrer les modifications",
    "queue.actionFailedDesc": "Un probl\xE8me est survenu lors de l\u2019enregistrement. Veuillez r\xE9essayer plus tard."
  };

  // src/i18n/locales/pt-BR.js
  var pt_BR_default = {
    "menu.settings": "Configura\xE7\xF5es Steam Plus",
    "tab.general": "Geral",
    "tab.translation": "Tradu\xE7\xE3o",
    "tab.gamepage": "P\xE1gina do jogo",
    "tab.prices": "Pre\xE7os",
    "tab.cache": "Cache",
    "tab.about": "Sobre o script",
    "tab.general.desc": "Idioma da interface e notifica\xE7\xF5es.",
    "tab.translation.desc": "Traduz descri\xE7\xF5es, an\xE1lises, coment\xE1rios e not\xEDcias.",
    "tab.gamepage.desc": "Oculta blocos desnecess\xE1rios nas p\xE1ginas de jogos.",
    "tab.prices.desc": "Compara pre\xE7os regionais e converte moedas.",
    "tab.links": "Links externos",
    "tab.links.desc": "Atalhos para outras lojas e bancos de dados.",
    "tab.region": "Regi\xE3o",
    "tab.region.desc": "Carrega p\xE1ginas da loja bloqueadas na sua regi\xE3o.",
    "tab.cache.desc": "Tradu\xE7\xF5es salvas e uso de armazenamento.",
    "tab.about.desc": "Vers\xE3o, autor e c\xF3digo-fonte.",
    "panel.subtitle": "Tradu\xE7\xE3o \xB7 p\xE1gina do jogo \xB7 pre\xE7os \xB7 links \xB7 regi\xE3o \xB7 cache \xB7 interface",
    "panel.back": "Voltar",
    "common.on": "Ativado",
    "common.off": "Desativado",
    "common.auto": "Autom\xE1tico",
    "common.close": "Fechar",
    "common.cancel": "Cancelar",
    "common.save": "Salvar",
    "common.reset": "Restaurar padr\xF5es",
    "common.saved": "Salvo",
    "common.settings": "Configura\xE7\xF5es",
    "general.language": "Idioma da interface",
    "general.languageDesc": "Idioma do painel de configura\xE7\xF5es do Steam Plus.",
    "general.saveHint": "As altera\xE7\xF5es s\xE3o aplicadas ao pressionar Salvar abaixo.",
    "reset.confirm": "Restaurar todas as configura\xE7\xF5es para os valores padr\xE3o?",
    "general.toasts": "Notifica\xE7\xF5es",
    "toasts.enabled": "Notifica\xE7\xF5es pop-up",
    "toasts.enabledDesc": "Mostrar pop-ups de sucesso e erro de configura\xE7\xF5es e tradu\xE7\xF5es.",
    "toasts.position": "Posi\xE7\xE3o na tela",
    "toasts.duration": "Ocultar ap\xF3s (segundos)",
    "toasts.durationDesc": "0 = permanece at\xE9 ser dispensado.",
    "toastPos.bottom-right": "Inferior direito",
    "toastPos.bottom-left": "Inferior esquerdo",
    "toastPos.top-right": "Superior direito",
    "toastPos.top-left": "Superior esquerdo",
    "translation.title": "Tradu\xE7\xE3o",
    "translation.behavior": "Comportamento",
    "translation.desc": "Tradu\xE7\xE3o de conte\xFAdo do Steam: descri\xE7\xF5es, an\xE1lises, coment\xE1rios e not\xEDcias.",
    "translation.enabled": "Tradu\xE7\xE3o ativada",
    "translation.enabledDesc": "Interruptor global do recurso de tradu\xE7\xE3o.",
    "translation.provider": "Provedor de tradu\xE7\xE3o",
    "translation.providerDesc": "Servi\xE7o usado para traduzir os textos.",
    "provider.google-free": "Google (gratuito)",
    "translation.trigger": "Modo de tradu\xE7\xE3o",
    "translation.triggerDesc": "Traduzir automaticamente quando o conte\xFAdo aparecer ou por bot\xE3o.",
    "trigger.auto": "Automaticamente",
    "trigger.manual": "Por bot\xE3o",
    "translation.display": "Exibi\xE7\xE3o da tradu\xE7\xE3o",
    "translation.displayDesc": "Substituir o texto original ou mostrar a tradu\xE7\xE3o abaixo dele.",
    "display.below": "Abaixo do original",
    "display.replace": "Substituir texto",
    "translation.targetLanguage": "Idioma da tradu\xE7\xE3o",
    "translation.targetLanguageDesc": "Idioma para o qual o conte\xFAdo ser\xE1 traduzido.",
    "targetLanguage.auto": "Como o Steam / navegador",
    "translation.showCached": "Mostrar tradu\xE7\xF5es salvas na hora",
    "translation.showCachedDesc": "Se a tradu\xE7\xE3o j\xE1 estiver em cache, ela aparece sem clicar no bot\xE3o.",
    "translation.scopes": "O que traduzir",
    "translation.scopesDesc": "Selecione os tipos de conte\xFAdo a serem traduzidos.",
    "scope.gameDescription": "Descri\xE7\xF5es de jogos",
    "scope.gameReviews": "An\xE1lises de jogos",
    "scope.profileComments": "Coment\xE1rios do perfil",
    "scope.gameNews": "Not\xEDcias e eventos",
    "gamepage.title": "P\xE1gina do jogo",
    "gamepage.desc": "Organize as p\xE1ginas de jogos da Steam: oculte os blocos que voc\xEA nunca l\xEA.",
    "gamepage.enabled": "Ocultar blocos da p\xE1gina do jogo",
    "gamepage.enabledDesc": "Chave principal para ocultar blocos nas p\xE1ginas de jogos.",
    "gamepage.blocks": "Blocos ocultos",
    "gamepage.blocksDesc": "Escolha quais blocos ocultar nas p\xE1ginas de jogos (p\xE1ginas de aplicativo da loja).",
    "block.media": "Capturas & trailers",
    "block.purchase": "Op\xE7\xF5es de compra & pacotes",
    "block.description": "Sobre este jogo",
    "block.dlc": "Conte\xFAdo para este jogo (DLC)",
    "block.sysreq": "Requisitos do sistema",
    "block.reviews": "An\xE1lises de usu\xE1rios",
    "block.curators": "O que dizem os curadores",
    "block.events": "Eventos & an\xFAncios",
    "block.details": "Detalhes & barra lateral",
    "block.recommendations": "Franquia & recomenda\xE7\xF5es",
    "block.sale": "Banner do evento de oferta",
    "block.edition": "Conte\xFAdo de edi\xE7\xF5es & pacotes",
    "prices.title": "Pre\xE7os regionais",
    "prices.desc": "Compare o pre\xE7o do jogo entre regi\xF5es da Steam direto na p\xE1gina do jogo.",
    "prices.enabled": "Pre\xE7os regionais ativados",
    "prices.enabledDesc": "Chave principal do bloco de compara\xE7\xE3o de pre\xE7os.",
    "prices.autoLoad": "Carregar pre\xE7os automaticamente",
    "prices.autoLoadDesc": "Desligado mostra um bot\xE3o de carregar em cada p\xE1gina de jogo.",
    "prices.position": "Posi\xE7\xE3o do bloco",
    "prices.positionDesc": "Onde o bloco de compara\xE7\xE3o aparece nas p\xE1ginas de jogos.",
    "pricesPos.purchase": "Acima das op\xE7\xF5es de compra",
    "pricesPos.sidebar": "Barra lateral",
    "pricesPos.description": "Abaixo da descri\xE7\xE3o",
    "prices.sort": "Ordem das linhas",
    "prices.sortDesc": "A ordem por pre\xE7o usa taxas de c\xE2mbio aproximadas.",
    "pricesSort.custom": "Como listado",
    "pricesSort.priceAsc": "Menor pre\xE7o primeiro",
    "pricesSort.discountDesc": "Maior desconto primeiro",
    "prices.conversion": "Convers\xE3o de moeda",
    "prices.conversionDesc": "Converte todos os pre\xE7os para uma moeda com taxas ao vivo.",
    "prices.convertTo": "Moeda de exibi\xE7\xE3o",
    "prices.convertToDesc": "Auto usa a moeda da loja que voc\xEA est\xE1 vendo.",
    "convertTo.auto": "Auto (moeda da sua loja)",
    "convertTo.off": "N\xE3o (sem convers\xE3o)",
    "prices.showConverted": "Mostrar pre\xE7o convertido",
    "prices.fxCache": "Dura\xE7\xE3o do cache",
    "prices.fxCacheDesc": "Por quanto tempo as taxas s\xE3o reutilizadas antes de um novo pedido.",
    "fxTtl.1h": "1 hora",
    "fxTtl.6h": "6 horas",
    "fxTtl.24h": "24 horas",
    "fxTtl.7d": "7 dias",
    "prices.fxCached": "Taxas em cache: {provider}, {date}",
    "prices.fxCacheEmpty": "Sem taxas em cache \u2014 abra qualquer p\xE1gina de jogo uma vez.",
    "prices.fxClear": "Limpar cache de taxas",
    "prices.regions": "Regi\xF5es comparadas",
    "prices.regionsDesc": "Regi\xF5es da loja para carregar pre\xE7os (at\xE9 24).",
    "prices.display": "Exibi\xE7\xE3o",
    "prices.showOriginal": "Pre\xE7o original",
    "prices.showDiscount": "Selo de desconto",
    "prices.showSavings": "Economia vs seu pre\xE7o",
    "prices.highlightCheapest": "Destacar o mais barato",
    "prices.showHomeRow": "Linha do seu pre\xE7o",
    "prices.collapsed": "Come\xE7ar recolhido",
    "prices.collapsedDesc": "O bloco de compara\xE7\xE3o come\xE7a recolhido para economizar espa\xE7o; expanda pelo bot\xE3o do cabe\xE7alho.",
    "prices.colRegion": "Regi\xE3o",
    "prices.colPrice": "Pre\xE7o",
    "prices.colDiscount": "Desconto",
    "prices.colSavings": "Economia",
    "prices.yours": "Seu pre\xE7o",
    "prices.cheapest": "Mais barato",
    "prices.load": "Carregar pre\xE7os",
    "prices.loading": "Carregando pre\xE7os\u2026",
    "prices.retry": "Tentar de novo",
    "prices.failed": "N\xE3o foi poss\xEDvel carregar os pre\xE7os",
    "prices.noRegions": "Selecione ao menos uma regi\xE3o nas configura\xE7\xF5es",
    "prices.updated": "Atualizado {time}",
    "prices.refresh": "Atualizar pre\xE7os",
    "prices.collapse": "Recolher bloco",
    "prices.expand": "Expandir bloco",
    "prices.fxHint": "Taxas de c\xE2mbio: {provider} ({date}).",
    "links.title": "Links externos",
    "links.desc": "Atalhos para outras lojas e bancos de dados na p\xE1gina do jogo.",
    "links.enabled": "Links externos ativados",
    "links.enabledDesc": "Chave principal do bloco de links externos.",
    "links.position": "Posi\xE7\xE3o do bloco",
    "links.positionDesc": "Onde o bloco de links aparece nas p\xE1ginas de jogos.",
    "links.newTab": "Abrir em nova guia",
    "links.newTabDesc": "Abrir links externos em uma nova guia.",
    "links.list": "Links",
    "links.listDesc": "Links exibidos nas p\xE1ginas de jogos. Modelos inv\xE1lidos s\xE3o ignorados.",
    "links.templateHelp": "Modelo de URL: {name} para o t\xEDtulo do jogo, {appid} para o id da Steam. Ex.: https://store.epicgames.com/en-US/browse?q={name} ou https://steamdb.info/app/{appid}/",
    "links.name": "Nome",
    "links.namePlaceholder": "GOG",
    "links.url": "Endere\xE7o do link",
    "links.urlPlaceholder": "https://www.gog.com/games?query={name}",
    "links.icon": "Endere\xE7o do \xEDcone (opcional)",
    "links.iconPlaceholder": "https://www.gog.com/favicon.ico",
    "links.add": "Adicionar link",
    "links.remove": "Remover este link",
    "links.moveUp": "Mover para cima",
    "links.moveDown": "Mover para baixo",
    "links.empty": "Sem links \u2014 adicione um abaixo.",
    "links.restore": "Restaurar padr\xF5es",
    "links.preview": "Pr\xE9via",
    "links.open": "Abrir",
    "region.title": "Bypass de regi\xE3o",
    "region.desc": "Recarrega p\xE1ginas com \xABindispon\xEDvel na sua regi\xE3o\xBB via requisi\xE7\xE3o an\xF4nima de visitante (sem cookies da conta).",
    "region.enabled": "Bypass de regi\xE3o ativado",
    "region.enabledDesc": "Chave principal para recarregar p\xE1ginas bloqueadas.",
    "region.showBanner": "Mostrar aviso",
    "region.showBannerDesc": "Mostra que a p\xE1gina foi carregada via requisi\xE7\xE3o an\xF4nima de visitante. Oculto por padr\xE3o; vale a partir da pr\xF3xima recarga.",
    "region.mode": "Em p\xE1ginas bloqueadas",
    "region.modeDesc": "Autom\xE1tico substitui a p\xE1gina de erro na hora; manual mostra um bot\xE3o antes.",
    "regionMode.auto": "Automaticamente",
    "regionMode.manual": "Via bot\xE3o",
    "region.country": "Pa\xEDs da loja (cc)",
    "region.countryDesc": "C\xF3digo de pa\xEDs de duas letras, opcional, para requisi\xE7\xF5es de visitante. Vazio mant\xE9m seu pa\xEDs.",
    "region.countryPlaceholder": "US",
    "region.proxy": "Gateway proxy",
    "region.proxyDesc": "Para bloqueios por IP: envia a requisi\xE7\xE3o an\xF4nima por um gateway HTTP numa regi\xE3o livre.",
    "region.proxyEnabled": "Usar gateway proxy",
    "region.proxyMode": "Modo do gateway",
    "region.proxyModeDesc": "Como a URL da loja \xE9 anexada a host:porta.",
    "regionProxyMode.gateway": "host:porta/https://\u2026",
    "regionProxyMode.path": "host:porta/store.steampowered.com/\u2026",
    "regionProxyMode.query": "host:porta/?url=\u2026",
    "region.proxyHost": "Host",
    "region.proxyPort": "Porta",
    "region.proxyUser": "Usu\xE1rio",
    "region.proxyPass": "Senha",
    "region.bannerBadge": "Regi\xE3o bloqueada",
    "region.bannerTitle": "Esta p\xE1gina est\xE1 indispon\xEDvel na sua regi\xE3o",
    "region.bannerBody": "Exibida via requisi\xE7\xE3o an\xF4nima de visitante (sem cookies da conta)",
    "region.bannerViaProxy": "via gateway proxy",
    "region.reload": "Recarregar",
    "region.retry": "Tentar de novo",
    "region.offer": "Esta p\xE1gina est\xE1 bloqueada na sua regi\xE3o. Carreg\xE1-la sem cookies da conta?",
    "region.offerButton": "Mostrar p\xE1gina",
    "region.loading": "Carregando sem cookies da conta\u2026",
    "region.errorBlocked": "Ainda bloqueada por IP/regi\xE3o. Ative um gateway proxy para uma regi\xE3o livre.",
    "region.errorBlockedProxy": "Ainda bloqueada. O IP do proxy tamb\xE9m deve estar restrito \u2014 tente outro n\xF3 de sa\xEDda.",
    "region.errorAgeGate": "A Steam mostrou verifica\xE7\xE3o de idade. Aperte Tentar de novo \u2014 os cookies de idade v\xE3o sozinhos.",
    "region.errorFailed": "Falha ao carregar: {error}",
    "cache.usage": "Uso de armazenamento",
    "cache.contents": "Tradu\xE7\xF5es salvas",
    "cache.clear": "Limpar cache",
    "cache.cleared": "Cache limpo ({count})",
    "cache.empty": "O cache est\xE1 vazio",
    "cache.clearHint": "Remove todas as tradu\xE7\xF5es salvas deste perfil de navegador.",
    "cache.listEmpty": "Ainda n\xE3o h\xE1 tradu\xE7\xF5es salvas \u2014 traduza algo e ele aparecer\xE1 aqui.",
    "cache.listMore": "\u2026e mais {count}",
    "cache.removeEntry": "Remover esta entrada",
    "cache.entries": "{count} entradas",
    "cache.used": "{used} em {count} entradas",
    "cache.free": "Livre",
    "cache.pct": "{pct}% cheio",
    "about.blurb": "Melhora as p\xE1ginas da loja e da comunidade Steam: tradu\xE7\xE3o de conte\xFAdo com cache e muito mais por vir.",
    "about.repo": "GitHub",
    "about.repoHint": "C\xF3digo-fonte, atualiza\xE7\xF5es e relat\xF3rios de problemas",
    "toast.saved": "Configura\xE7\xF5es salvas",
    "toast.rateLimited": "Tradu\xE7\xE3o limitada",
    "toast.rateLimitedDesc": "O Google est\xE1 limitando as solicita\xE7\xF5es. Os blocos tentam de novo sozinhos \u2014 ou pressione Tentar novamente mais tarde.",
    "toast.translateFailed": "Falha na tradu\xE7\xE3o",
    "toast.translateFailedDesc": "Algo deu errado. Pressione Tentar novamente no bloco.",
    "toast.unknownProvider": "Provedor desconhecido",
    "toast.unknownProviderDesc": "Verifique o provedor nas configura\xE7\xF5es e salve novamente.",
    "toast.cacheCleared": "Idioma alterado \u2014 cache de tradu\xE7\xF5es limpo.",
    "translate.button": "Traduzir",
    "translate.original": "Original",
    "translate.loading": "Traduzindo\u2026",
    "translate.loadingShort": "Traduzindo",
    "translate.error": "Erro de tradu\xE7\xE3o",
    "translate.retry": "Tentar novamente",
    "queue.addToWishlist": "Adicionar \xE0 lista de desejos",
    "queue.onWishlist": "Na lista de desejos",
    "queue.addedNotice": "Item adicionado \xE0 lista de desejos!",
    "queue.oops": "Ops, desculpe!",
    "queue.follow": "Seguir",
    "queue.following": "Seguindo",
    "queue.ignore": "Ignorar",
    "queue.ignored": "Ignorado",
    "queue.viewQueue": "Ver sua fila",
    "queue.manageWishlist": "Gerenciar lista de desejos",
    "queue.removeWishlist": "Remover da lista de desejos",
    "queue.ignoreDefault": "Ignorar isto (padr\xE3o)",
    "queue.ignoreDefaultSub": "Ocultar da loja, ignorar notifica\xE7\xF5es e n\xE3o usar para gerar outras recomenda\xE7\xF5es.",
    "queue.playedElsewhere": "Jogado em outra plataforma",
    "queue.playedElsewhereSub": "Ocultar da loja. Pode ser usado para gerar recomenda\xE7\xF5es.",
    "queue.actionFailed": "N\xE3o foi poss\xEDvel salvar as altera\xE7\xF5es",
    "queue.actionFailedDesc": "Ocorreu um problema ao salvar as altera\xE7\xF5es. Tente novamente mais tarde."
  };

  // src/i18n/locales/zh-CN.js
  var zh_CN_default = {
    "menu.settings": "\u8BBE\u7F6E Steam Plus",
    "tab.general": "\u5E38\u89C4",
    "tab.translation": "\u7FFB\u8BD1",
    "tab.gamepage": "\u6E38\u620F\u9875\u9762",
    "tab.prices": "\u4EF7\u683C",
    "tab.cache": "\u7F13\u5B58",
    "tab.about": "\u5173\u4E8E\u811A\u672C",
    "tab.general.desc": "\u754C\u9762\u8BED\u8A00\u548C\u901A\u77E5\u3002",
    "tab.translation.desc": "\u7FFB\u8BD1\u63CF\u8FF0\u3001\u8BC4\u6D4B\u3001\u8BC4\u8BBA\u548C\u65B0\u95FB\u3002",
    "tab.gamepage.desc": "\u9690\u85CF\u6E38\u620F\u9875\u9762\u4E0A\u4E0D\u9700\u8981\u7684\u533A\u5757\u3002",
    "tab.prices.desc": "\u6BD4\u8F83\u5404\u533A\u57DF\u4EF7\u683C\u5E76\u6362\u7B97\u8D27\u5E01\u3002",
    "tab.links": "\u5916\u90E8\u94FE\u63A5",
    "tab.links.desc": "\u5FEB\u901F\u8DF3\u8F6C\u5230\u5176\u4ED6\u5546\u5E97\u548C\u6570\u636E\u5E93\u3002",
    "tab.region": "\u533A\u57DF",
    "tab.region.desc": "\u52A0\u8F7D\u5728\u60A8\u6240\u5728\u533A\u57DF\u88AB\u5C4F\u853D\u7684\u5546\u5E97\u9875\u9762\u3002",
    "tab.cache.desc": "\u5DF2\u4FDD\u5B58\u7684\u7FFB\u8BD1\u548C\u5B58\u50A8\u5360\u7528\u3002",
    "tab.about.desc": "\u7248\u672C\u3001\u4F5C\u8005\u548C\u6E90\u4EE3\u7801\u3002",
    "panel.subtitle": "\u7FFB\u8BD1 \xB7 \u6E38\u620F\u9875\u9762 \xB7 \u4EF7\u683C \xB7 \u94FE\u63A5 \xB7 \u533A\u57DF \xB7 \u7F13\u5B58 \xB7 \u754C\u9762",
    "panel.back": "\u8FD4\u56DE",
    "common.on": "\u5F00",
    "common.off": "\u5173",
    "common.auto": "\u81EA\u52A8",
    "common.close": "\u5173\u95ED",
    "common.cancel": "\u53D6\u6D88",
    "common.save": "\u4FDD\u5B58",
    "common.reset": "\u6062\u590D\u9ED8\u8BA4\u8BBE\u7F6E",
    "common.saved": "\u5DF2\u4FDD\u5B58",
    "common.settings": "\u8BBE\u7F6E",
    "general.language": "\u754C\u9762\u8BED\u8A00",
    "general.languageDesc": "Steam Plus \u8BBE\u7F6E\u9762\u677F\u7684\u8BED\u8A00\u3002",
    "general.saveHint": "\u70B9\u51FB\u4E0B\u65B9\u7684\u201C\u4FDD\u5B58\u201D\u540E\u5E94\u7528\u66F4\u6539\u3002",
    "reset.confirm": "\u5C06\u6240\u6709\u8BBE\u7F6E\u6062\u590D\u4E3A\u9ED8\u8BA4\u503C\u5417\uFF1F",
    "general.toasts": "\u901A\u77E5",
    "toasts.enabled": "\u5F39\u51FA\u901A\u77E5",
    "toasts.enabledDesc": "\u663E\u793A\u8BBE\u7F6E\u548C\u7FFB\u8BD1\u7684\u6210\u529F\u4E0E\u9519\u8BEF\u5F39\u51FA\u901A\u77E5\u3002",
    "toasts.position": "\u5C4F\u5E55\u4F4D\u7F6E",
    "toasts.duration": "\u81EA\u52A8\u9690\u85CF\uFF08\u79D2\uFF09",
    "toasts.durationDesc": "0 \u8868\u793A\u624B\u52A8\u5173\u95ED\u524D\u4E00\u76F4\u663E\u793A\u3002",
    "toastPos.bottom-right": "\u53F3\u4E0B",
    "toastPos.bottom-left": "\u5DE6\u4E0B",
    "toastPos.top-right": "\u53F3\u4E0A",
    "toastPos.top-left": "\u5DE6\u4E0A",
    "translation.title": "\u7FFB\u8BD1",
    "translation.behavior": "\u884C\u4E3A",
    "translation.desc": "\u7FFB\u8BD1 Steam \u5185\u5BB9\uFF1A\u7B80\u4ECB\u3001\u8BC4\u6D4B\u3001\u8BC4\u8BBA\u548C\u65B0\u95FB\u3002",
    "translation.enabled": "\u542F\u7528\u7FFB\u8BD1",
    "translation.enabledDesc": "\u7FFB\u8BD1\u529F\u80FD\u7684\u603B\u5F00\u5173\u3002",
    "translation.provider": "\u7FFB\u8BD1\u670D\u52A1\u63D0\u4F9B\u5546",
    "translation.providerDesc": "\u7528\u4E8E\u7FFB\u8BD1\u6587\u672C\u7684\u670D\u52A1\u3002",
    "provider.google-free": "Google\uFF08\u514D\u8D39\uFF09",
    "translation.trigger": "\u7FFB\u8BD1\u6A21\u5F0F",
    "translation.triggerDesc": "\u5728\u5185\u5BB9\u51FA\u73B0\u65F6\u81EA\u52A8\u7FFB\u8BD1\uFF0C\u6216\u901A\u8FC7\u6309\u94AE\u7FFB\u8BD1\u3002",
    "trigger.auto": "\u81EA\u52A8",
    "trigger.manual": "\u901A\u8FC7\u6309\u94AE",
    "translation.display": "\u7FFB\u8BD1\u663E\u793A\u65B9\u5F0F",
    "translation.displayDesc": "\u66FF\u6362\u539F\u6587\uFF0C\u6216\u5728\u539F\u6587\u4E0B\u65B9\u663E\u793A\u7FFB\u8BD1\u3002",
    "display.below": "\u663E\u793A\u5728\u539F\u6587\u4E0B\u65B9",
    "display.replace": "\u66FF\u6362\u539F\u6587",
    "translation.targetLanguage": "\u7FFB\u8BD1\u76EE\u6807\u8BED\u8A00",
    "translation.targetLanguageDesc": "\u5C06\u5185\u5BB9\u7FFB\u8BD1\u6210\u54EA\u79CD\u8BED\u8A00\u3002",
    "targetLanguage.auto": "\u8DDF\u968F Steam / \u6D4F\u89C8\u5668",
    "translation.showCached": "\u7ACB\u5373\u663E\u793A\u5DF2\u4FDD\u5B58\u7684\u7FFB\u8BD1",
    "translation.showCachedDesc": "\u5982\u679C\u7FFB\u8BD1\u5DF2\u5728\u7F13\u5B58\u4E2D\uFF0C\u5219\u65E0\u9700\u70B9\u51FB\u6309\u94AE\u76F4\u63A5\u663E\u793A\u3002",
    "translation.scopes": "\u7FFB\u8BD1\u5185\u5BB9",
    "translation.scopesDesc": "\u9009\u62E9\u9700\u8981\u7FFB\u8BD1\u7684\u5185\u5BB9\u7C7B\u578B\u3002",
    "scope.gameDescription": "\u6E38\u620F\u7B80\u4ECB",
    "scope.gameReviews": "\u6E38\u620F\u8BC4\u6D4B",
    "scope.profileComments": "\u4E2A\u4EBA\u8D44\u6599\u8BC4\u8BBA",
    "scope.gameNews": "\u65B0\u95FB\u4E0E\u6D3B\u52A8",
    "gamepage.title": "\u6E38\u620F\u9875\u9762",
    "gamepage.desc": "\u6574\u7406 Steam \u6E38\u620F\u9875\u9762\uFF1A\u9690\u85CF\u4F60\u4ECE\u4E0D\u9605\u8BFB\u7684\u7248\u5757\u3002",
    "gamepage.enabled": "\u9690\u85CF\u6E38\u620F\u9875\u9762\u7248\u5757",
    "gamepage.enabledDesc": "\u5728\u6E38\u620F\u9875\u9762\u9690\u85CF\u7248\u5757\u7684\u603B\u5F00\u5173\u3002",
    "gamepage.blocks": "\u9690\u85CF\u7684\u7248\u5757",
    "gamepage.blocksDesc": "\u9009\u62E9\u8981\u5728\u6E38\u620F\u9875\u9762\uFF08\u5546\u5E97\u5E94\u7528\u9875\u9762\uFF09\u4E0A\u9690\u85CF\u7684\u7248\u5757\u3002",
    "block.media": "\u622A\u56FE\u4E0E\u9884\u544A\u7247",
    "block.purchase": "\u8D2D\u4E70\u9009\u9879\u4E0E\u6346\u7ED1\u5305",
    "block.description": "\u5173\u4E8E\u6B64\u6E38\u620F",
    "block.dlc": "\u6B64\u6E38\u620F\u7684\u5185\u5BB9\uFF08DLC\uFF09",
    "block.sysreq": "\u7CFB\u7EDF\u8981\u6C42",
    "block.reviews": "\u7528\u6237\u8BC4\u6D4B",
    "block.curators": "\u9274\u8D4F\u5BB6\u70B9\u8BC4",
    "block.events": "\u6D3B\u52A8\u4E0E\u516C\u544A",
    "block.details": "\u8BE6\u60C5\u4E0E\u4FA7\u680F\u4FE1\u606F",
    "block.recommendations": "\u7CFB\u5217\u4E0E\u63A8\u8350",
    "block.sale": "\u4FC3\u9500\u6D3B\u52A8\u6A2A\u5E45",
    "block.edition": "\u7248\u672C\u4E0E\u6346\u7ED1\u5305\u5185\u5BB9",
    "prices.title": "\u533A\u57DF\u4EF7\u683C",
    "prices.desc": "\u76F4\u63A5\u5728\u6E38\u620F\u9875\u9762\u6BD4\u8F83 Steam \u5404\u533A\u57DF\u7684\u6E38\u620F\u4EF7\u683C\u3002",
    "prices.enabled": "\u5DF2\u542F\u7528\u533A\u57DF\u4EF7\u683C",
    "prices.enabledDesc": "\u533A\u57DF\u4EF7\u683C\u6BD4\u8F83\u6A21\u5757\u7684\u603B\u5F00\u5173\u3002",
    "prices.autoLoad": "\u81EA\u52A8\u52A0\u8F7D\u4EF7\u683C",
    "prices.autoLoadDesc": "\u5173\u95ED\u540E\uFF0C\u6BCF\u4E2A\u6E38\u620F\u9875\u9762\u5C06\u663E\u793A\u52A0\u8F7D\u6309\u94AE\u3002",
    "prices.position": "\u6A21\u5757\u4F4D\u7F6E",
    "prices.positionDesc": "\u6BD4\u8F83\u6A21\u5757\u5728\u6E38\u620F\u9875\u9762\u4E0A\u7684\u663E\u793A\u4F4D\u7F6E\u3002",
    "pricesPos.purchase": "\u8D2D\u4E70\u9009\u9879\u4E0A\u65B9",
    "pricesPos.sidebar": "\u4FA7\u680F",
    "pricesPos.description": "\u7B80\u4ECB\u4E0B\u65B9",
    "prices.sort": "\u884C\u6392\u5E8F",
    "prices.sortDesc": "\u6309\u4EF7\u683C\u6392\u5E8F\u4F7F\u7528\u8FD1\u4F3C\u6C47\u7387\u3002",
    "pricesSort.custom": "\u6309\u5217\u8868\u987A\u5E8F",
    "pricesSort.priceAsc": "\u4EF7\u683C\u4ECE\u4F4E\u5230\u9AD8",
    "pricesSort.discountDesc": "\u6298\u6263\u4ECE\u9AD8\u5230\u4F4E",
    "prices.conversion": "\u8D27\u5E01\u6362\u7B97",
    "prices.conversionDesc": "\u6309\u5B9E\u65F6\u6C47\u7387\u5C06\u6240\u6709\u4EF7\u683C\u6362\u7B97\u4E3A\u4E00\u79CD\u8D27\u5E01\u3002",
    "prices.convertTo": "\u663E\u793A\u8D27\u5E01",
    "prices.convertToDesc": "\u81EA\u52A8\u4F7F\u7528\u60A8\u5F53\u524D\u6D4F\u89C8\u5546\u5E97\u7684\u8D27\u5E01\u3002",
    "convertTo.auto": "\u81EA\u52A8\uFF08\u60A8\u5546\u5E97\u7684\u8D27\u5E01\uFF09",
    "convertTo.off": "\u5173\u95ED\uFF08\u4E0D\u6362\u7B97\uFF09",
    "prices.showConverted": "\u663E\u793A\u6362\u7B97\u4EF7\u683C",
    "prices.fxCache": "\u6C47\u7387\u7F13\u5B58\u65F6\u957F",
    "prices.fxCacheDesc": "\u6C47\u7387\u5728\u91CD\u65B0\u8BF7\u6C42\u4E4B\u524D\u53EF\u590D\u7528\u591A\u957F\u65F6\u95F4\u3002",
    "fxTtl.1h": "1 \u5C0F\u65F6",
    "fxTtl.6h": "6 \u5C0F\u65F6",
    "fxTtl.24h": "24 \u5C0F\u65F6",
    "fxTtl.7d": "7 \u5929",
    "prices.fxCached": "\u5DF2\u7F13\u5B58\u6C47\u7387\uFF1A{provider}\uFF0C{date}",
    "prices.fxCacheEmpty": "\u6682\u65E0\u7F13\u5B58\u6C47\u7387\u2014\u2014\u6253\u5F00\u4EFB\u610F\u6E38\u620F\u9875\u9762\u4E00\u6B21\u5373\u53EF\u3002",
    "prices.fxClear": "\u6E05\u9664\u6C47\u7387\u7F13\u5B58",
    "prices.regions": "\u6BD4\u8F83\u7684\u533A\u57DF",
    "prices.regionsDesc": "\u8981\u52A0\u8F7D\u4EF7\u683C\u7684\u5546\u5E97\u533A\u57DF\uFF08\u6700\u591A 24 \u4E2A\uFF09\u3002",
    "prices.display": "\u663E\u793A",
    "prices.showOriginal": "\u539F\u4EF7",
    "prices.showDiscount": "\u6298\u6263\u5FBD\u7AE0",
    "prices.showSavings": "\u76F8\u5BF9\u4F60\u7684\u4EF7\u683C\u8282\u7701",
    "prices.highlightCheapest": "\u9AD8\u4EAE\u6700\u4F4E\u4EF7",
    "prices.showHomeRow": "\u4F60\u7684\u4EF7\u683C\u884C",
    "prices.collapsed": "\u9ED8\u8BA4\u6298\u53E0",
    "prices.collapsedDesc": "\u5BF9\u6BD4\u7248\u5757\u9ED8\u8BA4\u6298\u53E0\u4EE5\u8282\u7701\u7A7A\u95F4\uFF0C\u70B9\u51FB\u6807\u9898\u6309\u94AE\u53EF\u5C55\u5F00\u3002",
    "prices.colRegion": "\u533A\u57DF",
    "prices.colPrice": "\u4EF7\u683C",
    "prices.colDiscount": "\u6298\u6263",
    "prices.colSavings": "\u8282\u7701",
    "prices.yours": "\u4F60\u7684\u4EF7\u683C",
    "prices.cheapest": "\u6700\u4F4E",
    "prices.load": "\u52A0\u8F7D\u4EF7\u683C",
    "prices.loading": "\u6B63\u5728\u52A0\u8F7D\u4EF7\u683C\u2026",
    "prices.retry": "\u91CD\u8BD5",
    "prices.failed": "\u65E0\u6CD5\u52A0\u8F7D\u4EF7\u683C",
    "prices.noRegions": "\u8BF7\u5728\u8BBE\u7F6E\u4E2D\u81F3\u5C11\u9009\u62E9\u4E00\u4E2A\u533A\u57DF",
    "prices.updated": "\u66F4\u65B0\u4E8E {time}",
    "prices.refresh": "\u5237\u65B0\u4EF7\u683C",
    "prices.collapse": "\u6298\u53E0\u7248\u5757",
    "prices.expand": "\u5C55\u5F00\u7248\u5757",
    "prices.fxHint": "\u6C47\u7387\uFF1A{provider}\uFF08{date}\uFF09\u3002",
    "links.title": "\u5916\u90E8\u94FE\u63A5",
    "links.desc": "\u5728\u6E38\u620F\u9875\u9762\u4E0A\u5FEB\u901F\u8DF3\u8F6C\u5230\u5176\u4ED6\u5546\u5E97\u548C\u6570\u636E\u5E93\u3002",
    "links.enabled": "\u542F\u7528\u5916\u90E8\u94FE\u63A5",
    "links.enabledDesc": "\u5916\u90E8\u94FE\u63A5\u7248\u5757\u7684\u603B\u5F00\u5173\u3002",
    "links.position": "\u7248\u5757\u4F4D\u7F6E",
    "links.positionDesc": "\u94FE\u63A5\u7248\u5757\u5728\u6E38\u620F\u9875\u9762\u4E0A\u7684\u663E\u793A\u4F4D\u7F6E\u3002",
    "links.newTab": "\u5728\u65B0\u6807\u7B7E\u9875\u4E2D\u6253\u5F00",
    "links.newTabDesc": "\u5728\u65B0\u6807\u7B7E\u9875\u4E2D\u6253\u5F00\u5916\u90E8\u94FE\u63A5\u3002",
    "links.list": "\u94FE\u63A5",
    "links.listDesc": "\u663E\u793A\u5728\u6E38\u620F\u9875\u9762\u4E0A\u7684\u94FE\u63A5\u3002\u65E0\u6CD5\u89E3\u6790\u7684\u6A21\u677F\u4F1A\u88AB\u8DF3\u8FC7\u3002",
    "links.templateHelp": "\u7F51\u5740\u6A21\u677F\uFF1A{name} \u4E3A\u6E38\u620F\u540D\u79F0\uFF0C{appid} \u4E3A Steam id\u3002\u4F8B\u5982\uFF1Ahttps://store.epicgames.com/en-US/browse?q={name} \u6216 https://steamdb.info/app/{appid}/",
    "links.name": "\u540D\u79F0",
    "links.namePlaceholder": "GOG",
    "links.url": "\u94FE\u63A5\u5730\u5740",
    "links.urlPlaceholder": "https://www.gog.com/games?query={name}",
    "links.icon": "\u56FE\u6807\u5730\u5740\uFF08\u53EF\u9009\uFF09",
    "links.iconPlaceholder": "https://www.gog.com/favicon.ico",
    "links.add": "\u6DFB\u52A0\u94FE\u63A5",
    "links.remove": "\u5220\u9664\u6B64\u94FE\u63A5",
    "links.moveUp": "\u4E0A\u79FB",
    "links.moveDown": "\u4E0B\u79FB",
    "links.empty": "\u6682\u65E0\u94FE\u63A5 \u2014 \u8BF7\u5728\u4E0B\u65B9\u6DFB\u52A0\u3002",
    "links.restore": "\u6062\u590D\u9ED8\u8BA4",
    "links.preview": "\u9884\u89C8",
    "links.open": "\u6253\u5F00",
    "region.title": "\u533A\u57DF\u9650\u5236\u7ED5\u8FC7",
    "region.desc": "\u901A\u8FC7\u533F\u540D\u8BBF\u5BA2\u8BF7\u6C42\uFF08\u4E0D\u5E26\u8D26\u53F7 Cookie\uFF09\u91CD\u65B0\u52A0\u8F7D\u663E\u793A\u201C\u5728\u60A8\u6240\u5728\u533A\u57DF\u4E0D\u53EF\u7528\u201D\u7684\u5546\u5E97\u9875\u9762\u3002",
    "region.enabled": "\u542F\u7528\u533A\u57DF\u9650\u5236\u7ED5\u8FC7",
    "region.enabledDesc": "\u91CD\u65B0\u52A0\u8F7D\u88AB\u5C4F\u853D\u5546\u5E97\u9875\u9762\u7684\u603B\u5F00\u5173\u3002",
    "region.showBanner": "\u663E\u793A\u901A\u77E5\u6A2A\u5E45",
    "region.showBannerDesc": "\u663E\u793A\u9875\u9762\u662F\u901A\u8FC7\u533F\u540D\u8BBF\u5BA2\u8BF7\u6C42\u52A0\u8F7D\u7684\u3002\u9ED8\u8BA4\u9690\u85CF\uFF1B\u4E0B\u6B21\u91CD\u65B0\u52A0\u8F7D\u540E\u751F\u6548\u3002",
    "region.mode": "\u5728\u88AB\u5C4F\u853D\u9875\u9762\u4E0A",
    "region.modeDesc": "\u81EA\u52A8\u6A21\u5F0F\u7ACB\u5373\u66FF\u6362\u9519\u8BEF\u9875\uFF1B\u624B\u52A8\u6A21\u5F0F\u5148\u663E\u793A\u4E00\u4E2A\u6309\u94AE\u3002",
    "regionMode.auto": "\u81EA\u52A8",
    "regionMode.manual": "\u6309\u6309\u94AE",
    "region.country": "\u5546\u5E97\u56FD\u5BB6\uFF08cc\uFF09",
    "region.countryDesc": "\u8BBF\u5BA2\u8BF7\u6C42\u7684\u53EF\u9009\u4E24\u5B57\u6BCD\u5546\u5E97\u56FD\u5BB6\u4EE3\u7801\u3002\u7559\u7A7A\u5219\u4F7F\u7528\u60A8\u81EA\u5DF1\u7684\u56FD\u5BB6\u3002",
    "region.countryPlaceholder": "US",
    "region.proxy": "\u4EE3\u7406\u7F51\u5173",
    "region.proxyDesc": "\u9488\u5BF9 IP \u5C01\u9501\uFF1A\u7ECF\u7531\u5F00\u653E\u533A\u57DF\u7684 HTTP \u7F51\u5173\u53D1\u9001\u533F\u540D\u8BF7\u6C42\u3002",
    "region.proxyEnabled": "\u4F7F\u7528\u4EE3\u7406\u7F51\u5173",
    "region.proxyMode": "\u7F51\u5173\u6A21\u5F0F",
    "region.proxyModeDesc": "\u5546\u5E97 URL \u9644\u52A0\u5230 host:port \u7684\u65B9\u5F0F\u3002",
    "regionProxyMode.gateway": "host:port/https://\u2026",
    "regionProxyMode.path": "host:port/store.steampowered.com/\u2026",
    "regionProxyMode.query": "host:port/?url=\u2026",
    "region.proxyHost": "\u4E3B\u673A",
    "region.proxyPort": "\u7AEF\u53E3",
    "region.proxyUser": "\u7528\u6237\u540D",
    "region.proxyPass": "\u5BC6\u7801",
    "region.bannerBadge": "\u533A\u57DF\u53D7\u9650",
    "region.bannerTitle": "\u6B64\u9875\u9762\u5728\u60A8\u6240\u5728\u533A\u57DF\u4E0D\u53EF\u7528",
    "region.bannerBody": "\u901A\u8FC7\u533F\u540D\u8BBF\u5BA2\u8BF7\u6C42\u663E\u793A\uFF08\u4E0D\u5E26\u8D26\u53F7 Cookie\uFF09",
    "region.bannerViaProxy": "\u7ECF\u7531\u4EE3\u7406\u7F51\u5173",
    "region.reload": "\u91CD\u65B0\u52A0\u8F7D",
    "region.retry": "\u91CD\u8BD5",
    "region.offer": "\u6B64\u9875\u9762\u5728\u60A8\u6240\u5728\u533A\u57DF\u88AB\u5C4F\u853D\u3002\u662F\u5426\u4E0D\u5E26\u8D26\u53F7 Cookie \u52A0\u8F7D\uFF1F",
    "region.offerButton": "\u663E\u793A\u5546\u5E97\u9875\u9762",
    "region.loading": "\u6B63\u5728\u4E0D\u5E26\u8D26\u53F7 Cookie \u52A0\u8F7D\u5546\u5E97\u9875\u9762\u2026",
    "region.errorBlocked": "\u4ECD\u88AB IP/\u533A\u57DF\u5C4F\u853D\u3002\u8BF7\u5728\u8BBE\u7F6E\u4E2D\u542F\u7528\u4EE3\u7406\u7F51\u5173\u5E76\u6307\u5411\u5F00\u653E\u533A\u57DF\u3002",
    "region.errorBlockedProxy": "\u4ECD\u7136\u88AB\u5C4F\u853D\u3002\u4EE3\u7406 IP \u53EF\u80FD\u4E5F\u5728\u53D7\u9650\u533A\u57DF\u2014\u2014\u8BF7\u5C1D\u8BD5\u5176\u4ED6\u51FA\u53E3\u8282\u70B9\u3002",
    "region.errorAgeGate": "Steam \u663E\u793A\u4E86\u5E74\u9F84\u9A8C\u8BC1\u3002\u8BF7\u6309\u201C\u91CD\u8BD5\u201D\u2014\u2014\u5E74\u9F84 Cookie \u4F1A\u81EA\u52A8\u53D1\u9001\u3002",
    "region.errorFailed": "\u52A0\u8F7D\u5931\u8D25\uFF1A{error}",
    "cache.usage": "\u5B58\u50A8\u7528\u91CF",
    "cache.contents": "\u5DF2\u4FDD\u5B58\u7684\u7FFB\u8BD1",
    "cache.clear": "\u6E05\u7A7A\u7F13\u5B58",
    "cache.cleared": "\u5DF2\u6E05\u7A7A\u7F13\u5B58\uFF08{count}\uFF09",
    "cache.empty": "\u7F13\u5B58\u4E3A\u7A7A",
    "cache.clearHint": "\u5220\u9664\u6B64\u6D4F\u89C8\u5668\u914D\u7F6E\u6587\u4EF6\u4E2D\u4FDD\u5B58\u7684\u6240\u6709\u7FFB\u8BD1\u3002",
    "cache.listEmpty": "\u6682\u65E0\u5DF2\u4FDD\u5B58\u7684\u7FFB\u8BD1\u2014\u2014\u7FFB\u8BD1\u4E00\u4E9B\u5185\u5BB9\u540E\u4F1A\u663E\u793A\u5728\u8FD9\u91CC\u3002",
    "cache.listMore": "\u2026\u2026\u8FD8\u6709 {count} \u6761",
    "cache.removeEntry": "\u5220\u9664\u6B64\u6761\u76EE",
    "cache.entries": "{count} \u6761",
    "cache.used": "{used}\uFF0C\u5171 {count} \u6761",
    "cache.free": "\u53EF\u7528",
    "cache.pct": "\u5DF2\u4F7F\u7528 {pct}%",
    "about.blurb": "\u6539\u5584 Steam \u5546\u5E97\u548C\u793E\u533A\u9875\u9762\uFF1A\u5E26\u7F13\u5B58\u7684\u5185\u5BB9\u7FFB\u8BD1\uFF0C\u66F4\u591A\u529F\u80FD\u5373\u5C06\u5230\u6765\u3002",
    "about.repo": "GitHub",
    "about.repoHint": "\u6E90\u4EE3\u7801\u3001\u66F4\u65B0\u4E0E\u95EE\u9898\u53CD\u9988",
    "toast.saved": "\u8BBE\u7F6E\u5DF2\u4FDD\u5B58",
    "toast.rateLimited": "\u7FFB\u8BD1\u88AB\u9650\u6D41",
    "toast.rateLimitedDesc": "Google \u76EE\u524D\u6B63\u5728\u9650\u6D41\u3002\u533A\u5757\u4F1A\u81EA\u52A8\u91CD\u8BD5\uFF0C\u4E5F\u53EF\u4EE5\u7A0D\u540E\u70B9\u51FB\u201C\u91CD\u8BD5\u201D\u3002",
    "toast.translateFailed": "\u7FFB\u8BD1\u5931\u8D25",
    "toast.translateFailedDesc": "\u51FA\u4E86\u70B9\u95EE\u9898\uFF0C\u70B9\u51FB\u533A\u5757\u4E0A\u7684\u201C\u91CD\u8BD5\u201D\u518D\u8BD5\u4E00\u6B21\u3002",
    "toast.unknownProvider": "\u672A\u77E5\u7684\u7FFB\u8BD1\u670D\u52A1",
    "toast.unknownProviderDesc": "\u8BF7\u68C0\u67E5\u8BBE\u7F6E\u4E2D\u7684\u7FFB\u8BD1\u670D\u52A1\u5E76\u91CD\u65B0\u4FDD\u5B58\u3002",
    "toast.cacheCleared": "\u76EE\u6807\u8BED\u8A00\u5DF2\u66F4\u6539\u2014\u2014\u7FFB\u8BD1\u7F13\u5B58\u5DF2\u6E05\u7A7A\u3002",
    "translate.button": "\u7FFB\u8BD1",
    "translate.original": "\u539F\u6587",
    "translate.loading": "\u7FFB\u8BD1\u4E2D\u2026",
    "translate.loadingShort": "\u7FFB\u8BD1\u4E2D",
    "translate.error": "\u7FFB\u8BD1\u51FA\u9519",
    "translate.retry": "\u91CD\u8BD5",
    "queue.addToWishlist": "\u6DFB\u52A0\u5230\u613F\u671B\u5355",
    "queue.onWishlist": "\u5DF2\u5728\u613F\u671B\u5355\u4E2D",
    "queue.addedNotice": "\u5DF2\u5C06\u7269\u54C1\u6DFB\u52A0\u81F3\u613F\u671B\u5355\uFF01",
    "queue.oops": "\u62B1\u6B49\uFF0C\u51FA\u9519\u4E86\uFF01",
    "queue.follow": "\u5173\u6CE8",
    "queue.following": "\u5DF2\u5173\u6CE8",
    "queue.ignore": "\u5FFD\u7565",
    "queue.ignored": "\u5DF2\u5FFD\u7565",
    "queue.viewQueue": "\u67E5\u770B\u60A8\u7684\u63A2\u7D22\u961F\u5217",
    "queue.manageWishlist": "\u7BA1\u7406\u613F\u671B\u5355",
    "queue.removeWishlist": "\u4ECE\u613F\u671B\u5355\u4E2D\u79FB\u9664",
    "queue.ignoreDefault": "\u5FFD\u7565\u6B64\u9879\uFF08\u9ED8\u8BA4\uFF09",
    "queue.ignoreDefaultSub": "\u5728\u5546\u5E97\u4E2D\u9690\u85CF\uFF0C\u5FFD\u7565\u901A\u77E5\uFF0C\u4E14\u4E0D\u7528\u4E8E\u751F\u6210\u5176\u4ED6\u63A8\u8350\u3002",
    "queue.playedElsewhere": "\u5DF2\u5728\u5176\u4ED6\u5E73\u53F0\u6E38\u73A9",
    "queue.playedElsewhereSub": "\u5728\u5546\u5E97\u4E2D\u9690\u85CF\u3002\u53EF\u7528\u4E8E\u751F\u6210\u63A8\u8350\u3002",
    "queue.actionFailed": "\u65E0\u6CD5\u4FDD\u5B58\u66F4\u6539",
    "queue.actionFailedDesc": "\u4FDD\u5B58\u66F4\u6539\u65F6\u51FA\u73B0\u95EE\u9898\u3002\u8BF7\u7A0D\u540E\u518D\u8BD5\u3002"
  };

  // src/i18n/locales/ja.js
  var ja_default = {
    "menu.settings": "\u8A2D\u5B9A Steam Plus",
    "tab.general": "\u4E00\u822C",
    "tab.translation": "\u7FFB\u8A33",
    "tab.gamepage": "\u30B2\u30FC\u30E0\u30DA\u30FC\u30B8",
    "tab.prices": "\u4FA1\u683C",
    "tab.cache": "\u30AD\u30E3\u30C3\u30B7\u30E5",
    "tab.about": "\u30B9\u30AF\u30EA\u30D7\u30C8\u306B\u3064\u3044\u3066",
    "tab.general.desc": "\u30A4\u30F3\u30BF\u30FC\u30D5\u30A7\u30FC\u30B9\u8A00\u8A9E\u3068\u901A\u77E5\u3002",
    "tab.translation.desc": "\u8AAC\u660E\u3001\u30EC\u30D3\u30E5\u30FC\u3001\u30B3\u30E1\u30F3\u30C8\u3001\u30CB\u30E5\u30FC\u30B9\u3092\u7FFB\u8A33\u3057\u307E\u3059\u3002",
    "tab.gamepage.desc": "\u30B2\u30FC\u30E0\u30DA\u30FC\u30B8\u306E\u4E0D\u8981\u306A\u30D6\u30ED\u30C3\u30AF\u3092\u975E\u8868\u793A\u306B\u3057\u307E\u3059\u3002",
    "tab.prices.desc": "\u5730\u57DF\u3054\u3068\u306E\u4FA1\u683C\u3092\u6BD4\u8F03\u3057\u3001\u901A\u8CA8\u3092\u63DB\u7B97\u3057\u307E\u3059\u3002",
    "tab.links": "\u5916\u90E8\u30EA\u30F3\u30AF",
    "tab.links.desc": "\u4ED6\u306E\u30B9\u30C8\u30A2\u3084\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u3078\u306E\u30AF\u30A4\u30C3\u30AF\u30EA\u30F3\u30AF\u3002",
    "tab.region": "\u30EA\u30FC\u30B8\u30E7\u30F3",
    "tab.region.desc": "\u304A\u4F4F\u307E\u3044\u306E\u5730\u57DF\u3067\u30D6\u30ED\u30C3\u30AF\u3055\u308C\u305F\u30B9\u30C8\u30A2\u30DA\u30FC\u30B8\u3092\u8AAD\u307F\u8FBC\u307F\u307E\u3059\u3002",
    "tab.cache.desc": "\u4FDD\u5B58\u6E08\u307F\u306E\u7FFB\u8A33\u3068\u30B9\u30C8\u30EC\u30FC\u30B8\u4F7F\u7528\u91CF\u3002",
    "tab.about.desc": "\u30D0\u30FC\u30B8\u30E7\u30F3\u3001\u4F5C\u8005\u3001\u30BD\u30FC\u30B9\u30B3\u30FC\u30C9\u3002",
    "panel.subtitle": "\u7FFB\u8A33 \xB7 \u30B2\u30FC\u30E0\u30DA\u30FC\u30B8 \xB7 \u4FA1\u683C \xB7 \u30EA\u30F3\u30AF \xB7 \u30EA\u30FC\u30B8\u30E7\u30F3 \xB7 \u30AD\u30E3\u30C3\u30B7\u30E5 \xB7 \u30A4\u30F3\u30BF\u30FC\u30D5\u30A7\u30FC\u30B9",
    "panel.back": "\u623B\u308B",
    "common.on": "\u30AA\u30F3",
    "common.off": "\u30AA\u30D5",
    "common.auto": "\u81EA\u52D5",
    "common.close": "\u9589\u3058\u308B",
    "common.cancel": "\u30AD\u30E3\u30F3\u30BB\u30EB",
    "common.save": "\u4FDD\u5B58",
    "common.reset": "\u65E2\u5B9A\u5024\u306B\u623B\u3059",
    "common.saved": "\u4FDD\u5B58\u3057\u307E\u3057\u305F",
    "common.settings": "\u8A2D\u5B9A",
    "general.language": "\u30A4\u30F3\u30BF\u30FC\u30D5\u30A7\u30FC\u30B9\u306E\u8A00\u8A9E",
    "general.languageDesc": "Steam Plus \u8A2D\u5B9A\u30D1\u30CD\u30EB\u306E\u8A00\u8A9E\u3002",
    "general.saveHint": "\u4E0B\u306E\u300C\u4FDD\u5B58\u300D\u3067\u5909\u66F4\u304C\u9069\u7528\u3055\u308C\u307E\u3059\u3002",
    "reset.confirm": "\u3059\u3079\u3066\u306E\u8A2D\u5B9A\u3092\u65E2\u5B9A\u5024\u306B\u623B\u3057\u307E\u3059\u304B\uFF1F",
    "general.toasts": "\u901A\u77E5",
    "toasts.enabled": "\u30DD\u30C3\u30D7\u30A2\u30C3\u30D7\u901A\u77E5",
    "toasts.enabledDesc": "\u8A2D\u5B9A\u3068\u7FFB\u8A33\u306E\u6210\u529F\u30FB\u30A8\u30E9\u30FC\u901A\u77E5\u3092\u8868\u793A\u3057\u307E\u3059\u3002",
    "toasts.position": "\u753B\u9762\u4E0A\u306E\u4F4D\u7F6E",
    "toasts.duration": "\u81EA\u52D5\u3067\u9589\u3058\u308B\u307E\u3067\uFF08\u79D2\uFF09",
    "toasts.durationDesc": "0 = \u624B\u52D5\u3067\u9589\u3058\u308B\u307E\u3067\u8868\u793A\u3002",
    "toastPos.bottom-right": "\u53F3\u4E0B",
    "toastPos.bottom-left": "\u5DE6\u4E0B",
    "toastPos.top-right": "\u53F3\u4E0A",
    "toastPos.top-left": "\u5DE6\u4E0A",
    "translation.title": "\u7FFB\u8A33",
    "translation.behavior": "\u52D5\u4F5C",
    "translation.desc": "Steam \u30B3\u30F3\u30C6\u30F3\u30C4\u306E\u7FFB\u8A33\uFF1A\u8AAC\u660E\u3001\u30EC\u30D3\u30E5\u30FC\u3001\u30B3\u30E1\u30F3\u30C8\u3001\u30CB\u30E5\u30FC\u30B9\u3002",
    "translation.enabled": "\u7FFB\u8A33\u3092\u6709\u52B9\u306B\u3059\u308B",
    "translation.enabledDesc": "\u7FFB\u8A33\u6A5F\u80FD\u306E\u30DE\u30B9\u30BF\u30FC\u30B9\u30A4\u30C3\u30C1\u3002",
    "translation.provider": "\u7FFB\u8A33\u30D7\u30ED\u30D0\u30A4\u30C0\u30FC",
    "translation.providerDesc": "\u30C6\u30AD\u30B9\u30C8\u306E\u7FFB\u8A33\u306B\u4F7F\u7528\u3059\u308B\u30B5\u30FC\u30D3\u30B9\u3002",
    "provider.google-free": "Google\uFF08\u7121\u6599\uFF09",
    "translation.trigger": "\u7FFB\u8A33\u30E2\u30FC\u30C9",
    "translation.triggerDesc": "\u30B3\u30F3\u30C6\u30F3\u30C4\u8868\u793A\u6642\u306B\u81EA\u52D5\u3067\u7FFB\u8A33\u3059\u308B\u304B\u3001\u30DC\u30BF\u30F3\u3067\u7FFB\u8A33\u3059\u308B\u304B\u3002",
    "trigger.auto": "\u81EA\u52D5",
    "trigger.manual": "\u30DC\u30BF\u30F3\u3067\u7FFB\u8A33",
    "translation.display": "\u7FFB\u8A33\u306E\u8868\u793A\u65B9\u6CD5",
    "translation.displayDesc": "\u5143\u306E\u30C6\u30AD\u30B9\u30C8\u3092\u7F6E\u304D\u63DB\u3048\u308B\u304B\u3001\u4E0B\u306B\u7FFB\u8A33\u3092\u8868\u793A\u3059\u308B\u304B\u3002",
    "display.below": "\u539F\u6587\u306E\u4E0B\u306B\u8868\u793A",
    "display.replace": "\u30C6\u30AD\u30B9\u30C8\u3092\u7F6E\u304D\u63DB\u3048\u308B",
    "translation.targetLanguage": "\u7FFB\u8A33\u5148\u306E\u8A00\u8A9E",
    "translation.targetLanguageDesc": "\u30B3\u30F3\u30C6\u30F3\u30C4\u3092\u3069\u306E\u8A00\u8A9E\u306B\u7FFB\u8A33\u3059\u308B\u304B\u3002",
    "targetLanguage.auto": "Steam / \u30D6\u30E9\u30A6\u30B6\u306B\u5408\u308F\u305B\u308B",
    "translation.showCached": "\u4FDD\u5B58\u6E08\u307F\u306E\u7FFB\u8A33\u3092\u3059\u3050\u8868\u793A",
    "translation.showCachedDesc": "\u7FFB\u8A33\u304C\u30AD\u30E3\u30C3\u30B7\u30E5\u306B\u3042\u308B\u5834\u5408\u3001\u30DC\u30BF\u30F3\u3092\u62BC\u3055\u305A\u306B\u3059\u3050\u8868\u793A\u3057\u307E\u3059\u3002",
    "translation.scopes": "\u7FFB\u8A33\u3059\u308B\u5185\u5BB9",
    "translation.scopesDesc": "\u7FFB\u8A33\u3059\u308B\u30B3\u30F3\u30C6\u30F3\u30C4\u306E\u7A2E\u985E\u3092\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
    "scope.gameDescription": "\u30B2\u30FC\u30E0\u306E\u8AAC\u660E",
    "scope.gameReviews": "\u30B2\u30FC\u30E0\u306E\u30EC\u30D3\u30E5\u30FC",
    "scope.profileComments": "\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB\u306E\u30B3\u30E1\u30F3\u30C8",
    "scope.gameNews": "\u30CB\u30E5\u30FC\u30B9\u3068\u30A4\u30D9\u30F3\u30C8",
    "gamepage.title": "\u30B2\u30FC\u30E0\u30DA\u30FC\u30B8",
    "gamepage.desc": "Steam\u306E\u30B2\u30FC\u30E0\u30DA\u30FC\u30B8\u3092\u6574\u7406\uFF1A\u8AAD\u307E\u306A\u3044\u30D6\u30ED\u30C3\u30AF\u3092\u975E\u8868\u793A\u306B\u3002",
    "gamepage.enabled": "\u30B2\u30FC\u30E0\u30DA\u30FC\u30B8\u306E\u30D6\u30ED\u30C3\u30AF\u3092\u975E\u8868\u793A",
    "gamepage.enabledDesc": "\u30B2\u30FC\u30E0\u30DA\u30FC\u30B8\u3067\u30D6\u30ED\u30C3\u30AF\u3092\u975E\u8868\u793A\u306B\u3059\u308B\u30DE\u30B9\u30BF\u30FC\u30B9\u30A4\u30C3\u30C1\u3002",
    "gamepage.blocks": "\u975E\u8868\u793A\u306E\u30D6\u30ED\u30C3\u30AF",
    "gamepage.blocksDesc": "\u30B2\u30FC\u30E0\u30DA\u30FC\u30B8\uFF08\u30B9\u30C8\u30A2\u306E\u30A2\u30D7\u30EA\u30DA\u30FC\u30B8\uFF09\u3067\u975E\u8868\u793A\u306B\u3059\u308B\u30D6\u30ED\u30C3\u30AF\u3092\u9078\u629E\u3002",
    "block.media": "\u30B9\u30AF\u30EA\u30FC\u30F3\u30B7\u30E7\u30C3\u30C8\u3068\u30C8\u30EC\u30FC\u30E9\u30FC",
    "block.purchase": "\u8CFC\u5165\u30AA\u30D7\u30B7\u30E7\u30F3\u3068\u30D0\u30F3\u30C9\u30EB",
    "block.description": "\u3053\u306E\u30B2\u30FC\u30E0\u306B\u3064\u3044\u3066",
    "block.dlc": "\u3053\u306E\u30B2\u30FC\u30E0\u306E\u30B3\u30F3\u30C6\u30F3\u30C4\uFF08DLC\uFF09",
    "block.sysreq": "\u30B7\u30B9\u30C6\u30E0\u8981\u4EF6",
    "block.reviews": "\u30E6\u30FC\u30B6\u30FC\u30EC\u30D3\u30E5\u30FC",
    "block.curators": "\u30AD\u30E5\u30EC\u30FC\u30BF\u30FC\u306E\u58F0",
    "block.events": "\u30A4\u30D9\u30F3\u30C8\u3068\u304A\u77E5\u3089\u305B",
    "block.details": "\u8A73\u7D30\u3068\u30B5\u30A4\u30C9\u30D0\u30FC\u60C5\u5831",
    "block.recommendations": "\u30D5\u30E9\u30F3\u30C1\u30E3\u30A4\u30BA\u3068\u304A\u3059\u3059\u3081",
    "block.sale": "\u30BB\u30FC\u30EB\u30A4\u30D9\u30F3\u30C8\u30D0\u30CA\u30FC",
    "block.edition": "\u30A8\u30C7\u30A3\u30B7\u30E7\u30F3\u30FB\u30D0\u30F3\u30C9\u30EB\u5185\u5BB9",
    "prices.title": "\u5730\u57DF\u5225\u4FA1\u683C",
    "prices.desc": "\u30B2\u30FC\u30E0\u30DA\u30FC\u30B8\u4E0A\u3067Steam\u5404\u5730\u57DF\u306E\u4FA1\u683C\u3092\u6BD4\u8F03\u3002",
    "prices.enabled": "\u5730\u57DF\u5225\u4FA1\u683C\u3092\u6709\u52B9\u5316",
    "prices.enabledDesc": "\u4FA1\u683C\u6BD4\u8F03\u30D6\u30ED\u30C3\u30AF\u306E\u30DE\u30B9\u30BF\u30FC\u30B9\u30A4\u30C3\u30C1\u3002",
    "prices.autoLoad": "\u4FA1\u683C\u3092\u81EA\u52D5\u7684\u306B\u8AAD\u307F\u8FBC\u3080",
    "prices.autoLoadDesc": "\u30AA\u30D5\u306B\u3059\u308B\u3068\u5404\u30B2\u30FC\u30E0\u30DA\u30FC\u30B8\u306B\u8AAD\u307F\u8FBC\u307F\u30DC\u30BF\u30F3\u304C\u8868\u793A\u3055\u308C\u307E\u3059\u3002",
    "prices.position": "\u30D6\u30ED\u30C3\u30AF\u306E\u4F4D\u7F6E",
    "prices.positionDesc": "\u30B2\u30FC\u30E0\u30DA\u30FC\u30B8\u4E0A\u3067\u6BD4\u8F03\u30D6\u30ED\u30C3\u30AF\u3092\u8868\u793A\u3059\u308B\u4F4D\u7F6E\u3002",
    "pricesPos.purchase": "\u8CFC\u5165\u30AA\u30D7\u30B7\u30E7\u30F3\u306E\u4E0A",
    "pricesPos.sidebar": "\u30B5\u30A4\u30C9\u30D0\u30FC",
    "pricesPos.description": "\u8AAC\u660E\u6587\u306E\u4E0B",
    "prices.sort": "\u884C\u306E\u9806\u5E8F",
    "prices.sortDesc": "\u4FA1\u683C\u9806\u306F\u304A\u304A\u3088\u305D\u306E\u70BA\u66FF\u30EC\u30FC\u30C8\u3092\u4F7F\u7528\u3057\u307E\u3059\u3002",
    "pricesSort.custom": "\u30EA\u30B9\u30C8\u901A\u308A",
    "pricesSort.priceAsc": "\u5B89\u3044\u9806",
    "pricesSort.discountDesc": "\u5272\u5F15\u7387\u306E\u9AD8\u3044\u9806",
    "prices.conversion": "\u901A\u8CA8\u63DB\u7B97",
    "prices.conversionDesc": "\u30E9\u30A4\u30D6\u70BA\u66FF\u30EC\u30FC\u30C8\u3067\u3059\u3079\u3066\u306E\u4FA1\u683C\u30921\u3064\u306E\u901A\u8CA8\u306B\u63DB\u7B97\u3002",
    "prices.convertTo": "\u8868\u793A\u901A\u8CA8",
    "prices.convertToDesc": "\u81EA\u52D5\u306F\u95B2\u89A7\u4E2D\u306E\u30B9\u30C8\u30A2\u306E\u901A\u8CA8\u3092\u4F7F\u7528\u3057\u307E\u3059\u3002",
    "convertTo.auto": "\u81EA\u52D5\uFF08\u3042\u306A\u305F\u306E\u30B9\u30C8\u30A2\u306E\u901A\u8CA8\uFF09",
    "convertTo.off": "\u30AA\u30D5\uFF08\u63DB\u7B97\u3057\u306A\u3044\uFF09",
    "prices.showConverted": "\u63DB\u7B97\u4FA1\u683C\u3092\u8868\u793A",
    "prices.fxCache": "\u30EC\u30FC\u30C8\u30AD\u30E3\u30C3\u30B7\u30E5\u306E\u4FDD\u6301\u671F\u9593",
    "prices.fxCacheDesc": "\u70BA\u66FF\u30EC\u30FC\u30C8\u3092\u518D\u53D6\u5F97\u3059\u308B\u307E\u3067\u518D\u5229\u7528\u3059\u308B\u671F\u9593\u3002",
    "fxTtl.1h": "1 \u6642\u9593",
    "fxTtl.6h": "6 \u6642\u9593",
    "fxTtl.24h": "24 \u6642\u9593",
    "fxTtl.7d": "7 \u65E5\u9593",
    "prices.fxCached": "\u30AD\u30E3\u30C3\u30B7\u30E5\u6E08\u307F\u30EC\u30FC\u30C8: {provider}\u3001{date}",
    "prices.fxCacheEmpty": "\u30AD\u30E3\u30C3\u30B7\u30E5\u6E08\u307F\u30EC\u30FC\u30C8\u306F\u307E\u3060\u3042\u308A\u307E\u305B\u3093 \u2014 \u30B2\u30FC\u30E0\u30DA\u30FC\u30B8\u3092\u4E00\u5EA6\u958B\u3044\u3066\u304F\u3060\u3055\u3044\u3002",
    "prices.fxClear": "\u30EC\u30FC\u30C8\u30AD\u30E3\u30C3\u30B7\u30E5\u3092\u30AF\u30EA\u30A2",
    "prices.regions": "\u6BD4\u8F03\u3059\u308B\u5730\u57DF",
    "prices.regionsDesc": "\u4FA1\u683C\u3092\u53D6\u5F97\u3059\u308B\u30B9\u30C8\u30A2\u5730\u57DF\uFF08\u6700\u592724\uFF09\u3002",
    "prices.display": "\u8868\u793A",
    "prices.showOriginal": "\u5143\u306E\u4FA1\u683C",
    "prices.showDiscount": "\u5272\u5F15\u30D0\u30C3\u30B8",
    "prices.showSavings": "\u3042\u306A\u305F\u306E\u4FA1\u683C\u3068\u306E\u5DEE",
    "prices.highlightCheapest": "\u6700\u5B89\u5024\u3092\u30CF\u30A4\u30E9\u30A4\u30C8",
    "prices.showHomeRow": "\u3042\u306A\u305F\u306E\u4FA1\u683C\u884C",
    "prices.collapsed": "\u521D\u671F\u72B6\u614B\u3067\u6298\u308A\u305F\u305F\u3080",
    "prices.collapsedDesc": "\u6BD4\u8F03\u30D6\u30ED\u30C3\u30AF\u3092\u6298\u308A\u305F\u305F\u3093\u3060\u72B6\u614B\u3067\u8868\u793A\u3057\u3066\u7701\u30B9\u30DA\u30FC\u30B9\u5316\u3002\u30D8\u30C3\u30C0\u30FC\u306E\u30DC\u30BF\u30F3\u3067\u5C55\u958B\u3002",
    "prices.colRegion": "\u5730\u57DF",
    "prices.colPrice": "\u4FA1\u683C",
    "prices.colDiscount": "\u5272\u5F15",
    "prices.colSavings": "\u5DEE\u984D",
    "prices.yours": "\u3042\u306A\u305F\u306E\u4FA1\u683C",
    "prices.cheapest": "\u6700\u5B89",
    "prices.load": "\u4FA1\u683C\u3092\u8AAD\u307F\u8FBC\u3080",
    "prices.loading": "\u4FA1\u683C\u3092\u8AAD\u307F\u8FBC\u307F\u4E2D\u2026",
    "prices.retry": "\u518D\u8A66\u884C",
    "prices.failed": "\u4FA1\u683C\u3092\u8AAD\u307F\u8FBC\u3081\u307E\u305B\u3093\u3067\u3057\u305F",
    "prices.noRegions": "\u8A2D\u5B9A\u3067\u5730\u57DF\u30921\u3064\u4EE5\u4E0A\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044",
    "prices.updated": "\u66F4\u65B0 {time}",
    "prices.refresh": "\u4FA1\u683C\u3092\u66F4\u65B0",
    "prices.collapse": "\u30D6\u30ED\u30C3\u30AF\u3092\u6298\u308A\u305F\u305F\u3080",
    "prices.expand": "\u30D6\u30ED\u30C3\u30AF\u3092\u5C55\u958B\u3059\u308B",
    "prices.fxHint": "\u70BA\u66FF\u30EC\u30FC\u30C8: {provider}\uFF08{date}\uFF09\u3002",
    "links.title": "\u5916\u90E8\u30EA\u30F3\u30AF",
    "links.desc": "\u30B2\u30FC\u30E0\u30DA\u30FC\u30B8\u304B\u3089\u4ED6\u306E\u30B9\u30C8\u30A2\u3084\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u3078\u7D20\u65E9\u304F\u79FB\u52D5\u3067\u304D\u307E\u3059\u3002",
    "links.enabled": "\u5916\u90E8\u30EA\u30F3\u30AF\u3092\u6709\u52B9\u5316",
    "links.enabledDesc": "\u5916\u90E8\u30EA\u30F3\u30AF\u30D6\u30ED\u30C3\u30AF\u306E\u30DE\u30B9\u30BF\u30FC\u30B9\u30A4\u30C3\u30C1\u3002",
    "links.position": "\u30D6\u30ED\u30C3\u30AF\u306E\u4F4D\u7F6E",
    "links.positionDesc": "\u30B2\u30FC\u30E0\u30DA\u30FC\u30B8\u4E0A\u306E\u30EA\u30F3\u30AF\u30D6\u30ED\u30C3\u30AF\u306E\u8868\u793A\u4F4D\u7F6E\u3002",
    "links.newTab": "\u65B0\u3057\u3044\u30BF\u30D6\u3067\u958B\u304F",
    "links.newTabDesc": "\u5916\u90E8\u30EA\u30F3\u30AF\u3092\u65B0\u3057\u3044\u30BF\u30D6\u3067\u958B\u304D\u307E\u3059\u3002",
    "links.list": "\u30EA\u30F3\u30AF",
    "links.listDesc": "\u30B2\u30FC\u30E0\u30DA\u30FC\u30B8\u306B\u8868\u793A\u3059\u308B\u30EA\u30F3\u30AF\u3002\u89E3\u6C7A\u3067\u304D\u306A\u3044\u30C6\u30F3\u30D7\u30EC\u30FC\u30C8\u306F\u30B9\u30AD\u30C3\u30D7\u3055\u308C\u307E\u3059\u3002",
    "links.templateHelp": "URL\u30C6\u30F3\u30D7\u30EC\u30FC\u30C8\uFF1A\u30B2\u30FC\u30E0\u540D\u306F {name}\u3001Steam ID\u306F {appid}\u3002\u4F8B\uFF1Ahttps://store.epicgames.com/en-US/browse?q={name}\u3001https://steamdb.info/app/{appid}/",
    "links.name": "\u540D\u524D",
    "links.namePlaceholder": "GOG",
    "links.url": "\u30EA\u30F3\u30AF\u5148\u30A2\u30C9\u30EC\u30B9",
    "links.urlPlaceholder": "https://www.gog.com/games?query={name}",
    "links.icon": "\u30A2\u30A4\u30B3\u30F3\u30A2\u30C9\u30EC\u30B9\uFF08\u4EFB\u610F\uFF09",
    "links.iconPlaceholder": "https://www.gog.com/favicon.ico",
    "links.add": "\u30EA\u30F3\u30AF\u3092\u8FFD\u52A0",
    "links.remove": "\u3053\u306E\u30EA\u30F3\u30AF\u3092\u524A\u9664",
    "links.moveUp": "\u4E0A\u3078\u79FB\u52D5",
    "links.moveDown": "\u4E0B\u3078\u79FB\u52D5",
    "links.empty": "\u30EA\u30F3\u30AF\u304C\u3042\u308A\u307E\u305B\u3093 \u2014 \u4E0B\u304B\u3089\u8FFD\u52A0\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
    "links.restore": "\u30C7\u30D5\u30A9\u30EB\u30C8\u306B\u623B\u3059",
    "links.preview": "\u30D7\u30EC\u30D3\u30E5\u30FC",
    "links.open": "\u958B\u304F",
    "region.title": "\u30EA\u30FC\u30B8\u30E7\u30F3\u30D0\u30A4\u30D1\u30B9",
    "region.desc": "\u300C\u304A\u4F4F\u307E\u3044\u306E\u5730\u57DF\u3067\u306F\u5229\u7528\u3067\u304D\u307E\u305B\u3093\u300D\u3068\u8868\u793A\u3055\u308C\u308B\u30DA\u30FC\u30B8\u3092\u3001\u533F\u540D\u30B2\u30B9\u30C8\u53D6\u5F97\uFF08\u30A2\u30AB\u30A6\u30F3\u30C8Cookie\u306A\u3057\uFF09\u3067\u518D\u8AAD\u307F\u8FBC\u307F\u3057\u307E\u3059\u3002",
    "region.enabled": "\u30EA\u30FC\u30B8\u30E7\u30F3\u30D0\u30A4\u30D1\u30B9\u3092\u6709\u52B9\u5316",
    "region.enabledDesc": "\u30D6\u30ED\u30C3\u30AF\u3055\u308C\u305F\u30DA\u30FC\u30B8\u3092\u518D\u8AAD\u307F\u8FBC\u307F\u3059\u308B\u30DE\u30B9\u30BF\u30FC\u30B9\u30A4\u30C3\u30C1\u3002",
    "region.showBanner": "\u901A\u77E5\u30D0\u30CA\u30FC\u3092\u8868\u793A",
    "region.showBannerDesc": "\u533F\u540D\u30B2\u30B9\u30C8\u53D6\u5F97\u3067\u8AAD\u307F\u8FBC\u3093\u3060\u3053\u3068\u3092\u8868\u793A\u3057\u307E\u3059\u3002\u65E2\u5B9A\u306F\u975E\u8868\u793A\u3067\u3001\u6B21\u56DE\u30EA\u30ED\u30FC\u30C9\u304B\u3089\u9069\u7528\u3055\u308C\u307E\u3059\u3002",
    "region.mode": "\u30D6\u30ED\u30C3\u30AF\u30DA\u30FC\u30B8\u3067\u306E\u52D5\u4F5C",
    "region.modeDesc": "\u81EA\u52D5\u306F\u30A8\u30E9\u30FC\u30DA\u30FC\u30B8\u3092\u5373\u5EA7\u306B\u7F6E\u63DB\u3001\u624B\u52D5\u306F\u5148\u306B\u30DC\u30BF\u30F3\u3092\u8868\u793A\u3057\u307E\u3059\u3002",
    "regionMode.auto": "\u81EA\u52D5",
    "regionMode.manual": "\u30DC\u30BF\u30F3\u3067",
    "region.country": "\u30B9\u30C8\u30A2\u56FD\uFF08cc\uFF09",
    "region.countryDesc": "\u30B2\u30B9\u30C8\u53D6\u5F97\u7528\u306E\u4EFB\u610F2\u6587\u5B57\u306E\u56FD\u30B3\u30FC\u30C9\u3002\u7A7A\u6B04\u3067\u81EA\u5206\u306E\u56FD\u3092\u4F7F\u3044\u307E\u3059\u3002",
    "region.countryPlaceholder": "US",
    "region.proxy": "\u30D7\u30ED\u30AD\u30B7\u30B2\u30FC\u30C8\u30A6\u30A7\u30A4",
    "region.proxyDesc": "IP\u30D9\u30FC\u30B9\u306E\u5236\u9650\u7528\uFF1A\u5236\u9650\u306E\u306A\u3044\u5730\u57DF\u306EHTTP\u30B2\u30FC\u30C8\u30A6\u30A7\u30A4\u7D4C\u7531\u3067\u533F\u540D\u53D6\u5F97\u3057\u307E\u3059\u3002",
    "region.proxyEnabled": "\u30D7\u30ED\u30AD\u30B7\u30B2\u30FC\u30C8\u30A6\u30A7\u30A4\u3092\u4F7F\u3046",
    "region.proxyMode": "\u30B2\u30FC\u30C8\u30A6\u30A7\u30A4\u30E2\u30FC\u30C9",
    "region.proxyModeDesc": "\u30B9\u30C8\u30A2URL\u3092host:port\u306B\u4ED8\u52A0\u3059\u308B\u65B9\u6CD5\u3002",
    "regionProxyMode.gateway": "host:port/https://\u2026",
    "regionProxyMode.path": "host:port/store.steampowered.com/\u2026",
    "regionProxyMode.query": "host:port/?url=\u2026",
    "region.proxyHost": "\u30DB\u30B9\u30C8",
    "region.proxyPort": "\u30DD\u30FC\u30C8",
    "region.proxyUser": "\u30E6\u30FC\u30B6\u30FC\u540D",
    "region.proxyPass": "\u30D1\u30B9\u30EF\u30FC\u30C9",
    "region.bannerBadge": "\u5730\u57DF\u30D6\u30ED\u30C3\u30AF\u4E2D",
    "region.bannerTitle": "\u3053\u306E\u30DA\u30FC\u30B8\u306F\u304A\u4F4F\u307E\u3044\u306E\u5730\u57DF\u3067\u306F\u5229\u7528\u3067\u304D\u307E\u305B\u3093",
    "region.bannerBody": "\u533F\u540D\u30B2\u30B9\u30C8\u53D6\u5F97\u3067\u8868\u793A\u3057\u3066\u3044\u307E\u3059\uFF08\u30A2\u30AB\u30A6\u30F3\u30C8Cookie\u306A\u3057\uFF09",
    "region.bannerViaProxy": "\u30D7\u30ED\u30AD\u30B7\u7D4C\u7531",
    "region.reload": "\u518D\u8AAD\u307F\u8FBC\u307F",
    "region.retry": "\u518D\u8A66\u884C",
    "region.offer": "\u3053\u306E\u30DA\u30FC\u30B8\u306F\u304A\u4F4F\u307E\u3044\u306E\u5730\u57DF\u3067\u30D6\u30ED\u30C3\u30AF\u3055\u308C\u3066\u3044\u307E\u3059\u3002\u30A2\u30AB\u30A6\u30F3\u30C8Cookie\u306A\u3057\u3067\u8AAD\u307F\u8FBC\u307F\u307E\u3059\u304B\uFF1F",
    "region.offerButton": "\u30B9\u30C8\u30A2\u30DA\u30FC\u30B8\u3092\u8868\u793A",
    "region.loading": "\u30A2\u30AB\u30A6\u30F3\u30C8Cookie\u306A\u3057\u3067\u8AAD\u307F\u8FBC\u307F\u4E2D\u2026",
    "region.errorBlocked": "IP/\u5730\u57DF\u3067\u307E\u3060\u30D6\u30ED\u30C3\u30AF\u3055\u308C\u3066\u3044\u307E\u3059\u3002\u8A2D\u5B9A\u3067\u30D7\u30ED\u30AD\u30B7\u30B2\u30FC\u30C8\u30A6\u30A7\u30A4\u3092\u5236\u9650\u306E\u306A\u3044\u5730\u57DF\u306B\u5411\u3051\u3066\u304F\u3060\u3055\u3044\u3002",
    "region.errorBlockedProxy": "\u307E\u3060\u30D6\u30ED\u30C3\u30AF\u3055\u308C\u3066\u3044\u307E\u3059\u3002\u30D7\u30ED\u30AD\u30B7IP\u3082\u5236\u9650\u5730\u57DF\u306E\u53EF\u80FD\u6027\u304C\u3042\u308A\u307E\u3059 \u2014 \u5225\u306E\u51FA\u53E3\u3092\u8A66\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
    "region.errorAgeGate": "\u5E74\u9F62\u78BA\u8A8D\u304C\u8868\u793A\u3055\u308C\u307E\u3057\u305F\u3002\u518D\u8A66\u884C\u3092\u62BC\u3057\u3066\u304F\u3060\u3055\u3044 \u2014 \u5E74\u9F62Cookie\u306F\u81EA\u52D5\u9001\u4FE1\u3055\u308C\u307E\u3059\u3002",
    "region.errorFailed": "\u8AAD\u307F\u8FBC\u307F\u306B\u5931\u6557: {error}",
    "cache.usage": "\u30B9\u30C8\u30EC\u30FC\u30B8\u4F7F\u7528\u91CF",
    "cache.contents": "\u4FDD\u5B58\u6E08\u307F\u306E\u7FFB\u8A33",
    "cache.clear": "\u30AD\u30E3\u30C3\u30B7\u30E5\u3092\u6D88\u53BB",
    "cache.cleared": "\u30AD\u30E3\u30C3\u30B7\u30E5\u3092\u6D88\u53BB\u3057\u307E\u3057\u305F\uFF08{count}\uFF09",
    "cache.empty": "\u30AD\u30E3\u30C3\u30B7\u30E5\u306F\u7A7A\u3067\u3059",
    "cache.clearHint": "\u3053\u306E\u30D6\u30E9\u30A6\u30B6\u30D7\u30ED\u30D5\u30A1\u30A4\u30EB\u306B\u4FDD\u5B58\u3055\u308C\u305F\u3059\u3079\u3066\u306E\u7FFB\u8A33\u3092\u524A\u9664\u3057\u307E\u3059\u3002",
    "cache.listEmpty": "\u4FDD\u5B58\u6E08\u307F\u306E\u7FFB\u8A33\u306F\u307E\u3060\u3042\u308A\u307E\u305B\u3093\u2014\u2014\u4F55\u304B\u7FFB\u8A33\u3059\u308B\u3068\u3053\u3053\u306B\u8868\u793A\u3055\u308C\u307E\u3059\u3002",
    "cache.listMore": "\u2026\u307B\u304B {count} \u4EF6",
    "cache.removeEntry": "\u3053\u306E\u9805\u76EE\u3092\u524A\u9664",
    "cache.entries": "{count} \u4EF6",
    "cache.used": "{used}\uFF08{count} \u4EF6\uFF09",
    "cache.free": "\u7A7A\u304D",
    "cache.pct": "{pct}% \u4F7F\u7528\u4E2D",
    "about.blurb": "Steam \u30B9\u30C8\u30A2\u3084\u30B3\u30DF\u30E5\u30CB\u30C6\u30A3\u30DA\u30FC\u30B8\u3092\u6539\u5584\u3057\u307E\u3059\uFF1A\u30AD\u30E3\u30C3\u30B7\u30E5\u4ED8\u304D\u30B3\u30F3\u30C6\u30F3\u30C4\u7FFB\u8A33\u306A\u3069\u3001\u4ECA\u5F8C\u3055\u3089\u306B\u62E1\u5145\u4E88\u5B9A\u3002",
    "about.repo": "GitHub",
    "about.repoHint": "\u30BD\u30FC\u30B9\u30B3\u30FC\u30C9\u3001\u66F4\u65B0\u60C5\u5831\u3001\u4E0D\u5177\u5408\u5831\u544A",
    "toast.saved": "\u8A2D\u5B9A\u3092\u4FDD\u5B58\u3057\u307E\u3057\u305F",
    "toast.rateLimited": "\u7FFB\u8A33\u304C\u5236\u9650\u3055\u308C\u3066\u3044\u307E\u3059",
    "toast.rateLimitedDesc": "Google \u304C\u30EA\u30AF\u30A8\u30B9\u30C8\u3092\u5236\u9650\u4E2D\u3067\u3059\u3002\u30D6\u30ED\u30C3\u30AF\u306F\u81EA\u52D5\u3067\u518D\u8A66\u884C\u3057\u307E\u3059\u3002\u5F8C\u3067\u300C\u518D\u8A66\u884C\u300D\u3082\u53EF\u80FD\u3067\u3059\u3002",
    "toast.translateFailed": "\u7FFB\u8A33\u306B\u5931\u6557\u3057\u307E\u3057\u305F",
    "toast.translateFailedDesc": "\u554F\u984C\u304C\u767A\u751F\u3057\u307E\u3057\u305F\u3002\u30D6\u30ED\u30C3\u30AF\u306E\u300C\u518D\u8A66\u884C\u300D\u3092\u62BC\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
    "toast.unknownProvider": "\u4E0D\u660E\u306A\u7FFB\u8A33\u30D7\u30ED\u30D0\u30A4\u30C0\u30FC",
    "toast.unknownProviderDesc": "\u8A2D\u5B9A\u3067\u30D7\u30ED\u30D0\u30A4\u30C0\u30FC\u3092\u78BA\u8A8D\u3057\u3001\u518D\u5EA6\u4FDD\u5B58\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
    "toast.cacheCleared": "\u7FFB\u8A33\u5148\u8A00\u8A9E\u3092\u5909\u66F4\u3057\u305F\u305F\u3081\u3001\u7FFB\u8A33\u30AD\u30E3\u30C3\u30B7\u30E5\u3092\u6D88\u53BB\u3057\u307E\u3057\u305F\u3002",
    "translate.button": "\u7FFB\u8A33",
    "translate.original": "\u539F\u6587",
    "translate.loading": "\u7FFB\u8A33\u4E2D\u2026",
    "translate.loadingShort": "\u7FFB\u8A33\u4E2D",
    "translate.error": "\u7FFB\u8A33\u30A8\u30E9\u30FC",
    "translate.retry": "\u518D\u8A66\u884C",
    "queue.addToWishlist": "\u30A6\u30A3\u30C3\u30B7\u30E5\u30EA\u30B9\u30C8\u306B\u8FFD\u52A0",
    "queue.onWishlist": "\u30A6\u30A3\u30C3\u30B7\u30E5\u30EA\u30B9\u30C8\u767B\u9332\u6E08\u307F",
    "queue.addedNotice": "\u30A2\u30A4\u30C6\u30E0\u3092\u30A6\u30A3\u30C3\u30B7\u30E5\u30EA\u30B9\u30C8\u306B\u8FFD\u52A0\u3057\u307E\u3057\u305F\uFF01",
    "queue.oops": "\u7533\u3057\u8A33\u3042\u308A\u307E\u305B\u3093\uFF01",
    "queue.follow": "\u30D5\u30A9\u30ED\u30FC",
    "queue.following": "\u30D5\u30A9\u30ED\u30FC\u4E2D",
    "queue.ignore": "\u7121\u8996",
    "queue.ignored": "\u7121\u8996\u4E2D",
    "queue.viewQueue": "\u30AD\u30E5\u30FC\u3092\u898B\u308B",
    "queue.manageWishlist": "\u30A6\u30A3\u30C3\u30B7\u30E5\u30EA\u30B9\u30C8\u3092\u7BA1\u7406",
    "queue.removeWishlist": "\u30A6\u30A3\u30C3\u30B7\u30E5\u30EA\u30B9\u30C8\u304B\u3089\u524A\u9664",
    "queue.ignoreDefault": "\u3053\u308C\u3092\u7121\u8996\uFF08\u30C7\u30D5\u30A9\u30EB\u30C8\uFF09",
    "queue.ignoreDefaultSub": "\u30B9\u30C8\u30A2\u3067\u975E\u8868\u793A\u306B\u3057\u3001\u901A\u77E5\u3092\u7121\u8996\u3057\u3066\u3001\u4ED6\u306E\u304A\u3059\u3059\u3081\u751F\u6210\u306B\u4F7F\u7528\u3057\u307E\u305B\u3093\u3002",
    "queue.playedElsewhere": "\u4ED6\u306E\u30D7\u30E9\u30C3\u30C8\u30D5\u30A9\u30FC\u30E0\u3067\u30D7\u30EC\u30A4\u6E08\u307F",
    "queue.playedElsewhereSub": "\u30B9\u30C8\u30A2\u3067\u975E\u8868\u793A\u306B\u3057\u307E\u3059\u3002\u304A\u3059\u3059\u3081\u751F\u6210\u306B\u4F7F\u7528\u3067\u304D\u307E\u3059\u3002",
    "queue.actionFailed": "\u5909\u66F4\u3092\u4FDD\u5B58\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F",
    "queue.actionFailedDesc": "\u5909\u66F4\u306E\u4FDD\u5B58\u4E2D\u306B\u554F\u984C\u304C\u767A\u751F\u3057\u307E\u3057\u305F\u3002\u5F8C\u3067\u3082\u3046\u4E00\u5EA6\u304A\u8A66\u3057\u304F\u3060\u3055\u3044\u3002"
  };

  // src/i18n/locales/ko.js
  var ko_default = {
    "menu.settings": "\uC124\uC815 Steam Plus",
    "tab.general": "\uC77C\uBC18",
    "tab.translation": "\uBC88\uC5ED",
    "tab.gamepage": "\uAC8C\uC784 \uD398\uC774\uC9C0",
    "tab.prices": "\uAC00\uACA9",
    "tab.cache": "\uCE90\uC2DC",
    "tab.about": "\uC2A4\uD06C\uB9BD\uD2B8 \uC815\uBCF4",
    "tab.general.desc": "\uC778\uD130\uD398\uC774\uC2A4 \uC5B8\uC5B4\uC640 \uC54C\uB9BC.",
    "tab.translation.desc": "\uC124\uBA85, \uD3C9\uAC00, \uB313\uAE00, \uB274\uC2A4\uB97C \uBC88\uC5ED\uD569\uB2C8\uB2E4.",
    "tab.gamepage.desc": "\uAC8C\uC784 \uD398\uC774\uC9C0\uC5D0\uC11C \uBD88\uD544\uC694\uD55C \uBE14\uB85D\uC744 \uC228\uAE41\uB2C8\uB2E4.",
    "tab.prices.desc": "\uC9C0\uC5ED\uBCC4 \uAC00\uACA9\uC744 \uBE44\uAD50\uD558\uACE0 \uD1B5\uD654\uB97C \uD658\uC0B0\uD569\uB2C8\uB2E4.",
    "tab.links": "\uC678\uBD80 \uB9C1\uD06C",
    "tab.links.desc": "\uB2E4\uB978 \uC0C1\uC810\uACFC \uB370\uC774\uD130\uBCA0\uC774\uC2A4\uB85C \uBC14\uB85C \uC774\uB3D9.",
    "tab.region": "\uC9C0\uC5ED",
    "tab.region.desc": "\uB0B4 \uC9C0\uC5ED\uC5D0\uC11C \uCC28\uB2E8\uB41C \uC0C1\uC810 \uD398\uC774\uC9C0\uB97C \uBD88\uB7EC\uC635\uB2C8\uB2E4.",
    "tab.cache.desc": "\uC800\uC7A5\uB41C \uBC88\uC5ED\uACFC \uC800\uC7A5 \uACF5\uAC04 \uC0AC\uC6A9\uB7C9.",
    "tab.about.desc": "\uBC84\uC804, \uC791\uC131\uC790, \uC18C\uC2A4 \uCF54\uB4DC.",
    "panel.subtitle": "\uBC88\uC5ED \xB7 \uAC8C\uC784 \uD398\uC774\uC9C0 \xB7 \uAC00\uACA9 \xB7 \uB9C1\uD06C \xB7 \uC9C0\uC5ED \xB7 \uCE90\uC2DC \xB7 \uC778\uD130\uD398\uC774\uC2A4",
    "panel.back": "\uB4A4\uB85C",
    "common.on": "\uCF1C\uC9D0",
    "common.off": "\uAEBC\uC9D0",
    "common.auto": "\uC790\uB3D9",
    "common.close": "\uB2EB\uAE30",
    "common.cancel": "\uCDE8\uC18C",
    "common.save": "\uC800\uC7A5",
    "common.reset": "\uAE30\uBCF8\uAC12\uC73C\uB85C \uCD08\uAE30\uD654",
    "common.saved": "\uC800\uC7A5\uB428",
    "common.settings": "\uC124\uC815",
    "general.language": "\uC778\uD130\uD398\uC774\uC2A4 \uC5B8\uC5B4",
    "general.languageDesc": "Steam Plus \uC124\uC815 \uD328\uB110\uC758 \uC5B8\uC5B4\uC785\uB2C8\uB2E4.",
    "general.saveHint": "\uC544\uB798\uC758 \uC800\uC7A5 \uBC84\uD2BC\uC744 \uB204\uB974\uBA74 \uBCC0\uACBD \uC0AC\uD56D\uC774 \uC801\uC6A9\uB429\uB2C8\uB2E4.",
    "reset.confirm": "\uBAA8\uB4E0 \uC124\uC815\uC744 \uAE30\uBCF8\uAC12\uC73C\uB85C \uB418\uB3CC\uB9B4\uAE4C\uC694?",
    "general.toasts": "\uC54C\uB9BC",
    "toasts.enabled": "\uD31D\uC5C5 \uC54C\uB9BC",
    "toasts.enabledDesc": "\uC124\uC815 \uBC0F \uBC88\uC5ED\uC758 \uC131\uACF5/\uC624\uB958 \uD31D\uC5C5\uC744 \uD45C\uC2DC\uD569\uB2C8\uB2E4.",
    "toasts.position": "\uD654\uBA74 \uC704\uCE58",
    "toasts.duration": "\uC790\uB3D9 \uC228\uAE40 (\uCD08)",
    "toasts.durationDesc": "0 = \uC9C1\uC811 \uB2EB\uC744 \uB54C\uAE4C\uC9C0 \uC720\uC9C0.",
    "toastPos.bottom-right": "\uC624\uB978\uCABD \uC544\uB798",
    "toastPos.bottom-left": "\uC67C\uCABD \uC544\uB798",
    "toastPos.top-right": "\uC624\uB978\uCABD \uC704",
    "toastPos.top-left": "\uC67C\uCABD \uC704",
    "translation.title": "\uBC88\uC5ED",
    "translation.behavior": "\uB3D9\uC791",
    "translation.desc": "Steam \uCF58\uD150\uCE20 \uBC88\uC5ED: \uC124\uBA85, \uB9AC\uBDF0, \uB313\uAE00, \uB274\uC2A4.",
    "translation.enabled": "\uBC88\uC5ED \uC0AC\uC6A9",
    "translation.enabledDesc": "\uBC88\uC5ED \uAE30\uB2A5\uC758 \uC804\uCCB4 \uC2A4\uC704\uCE58\uC785\uB2C8\uB2E4.",
    "translation.provider": "\uBC88\uC5ED \uACF5\uAE09\uC790",
    "translation.providerDesc": "\uD14D\uC2A4\uD2B8 \uBC88\uC5ED\uC5D0 \uC0AC\uC6A9\uD560 \uC11C\uBE44\uC2A4\uC785\uB2C8\uB2E4.",
    "provider.google-free": "Google (\uBB34\uB8CC)",
    "translation.trigger": "\uBC88\uC5ED \uBAA8\uB4DC",
    "translation.triggerDesc": "\uCF58\uD150\uCE20\uAC00 \uB098\uD0C0\uB0A0 \uB54C \uC790\uB3D9\uC73C\uB85C \uBC88\uC5ED\uD558\uAC70\uB098 \uBC84\uD2BC\uC73C\uB85C \uBC88\uC5ED\uD569\uB2C8\uB2E4.",
    "trigger.auto": "\uC790\uB3D9",
    "trigger.manual": "\uBC84\uD2BC\uC73C\uB85C",
    "translation.display": "\uBC88\uC5ED \uD45C\uC2DC \uBC29\uC2DD",
    "translation.displayDesc": "\uC6D0\uBCF8 \uD14D\uC2A4\uD2B8\uB97C \uB300\uCCB4\uD558\uAC70\uB098 \uC544\uB798\uC5D0 \uBC88\uC5ED\uC744 \uD45C\uC2DC\uD569\uB2C8\uB2E4.",
    "display.below": "\uC6D0\uBCF8 \uC544\uB798\uC5D0 \uD45C\uC2DC",
    "display.replace": "\uD14D\uC2A4\uD2B8 \uB300\uCCB4",
    "translation.targetLanguage": "\uBC88\uC5ED \uC5B8\uC5B4",
    "translation.targetLanguageDesc": "\uCF58\uD150\uCE20\uB97C \uC5B4\uB5A4 \uC5B8\uC5B4\uB85C \uBC88\uC5ED\uD560\uC9C0 \uC9C0\uC815\uD569\uB2C8\uB2E4.",
    "targetLanguage.auto": "Steam / \uBE0C\uB77C\uC6B0\uC800\uC640 \uB3D9\uC77C",
    "translation.showCached": "\uC800\uC7A5\uB41C \uBC88\uC5ED \uC989\uC2DC \uD45C\uC2DC",
    "translation.showCachedDesc": "\uBC88\uC5ED\uC774 \uCE90\uC2DC\uC5D0 \uC788\uC73C\uBA74 \uBC84\uD2BC\uC744 \uB204\uB974\uC9C0 \uC54A\uC544\uB3C4 \uBC14\uB85C \uD45C\uC2DC\uB429\uB2C8\uB2E4.",
    "translation.scopes": "\uBC88\uC5ED \uB300\uC0C1",
    "translation.scopesDesc": "\uBC88\uC5ED\uD560 \uCF58\uD150\uCE20 \uC720\uD615\uC744 \uC120\uD0DD\uD558\uC138\uC694.",
    "scope.gameDescription": "\uAC8C\uC784 \uC124\uBA85",
    "scope.gameReviews": "\uAC8C\uC784 \uB9AC\uBDF0",
    "scope.profileComments": "\uD504\uB85C\uD544 \uB313\uAE00",
    "scope.gameNews": "\uB274\uC2A4 \uBC0F \uC774\uBCA4\uD2B8",
    "gamepage.title": "\uAC8C\uC784 \uD398\uC774\uC9C0",
    "gamepage.desc": "Steam \uAC8C\uC784 \uD398\uC774\uC9C0\uB97C \uC815\uB9AC\uD558\uC138\uC694: \uC77D\uC9C0 \uC54A\uB294 \uBE14\uB85D\uC744 \uC228\uAE30\uC138\uC694.",
    "gamepage.enabled": "\uAC8C\uC784 \uD398\uC774\uC9C0 \uBE14\uB85D \uC228\uAE30\uAE30",
    "gamepage.enabledDesc": "\uAC8C\uC784 \uD398\uC774\uC9C0\uC5D0\uC11C \uBE14\uB85D\uC744 \uC228\uAE30\uB294 \uB9C8\uC2A4\uD130 \uC2A4\uC704\uCE58.",
    "gamepage.blocks": "\uC228\uAE34 \uBE14\uB85D",
    "gamepage.blocksDesc": "\uAC8C\uC784 \uD398\uC774\uC9C0(\uC0C1\uC810 \uC571 \uD398\uC774\uC9C0)\uC5D0\uC11C \uC228\uAE38 \uBE14\uB85D\uC744 \uC120\uD0DD\uD558\uC138\uC694.",
    "block.media": "\uC2A4\uD06C\uB9B0\uC0F7 & \uD2B8\uB808\uC77C\uB7EC",
    "block.purchase": "\uAD6C\uB9E4 \uC635\uC158 & \uBC88\uB4E4",
    "block.description": "\uC774 \uAC8C\uC784\uC5D0 \uB300\uD574",
    "block.dlc": "\uC774 \uAC8C\uC784\uC758 \uCF58\uD150\uCE20(DLC)",
    "block.sysreq": "\uC2DC\uC2A4\uD15C \uC694\uAD6C \uC0AC\uD56D",
    "block.reviews": "\uC0AC\uC6A9\uC790 \uB9AC\uBDF0",
    "block.curators": "\uD050\uB808\uC774\uD130 \uD3C9\uAC00",
    "block.events": "\uC774\uBCA4\uD2B8 & \uACF5\uC9C0",
    "block.details": "\uC138\uBD80 \uC815\uBCF4 & \uC0AC\uC774\uB4DC\uBC14",
    "block.recommendations": "\uD504\uB79C\uCC28\uC774\uC988 & \uCD94\uCC9C",
    "block.sale": "\uC138\uC77C \uC774\uBCA4\uD2B8 \uBC30\uB108",
    "block.edition": "\uC5D0\uB514\uC158 & \uBC88\uB4E4 \uAD6C\uC131",
    "prices.title": "\uC9C0\uC5ED\uBCC4 \uAC00\uACA9",
    "prices.desc": "\uAC8C\uC784 \uD398\uC774\uC9C0\uC5D0\uC11C Steam \uC9C0\uC5ED\uBCC4 \uAC8C\uC784 \uAC00\uACA9\uC744 \uBE44\uAD50\uD558\uC138\uC694.",
    "prices.enabled": "\uC9C0\uC5ED\uBCC4 \uAC00\uACA9 \uC0AC\uC6A9",
    "prices.enabledDesc": "\uAC00\uACA9 \uBE44\uAD50 \uBE14\uB85D\uC758 \uB9C8\uC2A4\uD130 \uC2A4\uC704\uCE58.",
    "prices.autoLoad": "\uAC00\uACA9 \uC790\uB3D9 \uBD88\uB7EC\uC624\uAE30",
    "prices.autoLoadDesc": "\uB044\uBA74 \uAC01 \uAC8C\uC784 \uD398\uC774\uC9C0\uC5D0 \uBD88\uB7EC\uC624\uAE30 \uBC84\uD2BC\uC774 \uD45C\uC2DC\uB429\uB2C8\uB2E4.",
    "prices.position": "\uBE14\uB85D \uC704\uCE58",
    "prices.positionDesc": "\uAC8C\uC784 \uD398\uC774\uC9C0\uC5D0\uC11C \uBE44\uAD50 \uBE14\uB85D\uC774 \uD45C\uC2DC\uB420 \uC704\uCE58.",
    "pricesPos.purchase": "\uAD6C\uB9E4 \uC635\uC158 \uC704",
    "pricesPos.sidebar": "\uC0AC\uC774\uB4DC\uBC14",
    "pricesPos.description": "\uC124\uBA85 \uC544\uB798",
    "prices.sort": "\uD589 \uC21C\uC11C",
    "prices.sortDesc": "\uAC00\uACA9\uC21C\uC740 \uADFC\uC0AC \uD658\uC728\uC744 \uC0AC\uC6A9\uD569\uB2C8\uB2E4.",
    "pricesSort.custom": "\uBAA9\uB85D \uC21C\uC11C\uB300\uB85C",
    "pricesSort.priceAsc": "\uB0AE\uC740 \uAC00\uACA9\uBD80\uD130",
    "pricesSort.discountDesc": "\uB192\uC740 \uD560\uC778\uBD80\uD130",
    "prices.conversion": "\uD1B5\uD654 \uBCC0\uD658",
    "prices.conversionDesc": "\uC2E4\uC2DC\uAC04 \uD658\uC728\uB85C \uBAA8\uB4E0 \uAC00\uACA9\uC744 \uD558\uB098\uC758 \uD1B5\uD654\uB85C \uBCC0\uD658\uD569\uB2C8\uB2E4.",
    "prices.convertTo": "\uD45C\uC2DC \uD1B5\uD654",
    "prices.convertToDesc": "\uC790\uB3D9\uC740 \uBCF4\uACE0 \uC788\uB294 \uC0C1\uC810\uC758 \uD1B5\uD654\uB97C \uC0AC\uC6A9\uD569\uB2C8\uB2E4.",
    "convertTo.auto": "\uC790\uB3D9(\uB0B4 \uC0C1\uC810 \uD1B5\uD654)",
    "convertTo.off": "\uB054(\uBCC0\uD658 \uC548 \uD568)",
    "prices.showConverted": "\uBCC0\uD658 \uAC00\uACA9 \uD45C\uC2DC",
    "prices.fxCache": "\uD658\uC728 \uCE90\uC2DC \uC720\uC9C0 \uAE30\uAC04",
    "prices.fxCacheDesc": "\uD658\uC728\uC744 \uC0C8\uB85C \uC694\uCCAD\uD558\uAE30 \uC804\uAE4C\uC9C0 \uC7AC\uC0AC\uC6A9\uD558\uB294 \uAE30\uAC04.",
    "fxTtl.1h": "1\uC2DC\uAC04",
    "fxTtl.6h": "6\uC2DC\uAC04",
    "fxTtl.24h": "24\uC2DC\uAC04",
    "fxTtl.7d": "7\uC77C",
    "prices.fxCached": "\uCE90\uC2DC\uB41C \uD658\uC728: {provider}, {date}",
    "prices.fxCacheEmpty": "\uCE90\uC2DC\uB41C \uD658\uC728\uC774 \uC5C6\uC2B5\uB2C8\uB2E4 \u2014 \uAC8C\uC784 \uD398\uC774\uC9C0\uB97C \uD55C \uBC88 \uC5EC\uC138\uC694.",
    "prices.fxClear": "\uD658\uC728 \uCE90\uC2DC \uC9C0\uC6B0\uAE30",
    "prices.regions": "\uBE44\uAD50 \uC9C0\uC5ED",
    "prices.regionsDesc": "\uAC00\uACA9\uC744 \uBD88\uB7EC\uC62C \uC0C1\uC810 \uC9C0\uC5ED(\uCD5C\uB300 24\uAC1C).",
    "prices.display": "\uD45C\uC2DC",
    "prices.showOriginal": "\uC6D0\uB798 \uAC00\uACA9",
    "prices.showDiscount": "\uD560\uC778 \uBC30\uC9C0",
    "prices.showSavings": "\uB0B4 \uAC00\uACA9 \uB300\uBE44 \uC808\uC57D",
    "prices.highlightCheapest": "\uCD5C\uC800\uAC00 \uAC15\uC870",
    "prices.showHomeRow": "\uB0B4 \uAC00\uACA9 \uD589",
    "prices.collapsed": "\uAE30\uBCF8\uC801\uC73C\uB85C \uC811\uAE30",
    "prices.collapsedDesc": "\uBE44\uAD50 \uBE14\uB85D\uC744 \uC811\uD78C \uC0C1\uD0DC\uB85C \uC2DC\uC791\uD574 \uACF5\uAC04\uC744 \uC808\uC57D\uD558\uC138\uC694. \uD5E4\uB354 \uBC84\uD2BC\uC73C\uB85C \uD3BC\uCE60 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
    "prices.colRegion": "\uC9C0\uC5ED",
    "prices.colPrice": "\uAC00\uACA9",
    "prices.colDiscount": "\uD560\uC778",
    "prices.colSavings": "\uC808\uC57D",
    "prices.yours": "\uB0B4 \uAC00\uACA9",
    "prices.cheapest": "\uCD5C\uC800",
    "prices.load": "\uAC00\uACA9 \uBD88\uB7EC\uC624\uAE30",
    "prices.loading": "\uAC00\uACA9 \uBD88\uB7EC\uC624\uB294 \uC911\u2026",
    "prices.retry": "\uB2E4\uC2DC \uC2DC\uB3C4",
    "prices.failed": "\uAC00\uACA9\uC744 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4",
    "prices.noRegions": "\uC124\uC815\uC5D0\uC11C \uC9C0\uC5ED\uC744 \uD558\uB098 \uC774\uC0C1 \uC120\uD0DD\uD558\uC138\uC694",
    "prices.updated": "{time} \uC5C5\uB370\uC774\uD2B8",
    "prices.refresh": "\uAC00\uACA9 \uC0C8\uB85C\uACE0\uCE68",
    "prices.collapse": "\uBE14\uB85D \uC811\uAE30",
    "prices.expand": "\uBE14\uB85D \uD3BC\uCE58\uAE30",
    "prices.fxHint": "\uD658\uC728: {provider} ({date}).",
    "links.title": "\uC678\uBD80 \uB9C1\uD06C",
    "links.desc": "\uAC8C\uC784 \uD398\uC774\uC9C0\uC5D0\uC11C \uB2E4\uB978 \uC0C1\uC810\uACFC \uB370\uC774\uD130\uBCA0\uC774\uC2A4\uB85C \uBC14\uB85C \uC774\uB3D9\uD569\uB2C8\uB2E4.",
    "links.enabled": "\uC678\uBD80 \uB9C1\uD06C \uC0AC\uC6A9",
    "links.enabledDesc": "\uC678\uBD80 \uB9C1\uD06C \uBE14\uB85D\uC758 \uB9C8\uC2A4\uD130 \uC2A4\uC704\uCE58.",
    "links.position": "\uBE14\uB85D \uC704\uCE58",
    "links.positionDesc": "\uAC8C\uC784 \uD398\uC774\uC9C0\uC5D0\uC11C \uB9C1\uD06C \uBE14\uB85D\uC774 \uD45C\uC2DC\uB420 \uC704\uCE58.",
    "links.newTab": "\uC0C8 \uD0ED\uC5D0\uC11C \uC5F4\uAE30",
    "links.newTabDesc": "\uC678\uBD80 \uB9C1\uD06C\uB97C \uC0C8 \uD0ED\uC5D0\uC11C \uC5FD\uB2C8\uB2E4.",
    "links.list": "\uB9C1\uD06C",
    "links.listDesc": "\uAC8C\uC784 \uD398\uC774\uC9C0\uC5D0 \uD45C\uC2DC\uB418\uB294 \uB9C1\uD06C. \uD574\uC11D\uD560 \uC218 \uC5C6\uB294 \uD15C\uD50C\uB9BF\uC740 \uAC74\uB108\uB701\uB2C8\uB2E4.",
    "links.templateHelp": "URL \uD15C\uD50C\uB9BF: \uAC8C\uC784 \uC774\uB984\uC740 {name}, Steam id\uB294 {appid}. \uC608: https://store.epicgames.com/en-US/browse?q={name} \uB610\uB294 https://steamdb.info/app/{appid}/",
    "links.name": "\uC774\uB984",
    "links.namePlaceholder": "GOG",
    "links.url": "\uB9C1\uD06C \uC8FC\uC18C",
    "links.urlPlaceholder": "https://www.gog.com/games?query={name}",
    "links.icon": "\uC544\uC774\uCF58 \uC8FC\uC18C(\uC120\uD0DD)",
    "links.iconPlaceholder": "https://www.gog.com/favicon.ico",
    "links.add": "\uB9C1\uD06C \uCD94\uAC00",
    "links.remove": "\uC774 \uB9C1\uD06C \uC0AD\uC81C",
    "links.moveUp": "\uC704\uB85C \uC774\uB3D9",
    "links.moveDown": "\uC544\uB798\uB85C \uC774\uB3D9",
    "links.empty": "\uB9C1\uD06C\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4 \u2014 \uC544\uB798\uC5D0\uC11C \uCD94\uAC00\uD558\uC138\uC694.",
    "links.restore": "\uAE30\uBCF8\uAC12\uC73C\uB85C \uBCF5\uC6D0",
    "links.preview": "\uBBF8\uB9AC \uBCF4\uAE30",
    "links.open": "\uC5F4\uAE30",
    "region.title": "\uC9C0\uC5ED \uCC28\uB2E8 \uC6B0\uD68C",
    "region.desc": "\u201C\uD574\uB2F9 \uC9C0\uC5ED\uC5D0\uC11C \uC774\uC6A9\uD560 \uC218 \uC5C6\uC74C\u201D \uD398\uC774\uC9C0\uB97C \uC775\uBA85 \uAC8C\uC2A4\uD2B8 \uC694\uCCAD(\uACC4\uC815 \uCFE0\uD0A4 \uC5C6\uC74C)\uC73C\uB85C \uB2E4\uC2DC \uBD88\uB7EC\uC635\uB2C8\uB2E4.",
    "region.enabled": "\uC9C0\uC5ED \uCC28\uB2E8 \uC6B0\uD68C \uC0AC\uC6A9",
    "region.enabledDesc": "\uCC28\uB2E8\uB41C \uC0C1\uC810 \uD398\uC774\uC9C0\uB97C \uB2E4\uC2DC \uBD88\uB7EC\uC624\uB294 \uB9C8\uC2A4\uD130 \uC2A4\uC704\uCE58.",
    "region.showBanner": "\uC54C\uB9BC \uBC30\uB108 \uD45C\uC2DC",
    "region.showBannerDesc": "\uC775\uBA85 \uAC8C\uC2A4\uD2B8 \uC694\uCCAD\uC73C\uB85C \uBD88\uB7EC\uC654\uC74C\uC744 \uD45C\uC2DC\uD569\uB2C8\uB2E4. \uAE30\uBCF8\uC801\uC73C\uB85C \uC228\uACA8\uC838 \uC788\uC73C\uBA70 \uB2E4\uC74C \uC0C8\uB85C\uACE0\uCE68\uBD80\uD130 \uC801\uC6A9\uB429\uB2C8\uB2E4.",
    "region.mode": "\uCC28\uB2E8\uB41C \uD398\uC774\uC9C0\uC5D0\uC11C",
    "region.modeDesc": "\uC790\uB3D9\uC740 \uC624\uB958 \uD398\uC774\uC9C0\uB97C \uC989\uC2DC \uAD50\uCCB4\uD558\uACE0, \uC218\uB3D9\uC740 \uBA3C\uC800 \uBC84\uD2BC\uC744 \uBCF4\uC5EC\uC90D\uB2C8\uB2E4.",
    "regionMode.auto": "\uC790\uB3D9",
    "regionMode.manual": "\uBC84\uD2BC\uC73C\uB85C",
    "region.country": "\uC0C1\uC810 \uAD6D\uAC00 (cc)",
    "region.countryDesc": "\uAC8C\uC2A4\uD2B8 \uC694\uCCAD\uC6A9 \uB450 \uAE00\uC790 \uAD6D\uAC00 \uCF54\uB4DC(\uC120\uD0DD). \uBE44\uC6B0\uBA74 \uB0B4 \uAD6D\uAC00\uB97C \uC0AC\uC6A9\uD569\uB2C8\uB2E4.",
    "region.countryPlaceholder": "US",
    "region.proxy": "\uD504\uB85D\uC2DC \uAC8C\uC774\uD2B8\uC6E8\uC774",
    "region.proxyDesc": "IP \uAE30\uBC18 \uCC28\uB2E8\uC6A9: \uC81C\uD55C \uC5C6\uB294 \uC9C0\uC5ED\uC758 HTTP \uAC8C\uC774\uD2B8\uC6E8\uC774\uB97C \uACBD\uC720\uD574 \uC775\uBA85\uC73C\uB85C \uC694\uCCAD\uD569\uB2C8\uB2E4.",
    "region.proxyEnabled": "\uD504\uB85D\uC2DC \uAC8C\uC774\uD2B8\uC6E8\uC774 \uC0AC\uC6A9",
    "region.proxyMode": "\uAC8C\uC774\uD2B8\uC6E8\uC774 \uBAA8\uB4DC",
    "region.proxyModeDesc": "\uC0C1\uC810 URL\uC744 host:port\uC5D0 \uB367\uBD99\uC774\uB294 \uBC29\uC2DD.",
    "regionProxyMode.gateway": "host:port/https://\u2026",
    "regionProxyMode.path": "host:port/store.steampowered.com/\u2026",
    "regionProxyMode.query": "host:port/?url=\u2026",
    "region.proxyHost": "\uD638\uC2A4\uD2B8",
    "region.proxyPort": "\uD3EC\uD2B8",
    "region.proxyUser": "\uC0AC\uC6A9\uC790 \uC774\uB984",
    "region.proxyPass": "\uBE44\uBC00\uBC88\uD638",
    "region.bannerBadge": "\uC9C0\uC5ED \uCC28\uB2E8\uB428",
    "region.bannerTitle": "\uC774 \uD398\uC774\uC9C0\uB294 \uD574\uB2F9 \uC9C0\uC5ED\uC5D0\uC11C \uC774\uC6A9\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4",
    "region.bannerBody": "\uC775\uBA85 \uAC8C\uC2A4\uD2B8 \uC694\uCCAD\uC73C\uB85C \uD45C\uC2DC \uC911 (\uACC4\uC815 \uCFE0\uD0A4 \uC5C6\uC74C)",
    "region.bannerViaProxy": "\uD504\uB85D\uC2DC \uACBD\uC720",
    "region.reload": "\uC0C8\uB85C\uACE0\uCE68",
    "region.retry": "\uB2E4\uC2DC \uC2DC\uB3C4",
    "region.offer": "\uC774 \uD398\uC774\uC9C0\uB294 \uD574\uB2F9 \uC9C0\uC5ED\uC5D0\uC11C \uCC28\uB2E8\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uACC4\uC815 \uCFE0\uD0A4 \uC5C6\uC774 \uBD88\uB7EC\uC62C\uAE4C\uC694?",
    "region.offerButton": "\uC0C1\uC810 \uD398\uC774\uC9C0 \uD45C\uC2DC",
    "region.loading": "\uACC4\uC815 \uCFE0\uD0A4 \uC5C6\uC774 \uBD88\uB7EC\uC624\uB294 \uC911\u2026",
    "region.errorBlocked": "IP/\uC9C0\uC5ED\uC5D0 \uC758\uD574 \uACC4\uC18D \uCC28\uB2E8\uB429\uB2C8\uB2E4. \uC124\uC815\uC5D0\uC11C \uC81C\uD55C \uC5C6\uB294 \uC9C0\uC5ED\uC73C\uB85C \uD504\uB85D\uC2DC \uAC8C\uC774\uD2B8\uC6E8\uC774\uB97C \uC9C0\uC815\uD558\uC138\uC694.",
    "region.errorBlockedProxy": "\uACC4\uC18D \uCC28\uB2E8\uB429\uB2C8\uB2E4. \uD504\uB85D\uC2DC IP\uB3C4 \uC81C\uD55C \uC9C0\uC5ED\uC77C \uC218 \uC788\uC2B5\uB2C8\uB2E4 \u2014 \uB2E4\uB978 \uCD9C\uAD6C\uB97C \uC2DC\uB3C4\uD558\uC138\uC694.",
    "region.errorAgeGate": "\uC5F0\uB839 \uD655\uC778\uC774 \uD45C\uC2DC\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uC2DC\uB3C4\uB97C \uB204\uB974\uC138\uC694 \u2014 \uC5F0\uB839 \uCFE0\uD0A4\uB294 \uC790\uB3D9\uC73C\uB85C \uC804\uC1A1\uB429\uB2C8\uB2E4.",
    "region.errorFailed": "\uBD88\uB7EC\uC624\uAE30 \uC2E4\uD328: {error}",
    "cache.usage": "\uC800\uC7A5 \uACF5\uAC04 \uC0AC\uC6A9\uB7C9",
    "cache.contents": "\uC800\uC7A5\uB41C \uBC88\uC5ED",
    "cache.clear": "\uCE90\uC2DC \uC9C0\uC6B0\uAE30",
    "cache.cleared": "\uCE90\uC2DC\uB97C \uC9C0\uC6E0\uC2B5\uB2C8\uB2E4({count})",
    "cache.empty": "\uCE90\uC2DC\uAC00 \uBE44\uC5B4 \uC788\uC2B5\uB2C8\uB2E4",
    "cache.clearHint": "\uC774 \uBE0C\uB77C\uC6B0\uC800 \uD504\uB85C\uD544\uC5D0 \uC800\uC7A5\uB41C \uBAA8\uB4E0 \uBC88\uC5ED\uC744 \uC0AD\uC81C\uD569\uB2C8\uB2E4.",
    "cache.listEmpty": "\uC800\uC7A5\uB41C \uBC88\uC5ED\uC774 \uC544\uC9C1 \uC5C6\uC2B5\uB2C8\uB2E4 \u2014 \uCF58\uD150\uCE20\uB97C \uBC88\uC5ED\uD558\uBA74 \uC5EC\uAE30\uC5D0 \uD45C\uC2DC\uB429\uB2C8\uB2E4.",
    "cache.listMore": "\u2026\uC678 {count}\uAC1C",
    "cache.removeEntry": "\uC774 \uD56D\uBAA9 \uC0AD\uC81C",
    "cache.entries": "{count}\uAC1C \uD56D\uBAA9",
    "cache.used": "{used} \xB7 {count}\uAC1C \uD56D\uBAA9",
    "cache.free": "\uC5EC\uC720",
    "cache.pct": "{pct}% \uC0AC\uC6A9 \uC911",
    "about.blurb": "Steam \uC0C1\uC810 \uBC0F \uCEE4\uBBA4\uB2C8\uD2F0 \uD398\uC774\uC9C0\uB97C \uAC1C\uC120\uD569\uB2C8\uB2E4: \uCE90\uC2DC\uB97C \uAC16\uCD98 \uCF58\uD150\uCE20 \uBC88\uC5ED \uB4F1 \u0986\u09B0\u0993 \uB9CE\uC740 \uAE30\uB2A5\uC744 \uC900\uBE44 \uC911\uC785\uB2C8\uB2E4.",
    "about.repo": "GitHub",
    "about.repoHint": "\uC18C\uC2A4 \uCF54\uB4DC, \uC5C5\uB370\uC774\uD2B8 \uBC0F \uBB38\uC81C \uBCF4\uACE0",
    "toast.saved": "\uC124\uC815\uC774 \uC800\uC7A5\uB418\uC5C8\uC2B5\uB2C8\uB2E4",
    "toast.rateLimited": "\uBC88\uC5ED\uC774 \uC81C\uD55C\uB428",
    "toast.rateLimitedDesc": "Google\uC5D0\uC11C \uC694\uCCAD\uC744 \uC81C\uD55C\uD558\uACE0 \uC788\uC2B5\uB2C8\uB2E4. \uC790\uB3D9\uC73C\uB85C \uB2E4\uC2DC \uC2DC\uB3C4\uB418\uBA70, \uB098\uC911\uC5D0 \uB2E4\uC2DC \uC2DC\uB3C4\uB97C \uB20C\uB7EC\uB3C4 \uB429\uB2C8\uB2E4.",
    "toast.translateFailed": "\uBC88\uC5ED \uC2E4\uD328",
    "toast.translateFailedDesc": "\uBB38\uC81C\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4. \uBE14\uB85D\uC5D0\uC11C \uB2E4\uC2DC \uC2DC\uB3C4\uB97C \uB20C\uB7EC\uC8FC\uC138\uC694.",
    "toast.unknownProvider": "\uC54C \uC218 \uC5C6\uB294 \uBC88\uC5ED \uC81C\uACF5\uC790",
    "toast.unknownProviderDesc": "\uC124\uC815\uC5D0\uC11C \uC81C\uACF5\uC790\uB97C \uD655\uC778\uD558\uACE0 \uB2E4\uC2DC \uC800\uC7A5\uD558\uC138\uC694.",
    "toast.cacheCleared": "\uBC88\uC5ED \uC5B8\uC5B4\uAC00 \uBCC0\uACBD\uB418\uC5B4 \uBC88\uC5ED \uCE90\uC2DC\uB97C \uC9C0\uC6E0\uC2B5\uB2C8\uB2E4.",
    "translate.button": "\uBC88\uC5ED",
    "translate.original": "\uC6D0\uBCF8",
    "translate.loading": "\uBC88\uC5ED \uC911\u2026",
    "translate.loadingShort": "\uBC88\uC5ED \uC911",
    "translate.error": "\uBC88\uC5ED \uC624\uB958",
    "translate.retry": "\uB2E4\uC2DC \uC2DC\uB3C4",
    "queue.addToWishlist": "\uCC1C \uBAA9\uB85D\uC5D0 \uCD94\uAC00",
    "queue.onWishlist": "\uCC1C \uBAA9\uB85D\uC5D0 \uC788\uC74C",
    "queue.addedNotice": "\uC544\uC774\uD15C\uC774 \uCC1C \uBAA9\uB85D\uC5D0 \uCD94\uAC00\uB418\uC5C8\uC2B5\uB2C8\uB2E4!",
    "queue.oops": "\uC557, \uC8C4\uC1A1\uD569\uB2C8\uB2E4!",
    "queue.follow": "\uD314\uB85C\uC6B0",
    "queue.following": "\uD314\uB85C\uC6B0 \uC911",
    "queue.ignore": "\uBB34\uC2DC",
    "queue.ignored": "\uBB34\uC2DC \uC911",
    "queue.viewQueue": "\uB300\uAE30\uC5F4 \uBCF4\uAE30",
    "queue.manageWishlist": "\uCC1C \uBAA9\uB85D \uAD00\uB9AC",
    "queue.removeWishlist": "\uCC1C \uBAA9\uB85D\uC5D0\uC11C \uC81C\uAC70",
    "queue.ignoreDefault": "\uC774 \uD56D\uBAA9 \uBB34\uC2DC(\uAE30\uBCF8\uAC12)",
    "queue.ignoreDefaultSub": "\uC2A4\uD1A0\uC5B4\uC5D0\uC11C \uC228\uAE30\uACE0, \uC54C\uB9BC\uC744 \uBB34\uC2DC\uD558\uBA70, \uB2E4\uB978 \uCD94\uCC9C \uC0DD\uC131\uC5D0 \uC0AC\uC6A9\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.",
    "queue.playedElsewhere": "\uB2E4\uB978 \uD50C\uB7AB\uD3FC\uC5D0\uC11C \uD50C\uB808\uC774\uD568",
    "queue.playedElsewhereSub": "\uC2A4\uD1A0\uC5B4\uC5D0\uC11C \uC228\uAE41\uB2C8\uB2E4. \uCD94\uCC9C \uC0DD\uC131\uC5D0 \uC0AC\uC6A9\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
    "queue.actionFailed": "\uBCC0\uACBD \uC0AC\uD56D\uC744 \uC800\uC7A5\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4",
    "queue.actionFailedDesc": "\uBCC0\uACBD \uC0AC\uD56D\uC744 \uC800\uC7A5\uD558\uB294 \uC911 \uBB38\uC81C\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4. \uB098\uC911\uC5D0 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694."
  };

  // src/i18n/locales/pl.js
  var pl_default = {
    "menu.settings": "Ustawienia Steam Plus",
    "tab.general": "Og\xF3lne",
    "tab.translation": "T\u0142umaczenie",
    "tab.gamepage": "Strona gry",
    "tab.prices": "Ceny",
    "tab.cache": "Pami\u0119\u0107 podr\u0119czna",
    "tab.about": "O skrypcie",
    "tab.general.desc": "J\u0119zyk interfejsu i powiadomienia.",
    "tab.translation.desc": "T\u0142umaczy opisy, recenzje, komentarze i wiadomo\u015Bci.",
    "tab.gamepage.desc": "Ukrywa niepotrzebne bloki na stronach gier.",
    "tab.prices.desc": "Por\xF3wnuje ceny regionalne i przelicza waluty.",
    "tab.links": "Linki zewn\u0119trzne",
    "tab.links.desc": "Szybkie linki do innych sklep\xF3w i baz danych.",
    "tab.region": "Region",
    "tab.region.desc": "Wczytuje strony sklepu zablokowane w twoim regionie.",
    "tab.cache.desc": "Zapisane t\u0142umaczenia i wykorzystanie pami\u0119ci.",
    "tab.about.desc": "Wersja, autor i kod \u017Ar\xF3d\u0142owy.",
    "panel.subtitle": "T\u0142umaczenie \xB7 strona gry \xB7 ceny \xB7 linki \xB7 region \xB7 pami\u0119\u0107 podr\u0119czna \xB7 interfejs",
    "panel.back": "Wstecz",
    "common.on": "W\u0142.",
    "common.off": "Wy\u0142.",
    "common.auto": "Automatycznie",
    "common.close": "Zamknij",
    "common.cancel": "Anuluj",
    "common.save": "Zapisz",
    "common.reset": "Przywr\xF3\u0107 domy\u015Blne",
    "common.saved": "Zapisano",
    "common.settings": "Ustawienia",
    "general.language": "J\u0119zyk interfejsu",
    "general.languageDesc": "J\u0119zyk panelu ustawie\u0144 Steam Plus.",
    "general.saveHint": "Zmiany zostan\u0105 zastosowane po naci\u015Bni\u0119ciu Zapisz poni\u017Cej.",
    "reset.confirm": "Przywr\xF3ci\u0107 wszystkie ustawienia do warto\u015Bci domy\u015Blnych?",
    "general.toasts": "Powiadomienia",
    "toasts.enabled": "Wyskakuj\u0105ce powiadomienia",
    "toasts.enabledDesc": "Pokazuj wyskakuj\u0105ce powiadomienia o sukcesach i b\u0142\u0119dach ustawie\u0144 i t\u0142umacze\u0144.",
    "toasts.position": "Po\u0142o\u017Cenie na ekranie",
    "toasts.duration": "Ukrywaj po (sekund)",
    "toasts.durationDesc": "0 = pozostaje do r\u0119cznego zamkni\u0119cia.",
    "toastPos.bottom-right": "Prawy d\xF3\u0142",
    "toastPos.bottom-left": "Lewy d\xF3\u0142",
    "toastPos.top-right": "Prawa g\xF3ra",
    "toastPos.top-left": "Lewa g\xF3ra",
    "translation.title": "T\u0142umaczenie",
    "translation.behavior": "Zachowanie",
    "translation.desc": "T\u0142umaczenie tre\u015Bci Steam: opis\xF3w, recenzji, komentarzy i aktualno\u015Bci.",
    "translation.enabled": "T\u0142umaczenie w\u0142\u0105czone",
    "translation.enabledDesc": "G\u0142\xF3wny prze\u0142\u0105cznik funkcji t\u0142umaczenia.",
    "translation.provider": "Dostawca t\u0142umacze\u0144",
    "translation.providerDesc": "Us\u0142uga u\u017Cywana do t\u0142umaczenia tekst\xF3w.",
    "provider.google-free": "Google (darmowy)",
    "translation.trigger": "Tryb t\u0142umaczenia",
    "translation.triggerDesc": "T\u0142umacz automatycznie po pojawieniu si\u0119 tre\u015Bci lub przyciskiem.",
    "trigger.auto": "Automatycznie",
    "trigger.manual": "Przyciskiem",
    "translation.display": "Wy\u015Bwietlanie t\u0142umaczenia",
    "translation.displayDesc": "Zamienia\u0107 oryginalny tekst lub pokazywa\u0107 t\u0142umaczenie pod nim.",
    "display.below": "Pod orygina\u0142em",
    "display.replace": "Zamieniaj tekst",
    "translation.targetLanguage": "J\u0119zyk t\u0142umaczenia",
    "translation.targetLanguageDesc": "Na jaki j\u0119zyk t\u0142umaczy\u0107 tre\u015Bci.",
    "targetLanguage.auto": "Jak Steam / przegl\u0105darka",
    "translation.showCached": "Pokazuj zapisane t\u0142umaczenia od razu",
    "translation.showCachedDesc": "Je\u015Bli t\u0142umaczenie jest w pami\u0119ci, poka\u017C je bez klikania przycisku.",
    "translation.scopes": "Co t\u0142umaczy\u0107",
    "translation.scopesDesc": "Wybierz rodzaje tre\u015Bci do t\u0142umaczenia.",
    "scope.gameDescription": "Opisy gier",
    "scope.gameReviews": "Recenzje gier",
    "scope.profileComments": "Komentarze w profilu",
    "scope.gameNews": "Aktualno\u015Bci i wydarzenia",
    "gamepage.title": "Strona gry",
    "gamepage.desc": "Uporz\u0105dkuj strony gier Steam: ukrywaj bloki, kt\xF3rych nigdy nie czytasz.",
    "gamepage.enabled": "Ukrywaj bloki strony gry",
    "gamepage.enabledDesc": "G\u0142\xF3wny prze\u0142\u0105cznik ukrywania blok\xF3w na stronach gier.",
    "gamepage.blocks": "Ukryte bloki",
    "gamepage.blocksDesc": "Wybierz bloki do ukrycia na stronach gier (strony aplikacji sklepu).",
    "block.media": "Zrzuty ekranu i zwiastuny",
    "block.purchase": "Opcje zakupu i pakiety",
    "block.description": "O tej grze",
    "block.dlc": "Zawarto\u015B\u0107 do tej gry (DLC)",
    "block.sysreq": "Wymagania systemowe",
    "block.reviews": "Recenzje u\u017Cytkownik\xF3w",
    "block.curators": "Co m\xF3wi\u0105 kuratorzy",
    "block.events": "Wydarzenia i og\u0142oszenia",
    "block.details": "Szczeg\xF3\u0142y i panel boczny",
    "block.recommendations": "Franczyza i rekomendacje",
    "block.sale": "Banner wydarzenia wyprzeda\u017Cy",
    "block.edition": "Zawarto\u015B\u0107 edycji i pakiet\xF3w",
    "prices.title": "Ceny regionalne",
    "prices.desc": "Por\xF3wnuj cen\u0119 gry w regionach Steam bezpo\u015Brednio na stronie gry.",
    "prices.enabled": "Ceny regionalne w\u0142\u0105czone",
    "prices.enabledDesc": "G\u0142\xF3wny prze\u0142\u0105cznik bloku por\xF3wnania cen.",
    "prices.autoLoad": "Wczytuj ceny automatycznie",
    "prices.autoLoadDesc": "Wy\u0142\u0105czone pokazuje przycisk wczytywania na ka\u017Cdej stronie gry.",
    "prices.position": "Po\u0142o\u017Cenie bloku",
    "prices.positionDesc": "Gdzie blok por\xF3wnania pojawia si\u0119 na stronach gier.",
    "pricesPos.purchase": "Nad opcjami zakupu",
    "pricesPos.sidebar": "Panel boczny",
    "pricesPos.description": "Pod opisem",
    "prices.sort": "Kolejno\u015B\u0107 wierszy",
    "prices.sortDesc": "Kolejno\u015B\u0107 cen u\u017Cywa przybli\u017Conych kurs\xF3w walut.",
    "pricesSort.custom": "Jak na li\u015Bcie",
    "pricesSort.priceAsc": "Najpierw najta\u0144sze",
    "pricesSort.discountDesc": "Najpierw najwi\u0119ksze rabaty",
    "prices.conversion": "Przeliczanie walut",
    "prices.conversionDesc": "Przelicza wszystkie ceny na jedn\u0105 walut\u0119 po kursach na \u017Cywo.",
    "prices.convertTo": "Waluta wy\u015Bwietlania",
    "prices.convertToDesc": "Auto u\u017Cywa waluty przegl\u0105danego sklepu.",
    "convertTo.auto": "Auto (waluta twojego sklepu)",
    "convertTo.off": "Nie (bez przeliczania)",
    "prices.showConverted": "Pokazuj cen\u0119 po przeliczeniu",
    "prices.fxCache": "Czas cache kurs\xF3w",
    "prices.fxCacheDesc": "Jak d\u0142ugo kursy s\u0105 u\u017Cywane ponownie przed nowym zapytaniem.",
    "fxTtl.1h": "1 godzina",
    "fxTtl.6h": "6 godzin",
    "fxTtl.24h": "24 godziny",
    "fxTtl.7d": "7 dni",
    "prices.fxCached": "Kursy w cache: {provider}, {date}",
    "prices.fxCacheEmpty": "Brak kurs\xF3w w cache \u2014 otw\xF3rz raz dowoln\u0105 stron\u0119 gry.",
    "prices.fxClear": "Wyczy\u015B\u0107 cache kurs\xF3w",
    "prices.regions": "Por\xF3wnywane regiony",
    "prices.regionsDesc": "Regiony sklepu, dla kt\xF3rych wczytywa\u0107 ceny (do 24).",
    "prices.display": "Wy\u015Bwietlanie",
    "prices.showOriginal": "Cena pierwotna",
    "prices.showDiscount": "Odznaka rabatu",
    "prices.showSavings": "Oszcz\u0119dno\u015B\u0107 wzgl\u0119dem twojej ceny",
    "prices.highlightCheapest": "Wyr\xF3\u017Cnij najta\u0144szy",
    "prices.showHomeRow": "Wiersz twojej ceny",
    "prices.collapsed": "Zaczynaj zwini\u0119ty",
    "prices.collapsedDesc": "Blok por\xF3wnania jest domy\u015Blnie zwini\u0119ty, aby zajmowa\u0107 mniej miejsca; rozwi\u0144 go przyciskiem w nag\u0142\xF3wku.",
    "prices.colRegion": "Region",
    "prices.colPrice": "Cena",
    "prices.colDiscount": "Rabat",
    "prices.colSavings": "Oszcz\u0119dno\u015B\u0107",
    "prices.yours": "Twoja cena",
    "prices.cheapest": "Najni\u017Csza",
    "prices.load": "Wczytaj ceny",
    "prices.loading": "Wczytywanie cen\u2026",
    "prices.retry": "Pon\xF3w",
    "prices.failed": "Nie uda\u0142o si\u0119 wczyta\u0107 cen",
    "prices.noRegions": "Wybierz co najmniej jeden region w ustawieniach",
    "prices.updated": "Zaktualizowano {time}",
    "prices.refresh": "Od\u015Bwie\u017C ceny",
    "prices.collapse": "Zwi\u0144 blok",
    "prices.expand": "Rozwi\u0144 blok",
    "prices.fxHint": "Kursy walut: {provider} ({date}).",
    "links.title": "Linki zewn\u0119trzne",
    "links.desc": "Szybkie linki do innych sklep\xF3w i baz danych na stronie gry.",
    "links.enabled": "Linki zewn\u0119trzne w\u0142\u0105czone",
    "links.enabledDesc": "G\u0142\xF3wny prze\u0142\u0105cznik bloku link\xF3w zewn\u0119trznych.",
    "links.position": "Pozycja bloku",
    "links.positionDesc": "Gdzie blok link\xF3w pojawia si\u0119 na stronach gier.",
    "links.newTab": "Otwieraj w nowej karcie",
    "links.newTabDesc": "Otwieraj linki zewn\u0119trzne w nowej karcie.",
    "links.list": "Linki",
    "links.listDesc": "Linki wy\u015Bwietlane na stronach gier. Nierozpoznane szablony s\u0105 pomijane.",
    "links.templateHelp": "Szablon URL: {name} \u2014 tytu\u0142 gry, {appid} \u2014 id Steam. Np.: https://store.epicgames.com/en-US/browse?q={name} lub https://steamdb.info/app/{appid}/",
    "links.name": "Nazwa",
    "links.namePlaceholder": "GOG",
    "links.url": "Adres linku",
    "links.urlPlaceholder": "https://www.gog.com/games?query={name}",
    "links.icon": "Adres ikony (opcjonalnie)",
    "links.iconPlaceholder": "https://www.gog.com/favicon.ico",
    "links.add": "Dodaj link",
    "links.remove": "Usu\u0144 ten link",
    "links.moveUp": "Przenie\u015B w g\xF3r\u0119",
    "links.moveDown": "Przenie\u015B w d\xF3\u0142",
    "links.empty": "Brak link\xF3w \u2014 dodaj poni\u017Cej.",
    "links.restore": "Przywr\xF3\u0107 domy\u015Blne",
    "links.preview": "Podgl\u0105d",
    "links.open": "Otw\xF3rz",
    "region.title": "Obej\u015Bcie blokady regionu",
    "region.desc": "Ponownie wczytuje strony z b\u0142\u0119dem \u201Eniedost\u0119pne w twoim regionie\u201D anonimowym \u017C\u0105daniem go\u015Bcia (bez cookies konta).",
    "region.enabled": "Obej\u015Bcie blokady regionu",
    "region.enabledDesc": "G\u0142\xF3wny prze\u0142\u0105cznik ponownego wczytywania zablokowanych stron.",
    "region.showBanner": "Pokazuj pasek powiadomienia",
    "region.showBannerDesc": "Pokazuje, \u017Ce strona pochodzi z anonimowego \u017C\u0105dania go\u015Bcia. Domy\u015Blnie ukryte; dzia\u0142a od nast\u0119pnego prze\u0142adowania.",
    "region.mode": "Na zablokowanych stronach",
    "region.modeDesc": "Auto od razu podmienia stron\u0119 b\u0142\u0119du; r\u0119cznie pokazuje najpierw przycisk.",
    "regionMode.auto": "Automatycznie",
    "regionMode.manual": "Przyciskiem",
    "region.country": "Kraj sklepu (cc)",
    "region.countryDesc": "Opcjonalny dwuliterowy kod kraju dla \u017C\u0105da\u0144 go\u015Bcia. Puste zachowuje tw\xF3j kraj.",
    "region.countryPlaceholder": "US",
    "region.proxy": "Gateway proxy",
    "region.proxyDesc": "Przy blokadach IP: kieruje anonimowe \u017C\u0105danie przez bramk\u0119 HTTP w otwartym regionie.",
    "region.proxyEnabled": "U\u017Cywaj gateway proxy",
    "region.proxyMode": "Tryb gateway",
    "region.proxyModeDesc": "Spos\xF3b do\u0142\u0105czania adresu sklepu do host:port.",
    "regionProxyMode.gateway": "host:port/https://\u2026",
    "regionProxyMode.path": "host:port/store.steampowered.com/\u2026",
    "regionProxyMode.query": "host:port/?url=\u2026",
    "region.proxyHost": "Host",
    "region.proxyPort": "Port",
    "region.proxyUser": "Nazwa u\u017Cytkownika",
    "region.proxyPass": "Has\u0142o",
    "region.bannerBadge": "Region zablokowany",
    "region.bannerTitle": "Ta strona jest niedost\u0119pna w twoim regionie",
    "region.bannerBody": "Pokazano anonimowym \u017C\u0105daniem go\u015Bcia (bez cookies konta)",
    "region.bannerViaProxy": "przez gateway proxy",
    "region.reload": "Od\u015Bwie\u017C",
    "region.retry": "Pon\xF3w",
    "region.offer": "Ta strona jest zablokowana w twoim regionie. Wczyta\u0107 j\u0105 bez cookies konta?",
    "region.offerButton": "Poka\u017C stron\u0119",
    "region.loading": "Wczytywanie strony bez cookies konta\u2026",
    "region.errorBlocked": "Nadal zablokowane przez IP/region. W\u0142\u0105cz gateway proxy do otwartego regionu.",
    "region.errorBlockedProxy": "Nadal zablokowane. IP proxy te\u017C jest w ograniczonym regionie \u2014 spr\xF3buj innego w\u0119z\u0142a wyj\u015Bciowego.",
    "region.errorAgeGate": "Steam pokaza\u0142 weryfikacj\u0119 wieku. Naci\u015Bnij Pon\xF3w \u2014 cookies wieku wysy\u0142aj\u0105 si\u0119 same.",
    "region.errorFailed": "Nie uda\u0142o si\u0119 wczyta\u0107: {error}",
    "cache.usage": "Zu\u017Cycie pami\u0119ci",
    "cache.contents": "Zapisane t\u0142umaczenia",
    "cache.clear": "Wyczy\u015B\u0107 pami\u0119\u0107",
    "cache.cleared": "Wyczyszczono pami\u0119\u0107 ({count})",
    "cache.empty": "Pami\u0119\u0107 jest pusta",
    "cache.clearHint": "Usuwa wszystkie zapisane t\u0142umaczenia z tego profilu przegl\u0105darki.",
    "cache.listEmpty": "Brak zapisanych t\u0142umacze\u0144 \u2014 przet\u0142umacz co\u015B, a pojawi si\u0119 tutaj.",
    "cache.listMore": "\u2026i {count} wi\u0119cej",
    "cache.removeEntry": "Usu\u0144 ten wpis",
    "cache.entries": "wpis\xF3w: {count}",
    "cache.used": "{used} w {count} wpisach",
    "cache.free": "Wolne",
    "cache.pct": "Zape\u0142nienie: {pct}%",
    "about.blurb": "Ulepsza strony sklepu i spo\u0142eczno\u015Bci Steam: t\u0142umaczenie tre\u015Bci z pami\u0119ci\u0105 podr\u0119czn\u0105, a wkr\xF3tce wi\u0119cej.",
    "about.repo": "GitHub",
    "about.repoHint": "Kod \u017Ar\xF3d\u0142owy, aktualizacje i zg\u0142aszanie problem\xF3w",
    "toast.saved": "Zapisano ustawienia",
    "toast.rateLimited": "T\u0142umaczenie ograniczone",
    "toast.rateLimitedDesc": "Google chwilowo ogranicza zapytania. Bloki ponowi\u0105 pr\xF3b\u0119 same \u2014 lub naci\u015Bnij Pon\xF3w p\xF3\u017Aniej.",
    "toast.translateFailed": "T\u0142umaczenie nie powiod\u0142o si\u0119",
    "toast.translateFailedDesc": "Co\u015B posz\u0142o nie tak. Naci\u015Bnij Pon\xF3w na bloku.",
    "toast.unknownProvider": "Nieznany dostawca t\u0142umacze\u0144",
    "toast.unknownProviderDesc": "Sprawd\u017A dostawc\u0119 w ustawieniach i zapisz ponownie.",
    "toast.cacheCleared": "Zmieniono j\u0119zyk \u2014 wyczyszczono pami\u0119\u0107 t\u0142umacze\u0144.",
    "translate.button": "Przet\u0142umacz",
    "translate.original": "Orygina\u0142",
    "translate.loading": "T\u0142umaczenie\u2026",
    "translate.loadingShort": "T\u0142umaczenie",
    "translate.error": "B\u0142\u0105d t\u0142umaczenia",
    "translate.retry": "Pon\xF3w",
    "queue.addToWishlist": "Dodaj do listy \u017Cycze\u0144",
    "queue.onWishlist": "Na li\u015Bcie \u017Cycze\u0144",
    "queue.addedNotice": "Dodano do listy \u017Cycze\u0144!",
    "queue.oops": "Ups, przepraszamy!",
    "queue.follow": "Obserwuj",
    "queue.following": "Obserwowane",
    "queue.ignore": "Ignoruj",
    "queue.ignored": "Ignorowane",
    "queue.viewQueue": "Zobacz swoj\u0105 kolejk\u0119",
    "queue.manageWishlist": "Zarz\u0105dzaj list\u0105 \u017Cycze\u0144",
    "queue.removeWishlist": "Usu\u0144 z listy \u017Cycze\u0144",
    "queue.ignoreDefault": "Ignoruj to (domy\u015Blnie)",
    "queue.ignoreDefaultSub": "Ukryj w sklepie, ignoruj powiadomienia i nie u\u017Cywaj do generowania innych rekomendacji.",
    "queue.playedElsewhere": "Grano na innej platformie",
    "queue.playedElsewhereSub": "Ukryj w sklepie. Mo\u017Ce s\u0142u\u017Cy\u0107 do generowania rekomendacji.",
    "queue.actionFailed": "Nie uda\u0142o si\u0119 zapisa\u0107 zmian",
    "queue.actionFailedDesc": "Wyst\u0105pi\u0142 problem z zapisaniem zmian. Spr\xF3buj ponownie p\xF3\u017Aniej."
  };

  // src/i18n/locales/index.js
  var TRANSLATIONS = {
    en: en_default,
    ru: ru_default,
    de: de_default,
    es: es_default,
    fr: fr_default,
    "pt-BR": pt_BR_default,
    "zh-CN": zh_CN_default,
    ja: ja_default,
    ko: ko_default,
    pl: pl_default
  };

  // src/i18n/index.js
  var activeLocale = "en";
  function t(key, vars = {}) {
    const template = TRANSLATIONS[activeLocale]?.[key] ?? TRANSLATIONS.en[key] ?? key;
    return Object.entries(vars).reduce(
      (value, [name, replacement]) => value.split(`{${name}}`).join(String(replacement)),
      template
    );
  }

  // src/core/settings.js
  function normalizeLocale(value, fallback) {
    if (value === "auto" || SUPPORTED_LOCALES.includes(value)) return value;
    return fallback;
  }
  function normalizeTrigger(value) {
    return value === "auto" ? "auto" : "manual";
  }
  function normalizeDisplay(value) {
    return value === "replace" ? "replace" : "below";
  }
  function normalizeProvider(value, fallback) {
    return typeof value === "string" && value ? value : fallback;
  }
  function normalizeTargetLanguage(value) {
    return typeof value === "string" && /^[a-z]{2}(-[A-Za-z]{2,4})?$/.test(value) ? value : "auto";
  }
  function normalizeScopes(raw, fallbackScopes) {
    const result = { ...fallbackScopes };
    if (raw && typeof raw === "object") {
      for (const key of Object.keys(result)) {
        result[key] = raw[key] !== false;
      }
    }
    return result;
  }
  function normalizeToastPosition(value) {
    const positions = ["bottom-right", "bottom-left", "top-right", "top-left"];
    return positions.includes(value) ? value : "bottom-right";
  }
  function normalizeToastDuration(value, fallback) {
    const ms = Number(value);
    if (!Number.isFinite(ms)) return fallback;
    return Math.min(12e4, Math.max(0, Math.round(ms)));
  }
  function normalizeToasts(raw, fallback) {
    return {
      enabled: raw?.enabled !== false,
      position: normalizeToastPosition(raw?.position),
      duration: normalizeToastDuration(raw?.duration, fallback.duration)
    };
  }
  function normalizeGamepage(raw, fallback) {
    const hidden = { ...fallback.hidden };
    for (const key of Object.keys(hidden)) {
      hidden[key] = raw?.hidden?.[key] === true;
    }
    return {
      enabled: raw?.enabled !== false,
      hidden
    };
  }
  var PRICE_POSITIONS = ["purchase", "sidebar", "description"];
  var PRICE_SORTS = ["custom", "priceAsc", "discountDesc"];
  var FX_TTLS = [36e5, 216e5, 864e5, 6048e5];
  var LINK_POSITIONS = ["purchase", "sidebar", "description"];
  var MAX_LINKS = 30;
  var MAX_LINK_FIELD = 500;
  function makeLinkId() {
    try {
      if (typeof crypto?.randomUUID === "function") return crypto.randomUUID();
    } catch {
    }
    return `link-${Date.now().toString(36)}-${Math.floor(Math.random() * 65535).toString(16)}`;
  }
  function normalizeLinkItem(raw) {
    const text = (value) => typeof value === "string" ? value.trim().slice(0, MAX_LINK_FIELD) : "";
    const id = typeof raw?.id === "string" && raw.id ? raw.id.slice(0, 64) : makeLinkId();
    return {
      id,
      name: text(raw?.name).slice(0, 60),
      url: text(raw?.url),
      icon: text(raw?.icon),
      enabled: raw?.enabled !== false
    };
  }
  function normalizeLinks(raw, fallback) {
    const items = Array.isArray(raw?.items) ? raw.items : fallback.items;
    const seen = /* @__PURE__ */ new Set();
    const normalized = [];
    for (const entry of items.slice(0, MAX_LINKS)) {
      const item = normalizeLinkItem(entry);
      if (!item.name || !item.url) continue;
      if (seen.has(item.id)) item.id = makeLinkId();
      seen.add(item.id);
      normalized.push(item);
    }
    return {
      enabled: raw?.enabled !== false,
      position: LINK_POSITIONS.includes(raw?.position) ? raw.position : fallback.position,
      openInNewTab: raw?.openInNewTab !== false,
      items: normalized
    };
  }
  var REGION_MODES = ["auto", "manual"];
  var REGION_PROXY_MODES = ["gateway", "path", "query"];
  function normalizeRegion(raw, fallback) {
    const text = (value, max) => typeof value === "string" ? value.slice(0, max) : "";
    const country = typeof raw?.countryCode === "string" && /^[A-Za-z]{2}$/.test(raw.countryCode.trim()) ? raw.countryCode.trim().toUpperCase() : "";
    return {
      enabled: raw?.enabled !== false,
      mode: REGION_MODES.includes(raw?.mode) ? raw.mode : fallback.mode,
      showBanner: raw?.showBanner === true,
      proxyEnabled: raw?.proxyEnabled === true,
      proxyHost: text(raw?.proxyHost, 253).trim(),
      proxyPort: text(raw?.proxyPort, 5).trim(),
      proxyUser: text(raw?.proxyUser, 128),
      proxyPass: text(raw?.proxyPass, 256),
      proxyMode: REGION_PROXY_MODES.includes(raw?.proxyMode) ? raw.proxyMode : fallback.proxyMode
    };
  }
  function normalizeConvertTo(value, fallback) {
    if (value === "auto" || value === "off") return value;
    if (typeof value === "string" && /^[A-Za-z]{3}$/.test(value)) return value.toUpperCase();
    return fallback;
  }
  function normalizePrices(raw, fallback) {
    const regions = Array.isArray(raw?.regions) ? [...new Set(raw.regions.map((code) => String(code).toUpperCase()))] : [...fallback.regions];
    return {
      enabled: raw?.enabled !== false,
      autoLoad: raw?.autoLoad !== false,
      regions,
      position: PRICE_POSITIONS.includes(raw?.position) ? raw.position : fallback.position,
      sort: PRICE_SORTS.includes(raw?.sort) ? raw.sort : fallback.sort,
      showOriginal: raw?.showOriginal !== false,
      showDiscount: raw?.showDiscount !== false,
      showSavings: raw?.showSavings !== false,
      highlightCheapest: raw?.highlightCheapest !== false,
      showHomeRow: raw?.showHomeRow !== false,
      convertTo: normalizeConvertTo(raw?.convertTo, fallback.convertTo),
      showConverted: raw?.showConverted !== false,
      collapsed: raw?.collapsed === true,
      fxTtl: FX_TTLS.includes(Number(raw?.fxTtl)) ? Number(raw.fxTtl) : fallback.fxTtl
    };
  }
  function normalizeTranslation(raw, fallback) {
    return {
      enabled: raw?.enabled !== false,
      provider: normalizeProvider(raw?.provider, fallback.provider),
      trigger: normalizeTrigger(raw?.trigger),
      display: normalizeDisplay(raw?.display),
      targetLanguage: normalizeTargetLanguage(raw?.targetLanguage),
      showCached: raw?.showCached !== false,
      scopes: normalizeScopes(raw?.scopes, fallback.scopes)
    };
  }
  function loadSettings() {
    const fallback = getDefaults();
    let raw = null;
    try {
      raw = GM_getValue(SETTINGS_KEY, null);
    } catch {
      raw = null;
    }
    if (!raw || typeof raw !== "object") return fallback;
    return {
      language: normalizeLocale(raw.language, fallback.language),
      translation: normalizeTranslation(raw.translation, fallback.translation),
      gamepage: normalizeGamepage(raw.gamepage, fallback.gamepage),
      prices: normalizePrices(raw.prices, fallback.prices),
      links: normalizeLinks(raw.links, fallback.links),
      region: normalizeRegion(raw.region, fallback.region),
      toasts: normalizeToasts(raw.toasts, fallback.toasts)
    };
  }
  var settings = loadSettings();
  function getSettings() {
    return settings;
  }

  // src/utils/dom.js
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== void 0) node.textContent = text;
    return node;
  }

  // src/ui/toast.js
  var MAX_VISIBLE = 3;
  var DEFAULT_DURATION = 5e3;
  var ICONS = {
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/></svg>',
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
    warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>',
    error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
  };
  var ACTION_TONES = {
    primary: "sp-toast__action",
    ghost: "sp-toast__action sp-toast__action--ghost",
    danger: "sp-toast__action sp-toast__action--danger"
  };
  var toastSeq = 0;
  var visible = /* @__PURE__ */ new Map();
  function getToastSettings() {
    try {
      return getSettings().toasts ?? null;
    } catch {
      return null;
    }
  }
  function ensureContainer() {
    let container = document.querySelector(".sp-toasts");
    if (!container) {
      container = el("div", "sp-toasts");
      container.setAttribute("aria-live", "polite");
      document.body.appendChild(container);
    }
    container.classList.remove(
      "sp-toasts--top-right",
      "sp-toasts--top-left",
      "sp-toasts--bottom-left"
    );
    const position = getToastSettings()?.position;
    if (position && position !== "bottom-right") container.classList.add(`sp-toasts--${position}`);
    return container;
  }
  function buildToast(options) {
    const {
      type = "info",
      icon = type,
      title = "",
      message = "",
      duration = DEFAULT_DURATION,
      onClick,
      actions = []
    } = options;
    const node = el("div", `sp-toast sp-toast--${type}`);
    node.setAttribute("role", type === "error" ? "alert" : "status");
    if (onClick) {
      node.classList.add("sp-toast--clickable");
      node.addEventListener("click", (event) => {
        if (event.target.closest("button")) return;
        onClick();
      });
    }
    const iconHolder = el("span", `sp-toast__icon sp-toast__icon--${type}`);
    iconHolder.setAttribute("aria-hidden", "true");
    iconHolder.innerHTML = ICONS[icon] ?? ICONS[type] ?? ICONS.info;
    node.appendChild(iconHolder);
    const body = el("div", "sp-toast__body");
    const titleNode = el("div", "sp-toast__title", title);
    body.appendChild(titleNode);
    const messageNode = el("div", "sp-toast__message", message);
    if (!message) messageNode.hidden = true;
    body.appendChild(messageNode);
    const actionRow = el("div", "sp-toast__actions");
    let hasActions = false;
    for (const action of actions) {
      if (!action?.label || typeof action.onClick !== "function") continue;
      hasActions = true;
      const button = el("button", ACTION_TONES[action.tone] ?? ACTION_TONES.primary, action.label);
      button.type = "button";
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        action.onClick();
      });
      actionRow.appendChild(button);
    }
    if (hasActions) {
      actionRow.hidden = false;
      body.appendChild(actionRow);
    }
    node.appendChild(body);
    const closeButton = el("button", "sp-toast__close", "\xD7");
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", "\xD7");
    node.appendChild(closeButton);
    if (duration > 0) {
      const progress = el("div", "sp-toast__progress");
      const bar = el("span", "");
      bar.style.animationDuration = `${duration}ms`;
      progress.appendChild(bar);
      node.appendChild(progress);
    }
    return { node, titleNode, messageNode };
  }
  function showToast(options = {}) {
    const toastSettings = getToastSettings();
    if (toastSettings && toastSettings.enabled === false) {
      return { id: `sp-toast-off-${++toastSeq}`, dismiss() {
      }, update() {
      }, touch() {
      } };
    }
    const effective = {
      ...options,
      duration: options.duration ?? toastSettings?.duration ?? DEFAULT_DURATION
    };
    const key = effective.key;
    const existing = key ? visible.get(key) : null;
    if (existing) {
      existing.update({ title: effective.title, message: effective.message });
      existing.touch();
      return existing.handle;
    }
    const container = ensureContainer();
    const overflow = container.children.length - MAX_VISIBLE + 1;
    if (overflow > 0) {
      const evict = new CustomEvent("sp-toast-evict");
      [...container.children].slice(0, overflow).forEach((child) => {
        child.dispatchEvent(evict);
      });
    }
    const id = `sp-toast-${++toastSeq}`;
    const { node, titleNode, messageNode } = buildToast(effective);
    node.dataset.spToast = id;
    const duration = effective.duration ?? DEFAULT_DURATION;
    let timer = null;
    let remaining = duration;
    let startedAt = 0;
    let dismissed = false;
    const record = { node, key };
    const handle = {
      id,
      dismiss: () => dismiss(),
      update: ({ title, message }) => {
        if (title !== void 0) titleNode.textContent = title;
        if (message !== void 0) {
          messageNode.textContent = message;
          messageNode.hidden = !message;
        }
      },
      touch: () => {
        if (duration <= 0 || dismissed) return;
        clearTimeout(timer);
        remaining = duration;
        restartProgress();
        arm();
      }
    };
    function restartProgress() {
      const bar = node.querySelector(".sp-toast__progress span");
      if (!bar) return;
      bar.style.animation = "none";
      void bar.offsetWidth;
      bar.style.animation = "";
    }
    function arm() {
      if (duration <= 0 || dismissed) return;
      startedAt = Date.now();
      timer = setTimeout(() => dismiss(), remaining);
    }
    function dismiss() {
      if (dismissed) return;
      dismissed = true;
      clearTimeout(timer);
      if (key) visible.delete(key);
      node.classList.add("sp-toast--leaving");
      setTimeout(() => node.remove(), 180);
    }
    node.querySelector(".sp-toast__close").addEventListener("click", (event) => {
      event.stopPropagation();
      dismiss();
    });
    node.addEventListener("sp-toast-evict", () => dismiss());
    if (duration > 0) {
      node.addEventListener("mouseenter", () => {
        clearTimeout(timer);
        remaining = Math.max(0, remaining - (Date.now() - startedAt));
      });
      node.addEventListener("mouseleave", arm);
    }
    container.appendChild(node);
    if (key) visible.set(key, { ...record, ...handle });
    arm();
    return handle;
  }

  // src/features/region/request.js
  function getCookie(name) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${escaped}=([^;]*)`));
    return match ? decodeURIComponent(match[1].trim()) : "";
  }
  function getStoreCountryCode(settings2 = getSettings().region) {
    if (settings2?.countryCode && /^[A-Za-z]{2}$/.test(settings2.countryCode.trim())) {
      return settings2.countryCode.trim().toUpperCase();
    }
    const fromCookie = getCookie("steamCountry");
    if (fromCookie) {
      const cc = decodeURIComponent(fromCookie).split("|")[0]?.trim();
      if (/^[A-Za-z]{2}$/.test(cc)) return cc.toUpperCase();
    }
    return "";
  }

  // src/features/region/detect.js
  var APP_RE = /\/(app|bundle|sub)\/(\d+)/i;
  function getStorePageId(url = location.href) {
    const match = String(url).match(APP_RE);
    return match ? { kind: match[1].toLowerCase(), id: match[2] } : null;
  }
  function isHostLoggedIn() {
    if (document.querySelector(
      "#account_pulldown, #account_dropdown, #header_notification_area, #global_actions .user_avatar, #global_actions .playerAvatar"
    )) {
      return true;
    }
    return !!document.querySelector(
      '#global_actions a[href*="steamcommunity.com/profiles/"], #global_actions a[href*="steamcommunity.com/id/"]'
    );
  }

  // src/features/region/queue.js
  var QUEUE_SNR = "1_5_9_";
  var IMG_SELECTED = "https://store.fastly.steamstatic.com/public/images/v6/ico/ico_selected.png";
  var IMG_ARROW_DOWN = "https://store.fastly.steamstatic.com/public/images/v6/btn_arrow_down_padded.png";
  var IMG_SEL_BRIGHT = "https://store.fastly.steamstatic.com/public/images/v6/ico/ico_selected_bright.png";
  var IMG_UNSEL_BRIGHT = "https://store.fastly.steamstatic.com/public/images/v6/ico/ico_unselected_bright.png";
  var SESSION_RE = /g_sessionID\s*=\s*"([^"]+)"/;
  var ACCOUNT_RE = /g_AccountID\s*=\s*(\d+)/;
  var DYNAMIC_INIT_RE = /GDynamicStore\.Init\(\s*(\d+)/;
  function parseLiveSession(root = document) {
    let sessionId = "";
    let accountId = 0;
    const scripts = root.querySelectorAll?.("script:not([src])") ?? [];
    for (const node of scripts) {
      const code = node.textContent || "";
      if (!sessionId) {
        const match = code.match(SESSION_RE);
        if (match) sessionId = match[1];
      }
      if (!accountId) {
        const match = code.match(ACCOUNT_RE) || code.match(DYNAMIC_INIT_RE);
        const parsed = match ? Number.parseInt(match[1], 10) : 0;
        if (parsed > 0) accountId = parsed;
      }
      if (sessionId && accountId) break;
    }
    if (!sessionId) sessionId = getCookie("sessionid");
    return { sessionId, accountId };
  }
  function fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Math.max(REGION_REQUEST_TIMEOUT_MS, 0));
    return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
  }
  function storePost(path, params) {
    const body = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) body.append(key, String(value));
    return fetchWithTimeout(`https://store.steampowered.com${path}`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
      body: body.toString()
    }).then(async (response) => {
      if (!response.ok) {
        throw fail(Codes.REGION_QUEUE, `queue POST ${path} HTTP ${response.status}`, {
          status: response.status
        });
      }
      const text = await response.text();
      if (!text) return {};
      try {
        return JSON.parse(text);
      } catch {
        return {};
      }
    });
  }
  async function fetchQueueState(accountId, appid) {
    const state = { onWishlist: false, ignored: false, ignoreReason: 0 };
    if (!accountId) return state;
    const cc = getStoreCountryCode();
    const url = `https://store.steampowered.com/dynamicstore/userdata/?id=${accountId}${cc ? `&cc=${cc}` : ""}`;
    try {
      const response = await fetchWithTimeout(url, { credentials: "same-origin" });
      if (!response.ok) throw fail(Codes.REGION_QUEUE, `queue state HTTP ${response.status}`);
      const data = await response.json();
      const wishlist = data?.rgWishlist;
      if (Array.isArray(wishlist)) {
        state.onWishlist = wishlist.some((id) => String(id) === String(appid));
      } else if (wishlist && typeof wishlist === "object") {
        state.onWishlist = Object.prototype.hasOwnProperty.call(wishlist, appid) || Object.prototype.hasOwnProperty.call(wishlist, Number(appid));
      }
      const ignored = data?.rgIgnoredApps;
      if (ignored && typeof ignored === "object") {
        const key = Object.prototype.hasOwnProperty.call(ignored, appid) ? appid : Object.prototype.hasOwnProperty.call(ignored, Number(appid)) ? Number(appid) : null;
        if (key !== null) {
          state.ignored = true;
          const reason = Number(ignored[key]?.ignored_reason ?? ignored[key]?.reason ?? 0);
          state.ignoreReason = reason === 2 ? 2 : 0;
        }
      }
    } catch (error) {
      logInfo("region", "queue state fetch failed, keeping defaults", {
        error: String(error?.message || error)
      });
    }
    return state;
  }
  function buildQueueHtml() {
    return `
    <div id="add_to_wishlist_area">
      <a class="btnv6_blue_hoverfade btn_medium add_to_wishlist" href="javascript:void(0)">
        <span>${t("queue.addToWishlist")}</span>
      </a>
    </div>
    <div id="add_to_wishlist_area_success" style="display: none; position: relative;">
      <a href="javascript:void(0)" class="btnv6_blue_hoverfade btn_medium queue_btn_active add_to_wishlist" id="view_wishlist_btn">
        <span><img src="${IMG_SELECTED}" border="0"> ${t("queue.onWishlist")}</span>
      </a>
      <div id="wishlistDropDown" class="queue_control_button queue_btn_menu">
        <div class="queue_menu_arrow queue_btn_active btn_medium">
          <span><img src="${IMG_ARROW_DOWN}"></span>
        </div>
        <div class="queue_menu_flyout">
          <div class="queue_menu_flyout_content">
            <div class="queue_menu_option">
              <div class="queue_menu_option_label">
                <a href="https://store.steampowered.com/wishlist/" class="option_title">${t("queue.manageWishlist")}</a>
              </div>
            </div>
            <div class="queue_menu_option">
              <div class="queue_menu_option_label">
                <a href="javascript:void(0)" class="option_title" data-sp-queue-remove>${t("queue.removeWishlist")}</a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="wishlist_added_temp_notice" style="display: none;">${t("queue.addedNotice")}</div>
    </div>
    <div id="add_to_wishlist_area_fail" style="display: none;">
      <b>${t("queue.oops")}</b>
    </div>
    <div id="queueBtnFollow" class="queue_control_button queue_btn_follow" style="flex-grow: 0;">
      <button class="btnv6_blue_hoverfade btn_medium queue_btn_inactive" data-panel='{"focusable":true,"clickOnActivate":true}' role="button" type="button" data-sp-queue-follow>
        <span>${t("queue.follow")}</span>
      </button>
      <button class="btnv6_blue_hoverfade btn_medium queue_btn_active" data-panel='{"focusable":true,"clickOnActivate":true}' role="button" type="button" style="display: none;" data-sp-queue-unfollow>
        <span><img src="${IMG_SELECTED}" border="0"> ${t("queue.following")}</span>
      </button>
    </div>
    <div id="ignoreBtn" style="position: relative; display: flex;">
      <div class="queue_control_button queue_btn_ignore">
        <button class="btnv6_blue_hoverfade btn_medium queue_btn_inactive" data-panel='{"focusable":true,"clickOnActivate":true}' role="button" type="button" data-sp-queue-ignore>
          <span>${t("queue.ignore")}</span>
        </button>
        <button class="btnv6_blue_hoverfade btn_medium queue_btn_active" data-panel='{"focusable":true,"clickOnActivate":true}' role="button" type="button" style="display: none;" data-sp-queue-unignore>
          <span><img src="${IMG_SELECTED}" border="0"> ${t("queue.ignored")}</span>
        </button>
      </div>
      <div id="queue_btn_ignore_menu" class="queue_control_button queue_btn_menu">
        <button class="queue_menu_arrow btn_medium queue_btn_inactive" id="queue_ignore_menu_arrow" aria-haspopup="menu" aria-expanded="false" aria-controls="ignore_menu_flyout" type="button">
          <span><img alt="Ignore options" src="${IMG_ARROW_DOWN}"></span>
        </button>
        <div class="queue_menu_flyout" id="ignore_menu_flyout" role="menu">
          <div class="queue_menu_flyout_content">
            <button class="queue_menu_option" role="menuitem" id="queue_ignore_menu_option_not_interested" type="button">
              <div>
                <img class="queue_ignore_menu_option_image selected" src="${IMG_SEL_BRIGHT}">
                <img class="queue_ignore_menu_option_image unselected" src="${IMG_UNSEL_BRIGHT}">
              </div>
              <div class="queue_menu_option_label">
                <div class="option_title">${t("queue.ignoreDefault")}</div>
                <div class="option_subtitle">${t("queue.ignoreDefaultSub")}</div>
              </div>
            </button>
            <button class="queue_menu_option" role="menuitem" id="queue_ignore_menu_option_owned_elsewhere" type="button">
              <div>
                <img class="queue_ignore_menu_option_image selected" src="${IMG_SEL_BRIGHT}">
                <img class="queue_ignore_menu_option_image unselected" src="${IMG_UNSEL_BRIGHT}">
              </div>
              <div class="queue_menu_option_label">
                <div class="option_title">${t("queue.playedElsewhere")}</div>
                <div class="option_subtitle">${t("queue.playedElsewhereSub")}</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>`;
  }
  function buildQueueTail() {
    return `
    <div class="expand_to_fill"></div>
    <a href="https://store.steampowered.com/explore/?snr=${QUEUE_SNR}" class="btnv6_blue_hoverfade btn_medium right responsive_hidden">
      <span>${t("queue.viewQueue")}&nbsp;&nbsp;&nbsp;<i class="ico16 arrow_next"></i></span>
    </a>`;
  }
  function setWishlist(container, on) {
    const area = container.querySelector("#add_to_wishlist_area");
    const success = container.querySelector("#add_to_wishlist_area_success");
    const failArea = container.querySelector("#add_to_wishlist_area_fail");
    if (area) area.style.display = on ? "none" : "";
    if (success) success.style.display = on ? "" : "none";
    if (failArea) failArea.style.display = "none";
  }
  function setFollow(container, on) {
    const follow = container.querySelector("[data-sp-queue-follow]");
    const unfollow = container.querySelector("[data-sp-queue-unfollow]");
    if (follow) follow.style.display = on ? "none" : "";
    if (unfollow) unfollow.style.display = on ? "" : "none";
  }
  function setIgnored(container, ignored, reason = 0) {
    const ignore = container.querySelector("[data-sp-queue-ignore]");
    const unignore = container.querySelector("[data-sp-queue-unignore]");
    if (ignore) ignore.style.display = ignored ? "none" : "";
    if (unignore) unignore.style.display = ignored ? "" : "none";
    const menu = container.querySelector("#queue_btn_ignore_menu");
    const arrow = container.querySelector("#queue_ignore_menu_arrow");
    menu?.classList.remove("not_interested", "owned_elsewhere");
    arrow?.classList.remove("queue_btn_active", "queue_btn_inactive");
    if (ignored) {
      menu?.classList.add(reason === 2 ? "owned_elsewhere" : "not_interested");
      arrow?.classList.add("queue_btn_active");
    } else {
      arrow?.classList.add("queue_btn_inactive");
    }
  }
  function reportActionError(action, appid, error) {
    logError(Codes.REGION_QUEUE, `queue ${action} failed`, {
      appid,
      error: String(error?.message || error)
    });
    showToast({
      type: "error",
      title: t("queue.actionFailed"),
      message: t("queue.actionFailedDesc"),
      key: "sp-queue-action"
    });
  }
  function guardBusy(button) {
    if (button.dataset.spBusy === "1") return false;
    button.dataset.spBusy = "1";
    return true;
  }
  function wireQueueActions(container, { appid, sessionId }) {
    let ignoreReason = 0;
    const base = { sessionid: sessionId, appid };
    const wishAdd = container.querySelector("#add_to_wishlist_area > a");
    const wishRemove = container.querySelector("#view_wishlist_btn");
    const wishRemoveLink = container.querySelector("[data-sp-queue-remove]");
    const wishFail = container.querySelector("#add_to_wishlist_area_fail");
    const wishNotice = container.querySelector(".wishlist_added_temp_notice");
    const doWishlist = async (button, remove) => {
      if (!guardBusy(button)) return;
      try {
        await storePost(remove ? "/api/removefromwishlist" : "/api/addtowishlist", base);
        setWishlist(container, !remove);
        if (!remove && wishNotice) {
          wishNotice.style.display = "";
          setTimeout(() => {
            wishNotice.style.display = "none";
          }, 3e3);
        }
      } catch (error) {
        if (wishFail) wishFail.style.display = "";
        reportActionError(remove ? "remove-wishlist" : "add-wishlist", appid, error);
      } finally {
        delete button.dataset.spBusy;
      }
    };
    wishAdd?.addEventListener("click", (event) => {
      event.preventDefault();
      void doWishlist(wishAdd, false);
    });
    const doRemove = (event) => {
      event.preventDefault();
      void doWishlist(event.currentTarget, true);
    };
    wishRemove?.addEventListener("click", doRemove);
    wishRemoveLink?.addEventListener("click", doRemove);
    const doFollow = async (button, unfollow) => {
      if (!guardBusy(button)) return;
      try {
        await storePost("/explore/followgame/", unfollow ? { ...base, unfollow: 1 } : base);
        setFollow(container, !unfollow);
      } catch (error) {
        reportActionError(unfollow ? "unfollow" : "follow", appid, error);
      } finally {
        delete button.dataset.spBusy;
      }
    };
    container.querySelector("[data-sp-queue-follow]")?.addEventListener("click", (event) => void doFollow(event.currentTarget, false));
    container.querySelector("[data-sp-queue-unfollow]")?.addEventListener("click", (event) => void doFollow(event.currentTarget, true));
    const doIgnore = async (button, remove, reason = 0) => {
      if (!guardBusy(button)) return;
      try {
        await storePost(
          "/recommended/ignorerecommendation/",
          remove ? { ...base, snr: QUEUE_SNR, remove: 1 } : { ...base, snr: QUEUE_SNR, ignore_reason: reason }
        );
        if (!remove) ignoreReason = reason;
        setIgnored(container, !remove, ignoreReason);
        container.querySelector("#queue_ignore_menu_arrow")?.setAttribute("aria-expanded", "false");
      } catch (error) {
        reportActionError(remove ? "unignore" : "ignore", appid, error);
      } finally {
        delete button.dataset.spBusy;
      }
    };
    container.querySelector("[data-sp-queue-ignore]")?.addEventListener("click", (event) => void doIgnore(event.currentTarget, false, 0));
    container.querySelector("[data-sp-queue-unignore]")?.addEventListener("click", (event) => void doIgnore(event.currentTarget, true));
    container.querySelector("#queue_ignore_menu_option_not_interested")?.addEventListener("click", (event) => {
      const active = container.querySelector("[data-sp-queue-unignore]");
      if (active && active.style.display !== "none" && ignoreReason === 0) {
        void doIgnore(active, true);
      } else {
        void doIgnore(event.currentTarget, false, 0);
      }
    });
    container.querySelector("#queue_ignore_menu_option_owned_elsewhere")?.addEventListener("click", (event) => {
      const active = container.querySelector("[data-sp-queue-unignore]");
      if (active && active.style.display !== "none" && ignoreReason === 2) {
        void doIgnore(active, true);
      } else {
        void doIgnore(event.currentTarget, false, 2);
      }
    });
    const arrow = container.querySelector("#queue_ignore_menu_arrow");
    const flyout = container.querySelector("#ignore_menu_flyout > div");
    arrow?.addEventListener("click", () => {
      const expanded = arrow.getAttribute("aria-expanded") === "true";
      arrow.setAttribute("aria-expanded", String(!expanded));
      if (!expanded) flyout?.querySelector(".queue_menu_option")?.focus({ preventScroll: true });
    });
    flyout?.addEventListener("focusout", (event) => {
      if (!flyout.contains(event.relatedTarget)) arrow?.setAttribute("aria-expanded", "false");
    });
    document.addEventListener("click", (event) => {
      if (arrow?.getAttribute("aria-expanded") !== "true") return;
      if (!container.querySelector("#ignoreBtn")?.contains(event.target)) {
        arrow.setAttribute("aria-expanded", "false");
      }
    });
    return {
      applyState(state) {
        setWishlist(container, state.onWishlist);
        setIgnored(container, state.ignored, state.ignoreReason);
        ignoreReason = state.ignoreReason;
      }
    };
  }
  function restoreQueueActions() {
    try {
      const page = getStorePageId();
      if (!page || page.kind !== "app") return false;
      if (!isHostLoggedIn()) return false;
      const container = document.querySelector("#queueActionsCtn");
      if (!container || container.dataset.spQueueRestored === "1") return false;
      if (container.querySelector("#add_to_wishlist_area")) return false;
      if (!container.querySelector('a[href*="/login"]')) return false;
      const { sessionId, accountId } = parseLiveSession();
      if (!sessionId) {
        logInfo("region", "queue restore skipped: no live session found");
        return false;
      }
      const template = document.createElement("template");
      template.innerHTML = buildQueueHtml().trim();
      const shareBtn = container.querySelector("#shareBtn");
      container.querySelectorAll(":scope > p").forEach((node) => {
        if (node.querySelector('a[href*="/login"]')) node.remove();
      });
      const head = [...template.content.children];
      head.forEach((node) => container.insertBefore(node, shareBtn));
      const tail = document.createElement("template");
      tail.innerHTML = buildQueueTail().trim();
      [...tail.content.children].forEach((node) => container.appendChild(node));
      if (!document.getElementById("queueCtn")) {
        container.closest(".queue_ctn")?.setAttribute("id", "queueCtn");
      }
      container.setAttribute("data-panel", '{"flow-children":"column"}');
      container.dataset.spQueueRestored = "1";
      const wired = wireQueueActions(container, { appid: page.id, sessionId });
      if (accountId) {
        void fetchQueueState(accountId, page.id).then((state) => {
          if (container.isConnected) wired.applyState(state);
        });
      }
      logInfo("region", "queue actions restored", { appid: page.id });
      return true;
    } catch (error) {
      logInfo("region", "queue restore skipped", { error: String(error?.message || error) });
      return false;
    }
  }

  // smoke-queue.mjs
  window.__queueSmoke = { restoreQueueActions, parseLiveSession };
})();
