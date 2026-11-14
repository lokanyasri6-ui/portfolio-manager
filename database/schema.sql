-- =====================================================================
-- REFERENCE SCHEMA (MySQL 8) - Personal Investment Portfolio Manager
--
-- You do NOT run this file to set up the project. Django creates these tables
-- for you with "python manage.py migrate" (migrations are the source of truth).
-- This file is for documentation, your project report, and for drawing the ER
-- diagram in MySQL Workbench (Database > Reverse Engineer).
--
-- Django also creates its own tables (django_session, auth_permission, ...).
-- =====================================================================

-- 1. USERS --------------------------------------------------------------
CREATE TABLE users (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  password      VARCHAR(128) NOT NULL,                -- salted PBKDF2-SHA256 hash, never plain text
  last_login    DATETIME(6)  NULL,
  is_superuser  TINYINT(1)   NOT NULL,
  username      VARCHAR(150) NOT NULL,
  first_name    VARCHAR(150) NOT NULL,
  last_name     VARCHAR(150) NOT NULL,
  email         VARCHAR(254) NOT NULL,
  is_staff      TINYINT(1)   NOT NULL,
  is_active     TINYINT(1)   NOT NULL,                -- administrator can deactivate an account
  date_joined   DATETIME(6)  NOT NULL,
  full_name     VARCHAR(150) NOT NULL,
  role          VARCHAR(10)  NOT NULL DEFAULT 'investor',   -- 'investor' | 'admin'
  CONSTRAINT uq_users_username UNIQUE (username),
  CONSTRAINT uq_users_email    UNIQUE (email),
  INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. INVESTMENTS --------------------------------------------------------
CREATE TABLE investments (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id         BIGINT        NOT NULL,
  name            VARCHAR(120)  NOT NULL,
  category        VARCHAR(20)   NOT NULL,              -- 'stocks' | 'mutual_funds' | 'others'
  units           DECIMAL(18,4) NOT NULL,
  purchase_price  DECIMAL(18,4) NOT NULL,
  current_price   DECIMAL(18,4) NOT NULL,              -- entered manually (no paid market API)
  investment_date DATE          NOT NULL,
  notes           LONGTEXT      NOT NULL,
  created_at      DATETIME(6)   NOT NULL,
  updated_at      DATETIME(6)   NOT NULL,
  CONSTRAINT fk_investments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT investment_units_positive               CHECK (units > 0),
  CONSTRAINT investment_purchase_price_positive      CHECK (purchase_price > 0),
  CONSTRAINT investment_current_price_not_negative   CHECK (current_price >= 0),
  INDEX idx_inv_user_category (user_id, category),
  INDEX idx_inv_user_date     (user_id, investment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. REPORTS (snapshots) ------------------------------------------------
CREATE TABLE reports (
  id                BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id           BIGINT        NOT NULL,
  title             VARCHAR(150)  NOT NULL,
  generated_at      DATETIME(6)   NOT NULL,
  total_investment  DECIMAL(24,2) NOT NULL,
  current_value     DECIMAL(24,2) NOT NULL,
  profit            DECIMAL(24,2) NOT NULL,
  loss              DECIMAL(24,2) NOT NULL,
  return_percentage DECIMAL(24,2) NOT NULL,
  investment_count  INT UNSIGNED  NOT NULL DEFAULT 0,
  allocation        JSON          NOT NULL,            -- category-wise rows
  holdings          JSON          NOT NULL,            -- one row per investment
  CONSTRAINT fk_reports_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_reports_user_generated (user_id, generated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. ACTIVITY LOGS ------------------------------------------------------
CREATE TABLE activity_logs (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id      BIGINT       NULL,                      -- NULL for failed logins / deleted users
  action       VARCHAR(30)  NOT NULL,
  description  VARCHAR(255) NOT NULL,
  ip_address   VARCHAR(39)  NULL,
  created_at   DATETIME(6)  NOT NULL,
  CONSTRAINT fk_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_logs_action (action),
  INDEX idx_logs_created (created_at),
  INDEX idx_logs_user_created (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Relationships:
--   users 1 ---- * investments      (each investment belongs to exactly one user)
--   users 1 ---- * reports
--   users 1 ---- * activity_logs
