# VOID - Anonymous Social Platform

VOID is a governance-first anonymous social platform with AI moderation, age-tiered content layers, and an admin dashboard.

## Tech Stack
- **Backend**: Django 5, DRF, Celery, Redis, PostgreSQL
- **Frontend**: Next.js 14, Tailwind CSS, Zustand, React Query
- **Infrastructure**: Docker & Docker Compose

## Quick Start (Local Run)

Since Docker is not available in this environment, follow these steps to run the platform locally:

### 1. Backend (Django)
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 2. Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```

### 🔐 Admin Credentials
- **Email**: `admin@void.com`
- **Password**: `admin123`

- **Backend API**: http://localhost:8000/api/
- **Frontend App**: http://localhost:3000/
- **Admin Panel**: http://localhost:8000/admin/
- **Redis**: localhost:6379

## Local Development (Manual)

### Backend
1. `cd backend`
2. `python -m venv venv`
3. `.\venv\Scripts\activate` (Windows) or `source venv/bin/activate` (Unix)
4. `pip install -r requirements.txt`
5. `python manage.py migrate`
6. `python manage.py runserver`

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`

## AI Moderation
The platform includes an AI-assisted moderation pipeline. When a post is created:
1. A Celery task is triggered.
2. The content is analyzed for toxicity, hate, violence, and self-harm.
3. The post is classified as `SAFE`, `MATURE`, or `PROHIBITED`.
4. `PROHIBITED` posts are hidden; `MATURE` posts are only visible to 18+ users.

## Governance & Strikes
Admins can issue strikes to users. 
- **3 Strikes**: Automatic permanent suspension.
- **Audit Logs**: All moderator actions are logged in the `AuditLog` table.
