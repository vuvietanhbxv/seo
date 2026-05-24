<?php
/**
 * Bundled Component: SEO Ops MCP Bridge
 * Description: MCP bridge bundled with SEO Ops - read/edit theme and plugin files, manage post/page/media/option/menu through an authenticated REST API.
 * Version: 2.0.0
 * Author: phaohoabocongan.com
 * License: GPL-2.0-or-later
 * Requires PHP: 7.4
 */

if (!defined('ABSPATH')) { exit; }

define('PHMCP_VERSION', '2.0.0');
define('PHMCP_NAMESPACE', 'phaohoa-mcp/v1');
define('PHMCP_OPTION_TOKEN', 'phmcp_api_token');
define('PHMCP_SELF_BASENAME', defined('SEO_OPS_PLUGIN_FILE') ? plugin_basename(SEO_OPS_PLUGIN_FILE) : plugin_basename(__FILE__));

function phmcp_activate() {
    if (!get_option(PHMCP_OPTION_TOKEN)) {
        update_option(PHMCP_OPTION_TOKEN, phmcp_generate_token());
    }
}

function phmcp_generate_token() {
    return bin2hex(random_bytes(24));
}

add_action('rest_api_init', function () {
    register_rest_route(PHMCP_NAMESPACE, '/mcp', [
        'methods'             => ['POST', 'GET', 'OPTIONS'],
        'callback'            => 'phmcp_handle_mcp',
        'permission_callback' => '__return_true',
    ]);
});

function phmcp_handle_mcp(WP_REST_Request $request) {
    $method = $request->get_method();

    if ($method === 'OPTIONS') {
        return new WP_REST_Response(null, 204);
    }

    if (!phmcp_check_auth($request)) {
        return phmcp_json_error(null, -32001, 'Unauthorized: missing or invalid Bearer token', 401);
    }

    if ($method === 'GET') {
        return new WP_REST_Response([
            'name'    => 'SEO Ops MCP Bridge',
            'version' => PHMCP_VERSION,
            'status'  => 'ok',
        ], 200);
    }

    $body = $request->get_body();
    $data = json_decode($body, true);
    if (!is_array($data)) {
        return phmcp_json_error(null, -32700, 'Parse error', 400);
    }

    if (isset($data[0])) {
        $responses = [];
        foreach ($data as $req) {
            $resp = phmcp_dispatch($req);
            if ($resp !== null) { $responses[] = $resp; }
        }
        return new WP_REST_Response($responses, 200);
    }

    $resp = phmcp_dispatch($data);
    if ($resp === null) {
        return new WP_REST_Response(null, 204);
    }
    return new WP_REST_Response($resp, 200);
}

function phmcp_check_auth(WP_REST_Request $request) {
    $token = get_option(PHMCP_OPTION_TOKEN);
    if (empty($token)) { return false; }

    $header = $request->get_header('authorization');
    if (!$header) { $header = $request->get_header('Authorization'); }
    if (!$header && !empty($_SERVER['HTTP_AUTHORIZATION'])) {
        $header = $_SERVER['HTTP_AUTHORIZATION'];
    }
    if (!$header && !empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $header = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    }

    if (!$header || stripos($header, 'Bearer ') !== 0) {
        return false;
    }
    $provided = trim(substr($header, 7));
    return hash_equals($token, $provided);
}

function phmcp_dispatch($req) {
    $id     = isset($req['id']) ? $req['id'] : null;
    $method = isset($req['method']) ? $req['method'] : '';
    $params = isset($req['params']) ? $req['params'] : [];

    if (strpos($method, 'notifications/') === 0) { return null; }

    try {
        switch ($method) {
            case 'initialize':
                return phmcp_json_result($id, [
                    'protocolVersion' => '2024-11-05',
                    'capabilities'    => ['tools' => new stdClass()],
                    'serverInfo'      => ['name' => 'seo-ops-mcp-bridge', 'version' => PHMCP_VERSION],
                ]);
            case 'ping':
                return phmcp_json_result($id, new stdClass());
            case 'tools/list':
                return phmcp_json_result($id, ['tools' => phmcp_tools_schema()]);
            case 'tools/call':
                $name = isset($params['name']) ? $params['name'] : '';
                $args = isset($params['arguments']) ? $params['arguments'] : [];
                return phmcp_json_result($id, phmcp_call_tool($name, $args));
            default:
                return phmcp_json_error($id, -32601, "Method not found: $method");
        }
    } catch (Exception $e) {
        return phmcp_json_error($id, -32603, $e->getMessage());
    }
}

function phmcp_json_result($id, $result) {
    return ['jsonrpc' => '2.0', 'id' => $id, 'result' => $result];
}

function phmcp_json_error($id, $code, $message, $http_status = null) {
    $payload = ['jsonrpc' => '2.0', 'id' => $id, 'error' => ['code' => $code, 'message' => $message]];
    if ($http_status !== null) { return new WP_REST_Response($payload, $http_status); }
    return $payload;
}

