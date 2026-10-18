# Project Management Tool

Full-stack project manager: **Django REST Framework + React (Vite) + PostgreSQL**, with JWT authentication.

## Features
- Register / log in (JWT)
- Create projects, add team members by username
- Kanban-style board (To Do / In Progress / Done) with priority, assignee, due date
- Task comments, per-project progress bar
- Access control: you only see projects you belong to; only owners can edit/delete a project

## Structure
```
backend/    Django project (config/) + app (projects/)
frontend/   React + Vite app
docker-compose.yml   PostgreSQL (+ optional backend container)
```

> Works with Python 3.9+ (Django 4.2 LTS). Run all `manage.py` commands from inside the `backend` folder.

## Option A: Local setup (PostgreSQL via Docker)

```bash
# 1. Database
docker compose up -d db

# 2. Backend
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env              # Windows: copy .env.example .env
python manage.py makemigrations projects
python manage.py migrate
python manage.py createsuperuser  # optional, for /admin/
python manage.py runserver        # http://localhost:8000

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev                       # http://localhost:5173
```

## Option B: No PostgreSQL (SQLite)
In `backend/.env` set `DB_ENGINE=sqlite` (or delete the DB_* lines) and skip the `docker compose` step.

## Option C: Everything in Docker (db + backend)
```bash
docker compose up --build
cd frontend && npm install && npm run dev
```

## API
| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/auth/register/ | Create account |
| POST | /api/auth/login/ | Get JWT tokens |
| GET | /api/auth/me/ | Current user |
| GET/POST | /api/projects/ | List / create projects |
| GET/PUT/DELETE | /api/projects/{id}/ | Project detail (owner-only writes) |
| POST | /api/projects/{id}/add_member/ | Body: `{"username": "..."}` |
| GET/POST | /api/tasks/?project={id} | List / create tasks |
| PATCH/DELETE | /api/tasks/{id}/ | Update / delete task |
| GET/POST | /api/comments/?task={id} | List / add comments |

## Production notes
- Set a strong `SECRET_KEY`, `DEBUG=False`, and real `ALLOWED_HOSTS` / `CORS_ALLOWED_ORIGINS`.
- Build the frontend with `npm run build` and serve `frontend/dist` (Nginx, or Vercel/Netlify) pointing `/api` at the backend.
- Run `python manage.py collectstatic` if you serve the admin.
