(function () {
    'use strict';

    const API_BASE = window.API_BASE_URL || window.location.origin;

    const feedEl = document.getElementById('uxFeedbackFeed');
    const formEl = document.getElementById('uxFeedbackForm');
    const statusEl = document.getElementById('uxFeedbackStatus');
    const loginHintEl = document.getElementById('uxFeedbackLoginHint');
    const nameInput = document.getElementById('uxFeedbackName');

    function starsHtml(rating) {
        const filled = Math.max(0, Math.min(5, Number(rating) || 0));
        let html = '';
        for (let i = 1; i <= 5; i += 1) {
            html += `<span class="ux-star${i <= filled ? ' is-filled' : ''}" aria-hidden="true">★</span>`;
        }
        return html;
    }

    function formatDate(value) {
        if (!value) return '';
        try {
            return new Date(value).toLocaleDateString('en-ZA', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (_err) {
            return '';
        }
    }

    function setStatus(message, type) {
        if (!statusEl) return;
        statusEl.textContent = message || '';
        statusEl.className = 'ux-feedback-status' + (type ? ' is-' + type : '');
        statusEl.style.display = message ? 'block' : 'none';
    }

    function renderFeed(items) {
        if (!feedEl) return;

        if (!Array.isArray(items) || items.length === 0) {
            feedEl.innerHTML = `
                <div class="ux-feedback-empty">
                    <p>No public feedback yet. Be the first to share your SKCS experience after approval.</p>
                </div>
            `;
            return;
        }

        feedEl.innerHTML = items.map(function (item) {
            return `
                <article class="ux-feedback-card">
                    <div class="ux-feedback-card-top">
                        <strong class="ux-feedback-name">${escapeHtml(item.display_name || 'SKCS User')}</strong>
                        <span class="ux-feedback-stars" aria-label="${item.rating} out of 5 stars">${starsHtml(item.rating)}</span>
                    </div>
                    <p class="ux-feedback-comment">${escapeHtml(item.comment || '')}</p>
                    <div class="ux-feedback-date">${formatDate(item.created_at)}</div>
                </article>
            `;
        }).join('');
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    async function loadPublicFeedback() {
        try {
            const response = await fetch(API_BASE + '/api/feedback/public', { cache: 'no-store' });
            if (!response.ok) throw new Error('Could not load feedback');
            const data = await response.json();
            renderFeed(data.feedback || []);
        } catch (err) {
            if (feedEl) {
                feedEl.innerHTML = '<div class="ux-feedback-empty"><p>Feedback wall is temporarily unavailable.</p></div>';
            }
            console.warn('[UX Feedback] load failed:', err.message);
        }
    }

    async function getAuthHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (!window.supabaseClient || !window.supabaseClient.auth) {
            return headers;
        }

        const result = await window.supabaseClient.auth.getSession();
        if (result?.error) {
            throw result.error;
        }

        const token = result?.data?.session?.access_token;
        if (token) {
            headers.Authorization = 'Bearer ' + token;
        }

        return headers;
    }

    async function updateFormAccess() {
        if (!formEl || !loginHintEl) return;

        let session = null;
        if (window.supabaseClient) {
            const result = await window.supabaseClient.auth.getSession();
            session = result?.data?.session || null;
        }

        const loggedIn = Boolean(session?.user);
        formEl.style.display = loggedIn ? 'block' : 'none';
        loginHintEl.style.display = loggedIn ? 'none' : 'block';

        if (loggedIn && nameInput) {
            const metaName = session.user.user_metadata?.first_name || session.user.email?.split('@')[0] || '';
            if (!nameInput.value && metaName) {
                nameInput.value = String(metaName).split(' ')[0];
            }
        }
    }

    async function submitFeedback(event) {
        event.preventDefault();
        setStatus('', '');

        const rating = Number(document.getElementById('uxFeedbackRating')?.value || 0);
        const comment = String(document.getElementById('uxFeedbackComment')?.value || '').trim();
        const displayName = String(nameInput?.value || '').trim();

        if (!rating || rating < 1 || rating > 5) {
            setStatus('Please choose a star rating.', 'error');
            return;
        }
        if (comment.length < 10) {
            setStatus('Please write at least 10 characters about your experience.', 'error');
            return;
        }

        try {
            const headers = await getAuthHeaders();
            if (!headers.Authorization) {
                setStatus('Please sign in before submitting feedback.', 'error');
                return;
            }

            const response = await fetch(API_BASE + '/api/feedback', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    rating: rating,
                    comment: comment,
                    display_name: displayName
                })
            });

            const data = await response.json().catch(function () { return {}; });
            if (!response.ok) {
                throw new Error(data.error || 'Submission failed');
            }

            if (formEl) formEl.reset();
            await updateFormAccess();
            setStatus(data.message || 'Feedback submitted for review.', 'success');
        } catch (err) {
            setStatus(err.message || 'Could not submit feedback.', 'error');
        }
    }

    function init() {
        if (!feedEl) return;

        loadPublicFeedback();
        updateFormAccess();

        if (formEl) {
            formEl.addEventListener('submit', submitFeedback);
        }

        if (window.supabaseClient && window.supabaseClient.auth.onAuthStateChange) {
            window.supabaseClient.auth.onAuthStateChange(function () {
                updateFormAccess();
            });
        } else {
            setTimeout(init, 200);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