function phmcp_tools_schema() {
    $obj = new stdClass();
    return [
        // ===== Site info =====
        ['name' => 'get_site_info', 'description' => 'Thông tin site: WP version, PHP, URL, active theme.',
         'inputSchema' => ['type' => 'object', 'properties' => $obj]],
        ['name' => 'get_wp_summary', 'description' => 'Tóm tắt: số post/page/comment/user, dung lượng uploads.',
         'inputSchema' => ['type' => 'object', 'properties' => $obj]],

        // ===== Theme =====
        ['name' => 'list_themes', 'description' => 'Liệt kê tất cả theme đã cài.',
         'inputSchema' => ['type' => 'object', 'properties' => $obj]],
        ['name' => 'get_active_theme', 'description' => 'Thông tin theme đang active.',
         'inputSchema' => ['type' => 'object', 'properties' => $obj]],
        ['name' => 'list_theme_files', 'description' => 'Liệt kê file/folder trong theme. Mặc định active theme.',
         'inputSchema' => ['type' => 'object', 'properties' => [
            'theme' => ['type' => 'string'], 'subdir' => ['type' => 'string'],
            'recursive' => ['type' => 'boolean'],
         ]]],
        ['name' => 'read_theme_file', 'description' => 'Đọc file trong theme.',
         'inputSchema' => ['type' => 'object', 'required' => ['path'],
            'properties' => ['theme' => ['type' => 'string'], 'path' => ['type' => 'string']]]],
        ['name' => 'write_theme_file', 'description' => 'Ghi đè file theme. Tự backup .bak-<timestamp>.',
         'inputSchema' => ['type' => 'object', 'required' => ['path', 'content'],
            'properties' => ['theme' => ['type' => 'string'], 'path' => ['type' => 'string'], 'content' => ['type' => 'string']]]],
        ['name' => 'create_theme_file', 'description' => 'Tạo file mới trong theme.',
         'inputSchema' => ['type' => 'object', 'required' => ['path'],
            'properties' => ['theme' => ['type' => 'string'], 'path' => ['type' => 'string'], 'content' => ['type' => 'string']]]],
        ['name' => 'delete_theme_file', 'description' => 'Xóa file theme (auto-backup trước).',
         'inputSchema' => ['type' => 'object', 'required' => ['path'],
            'properties' => ['theme' => ['type' => 'string'], 'path' => ['type' => 'string']]]],
        ['name' => 'list_backups', 'description' => 'Liệt kê file backup .bak-* (theme hoặc plugin).',
         'inputSchema' => ['type' => 'object', 'properties' => [
            'scope' => ['type' => 'string', 'enum' => ['theme', 'plugin']],
            'name' => ['type' => 'string', 'description' => 'theme slug hoặc plugin folder'],
         ]]],

        // ===== Plugin (level 3) =====
        ['name' => 'list_plugins', 'description' => 'Liệt kê plugin đã cài + trạng thái active.',
         'inputSchema' => ['type' => 'object', 'properties' => $obj]],
        ['name' => 'list_plugin_files', 'description' => 'Liệt kê file/folder trong plugin.',
         'inputSchema' => ['type' => 'object', 'required' => ['plugin'],
            'properties' => ['plugin' => ['type' => 'string'], 'subdir' => ['type' => 'string'], 'recursive' => ['type' => 'boolean']]]],
        ['name' => 'read_plugin_file', 'description' => 'Đọc file trong plugin.',
         'inputSchema' => ['type' => 'object', 'required' => ['plugin', 'path'],
            'properties' => ['plugin' => ['type' => 'string'], 'path' => ['type' => 'string']]]],
        ['name' => 'write_plugin_file', 'description' => 'Ghi đè file plugin (auto-backup). KHÔNG cho phép sửa chính plugin MCP Bridge.',
         'inputSchema' => ['type' => 'object', 'required' => ['plugin', 'path', 'content'],
            'properties' => ['plugin' => ['type' => 'string'], 'path' => ['type' => 'string'], 'content' => ['type' => 'string']]]],
        ['name' => 'create_plugin_file', 'description' => 'Tạo file mới trong plugin.',
         'inputSchema' => ['type' => 'object', 'required' => ['plugin', 'path'],
            'properties' => ['plugin' => ['type' => 'string'], 'path' => ['type' => 'string'], 'content' => ['type' => 'string']]]],
        ['name' => 'delete_plugin_file', 'description' => 'Xóa file plugin (auto-backup).',
         'inputSchema' => ['type' => 'object', 'required' => ['plugin', 'path'],
            'properties' => ['plugin' => ['type' => 'string'], 'path' => ['type' => 'string']]]],

        // ===== Post / Page (level 2) =====
        ['name' => 'list_posts', 'description' => 'Liệt kê post/page. status mặc định any, post_type mặc định post.',
         'inputSchema' => ['type' => 'object', 'properties' => [
            'post_type' => ['type' => 'string', 'description' => 'post | page | product | ...'],
            'status' => ['type' => 'string'],
            'search' => ['type' => 'string'],
            'per_page' => ['type' => 'integer'],
            'page' => ['type' => 'integer'],
         ]]],
        ['name' => 'get_post', 'description' => 'Lấy full content + meta của 1 post/page.',
         'inputSchema' => ['type' => 'object', 'required' => ['id'],
            'properties' => ['id' => ['type' => 'integer']]]],
        ['name' => 'create_post', 'description' => 'Tạo post/page mới.',
         'inputSchema' => ['type' => 'object', 'required' => ['title'],
            'properties' => [
                'title' => ['type' => 'string'], 'content' => ['type' => 'string'],
                'excerpt' => ['type' => 'string'], 'status' => ['type' => 'string'],
                'post_type' => ['type' => 'string'], 'slug' => ['type' => 'string'],
                'categories' => ['type' => 'array', 'items' => ['type' => 'integer']],
                'tags' => ['type' => 'array', 'items' => ['type' => 'string']],
                'featured_media' => ['type' => 'integer'],
            ]]],
        ['name' => 'update_post', 'description' => 'Cập nhật post. Chỉ field nào truyền vào mới đổi.',
         'inputSchema' => ['type' => 'object', 'required' => ['id'],
            'properties' => [
                'id' => ['type' => 'integer'], 'title' => ['type' => 'string'],
                'content' => ['type' => 'string'], 'excerpt' => ['type' => 'string'],
                'status' => ['type' => 'string'], 'slug' => ['type' => 'string'],
                'featured_media' => ['type' => 'integer'],
            ]]],
        ['name' => 'delete_post', 'description' => 'Xóa post (mặc định chuyển vào thùng rác).',
         'inputSchema' => ['type' => 'object', 'required' => ['id'],
            'properties' => ['id' => ['type' => 'integer'], 'force' => ['type' => 'boolean']]]],

        // ===== Media (level 2) =====
        ['name' => 'list_media', 'description' => 'Liệt kê file media library.',
         'inputSchema' => ['type' => 'object', 'properties' => [
            'search' => ['type' => 'string'], 'mime_type' => ['type' => 'string'],
            'per_page' => ['type' => 'integer'], 'page' => ['type' => 'integer'],
         ]]],
        ['name' => 'upload_media_from_url', 'description' => 'Tải file từ URL public và thêm vào media library.',
         'inputSchema' => ['type' => 'object', 'required' => ['url'],
            'properties' => ['url' => ['type' => 'string'], 'title' => ['type' => 'string'], 'alt' => ['type' => 'string']]]],
        ['name' => 'upload_media_base64', 'description' => 'Upload file qua base64 content.',
         'inputSchema' => ['type' => 'object', 'required' => ['filename', 'content_base64'],
            'properties' => [
                'filename' => ['type' => 'string'], 'content_base64' => ['type' => 'string'],
                'title' => ['type' => 'string'], 'alt' => ['type' => 'string'],
            ]]],
        ['name' => 'delete_media', 'description' => 'Xóa attachment khỏi media library.',
         'inputSchema' => ['type' => 'object', 'required' => ['id'],
            'properties' => ['id' => ['type' => 'integer'], 'force' => ['type' => 'boolean']]]],

        // ===== Options (level 2) =====
        ['name' => 'get_option', 'description' => 'Đọc 1 option. Bị chặn nếu là option nhạy cảm (secret, auth_key,...).',
         'inputSchema' => ['type' => 'object', 'required' => ['key'],
            'properties' => ['key' => ['type' => 'string']]]],
        ['name' => 'update_option', 'description' => 'Cập nhật 1 option. Chặn key nhạy cảm để bảo vệ site.',
         'inputSchema' => ['type' => 'object', 'required' => ['key', 'value'],
            'properties' => ['key' => ['type' => 'string'], 'value' => ['description' => 'string/number/bool/array/object đều được']]]],

        // ===== Menus (level 2) =====
        ['name' => 'list_menus', 'description' => 'Liệt kê tất cả menu.',
         'inputSchema' => ['type' => 'object', 'properties' => $obj]],
        ['name' => 'get_menu', 'description' => 'Chi tiết 1 menu + items.',
         'inputSchema' => ['type' => 'object', 'required' => ['id'],
            'properties' => ['id' => ['description' => 'Menu ID (int) hoặc slug (string)']]]],
    ];
}

