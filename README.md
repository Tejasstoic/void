<<<<<<< HEAD
# VOID – Governance-First Anonymous Social Platform

VOID is a production-ready, industry-standard, scalable anonymous social media platform focused on public anonymity, internal accountability, and transparent AI-assisted governance.

## 🚀 Features (Status: Deployed to Vercel/Render)

- **Anonymous Interaction**: Public anonymity with randomized aliases.
- **Internal Accountability**: Strike-based governance system for community safety.
- **Age-Tiered Content**: SAFE (General) and MATURE (Restricted Zone) content layers.
- **AI-Assisted Moderation**: Automated classification of pulses (SAFE, MATURE, PROHIBITED).
- **Admin Dashboard**: Real-time analytics, moderation queue, and user strike management.
- **Social Features**: Reactions (Hearts), Nested Comments, Bookmarks, and Shareable Links.
- **Premium UI**: High-end dark-first design with Glassmorphism and smooth animations.

## 🏗️ Architecture

- **Backend**: Django 5+, DRF, PostgreSQL, Celery, Redis, SimpleJWT.
- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, Zustand, React Query, Framer Motion.
- **Deployment**: Dockerized services for horizontal scaling.

## 🛠️ Getting Started

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### Quick Start with Docker

1. Clone the repository:
   ```bash
   git clone https://github.com/Tejasstoic/void-platform.git
   cd void-platform
   ```

2. Generate environment configuration:
   ```bash
   cp .env.example .env
   # Edit .env with your specific secrets
   ```

3. Build and launch the platform:
   ```bash
   docker-compose up --build
   ```

4. The platform will be available at:
   - Frontend: `http://localhost:3000`
   - Backend API: `https://void-backend-kia3.onrender.com/api`

### Local Development Setup

#### Backend
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## ⚖️ Governance Model

- **SAFE**: Default view. Content verified as non-toxic.
- **MATURE**: Restricted Zone (18+). Content with adult themes or higher toxicity scores.
- **PROHIBITED**: Blocked automatically or by Sentinels.
- **STRIKE SYSTEM**: 3 strikes result in permanent expulsion from the protocol.

## 🛡️ Security

- JWT-based authorization.
- PBKDF2 with SHA256 password hashing.
- Role-based access control (RBAC).
- CORS policies and rate limiting preparation.

## 📝 License

Proprietary. Built for Tejasstoic.
=======
# void-platform
Governance-first anonymous social platform with age-tiered access.
"# void" 
>>>>>>> a4a70b6cc17c67a3419a4ccad7e272860a377b88
