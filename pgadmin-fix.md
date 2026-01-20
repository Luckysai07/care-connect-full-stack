# 🔐 Fixing pgAdmin & PostgreSQL Password Errors

It seems like your PostgreSQL password is incorrect. This affects both **pgAdmin** and your **backend application**.

## 1. Identify the Error Type

### Case A: "Password authentication failed for user 'postgres'"
This means the password you entered is **wrong**.
- If you know the password, check your CAPS LOCK.
- If you **forgot** the password, you must reset it (see below).

### Case B: "Please enter your Master Password"
This is a **pgAdmin-specific** password to encrypt your saved credentials.
- It is **NOT** your database password.
- If you lost this, you can reset pgAdmin settings (search for "reset pgadmin master password").

---

## 2. How to Reset Your PostgreSQL Password (Windows)

If you cannot remember your database password, follow these steps to reset it:

1.  **Open "Services"**:
    - Press `Win + R`, type `services.msc`, and hit Enter.
    - Find **postgresql-x64-16** (or your version).
    - Right-click > **Stop**.

2.  **Edit Configuration**:
    - Go to your PostgreSQL data folder. Default is roughly:
      `C:\Program Files\PostgreSQL\16\data`
    - Find and open `pg_hba.conf` in Notepad (run Notepad as Admin).
    - Scroll to the bottom and find the lines for IPv4 and IPv6 local connections.
    - Change `scram-sha-256` (or `md5`) to `trust`.
      ```
      # IPv4 local connections:
      host    all             all             127.0.0.1/32            trust
      # IPv6 local connections:
      host    all             all             ::1/128                 trust
      ```
    - Save and close.

3.  **Restart Service**:
    - Back in "Services", generic Right-click > **Start** on PostgreSQL.

4.  **Change Password**:
    - Open a terminal (PowerShell/CMD).
    - Run: `psql -U postgres` (it should log you in without a password now).
    - Run this SQL command (replace `newpassword` with your desired password):
      ```sql
      ALTER USER postgres WITH PASSWORD 'newpassword';
      ```
    - Type `\q` to exit.

5.  **Revert Configuration**:
    - **IMPORTANT**: Go back to `pg_hba.conf` and change `trust` back to `scram-sha-256` (or whatever it was).
    - Restart the PostgreSQL service again.

---

## 3. Update Your Project Configuration

Once you have your working password:

1.  Open `backend/.env`.
2.  Update the `DATABASE_URL` line:
    ```env
    DATABASE_URL=postgresql://postgres:YOUR_NEW_PASSWORD@localhost:5432/careconnect
    ```
3.  Run the test script to verify:
    ```powershell
    cd backend
    node simple-test.js
    ```