function phmcp_call_tool($name, $args) {
    switch ($name) {
        // Site
        case 'get_site_info':         return phmcp_tool_result(phmcp_t_get_site_info());
        case 'get_wp_summary':        return phmcp_tool_result(phmcp_t_get_wp_summary());
        // Theme
        case 'list_themes':           return phmcp_tool_result(phmcp_t_list_themes());
        case 'get_active_theme':      return phmcp_tool_result(phmcp_t_get_active_theme());
        case 'list_theme_files':      return phmcp_tool_result(phmcp_t_list_theme_files($args));
        case 'read_theme_file':       return phmcp_tool_result(phmcp_t_read_theme_file($args));
        case 'write_theme_file':      return phmcp_tool_result(phmcp_t_write_theme_file($args));
        case 'create_theme_file':     return phmcp_tool_result(phmcp_t_create_theme_file($args));
        case 'delete_theme_file':     return phmcp_tool_result(phmcp_t_delete_theme_file($args));
        case 'list_backups':          return phmcp_tool_result(phmcp_t_list_backups($args));
        // Plugin
        case 'list_plugins':          return phmcp_tool_result(phmcp_t_list_plugins());
        case 'list_plugin_files':     return phmcp_tool_result(phmcp_t_list_plugin_files($args));
        case 'read_plugin_file':      return phmcp_tool_result(phmcp_t_read_plugin_file($args));
        case 'write_plugin_file':     return phmcp_tool_result(phmcp_t_write_plugin_file($args));
        case 'create_plugin_file':    return phmcp_tool_result(phmcp_t_create_plugin_file($args));
        case 'delete_plugin_file':    return phmcp_tool_result(phmcp_t_delete_plugin_file($args));
        // Post
        case 'list_posts':            return phmcp_tool_result(phmcp_t_list_posts($args));
        case 'get_post':              return phmcp_tool_result(phmcp_t_get_post($args));
        case 'create_post':           return phmcp_tool_result(phmcp_t_create_post($args));
        case 'update_post':           return phmcp_tool_result(phmcp_t_update_post($args));
        case 'delete_post':           return phmcp_tool_result(phmcp_t_delete_post($args));
        // Media
        case 'list_media':            return phmcp_tool_result(phmcp_t_list_media($args));
        case 'upload_media_from_url': return phmcp_tool_result(phmcp_t_upload_media_from_url($args));
        case 'upload_media_base64':   return phmcp_tool_result(phmcp_t_upload_media_base64($args));
        case 'delete_media':          return phmcp_tool_result(phmcp_t_delete_media($args));
        // Options
        case 'get_option':            return phmcp_tool_result(phmcp_t_get_option($args));
        case 'update_option':         return phmcp_tool_result(phmcp_t_update_option($args));
        // Menus
        case 'list_menus':            return phmcp_tool_result(phmcp_t_list_menus());
        case 'get_menu':              return phmcp_tool_result(phmcp_t_get_menu($args));
        default:
            return ['content' => [['type' => 'text', 'text' => "Unknown tool: $name"]], 'isError' => true];
    }
}

