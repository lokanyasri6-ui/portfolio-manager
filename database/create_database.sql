-- Run this ONCE in MySQL Workbench (File > New Query Tab > paste > click the lightning bolt),
-- logged in as "root". It creates the empty database and a dedicated user for the app.
--
-- IMPORTANT: change CHANGE_THIS_PASSWORD to your own password, and use the SAME
-- password as DB_PASSWORD in backend/.env. Never commit real passwords to GitHub.

CREATE DATABASE IF NOT EXISTS portfolio_manager
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'portfolio_user'@'localhost' IDENTIFIED BY 'CHANGE_THIS_PASSWORD';

-- Full rights on the app database, plus rights on test databases (Django creates
-- "test_portfolio_manager" temporarily when you run "python manage.py test").
GRANT ALL PRIVILEGES ON portfolio_manager.* TO 'portfolio_user'@'localhost';
GRANT ALL PRIVILEGES ON `test\_portfolio\_manager`.* TO 'portfolio_user'@'localhost';
FLUSH PRIVILEGES;
