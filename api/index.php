<?php

declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/util.php';

cors();

$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$uri = $uri ?: '/';

$base = '/api';
$pos = strrpos($uri, $base);
if ($pos !== false) {
    $path = substr($uri, $pos + strlen($base));
    $path = $path === '' ? '/' : $path;
} else {
    $path = $uri;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    route($method, $path);
} catch (Throwable $e) {
    send_json([
        'error' => 'Server error',
        'message' => $e->getMessage(),
    ], 500);
}

function route(string $method, string $path): void {
    if ($path === '/' || $path === '') {
        send_json(['ok' => true, 'service' => 'collis-api']);
        return;
    }

    if ($path === '/health') {
        send_json(['ok' => true]);
        return;
    }

    if ($path === '/auth/login' && $method === 'POST') {
        auth_login();
        return;
    }

    // Everything else requires authentication
    require_auth();

    if ($path === '/auth/me' && $method === 'GET') {
        auth_me();
        return;
    }

    if ($path === '/livreurs' && $method === 'GET') {
        list_livreurs();
        return;
    }

    if ($path === '/livreurs' && $method === 'POST') {
        create_livreur();
        return;
    }

    if (preg_match('#^/livreurs/([a-f0-9\-]{36})$#i', $path, $m)) {
        $id = $m[1];
        if ($method === 'GET') {
            get_livreur($id);
            return;
        }
        if ($method === 'PATCH' || $method === 'PUT') {
            update_livreur($id);
            return;
        }
        if ($method === 'DELETE') {
            delete_livreur($id);
            return;
        }
    }

    if ($path === '/colis' && $method === 'GET') {
        list_colis();
        return;
    }

    if ($path === '/colis' && $method === 'POST') {
        create_colis();
        return;
    }

    if (preg_match('#^/colis/([a-f0-9\-]{36})$#i', $path, $m)) {
        $id = $m[1];
        if ($method === 'GET') {
            get_colis($id);
            return;
        }
        if ($method === 'DELETE') {
            delete_colis($id);
            return;
        }
    }

    if (preg_match('#^/colis/([a-f0-9\-]{36})/assign$#i', $path, $m) && $method === 'POST') {
        assign_colis($m[1]);
        return;
    }

    if (preg_match('#^/colis/([a-f0-9\-]{36})/status$#i', $path, $m) && $method === 'POST') {
        update_colis_status($m[1]);
        return;
    }

    if (preg_match('#^/colis/([a-f0-9\-]{36})/historique$#i', $path, $m) && $method === 'GET') {
        get_colis_historique($m[1]);
        return;
    }

    send_json(['error' => 'Not found', 'path' => $path], 404);
}

function list_livreurs(): void {
    $stmt = db()->query('SELECT id, nom, telephone, statut, date_creation FROM livreur ORDER BY date_creation DESC');
    $rows = $stmt->fetchAll();

    $stmt2 = db()->query('SELECT livreur_id, GROUP_CONCAT(id) AS colis_ids, COUNT(*) AS nb_colis FROM colis WHERE livreur_id IS NOT NULL GROUP BY livreur_id');
    $byLivreur = [];
    foreach ($stmt2->fetchAll() as $c) {
        $ids = [];
        if (!empty($c['colis_ids'])) {
            $ids = array_values(array_filter(explode(',', (string)$c['colis_ids'])));
        }
        $byLivreur[$c['livreur_id']] = [
            'count' => (int)$c['nb_colis'],
            'ids' => $ids,
        ];
    }

    $data = array_map(function ($l) use ($byLivreur) {
        $meta = $byLivreur[$l['id']] ?? ['count' => 0, 'ids' => []];
        return [
            'id' => $l['id'],
            'nom' => $l['nom'],
            'telephone' => $l['telephone'],
            'statut' => $l['statut'],
            'dateCreation' => $l['date_creation'],
            'colisAssignesCount' => $meta['count'],
            'colisAssignes' => $meta['ids'],
        ];
    }, $rows);

    send_json($data);
}