function phmcp_tool_result($payload) {
    $text = is_string($payload) ? $payload : json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    return ['content' => [['type' => 'text', 'text' => $text]]];
}

// ========== File safety ==========

function phmcp_allowed_extensions() {
    return ['php', 'css', 'js', 'json', 'html', 'htm', 'txt', 'md', 'scss', 'sass', 'less', 'svg', 'xml', 'yml', 'yaml', 'po', 'pot', 'mo'];
}

function phmcp_resolve_theme_root($theme_slug = '') {
    if (empty($theme_slug)) {
        $theme_slug = wp_get_theme()->get_stylesheet();
    }
    $themes_root = get_theme_root();
    $real = realpath($themes_root . DIRECTORY_SEPARATOR . $theme_slug);
    $themes_real = realpath($themes_root);
    if (!$real || strpos($real, $themes_real) !== 0) {
        throw new Exception("Theme không hợp lệ: $theme_slug");
    }
    return $real;
}

function phmcp_resolve_plugin_root($plugin_slug) {
    if (empty($plugin_slug)) {
        throw new Exception("Thiếu plugin slug (tên folder plugin)");
    }
    // Chặn sửa chính plugin MCP để tránh tự phá kết nối
    $self_dir = dirname(PHMCP_SELF_BASENAME);
    if ($self_dir !== '.' && $plugin_slug === $self_dir) {
        throw new Exception("Không cho phép sửa plugin MCP Bridge (tự bảo vệ kết nối)");
    }
    $plugins_root = WP_PLUGIN_DIR;
    $real = realpath($plugins_root . DIRECTORY_SEPARATOR . $plugin_slug);
    $plugins_real = realpath($plugins_root);
    if (!$real || strpos($real, $plugins_real) !== 0 || !is_dir($real)) {
        throw new Exception("Plugin không tồn tại hoặc không phải folder: $plugin_slug");
    }
    return $real;
}

function phmcp_resolve_safe_path($root, $rel_path, $must_exist = true) {
    $rel_path = ltrim(str_replace('\\', '/', $rel_path), '/');
    if ($rel_path === '' || strpos($rel_path, '..') !== false) {
        throw new Exception("Đường dẫn không hợp lệ: $rel_path");
    }
    $ext = strtolower(pathinfo($rel_path, PATHINFO_EXTENSION));
    if ($ext === '' || !in_array($ext, phmcp_allowed_extensions(), true)) {
        throw new Exception("Phần mở rộng không cho phép: .$ext");
    }
    $full = $root . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $rel_path);
    if ($must_exist) {
        $real = realpath($full);
        if (!$real || strpos($real, $root) !== 0) {
            throw new Exception("File không tồn tại hoặc nằm ngoài phạm vi: $rel_path");
        }
        return $real;
    }
    $parent = dirname($full);
    if (!is_dir($parent)) {
        if (!wp_mkdir_p($parent)) { throw new Exception("Không tạo được thư mục: $parent"); }
    }
    $real_parent = realpath($parent);
    if (!$real_parent || strpos($real_parent, $root) !== 0) {
        throw new Exception("Đường dẫn nằm ngoài phạm vi: $rel_path");
    }
    return $real_parent . DIRECTORY_SEPARATOR . basename($full);
}

function phmcp_backup_and_write($full_path, $content) {
    $backup = null;
    if (file_exists($full_path)) {
        $backup = $full_path . '.bak-' . gmdate('Ymd-His');
        if (!@copy($full_path, $backup)) { $backup = null; }
    }
    $bytes = file_put_contents($full_path, (string)$content);
    if ($bytes === false) { throw new Exception("Không ghi được file"); }
    return ['bytes' => $bytes, 'backup' => $backup ? basename($backup) : null];
}

// ========== Site tools ==========

function phmcp_t_get_site_info() {
    $theme = wp_get_theme();
    return [
        'site_url'    => get_site_url(),
        'home_url'    => get_home_url(),
        'wp_version'  => get_bloginfo('version'),
        'php_version' => PHP_VERSION,
        'active_theme' => [
            'slug' => $theme->get_stylesheet(), 'name' => $theme->get('Name'),
            'version' => $theme->get('Version'),
            'parent' => $theme->parent() ? $theme->parent()->get_stylesheet() : null,
        ],
        'themes_root' => get_theme_root(),
        'plugins_root' => WP_PLUGIN_DIR,
    ];
}

function phmcp_t_get_wp_summary() {
    $counts = [];
    foreach (['post', 'page'] as $pt) {
        $c = (array) wp_count_posts($pt);
        $counts[$pt] = $c;
    }
    $upload_dir = wp_upload_dir();
    $size = 0;
    if (is_dir($upload_dir['basedir'])) {
        $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($upload_dir['basedir'], RecursiveDirectoryIterator::SKIP_DOTS));
        foreach ($it as $f) { if ($f->isFile()) $size += $f->getSize(); }
    }
    return [
        'posts'    => $counts,
        'comments' => (array) wp_count_comments(),
        'users'    => count_users(),
        'uploads_size_bytes' => $size,
        'uploads_size_human' => size_format($size),
    ];
}

