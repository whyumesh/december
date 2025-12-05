# Local Server Configuration Setup

## 🔧 Required Environment Variables for Local Development

Create a `.env.local` file in the root directory with these variables:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/database

# NextAuth (for local development)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-local-development-secret-min-32-chars

# JWT & CSRF
JWT_SECRET=your-local-jwt-secret-min-32-chars
CSRF_SECRET=your-local-csrf-secret-min-32-chars

# Twilio (optional for local - can use mock)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Cloudinary (optional for local)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Node Environment
NODE_ENV=development
```

## 🚀 Quick Setup Steps

1. **Create `.env.local` file:**
   ```bash
   cp env.example .env.local
   ```

2. **Update values in `.env.local`:**
   - Set `DATABASE_URL` to your local database
   - Set `NEXTAUTH_URL=http://localhost:3000`
   - Generate secrets (see below)

3. **Generate Prisma Client:**
   ```bash
   npm run db:generate
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

## 🔑 Generating Secrets

### NEXTAUTH_SECRET, JWT_SECRET, CSRF_SECRET

You can generate secure secrets using:

**Option 1: OpenSSL**
```bash
openssl rand -base64 32
```

**Option 2: Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Option 3: Online Generator**
- Visit: https://generate-secret.vercel.app/32
- Copy the generated secret

## ✅ Verify Setup

1. **Check Prisma Client:**
   ```bash
   npm run db:generate
   ```

2. **Test Database Connection:**
   ```bash
   npm run db:studio
   ```
   This should open Prisma Studio if database is connected.

3. **Start Dev Server:**
   ```bash
   npm run dev
   ```

4. **Test Health Endpoint:**
   Visit: http://localhost:3000/api/health

   Should return:
   ```json
   {
     "timestamp": "...",
     "environment": "development",
     "vercel": false,
     "checks": {
       "nextAuthUrl": { "present": true, "value": "Set" },
       "nextAuthSecret": { "present": true, "value": "Set" },
       "databaseUrl": { "present": true, "value": "Set" }
     },
     "status": "ok"
   }
   ```

## 🔍 Common Issues

### Issue 1: "DATABASE_URL environment variable is required"

**Solution:**
- Ensure `.env.local` exists in root directory
- Check `DATABASE_URL` is set correctly
- Restart dev server after adding `.env.local`

### Issue 2: "NEXTAUTH_SECRET is missing"

**Solution:**
- Add `NEXTAUTH_SECRET` to `.env.local`
- Must be at least 32 characters
- Restart dev server

### Issue 3: "Prisma Client not generated"

**Solution:**
```bash
npm run db:generate
```

### Issue 4: "Cannot find module '@prisma/client'"

**Solution:**
```bash
npm install
npm run db:generate
```

### Issue 5: Port Already in Use

**Solution:**
- Change port: `npm run dev -- -p 3001`
- Or kill process using port 3000

## 📝 Notes

- `.env.local` is gitignored - never commit it
- Use `env.example` as a template
- Secrets for local development can be simple (not production-grade)
- Database must be running and accessible

## 🆘 Still Having Issues?

1. **Check dev server logs** - Look for specific error messages
2. **Verify all environment variables** - Use the health endpoint
3. **Regenerate Prisma Client** - `npm run db:generate`
4. **Clear Next.js cache** - Delete `.next` folder and restart