function create_livreur(): void {
    $body = read_json_body();
    $id = $body['id'] ?? null;
    $nom = trim((string)($body['nom'] ?? ''));
    $telephone = trim((string)($body['telephone'] ?? ''));
    $statut = (string)($body['statut'] ?? 'actif');

    if ($id === null || !is_string($id) || $id === '') {
        $id = uuid_v4();
    }

    if ($nom === '' || $telephone === '' || ($statut !== 'actif' && $statut !== 'inactif')) {
        send_json(['error' => 'Invalid payload'], 400);
        return;
    }

    $stmt = db()->prepare('INSERT INTO livreur (id, nom, telephone, statut, date_creation) VALUES (?, ?, ?, ?, NOW())');
    $stmt->execute([$id, $nom, $telephone, $statut]);

    send_json(['id' => $id], 201);
}

function get_livreur(string $id): void {
    $stmt = db()->prepare('SELECT id, nom, telephone, statut, date_creation FROM livreur WHERE id = ?');
    $stmt->execute([$id]);
    $l = $stmt->fetch();
    if (!$l) {
        send_json(['error' => 'Not found'], 404);
        return;
    }

    $stmt2 = db()->prepare('SELECT id, numero_suivi, destinataire, statut, date_reception FROM colis WHERE livreur_id = ? ORDER BY date_reception DESC');
    $stmt2->execute([$id]);

    send_json([
        'id' => $l['id'],
        'nom' => $l['nom'],
        'telephone' => $l['telephone'],
        'statut' => $l['statut'],
        'dateCreation' => $l['date_creation'],
        'colis' => $stmt2->fetchAll(),
    ]);
}

function update_livreur(string $id): void {
    $body = read_json_body();

    $fields = [];
    $params = [];

    if (array_key_exists('nom', $body)) {
        $fields[] = 'nom = ?';
        $params[] = trim((string)$body['nom']);
    }
    if (array_key_exists('telephone', $body)) {
        $fields[] = 'telephone = ?';
        $params[] = trim((string)$body['telephone']);
    }
    if (array_key_exists('statut', $body)) {
        $statut = (string)$body['statut'];
        if ($statut !== 'actif' && $statut !== 'inactif') {
            send_json(['error' => 'Invalid statut'], 400);
            return;
        }
        $fields[] = 'statut = ?';
        $params[] = $statut;
    }

    if (!$fields) {
        send_json(['error' => 'No fields to update'], 400);
        return;
    }

    $params[] = $id;

    $sql = 'UPDATE livreur SET ' . implode(', ', $fields) . ' WHERE id = ?';
    $stmt = db()->prepare($sql);
    $stmt->execute($params);

    send_json(['ok' => true]);
}

function auth_login(): void {
    $body = read_json_body();

    $username = trim((string)($body['username'] ?? ''));
    $password = (string)($body['password'] ?? '');

    // Fallbacks for servers that don't decode JSON body as expected
    if ($username === '' && $password === '') {
        $username = trim((string)($_POST['username'] ?? ''));
        $password = (string)($_POST['password'] ?? '');
    }
    if ($username === '' && $password === '') {
        $raw = file_get_contents('php://input');
        if (is_string($raw) && trim($raw) !== '') {
            $parsed = [];
            parse_str($raw, $parsed);
            if (is_array($parsed)) {
                $username = trim((string)($parsed['username'] ?? ''));
                $password = (string)($parsed['password'] ?? '');
            }
        }
    }

    $password = trim($password);

    $adminUser = getenv('ADMIN_USER');
    $adminUser = is_string($adminUser) && trim($adminUser) !== '' ? trim($adminUser) : 'admin';

    $hash = getenv('ADMIN_PASS_HASH') ?: '';
    $plain = getenv('ADMIN_PASS') ?: 'admin123';
    $plain = is_string($plain) ? trim($plain) : 'admin123';

    $ok = false;
    if (strtolower($username) === strtolower($adminUser)) {
        if ($hash !== '') {
            $ok = password_verify($password, $hash);
        } else {
            $ok = hash_equals($plain, $password);
        }
    }

    if (!$ok) {
        send_json(['error' => 'Invalid credentials'], 401);
        return;
    }

    $now = time();
    $payload = [
        'sub' => $username,
        'role' => 'admin',
        'iat' => $now,
        'exp' => $now + (8 * 60 * 60),
    ];
    $token = jwt_encode($payload);
    send_json(['token' => $token]);
}

