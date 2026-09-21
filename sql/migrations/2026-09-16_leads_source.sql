-- Источник заявки: направление, UTM-метки, yclid и страницы.
--
-- Выполнить один раз в phpMyAdmin (вкладка «SQL») на рабочей базе.
-- Порядок не важен: обработчик заявок проверяет, есть ли эти колонки, и до
-- миграции пишет сведения об источнике в комментарий заявки, а после — в
-- отдельные поля. Заявки не теряются ни в одном из вариантов.
--
-- Повторный запуск вызовет ошибку «Duplicate column» — это значит, что
-- миграция уже выполнена, ничего делать не нужно.

ALTER TABLE leads
    ADD COLUMN direction    VARCHAR(255) NULL AFTER power,
    ADD COLUMN utm_source   VARCHAR(255) NULL AFTER direction,
    ADD COLUMN utm_medium   VARCHAR(255) NULL AFTER utm_source,
    ADD COLUMN utm_campaign VARCHAR(255) NULL AFTER utm_medium,
    ADD COLUMN utm_content  VARCHAR(255) NULL AFTER utm_campaign,
    ADD COLUMN utm_term     VARCHAR(255) NULL AFTER utm_content,
    ADD COLUMN yclid        VARCHAR(64)  NULL AFTER utm_term,
    ADD COLUMN landing_page VARCHAR(500) NULL AFTER yclid,
    ADD COLUMN form_page    VARCHAR(500) NULL AFTER landing_page,
    ADD INDEX idx_direction (direction),
    ADD INDEX idx_utm_campaign (utm_campaign);
