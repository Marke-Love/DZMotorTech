<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/auth.php';

if (current_admin() !== null) {
    redirect('leads.php');
}

/* Защита от подбора пароля: после 5 неудачных попыток с одного IP вход
   с него закрыт на 15 минут. Счётчики лежат одной записью в таблице
   settings (JSON «IP => [попыток, время первой]»), устаревшие отбрасываются. */
const LOGIN_MAX_FAILS = 5;
const LOGIN_LOCK_SECONDS = 15 * 60;
const LOGIN_FAILS_KEY = 'admin_login_failures';

function login_failures(): array
{
    $data = json_decode(get_setting(LOGIN_FAILS_KEY, '{}'), true);
    if (!is_array($data)) {
        return [];
    }
    $now = time();
    return array_filter($data, static function ($entry) use ($now): bool {
        return is_array($entry) && count($entry) === 2 && $now - (int) $entry[1] < LOGIN_LOCK_SECONDS;
    });
}

function save_login_failures(array $data): void
{
    set_setting(LOGIN_FAILS_KEY, (string) json_encode($data));
}

$ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
$failures = login_failures();
$entry = $failures[$ip] ?? null;
$lockedFor = 0;
if ($entry !== null && (int) $entry[0] >= LOGIN_MAX_FAILS) {
    $lockedFor = LOGIN_LOCK_SECONDS - (time() - (int) $entry[1]);
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $lockedFor > 0) {
    $error = 'Слишком много неудачных попыток. Попробуйте через ' . (int) ceil($lockedFor / 60) . ' мин.';
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!verify_csrf()) {
        $error = 'Сессия истекла, попробуйте снова.';
    } else {
        $username = trim((string) ($_POST['username'] ?? ''));
        $password = (string) ($_POST['password'] ?? '');

        $stmt = get_pdo()->prepare('SELECT id, username, password_hash FROM admins WHERE username = ?');
        $stmt->execute([$username]);
        $admin = $stmt->fetch();

        if ($admin && password_verify($password, $admin['password_hash'])) {
            if (isset($failures[$ip])) {
                unset($failures[$ip]);
                save_login_failures($failures);
            }
            session_regenerate_id(true);
            $_SESSION['admin_id'] = $admin['id'];
            $_SESSION['admin_username'] = $admin['username'];
            redirect('leads.php');
        }
        $failures[$ip] = [((int) ($entry[0] ?? 0)) + 1, (int) ($entry[1] ?? time())];
        save_login_failures($failures);
        $error = 'Неверный логин или пароль.';
    }
}
?>
<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>Вход — Админка DZ Motor Tech</title>
<meta name="robots" content="noindex, nofollow">
<link rel="stylesheet" href="/assets/css/fonts.css">
<link rel="stylesheet" href="assets/admin.css">
</head>
<body>
<div class="login-wrap admin-card">
	<h2>Вход в админку</h2>
	<?php if ($error !== ''): ?>
		<div class="flash-error"><?= e($error) ?></div>
	<?php endif; ?>
	<form method="post">
		<?= csrf_field() ?>
		<div class="admin-form-row">
			<label for="username">Логин</label>
			<input type="text" id="username" name="username" required autofocus>
		</div>
		<div class="admin-form-row">
			<label for="password">Пароль</label>
			<input type="password" id="password" name="password" required>
		</div>
		<button type="submit" class="btn">Войти</button>
	</form>
</div>
</body>
</html>
