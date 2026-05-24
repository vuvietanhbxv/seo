# SEO Ops Connector

WordPress plugin bridge for the SEO Ops app.

## Install

1. Copy `seo-ops-connector` to `wp-content/plugins/`.
2. Activate **SEO Ops Connector** in WordPress Admin.
3. Open `Settings -> SEO Ops Connector`.
4. Copy the generated API key into SEO Ops.
5. Set `Allowed Origin` to your SEO Ops origin, for example `http://127.0.0.1:5173` during local testing.

## REST Endpoints

Send the API key with:

```http
X-SEO-OPS-KEY: your-api-key
```

Endpoints:

```text
GET  /wp-json/seo-ops/v1/site
GET  /wp-json/seo-ops/v1/posts?per_page=50
GET  /wp-json/seo-ops/v1/pages?per_page=50
POST /wp-json/seo-ops/v1/analytics/report
```

`/analytics/report` proxies Google Site Kit's Analytics 4 report endpoint when Site Kit is active and connected. It returns normalized rows plus the raw Site Kit response so SEO Ops can evolve without changing the plugin.

The `posts` and `pages` endpoints include SEO metadata when available, including Rank Math focus keyword (`rank_math_focus_keyword`), Rank Math title/description, Yoast focus keyword, and Yoast title/description.

## Notes

- The plugin never returns the Site Kit OAuth token.
- The API key protects all connector endpoints.
- Use HTTPS in production.
- Site Kit internals may change, so keep Google Analytics Data API as the long-term backend option if you need stricter stability.
