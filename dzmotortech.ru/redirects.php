<?php
/**
 * Переадресация со старых адресов на новые.
 *
 * Подключается из .htaccess, когда запрошенного файла и папки нет.
 * Таблица лежит в redirects-map.php: ключ — путь запроса в раскодированном
 * виде, значение — новый адрес. Если адрес в таблице не найден, отдаём 404.
 *
 * Кириллицу в адресах приходится разбирать здесь, а не в .htaccess:
 * Apache кодирует знак процента повторно и адрес превращается в мусор.
 */

$uri   = $_SERVER['REQUEST_URI'] ?? '/';
$path  = parse_url($uri, PHP_URL_PATH);
$query = parse_url($uri, PHP_URL_QUERY);

$rules = require __DIR__ . '/redirects-map.php';

/** Ищет адрес в таблице: как есть, затем без учёта регистра. */
function find_target(array $rules, $path) {
    if ($path === null || $path === '') {
        return null;
    }
    $decoded = rawurldecode($path);
    if (isset($rules[$decoded])) {
        return $rules[$decoded];
    }
    // старые ссылки встречаются в другом регистре, чем имя файла
    static $lower = null;
    if ($lower === null) {
        $lower = [];
        foreach ($rules as $from => $to) {
            $lower[mb_strtolower($from, 'UTF-8')] = $to;
        }
    }
    $key = mb_strtolower($decoded, 'UTF-8');
    return $lower[$key] ?? null;
}

// у части старых адресов «?pagenum=N.html» — часть имени файла, а не запрос
$target = find_target($rules, $path);
if ($target === null && $query !== null) {
    $target = find_target($rules, $path . '?' . $query);
    if ($target !== null) {
        $query = null;
    }
}

if ($target !== null) {
    if ($query !== null && $query !== '') {
        $target .= (strpos($target, '?') === false ? '?' : '&') . $query;
    }
    header('Location: ' . $target, true, 301);
    header('Cache-Control: max-age=3600');
    exit;
}

http_response_code(404);
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Страница не найдена | ДЗМоторТех</title>
<style>
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
     font:16px/1.6 "Montserrat",-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#1d2530;background:#fff}
.wrap{max-width:520px;padding:32px 24px;text-align:center}
h1{margin:0 0 12px;font-size:28px}
p{margin:0 0 24px;color:#5a6472}
a{display:inline-block;margin:0 8px;padding:12px 22px;border-radius:6px;
  background:#c8102e;color:#fff;text-decoration:none}
a.alt{background:#eef1f5;color:#1d2530}
</style>
</head>
<body>
<div class="wrap">
<h1>Страница не найдена</h1>
<p>Возможно, адрес изменился или страницу удалили.</p>
<a href="/">На главную</a><a class="alt" href="/news/">В новости</a>
</div>
</body>
</html>