// ========== Theme tools ==========

function phmcp_t_list_themes() {
    $current = wp_get_theme()->get_stylesheet();
    $out = [];
    foreach (wp_get_themes() as $slug => $t) {
        $out[] = [
            'slug' => $slug, 'name' => $t->get('Name'), 'version' => $t->get('Version'),
            'active' => ($slug === $current),
            'parent' => $t->parent() ? $t->parent()->get_stylesheet() : null,
        ];
    }
    return $out;
}

function phmcp_t_get_active_theme() {
    $t = wp_get_theme();
    return [
        'slug' => $t->get_stylesheet(), 'name' => $t->get('Name'),
        'version' => $t->get('Version'), 'author' => $t->get('Author'),
        'description' => $t->get('Description'),
        'parent' => $t->parent() ? $t->parent()->get_stylesheet() : null,
        'path' => $t->get_stylesheet_directory(),
    ];
}

function phmcp_t_list_theme_files($args) {
    return phmcp_list_files_in_root(phmcp_resolve_theme_root($args['theme'] ?? ''), $args);
}

function phmcp_t_read_theme_file($args) {
    $root = phmcp_resolve_theme_root($args['theme'] ?? '');
    return phmcp_read_file_in_root($root, $args['path'] ?? '');
}

function phmcp_t_write_theme_file($args) {
    $root = phmcp_resolve_theme_root($args['theme'] ?? '');
    return phmcp_write_file_in_root($root, $args['path'] ?? '', $args['content'] ?? '');
}

function phmcp_t_create_theme_file($args) {
    $root = phmcp_resolve_theme_root($args['theme'] ?? '');
    return phmcp_create_file_in_root($root, $args['path'] ?? '', $args['content'] ?? '');
}

function phmcp_t_delete_theme_file($args) {
    $root = phmcp_resolve_theme_root($args['theme'] ?? '');
    return phmcp_delete_file_in_root($root, $args['path'] ?? '');
}

function phmcp_t_list_backups($args) {
    $scope = $args['scope'] ?? 'theme';
    $name = $args['name'] ?? '';
    $root = $scope === 'plugin' ? phmcp_resolve_plugin_root($name) : phmcp_resolve_theme_root($name);
    $out = [];
    $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root, RecursiveDirectoryIterator::SKIP_DOTS));
    foreach ($it as $f) {
        if ($f->isFile() && preg_match('/\.bak-\d{8}-\d{6}$/', $f->getFilename())) {
            $rel = ltrim(str_replace([$root, '\\'], ['', '/'], $f->getPathname()), '/');
            $out[] = ['path' => $rel, 'size' => $f->getSize(), 'mtime' => $f->getMTime()];
        }
    }
    return $out;
}

// Shared file helpers (used by both theme & plugin)
function phmcp_list_files_in_root($root, $args) {
    $subdir = isset($args['subdir']) ? trim((string)$args['subdir'], '/\\') : '';
    $recursive = !empty($args['recursive']);
    $base = $root;
    if ($subdir !== '') {
        if (strpos($subdir, '..') !== false) throw new Exception("Thư mục không hợp lệ");
        $base = $root . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $subdir);
        $real = realpath($base);
        if (!$real || strpos($real, $root) !== 0 || !is_dir($real)) {
            throw new Exception("Thư mục không tồn tại: $subdir");
        }
        $base = $real;
    }
    $out = [];
    if ($recursive) {
        $it = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($base, RecursiveDirectoryIterator::SKIP_DOTS),
            RecursiveIteratorIterator::SELF_FIRST
        );
        foreach ($it as $f) {
            $rel = ltrim(str_replace([$root, '\\'], ['', '/'], $f->getPathname()), '/');
            $out[] = ['path' => $rel, 'type' => $f->isDir() ? 'dir' : 'file', 'size' => $f->isFile() ? $f->getSize() : null];
        }
    } else {
        foreach (scandir($base) as $entry) {
            if ($entry === '.' || $entry === '..') continue;
            $full = $base . DIRECTORY_SEPARATOR . $entry;
            $rel = ltrim(str_replace([$root, '\\'], ['', '/'], $full), '/');
            $out[] = ['path' => $rel, 'type' => is_dir($full) ? 'dir' : 'file', 'size' => is_file($full) ? filesize($full) : null];
        }
    }
    return $out;
}

function phmcp_read_file_in_root($root, $path) {
    if ($path === '') throw new Exception('Thiếu tham số path');
    $full = phmcp_resolve_safe_path($root, $path, true);
    $content = file_get_contents($full);
    if ($content === false) throw new Exception("Không đọc được file: $path");
    return ['path' => $path, 'size' => strlen($content), 'content' => $content];
}

function phmcp_write_file_in_root($root, $path, $content) {
    if ($path === '') throw new Exception('Thiếu tham số path');
    $full = phmcp_resolve_safe_path($root, $path, false);
    $result = phmcp_backup_and_write($full, $content);
    return ['path' => $path, 'bytes' => $result['bytes'], 'backup' => $result['backup'], 'created' => $result['backup'] === null];
}

function phmcp_create_file_in_root($root, $path, $content) {
    if ($path === '') throw new Exception('Thiếu tham số path');
    $full = phmcp_resolve_safe_path($root, $path, false);
    if (file_exists($full)) throw new Exception("File đã tồn tại: $path");
    $bytes = file_put_contents($full, (string)$content);
    if ($bytes === false) throw new Exception("Không tạo được file: $path");
    return ['path' => $path, 'bytes' => $bytes, 'created' => true];
}

