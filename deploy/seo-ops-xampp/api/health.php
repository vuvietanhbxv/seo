<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$dbPath = realpath(__DIR__ . '/../db/seo-ops-data.json');

echo json_encode([
    'ok' => true,
    'storage' => 'php-json-db',
    'dbPath' => $dbPath ?: (__DIR__ . '/../db/seo-ops-data.json'),
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
