# Personal Investment Portfolio Manager

Django + MySQL web application (Bootstrap 5 + Chart.js frontend comes in Phase 3).

**Status: PHASE 1 (backend) + PHASE 2 (MySQL models/migrations) are written. Frontend is NOT started** - it begins only after you confirm the checklist at the bottom of this file.

---------------------------------------------------------------------

## 1. Backend architecture (what you are getting)

```
Browser / Postman  ->  Django URLs  ->  Views (login + role checks)  ->  Serializers (validation)
                                              |                                   |
                                              v                                   v
                                   portfolio/calculations.py  <-----  Models (ORM)  ->  MySQL
                                   (all the formulas live here)
```

| App | Responsibility | Main files |
|---|---|---|
| `config/` | Settings (reads `.env`), root URLs, health check | `settings.py`, `urls.py` |
| `accounts/` | Registration, login (username **or** email), logout, roles, custom User model, `seed_demo_data` command | `models.py`, `serializers.py`, `views.py` |
| `investments/` | Add / view / update / delete investments, search + category filter, per-user privacy | `models.py`, `views.py` |
| `portfolio/` | Total investment, current value, profit, loss, return %, allocation, chart data | `calculations.py`, `views.py` |
| `reports/` | Saved report snapshots + PDF and CSV download | `services.py`, `exporters.py` |
| `admin_panel/` | Administrator-only: users, activate/deactivate, statistics, activity log | `views.py`, `models.py` |

