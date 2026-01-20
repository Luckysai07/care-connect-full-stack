# FREE Deployment Guide for CARE-CONNECT

This guide will walk you through deploying your full-stack application for **FREE** using the best current cloud providers.

## 🏗️ The Stack
- **Frontend**: [Vercel](https://vercel.com) (Best for React/Vite)
- **Backend Service**: [Render](https://render.com) (Free Node.js web service)
- **Database**: [Neon](https://neon.tech) (Free Serverless PostgreSQL)

---

## Step 1: Push Code to GitHub
Ensure your project is pushed to a GitHub repository.
1. Create a repo on GitHub (e.g., `care-connect-fullstack`).
2. Push your `frontend` and `backend` folders to it.

---

## Step 2: Deploy Database (Neon)
1. Go to [Neon.tech](https://neon.tech) and sign up.
2. Create a **New Project** (Name: `care-connect-db`).
3. It will give you a **Connection String** that looks like: `postgres://user:pass@ep-cool-frog.us-east-2.aws.neon.tech/neondb`.
    - **Copy this string.** You will need it for the Backend.

---

## Step 3: Deploy Backend (Render)
1. Go to [Render.com](https://render.com) and sign up.
2. Click **New +** -> **Web Service**.
3. Connect your GitHub account and select your `care-connect` repo.
4. **Configure the Service settings:**
    - **Name**: `care-connect-api`
    - **Root Directory**: `backend` (Important!)
    - **Environment**: `Node`
    - **Build Command**: `npm install && npm run build`
    - **Start Command**: `npm start`
    - **Instance Type**: `Free`
5. **Environment Variables (Advanced > Environment Variables):**
    Add the following keys/values (copy from your local `.env`, but update where needed):
    - `NODE_ENV`: `production`
    - `PORT`: `10000` (Render default)
    - `DATABASE_URL`: *(Paste the Neon Connection String from Step 2)*
    - `JWT_ACCESS_SECRET`: *(Generate a strong random string)*
    - `JWT_REFRESH_SECRET`: *(Generate a strong random string)*
    - `CORS_ORIGIN`: `*` (Temporarily allow all, update to Frontend URL later)
6. Click **Create Web Service**.
    - Wait for the build to finish.
    - Copy your **Backend URL** (e.g., `https://care-connect-api.onrender.com`).

---

## Step 4: Run Database Migrations (One-Time)
Since your production database is empty, you need to create the tables.
1. Locally on your computer, open `.env` in the `backend` folder.
2. Temporarily replace `DATABASE_URL` with your **Neon Connection String**.
3. Run `npm run migrate` in your local terminal.
4. (Optional) Revert your local `.env` back to `localhost`.

---

## Step 5: Deploy Frontend (Vercel)
1. Go to [Vercel.com](https://vercel.com) and sign up.
2. Click **Add New...** -> **Project**.
3. Import your GitHub repo.
4. **Configure Project:**
    - **Root Directory**: Click `Edit` and select `frontend`.
    - **Framework Preset**: Vite (should auto-detect).
    - **Build Command**: `npm run build` (default).
    - **Output Directory**: `dist` (default).
5. **Environment Variables:**
    - `VITE_API_BASE_URL`: *(Paste your Render Backend URL, e.g., `https://care-connect-api.onrender.com`)*
6. Click **Deploy**.

---

## Step 6: Final Configuration
1. Once Vercel deploys, copy your **Frontend URL** (e.g., `https://care-connect.vercel.app`).
2. Go back to **Render Dashboard** -> `care-connect-api` -> **Environment Variables**.
3. Update `CORS_ORIGIN` to your real Frontend URL (no trailing slash).
4. Update `FRONTEND_URL` to your real Frontend URL.
5. Save changes in Render (it will redeploy automatically).

---

## 🎉 Done!
Your app is now live:
- **Frontend**: https://your-project.vercel.app
- **Backend**: https://your-backend.onrender.com
- **Database**: Hosted on Neon

> **Note:** On the free tier, Render spins down after inactivity. The first request after a break might take 30-50 seconds to load. This is normal for free hosting.
