<?php
/**
 * Bundled Component: SEO Ops Connector
 * Description: Connects a WordPress site to SEO Ops for posts, pages, Rank Math/Yoast SEO data, Site Kit status, and analytics report proxying.
 * Version: 1.0.0
 * Author: SEO Ops
 * Requires at least: 6.0
 * Requires PHP: 7.4
 */

if (!defined('ABSPATH')) {
    exit;
}

final class SEO_Ops_Connector
{
    private const OPTION = 'seo_ops_connector_options';
    private const REST_NAMESPACE = 'seo-ops/v1';

    public static function boot(): void
    {
        add_action('admin_menu', [__CLASS__, 'admin_menu']);
        add_action('admin_init', [__CLASS__, 'register_settings']);
        add_action('rest_api_init', [__CLASS__, 'register_routes']);
        add_action('send_headers', [__CLASS__, 'cors']);
    }

    public static function activate(): void
    {
        $options = get_option(self::OPTION, []);
        if (empty($options['api_key'])) {
            $options['api_key'] = wp_generate_password(48, false, false);
        }
        if (empty($options['allowed_origin'])) {
            $options['allowed_origin'] = '';
        }
        if (empty($options['sitekit_user_id'])) {
            $options['sitekit_user_id'] = get_current_user_id();
        }
        update_option(self::OPTION, $options, false);
    }

    public static function admin_menu(): void
    {
        add_options_page(
            'SEO Ops Connector',
            'SEO Ops Connector',
            'manage_options',
            'seo-ops-connector',
            [__CLASS__, 'settings_page']
        );
    }

    public static function register_settings(): void
    {
        register_setting('seo_ops_connector', self::OPTION, [
            'type' => 'array',
            'sanitize_callback' => [__CLASS__, 'sanitize_options'],
            'default' => [],
        ]);
    }

    public static function sanitize_options($input): array
    {
        $current = get_option(self::OPTION, []);
        $input = is_array($input) ? $input : [];

        return [
            'api_key' => sanitize_text_field($input['api_key'] ?? $current['api_key'] ?? wp_generate_password(48, false, false)),
            'allowed_origin' => esc_url_raw($input['allowed_origin'] ?? ''),
            'sitekit_user_id' => absint($input['sitekit_user_id'] ?? get_current_user_id()),
        ];
    }

    public static function settings_page(): void
    {
        if (!current_user_can('manage_options')) {
            return;
        }
        $options = self::options();
        ?>
        <div class="wrap">
            <h1>SEO Ops Connector</h1>
            <p>Use these settings to connect this WordPress site with your SEO Ops app.</p>
            <form method="post" action="options.php">
                <?php settings_fields('seo_ops_connector'); ?>
                <table class="form-table" role="presentation">
                    <tr>
                        <th scope="row"><label for="seo-ops-api-key">API Key</label></th>
                        <td>
                            <input id="seo-ops-api-key" class="regular-text code" name="<?php echo esc_attr(self::OPTION); ?>[api_key]" value="<?php echo esc_attr($options['api_key']); ?>" />
                            <p class="description">SEO Ops must send this value in the <code>X-SEO-OPS-KEY</code> header.</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="seo-ops-origin">Allowed Origin</label></th>
                        <td>
                            <input id="seo-ops-origin" class="regular-text code" name="<?php echo esc_attr(self::OPTION); ?>[allowed_origin]" placeholder="https://seoops.example.com" value="<?php echo esc_attr($options['allowed_origin']); ?>" />
                            <p class="description">Optional. Leave empty during local testing. Example local origin: <code>http://127.0.0.1:5173</code>.</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="seo-ops-sitekit-user">Site Kit Proxy User ID</label></th>
                        <td>
                            <input id="seo-ops-sitekit-user" type="number" min="1" name="<?php echo esc_attr(self::OPTION); ?>[sitekit_user_id]" value="<?php echo esc_attr((string) $options['sitekit_user_id']); ?>" />
                            <p class="description">This administrator user is used only for server-side Site Kit report proxy requests after the API key is validated.</p>
                        </td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>
            <h2>Endpoints</h2>
            <ul>
                <li><code><?php echo esc_html(rest_url(self::REST_NAMESPACE . '/site')); ?></code></li>
                <li><code><?php echo esc_html(rest_url(self::REST_NAMESPACE . '/posts')); ?></code></li>
                <li><code><?php echo esc_html(rest_url(self::REST_NAMESPACE . '/pages')); ?></code></li>
                <li><code><?php echo esc_html(rest_url(self::REST_NAMESPACE . '/analytics/report')); ?></code></li>
            </ul>
        </div>
        <?php
    }