function phmcp_delete_file_in_root($root, $path) {
    if ($path === '') throw new Exception('Thiếu tham số path');
    $full = phmcp_resolve_safe_path($root, $path, true);
    $backup = $full . '.bak-' . gmdate('Ymd-His');
    if (!@copy($full, $backup)) { $backup = null; }
    if (!@unlink($full)) throw new Exception("Không xóa được file: $path");
    return ['path' => $path, 'deleted' => true, 'backup' => $backup ? basename($backup) : null];
}

// ========== Plugin tools ==========

function phmcp_t_list_plugins() {
    if (!function_exists('get_plugins')) {
        require_once ABSPATH . 'wp-admin/includes/plugin.php';
    }
    $active = (array) get_option('active_plugins', []);
    $out = [];
    foreach (get_plugins() as $file => $data) {
        $slug = strpos($file, '/') !== false ? dirname($file) : null;
        $out[] = [
            'file'    => $file,           // ví dụ "akismet/akismet.php"
            'slug'    => $slug,           // folder name; null nếu single-file plugin
            'name'    => $data['Name'],
            'version' => $data['Version'],
            'active'  => in_array($file, $active, true),
            'is_self' => ($file === PHMCP_SELF_BASENAME),
        ];
    }
    return $out;
}

function phmcp_t_list_plugin_files($args) {
    return phmcp_list_files_in_root(phmcp_resolve_plugin_root($args['plugin'] ?? ''), $args);
}

function phmcp_t_read_plugin_file($args) {
    return phmcp_read_file_in_root(phmcp_resolve_plugin_root($args['plugin'] ?? ''), $args['path'] ?? '');
}

function phmcp_t_write_plugin_file($args) {
    return phmcp_write_file_in_root(phmcp_resolve_plugin_root($args['plugin'] ?? ''), $args['path'] ?? '', $args['content'] ?? '');
}

function phmcp_t_create_plugin_file($args) {
    return phmcp_create_file_in_root(phmcp_resolve_plugin_root($args['plugin'] ?? ''), $args['path'] ?? '', $args['content'] ?? '');
}

function phmcp_t_delete_plugin_file($args) {
    return phmcp_delete_file_in_root(phmcp_resolve_plugin_root($args['plugin'] ?? ''), $args['path'] ?? '');
}

// ========== Post tools ==========

function phmcp_format_post($post) {
    if (!$post) return null;
    return [
        'id'        => $post->ID,
        'title'     => $post->post_title,
        'slug'      => $post->post_name,
        'status'    => $post->post_status,
        'type'      => $post->post_type,
        'author'    => (int)$post->post_author,
        'date'      => $post->post_date,
        'modified'  => $post->post_modified,
        'excerpt'   => $post->post_excerpt,
        'content'   => $post->post_content,
        'parent'    => (int)$post->post_parent,
        'link'      => get_permalink($post),
        'featured_media' => (int) get_post_thumbnail_id($post->ID),
        'meta'      => get_post_meta($post->ID),
    ];
}

function phmcp_t_list_posts($args) {
    $q = [
        'post_type'      => $args['post_type'] ?? 'post',
        'post_status'    => $args['status'] ?? 'any',
        'posts_per_page' => isset($args['per_page']) ? (int)$args['per_page'] : 20,
        'paged'          => isset($args['page']) ? (int)$args['page'] : 1,
    ];
    if (!empty($args['search'])) $q['s'] = $args['search'];
    $query = new WP_Query($q);
    $out = [];
    foreach ($query->posts as $p) {
        $out[] = [
            'id' => $p->ID, 'title' => $p->post_title, 'slug' => $p->post_name,
            'status' => $p->post_status, 'type' => $p->post_type,
            'date' => $p->post_date, 'link' => get_permalink($p),
        ];
    }
    return ['total' => $query->found_posts, 'pages' => $query->max_num_pages, 'items' => $out];
}

function phmcp_t_get_post($args) {
    $id = (int)($args['id'] ?? 0);
    if ($id <= 0) throw new Exception('Thiếu hoặc sai id');
    $post = get_post($id);
    if (!$post) throw new Exception("Không tìm thấy post id=$id");
    return phmcp_format_post($post);
}

function phmcp_t_create_post($args) {
    $data = [
        'post_title'   => $args['title'] ?? '',
        'post_content' => $args['content'] ?? '',
        'post_excerpt' => $args['excerpt'] ?? '',
        'post_status'  => $args['status'] ?? 'draft',
        'post_type'    => $args['post_type'] ?? 'post',
    ];
    if (!empty($args['slug'])) $data['post_name'] = $args['slug'];
    if (!empty($args['categories'])) $data['post_category'] = array_map('intval', $args['categories']);
    if (!empty($args['tags'])) $data['tags_input'] = $args['tags'];

    $id = wp_insert_post($data, true);
    if (is_wp_error($id)) throw new Exception($id->get_error_message());
    if (!empty($args['featured_media'])) set_post_thumbnail($id, (int)$args['featured_media']);
    return phmcp_format_post(get_post($id));
}

function phmcp_t_update_post($args) {
    $id = (int)($args['id'] ?? 0);
    if ($id <= 0) throw new Exception('Thiếu id');
    if (!get_post($id)) throw new Exception("Không tìm thấy post id=$id");

    $data = ['ID' => $id];
    foreach (['title' => 'post_title', 'content' => 'post_content', 'excerpt' => 'post_excerpt',
              'status' => 'post_status', 'slug' => 'post_name'] as $k => $wp_k) {
        if (array_key_exists($k, $args)) $data[$wp_k] = $args[$k];
    }
    $result = wp_update_post($data, true);
    if (is_wp_error($result)) throw new Exception($result->get_error_message());
    if (isset($args['featured_media'])) {
        $args['featured_media'] ? set_post_thumbnail($id, (int)$args['featured_media']) : delete_post_thumbnail($id);
    }
    return phmcp_format_post(get_post($id));
}

