<?php
declare(strict_types=1);

/**
 * Minimal dependency-free SMTP client (AUTH LOGIN, SSL/STARTTLS).
 * Written by hand instead of pulling in PHPMailer because shared hosting
 * (reg.ru Host-0) may not offer SSH/Composer to install vendor packages.
 */
class SmtpMailer
{
    private string $host;
    private int $port;
    private string $secure; // 'ssl' or 'tls'
    private string $username;
    private string $password;
    private string $fromEmail;
    private string $fromName;

    public function __construct(array $smtpConfig)
    {
        $this->host = $smtpConfig['host'];
        $this->port = (int) $smtpConfig['port'];
        $this->secure = $smtpConfig['secure'] ?? 'ssl';
        $this->username = $smtpConfig['username'];
        $this->password = $smtpConfig['password'];
        $this->fromEmail = $smtpConfig['from_email'];
        $this->fromName = $smtpConfig['from_name'] ?? $smtpConfig['from_email'];
    }

    /**
     * @throws RuntimeException on any SMTP failure
     */
    public function send(string $toEmail, string $subject, string $body): void
    {
        $transport = $this->secure === 'ssl' ? 'ssl://' : 'tcp://'; // 'tls' upgrades via STARTTLS below; 'none' stays plain
        $errno = 0;
        $errstr = '';
        $socket = @stream_socket_client(
            $transport . $this->host . ':' . $this->port,
            $errno,
            $errstr,
            15,
            STREAM_CLIENT_CONNECT
        );
        if (!$socket) {
            throw new RuntimeException("SMTP connect failed: $errstr ($errno)");
        }

        $this->readResponse($socket, 220);
        $this->command($socket, 'EHLO ' . $this->host, 250);

        if ($this->secure === 'tls') {
            $this->command($socket, 'STARTTLS', 220);
            if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                fclose($socket);
                throw new RuntimeException('STARTTLS negotiation failed');
            }
            $this->command($socket, 'EHLO ' . $this->host, 250);
        }

        $this->command($socket, 'AUTH LOGIN', 334);
        $this->command($socket, base64_encode($this->username), 334);
        $this->command($socket, base64_encode($this->password), 235);

        $this->command($socket, 'MAIL FROM:<' . $this->fromEmail . '>', 250);
        $this->command($socket, 'RCPT TO:<' . $toEmail . '>', 250);
        $this->command($socket, 'DATA', 354);

        $headers = $this->buildHeaders($toEmail, $subject);
        $encodedBody = chunk_split(base64_encode($body));
        $message = $headers . "\r\n" . $encodedBody;
        // Escape lines that start with a lone dot, per SMTP DATA rules.
        $message = preg_replace('/^\./m', '..', $message);

        fwrite($socket, $message . "\r\n.\r\n");
        $this->readResponse($socket, 250);

        fwrite($socket, "QUIT\r\n");
        fclose($socket);
    }

    private function buildHeaders(string $toEmail, string $subject): string
    {
        $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
        $encodedFromName = '=?UTF-8?B?' . base64_encode($this->fromName) . '?=';
        $lines = [
            'From: ' . $encodedFromName . ' <' . $this->fromEmail . '>',
            'To: <' . $toEmail . '>',
            'Subject: ' . $encodedSubject,
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset=UTF-8',
            'Content-Transfer-Encoding: base64',
            'Date: ' . date('r'),
        ];
        return implode("\r\n", $lines) . "\r\n";
    }

    /**
     * @param resource $socket
     */
    private function command($socket, string $command, int $expectedCode): string
    {
        fwrite($socket, $command . "\r\n");
        return $this->readResponse($socket, $expectedCode);
    }

    /**
     * @param resource $socket
     */
    private function readResponse($socket, int $expectedCode): string
    {
        $response = '';
        while (($line = fgets($socket, 515)) !== false) {
            $response .= $line;
            // Multi-line responses have a dash after the code; final line has a space.
            if (preg_match('/^\d{3} /', $line)) {
                break;
            }
        }
        $code = (int) substr($response, 0, 3);
        if ($code !== $expectedCode) {
            fclose($socket);
            throw new RuntimeException("SMTP error: expected $expectedCode, got: $response");
        }
        return $response;
    }
}

/**
 * SMTP settings editable in admin/settings.php (stored in the `settings` table)
 * take priority; inc/config.php values are only used as a fallback so the
 * site keeps working before the admin has filled in the settings page.
 */
function get_smtp_settings(): array
{
    $smtp = app_config()['smtp'];
    $overrides = [
        'host' => get_setting('smtp_host', ''),
        'port' => get_setting('smtp_port', ''),
        'secure' => get_setting('smtp_secure', ''),
        'username' => get_setting('smtp_username', ''),
        'password' => get_setting('smtp_password', ''),
        'from_email' => get_setting('smtp_from_email', ''),
        'from_name' => get_setting('smtp_from_name', ''),
    ];
    foreach ($overrides as $key => $value) {
        if ($value !== '') {
            $smtp[$key] = $key === 'port' ? (int) $value : $value;
        }
    }
    return $smtp;
}

/**
 * Способ отправки писем: 'mail' — обычная отправка средствами хостинга (функция
 * mail(), без логина и пароля), 'smtp' — через внешний SMTP-сервер.
 * По умолчанию — 'mail': рабочая почта на VK WorkSpace, SMTP там не настроен.
 */
function get_mail_transport(): string
{
    return get_setting('mail_transport', 'mail') === 'smtp' ? 'smtp' : 'mail';
}

