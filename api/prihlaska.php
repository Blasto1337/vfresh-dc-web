<?php
/**
 * Přihláška z webového formuláře -> e-mail přes SMTP (Seznam Email Profi).
 *
 * Volá ho JS formuláře (POST, JSON) hned po uložení přihlášky do Supabase.
 * Přihlašovací údaje k SMTP jsou v api/config.php, který není v gitu:
 * vytváří ho GitHub Actions při nasazení z GitHub Secrets.
 * Vzor: api/config.example.php
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function respond(int $status, array $data): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(405, ['ok' => false, 'error' => 'method']);
}

$configFile = __DIR__ . '/config.php';
if (!is_file($configFile)) {
    error_log('prihlaska.php: chybí api/config.php');
    respond(500, ['ok' => false, 'error' => 'config']);
}
$cfg = require $configFile;

// Jen z našich webů (prohlížeč posílá Origin u fetch POST).
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && !in_array($origin, $cfg['origins'] ?? [], true)) {
    respond(403, ['ok' => false, 'error' => 'origin']);
}

$raw = file_get_contents('php://input', false, null, 0, 20000);
$in = json_decode($raw === false ? '' : $raw, true);
if (!is_array($in)) {
    respond(400, ['ok' => false, 'error' => 'format']);
}

// Ochrana proti robotům: vyplněné skryté pole nebo odeslání hned po načtení
// stránky. Robot dostane "ok", aby nezkoušel jinak; e-mail se nepošle.
if (trim((string)($in['website'] ?? '')) !== '') {
    respond(200, ['ok' => true]);
}
$elapsed = (int)($in['elapsed'] ?? 0);
if ($elapsed > 0 && $elapsed < 2500) {
    respond(200, ['ok' => true]);
}

function field(array $in, string $key, int $max, bool $oneLine = true): string
{
    $v = trim((string)($in[$key] ?? ''));
    if ($oneLine) {
        $v = preg_replace('/[\r\n\t]+/', ' ', $v) ?? '';
    } else {
        $v = str_replace(["\r\n", "\r"], "\n", $v);
    }
    $v = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $v) ?? '';
    return mb_substr($v, 0, $max);
}

$name     = field($in, 'name', 120);
$email    = field($in, 'email', 200);
$phone    = field($in, 'phone', 40);
$category = field($in, 'category', 120);
$message  = field($in, 'message', 5000, false);
$consent  = ($in['consent'] ?? false) === true;
$saved    = ($in['saved'] ?? false) === true;

if ($name === '' || $message === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(422, ['ok' => false, 'error' => 'fields']);
}
if (!$consent) {
    respond(422, ['ok' => false, 'error' => 'consent']);
}

// Limit: nejvýš 5 odeslání za hodinu z jedné IP adresy.
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rlFile = sys_get_temp_dir() . '/vik-prihlaska-' . sha1($ip . '|' . ($cfg['site'] ?? ''));
$now = time();
$hits = [];
if (is_file($rlFile)) {
    $hits = array_filter(
        array_map('intval', explode(',', (string)@file_get_contents($rlFile))),
        static fn(int $t) => $t > $now - 3600
    );
}
if (count($hits) >= 5) {
    respond(429, ['ok' => false, 'error' => 'limit']);
}
$hits[] = $now;
@file_put_contents($rlFile, implode(',', $hits), LOCK_EX);

// ------------------------------------------------------------ e-mail --
function mime_header(string $text): string
{
    return '=?UTF-8?B?' . base64_encode($text) . '?=';
}

$site = (string)($cfg['site'] ?? 'web');
$subject = 'Nová přihláška z webu: ' . ($category !== '' ? $category : $name);

$lines = [
    "Nová přihláška z webu {$site}",
    '',
    "Jméno:     {$name}",
    "E-mail:    {$email}",
    'Telefon:   ' . ($phone !== '' ? $phone : '(nevyplněno)'),
    'Aktivita:  ' . ($category !== '' ? $category : '(nevybráno)'),
    '',
    'Zpráva:',
    $message,
    '',
    '',
];
if ($saved) {
    $lines[] = 'Přihláška je uložená i v administraci: ' . ($cfg['admin_url'] ?? '');
} else {
    $lines[] = 'POZOR: do administrace se tuto přihlášku nepodařilo uložit, je jen v tomto e-mailu.';
}
$lines[] = "Na tento e-mail stačí odpovědět, odpověď půjde přímo na {$email}.";
$body = implode("\r\n", array_map(static fn($l) => str_replace("\n", "\r\n", $l), $lines));

$from = (string)$cfg['from'];
$fromDomain = substr(strrchr($from, '@') ?: '@localhost', 1);
$to = (array)$cfg['to'];

$headers = [
    'Date: ' . date('r'),
    // V kolonce Od je jméno zákazníka, adresa zůstává info@ (jinak by e-mail
    // neprošel ověřením SPF/DKIM). Odpověď jde přes Reply-To zákazníkovi.
    'From: ' . mime_header("{$name} (web)") . " <{$from}>",
    'To: ' . implode(', ', array_map(static fn($a) => "<{$a}>", $to)),
    'Reply-To: ' . mime_header($name) . " <{$email}>",
    'Subject: ' . mime_header($subject),
    'Message-ID: <' . bin2hex(random_bytes(12)) . "@{$fromDomain}>",
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
];
$data = implode("\r\n", $headers) . "\r\n\r\n" . rtrim(chunk_split(base64_encode($body), 76, "\r\n"));

try {
    smtp_send($cfg['smtp'], $from, $to, $data, $fromDomain);
} catch (Throwable $e) {
    error_log('prihlaska.php: SMTP chyba: ' . $e->getMessage());
    respond(502, ['ok' => false, 'error' => 'mail']);
}

respond(200, ['ok' => true]);

// -------------------------------------------------------------- SMTP --
/**
 * Minimální SMTP klient (SSL na 465 nebo STARTTLS na 587, AUTH LOGIN).
 * Bez knihoven, aby na hosting stačilo nahrát dva soubory.
 */
