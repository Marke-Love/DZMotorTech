<?php
declare(strict_types=1);

require __DIR__ . '/../inc/db.php';
require __DIR__ . '/../inc/helpers.php';
require __DIR__ . '/../inc/mailer.php';

const MAX_FILES = 5;
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'pdf', 'doc', 'docx'];
const ALLOWED_MIME_TYPES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

function fail_redirect(string $lang): void
{
    $config = app_config();
    $base = $lang === 'en' ? $config['site']['en_base'] : $config['site']['ru_base'];
    redirect($base . '/pages/contactus.html?sent=0');
}

function success_redirect(string $lang): void
{
    $config = app_config();
    $base = $lang === 'en' ? $config['site']['en_base'] : $config['site']['ru_base'];
    redirect($base . '/pages/contactus.html?sent=1');
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit('Method not allowed');
}

$lang = ($_POST['lang'] ?? 'ru') === 'en' ? 'en' : 'ru';

// Honeypot: real users never fill this hidden field. Pretend success to bots.
if (!empty($_POST['website'])) {
    success_redirect($lang);
}

$name = trim((string) ($_POST['txt_name'] ?? ''));
$company = trim((string) ($_POST['txt_company'] ?? ''));
$phone = trim((string) ($_POST['txt_tele'] ?? ''));
$email = trim((string) ($_POST['txt_email'] ?? ''));
$taskType = trim((string) ($_POST['txt_task_type'] ?? ''));
$power = trim((string) ($_POST['txt_power'] ?? ''));
$message = trim((string) ($_POST['message'] ?? ''));
$consent = isset($_POST['privacy_consent']);

// комментарий необязателен: заявку принимаем и без него
if ($name === '' || $phone === '' || $email === '' || !$consent) {
    fail_redirect($lang);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fail_redirect($lang);
}

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
$stmt = $pdo->prepare(
    'INSERT INTO leads (lang, name, company, phone, email, task_type, power, message, attachments, ip)
     VALUES (:lang, :name, :company, :phone, :email, :task_type, :power, :message, :attachments, :ip)'
);
$stmt->execute([
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
]);
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
try {
    send_lead_notification([
        'lang' => $lang,
        'name' => $name,
        'company' => $company,
        'phone' => $phone,
        'email' => $email,
        'task_type' => $taskType,
        'power' => $power,
        'message' => $message,
        'attachments_count' => count($attachmentsMeta),
    ]);
} catch (Throwable $e) {
    error_log('Lead notification email failed: ' . $e->getMessage());
}

success_redirect($lang);
