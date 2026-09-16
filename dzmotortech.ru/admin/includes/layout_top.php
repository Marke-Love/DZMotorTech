<?php
/** @var array $admin */
/** @var string $activeNav */
/** @var string $pageTitle */
?>
<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title><?= e($pageTitle ?? 'Админка') ?> — DZ Motor Tech</title>
<meta name="robots" content="noindex, nofollow">
<link rel="stylesheet" href="/asssets.51microshop.com/assets/css/fonts.css">
<link rel="stylesheet" href="assets/admin.css">
</head>
<body>
<header class="admin-header">
	<div class="brand">DZ Motor Tech — Админка</div>
	<nav class="admin-nav">
		<a href="leads.php" class="<?= ($activeNav ?? '') === 'leads' ? 'active' : '' ?>">Заявки</a>
		<a href="settings.php" class="<?= ($activeNav ?? '') === 'settings' ? 'active' : '' ?>">Настройки почты</a>
	</nav>
	<div class="admin-logout"><?= e($admin['username'] ?? '') ?> · <a href="logout.php">Выйти</a></div>
</header>
<main class="admin-main">
