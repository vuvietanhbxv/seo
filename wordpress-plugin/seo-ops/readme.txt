=== SEO Ops ===
Contributors: seoops
Tags: seo, analytics, site-kit, rank-math, mcp, rest-api
Requires at least: 6.0
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later

SEO Ops connects WordPress to the SEO Ops web app and bundles an MCP bridge for controlled WordPress maintenance.

== Description ==

SEO Ops provides:

* SEO Ops Connector endpoints for posts, pages, Rank Math/Yoast metadata, Site Kit status, and Site Kit Analytics proxy.
* MCP bridge endpoint for authenticated maintenance tools.
* Admin screens for API key, allowed origin, Site Kit proxy user, and MCP Bearer token.

== Installation ==

1. Upload the `seo-ops` folder to `/wp-content/plugins/`, or zip this folder and upload it in WordPress Admin.
2. Activate **SEO Ops**.
3. Open **SEO Ops** in the WordPress admin sidebar.
4. Copy the Connector Endpoint and API Key into the SEO Ops web app.
5. If using the local SEO Ops app, set Allowed Origin to `http://127.0.0.1:5173`.

== REST Endpoints ==

SEO Ops Connector:

* `GET /wp-json/seo-ops/v1/site`
* `GET /wp-json/seo-ops/v1/posts`
* `GET /wp-json/seo-ops/v1/pages`
* `POST /wp-json/seo-ops/v1/analytics/report`

Send Connector requests with:

`X-SEO-OPS-KEY: your-api-key`

MCP Bridge:

* `/wp-json/phaohoa-mcp/v1/mcp`

Send MCP requests with:

`Authorization: Bearer your-mcp-token`

== Changelog ==

= 1.0.0 =
* Bundled SEO Ops Connector and MCP Bridge into one plugin named SEO Ops.
