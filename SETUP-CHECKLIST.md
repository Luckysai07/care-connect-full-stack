# 🚀 CARECONNECT - SETUP CHECKLIST

## ✅ WHAT YOU NEED TO CHANGE/CONFIGURE

### 📋 STEP-BY-STEP SETUP GUIDE

---

## 1️⃣ BACKEND SETUP

### A. Create .env File
```powershell
cd backend
cp .env.example .env
```

### B. Edit backend/.env - **REQUIRED CHANGES:**

```env
# ============================================
# DATABASE CONFIGURATION - CHANGE THESE!
# ============================================
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=careconnect
DATABASE_USER=postgres
DATABASE_PASSWORD=YOUR_POSTGRES_PASSWORD_HERE  # ⚠️ CHANGE THIS!

# ============================================
# JWT SECRETS - GENERATE NEW ONES!
# ============================================
# Run this command to generate secrets:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

JWT_ACCESS_SECRET=PASTE_GENERATED_SECRET_HERE   # ⚠️ CHANGE THIS!
JWT_REFRESH_SECRET=PASTE_DIFFERENT_SECRET_HERE  # ⚠️ CHANGE THIS!

# ============================================
# OPTIONAL - Can use later
# ============================================
GOOGLE_MAPS_API_KEY=your_key_here  # Optional for now
FIREBASE_SERVER_KEY=your_key_here  # Optional for now
TWILIO_ACCOUNT_SID=your_sid_here   # Optional for now
```

### C. Generate JWT Secrets
```powershell
# Run this command TWICE to get two different secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and paste into your .env file for JWT_ACCESS_SECRET and JWT_REFRESH_SECRET.

---

## 2️⃣ FRONTEND SETUP

### A. Create .env File
```powershell
cd frontend
cp .env.example .env
```

### B. Edit frontend/.env - **DEFAULT VALUES WORK!**

```env
# These default values work for local development
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

**✅ No changes needed unless you change backend port!**

---

## 3️⃣ DATABASE SETUP

### A. Install PostgreSQL with PostGIS

**Windows:**
1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. During installation, **CHECK** "PostGIS" in components
3. Remember your postgres password!

### B. Create Database
```powershell
# Open PowerShell and run:
createdb careconnect

# If that doesn't work, use psql:
psql -U postgres
CREATE DATABASE careconnect;
\q
```

---

## 4️⃣ REDIS SETUP

### Option 1: WSL (Recommended for Windows)
```powershell
# Install WSL if not installed
wsl --install

# Start WSL
wsl

# Install Redis
sudo apt update
sudo apt install redis-server

# Start Redis
sudo service redis-server start

# Test Redis
redis-cli ping
# Should return: PONG
```

### Option 2: Windows Native
Download from: https://github.com/microsoftarchive/redis/releases

---

## 5️⃣ INSTALL DEPENDENCIES

### Backend
```powershell
cd backend
npm install
```

### Frontend
```powershell
cd frontend
npm install
```

---

## 6️⃣ RUN MIGRATIONS & SEED DATA

```powershell
cd backend

# Run migrations (creates tables)
npm run migrate

# Seed test data (creates test users)
npm run seed
```

**✅ You should see:**
- ✓ Created admin user
- ✓ Created test users
- ✓ Created test volunteers
- ✓ Created test professional

---

## 7️⃣ START THE APPLICATION

### Terminal 1 - Backend
```powershell
cd backend
npm run dev
```

**✅ You should see:**
```
🚀 CareConnect Server Started
Port: 3000
Environment: development
```

### Terminal 2 - Frontend
```powershell
cd frontend
npm run dev
```

**✅ You should see:**
```
VITE v5.0.8  ready in XXX ms

➜  Local:   http://localhost:5173/
```

---

## 8️⃣ TEST THE APPLICATION

### A. Open Browser
Navigate to: **http://localhost:5173**

### B. Login with Test Credentials
```
Email: admin@careconnect.com
Password: Password123!
```

### C. Test Features
1. ✅ View Dashboard
2. ✅ Click Emergency Button
3. ✅ Allow location access (browser will ask)
4. ✅ Select emergency type (e.g., MEDICAL)
5. ✅ SOS should be created!

---

## 🔧 TROUBLESHOOTING

### ❌ Problem: "Cannot connect to database"
**Solution:**
```powershell
# Check if PostgreSQL is running
Get-Service postgresql*

# Start PostgreSQL if stopped
Start-Service postgresql-x64-14  # Version may vary
```

### ❌ Problem: "Cannot connect to Redis"
**Solution:**
```powershell
# If using WSL
wsl
sudo service redis-server start
```

### ❌ Problem: "Port 3000 already in use"
**Solution:**
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F
```

### ❌ Problem: "Migration failed"
**Solution:**
```powershell
# Drop and recreate database
dropdb careconnect
createdb careconnect

# Run migrations again
cd backend
npm run migrate
npm run seed
```

### ❌ Problem: "Module not found"
**Solution:**
```powershell
# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

---

## 📝 SUMMARY OF REQUIRED CHANGES

### ✅ MUST CHANGE:
1. **backend/.env** - Database password
2. **backend/.env** - JWT secrets (generate with crypto)

### ✅ OPTIONAL (Can skip for now):
1. Google Maps API key
2. Firebase credentials
3. Twilio credentials

### ✅ NO CHANGES NEEDED:
1. **frontend/.env** - Default values work!
2. All code files - Ready to use!

---

## 🎯 QUICK START COMMANDS

```powershell
# 1. Setup Backend
cd backend
cp .env.example .env
# Edit .env with your database password and JWT secrets
npm install
npm run migrate
npm run seed

# 2. Setup Frontend
cd frontend
cp .env.example .env
npm install

# 3. Start Backend (Terminal 1)
cd backend
npm run dev

# 4. Start Frontend (Terminal 2)
cd frontend
npm run dev

# 5. Open browser
# Navigate to http://localhost:5173
# Login: admin@careconnect.com / Password123!
```

---

## ✨ THAT'S IT!

After these steps, your application should be running perfectly!

**Backend:** http://localhost:3000  
**Frontend:** http://localhost:5173  
**Database:** PostgreSQL on port 5432  
**Redis:** Redis on port 6379  

---

## 📞 NEED HELP?

Check the logs:
```powershell
# Backend logs
cd backend
cat logs/app.log

# Frontend - check browser console (F12)
```

---

**🎉 You're ready to go!**
