<?php

declare(strict_types=1);

function send_json($data, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
}

function read_json_body(): array {
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }
    // Remove possible UTF-8 BOM
    $raw = preg_replace('/^\xEF\xBB\xBF/', '', $raw);

    $decoded = json_decode($raw, true);
    if (is_array($decoded)) {
        return $decoded;
    }

    // Fallback: handle x-www-form-urlencoded bodies
    $parsed = [];
    parse_str($raw, $parsed);
    return is_array($parsed) ? $parsed : [];
}

function require_method(string $method): void {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== $method) {
        send_json(['error' => 'Method not allowed'], 405);
        exit;
    }
}

function cors(): void {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');

    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

function base64url_encode(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode(string $data): string {
    $remainder = strlen($data) % 4;
    if ($remainder) {
        $data .= str_repeat('=', 4 - $remainder);
    }
    return base64_decode(strtr($data, '-_', '+/')) ?: '';
}

function jwt_secret(): string {
    $secret = getenv('JWT_SECRET') ?: '';
    if ($secret === '') {
        $secret = 'change-me-in-production';
    }
    return $secret;
}

function jwt_encode(array $payload): string {
    $header = ['alg' => 'HS256', 'typ' => 'JWT'];
    $h = base64url_encode(json_encode($header));
    $p = base64url_encode(json_encode($payload));
    $data = $h . '.' . $p;
    $sig = hash_hmac('sha256', $data, jwt_secret(), true);
    return $data . '.' . base64url_encode($sig);
}

function jwt_decode(string $jwt): ?array {
    $parts = explode('.', $jwt);
    if (count($parts) !== 3) return null;
    [$h, $p, $s] = $parts;

    $data = $h . '.' . $p;
    $sig = base64url_decode($s);
    $expected = hash_hmac('sha256', $data, jwt_secret(), true);
    if (!hash_equals($expected, $sig)) return null;

    $payload = json_decode(base64url_decode($p), true);
    if (!is_array($payload)) return null;

    if (isset($payload['exp']) && is_numeric($payload['exp']) && time() > (int)$payload['exp']) {
        return null;
    }

    return $payload;
}

function bearer_token(): ?string {
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if (!is_string($auth) || $auth === '') return null;
    if (preg_match('/^Bearer\s+(.*)$/i', $auth, $m)) {
        $t = trim($m[1]);
        return $t !== '' ? $t : null;
    }
    return null;
}

function require_auth(): array {
    $token = bearer_token();
    if (!$token) {
        send_json(['error' => 'Unauthorized'], 401);
        exit;
    }
    $payload = jwt_decode($token);
    if (!$payload) {
        send_json(['error' => 'Unauthorized'], 401);
        exit;
    }
    return $payload;
}
