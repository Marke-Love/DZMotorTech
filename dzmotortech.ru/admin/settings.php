<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/../inc/mailer.php';
require_once __DIR__ . '/../inc/telegram.php';
$admin = require_login();

$flash = '';
$flashType = 'success';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && !verify_csrf()) {
    $flash = 'Сессия истекла, попробуйте снова.';
    $flashType = 'error';
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'save') {
    $notifyEmail = trim((string) ($_POST['notify_email'] ?? ''));
    $mailTransport = ($_POST['mail_transport'] ?? 'mail') === 'smtp' ? 'smtp' : 'mail';
    $smtpHost = trim((string) ($_POST['smtp_host'] ?? ''));
    $smtpPort = trim((string) ($_POST['smtp_port'] ?? ''));
    $smtpSecure = trim((string) ($_POST['smtp_secure'] ?? ''));
    $smtpUsername = trim((string) ($_POST['smtp_username'] ?? ''));
    $smtpPassword = (string) ($_POST['smtp_password'] ?? '');
    $smtpFromEmail = trim((string) ($_POST['smtp_from_email'] ?? ''));
    $smtpFromName = trim((string) ($_POST['smtp_from_name'] ?? ''));

    if (!filter_var($notifyEmail, FILTER_VALIDATE_EMAIL)) {
        $flash = 'Введите корректный email для уведомлений.';
        $flashType = 'error';
    } elseif ($smtpFromEmail !== '' && !filter_var($smtpFromEmail, FILTER_VALIDATE_EMAIL)) {
        $flash = 'Адрес отправителя (From) указан некорректно.';
        $flashType = 'error';
    } else {
        set_setting('notify_email', $notifyEmail);
        set_setting('mail_transport', $mailTransport);
        set_setting('smtp_host', $smtpHost);
        set_setting('smtp_port', $smtpPort);
        set_setting('smtp_secure', $smtpSecure);
        set_setting('smtp_username', $smtpUsername);
        set_setting('smtp_from_email', $smtpFromEmail);
        set_setting('smtp_from_name', $smtpFromName);
        set_setting('telegram_enabled', ($_POST['telegram_enabled'] ?? '') === '1' ? '1' : '0');
        set_setting('telegram_with_files', ($_POST['telegram_with_files'] ?? '') === '1' ? '1' : '0');
        set_setting('telegram_chat_id', trim((string) ($_POST['telegram_chat_id'] ?? '')));
        // Токен, как и пароль, перезаписываем только если его ввели заново.
        $telegramToken = trim((string) ($_POST['telegram_token'] ?? ''));
        if ($telegramToken !== '') {
            set_setting('telegram_token', $telegramToken);
        }
        // Only overwrite the stored password if the admin typed a new one —
        // the field is always rendered empty, so an empty submit means "keep current".
        if ($smtpPassword !== '') {
            set_setting('smtp_password', $smtpPassword);
        }
        $flash = 'Настройки почты сохранены.';
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'test_telegram') {
    try {
        telegram_send_message('<b>Проверка связи</b>' . "\n" . 'Если вы видите это сообщение, заявки с сайта будут приходить сюда.');
        $flash = 'Тестовое сообщение отправлено в Телеграм.';
    } catch (Throwable $e) {
        $flash = 'Не удалось отправить в Телеграм: ' . $e->getMessage();
        $flashType = 'error';
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'test') {
    try {
        send_site_mail(
            get_setting('notify_email'),
            'Тестовое письмо из админки DZ Motor Tech',
            "Это тестовое письмо, отправленное со страницы настроек почты.\nЕсли вы его получили, отправка писем работает."
        );
        $flash = 'Тестовое письмо отправлено на ' . get_setting('notify_email') . '.';
    } catch (Throwable $e) {
        $flash = 'Не удалось отправить тестовое письмо: ' . $e->getMessage();
        $flashType = 'error';
    }
}

$notifyEmail = get_setting('notify_email');
$smtpDefaults = app_config()['smtp'];
$smtpHost = get_setting('smtp_host', '') ?: $smtpDefaults['host'];
$smtpPort = get_setting('smtp_port', '') ?: (string) $smtpDefaults['port'];
$smtpSecure = get_setting('smtp_secure', '') ?: $smtpDefaults['secure'];
$smtpUsername = get_setting('smtp_username', '') ?: $smtpDefaults['username'];
$smtpFromEmail = get_setting('smtp_from_email', '') ?: $smtpDefaults['from_email'];
$smtpFromName = get_setting('smtp_from_name', '') ?: $smtpDefaults['from_name'];
$hasStoredPassword = get_setting('smtp_password', '') !== '';
$mailTransport = get_mail_transport();
$hostingFrom = hosting_from_email($smtpFromEmail);
$telegram = get_telegram_settings();
$hasTelegramToken = $telegram['token'] !== '';

$activeNav = 'settings';
$pageTitle = 'Настройки уведомлений';
require __DIR__ . '/includes/layout_top.php';
?>

<?php if ($flash !== ''): ?>
	<div class="flash-<?= e($flashType) ?>"><?= e($flash) ?></div>
<?php endif; ?>

<div class="admin-card">
	<h3>Получатель уведомлений</h3>
	<form method="post">
		<?= csrf_field() ?>
		<input type="hidden" name="action" value="save">

		<div class="admin-form-row">
			<label for="notify_email">Email, на который приходят заявки</label>
			<input type="email" id="notify_email" name="notify_email" value="<?= e($notifyEmail) ?>" required>
		</div>

		<h3>Способ отправки</h3>
		<div class="admin-form-row">
			<label for="mail_transport">Как отправлять письма о заявках</label>
			<select id="mail_transport" name="mail_transport">
				<option value="mail" <?= $mailTransport === 'mail' ? 'selected' : '' ?>>Обычная отправка с хостинга (без логина и пароля)</option>
				<option value="smtp" <?= $mailTransport === 'smtp' ? 'selected' : '' ?>>Через SMTP-сервер</option>
			</select>
		</div>
		<?php if ($mailTransport === 'mail'): ?>
			<p>Письма уходят с адреса <strong><?= e($hostingFrom) ?></strong>. Нажмите «Ответить» в письме — ответ уйдёт клиенту, если он оставил email.</p>
		<?php endif; ?>

		<div class="row">
			<div class="col-sm-6">
				<div class="admin-form-row">
					<label for="smtp_from_email">Email отправителя (From)</label>
					<input type="email" id="smtp_from_email" name="smtp_from_email" value="<?= e($smtpFromEmail) ?>" placeholder="noreply@dzmotortech.ru">
				</div>
			</div>
			<div class="col-sm-6">
				<div class="admin-form-row">
					<label for="smtp_from_name">Имя отправителя (From)</label>
					<input type="text" id="smtp_from_name" name="smtp_from_name" value="<?= e($smtpFromName) ?>">
				</div>
			</div>
		</div>

		<h3>SMTP-сервер (нужен, только если выбран SMTP)</h3>
		<div class="row">
			<div class="col-sm-6">
				<div class="admin-form-row">
					<label for="smtp_host">SMTP-хост</label>
					<input type="text" id="smtp_host" name="smtp_host" value="<?= e($smtpHost) ?>" placeholder="smtp.yandex.ru">
				</div>
			</div>
			<div class="col-sm-6">
				<div class="admin-form-row">
					<label for="smtp_port">Порт</label>
					<input type="text" id="smtp_port" name="smtp_port" value="<?= e($smtpPort) ?>" placeholder="465">
				</div>
			</div>
		</div>
		<div class="row">
			<div class="col-sm-6">
				<div class="admin-form-row">
					<label for="smtp_secure">Шифрование</label>
					<select id="smtp_secure" name="smtp_secure">
						<option value="ssl" <?= $smtpSecure === 'ssl' ? 'selected' : '' ?>>SSL (порт 465)</option>
						<option value="tls" <?= $smtpSecure === 'tls' ? 'selected' : '' ?>>STARTTLS (порт 587)</option>
						<option value="none" <?= $smtpSecure === 'none' ? 'selected' : '' ?>>Без шифрования</option>
					</select>
				</div>
			</div>
			<div class="col-sm-6">
				<div class="admin-form-row">
					<label for="smtp_username">Логин (обычно email)</label>
					<input type="text" id="smtp_username" name="smtp_username" value="<?= e($smtpUsername) ?>">
				</div>
			</div>
		</div>
		<div class="row">
			<div class="col-sm-6">
				<div class="admin-form-row">
					<label for="smtp_password">Пароль приложения</label>
					<input type="password" id="smtp_password" name="smtp_password" placeholder="<?= $hasStoredPassword ? 'Оставьте пустым, чтобы не менять' : 'Не задан' ?>" autocomplete="new-password">
				</div>
			</div>
		</div>
		<h3>Дублирование в Телеграм</h3>
		<p>Заявки будут приходить боту дополнительно к письму. Токен выдаёт <strong>@BotFather</strong>, адрес чата можно узнать у бота <strong>@userinfobot</strong> (для группы — добавьте туда своего бота и <strong>@userinfobot</strong>).</p>
		<div class="admin-form-row">
			<label for="telegram_enabled">Отправлять заявки в Телеграм</label>
			<select id="telegram_enabled" name="telegram_enabled">
				<option value="0" <?= $telegram['enabled'] ? '' : 'selected' ?>>Нет</option>
				<option value="1" <?= $telegram['enabled'] ? 'selected' : '' ?>>Да</option>
			</select>
		</div>
		<div class="row">
			<div class="col-sm-6">
				<div class="admin-form-row">
					<label for="telegram_token">Токен бота</label>
					<input type="password" id="telegram_token" name="telegram_token" placeholder="<?= $hasTelegramToken ? 'Оставьте пустым, чтобы не менять' : '123456789:AA...' ?>" autocomplete="new-password">
				</div>
			</div>
			<div class="col-sm-6">
				<div class="admin-form-row">
					<label for="telegram_chat_id">Кому отправлять (chat ID)</label>
					<input type="text" id="telegram_chat_id" name="telegram_chat_id" value="<?= e($telegram['chat_id']) ?>" placeholder="123456789 или -1001234567890">
				</div>
			</div>
		</div>
		<div class="admin-form-row">
			<label for="telegram_with_files">Прикладывать файлы клиента</label>
			<select id="telegram_with_files" name="telegram_with_files">
				<option value="1" <?= $telegram['with_files'] ? 'selected' : '' ?>>Да</option>
				<option value="0" <?= $telegram['with_files'] ? '' : 'selected' ?>>Нет, только текст</option>
			</select>
		</div>

		<button type="submit" class="btn">Сохранить</button>
	</form>
</div>

<div class="admin-card">
	<h3>Проверка отправки</h3>
	<p>Отправит тестовое письмо на текущий адрес уведомлений (<?= e($notifyEmail) ?>) выбранным и уже сохранённым способом отправки.</p>
	<form method="post">
		<?= csrf_field() ?>
		<input type="hidden" name="action" value="test">
		<button type="submit" class="btn btn-secondary">Отправить тестовое письмо</button>
	</form>
	<p style="margin-top:18px">Отправит проверочное сообщение в Телеграм с уже сохранёнными токеном и адресом чата.</p>
	<form method="post">
		<?= csrf_field() ?>
		<input type="hidden" name="action" value="test_telegram">
		<button type="submit" class="btn btn-secondary">Отправить тестовое сообщение в Телеграм</button>
	</form>
</div>

<?php require __DIR__ . '/includes/layout_bottom.php'; ?>
