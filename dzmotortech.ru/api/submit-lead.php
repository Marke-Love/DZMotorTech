<?php
declare(strict_types=1);

require __DIR__ . '/../inc/db.php';
require __DIR__ . '/../inc/helpers.php';
require __DIR__ . '/../inc/mailer.php';
require __DIR__ . '/../inc/telegram.php';

const MAX_FILES = 5;
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'pdf', 'doc', 'docx'];
const ALLOWED_MIME_TYPES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

// Посадочные страницы рекламных кампаний: по адресу страницы определяем
// направление заявки, чтобы в письме и админке было видно, откуда она.
const LEAD_DIRECTIONS = [
    '/zamena-dvigateley-abb-siemens' => 'Замена ABB и Siemens',
    '/vysokovoltnye-dvigateli-6-10-kv' => 'Высоковольтные двигатели 6 и 10 кВ',
    '/chastotnye-preobrazovateli' => 'Частотные преобразователи',
    '/en/abb-siemens-motor-replacement' => 'Замена ABB и Siemens (EN)',
    '/en/high-voltage-motors-6-10-kv' => 'Высоковольтные двигатели 6 и 10 кВ (EN)',
    '/en/variable-frequency-drives' => 'Частотные преобразователи (EN)',
];
const DEFAULT_DIRECTION = 'Общая форма сайта';
/** Заявка из формы на карточке товара — отдельное направление. */
const PRODUCT_DIRECTION = 'Карточка товара';
const PRODUCT_PAGE_PATTERN = '#^/(en/)?catalog/[^/]+/(?!index\.html$)[^/]+\.html$#';

/** Обрезает строку до $max символов, не ломая UTF-8. */
function clip(string $value, int $max): string
{
    $value = trim(str_replace(["\r", "\n", "\0"], ' ', $value));
    if (function_exists('mb_substr')) {
        return mb_substr($value, 0, $max, 'UTF-8');
    }
    return substr($value, 0, $max);
}

function post_str(string $key, int $max = 255): string
{
    return clip((string) ($_POST[$key] ?? ''), $max);
}

/** Схема и хост сайта без пути: https://dzmotortech.ru */
function site_root(): string
{
    $base = (string) (app_config()['site']['ru_base'] ?? '');
    $parts = parse_url($base);
    if (!$parts || empty($parts['host'])) {
        return rtrim($base, '/');
    }
    $root = ($parts['scheme'] ?? 'https') . '://' . $parts['host'];
    if (!empty($parts['port'])) {
        $root .= ':' . $parts['port'];
    }
    return $root;
}

/**
 * Куда вернуть посетителя после отправки. Принимаем только путь на этом же
 * сайте («/…»), иначе форму можно было бы использовать для перенаправления
 * на чужой адрес.
 */
function safe_return_path(string $raw): string
{
    $raw = trim($raw);
    if ($raw === '' || $raw[0] !== '/' || strpos($raw, '//') === 0 || strpos($raw, '\\') !== false) {
        return '';
    }
    if (preg_match('/[\x00-\x1F\x7F]/', $raw)) {
        return '';
    }
    return clip($raw, 300);
}

function result_redirect(string $lang, bool $ok, string $returnTo): void
{
    $flag = 'sent=' . ($ok ? '1' : '0');

    if ($returnTo !== '') {
        $hash = '';
        $hashPos = strpos($returnTo, '#');
        if ($hashPos !== false) {
            $hash = substr($returnTo, $hashPos);
            $returnTo = substr($returnTo, 0, $hashPos);
        }
        $glue = strpos($returnTo, '?') === false ? '?' : '&';
        redirect(site_root() . $returnTo . $glue . $flag . $hash);
    }

    $config = app_config();
    $base = $lang === 'en' ? $config['site']['en_base'] : $config['site']['ru_base'];
    redirect($base . '/contacts/?' . $flag);
}

/** Путь страницы без домена: для письма и админки достаточно «/страница/?метки». */
function page_path(string $raw): string
{
    $raw = clip($raw, 500);
    if ($raw === '') {
        return '';
    }
    $parts = parse_url($raw);
    if ($parts === false) {
        return '';
    }
    $path = $parts['path'] ?? '/';
    if (isset($parts['query']) && $parts['query'] !== '') {
        $path .= '?' . $parts['query'];
    }
    return clip($path, 500);
}

