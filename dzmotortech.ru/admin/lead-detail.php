<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/../inc/mailer.php'; // lead_source_lines()
$admin = require_login();

$id = (int) ($_GET['id'] ?? 0);
$stmt = get_pdo()->prepare('SELECT * FROM leads WHERE id = ?');
$stmt->execute([$id]);
$lead = $stmt->fetch();

if (!$lead) {
    http_response_code(404);
    $activeNav = 'leads';
    $pageTitle = 'Заявка не найдена';
    require __DIR__ . '/includes/layout_top.php';
    echo '<div class="admin-card">Заявка не найдена. <a href="leads.php">Назад к списку</a></div>';
    require __DIR__ . '/includes/layout_bottom.php';
    exit;
}

$attachments = json_decode((string) $lead['attachments'], true) ?: [];

$activeNav = 'leads';
$pageTitle = 'Заявка #' . $lead['id'];
require __DIR__ . '/includes/layout_top.php';
?>

<p><a href="leads.php">&larr; Назад к списку заявок</a></p>

<div class="admin-card">
	<dl class="lead-detail-grid">
		<dt>Дата</dt><dd><?= e($lead['created_at']) ?></dd>
		<dt>Язык</dt><dd><?= e(strtoupper($lead['lang'])) ?></dd>
		<dt>ФИО</dt><dd><?= e($lead['name']) ?></dd>
		<dt>Компания</dt><dd><?= e($lead['company'] ?? '-') ?></dd>
		<dt>Телефон</dt><dd><?php if (($lead['phone'] ?? '') !== ''): ?><a href="tel:<?= e($lead['phone']) ?>"><?= e($lead['phone']) ?></a><?php else: ?>—<?php endif; ?></dd>
		<dt>Email</dt><dd><?php if (($lead['email'] ?? '') !== ''): ?><a href="mailto:<?= e($lead['email']) ?>"><?= e($lead['email']) ?></a><?php else: ?>—<?php endif; ?></dd>
		<dt>Тип задачи</dt><dd><?= e($lead['task_type'] ?? '-') ?></dd>
		<dt>Мощность/напряжение</dt><dd><?= e($lead['power'] ?? '-') ?></dd>
		<dt>Комментарий</dt><dd><?= nl2br(e($lead['message'] ?? '-')) ?></dd>
		<dt>IP</dt><dd><?= e($lead['ip'] ?? '-') ?></dd>
		<?php if (array_key_exists('utm_source', $lead)): ?>
			<?php $sourceLines = lead_source_lines((string) ($lead['direction'] ?? '-'), $lead); ?>
			<dt>Откуда заявка</dt>
			<dd><?php foreach ($sourceLines as $line): ?><?= e($line) ?><br><?php endforeach; ?></dd>
		<?php endif; ?>
		<dt>Вложения</dt>
		<dd>
			<?php if ($attachments): ?>
				<ul class="attachment-list">
					<?php foreach ($attachments as $file): ?>
						<li><a href="download.php?id=<?= (int) $lead['id'] ?>&file=<?= e($file['stored']) ?>"><?= e($file['original']) ?></a></li>
					<?php endforeach; ?>
				</ul>
			<?php else: ?>
				—
			<?php endif; ?>
		</dd>
	</dl>
</div>

<form method="post" action="delete-lead.php" onsubmit="return confirm('Удалить эту заявку без возможности восстановления?');">
	<?= csrf_field() ?>
	<input type="hidden" name="id" value="<?= (int) $lead['id'] ?>">
	<input type="hidden" name="redirect" value="leads.php">
	<button type="submit" class="btn" style="background:#b3261e;">Удалить заявку</button>
</form>

<?php require __DIR__ . '/includes/layout_bottom.php'; ?>
