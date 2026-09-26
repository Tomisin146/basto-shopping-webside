# Website analytics setup

The storefront includes opt-in Google Analytics 4 tracking for page visits, product views, add-to-cart actions, checkout starts, category navigation, and search usage. Search terms, customer details, and cart contents are not sent. Google Analytics may use browser cookies after a visitor accepts.

## Connect a GA4 property

1. Create a Google Analytics account/property and add a **Web** data stream for the website's public URL.
2. Copy the stream's Measurement ID. It starts with `G-`.
3. Paste the ID between the quotes in `analytics-config.js`.
4. Deploy the updated site. Visitors must accept analytics before the Google Analytics script loads. Visitors can later change their choice using **Privacy settings**.

Use **Reports → Realtime** to confirm visits. Events include `page_view`, `view_item`, `add_to_cart`, `begin_checkout`, `category_navigation`, and `search`. Local Live Server visits will also appear if analytics consent is accepted; use the deployed public website for production reporting.