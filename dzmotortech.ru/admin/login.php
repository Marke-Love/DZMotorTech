<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/auth.php';

if (current_admin() !== null) {
    redirect('leads.php');
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!verify_csrf()) {
        $error = 'Сессия истекла, попробуйте снова.';
    } else {
        $username = trim((string) ($_POST['username'] ?? ''));
        $password = (string) ($_POST['password'] ?? '');

        $stmt = get_pdo()->prepare('SELECT id, username, password_hash FROM admins WHERE username = ?');
        $stmt->execute([$username]);
        $admin = $stmt->fetch();

        if ($admin && password_verify($password, $admin['password_hash'])) {
            session_regenerate_id(true);
            $_SESSION['admin_id'] = $admin['id'];
            $_SESSION['admin_username'] = $admin['username'];
            redirect('leads.php');
        }
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
