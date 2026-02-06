# Offline Trustee Voting – Setup & Validation

**Important:** Do these in order: (1) Apply migration, (2) Run the admin-creation script. If you already ran the script before migrating, run the script again after the migration so Admin records (with `isOfflineVoteAdmin`) are created.

---

## 1. Are the 15 admins created?

**Not until you run the script** (and the migration must be applied first). The 15 offline vote admin accounts are **not** created automatically.

---

## 2. How to create the 15 admins and how to login

### Step 1: Ensure database is ready

- Set `DATABASE_URL` in `.env` or `.env.local` (PostgreSQL connection string).
- **Apply the migration first** (creates `offline_votes` table and adds `isOfflineVoteAdmin` to `admins`):

  ```bash
  npx prisma migrate deploy
  ```
  Or, for development:

  ```bash
  npx prisma migrate dev --name add_offline_votes
  ```

  If your env is in `.env.local`, load it first, e.g. on Windows PowerShell:
  ```powershell
  Get-Content .env.local | ForEach-Object { if ($_ -match '^([^#=]+)=(.*)$') { [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim().Replace('"',''), 'Process') } }
  npx prisma migrate deploy
  ```

  Then generate the client (if you changed schema):

  ```bash
  npx prisma generate
  ```

### Step 2: Create the 15 offline vote admin accounts

From the project root (script reads `DATABASE_URL` from `.env` or `.env.local`):

```bash
npx tsx scripts/create-offline-vote-admins.ts
```

This creates 15 **User** accounts and 15 **Admin** records (with `isOfflineVoteAdmin: true`), and writes credentials to `offline-vote-admins-credentials.json`.  
**If you already ran the script before applying the migration**, run it again after the migration; it will attach the Admin records to the existing users.

### Step 3: Login URL and credentials

- **Login URL:** `<your-app-base-url>/admin/login`  
  Example: `http://localhost:3000/admin/login`

- **Credentials (fixed, so you can share them):**

| # | Email | Password |
|---|--------|----------|
| 1 | offline-admin-1@kms-election.com | OfflineVote1! |
| 2 | offline-admin-2@kms-election.com | OfflineVote2! |
| 3 | offline-admin-3@kms-election.com | OfflineVote3! |
| 4 | offline-admin-4@kms-election.com | OfflineVote4! |
| 5 | offline-admin-5@kms-election.com | OfflineVote5! |
| 6 | offline-admin-6@kms-election.com | OfflineVote6! |
| 7 | offline-admin-7@kms-election.com | OfflineVote7! |
| 8 | offline-admin-8@kms-election.com | OfflineVote8! |
| 9 | offline-admin-9@kms-election.com | OfflineVote9! |
| 10 | offline-admin-10@kms-election.com | OfflineVote10! |
| 11 | offline-admin-11@kms-election.com | OfflineVote11! |
| 12 | offline-admin-12@kms-election.com | OfflineVote12! |
| 13 | offline-admin-13@kms-election.com | OfflineVote13! |
| 14 | offline-admin-14@kms-election.com | OfflineVote14! |
| 15 | offline-admin-15@kms-election.com | OfflineVote15! |

Use **Email** and **Password** on the admin login page. After login, these admins are taken to the admin dashboard and can use “Enter Offline Vote” and “View Offline Votes”.

---

## 3. Is the DB created to store votes entered by these 15 admins?

**Yes, but you must run the migration first.**

- **Schema:** The app already defines:
  - Table `offline_votes` (stores each offline trustee vote: VID, trustee, election, which admin entered it, merged or not).
  - Column `admins.isOfflineVoteAdmin` (marks the 15 offline vote admins).

- **Applying it:** Run one of the following so the database actually has the table and column:

  ```bash
  npx prisma migrate deploy
  ```
  or (dev):

  ```bash
  npx prisma migrate dev --name add_offline_votes
  ```

- **Location of data:** Votes entered by the 15 admins are stored in the **same database** as the rest of the app, in the `offline_votes` table. They are not in a separate database.

---

## 4. How to visually validate

Use these checks in the browser.

### A. Login as an offline vote admin

1. Open `<your-app>/admin/login`.
2. Log in with e.g. `offline-admin-1@kms-election.com` / `OfflineVote1!`.
3. You should land on the **Admin dashboard**.

### B. Enter an offline vote

1. On the dashboard, find **“Offline Vote Management”**.
2. Click **“Enter Offline Vote”** (or go to `/admin/offline-votes/trustees`).
3. **Step 1:** Enter a valid **Voter ID (VID)** that exists in your system and click “Validate & Continue”.
4. Confirm that voter details (name, zone, etc.) appear.
5. **Step 2:** Select one or more trustees by zone, add optional notes, then click **“Submit Offline Vote”**.
6. You should see a success message.

### C. View offline votes list

1. From the dashboard, click **“View Offline Votes”** (or go to `/admin/offline-votes/trustees/list`).
2. You should see the vote you just entered (VID, voter name, selected trustees, admin who entered, timestamp, Merged/Unmerged).

### D. See online vs offline vs merged results

1. Go to **Result Declaration** (or `/admin/election-results`) and complete the required auth (password + OTP if configured).
2. In the **Trust Mandal (Trustee)** section you should see three tabs:
   - **Online Votes** – votes cast online.
   - **Offline Votes** – votes entered by the 15 admins (from `offline_votes`).
   - **Merged Votes** – online + merged offline votes (and breakdown per candidate if implemented).

### E. Merge (main admin only)

1. Log in as the **main admin** (e.g. `admin@kms-election.com`), not as an offline vote admin.
2. On the dashboard, in **“Offline Vote Management”**, you should see a **“Merge Offline Votes”** button when there are unmerged offline votes.
3. Click it and confirm. After merge, those offline votes count in the main results and the same votes appear under **Merged** in the election results page.

---

## 5. Quick checklist (if something is not implemented)

- [ ] **Database:** `DATABASE_URL` set in `.env` or `.env.local`.
- [ ] **Migration:** `npx prisma migrate deploy` or `npx prisma migrate dev --name add_offline_votes` run successfully.
- [ ] **Prisma client:** `npx prisma generate` run after migration.
- [ ] **15 admins:** `npx tsx scripts/create-offline-vote-admins.ts` run successfully; credentials in `offline-vote-admins-credentials.json`.
- [ ] **Login:** Can log in at `/admin/login` with one of the 15 emails and corresponding password.
- [ ] **Enter vote:** Can open “Enter Offline Vote”, validate a VID, select trustees, and submit.
- [ ] **List:** “View Offline Votes” shows the submitted vote.
- [ ] **Results:** Election results page shows Online / Offline / Merged tabs for Trustee.
- [ ] **Merge:** Main admin can merge offline votes; merged count updates and appears in Merged results.

If any step fails, use the section above that matches the step (DB, migration, script, login, or visual validation) and fix that part first.
