/**
 * SEM-GOV-001D-HOME1 — Home page interactions (static only).
 * EOPS-001-C13 adds a signed-in indicator for Stephen's Microsoft session
 * without changing the governed page layout or content structure.
 */
(function () {
  'use strict';

  var C13_TOKEN_KEY = 'c13_microsoft_access_token';
  var C13_EXPIRES_KEY = 'c13_microsoft_access_expires';
  var C13_END_SESSION =
    'https://skcsaicustomers.ciamlogin.com/64b3d112-8a25-4baa-b999-cd356268cd2e/oauth2/v2.0/logout';

  function qs(id) {
    return document.getElementById(id);
  }

  function bindMobileNav() {
    var toggle = qs('home-nav-toggle');
    var nav = qs('home-nav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('home-nav--open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  function bindSmoothAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (ev) {
        var id = link.getAttribute('href');
        if (!id || id === '#') return;
        var target = document.querySelector(id);
        if (!target) return;
        ev.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (history.replaceState) {
          history.replaceState(null, '', id);
        }
      });
    });
  }

  function bindBackToTop() {
    var btn = qs('back-to-top');
    if (!btn) return;

    function toggle() {
      if (window.scrollY > 320) {
        btn.hidden = false;
      } else {
        btn.hidden = true;
      }
    }

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    window.addEventListener('scroll', toggle, { passive: true });
    toggle();
  }

  function readMicrosoftToken() {
    try {
      var token = sessionStorage.getItem(C13_TOKEN_KEY);
      var expires = Number(sessionStorage.getItem(C13_EXPIRES_KEY) || 0);
      if (!token || !expires || Date.now() >= expires - 30000) {
        sessionStorage.removeItem(C13_TOKEN_KEY);
        sessionStorage.removeItem(C13_EXPIRES_KEY);
        return null;
      }
      return token;
    } catch (_err) {
      return null;
    }
  }

  function findLoginLink() {
    var nav = qs('home-nav');
    if (!nav) return null;
    return Array.from(nav.querySelectorAll('a')).find(function (link) {
      return String(link.getAttribute('href') || '') === 'login.html';
    }) || null;
  }

  async function applyMicrosoftHomeState() {
    var token = readMicrosoftToken();
    if (!token) return;

    var response;
    try {
      response = await fetch('/api/auth/me', {
        headers: { Authorization: 'Bearer ' + token },
        credentials: 'same-origin',
        cache: 'no-store'
      });
    } catch (_err) {
      return;
    }

    if (!response.ok) {
      try {
        sessionStorage.removeItem(C13_TOKEN_KEY);
        sessionStorage.removeItem(C13_EXPIRES_KEY);
      } catch (_err) {}
      return;
    }

    var link = findLoginLink();
    if (!link) return;

    link.textContent = 'Logout';
    link.href = '#';
    link.setAttribute('data-c13-auth-state', 'signed-in');
    link.addEventListener('click', function (event) {
      event.preventDefault();
      try {
        sessionStorage.removeItem(C13_TOKEN_KEY);
        sessionStorage.removeItem(C13_EXPIRES_KEY);
      } catch (_err) {}

      var params = new URLSearchParams({
        post_logout_redirect_uri: window.location.origin + '/login.html'
      });
      window.location.assign(C13_END_SESSION + '?' + params.toString());
    });
  }

  function init() {
    bindMobileNav();
    bindSmoothAnchors();
    bindBackToTop();
    applyMicrosoftHomeState().catch(function () {});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();