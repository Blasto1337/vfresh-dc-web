<?php
// Dočasná diagnostika odchozích spojení (bez hesla, nic neposílá). Smazat po vyřešení.
header('Content-Type: application/json; charset=utf-8');
$out = ['php' => PHP_VERSION, 'dns' => gethostbynamel('smtp.seznam.cz') ?: null];
foreach ([['ssl://smtp.seznam.cz', 465], ['tcp://smtp.seznam.cz', 587], ['tcp://smtp.seznam.cz', 25], ['ssl://api.resend.com', 443]] as [$h, $p]) {
    $t = microtime(true);
    $fp = @stream_socket_client("$h:$p", $no, $err, 6);
    $out["$h:$p"] = $fp ? ['ok' => true, 'banner' => $p === 443 ? null : trim((string)fgets($fp, 200))] : ['ok' => false, 'err' => "$err ($no)"];
    $out["$h:$p"]['ms'] = (int)((microtime(true) - $t) * 1000);
    if ($fp) fclose($fp);
}
$dis = array_map('trim', explode(',', (string)ini_get('disable_functions')));
$out['mail()'] = function_exists('mail') && !in_array('mail', $dis, true);
$out['sendmail_path'] = ini_get('sendmail_path');
$out['disable_functions'] = ini_get('disable_functions');
echo json_encode($out, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