function phmcp_t_delete_post($args) {
    $id = (int)($args['id'] ?? 0);
    if ($id <= 0) throw new Exception('Thiếu id');
    $force = !empty($args['force']);
    $result = wp_delete_post($id, $force);
    if (!$result) throw new Exception("Không xóa được post id=$id");
    return ['id' => $id, 'deleted' => true, 'permanent' => $force];
}

// ========== Media tools ==========

function phmcp_format_attachment($id) {
    $post = get_post($id);
    if (!$post) return null;
    return [
        'id'        => $id,
        'title'     => $post->post_title,
        'mime_type' => $post->post_mime_type,
        'url'       => wp_get_attachment_url($id),
        'filename'  => basename(get_attached_file($id)),
        'alt'       => get_post_meta($id, '_wp_attachment_image_alt', true),
        'date'      => $post->post_date,
        'parent'    => (int)$post->post_parent,
    ];
}

function phmcp_t_list_media($args) {
    $q = [
        'post_type'      => 'attachment',
        'post_status'    => 'inherit',
        'posts_per_page' => isset($args['per_page']) ? (int)$args['per_page'] : 20,
        'paged'          => isset($args['page']) ? (int)$args['page'] : 1,
    ];
    if (!empty($args['search'])) $q['s'] = $args['search'];
    if (!empty($args['mime_type'])) $q['post_mime_type'] = $args['mime_type'];
    $query = new WP_Query($q);
    $out = [];
    foreach ($query->posts as $p) { $out[] = phmcp_format_attachment($p->ID); }
    return ['total' => $query->found_posts, 'pages' => $query->max_num_pages, 'items' => $out];
}

function phmcp_t_upload_media_from_url($args) {
    $url = $args['url'] ?? '';
    if (!$url) throw new Exception('Thiếu url');
    require_once ABSPATH . 'wp-admin/includes/file.php';
    require_once ABSPATH . 'wp-admin/includes/media.php';
    require_once ABSPATH . 'wp-admin/includes/image.php';

    $tmp = download_url($url, 60);
    if (is_wp_error($tmp)) throw new Exception($tmp->get_error_message());

    $filename = basename(parse_url($url, PHP_URL_PATH));
    $file = ['name' => $filename, 'tmp_name' => $tmp];
    $id = media_handle_sideload($file, 0, $args['title'] ?? null);
    if (is_wp_error($id)) {
        @unlink($tmp);
        throw new Exception($id->get_error_message());
    }
    if (!empty($args['alt'])) update_post_meta($id, '_wp_attachment_image_alt', sanitize_text_field($args['alt']));
    return phmcp_format_attachment($id);
}

function phmcp_t_upload_media_base64($args) {
    $filename = $args['filename'] ?? '';
    $b64 = $args['content_base64'] ?? '';
    if (!$filename || !$b64) throw new Exception('Thiếu filename hoặc content_base64');

    $data = base64_decode($b64, true);
    if ($data === false) throw new Exception('Base64 không hợp lệ');

    require_once ABSPATH . 'wp-admin/includes/file.php';
    require_once ABSPATH . 'wp-admin/includes/media.php';
    require_once ABSPATH . 'wp-admin/includes/image.php';

    $upload = wp_upload_bits(sanitize_file_name($filename), null, $data);
    if (!empty($upload['error'])) throw new Exception($upload['error']);

    $wp_filetype = wp_check_filetype($upload['file']);
    $attachment = [
        'post_mime_type' => $wp_filetype['type'],
        'post_title'     => $args['title'] ?? preg_replace('/\.[^.]+$/', '', basename($upload['file'])),
        'post_content'   => '',
        'post_status'    => 'inherit',
    ];
    $id = wp_insert_attachment($attachment, $upload['file']);
    if (is_wp_error($id)) throw new Exception($id->get_error_message());
    $meta = wp_generate_attachment_metadata($id, $upload['file']);
    wp_update_attachment_metadata($id, $meta);
    if (!empty($args['alt'])) update_post_meta($id, '_wp_attachment_image_alt', sanitize_text_field($args['alt']));
    return phmcp_format_attachment($id);
}

function phmcp_t_delete_media($args) {
    $id = (int)($args['id'] ?? 0);
    if ($id <= 0) throw new Exception('Thiếu id');
    $force = !empty($args['force']) ? true : true; // attachments mặc định xóa hẳn
    $result = wp_delete_attachment($id, $force);
    if (!$result) throw new Exception("Không xóa được attachment id=$id");
    return ['id' => $id, 'deleted' => true];
}

// ========== Option tools ==========

function phmcp_option_blocked($key) {
    $blocked_exact = [
        'siteurl', 'home', 'admin_email', 'template', 'stylesheet', 'current_theme',
        'active_plugins', 'users_can_register', 'default_role', 'db_version',
        'wp_user_roles', 'cron', 'rewrite_rules',
        PHMCP_OPTION_TOKEN,
    ];
    if (in_array($key, $blocked_exact, true)) return true;
    $blocked_prefix = ['auth_key', 'auth_salt', 'logged_in_key', 'logged_in_salt',
        'nonce_key', 'nonce_salt', 'secure_auth_key', 'secure_auth_salt',
        '_transient_', '_site_transient_', 'phmcp_'];
    foreach ($blocked_prefix as $p) {
        if (strpos($key, $p) === 0) return true;
    }
    return false;
}

