// EOPS-001-C13 — Hybrid production authentication bridge.
// Stephen's proven account uses Microsoft Entra External ID.
// All other login/registration paths continue using the existing Supabase client.

(function () {
  'use strict';

  const SUPABASE_URL =
    window.SUPABASE_URL || 'https://ghzjntdvaptuxfpvhybb.supabase.co';
  const SUPABASE_ANON_KEY =
    window.SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoempudGR2YXB0dXhmcHZoeWJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNDAzNzIsImV4cCI6MjA4NzgxNjM3Mn0.nWxOY0lDIDDvexELk9De2aEfPfM5iJjoaW91tbL7YQk';

  const MICROSOFT_EMAIL = 'sfynn13433@gmail.com';
  const TENANT_ID = '64b3d112-8a25-4baa-b999-cd356268cd2e';
  const CLIENT_ID = 'a95e39bf-6d2c-469a-9f21-4eb3e404d988';
  const API_SCOPE =
    'api://a95e39bf-6d2c-469a-9f21-4eb3e404d988/access_as_user';
  const AUTHORITY_HOST = 'skcsaicustomers.ciamlogin.com';
  const AUTHORIZATION_ENDPOINT =
    'https://' +
    AUTHORITY_HOST +
    '/' +
    TENANT_ID +
    '/oauth2/v2.0/authorize';
  const TOKEN_ENDPOINT =
    'https://' + AUTHORITY_HOST + '/' + TENANT_ID + '/oauth2/v2.0/token';
  const END_SESSION_ENDPOINT =
    'https://' + AUTHORITY_HOST + '/' + TENANT_ID + '/oauth2/v2.0/logout';

  const TOKEN_KEY = 'c13_microsoft_access_token';
  const EXPIRES_KEY = 'c13_microsoft_access_expires';
  const STATE_KEY = 'c13_oauth_state';
  const VERIFIER_KEY = 'c13_pkce_verifier';
  const RETURN_KEY = 'c13_after_auth';

  let legacyClient = null;
  let hybridClient = null;
  const callbacks = new Set();

  function base64Url(bytes) {
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  }

  function randomValue(size) {
    const bytes = new Uint8Array(size);
    crypto.getRandomValues(bytes);
    return base64Url(bytes);
  }

  async function sha256Base64Url(value) {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return base64Url(new Uint8Array(digest));
  }

  function clearMicrosoftSession() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(EXPIRES_KEY);
  }

  function microsoftToken() {
    const token = sessionStorage.getItem(TOKEN_KEY);
    const expires = Number(sessionStorage.getItem(EXPIRES_KEY) || 0);
    if (!token || !expires || Date.now() >= expires - 30000) {
      clearMicrosoftSession();
      return null;
    }
    return token;
  }

  async function fetchMicrosoftProfile(token) {
    const response = await fetch('/api/auth/me', {
      method: 'GET',
      headers: { Authorization: 'Bearer ' + token },
      credentials: 'same-origin',
      cache: 'no-store'
    });
    if (!response.ok) {
      clearMicrosoftSession();
      return null;
    }
    return response.json();
  }

  function makeMicrosoftUser(me) {
    const profile = me?.profile || {};
    return {
      id: me?.linkage?.edge_profile_id || '',
      email: profile.email || MICROSOFT_EMAIL,
      user_metadata: {
        first_name: 'sfynn13433',
        identity_provider: 'microsoft-entra-external-id'
      },
      app_metadata: {
        provider: 'microsoft-entra-external-id',
        microsoft_object_id: me?.linkage?.microsoft_object_id || null
      },
      aud: 'authenticated',
      role: 'authenticated'
    };
  }

  async function currentMicrosoftSession() {
    const token = microsoftToken();
    if (!token) return null;

    const me = await fetchMicrosoftProfile(token);
    if (!me?.authenticated) return null;

    return {
      access_token: token,
      token_type: 'bearer',
      expires_at: Math.floor(
        Number(sessionStorage.getItem(EXPIRES_KEY) || 0) / 1000
      ),
      user: makeMicrosoftUser(me),
      c13_profile: me.profile,
      c13_linkage: me.linkage,
      c13_provider: 'microsoft-entra-external-id'
    };
  }

  function normalizedEmail(value) {
    return String(value || '').trim().toLowerCase();
  }

  function callbackUri() {
    return window.location.origin + '/login.html';
  }

  function destinationAfterAuth() {
    const params = new URLSearchParams(window.location.search);
    return (
      sessionStorage.getItem('skcs_after_auth') ||
      sessionStorage.getItem(RETURN_KEY) ||
      params.get('next') ||
      'index.html'
    );
  }

  async function beginMicrosoftAuth(emailHint) {
    const verifier = randomValue(64);
    const state = randomValue(32);
    const challenge = await sha256Base64Url(verifier);

    sessionStorage.setItem(VERIFIER_KEY, verifier);
    sessionStorage.setItem(STATE_KEY, state);
    sessionStorage.setItem(RETURN_KEY, destinationAfterAuth());

    document
      .querySelectorAll('input[type="password"]')
      .forEach((node) => {
        try {
          node.value = '';
        } catch (_) {}
      });

    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      response_type: 'code',
      redirect_uri: callbackUri(),
      response_mode: 'query',
      scope: 'openid profile email ' + API_SCOPE,
      code_challenge: challenge,
      code_challenge_method: 'S256',
      state
    });
    if (emailHint) params.set('login_hint', emailHint);

    window.location.assign(AUTHORIZATION_ENDPOINT + '?' + params.toString());
    return new Promise(function () {});
  }

  async function finishMicrosoftCallbackIfPresent() {
    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get('error');
    if (oauthError) {
      clearMicrosoftSession();
      const target =
        document.getElementById('loginMessage') ||
        document.getElementById('registerMessage');
      if (target) {
        target.className = 'message error';
        target.textContent =
          params.get('error_description') || 'Microsoft sign-in failed';
      }
      history.replaceState({}, document.title, window.location.pathname);
      return false;
    }

    const code = params.get('code');
    if (!code) return false;

    const state = params.get('state');
    const expectedState = sessionStorage.getItem(STATE_KEY);
    const verifier = sessionStorage.getItem(VERIFIER_KEY);
    if (!expectedState || state !== expectedState || !verifier) {
      clearMicrosoftSession();
      throw new Error(
        'Microsoft sign-in response did not match this browser session.'
      );
    }

    const body = new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'authorization_code',
      code,
      redirect_uri: callbackUri(),
      code_verifier: verifier,
      scope: 'openid profile email ' + API_SCOPE
    });

    const response = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body,
      cache: 'no-store'
    });
    const data = await response.json();
    if (!response.ok || typeof data.access_token !== 'string') {
      clearMicrosoftSession();
      throw new Error('Microsoft did not return a usable access token.');
    }

    sessionStorage.setItem(TOKEN_KEY, data.access_token);
    sessionStorage.setItem(
      EXPIRES_KEY,
      String(Date.now() + Number(data.expires_in || 0) * 1000)
    );
    sessionStorage.removeItem(STATE_KEY);
    sessionStorage.removeItem(VERIFIER_KEY);

    const session = await currentMicrosoftSession();
    if (!session) {
      clearMicrosoftSession();
      throw new Error(
        'Microsoft signed in, but the existing Edge account could not be resolved.'
      );
    }

    const destination =
      sessionStorage.getItem(RETURN_KEY) ||
      sessionStorage.getItem('skcs_after_auth') ||
      'index.html';
    sessionStorage.removeItem(RETURN_KEY);
    sessionStorage.removeItem('skcs_after_auth');

    history.replaceState({}, document.title, window.location.pathname);
    window.location.replace(destination);
    return true;
  }

  function notify(event, session) {
    for (const callback of callbacks) {
      try {
        callback(event, session);
      } catch (_) {}
    }
  }

  function createHybridClient(client) {
    const auth = {
      async getSession() {
        try {
          const microsoftSession = await currentMicrosoftSession();
          if (microsoftSession) {
            return { data: { session: microsoftSession }, error: null };
          }
        } catch (_) {
          clearMicrosoftSession();
        }
        return client.auth.getSession();
      },

      async getUser() {
        try {
          const microsoftSession = await currentMicrosoftSession();
          if (microsoftSession) {
            return {
              data: { user: microsoftSession.user },
              error: null
            };
          }
        } catch (_) {
          clearMicrosoftSession();
        }
        return client.auth.getUser();
      },

      async signInWithPassword(credentials) {
        const email = normalizedEmail(credentials?.email);
        if (email === MICROSOFT_EMAIL) {
          return beginMicrosoftAuth(email);
        }
        return client.auth.signInWithPassword(credentials);
      },

      async signUp(options) {
        return client.auth.signUp(options);
      },

      async signOut() {
        const hadMicrosoftSession = Boolean(microsoftToken());
        if (!hadMicrosoftSession) return client.auth.signOut();

        clearMicrosoftSession();
        notify('SIGNED_OUT', null);

        const params = new URLSearchParams({
          post_logout_redirect_uri:
            window.location.origin + '/login.html'
        });
        window.location.assign(
          END_SESSION_ENDPOINT + '?' + params.toString()
        );
        return new Promise(function () {});
      },

      onAuthStateChange(callback) {
        if (typeof callback === 'function') callbacks.add(callback);

        const legacySubscription = client.auth.onAuthStateChange(
          (event, session) => {
            if (!microsoftToken() && typeof callback === 'function') {
              callback(event, session);
            }
          }
        );

        Promise.resolve()
          .then(currentMicrosoftSession)
          .then((session) => {
            if (session && typeof callback === 'function') {
              callback('INITIAL_SESSION', session);
            }
          })
          .catch(function () {});

        return {
          data: {
            subscription: {
              unsubscribe() {
                callbacks.delete(callback);
                legacySubscription?.data?.subscription?.unsubscribe?.();
              }
            }
          }
        };
      },

      async refreshSession() {
        const microsoftSession = await currentMicrosoftSession();
        if (microsoftSession) {
          return {
            data: {
              session: microsoftSession,
              user: microsoftSession.user
            },
            error: null
          };
        }
        return client.auth.refreshSession();
      }
    };

    const proxy = new Proxy(client, {
      get(target, prop) {
        if (prop === 'auth') return auth;
        const value = Reflect.get(target, prop);
        return typeof value === 'function' ? value.bind(target) : value;
      }
    });

    window.legacySupabaseClient = client;
    window.supabaseClient = proxy;

    // A few legacy files call window.supabase.auth directly.
    if (window.supabase && typeof window.supabase === 'object') {
      window.supabase.auth = auth;
    }

    hybridClient = proxy;

    // Capture Stephen's login click before the legacy handler requires a password.
    const loginButton = document.getElementById('loginBtn');
    const loginEmail = document.getElementById('loginEmail');
    if (loginButton && loginEmail && !loginButton.dataset.c13MicrosoftBound) {
      loginButton.dataset.c13MicrosoftBound = '1';
      loginButton.addEventListener(
        'click',
        function (event) {
          if (normalizedEmail(loginEmail.value) !== MICROSOFT_EMAIL) return;
          event.preventDefault();
          event.stopImmediatePropagation();
          beginMicrosoftAuth(MICROSOFT_EMAIL).catch((error) => {
            const message = document.getElementById('loginMessage');
            if (message) {
              message.className = 'message error';
              message.textContent =
                error?.message || 'Microsoft sign-in failed';
            }
          });
        },
        true
      );
    }

    finishMicrosoftCallbackIfPresent().catch((error) => {
      console.error('[C13 Auth] Microsoft callback failed:', error);
      const message =
        document.getElementById('loginMessage') ||
        document.getElementById('registerMessage');
      if (message) {
        message.className = 'message error';
        message.textContent =
          error?.message || 'Microsoft sign-in failed';
      }
    });
  }

  function init() {
    const authConfig = {
      storage: window.localStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'skcs-auth'
    };

    if (window.supabase?.createClient) {
      legacyClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY,
        { auth: authConfig }
      );
      createHybridClient(legacyClient);
      console.log('[C13 Auth] Hybrid Microsoft/Supabase client ready');
      return;
    }

    let attempts = 0;
    const timer = setInterval(function () {
      attempts += 1;
      if (window.supabase?.createClient) {
        clearInterval(timer);
        legacyClient = window.supabase.createClient(
          SUPABASE_URL,
          SUPABASE_ANON_KEY,
          { auth: authConfig }
        );
        createHybridClient(legacyClient);
        console.log('[C13 Auth] Hybrid Microsoft/Supabase client ready');
        return;
      }
      if (attempts >= 50) {
        clearInterval(timer);
        console.error('[C13 Auth] Supabase library load timeout');
      }
    }, 100);
  }

  window.C13_AUTH = Object.freeze({
    targetEmail: MICROSOFT_EMAIL,
    tenantId: TENANT_ID,
    clientId: CLIENT_ID,
    scope: API_SCOPE,
    tokenKey: TOKEN_KEY,
    expiresKey: EXPIRES_KEY,
    endSessionEndpoint: END_SESSION_ENDPOINT
  });

  init();
})();
