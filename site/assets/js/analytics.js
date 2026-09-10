// GatorTec analytics + consent banner
// Both Google Analytics 4 and Cloudflare Web Analytics are gated behind explicit consent.
// Cloudflare's beacon sets no cookies, but it does POST the full page URL and a
// per-pageload id to cloudflareinsights.com, so it is treated as non-essential and
// loaded only after an affirmative Accept. See tracking-audit/FIX-gatortec.com.md.
// To rotate keys: update GA4_ID and CF_BEACON_TOKEN below.

(function () {
  var GA4_ID = 'G-015MR208YK';
  var CF_BEACON_TOKEN = '2dd930756a5842fbaf5cff2da50eb637';
  var STORAGE_KEY = 'gt_consent_v1';

  // ============ CONSENT STATE ============
  function getConsent() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }
  function setConsent(val) {
    try { localStorage.setItem(STORAGE_KEY, val); } catch (e) {}
  }

  // ============ LOAD GA4 ON CONSENT ============
  function loadGA() {
    if (!GA4_ID) return;
    if (window._gaLoaded) return;
    window._gaLoaded = true;

    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_ID;
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA4_ID, {
      'anonymize_ip': true,
      'allow_google_signals': false,
      'allow_ad_personalization_signals': false
    });
  }

  // ============ LOAD CLOUDFLARE WEB ANALYTICS ON CONSENT ============
  function loadCloudflareAnalytics() {
    if (!CF_BEACON_TOKEN) return;
    if (window._cfLoaded) return;
    window._cfLoaded = true;

    var cf = document.createElement('script');
    cf.defer = true;
    cf.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    cf.setAttribute('data-cf-beacon', '{"token": "' + CF_BEACON_TOKEN + '"}');
    document.head.appendChild(cf);
  }

  // Single entry point for everything that requires consent, so a future tag
  // cannot be wired to one call site and missed at the other two.
  function loadConsentedAnalytics() {
    loadGA();
    loadCloudflareAnalytics();
  }

  // ============ CONSENT BANNER ============
  function showBanner() {
    if (document.getElementById('gt-consent')) return;
    var banner = document.createElement('div');
    banner.id = 'gt-consent';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Cookie consent');
    banner.innerHTML =
      '<div class="gt-consent-inner">' +
      '<div class="gt-consent-text">' +
      '<strong>We use cookies for analytics.</strong> ' +
      'We use Google Analytics to understand how visitors use our site. No personally identifying info is collected. ' +
      '<a href="/legal/privacy.html">Learn more</a>.' +
      '</div>' +
      '<div class="gt-consent-actions">' +
      '<button type="button" id="gt-consent-decline" class="gt-consent-btn-secondary">Decline</button>' +
      '<button type="button" id="gt-consent-accept" class="gt-consent-btn-primary">Accept</button>' +
      '</div>' +
      '</div>';
    document.body.appendChild(banner);

    document.getElementById('gt-consent-accept').addEventListener('click', function () {
      setConsent('accepted');
      loadConsentedAnalytics();
      banner.remove();
    });
    document.getElementById('gt-consent-decline').addEventListener('click', function () {
      setConsent('declined');
      banner.remove();
    });
  }

  // ============ INIT ============
  function init() {
    var consent = getConsent();
    if (consent === 'accepted') {
      loadConsentedAnalytics();
    } else if (consent === 'declined') {
      // do nothing
    } else {
      showBanner();
    }
  }

  // ============ PUBLIC API ============
  // Read current consent state (returns 'accepted' | 'declined' | null)
  window.gtConsentStatus = function () { return getConsent(); };

  // Accept consent programmatically (e.g., from privacy page button)
  window.gtConsentAccept = function () {
    setConsent('accepted');
    loadConsentedAnalytics();
    var existing = document.getElementById('gt-consent');
    if (existing) existing.remove();
    document.dispatchEvent(new CustomEvent('gt:consent-change', { detail: { status: 'accepted' } }));
    return false;
  };

  // Decline consent programmatically
  window.gtConsentDecline = function () {
    setConsent('declined');
    var existing = document.getElementById('gt-consent');
    if (existing) existing.remove();
    document.dispatchEvent(new CustomEvent('gt:consent-change', { detail: { status: 'declined' } }));
    return false;
  };

  // Reset consent (clears choice and shows the banner again)
  window.gtConsentReset = function () {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    var existing = document.getElementById('gt-consent');
    if (existing) existing.remove();
    showBanner();
    document.dispatchEvent(new CustomEvent('gt:consent-change', { detail: { status: null } }));
    return false;
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
