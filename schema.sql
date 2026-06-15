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

CREATE TABLE IF NOT EXISTS voltas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    corredor_id INT UNSIGNED NOT NULL,
    numero_volta INT UNSIGNED NOT NULL,
    tempo DECIMAL(8,3) UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (corredor_id) REFERENCES corredores(id) ON DELETE CASCADE,
    INDEX idx_corredor_id (corredor_id),
    INDEX idx_numero_volta (numero_volta)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
