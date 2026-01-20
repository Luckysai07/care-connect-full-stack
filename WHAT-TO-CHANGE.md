# 🎯 WHAT YOU NEED TO CHANGE - VISUAL GUIDE

## ⚠️ ONLY 2 FILES NEED CHANGES!

---

## 📁 FILE 1: backend/.env

### 🔴 REQUIRED CHANGES (3 items):

```env
# ============================================
# 1. DATABASE PASSWORD
# ============================================
DATABASE_PASSWORD=YOUR_POSTGRES_PASSWORD_HERE  # ⚠️ CHANGE THIS!
# Replace with your PostgreSQL password

# ============================================
# 2. JWT ACCESS SECRET
# ============================================
JWT_ACCESS_SECRET=PASTE_GENERATED_SECRET_HERE  # ⚠️ CHANGE THIS!
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# ============================================
# 3. JWT REFRESH SECRET  
# ============================================
JWT_REFRESH_SECRET=PASTE_DIFFERENT_SECRET_HERE  # ⚠️ CHANGE THIS!
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### ✅ How to Generate JWT Secrets:
```powershell
# Run this command TWICE to get two different secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Example output:
# 8f7a9b2c4d6e1f3a5b7c9d2e4f6a8b1c3d5e7f9a2b4c6d8e1f3a5b7c9d2e4f6a

# Copy first output → Paste into JWT_ACCESS_SECRET
# Run again, copy second output → Paste into JWT_REFRESH_SECRET
```

---

## 📁 FILE 2: frontend/.env

### ✅ NO CHANGES NEEDED!

The default values work perfectly:
```env
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

**Just copy .env.example to .env:**
```powershell
cd frontend
cp .env.example .env
```

---

## 🚫 WHAT YOU DON'T NEED TO CHANGE

### ✅ All Code Files
- ✅ All .js, .ts, .tsx files are ready to use
- ✅ No hardcoded values
- ✅ Everything configured via .env

### ✅ Optional API Keys (Can add later)
- Google Maps API Key
- Firebase credentials
- Twilio SMS credentials

---

## 📊 SUMMARY

| File | Changes Required | What to Change |
|------|------------------|----------------|
| `backend/.env` | ✅ YES | 1. Database password<br>2. JWT access secret<br>3. JWT refresh secret |
| `frontend/.env` | ❌ NO | Just copy from .env.example |
| All other files | ❌ NO | Ready to use! |

---

## 🎯 STEP-BY-STEP SETUP

### 1. Backend .env
```powershell
cd backend
cp .env.example .env
notepad .env  # Or use your preferred editor

# Change these 3 lines:
# - DATABASE_PASSWORD
# - JWT_ACCESS_SECRET (generate with crypto command)
# - JWT_REFRESH_SECRET (generate with crypto command)
```

### 2. Frontend .env
```powershell
cd frontend
cp .env.example .env
# ✅ Done! No changes needed
```

### 3. Install & Run
```powershell
# Backend
cd backend
npm install
npm run migrate
npm run seed
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

### 4. Test
- Open: http://localhost:5173
- Login: admin@careconnect.com / Password123!

---

## 🔍 EXAMPLE: Complete backend/.env

```env
# ============================================
# SERVER CONFIGURATION
# ============================================
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

# ============================================
# DATABASE CONFIGURATION
# ============================================
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=careconnect
DATABASE_USER=postgres
DATABASE_PASSWORD=myPostgresPassword123  # ⚠️ YOUR PASSWORD HERE
DATABASE_URL=postgresql://postgres:myPostgresPassword123@localhost:5432/careconnect

# ============================================
# REDIS CONFIGURATION
# ============================================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_URL=redis://localhost:6379

# ============================================
# JWT SECRETS
# ============================================
JWT_ACCESS_SECRET=8f7a9b2c4d6e1f3a5b7c9d2e4f6a8b1c3d5e7f9a2b4c6d8e1f3a5b7c9d2e4f6a  # ⚠️ GENERATED SECRET
JWT_REFRESH_SECRET=1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b  # ⚠️ DIFFERENT SECRET
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# ============================================
# BCRYPT CONFIGURATION
# ============================================
BCRYPT_ROUNDS=12

# ============================================
# RATE LIMITING
# ============================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
SOS_RATE_LIMIT_MAX=3
SOS_RATE_LIMIT_WINDOW_MS=3600000

# ============================================
# EXTERNAL APIS (Optional - can add later)
# ============================================
GOOGLE_MAPS_API_KEY=
FIREBASE_SERVER_KEY=
FIREBASE_PROJECT_ID=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# ============================================
# AWS S3 CONFIGURATION (Optional)
# ============================================
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=careconnect-uploads
AWS_REGION=us-east-1

# ============================================
# LOGGING
# ============================================
LOG_LEVEL=info
LOG_FILE_PATH=logs/app.log

# ============================================
# SECURITY
# ============================================
CORS_ORIGIN=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# ============================================
# GEO-SPATIAL CONFIGURATION
# ============================================
GEO_SEARCH_RADIUS_STEP_1=1000
GEO_SEARCH_RADIUS_STEP_2=3000
GEO_SEARCH_RADIUS_STEP_3=5000
GEO_SEARCH_RADIUS_STEP_4=10000
MAX_VOLUNTEERS_TO_NOTIFY=10

# ============================================
# SOS CONFIGURATION
# ============================================
SOS_ESCALATION_TIMEOUT_MS=120000
LOCATION_UPDATE_INTERVAL_MS=5000
```

---

## ✅ CHECKLIST

- [ ] Copy backend/.env.example to backend/.env
- [ ] Change DATABASE_PASSWORD in backend/.env
- [ ] Generate JWT_ACCESS_SECRET (run crypto command)
- [ ] Generate JWT_REFRESH_SECRET (run crypto command again)
- [ ] Copy frontend/.env.example to frontend/.env (no changes needed)
- [ ] Install PostgreSQL with PostGIS
- [ ] Install Redis
- [ ] Run `npm install` in backend
- [ ] Run `npm install` in frontend
- [ ] Run `npm run migrate` in backend
- [ ] Run `npm run seed` in backend
- [ ] Start backend with `npm run dev`
- [ ] Start frontend with `npm run dev`
- [ ] Test at http://localhost:5173

---

**🎉 That's all you need to change! Just 3 values in 1 file!**
