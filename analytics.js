(() => {
    const measurementId = window.BASTO_GA_MEASUREMENT_ID;
    if (!/^G-[A-Z0-9]+$/.test(measurementId || '')) return;

    const consentKey = 'bastoAnalyticsConsent';
    let analyticsAllowed = false;
    let analyticsLoaded = false;

    const readConsent = () => {
        try {
            return localStorage.getItem(consentKey);
        } catch (error) {
            return null;
        }
    };

    const saveConsent = (value) => {
        try {
            localStorage.setItem(consentKey, value);
        } catch (error) {
            return;
        }
    };

    const loadAnalytics = () => {
        if (analyticsLoaded) return;
        window.dataLayer = window.dataLayer || [];
        window.gtag = function () {
            window.dataLayer.push(arguments);
        };
        window.gtag('js', new Date());
        window.gtag('config', measurementId, {
            anonymize_ip: true,
            allow_google_signals: false,
            allow_ad_personalization_signals: false
        });
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
        document.head.appendChild(script);
        analyticsLoaded = true;
    };

    const track = (eventName, parameters = {}) => {
        if (analyticsAllowed && analyticsLoaded) window.gtag('event', eventName, parameters);
    };

    const readPrice = (element) => Number(element?.textContent.replace(/[^0-9.]/g, '') || 0);
    const productDetails = (card) => {
        const itemName = card.querySelector('h3')?.textContent.trim() || 'Unknown product';
        const price = readPrice(card.querySelector('.clothing-details strong'));
        return {
            currency: 'NGN',
            value: price,
            items: [{
                item_name: itemName,
                item_category: card.closest('.clothing-section')?.id || 'collection',
                price,
                quantity: 1
            }]
        };
    };

    const banner = document.createElement('section');
    banner.className = 'analytics-consent';
    banner.hidden = true;
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Analytics privacy choice');
    banner.innerHTML = '<p>Allow Google Analytics cookies to help us measure store visits and shopping interactions. You can change this choice at any time.</p><div class="analytics-consent-actions"><button type="button" data-analytics-choice="reject">Reject</button><button type="button" data-analytics-choice="accept">Accept analytics</button></div>';

    const settingsButton = document.createElement('button');
    settingsButton.className = 'analytics-settings';
    settingsButton.type = 'button';
    settingsButton.textContent = 'Privacy settings';
    document.body.append(banner, settingsButton);

    const showConsent = () => {
        banner.hidden = false;
        settingsButton.hidden = true;
    };

    const hideConsent = () => {
        banner.hidden = true;
        settingsButton.hidden = false;
    };

    const clearAnalyticsCookies = () => {
        document.cookie.split(';').forEach((cookie) => {
            const name = cookie.split('=')[0].trim();
            if (name === '_ga' || name.startsWith('_ga_') || name === '_gid') {
                document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
            }
        });
    };

    banner.addEventListener('click', (event) => {
        const choice = event.target.closest('[data-analytics-choice]')?.dataset.analyticsChoice;
        if (!choice) return;
        const accepted = choice === 'accept';
        saveConsent(accepted ? 'accepted' : 'rejected');
        analyticsAllowed = accepted;
        if (accepted) loadAnalytics();
        else {
            if (analyticsLoaded) window.gtag('consent', 'update', { analytics_storage: 'denied' });
            clearAnalyticsCookies();
        }
        hideConsent();
    });

    settingsButton.addEventListener('click', showConsent);

    const previousConsent = readConsent();
    if (previousConsent === 'accepted') {
        analyticsAllowed = true;
        loadAnalytics();
    } else if (previousConsent !== 'rejected') {
        showConsent();
    }

    document.addEventListener('click', (event) => {
        const target = event.target instanceof Element ? event.target : null;
        if (!target) return;

        if (target.closest('#checkout-button')) {
            track('begin_checkout', { transport_type: 'beacon' });
            return;
        }

        if (target.closest('#modal-add-to-cart')) {
            const itemName = document.querySelector('#product-modal-title')?.textContent.trim() || 'Unknown product';
            const price = readPrice(document.querySelector('#product-modal-price'));
            track('add_to_cart', {
                currency: 'NGN',
                value: price,
                transport_type: 'beacon',
                items: [{ item_name: itemName, price, quantity: 1 }]
            });
            return;
        }

        const addButton = target.closest('.add-to-cart');
        if (addButton) {
            const card = addButton.closest('.clothing-card');
            if (!card) return;
            track(Number(card.dataset.stock || 1) > 1 ? 'view_item' : 'add_to_cart', productDetails(card));
            return;
        }

        const card = target.closest('.clothing-card');
        if (card) {
            track('view_item', productDetails(card));
            return;
        }

        const categoryLink = target.closest('.primary-navigation a[href^="#"]');
        if (categoryLink) track('category_navigation', { item_category: categoryLink.hash.slice(1) });
    }, true);

    document.addEventListener('submit', (event) => {
        if (event.target.matches('.search-bar')) {
            const searchLength = event.target.querySelector('input[type="search"]')?.value.trim().length || 0;
            track('search', { search_length: Math.min(searchLength, 100) });
        }
    }, true);
})();