function detect_direction(string $formPage, string $landingPage, string $explicit): string
{
    foreach ([$formPage, $landingPage] as $page) {
        foreach (LEAD_DIRECTIONS as $prefix => $label) {
            if ($page !== '' && strpos($page, $prefix) === 0) {
                return $label;
            }
        }
    }
    foreach ([$formPage, $landingPage] as $page) {
        $path = (string) parse_url($page, PHP_URL_PATH);
        if ($path !== '' && preg_match(PRODUCT_PAGE_PATTERN, $path)) {
            return PRODUCT_DIRECTION;
        }
    }
    return $explicit !== '' ? $explicit : DEFAULT_DIRECTION;
}

/** Есть ли в таблице колонки источника (миграция 2026-09-16 выполнена). */
function leads_has_source_columns(PDO $pdo): bool
{
    try {
        $stmt = $pdo->query("SHOW COLUMNS FROM leads LIKE 'utm_source'");
        return $stmt !== false && $stmt->fetch() !== false;
    } catch (Throwable $e) {
        return false;
    }
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit('Method not allowed');
}

$lang = ($_POST['lang'] ?? 'ru') === 'en' ? 'en' : 'ru';
$returnTo = safe_return_path((string) ($_POST['return_to'] ?? ''));

// Honeypot: real users never fill this hidden field. Pretend success to bots.
if (!empty($_POST['website'])) {
    result_redirect($lang, true, $returnTo);
}

$name = post_str('txt_name');
$company = post_str('txt_company');
$phone = post_str('txt_tele', 64);
$email = post_str('txt_email');
$taskType = post_str('txt_task_type');
$power = post_str('txt_power');
$message = trim((string) ($_POST['message'] ?? ''));
$consent = isset($_POST['privacy_consent']);

// На посадочных страницах одно поле «Телефон или email»: раскладываем его
// по нужной колонке по наличию «@».
$contact = post_str('txt_contact');
if ($contact !== '') {
    if (strpos($contact, '@') !== false) {
        if ($email === '') {
            $email = $contact;
        }
    } elseif ($phone === '') {
        $phone = clip($contact, 64);
    }
}

// Обязательны имя, согласие и хотя бы один способ связи.
if ($name === '' || !$consent || ($phone === '' && $email === '')) {
    result_redirect($lang, false, $returnTo);
}
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    result_redirect($lang, false, $returnTo);
}
if ($phone !== '' && preg_match_all('/\d/', $phone) < 5) {
    result_redirect($lang, false, $returnTo);
}

// --- Источник заявки ---
$source = [
    'utm_source' => post_str('utm_source'),
    'utm_medium' => post_str('utm_medium'),
    'utm_campaign' => post_str('utm_campaign'),
    'utm_content' => post_str('utm_content'),
    'utm_term' => post_str('utm_term'),
    'yclid' => (string) preg_replace('/[^A-Za-z0-9_\-]/', '', post_str('yclid', 64)),
    'landing_page' => page_path((string) ($_POST['landing_page'] ?? '')),
    'form_page' => page_path((string) ($_POST['form_page'] ?? '')),
];
$direction = detect_direction($source['form_page'], $source['landing_page'], post_str('lead_direction'));

// --- Save attachments (if any) ---
$savedAttachments = [];
$uploadedFiles = $_FILES['attachments'] ?? null;

if ($uploadedFiles && isset($uploadedFiles['error']) && is_array($uploadedFiles['error'])) {
    $fileCount = count($uploadedFiles['error']);
    $finfo = new finfo(FILEINFO_MIME_TYPE);

    for ($i = 0; $i < $fileCount && $i < MAX_FILES; $i++) {
        if ($uploadedFiles['error'][$i] === UPLOAD_ERR_NO_FILE) {
            continue;
        }
        if ($uploadedFiles['error'][$i] !== UPLOAD_ERR_OK) {
            continue; // skip individual failed uploads rather than failing the whole lead
        }
        $tmpPath = $uploadedFiles['tmp_name'][$i];
        $size = (int) $uploadedFiles['size'][$i];
        $originalName = (string) $uploadedFiles['name'][$i];

        if ($size <= 0 || $size > MAX_FILE_BYTES) {
            continue;
        }
        $ext = strtolower((string) pathinfo($originalName, PATHINFO_EXTENSION));
        if (!in_array($ext, ALLOWED_EXTENSIONS, true)) {
            continue;
        }
        $mime = $finfo->file($tmpPath) ?: '';
        if (!in_array($mime, ALLOWED_MIME_TYPES, true)) {
            continue;
        }

        $storedName = bin2hex(random_bytes(16)) . '.' . $ext;
        $savedAttachments[] = [
            'original' => $originalName,
            'stored' => $storedName,
            'tmp' => $tmpPath,
        ];
    }
}

