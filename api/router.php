<?php

declare(strict_types=1);

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

// If file exists in api/, serve it directly.
$file = __DIR__ . $path;
if ($path !== '/' && is_file($file)) {
    return false;
}

// Route all requests to the API front controller.
require __DIR__ . '/index.php';
