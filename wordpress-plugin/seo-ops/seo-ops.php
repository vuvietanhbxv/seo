<?php
/**
 * Plugin Name: SEO Ops
 * Description: Connect WordPress to SEO Ops for content sync, Site Kit analytics, Rank Math/Yoast SEO data, and MCP maintenance tools.
 * Version: 1.0.0
 * Author: SEO Ops
 * License: GPL-2.0-or-later
 * Requires at least: 6.0
 * Requires PHP: 7.4
 */

if (!defined('ABSPATH')) {
    exit;
}

define('SEO_OPS_VERSION', '1.0.0');
define('SEO_OPS_PLUGIN_FILE', __FILE__);
define('SEO_OPS_PLUGIN_DIR', plugin_dir_path(__FILE__));

if (!class_exists('SEO_Ops_Connector')) {
    require_once SEO_OPS_PLUGIN_DIR . 'includes/connector.php';
}

if (!function_exists('phmcp_activate')) {
    require_once SEO_OPS_PLUGIN_DIR . 'includes/mcp-bridge.php';
}

register_activation_hook(__FILE__, static function (): void {
    if (class_exists('SEO_Ops_Connector')) {
        SEO_Ops_Connector::activate();
    }
    if (function_exists('phmcp_activate')) {
        phmcp_activate();
    }
});

add_action('admin_menu', static function (): void {
    add_menu_page(
        'SEO Ops',
        'SEO Ops',
        'manage_options',
        'seo-ops',
        'seo_ops_render_dashboard',
        'dashicons-chart-line',
        58
    );
});

function seo_ops_render_dashboard(): void
{
    if (!current_user_can('manage_options')) {
        return;
    }

    $connector_options = get_option('seo_ops_connector_options', []);
    $mcp_token = get_option('phmcp_api_token');
    ?>
    <div class="wrap">
        <h1>SEO Ops <span style="font-size:14px;color:#666;">v<?php echo esc_html(SEO_OPS_VERSION); ?></span></h1>
        <p>Plugin này gộp kết nối SEO Ops, dữ liệu Rank Math/Yoast, Site Kit Analytics proxy và MCP bridge.</p>

        <h2>Kết nối SEO Ops App</h2>
        <table class="widefat striped" style="max-width:900px;">
            <tbody>
                <tr>
                    <th scope="row">Connector Endpoint</th>
                    <td><code><?php echo esc_html(rest_url('seo-ops/v1')); ?></code></td>
                </tr>
                <tr>
                    <th scope="row">API Key</th>
                    <td><code><?php echo esc_html((string) ($connector_options['api_key'] ?? 'Chưa tạo')); ?></code></td>
                </tr>
                <tr>
                    <th scope="row">MCP Endpoint</th>
                    <td><code><?php echo esc_html(rest_url('phaohoa-mcp/v1/mcp')); ?></code></td>
                </tr>
                <tr>
                    <th scope="row">MCP Bearer Token</th>
                    <td><code><?php echo esc_html((string) ($mcp_token ?: 'Chưa tạo')); ?></code></td>
                </tr>
            </tbody>
        </table>

        <p style="margin-top:16px;">
            <a class="button button-primary" href="<?php echo esc_url(admin_url('options-general.php?page=seo-ops-connector')); ?>">Cấu hình SEO Ops Connector</a>
            <a class="button" href="<?php echo esc_url(admin_url('options-general.php?page=phmcp-settings')); ?>">Cấu hình MCP Bridge</a>
        </p>

        <h2>REST Endpoints</h2>
        <ul style="list-style:disc;margin-left:24px;">
            <li><code><?php echo esc_html(rest_url('seo-ops/v1/site')); ?></code></li>
            <li><code><?php echo esc_html(rest_url('seo-ops/v1/posts')); ?></code></li>
            <li><code><?php echo esc_html(rest_url('seo-ops/v1/pages')); ?></code></li>
            <li><code><?php echo esc_html(rest_url('seo-ops/v1/analytics/report')); ?></code></li>
            <li><code><?php echo esc_html(rest_url('phaohoa-mcp/v1/mcp')); ?></code></li>
        </ul>
    </div>
    <?php
}
