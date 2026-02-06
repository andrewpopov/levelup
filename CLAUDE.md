# Level Up Journal

A personal growth journaling platform with guided journeys, behavioral interview prep, and couple's reflection tools.

## Tech Stack
- **Backend:** Node.js, Express, SQLite, JWT auth, ESM modules
- **Frontend:** React 18, Vite, React Router, Axios, Lucide icons
- **Production:** PM2 process manager, Cloudflare tunnel

## Project Structure
```
backend/           Express API server
  routes/          API route handlers
  repositories/    Data access layer (BaseRepository pattern)
  services/        Business logic
  middleware/      Express middleware (requireAdmin, etc.)
  scripts/         CLI tools (seed scripts, make-admin)
  core/            Domain events, database utils
frontend/          React SPA
  src/components/  React components
  src/api.js       Axios API client
scripts/           Deployment and tooling
  deploy.sh        Production deploy script
  tools/           PM2 start scripts
```

## Development
```bash
npm run dev          # Start both backend (nodemon) and frontend (vite) concurrently
npm run dev:backend  # Backend only
npm run dev:frontend # Frontend only
```

## Production Server

**Host:** `admin@192.168.50.3`
**Path:** `/home/admin/proj/levelup`
**URL:** `https://levelup.andrewvpopov.com`
**Node:** v22 on server (v24 locally)
**PM2 processes:** `levelup-app` (port 8081), `levelup-tunnel` (Cloudflare)

### Deploy

**Quick deploy (from local machine):**
```bash
# 1. Commit and push
git push origin master

# 2. SSH in and run deploy script
ssh -o RequestTTY=no -o RemoteCommand=none admin@192.168.50.3 \
  "cd /home/admin/proj/levelup && bash scripts/deploy.sh"
```

**Manual deploy steps (if deploy script fails):**
```bash
ssh -o RequestTTY=no -o RemoteCommand=none admin@192.168.50.3 "
  cd /home/admin/proj/levelup &&
  git pull origin master &&
  cd backend && npm ci --omit=dev && cd .. &&
  cd frontend && npm install && npm run build && cd .. &&
  pm2 restart levelup-app
"
```

**First-time setup on server:**
```bash
ssh -o RequestTTY=no -o RemoteCommand=none admin@192.168.50.3 "
  cd /home/admin/proj/levelup &&
  mkdir -p logs &&
  pm2 start ecosystem.config.js --only levelup-app &&
  pm2 start ecosystem.config.js --only levelup-tunnel &&
  pm2 save
"
```

### PM2 Commands (run on server)
```bash
pm2 logs levelup-app --lines 50    # View recent logs
pm2 status                          # Check process status
pm2 restart levelup-app             # Restart app
pm2 stop levelup-app                # Stop app
pm2 delete levelup-app              # Remove from PM2
```

### Troubleshooting
- **Port in use:** `fuser -k 8081/tcp` then `pm2 restart levelup-app`
- **Lock file conflict on pull:** `git checkout -- package-lock.json` then pull
- **Frontend npm ci fails:** Use `npm install` instead (lock file may be out of sync)
- **dotenv not loading:** `import 'dotenv/config'` must be the first import in server.js (ESM evaluates imports before module body)

## Environment Variables (backend/.env)
```
NODE_ENV=production
PORT=8081
JWT_SECRET=<generated-secret>
UPLOAD_DIR=./uploads
GOOGLE_CLIENT_ID=<optional-google-oauth-client-id>
```

## Admin Setup
```bash
# Promote a user to admin (run on server in backend/ directory)
node scripts/make-admin.js user@example.com
```

## Key Patterns
- **Auth:** JWT tokens (7-day expiry), bcrypt password hashing, optional Google OAuth
- **DB:** SQLite with promise-wrapped BaseRepository pattern
- **Roles:** Stored in `user_roles` table, checked server-side via `requireAdmin` middleware (NOT in JWT)
- **Settings:** `system_settings` key-value table for feature flags (e.g., `allow_signups`)
- **ESM:** All backend code uses ES modules (`"type": "module"` in package.json)