    public static function register_routes(): void
    {
        register_rest_route(self::REST_NAMESPACE, '/site', [
            'methods' => 'GET',
            'callback' => [__CLASS__, 'site'],
            'permission_callback' => [__CLASS__, 'permission'],
        ]);

        register_rest_route(self::REST_NAMESPACE, '/posts', [
            'methods' => 'GET',
            'callback' => [__CLASS__, 'posts'],
            'permission_callback' => [__CLASS__, 'permission'],
            'args' => self::content_args(),
        ]);

        register_rest_route(self::REST_NAMESPACE, '/pages', [
            'methods' => 'GET',
            'callback' => [__CLASS__, 'pages'],
            'permission_callback' => [__CLASS__, 'permission'],
            'args' => self::content_args(),
        ]);

        register_rest_route(self::REST_NAMESPACE, '/analytics/report', [
            'methods' => 'POST',
            'callback' => [__CLASS__, 'analytics_report'],
            'permission_callback' => [__CLASS__, 'permission'],
        ]);
    }

    public static function permission(WP_REST_Request $request)
    {
        self::cors();
        if ('OPTIONS' === $request->get_method()) {
            return true;
        }

        $options = self::options();
        $key = $request->get_header('x-seo-ops-key');
        if (!$key) {
            $key = (string) $request->get_param('seo_ops_key');
        }
        if (!$key || empty($options['api_key']) || !hash_equals((string) $options['api_key'], (string) $key)) {
            return new WP_Error('seo_ops_forbidden', 'Invalid SEO Ops API key.', ['status' => 403]);
        }

        return true;
    }

    public static function site(WP_REST_Request $request): WP_REST_Response
    {
        self::cors();
        $sitekit_active = self::is_plugin_active('google-site-kit/google-site-kit.php');
        $analytics_option = get_option('googlesitekit_analytics-4_settings', []);
        $search_console_option = get_option('googlesitekit_search-console_settings', []);

        return rest_ensure_response([
            'name' => get_bloginfo('name'),
            'url' => home_url('/'),
            'restUrl' => rest_url(self::REST_NAMESPACE),
            'wordpress' => get_bloginfo('version'),
            'siteKit' => [
                'active' => $sitekit_active,
                'analyticsConnected' => $sitekit_active && !empty($analytics_option),
                'searchConsoleConnected' => $sitekit_active && !empty($search_console_option),
                'propertyId' => self::public_option_value($analytics_option, ['propertyID', 'propertyId']),
                'measurementId' => self::public_option_value($analytics_option, ['measurementID', 'measurementId', 'webDataStreamID']),
            ],
            'counts' => [
                'posts' => (int) wp_count_posts('post')->publish,
                'pages' => (int) wp_count_posts('page')->publish,
            ],
        ]);
    }

    public static function posts(WP_REST_Request $request): WP_REST_Response
    {
        self::cors();
        return rest_ensure_response(self::content('post', $request));
    }

    public static function pages(WP_REST_Request $request): WP_REST_Response
    {
        self::cors();
        return rest_ensure_response(self::content('page', $request));
    }

    public static function analytics_report(WP_REST_Request $request): WP_REST_Response
    {
        self::cors();
        if (!self::is_plugin_active('google-site-kit/google-site-kit.php')) {
            return new WP_REST_Response([
                'ok' => false,
                'message' => 'Google Site Kit is not active on this WordPress site.',
                'rows' => [],
            ], 424);
        }

        $options = self::options();
        if (!empty($options['sitekit_user_id'])) {
            wp_set_current_user((int) $options['sitekit_user_id']);
        }

        $body = $request->get_json_params();
        $body = is_array($body) ? $body : [];
        $query = [
            'startDate' => sanitize_text_field($body['startDate'] ?? '28daysAgo'),
            'endDate' => sanitize_text_field($body['endDate'] ?? 'today'),
            'dimensions' => $body['dimensions'] ?? ['pagePath'],
            'metrics' => $body['metrics'] ?? ['totalUsers', 'sessions', 'screenPageViews', 'engagementRate'],
        ];
        if (!empty($body['url'])) {
            $query['dimensionFilters'] = [
                'pagePath' => sanitize_text_field((string) $body['url']),
            ];
        }

        $sitekit_request = new WP_REST_Request('GET', '/google-site-kit/v1/modules/analytics-4/data/report');
        $sitekit_request->set_query_params($query);
        $response = rest_do_request($sitekit_request);
        $data = $response instanceof WP_REST_Response ? $response->get_data() : $response;

        return rest_ensure_response([
            'ok' => !$response->is_error(),
            'source' => 'site-kit',
            'query' => $query,
            'rows' => self::normalize_analytics_rows($data),
            'raw' => $data,
        ]);
    }

