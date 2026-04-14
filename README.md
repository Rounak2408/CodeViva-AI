# CodeViva AI

CodeViva AI is a premium repository intelligence platform for students, faculty, and hiring teams.
It analyzes GitHub repositories or ZIP uploads and generates deep, actionable insights across originality, quality, architecture, security, viva readiness, and interview readiness.

---

## What You Get

- AI likelihood and code originality signals
- Code quality scoring (structure, naming, reusability, performance)
- Auto-generated viva and interview questions with expected answers
- Security and architecture summaries
- Rich results dashboards and compare dashboards
- Report sharing and PDF export flow
- Email/password auth + OAuth-ready auth architecture
- Responsive UI optimized for mobile, laptop, and desktop

---

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **UI**: Tailwind CSS v4, Base UI, Framer Motion, Recharts
- **Auth**: Auth.js / NextAuth v5 (Prisma adapter + credentials)
- **Database**: PostgreSQL + Prisma ORM
- **Validation**: Zod
- **Uploads**: UploadThing

---

## Quick Start (Local)

### 1) Clone and install

```bash
git clone https://github.com/Rounak2408/CodeViva-AI.git
cd CodeViva-AI
npm install
```

### 2) Configure environment

Create a `.env` file in project root:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/codeviva"
DIRECT_DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/codeviva"

AUTH_SECRET="generate-a-strong-random-secret"
NEXTAUTH_URL="http://localhost:3000"

# Optional
# GITHUB_TOKEN="ghp_xxx"               # for higher GitHub API limits
# GITHUB_ID="oauth-client-id"          # GitHub OAuth
# GITHUB_SECRET="oauth-client-secret"
# GOOGLE_CLIENT_ID="oauth-client-id"   # Google OAuth
# GOOGLE_CLIENT_SECRET="oauth-client-secret"
# OPENAI_API_KEY="sk-..."
# UPLOADTHING_TOKEN="..."
```

### 3) Sync Prisma schema

```bash
npx prisma generate
npx prisma db push
```

### 4) Run dev server

```bash
npm run dev
```

Open: [http://localhost:3000](http://localhost:3000)

---

## Scripts

- `npm run dev` - start local development server
- `npm run build` - production build
- `npm run start` - run production server
- `npm run lint` - run eslint
- `npm run db:push` - push schema changes to DB
- `npm run db:migrate` - create/apply Prisma migration (dev)

---

## Core Routes

- `/` - Landing page
- `/analyzer` - GitHub/ZIP analysis flow
- `/results/[scanId]` - full analysis dashboard
- `/compare` - side-by-side repository comparison
- `/history` - user scan history
- `/team` - team workspace placeholder

API:
- `/api/scan`
- `/api/compare`
- `/api/auth/[...nextauth]`
- `/api/report/[scanId]/pdf`

---

## Deployment (Vercel)

1. Push code to GitHub
2. Import repo into Vercel
3. Add all required environment variables
4. Point `NEXTAUTH_URL` to your Vercel domain
5. Run Prisma schema on production DB (`npx prisma db push`)
6. Redeploy

Recommended production DB providers: Neon, Supabase, Railway PostgreSQL.

---

## Current Status

CodeViva AI includes:
- polished auth UX
- multi-page responsive layout
- analyzer + result pipelines
- compare intelligence dashboard

If you want to contribute, open an issue or submit a PR with a clear change summary and test notes.