function auth_me(): void {
    $payload = require_auth();
    send_json([
        'user' => $payload['sub'] ?? null,
        'role' => $payload['role'] ?? null,
        'exp' => $payload['exp'] ?? null,
    ]);
}

function delete_livreur(string $id): void {
    $stmt = db()->prepare('DELETE FROM livreur WHERE id = ?');
    $stmt->execute([$id]);
    send_json(['ok' => true]);
}

function list_colis(): void {
    $sql = "SELECT c.id, c.numero_suivi, c.expediteur, c.destinataire, c.telephone, c.adresse, c.type, c.date_reception, c.statut, c.livreur_id,
                   l.nom AS livreur_nom, l.telephone AS livreur_telephone
            FROM colis c
            LEFT JOIN livreur l ON l.id = c.livreur_id
            ORDER BY c.date_reception DESC";

    $stmt = db()->query($sql);
    $rows = $stmt->fetchAll();

    $data = array_map(function ($c) {
        return [
            'id' => $c['id'],
            'numeroSuivi' => $c['numero_suivi'],
            'expediteur' => $c['expediteur'],
            'destinataire' => $c['destinataire'],
            'telephone' => $c['telephone'],
            'adresse' => $c['adresse'],
            'type' => $c['type'],
            'dateReception' => $c['date_reception'],
            'statut' => $c['statut'],
            'livreurId' => $c['livreur_id'],
            'livreur' => $c['livreur_id'] ? [
                'id' => $c['livreur_id'],
                'nom' => $c['livreur_nom'],
                'telephone' => $c['livreur_telephone'],
            ] : null,
        ];
    }, $rows);

    send_json($data);
}

function create_colis(): void {
    $body = read_json_body();

    $id = $body['id'] ?? null;
    $numero = trim((string)($body['numeroSuivi'] ?? ''));
    $expediteur = trim((string)($body['expediteur'] ?? ''));
    $destinataire = trim((string)($body['destinataire'] ?? ''));
    $telephone = trim((string)($body['telephone'] ?? ''));
    $adresse = trim((string)($body['adresse'] ?? ''));
    $type = (string)($body['type'] ?? 'client');

    if ($id === null || !is_string($id) || $id === '') {
        $id = uuid_v4();
    }

    if ($numero === '') {
        $numero = 'COL' . str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    }

    if ($expediteur === '' || $destinataire === '' || $telephone === '' || $adresse === '' || ($type !== 'client' && $type !== 'fournisseur')) {
        send_json(['error' => 'Invalid payload'], 400);
        return;
    }

    $stmt = db()->prepare('INSERT INTO colis (id, numero_suivi, expediteur, destinataire, telephone, adresse, type, date_reception, statut, livreur_id)
                           VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), \'recu\', NULL)');
    $stmt->execute([$id, $numero, $expediteur, $destinataire, $telephone, $adresse, $type]);

    $stmt2 = db()->prepare('INSERT INTO historique_colis (id, colis_id, statut, date_evt, commentaire, livreur_id)
                            VALUES (?, ?, \'recu\', NOW(), \'Colis reçu\', NULL)');
    $stmt2->execute([uuid_v4(), $id]);

    send_json(['id' => $id, 'numeroSuivi' => $numero], 201);
}