    private static function content_args(): array
    {
        return [
            'per_page' => [
                'default' => 50,
                'sanitize_callback' => 'absint',
            ],
            'page' => [
                'default' => 1,
                'sanitize_callback' => 'absint',
            ],
            'search' => [
                'default' => '',
                'sanitize_callback' => 'sanitize_text_field',
            ],
        ];
    }

    private static function content(string $type, WP_REST_Request $request): array
    {
        $query = new WP_Query([
            'post_type' => $type,
            'post_status' => ['publish', 'draft', 'pending', 'future', 'private'],
            'posts_per_page' => min(max((int) $request->get_param('per_page'), 1), 100),
            'paged' => max((int) $request->get_param('page'), 1),
            's' => (string) $request->get_param('search'),
            'orderby' => 'modified',
            'order' => 'DESC',
        ]);

        $items = array_map(static function (WP_Post $post): array {
            return [
                'id' => $post->ID,
                'type' => $post->post_type,
                'title' => html_entity_decode(get_the_title($post), ENT_QUOTES, get_bloginfo('charset')),
                'url' => get_permalink($post),
                'path' => wp_parse_url(get_permalink($post), PHP_URL_PATH) ?: '/',
                'slug' => $post->post_name,
                'status' => $post->post_status,
                'author' => get_the_author_meta('display_name', (int) $post->post_author),
                'date' => get_the_date('c', $post),
                'modified' => get_the_modified_date('c', $post),
                'excerpt' => wp_strip_all_tags(get_the_excerpt($post)),
                'categories' => wp_get_post_terms($post->ID, 'category', ['fields' => 'names']),
                'tags' => wp_get_post_terms($post->ID, 'post_tag', ['fields' => 'names']),
                'seo' => self::seo_meta($post->ID),
            ];
        }, $query->posts);

        return [
            'items' => $items,
            'total' => (int) $query->found_posts,
            'pages' => (int) $query->max_num_pages,
        ];
    }

    private static function seo_meta(int $post_id): array
    {
        return [
            'yoastTitle' => (string) get_post_meta($post_id, '_yoast_wpseo_title', true),
            'yoastDescription' => (string) get_post_meta($post_id, '_yoast_wpseo_metadesc', true),
            'yoastFocusKeyword' => (string) get_post_meta($post_id, '_yoast_wpseo_focuskw', true),
            'rankMathTitle' => (string) get_post_meta($post_id, 'rank_math_title', true),
            'rankMathDescription' => (string) get_post_meta($post_id, 'rank_math_description', true),
            'rankMathFocusKeyword' => (string) get_post_meta($post_id, 'rank_math_focus_keyword', true),
            'canonical' => (string) (get_post_meta($post_id, '_yoast_wpseo_canonical', true) ?: get_post_meta($post_id, 'rank_math_canonical_url', true)),
        ];
    }

    private static function normalize_analytics_rows($data): array
    {
        if (!is_array($data)) {
            return [];
        }

        $rows = $data['rows'] ?? $data[0]['rows'] ?? [];
        if (!is_array($rows)) {
            return [];
        }

        return array_map(static function ($row): array {
            $dimensions = $row['dimensionValues'] ?? [];
            $metrics = $row['metricValues'] ?? [];
            return [
                'path' => $dimensions[0]['value'] ?? '',
                'activeUsers' => (int) ($metrics[0]['value'] ?? 0),
                'sessions' => (int) ($metrics[1]['value'] ?? 0),
                'pageViews' => (int) ($metrics[2]['value'] ?? 0),
                'engagementRate' => (float) ($metrics[3]['value'] ?? 0),
            ];
        }, $rows);
    }

    private static function public_option_value($option, array $keys): string
    {
        if (!is_array($option)) {
            return '';
        }
        foreach ($keys as $key) {
            if (!empty($option[$key]) && is_scalar($option[$key])) {
                return (string) $option[$key];
            }
        }
        return '';
    }

    private static function options(): array
    {
        $options = get_option(self::OPTION, []);
        return is_array($options) ? $options : [];
    }

    private static function is_plugin_active(string $plugin): bool
    {
        if (!function_exists('is_plugin_active')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }
        return is_plugin_active($plugin);
    }

    private static function cors(): void
    {
        if (headers_sent()) {
            return;
        }
        $origin = get_http_origin();
        $allowed = self::options()['allowed_origin'] ?? '';
        if ($origin && (!$allowed || $origin === $allowed)) {
            header('Access-Control-Allow-Origin: ' . esc_url_raw($origin));
            header('Vary: Origin');
        }
        header('Access-Control-Allow-Headers: X-SEO-OPS-KEY, X-Requested-With, Content-Type, Authorization');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    }
}

SEO_Ops_Connector::boot();
