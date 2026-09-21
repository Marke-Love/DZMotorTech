-- Schema for the dzmotortech.ru admin panel (leads, settings, single admin)
-- Run this once against the MySQL database created on reg.ru (or locally for testing).

CREATE TABLE IF NOT EXISTS leads (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lang VARCHAR(5) NOT NULL DEFAULT 'ru',
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255) NULL,
    phone VARCHAR(64) NOT NULL,
    email VARCHAR(255) NOT NULL,
    task_type VARCHAR(255) NULL,
    power VARCHAR(255) NULL,
    direction VARCHAR(255) NULL,
    utm_source VARCHAR(255) NULL,
    utm_medium VARCHAR(255) NULL,
    utm_campaign VARCHAR(255) NULL,
    utm_content VARCHAR(255) NULL,
    utm_term VARCHAR(255) NULL,
    yclid VARCHAR(64) NULL,
    landing_page VARCHAR(500) NULL,
    form_page VARCHAR(500) NULL,
    message TEXT NULL,
    attachments TEXT NULL,
    ip VARCHAR(64) NULL,
    INDEX idx_created_at (created_at),
    INDEX idx_name (name),
    INDEX idx_email (email),
    INDEX idx_direction (direction),
    INDEX idx_utm_campaign (utm_campaign)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS settings (
    name VARCHAR(100) PRIMARY KEY,
    value TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO settings (name, value) VALUES ('notify_email', 'mrklv001@yandex.ru')
    ON DUPLICATE KEY UPDATE name = name;

CREATE TABLE IF NOT EXISTS admins (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Default admin: username "dzadministrator", password "WeMakeTunnels152!" (CHANGE THIS after first login).
-- Hash generated with bcrypt (compatible with PHP password_verify()).
INSERT INTO admins (username, password_hash) VALUES
    ('dzadministrator', '$2y$12$z4oVGRFOq4ogL1BFRqg5oOr8X50pl6QMCItcw2uJy9ebFQTW1z1bG')
    ON DUPLICATE KEY UPDATE username = username;
