# 🔧 DATABASE CONNECTION TROUBLESHOOTING

## ✅ Current Status:
- PostgreSQL is **RUNNING** ✅
- Database "careconnect" **EXISTS** ✅
- Connection is **TIMING OUT** ❌

## 🔴 Problem: Password Mismatch

The connection timeout is almost always caused by an **incorrect password** in your `.env` file.

## 🔍 How to Fix:

### Step 1: Verify Your PostgreSQL Password

You successfully connected to SQL Shell (psql), which means you know the correct password.

### Step 2: Check Your `.env` File

Open: `backend/.env`

Find this line:
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/careconnect
```

**Replace `YOUR_PASSWORD` with the EXACT password you used in SQL Shell.**

### Step 3: Test Connection

```powershell
cd backend
node test-connection.js
```

If successful, you'll see:
```
✅ Connected successfully!
✅ Database "careconnect" exists
```

### Step 4: Run Migration

```powershell
npm run migrate
npm run seed
npm run dev
```

## 📝 Example `.env` Entry:

If your PostgreSQL password is `mypassword123`, the line should be:

```env
DATABASE_URL=postgresql://postgres:mypassword123@localhost:5432/careconnect
```

**Important:**
- No spaces around the `=` sign
- No quotes around the password
- Use the EXACT password from SQL Shell

## ✅ Verify in SQL Shell:

```sql
\c careconnect
CREATE EXTENSION IF NOT EXISTS postgis;
\q
```

If this works, your password is correct!
