<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/auth.php';
$admin = require_login();

const PAGE_SIZE = 20;

$filters = [
    'name' => trim((string) ($_GET['name'] ?? '')),
    'email' => trim((string) ($_GET['email'] ?? '')),
    'phone' => trim((string) ($_GET['phone'] ?? '')),
    'task_type' => trim((string) ($_GET['task_type'] ?? '')),
    'date_from' => trim((string) ($_GET['date_from'] ?? '')),
    'date_to' => trim((string) ($_GET['date_to'] ?? '')),
];

$where = [];
$params = [];

if ($filters['name'] !== '') {
    $where[] = 'name LIKE :name';
    $params['name'] = '%' . $filters['name'] . '%';
}
if ($filters['email'] !== '') {
    $where[] = 'email LIKE :email';
    $params['email'] = '%' . $filters['email'] . '%';
}
if ($filters['phone'] !== '') {
    $where[] = 'phone LIKE :phone';
    $params['phone'] = '%' . $filters['phone'] . '%';
}
if ($filters['task_type'] !== '') {
    $where[] = 'task_type = :task_type';
    $params['task_type'] = $filters['task_type'];
}
if ($filters['date_from'] !== '') {
    $where[] = 'created_at >= :date_from';
    $params['date_from'] = $filters['date_from'] . ' 00:00:00';
}
if ($filters['date_to'] !== '') {
    $where[] = 'created_at <= :date_to';
    $params['date_to'] = $filters['date_to'] . ' 23:59:59';
}

$whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

$pdo = get_pdo();

$countStmt = $pdo->prepare("SELECT COUNT(*) FROM leads $whereSql");
$countStmt->execute($params);
$total = (int) $countStmt->fetchColumn();
$totalPages = max(1, (int) ceil($total / PAGE_SIZE));

$page = max(1, (int) ($_GET['page'] ?? 1));
$page = min($page, $totalPages);
$offset = ($page - 1) * PAGE_SIZE;

$stmt = $pdo->prepare("SELECT * FROM leads $whereSql ORDER BY created_at DESC LIMIT :limit OFFSET :offset");
foreach ($params as $key => $value) {
    $stmt->bindValue(':' . $key, $value);
}
$stmt->bindValue(':limit', PAGE_SIZE, PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
$stmt->execute();
$leads = $stmt->fetchAll();

$taskTypesStmt = $pdo->query('SELECT DISTINCT task_type FROM leads WHERE task_type IS NOT NULL AND task_type <> "" ORDER BY task_type');
$taskTypes = $taskTypesStmt->fetchAll(PDO::FETCH_COLUMN);

function build_query(array $overrides = []): string
{
    $params = array_merge($_GET, $overrides);
    $params = array_filter($params, fn($v) => $v !== '' && $v !== null);
    return http_build_query($params);
}

$activeNav = 'leads';
$pageTitle = 'Заявки';
require __DIR__ . '/includes/layout_top.php';
?>

<div class="admin-card">
	<form method="get" class="admin-filters">
		<div class="admin-form-row">
			<label>Имя</label>
			<input type="text" name="name" value="<?= e($filters['name']) ?>">
		</div>
		<div class="admin-form-row">
			<label>Email</label>
			<input type="text" name="email" value="<?= e($filters['email']) ?>">
		</div>
		<div class="admin-form-row">
			<label>Телефон</label>
			<input type="text" name="phone" value="<?= e($filters['phone']) ?>">
		</div>
		<div class="admin-form-row">
			<label>Тип задачи</label>
			<select name="task_type">
				<option value="">Все</option>
				<?php foreach ($taskTypes as $tt): ?>
					<option value="<?= e($tt) ?>" <?= $tt === $filters['task_type'] ? 'selected' : '' ?>><?= e($tt) ?></option>
				<?php endforeach; ?>
			</select>
		</div>
		<div class="admin-form-row">
			<label>С даты</label>
			<input type="date" name="date_from" value="<?= e($filters['date_from']) ?>">
		</div>
		<div class="admin-form-row">
			<label>По дату</label>
			<input type="date" name="date_to" value="<?= e($filters['date_to']) ?>">
		</div>
		<div class="admin-form-row">
			<button type="submit" class="btn">Фильтровать</button>
			<a href="leads.php" class="btn btn-secondary">Сбросить</a>
		</div>
	</form>
</div>

<div class="admin-card">
	<p>Всего заявок: <?= (int) $total ?></p>
	<table class="admin-table">
		<thead>
			<tr>
				<th>Дата</th>
				<th>Язык</th>
				<th>Имя</th>
				<th>Компания</th>
				<th>Телефон</th>
				<th>Email</th>
				<th>Тип задачи</th>
				<th>Направление</th>
				<th></th>
				<th></th>
			</tr>
		</thead>
		<tbody>
			<?php $currentQuery = build_query(); ?>
			<?php foreach ($leads as $lead): ?>
			<tr>
				<td><?= e($lead['created_at']) ?></td>
				<td><?= e(strtoupper($lead['lang'])) ?></td>
				<td><?= e($lead['name']) ?></td>
				<td><?= e($lead['company'] ?? '') ?></td>
				<td><?= e($lead['phone']) ?></td>
				<td><?= e($lead['email']) ?></td>
				<td><?= e($lead['task_type'] ?? '') ?></td>
				<td><?= e($lead['direction'] ?? '') ?><?= !empty($lead['utm_campaign']) ? '<br><small>' . e($lead['utm_campaign']) . '</small>' : '' ?></td>
				<td><a href="lead-detail.php?id=<?= (int) $lead['id'] ?>">Открыть</a></td>
				<td>
					<form method="post" action="delete-lead.php" onsubmit="return confirm('Удалить эту заявку без возможности восстановления?');">
						<?= csrf_field() ?>
						<input type="hidden" name="id" value="<?= (int) $lead['id'] ?>">
						<input type="hidden" name="redirect" value="leads.php<?= $currentQuery !== '' ? '?' . e($currentQuery) : '' ?>">
						<button type="submit" class="btn btn-secondary" style="color:#b3261e;">Удалить</button>
					</form>
				</td>
			</tr>
			<?php endforeach; ?>
			<?php if (!$leads): ?>
			<tr><td colspan="10">Заявок не найдено.</td></tr>
			<?php endif; ?>
		</tbody>
	</table>

	<?php if ($totalPages > 1): ?>
	<div class="admin-pagination">
		<?php for ($p = 1; $p <= $totalPages; $p++): ?>
			<?php if ($p === $page): ?>
				<span class="current"><?= $p ?></span>
			<?php else: ?>
				<a href="?<?= e(build_query(['page' => $p])) ?>"><?= $p ?></a>
			<?php endif; ?>
		<?php endfor; ?>
	</div>
	<?php endif; ?>
</div>

<?php require __DIR__ . '/includes/layout_bottom.php'; ?>