function phmcp_t_get_option($args) {
    $key = $args['key'] ?? '';
    if (!$key) throw new Exception('Thiếu key');
    if (phmcp_option_blocked($key)) throw new Exception("Option bị chặn: $key");
    return ['key' => $key, 'value' => get_option($key, null)];
}

function phmcp_t_update_option($args) {
    $key = $args['key'] ?? '';
    if (!$key) throw new Exception('Thiếu key');
    if (phmcp_option_blocked($key)) throw new Exception("Option bị chặn: $key");
    if (!array_key_exists('value', $args)) throw new Exception('Thiếu value');
    $ok = update_option($key, $args['value']);
    return ['key' => $key, 'updated' => $ok, 'value' => get_option($key)];
}

// ========== Menu tools ==========

function phmcp_t_list_menus() {
    $menus = wp_get_nav_menus();
    $out = [];
    foreach ($menus as $m) {
        $out[] = [
            'id' => (int)$m->term_id, 'name' => $m->name, 'slug' => $m->slug,
            'count' => (int)$m->count,
        ];
    }
    return $out;
}

function phmcp_t_get_menu($args) {
    if (!isset($args['id'])) throw new Exception('Thiếu id');
    $menu = wp_get_nav_menu_object($args['id']);
    if (!$menu) throw new Exception("Không tìm thấy menu: {$args['id']}");
    $items = wp_get_nav_menu_items($menu->term_id);
    $out_items = [];
    if ($items) foreach ($items as $i) {
        $out_items[] = [
            'id' => (int)$i->ID, 'title' => $i->title, 'url' => $i->url,
            'parent' => (int)$i->menu_item_parent, 'order' => (int)$i->menu_order,
            'object' => $i->object, 'object_id' => (int)$i->object_id,
            'type' => $i->type,
        ];
    }
    return [
        'id' => (int)$menu->term_id, 'name' => $menu->name, 'slug' => $menu->slug,
        'items' => $out_items,
    ];
}

// ========== Admin page ==========

add_action('admin_menu', function () {
    add_options_page('SEO Ops MCP Bridge', 'SEO Ops MCP', 'manage_options', 'phmcp-settings', 'phmcp_render_settings');
});

add_action('admin_post_phmcp_rotate_token', function () {
    if (!current_user_can('manage_options')) wp_die('Forbidden');
    check_admin_referer('phmcp_rotate');
    update_option(PHMCP_OPTION_TOKEN, phmcp_generate_token());
    wp_redirect(admin_url('options-general.php?page=phmcp-settings&rotated=1'));
    exit;
});

function phmcp_render_settings() {
    if (!current_user_can('manage_options')) return;
    $token = get_option(PHMCP_OPTION_TOKEN);
    $endpoint = rest_url(PHMCP_NAMESPACE . '/mcp');
    $rotated = !empty($_GET['rotated']);
    ?>
    <div class="wrap">
        <h1>SEO Ops MCP Bridge <span style="font-size:14px;color:#666;">v<?php echo esc_html(PHMCP_VERSION); ?></span></h1>
        <?php if ($rotated): ?><div class="notice notice-success"><p>Đã tạo token mới.</p></div><?php endif; ?>

        <h2>Endpoint MCP</h2>
        <p><code style="background:#f0f0f1;padding:4px 8px;display:inline-block;"><?php echo esc_html($endpoint); ?></code></p>

        <h2>Bearer Token</h2>
        <p><input type="text" readonly value="<?php echo esc_attr($token); ?>" style="width:520px;font-family:monospace;" onclick="this.select()"></p>
        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="margin-bottom:24px;">
            <?php wp_nonce_field('phmcp_rotate'); ?>
            <input type="hidden" name="action" value="phmcp_rotate_token">
            <button type="submit" class="button button-secondary" onclick="return confirm('Tạo token mới sẽ làm Claude Code mất kết nối hiện tại. Tiếp tục?');">Tạo token mới</button>
        </form>

        <h2>Cấu hình .mcp.json</h2>
<pre style="background:#f0f0f1;padding:12px;overflow:auto;">{
  "mcpServers": {
    "phaohoa-wp": {
      "type": "http",
      "url": "<?php echo esc_html($endpoint); ?>",
      "headers": { "Authorization": "Bearer <?php echo esc_html($token); ?>" }
    }
  }
}</pre>

        <h2>Tools (<?php echo count(phmcp_tools_schema()); ?>)</h2>
        <table class="widefat striped" style="max-width:800px;">
            <thead><tr><th>Tool</th><th>Mô tả</th></tr></thead>
            <tbody>
            <?php foreach (phmcp_tools_schema() as $t): ?>
                <tr><td><code><?php echo esc_html($t['name']); ?></code></td><td><?php echo esc_html($t['description']); ?></td></tr>
            <?php endforeach; ?>
            </tbody>
        </table>

        <h2 style="margin-top:24px;">Bảo mật</h2>
        <ul style="list-style:disc;margin-left:24px;">
            <li>File: chỉ trong <code>wp-content/themes/</code> và <code>wp-content/plugins/</code>, whitelist extension, chống <code>..</code></li>
            <li>Auto-backup <code>.bak-&lt;timestamp&gt;</code> trước mọi thao tác ghi/xóa</li>
            <li><strong>Không cho phép sửa chính plugin MCP Bridge</strong> (chống tự phá kết nối)</li>
            <li>Options: chặn các key nhạy cảm (<code>siteurl, home, admin_email, active_plugins, auth_*, ...</code>)</li>
            <li>Bearer token random 48 hex, so sánh <code>hash_equals</code></li>
        </ul>
    </div>
    <?php
}