function get_colis(string $id): void {
    $stmt = db()->prepare('SELECT id, numero_suivi, expediteur, destinataire, telephone, adresse, type, date_reception, statut, livreur_id FROM colis WHERE id = ?');
    $stmt->execute([$id]);
    $c = $stmt->fetch();
    if (!$c) {
        send_json(['error' => 'Not found'], 404);
        return;
    }

    $hist = db()->prepare('SELECT id, colis_id, statut, date_evt, commentaire, livreur_id FROM historique_colis WHERE colis_id = ? ORDER BY date_evt ASC');
    $hist->execute([$id]);

    send_json([
        'id' => $c['id'],
        'numeroSuivi' => $c['numero_suivi'],
        'expediteur' => $c['expediteur'],
        'destinataire' => $c['destinataire'],
        'telephone' => $c['telephone'],
        'adresse' => $c['adresse'],
        'type' => $c['type'],
        'dateReception' => $c['date_reception'],
        'statut' => $c['statut'],
        'livreurId' => $c['livreur_id'],
        'historique' => $hist->fetchAll(),
    ]);
}

function delete_colis(string $id): void {
    $stmt = db()->prepare('DELETE FROM colis WHERE id = ?');
    $stmt->execute([$id]);
    send_json(['ok' => true]);
}

function assign_colis(string $colisId): void {
    $body = read_json_body();
    $livreurId = trim((string)($body['livreurId'] ?? ''));
    if ($livreurId === '') {
        send_json(['error' => 'livreurId is required'], 400);
        return;
    }

    $pdo = db();
    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare('UPDATE colis SET livreur_id = ?, statut = \'en_cours\' WHERE id = ?');
        $stmt->execute([$livreurId, $colisId]);

        $stmt2 = $pdo->prepare('INSERT INTO historique_colis (id, colis_id, statut, date_evt, commentaire, livreur_id)
                                VALUES (?, ?, \'en_cours\', NOW(), \'Colis assigné au livreur\', ?)');
        $stmt2->execute([uuid_v4(), $colisId, $livreurId]);

        $pdo->commit();
        send_json(['ok' => true]);
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function update_colis_status(string $colisId): void {
    $body = read_json_body();
    $statut = (string)($body['statut'] ?? '');
    $commentaire = array_key_exists('commentaire', $body) ? (string)$body['commentaire'] : null;
    $livreurId = array_key_exists('livreurId', $body) ? (string)$body['livreurId'] : null;

    $allowed = ['recu', 'en_cours', 'livre', 'echec', 'retourne'];
    if (!in_array($statut, $allowed, true)) {
        send_json(['error' => 'Invalid statut'], 400);
        return;
    }

    $pdo = db();
    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare('UPDATE colis SET statut = ?, livreur_id = COALESCE(?, livreur_id) WHERE id = ?');
        $stmt->execute([$statut, $livreurId, $colisId]);

        $stmt2 = $pdo->prepare('INSERT INTO historique_colis (id, colis_id, statut, date_evt, commentaire, livreur_id)
                                VALUES (?, ?, ?, NOW(), ?, ?)');
        $stmt2->execute([uuid_v4(), $colisId, $statut, $commentaire, $livreurId]);

        $pdo->commit();
        send_json(['ok' => true]);
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function get_colis_historique(string $colisId): void {
    $stmt = db()->prepare('SELECT h.id, h.colis_id, h.statut, h.date_evt, h.commentaire, h.livreur_id, l.nom AS livreur_nom
                           FROM historique_colis h
                           LEFT JOIN livreur l ON l.id = h.livreur_id
                           WHERE h.colis_id = ?
                           ORDER BY h.date_evt ASC');
    $stmt->execute([$colisId]);
    send_json($stmt->fetchAll());
}

function uuid_v4(): string {
    $data = random_bytes(16);
    $data[6] = chr((ord($data[6]) & 0x0f) | 0x40);
    $data[8] = chr((ord($data[8]) & 0x3f) | 0x80);
    $hex = bin2hex($data);
    return sprintf('%s-%s-%s-%s-%s',
        substr($hex, 0, 8),
        substr($hex, 8, 4),
        substr($hex, 12, 4),
        substr($hex, 16, 4),
        substr($hex, 20, 12)
    );
}