// --- Insert lead first to get an id, then move files into leads_uploads/{id}/ ---
$pdo = get_pdo();

// Телефон и email в таблице объявлены NOT NULL: пустой способ связи пишем
// пустой строкой, а не NULL, — так работает и старая, и новая схема.
$baseRow = [
    'lang' => $lang,
    'name' => $name,
    'company' => $company !== '' ? $company : null,
    'phone' => $phone,
    'email' => $email,
    'task_type' => $taskType !== '' ? $taskType : null,
    'power' => $power !== '' ? $power : null,
    'message' => $message,
    'attachments' => '[]',
    'ip' => $_SERVER['REMOTE_ADDR'] ?? null,
];

if (leads_has_source_columns($pdo)) {
    $stmt = $pdo->prepare(
        'INSERT INTO leads (lang, name, company, phone, email, task_type, power, message, attachments, ip,
                            direction, utm_source, utm_medium, utm_campaign, utm_content, utm_term, yclid,
                            landing_page, form_page)
         VALUES (:lang, :name, :company, :phone, :email, :task_type, :power, :message, :attachments, :ip,
                 :direction, :utm_source, :utm_medium, :utm_campaign, :utm_content, :utm_term, :yclid,
                 :landing_page, :form_page)'
    );
    $row = $baseRow + ['direction' => $direction];
    foreach ($source as $key => $value) {
        $row[$key] = $value !== '' ? $value : null;
    }
    $stmt->execute($row);
} else {
    // Миграция ещё не выполнена: сохраняем заявку в прежнем виде, а сведения
    // об источнике дописываем в комментарий, чтобы они не потерялись.
    $sourceNote = lead_source_lines($direction, $source);
    $baseRow['message'] = trim($message . "\n\n---\n" . implode("\n", $sourceNote));

    $stmt = $pdo->prepare(
        'INSERT INTO leads (lang, name, company, phone, email, task_type, power, message, attachments, ip)
         VALUES (:lang, :name, :company, :phone, :email, :task_type, :power, :message, :attachments, :ip)'
    );
    $stmt->execute($baseRow);
}
$leadId = (int) $pdo->lastInsertId();

$attachmentsMeta = [];
if ($savedAttachments) {
    $uploadDir = __DIR__ . '/../leads_uploads/' . $leadId;
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    foreach ($savedAttachments as $file) {
        $destination = $uploadDir . '/' . $file['stored'];
        if (move_uploaded_file($file['tmp'], $destination)) {
            $attachmentsMeta[] = ['original' => $file['original'], 'stored' => $file['stored']];
        }
    }
    if ($attachmentsMeta) {
        $update = $pdo->prepare('UPDATE leads SET attachments = :attachments WHERE id = :id');
        $update->execute([
            'attachments' => json_encode($attachmentsMeta, JSON_UNESCAPED_UNICODE),
            'id' => $leadId,
        ]);
    }
}

// --- Notify by email (best effort, never blocks the lead from being saved) ---
$notification = [
    'id' => $leadId,
    'lang' => $lang,
    'name' => $name,
    'company' => $company,
    'phone' => $phone,
    'email' => $email,
    'task_type' => $taskType,
    'power' => $power,
    'message' => $message,
    'attachments' => array_map(static function (array $file) use ($leadId): array {
        return [
            'path' => __DIR__ . '/../leads_uploads/' . $leadId . '/' . $file['stored'],
            'name' => $file['original'],
        ];
    }, $attachmentsMeta),
    'direction' => $direction,
    'source' => $source,
];

try {
    send_lead_notification($notification);
} catch (Throwable $e) {
    error_log('Lead notification email failed: ' . $e->getMessage());
}

// --- Дублирование в Телеграм (тоже не мешает сохранению заявки) ---
try {
    send_lead_telegram($notification);
} catch (Throwable $e) {
    error_log('Lead notification telegram failed: ' . $e->getMessage());
}

result_redirect($lang, true, $returnTo);
