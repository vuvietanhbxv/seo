<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$dbDir = realpath(__DIR__ . '/../db');
if ($dbDir === false) {
    $dbDir = __DIR__ . '/../db';
    mkdir($dbDir, 0775, true);
}

$dbPath = $dbDir . DIRECTORY_SEPARATOR . 'seo-ops-data.json';
$seedPath = __DIR__ . '/../seo-ops-seed.json';

function seo_ops_json_response(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function seo_ops_seed_data(string $dbPath, string $seedPath): void
{
    if (file_exists($dbPath)) {
        return;
    }

    $seed = file_exists($seedPath) ? json_decode((string) file_get_contents($seedPath), true) : null;
    $data = is_array($seed) && isset($seed['data']) ? $seed['data'] : $seed;
    if (!is_array($data)) {
        $data = [
            'projects' => [],
            'keywords' => [],
            'tasks' => [],
            'transactions' => [],
            'users' => [],
        ];
    }

    file_put_contents($dbPath, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX);
}

seo_ops_seed_data($dbPath, $seedPath);

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $raw = file_exists($dbPath) ? file_get_contents($dbPath) : '{}';
    $data = json_decode((string) $raw, true);
    if (!is_array($data)) {
        seo_ops_json_response(500, ['ok' => false, 'message' => 'Database JSON is invalid']);
    }
    seo_ops_json_response(200, ['ok' => true, 'data' => $data]);
}

if ($method === 'POST' || $method === 'PUT') {
    $raw = file_get_contents('php://input');
    $payload = json_decode((string) $raw, true);
    $data = is_array($payload) && isset($payload['data']) ? $payload['data'] : $payload;

    if (!is_array($data) || !isset($data['projects']) || !isset($data['users'])) {
        seo_ops_json_response(400, ['ok' => false, 'message' => 'Invalid SEO Ops data shape']);
    }

    $tmpPath = $dbPath . '.tmp';
    file_put_contents($tmpPath, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX);
    rename($tmpPath, $dbPath);
    seo_ops_json_response(200, ['ok' => true, 'savedAt' => gmdate('c')]);
}

seo_ops_json_response(405, ['ok' => false, 'message' => 'Method not allowed']);
