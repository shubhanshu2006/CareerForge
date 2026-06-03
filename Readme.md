<div align="center">

<h1>
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/nextjs/nextjs-original.svg" width="28" style="vertical-align:middle"/> &nbsp;
  CareerForge
</h1>

<p><strong>Discover opportunities before everyone else. Track every application. Learn from every interview.</strong></p>

<a href="https://career-forge-gamma.vercel.app" target="_blank">
  <img src="https://img.shields.io/badge/🚀%20Live%20Demo-career--forge--gamma.vercel.app-orange?style=for-the-badge" alt="Live Demo"/>
</a>

<br/><br/>

<!-- Tech Stack Badges -->
<img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js"/>
<img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
<img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React"/>
<img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js"/>
<img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express"/>
<img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
<img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma"/>
<img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis"/>
<img src="https://img.shields.io/badge/BullMQ-CC0000?style=for-the-badge&logo=bull&logoColor=white" alt="BullMQ"/>
<img src="https://img.shields.io/badge/Clerk-6C47FF?style=for-the-badge&logo=clerk&logoColor=white" alt="Clerk"/>
<img src="https://img.shields.io/badge/Playwright-2EAD33?style=for-the-badge&logo=playwright&logoColor=white" alt="Playwright"/>
<img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel"/>
<img src="https://img.shields.io/badge/Brevo-0B996E?style=for-the-badge&logo=sendinblue&logoColor=white" alt="Brevo"/>

</div>

---

## What is CareerForge?

CareerForge is a **Career Operating System** built for students and early-career professionals. While traditional job boards surface opportunities *after* they've already accumulated hundreds of applicants, CareerForge continuously monitors company career pages and exclusive hiring sources to surface jobs the moment they go live.

Finding the job is only step one. CareerForge also helps you organize applications, track every interview round, and continuously improve — all from a single dashboard.

🔗 **[career-forge-gamma.vercel.app](https://career-forge-gamma.vercel.app)**

---

## The Problem

Modern job searching is fragmented and reactive.

```
Find Jobs → Save Links → Apply → Track in Excel → Forget Feedback → Get Rejected
```

Most candidates open the same five sites every day — LinkedIn, Indeed, Glassdoor, company pages — and still miss the best roles because they were already filled before hitting the boards.

---

## The Solution

```
Company Career Pages
        ↓
CareerForge Pipeline (500+ sources, <5 min detection)
        ↓
Fresh Opportunities → Matched to Your Preferences
        ↓
Apply Early → Track Progress → Record Outcomes
        ↓
Land Better Offers
```

---

## Core Features

| Feature | Description |
|---|---|
| ⚡ **Early Discovery** | Monitors 500+ company career pages. Alerts you in under 5 minutes. |
| 🎯 **Personalized Feed** | Surfaces jobs matching your skills, locations, and role preferences. |
| 📋 **Application Tracker** | Full lifecycle tracking: Saved → Applied → OA → Interview → Offer / Rejected. |
| 🔔 **Instant Alerts** | In-app and email notifications via Brevo the moment a match is found. |
| 📝 **Interview Notes** | Log questions, feedback, and outcomes for every round. |
| 📊 **Dashboard Analytics** | Overview of total applications, interviews, offers, and rejections. |
| 🔖 **Saved Jobs** | Bookmark roles for later without leaving the app. |

---

## System Architecture

```
                  ┌──────────────────┐
                  │  Next.js 16      │
                  │  Frontend        │
                  │  (Vercel)        │
                  └────────┬─────────┘
                           │  REST API
                           ▼
                  ┌──────────────────┐
                  │  Express Backend │
                  │  (Node.js + TS)  │
                  └────────┬─────────┘
                           │
          ┌────────────────┴────────────────┐
          ▼                                 ▼
  ┌───────────────┐               ┌──────────────────┐
  │  PostgreSQL   │               │  BullMQ Workers  │
  │  + Prisma ORM │               │  + Redis         │
  │  (Neon)       │               └────────┬─────────┘
  └───────────────┘                        │
                                           ▼
                                 ┌──────────────────┐
                                 │  Ingestion       │
                                 │  Deduplication   │
                                 │  Notifications   │
                                 │  (Brevo Email)   │
                                 └──────────────────┘
```

---

## Tech Stack

### Frontend
- **Next.js 16** + **React 19** + **TypeScript**
- **Clerk** — authentication
- **Spline** — 3D hero animation
- **react-hot-toast**, **react-icons**

### Backend
- **Express 5** + **Node.js** + **TypeScript**
- **Prisma ORM** + **PostgreSQL** (Neon)
- **BullMQ** + **Redis** — job queues and background workers
- **Clerk SDK** — server-side auth
- **Playwright** — headless scraping for company sites
- **Brevo** — transactional email

### Infrastructure
- **Vercel** — frontend deployment
- **Neon** — serverless PostgreSQL
- **Redis** — queue broker

---

## Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL database (or Neon connection string)
- Redis instance
- Clerk account
- Brevo API key

### Setup

```bash
# Clone the repo
git clone https://github.com/your-username/CareerForge.git
cd CareerForge

# Install root dependencies
npm install

# Backend
cd backend
cp .env.example .env   # fill in your secrets
npm install
npx prisma migrate dev

# Frontend
cd ../frontend
npm install
```

### Run

```bash
# Backend (from /backend)
npm run dev

# Frontend (from /frontend)
npm run dev

# Run full ingestion pipeline
cd backend && npm run ingest

# Run individual source
npm run ingest-greenhouse
npm run ingest-ashby
npm run ingest-adzuna
```

---

## Ingestion Commands

| Command | Source |
|---|---|
| `npm run ingest` | All pipelines (Greenhouse + Ashby + Adzuna + SmartRecruiters + Company Sites) |
| `npm run ingest-greenhouse` | Greenhouse ATS |
| `npm run ingest-ashby` | Ashby ATS |
| `npm run ingest-adzuna` | Adzuna job API |
| `npm run ingest-company-sites` | Playwright-scraped company career pages |

---

## Vision

> CareerForge is not a job board. It's a Career Operating System.

```
Discover Opportunities → Apply Early → Track Applications → Record Interview Experiences → Land Better Offers
```

Every application becomes data. Every interview becomes feedback.

---

<div align="center">

Made with ♥ by **Shubhanshu Singh**

[career-forge-gamma.vercel.app](https://career-forge-gamma.vercel.app)

</div>