function smtp_send(array $c, string $from, array $to, string $data, string $helo): void
{
    $secure = $c['secure'] ?? 'ssl';
    $target = ($secure === 'ssl' ? 'ssl://' : 'tcp://') . $c['host'] . ':' . (int)$c['port'];
    $ctx = stream_context_create(['ssl' => ['verify_peer' => true, 'verify_peer_name' => true]]);
    $fp = @stream_socket_client($target, $errno, $errstr, 15, STREAM_CLIENT_CONNECT, $ctx);
    if (!$fp) {
        throw new RuntimeException("spojení s {$c['host']} selhalo: {$errstr} ({$errno})");
    }
    stream_set_timeout($fp, 20);

    $read = static function () use ($fp): string {
        $resp = '';
        while (($line = fgets($fp, 1024)) !== false) {
            $resp .= $line;
            if (strlen($line) < 4 || $line[3] === ' ') {
                break;
            }
        }
        return $resp;
    };
    $cmd = static function (?string $line, array $expect, string $label = '') use ($fp, $read): string {
        if ($line !== null) {
            fwrite($fp, $line . "\r\n");
        }
        $resp = $read();
        if (!in_array((int)substr($resp, 0, 3), $expect, true)) {
            throw new RuntimeException(($label !== '' ? $label : strtok((string)$line, ' ')) . ': ' . trim($resp));
        }
        return $resp;
    };

    try {
        $cmd(null, [220], 'uvítání');
        $cmd("EHLO {$helo}", [250]);
        if ($secure === 'tls') {
            $cmd('STARTTLS', [220]);
            if (!stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                throw new RuntimeException('STARTTLS selhalo');
            }
            $cmd("EHLO {$helo}", [250]);
        }
        if (($c['user'] ?? '') !== '') {
            $cmd('AUTH LOGIN', [334]);
            $cmd(base64_encode((string)$c['user']), [334], 'AUTH jméno');
            $cmd(base64_encode((string)$c['pass']), [235], 'AUTH heslo');
        }
        $cmd("MAIL FROM:<{$from}>", [250]);
        foreach ($to as $rcpt) {
            $cmd("RCPT TO:<{$rcpt}>", [250, 251]);
        }
        $cmd('DATA', [354]);
        $data = preg_replace('/^\./m', '..', $data);
        $cmd($data . "\r\n.", [250], 'odeslání');
        $cmd('QUIT', [221]);
    } finally {
        fclose($fp);
    }
}
