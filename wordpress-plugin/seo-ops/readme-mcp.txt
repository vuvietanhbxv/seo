=== SEO Ops MCP Bridge ===
Contributors: phaohoabocongan
Tags: mcp, claude, claude-code, theme-editor, rest-api
Requires at least: 5.5
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later

Cau noi MCP (Model Context Protocol) duoc dong goi trong plugin SEO Ops - cho phep doc/sua code theme/plugin WordPress qua REST API co xac thuc Bearer token.

== Description ==

Plugin nay tao mot endpoint REST API tai `/wp-json/phaohoa-mcp/v1/mcp` tuong thich voi giao thuc MCP (JSON-RPC 2.0 over HTTP) de Claude Code co the:

* Doc/sua/tao/xoa file trong thu muc theme
* Liet ke themes, biet theme dang active
* Tu dong backup .bak-<timestamp> truoc moi thao tac ghi/xoa

== Cai dat ==

1. Upload thu muc `seo-ops` vao `/wp-content/plugins/`, HOAC zip thu muc nay va upload qua "Plugins -> Add New -> Upload Plugin".
2. Kich hoat plugin **SEO Ops**.
3. Vao **SEO Ops** hoac **Settings -> SEO Ops MCP** de lay endpoint URL va Bearer token.
4. Dan token vao file `.mcp.json` cua Claude Code.

== Bao mat ==

* Chi cho phep thao tac trong wp-content/themes/
* Chong path traversal
* Whitelist extension: php, css, js, json, html, scss, txt, md, svg, xml, yml, po, mo
* Bearer token random 48 ky tu hex, so sanh bang hash_equals
* Co the rotate token bat ky luc nao tu trang Settings

== Changelog ==

= 1.0.0 =
* Phien ban dau tien.