/**
 * Адрес отправителя для обычной отправки. Письмо уходит с сервера хостинга,
 * поэтому адрес должен быть на домене сайта: чужой домен (например, яндекс)
 * почтовые службы сочтут подделкой. Если в настройках указан адрес на другом
 * домене, берём noreply@ домена сайта.
 */
function hosting_from_email(string $configured): string
{
    $host = (string) (parse_url((string) (app_config()['site']['ru_base'] ?? ''), PHP_URL_HOST) ?: 'dzmotortech.ru');
    $host = preg_replace('/^www\./', '', $host);
    $configured = trim($configured);
    if ($configured !== '' && filter_var($configured, FILTER_VALIDATE_EMAIL)
        && strtolower(substr($configured, -strlen('@' . $host))) === strtolower('@' . $host)) {
        return $configured;
    }
    return 'noreply@' . $host;
}

/**
 * Отправляет письмо выбранным способом.
 *
 * @throws RuntimeException если письмо не удалось передать на отправку
 */
function send_site_mail(string $toEmail, string $subject, string $body, string $replyTo = ''): void
{
    $settings = get_smtp_settings();

    if (get_mail_transport() === 'smtp') {
        (new SmtpMailer($settings))->send($toEmail, $subject, $body);
        return;
    }

    $fromEmail = hosting_from_email((string) ($settings['from_email'] ?? ''));
    $fromName = (string) ($settings['from_name'] ?? '') !== '' ? (string) $settings['from_name'] : 'DZ Motor Tech';

    $headers = [
        'From: =?UTF-8?B?' . base64_encode($fromName) . '?= <' . $fromEmail . '>',
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: base64',
    ];
    $replyTo = trim(str_replace(["\r", "\n"], '', $replyTo));
    if ($replyTo !== '' && filter_var($replyTo, FILTER_VALIDATE_EMAIL)) {
        $headers[] = 'Reply-To: <' . $replyTo . '>';
    }

    $ok = mail(
        $toEmail,
        '=?UTF-8?B?' . base64_encode($subject) . '?=',
        chunk_split(base64_encode($body)),
        implode("\r\n", $headers),
        '-f' . $fromEmail
    );
    if (!$ok) {
        throw new RuntimeException('Хостинг не принял письмо к отправке (функция mail() вернула ошибку).');
    }
}

/**
 * Строки о происхождении заявки — для письма и для комментария, если в базе
 * ещё нет отдельных колонок.
 */
function lead_source_lines(string $direction, array $source): array
{
    $get = static function (string $key) use ($source): string {
        return trim((string) ($source[$key] ?? ''));
    };

    $utmSource = $get('utm_source');
    $utmMedium = strtolower($get('utm_medium'));
    $yandex = ['yandex', 'ya', 'yandex_direct', 'yandexdirect', 'direct', 'ya.direct'];

    if ($get('yclid') !== ''
        || (in_array(strtolower($utmSource), $yandex, true) && in_array($utmMedium, ['', 'cpc', 'ppc', 'paid'], true))) {
        $sourceLabel = 'Яндекс Директ';
    } elseif ($utmSource !== '') {
        $sourceLabel = $utmSource . ($utmMedium !== '' ? ' / ' . $utmMedium : '');
    } else {
        $sourceLabel = 'не определён (переход без UTM-меток)';
    }

    $dash = static function (string $value): string {
        return $value !== '' ? $value : '-';
    };

    return [
        'Направление: ' . $direction,
        'Источник: ' . $sourceLabel,
        'Кампания: ' . $dash($get('utm_campaign')),
        'Объявление: ' . $dash($get('utm_content')),
        'Поисковый запрос: ' . $dash($get('utm_term')),
        'utm_source / utm_medium: ' . $dash($utmSource) . ' / ' . $dash($get('utm_medium')),
        'yclid: ' . $dash($get('yclid')),
        'Посадочная страница: ' . $dash($get('landing_page')),
        'Страница с формой: ' . $dash($get('form_page')),
    ];
}

function send_lead_notification(array $lead): void
{
    $smtp = get_smtp_settings();
    $toEmail = get_setting('notify_email', $smtp['from_email']);

    $direction = (string) ($lead['direction'] ?? '');
    $subject = sprintf(
        'Новая заявка (%s)%s: %s',
        strtoupper($lead['lang']),
        $direction !== '' ? ' — ' . $direction : '',
        $lead['name']
    );

    $dash = static function ($value): string {
        $value = trim((string) $value);
        return $value !== '' ? $value : '-';
    };

    $bodyLines = [
        'Новая заявка с сайта' . (!empty($lead['id']) ? ' №' . (int) $lead['id'] : '') . '.',
        '',
        'Имя: ' . $lead['name'],
        'Компания: ' . $dash($lead['company'] ?? ''),
        'Телефон: ' . $dash($lead['phone'] ?? ''),
        'Email: ' . $dash($lead['email'] ?? ''),
        'Комментарий: ' . $dash($lead['message'] ?? ''),
        'Вложений: ' . (int) ($lead['attachments_count'] ?? 0)
            . ((int) ($lead['attachments_count'] ?? 0) > 0 ? ' (файлы — в карточке заявки в админке)' : ''),
        '',
        '— Откуда заявка —',
    ];
    $bodyLines = array_merge($bodyLines, lead_source_lines($direction !== '' ? $direction : '-', (array) ($lead['source'] ?? [])));
    $bodyLines[] = '';
    $bodyLines[] = 'Язык страницы: ' . $lead['lang'];
    $bodyLines[] = 'Дата: ' . date('Y-m-d H:i:s');

    $body = implode("\n", $bodyLines);

    // Ответ из почты уходит сразу клиенту, если он оставил email.
    send_site_mail($toEmail, $subject, $body, (string) ($lead['email'] ?? ''));
}
