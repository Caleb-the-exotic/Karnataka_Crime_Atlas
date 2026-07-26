# Karnataka Crime Intelligence & Analytics Platform (CIAP)

Official Crime Intelligence & Analytical Platform for the **Karnataka State Police (KSP)** and **State Crime Records Bureau (SCRB)**.

---

## 🚀 Key Features

- **Command Center Dashboard**: Live crime alerts, high-risk window tracking, and command module quick launches.
- **Geospatial Crime Map**: WGS-84 Leaflet map with district rollups, 90-day interactive timeline slider, location typeahead search, and GIS layer controls.
- **Multi-Provider AI Assistant**: Context-aware AI chatbot powered by Groq (`llama-3.3-70b-versatile`), OpenRouter (`meta-llama/llama-3.3-70b-instruct`), Tavily Search API, and a local CSV fallback engine.
- **Complaint Submission & Formspree Integration**: Official citizen complaint submission form connected directly to Formspree email dispatch, updating live analytics instantly.
- **Full-Stack FIR & Ingestion Backend**: Node.js, Express, TypeScript, and Prisma ORM implementing the official Karnataka Police FIR database schema (20+ tables).
- **Excel Data Ingestion Pipeline**: Ingests district-wise, IPC/SLL, vulnerable group, and historical crime Excel files into PostgreSQL with error logging and re-import support.

---

## 🛠️ Tech Stack

### Frontend & Web Application
- **Framework**: TanStack Start / Vite / React 19 / TypeScript
- **Styling**: Tailwind CSS v4, Vanilla CSS Design System (Geist & Manrope typography)
- **Mapping & Charts**: Leaflet (Heatmap & Clusters), Apache ECharts, Recharts
- **Icons**: Lucide React

### Backend Server (`server/`)
- **Runtime**: Node.js / Express / TypeScript
- **ORM & Database**: Prisma ORM with PostgreSQL
- **File Uploads**: Multer (Excel & Evidence attachments)
- **Logging**: Winston logger

---

## ⚙️ Setup & Execution Instructions

### Prerequisites
- Node.js (v18+ or v20+)
- npm or bun
- PostgreSQL (v14+ for the backend database)

---

### 1. Frontend Web App Setup

```bash
# Clone the repository
git clone https://github.com/Caleb-the-exotic/Karnataka_Crime_Atlas.git
cd Karnataka_Crime_Atlas

# Install dependencies
npm install

# Start local development server
npm run dev
```

The web application will open at `http://localhost:5173`.

#### Production Build & Deployment Artifact
```bash
# Build production bundle (generates both static dist/ and Nitro output)
npm run build

# Preview build locally
npm run preview
```

---

### 2. Backend Server Setup (`server/`)

```bash
# Navigate to backend directory
cd server

# Install backend dependencies
npm install

# Create environment configuration
cp .env.example .env
```

Edit `server/.env` to configure your PostgreSQL database string:
```env
DATABASE_URL="postgresql://ciap_user:ciap_pass@localhost:5432/ciap_db?schema=public"
PORT=4000
```

```bash
# Run Prisma database migrations
npm run prisma:migrate

# Seed master tables (Districts, Acts, Ranks, Case Status, etc.)
npm run prisma:seed

# Start backend server in watch mode
npm run dev
```

The backend API will run on `http://localhost:4000/api/v1`.

---

## 📖 API Documentation

Comprehensive REST API documentation for complaints, Excel ingestion, search, and AI knowledge is available in [`server/README.md`](file:///c:/Users/Aarthy/Desktop/intel-atlas-nexus-main/server) and the generated artifact files.
