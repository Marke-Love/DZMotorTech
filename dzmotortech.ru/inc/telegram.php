<?php
declare(strict_types=1);

/**
 * Дублирование заявок в Телеграм.
 *
 * Бот создаётся у @BotFather, токен и адрес чата вводятся в админке
 * («Настройки почты» → «Дублирование в Телеграм»). Отправка — обычный
 * HTTPS-запрос к api.telegram.org, никаких библиотек не нужно.
 */

/** Сколько ждать ответа Телеграма, чтобы посетитель не смотрел на пустую страницу. */
const TELEGRAM_TIMEOUT = 8;

/** Телеграм не принимает документы больше 50 МБ; у нас файлы и так меньше. */
const TELEGRAM_FILE_MAX_BYTES = 45 * 1024 * 1024;

function get_telegram_settings(): array
{
    return [
        'enabled' => get_setting('telegram_enabled', '0') === '1',
        'token' => trim(get_setting('telegram_token', '')),
        'chat_id' => trim(get_setting('telegram_chat_id', '')),
        'with_files' => get_setting('telegram_with_files', '1') === '1',
    ];
}

function telegram_ready(): bool
{
    $s = get_telegram_settings();
    return $s['enabled'] && $s['token'] !== '' && $s['chat_id'] !== '';
}

/**
 * Запрос к Telegram Bot API. Если $file задан, уходит методом multipart
 * (так отправляются документы), иначе обычной формой.
 *
 * @param array|null $file ['field' => имя поля, 'path' => путь, 'name' => имя файла]
 * @throws RuntimeException если Телеграм не ответил или вернул ошибку
 */
function telegram_request(string $method, array $params, ?array $file = null): array
{
    $settings = get_telegram_settings();
    if ($settings['token'] === '') {
        throw new RuntimeException('Не задан токен бота.');
    }
    // Адрес API можно подменить константой — это нужно только для проверки.
    $base = defined('TELEGRAM_API_BASE') ? TELEGRAM_API_BASE : 'https://api.telegram.org';
    $url = $base . '/bot' . $settings['token'] . '/' . $method;

    if ($file !== null && !function_exists('curl_init')) {
        throw new RuntimeException('Для отправки файлов на хостинге нужен модуль cURL.');
    }

    if (function_exists('curl_init')) {
        $post = $params;
        if ($file !== null) {
            $post[$file['field']] = new CURLFile($file['path'], '', $file['name']);
        }
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $file !== null ? $post : http_build_query($params),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => TELEGRAM_TIMEOUT,
            CURLOPT_CONNECTTIMEOUT => 5,
        ]);
        $raw = curl_exec($ch);
        $error = curl_error($ch);
        if (PHP_VERSION_ID < 80000) {   // в PHP 8 закрывать не нужно и уже нельзя
            curl_close($ch);
        }
        if ($raw === false) {
            throw new RuntimeException('Телеграм недоступен: ' . $error);
        }
    } else {
        $context = stream_context_create(['http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/x-www-form-urlencoded\r\n",
            'content' => http_build_query($params),
            'timeout' => TELEGRAM_TIMEOUT,
            'ignore_errors' => true,
        ]]);
        $raw = @file_get_contents($url, false, $context);
        if ($raw === false) {
            throw new RuntimeException('Телеграм недоступен (запрос не прошёл).');
        }
    }

    $data = json_decode((string) $raw, true);
    if (!is_array($data) || empty($data['ok'])) {
        $description = is_array($data) ? (string) ($data['description'] ?? '') : 'неизвестный ответ';
        throw new RuntimeException('Телеграм отказал: ' . $description);
    }
    return $data;
}

/** Экранирование для разметки HTML в сообщениях Телеграма. */
function telegram_escape(string $value): string
{
    return htmlspecialchars($value, ENT_NOQUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/** Отправляет произвольное сообщение — используется и для проверки из админки. */
function telegram_send_message(string $text): void
{
    $settings = get_telegram_settings();
    telegram_request('sendMessage', [
        'chat_id' => $settings['chat_id'],
        'text' => $text,
        'parse_mode' => 'HTML',
        'disable_web_page_preview' => 'true',
    ]);
}

/**
 * Заявка в Телеграм: сообщение, следом файлы клиента отдельными документами.
 *
 * @param array $lead те же поля, что у send_lead_notification()
 */
function send_lead_telegram(array $lead): void
{
    if (!telegram_ready()) {
        return;
    }
    $settings = get_telegram_settings();

    $dash = static function ($value): string {
        $value = trim((string) $value);
        return $value !== '' ? $value : '—';
    };

    $direction = trim((string) ($lead['direction'] ?? ''));
    $lines = ['<b>Заявка' . ($direction !== '' ? ' — ' . telegram_escape($direction) : '') . '</b>', ''];
    $lines[] = 'Имя: ' . telegram_escape((string) $lead['name']);
    $lines[] = 'Компания: ' . telegram_escape($dash($lead['company'] ?? ''));
    $phone = trim((string) ($lead['phone'] ?? ''));
    $lines[] = 'Телефон: ' . ($phone !== '' ? '<a href="tel:' . telegram_escape(preg_replace('/[^\d+]/', '', $phone) ?? '') . '">' . telegram_escape($phone) . '</a>' : '—');
    $lines[] = 'Email: ' . telegram_escape($dash($lead['email'] ?? ''));
    $lines[] = 'Комментарий: ' . telegram_escape($dash($lead['message'] ?? ''));
    $lines[] = '';
    $lines[] = 'Дата: ' . date('Y-m-d H:i:s');

    telegram_send_message(implode("\n", $lines));

    if (!$settings['with_files']) {
        return;
    }
    foreach ((array) ($lead['attachments'] ?? []) as $file) {
        $path = (string) ($file['path'] ?? '');
        if (!is_file($path) || filesize($path) > TELEGRAM_FILE_MAX_BYTES) {
            continue;
        }
        try {
            telegram_request(
                'sendDocument',
                ['chat_id' => $settings['chat_id']],
                ['field' => 'document', 'path' => $path, 'name' => (string) ($file['name'] ?? basename($path))]
            );
        } catch (Throwable $e) {
            // Один неотправленный файл не должен мешать остальным.
            error_log('Telegram file failed: ' . $e->getMessage());
        }
    }
}
