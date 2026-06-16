CREATE DATABASE IF NOT EXISTS cowabunga_f1 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cowabunga_f1;

CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(180) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    role ENUM('admin','user') NOT NULL DEFAULT 'admin',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL,
    INDEX idx_email (email),
    INDEX idx_nome (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS corredores (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    turma VARCHAR(80) NULL DEFAULT NULL,
    equipe VARCHAR(80) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL,
    INDEX idx_equipe (equipe),
    INDEX idx_turma (turma)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pistas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(120) NOT NULL UNIQUE,
    localizacao VARCHAR(120) NULL DEFAULT NULL,
    distancia_km DECIMAL(6,3) UNSIGNED NULL DEFAULT NULL,
    descricao VARCHAR(255) NULL DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL,
    INDEX idx_nome (nome),
    INDEX idx_localizacao (localizacao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS voltas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    corredor_id INT UNSIGNED NOT NULL,
    pista_id INT UNSIGNED NOT NULL,
    numero_volta INT UNSIGNED NOT NULL,
    tempo DECIMAL(8,3) UNSIGNED NOT NULL,
    tipo_ocorrencia ENUM('normal','acidente','desclassificacao') NOT NULL DEFAULT 'normal',
    observacao_ocorrencia VARCHAR(255) NULL DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_voltas_corredores FOREIGN KEY (corredor_id) REFERENCES corredores(id) ON DELETE CASCADE,
    CONSTRAINT fk_voltas_pistas FOREIGN KEY (pista_id) REFERENCES pistas(id) ON DELETE CASCADE,
    INDEX idx_corredor_id (corredor_id),
    INDEX idx_pista_id (pista_id),
    INDEX idx_numero_volta (numero_volta)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pitstops (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    corredor_id INT UNSIGNED NOT NULL,
    pista_id INT UNSIGNED NOT NULL,
    problema VARCHAR(160) NOT NULL,
    causa VARCHAR(160) NOT NULL,
    resolvido TINYINT(1) NOT NULL DEFAULT 0,
    observacao VARCHAR(255) NULL DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL,
    CONSTRAINT fk_pitstops_corredores FOREIGN KEY (corredor_id) REFERENCES corredores(id) ON DELETE CASCADE,
    CONSTRAINT fk_pitstops_pistas FOREIGN KEY (pista_id) REFERENCES pistas(id) ON DELETE CASCADE,
    INDEX idx_pitstops_corredor_id (corredor_id),
    INDEX idx_pitstops_pista_id (pista_id),
    INDEX idx_pitstops_resolvido (resolvido)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO pistas (nome, localizacao, descricao)
VALUES ('Pista Principal', 'Cowabunga F1', 'Pista padrao para preservar voltas antigas.');

SET @default_pista_id := (SELECT id FROM pistas WHERE nome = 'Pista Principal' LIMIT 1);

SET @add_pista_id := (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE voltas ADD COLUMN pista_id INT UNSIGNED NULL AFTER corredor_id',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'voltas'
      AND COLUMN_NAME = 'pista_id'
);
PREPARE stmt FROM @add_pista_id;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE voltas SET pista_id = @default_pista_id WHERE pista_id IS NULL;
UPDATE voltas v
LEFT JOIN pistas p ON p.id = v.pista_id
SET v.pista_id = @default_pista_id
WHERE p.id IS NULL;
ALTER TABLE voltas MODIFY pista_id INT UNSIGNED NOT NULL;

SET @add_voltas_pista_idx := (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE voltas ADD INDEX idx_pista_id (pista_id)',
        'SELECT 1'
    )
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'voltas'
      AND INDEX_NAME = 'idx_pista_id'
);
PREPARE stmt FROM @add_voltas_pista_idx;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_voltas_pista_fk := (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE voltas ADD CONSTRAINT fk_voltas_pistas FOREIGN KEY (pista_id) REFERENCES pistas(id) ON DELETE CASCADE',
        'SELECT 1'
    )
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'voltas'
      AND COLUMN_NAME = 'pista_id'
      AND REFERENCED_TABLE_NAME = 'pistas'
);
PREPARE stmt FROM @add_voltas_pista_fk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_tipo_ocorrencia := (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE voltas ADD COLUMN tipo_ocorrencia ENUM(''normal'',''acidente'',''desclassificacao'') NOT NULL DEFAULT ''normal'' AFTER tempo',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'voltas'
      AND COLUMN_NAME = 'tipo_ocorrencia'
);
PREPARE stmt FROM @add_tipo_ocorrencia;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_observacao_ocorrencia := (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE voltas ADD COLUMN observacao_ocorrencia VARCHAR(255) NULL DEFAULT NULL AFTER tipo_ocorrencia',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'voltas'
      AND COLUMN_NAME = 'observacao_ocorrencia'
);
PREPARE stmt FROM @add_observacao_ocorrencia;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