**Security built in:** passwords hashed (PBKDF2-SHA256), session login, CSRF protection, role-based permissions (`IsAdminRole`), every investor query filtered by `request.user` (another user's record returns 404), secrets only in `.env`, login attempts rate-limited (20/min).

**Formulas** (exactly as in your documentation) are in `backend/portfolio/calculations.py`. Money uses `Decimal`, rounds half-up to 2 decimals (28.125 -> 28.13), and a zero total never causes a division error (result is 0.00). A loss shows as a negative return %.

**Database tables** (see `database/schema.sql`): `users`, `investments`, `reports`, `activity_logs`.

### API endpoints (what the frontend will call later)

| Purpose | Method + URL |
|---|---|
| Register / Login / Logout / Who am I | `POST /api/auth/register/` `POST /api/auth/login/` `POST /api/auth/logout/` `GET /api/auth/me/` |
| Investments CRUD | `GET,POST /api/investments/` `GET,PUT,PATCH,DELETE /api/investments/<id>/` (`?search=` `?category=` `?ordering=`) |
| Dashboard (all in one) | `GET /api/portfolio/dashboard/` |
| Summary, holdings, allocation, category summary, P&L, performance | `GET /api/portfolio/summary/` `holdings/` `allocation/` `category-summary/` `profit-loss/` `performance/` |
| Reports | `GET /api/reports/` `POST /api/reports/generate/` `GET /api/reports/<id>/` `.../pdf/` `.../csv/` |
| Admin | `GET /api/admin/stats/` `GET,POST /api/admin/users/` `PATCH /api/admin/users/<id>/` `POST .../activate/` `.../deactivate/` `GET /api/admin/activity/` |
| Health check (is MySQL connected?) | `GET /api/health/` |

---------------------------------------------------------------------

## 2. Step-by-step setup (Windows first; Mac/Linux differences are noted)

### Step 1 - Install Python
1. Download Python 3.11 or newer from https://www.python.org/downloads/
2. **Tick "Add Python to PATH"** on the first installer screen, then Install.
3. Open a new terminal (VS Code: *Terminal > New Terminal*) and check:
   ```
   python --version
   ```
   (Mac/Linux: use `python3` instead of `python`.)

### Step 2 - Install MySQL
1. Download **MySQL Installer** from https://dev.mysql.com/downloads/installer/ and choose **MySQL Server 8.x** and **MySQL Workbench**.
2. During setup, set a **root password** and remember it.
3. Open **MySQL Workbench**, double-click the "Local instance" connection, enter the root password.

### Step 3 - Create the database
1. In Workbench: *File > New Query Tab*.
2. Open `database/create_database.sql` from this project, copy everything into the tab.
3. **Change `CHANGE_THIS_PASSWORD`** to a password of your choice (remember it - you need it in Step 6).
4. Click the lightning-bolt button (Execute). You should see green "Success" lines.

### Step 4 - Put the project in a folder and open it in VS Code
Unzip the project, then in VS Code: *File > Open Folder* and choose `personal-investment-portfolio-manager`.

### Step 5 - Create a virtual environment and install Django
In the VS Code terminal:
```
cd backend
python -m venv venv
venv\Scripts\activate          (Mac/Linux:  source venv/bin/activate)
pip install -r requirements.txt
```
You should see `(venv)` at the start of the prompt. This installs Django, Django REST Framework, PyMySQL, python-dotenv and reportlab (all free).

### Step 6 - Environment variables
1. Copy `.env.example` to `.env` (inside `backend/`):
   ```
   copy .env.example .env        (Mac/Linux:  cp .env.example .env)
   ```
2. Generate a secret key and paste it after `SECRET_KEY=` in `.env`:
   ```
   python -c "from django.core.management.utils import get_random_secret_key as g; print(g())"
   ```
3. Set `DB_PASSWORD=` to the password you chose in Step 3. Leave the other DB lines as they are.

### Step 7 - Create the tables (migrations)
```
python manage.py makemigrations accounts investments reports admin_panel
python manage.py migrate
```
Expected: a list of "Applying ... OK" lines. In Workbench, refresh the schema panel: you should see `users`, `investments`, `reports`, `activity_logs` inside `portfolio_manager`.

### Step 8 - Add sample test data
```
python manage.py seed_demo_data
```
It prints three logins (admin, abc, priya). `abc` is the worked example from your report: invested 3000, value 3200, profit 200, return 6.67%.

### Step 9 - Run the automated tests
```
python manage.py test
```
Expected at the end: `Ran 60 tests ... OK`. (Django temporarily creates a `test_portfolio_manager` database and removes it afterwards.)

### Step 10 - Start the server and try it
```
python manage.py runserver
```
Open http://127.0.0.1:8000/ - you will see the list of endpoints. Press `Ctrl+C` in the terminal to stop the server.

---------------------------------------------------------------------

## 3. Manual checks in your browser (about 10 minutes)

| # | Do this | You should see |
|---|---|---|
| 1 | Open `/api/health/` | `{"status":"ok","database":"mysql","users":3}` |
| 2 | Open `/api-auth/login/`, log in as `abc` | Redirects to the endpoint list |
| 3 | Open `/api/portfolio/summary/` | total_investment 3000.0, current_value 3200.0, profit 200.0, loss 0.0, return_percentage 6.67 |
| 4 | Open `/api/portfolio/allocation/` | percentages `[37.5, 28.13, 34.38]` |
| 5 | Open `/api/investments/`, scroll to the form, add one with units `0` | Error: "Units must be greater than zero." |
| 6 | Add a valid investment, then open `/api/portfolio/summary/` again | Numbers updated |
| 7 | Open `/api/investments/1/` and press DELETE | 204, record gone |
| 8 | Open `/api/reports/`, press POST on `/api/reports/generate/`, then open `/api/reports/1/pdf/` and `/csv/` | PDF and CSV downloads |
| 9 | Open `/api/admin/stats/` while logged in as `abc` | 403 "Administrator access required." |
| 10 | Log out, log in as `priya` | `/api/investments/` shows ONLY Priya's records |
| 11 | Log in as `admin` (password printed in Step 8), open `/api/admin/stats/`, `/api/admin/users/`, `/api/admin/activity/` | Statistics, user list, activity log |
| 12 | As admin, POST `/api/admin/users/<id of abc>/deactivate/`, then try to log in as `abc` | "This account has been deactivated" |

The Django admin site (`/django-admin/`, log in as `admin`) lets you inspect the MySQL rows too.

---------------------------------------------------------------------

## 4. Troubleshooting

| Message | Fix |
|---|---|
| `Missing environment variable SECRET_KEY` | `.env` is missing or not in `backend/`. Redo Step 6. |
| `Access denied for user 'portfolio_user'` | `DB_PASSWORD` in `.env` differs from the one in `create_database.sql`. |
| `Can't connect to MySQL server on '127.0.0.1'` | MySQL service is not running: Windows *Services > MySQL80 > Start*. |
| `Unknown database 'portfolio_manager'` | Step 3 was not executed. |
| `ModuleNotFoundError` | Virtual environment not active (`venv\Scripts\activate`) or Step 5 skipped. |
| `No changes detected` on makemigrations | Use the full command from Step 7 with all four app names. |
| `'cryptography' package is required` | `pip install cryptography` (it is in requirements.txt). |
| Tests: `Access denied ... test_portfolio_manager` | Re-run `create_database.sql` (it grants the test database permission). |

Only if you cannot get MySQL working yet, set `DB_ENGINE=sqlite` in `.env` to keep experimenting. **Do not use SQLite as your final check - this project must be confirmed on MySQL.**

---------------------------------------------------------------------

## 5. Phase 1 + 2 sign-off checklist (reply to me with these)

- [ ] Step 7 migrations ran without errors and the 4 tables exist in Workbench
- [ ] `python manage.py test` shows OK (paste the last lines if anything fails)
- [ ] `/api/health/` shows `"database":"mysql"`
- [ ] Manual checks 3, 4, 9, 10 and 12 behave as described
- [ ] Any error you hit: paste the full red text and I will fix it

When all are ticked, say **"backend confirmed"** and Phase 3 (frontend) starts. Phase 4-6 (integration, testing, free-tier deployment with its limits explained) follow.

---------------------------------------------------------------------

## 6. Free-tier notes
Everything here is free and open source: Django, DRF, MySQL Community, PyMySQL, reportlab, Bootstrap, Chart.js. Current prices are typed in by the user (no paid market-data API). Locally there is no usage limit. Free cloud hosting limits (sleeping servers, storage caps, MySQL availability) will be documented honestly in Phase 6.
