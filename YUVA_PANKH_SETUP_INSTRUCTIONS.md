# Yuva Pankh Election Setup Instructions

## Overview
This document provides instructions for processing Yuva Pankh nominations and activating voting.

## Candidates to Process

### Anya Gujarat Zone (1 candidate)
1. **Nidhi Ramesh Gandhi**
   - File: `3. Nidhi Rameshbhai Mall.pdf`
   - Note: File name says "Mall" but client confirmed name is "Gandhi"

### Kutch Zone (3 candidates)
1. **Bhavesh Harilal Mandan**
   - File: `4. Bhavesh Harilal Mandan.pdf`

2. **Raj Dhiraj Mandan**
   - File: `2. Raj Dhirajlal Mandan.pdf`

3. **Nikhil Vasant Gandhi**
   - File: `3. Nikhil Vasantbhai Mall.pdf`
   - Note: File name says "Mall" but client confirmed name is "Gandhi"

## Prerequisites

1. **Environment Variables**: Ensure `.env.local` file exists with:
   ```env
   DATABASE_URL="your-postgresql-connection-string"
   CLOUDINARY_CLOUD_NAME="your-cloudinary-name" (optional, for file storage)
   CLOUDINARY_API_KEY="your-api-key" (optional)
   CLOUDINARY_API_SECRET="your-api-secret" (optional)
   ```

2. **Nomination Files**: Ensure all PDF files are in `D:\december\yuvapankh_candidates\` directory

3. **Database Connection**: Ensure database is accessible and Prisma is configured

## Running the Script

### Step 1: Verify Files
Check that all nomination PDFs are present:
```
D:\december\yuvapankh_candidates\
  ├── 2. Raj Dhirajlal Mandan.pdf
  ├── 3. Nidhi Rameshbhai Mall.pdf
  ├── 3. Nikhil Vasantbhai Mall.pdf
  └── 4. Bhavesh Harilal Mandan.pdf
```

### Step 2: Run the Processing Script
```bash
npx tsx scripts/process-yuva-pankh-nominations.ts
```

### Step 3: Verify Results
The script will:
1. ✅ Check for existing candidates
2. ✅ Create/update candidate records
3. ✅ Upload nomination PDFs to storage
4. ✅ Assign candidates to correct zones (ANYA_GUJARAT and KUTCH)
5. ✅ Approve all candidates
6. ✅ Activate Yuva Pankh election

## What the Script Does

1. **Zone Assignment**:
   - Nidhi Ramesh Gandhi → ANYA_GUJARAT zone
   - Bhavesh Harilal Mandan → KUTCH zone
   - Raj Dhiraj Mandan → KUTCH zone
   - Nikhil Vasant Gandhi → KUTCH zone

2. **Candidate Creation/Update**:
   - If candidate exists: Updates name, zone, and status to APPROVED
   - If candidate doesn't exist: Creates new record with APPROVED status

3. **File Upload**:
   - Uploads nomination PDFs to Cloudinary (if configured) or local storage
   - Stores file reference in candidate's `experience` field

4. **Election Activation**:
   - Sets Yuva Pankh election status to `ACTIVE`
   - Enables voting for all eligible voters

## Expected Output

```
🚀 Starting Yuva Pankh Nomination Processing...

📁 Nomination directory: D:\december\yuvapankh_candidates

📋 Processing: Nidhi Ramesh Gandhi
   Zone: ANYA_GUJARAT (Anya Gujarat)
   ✅ Found zone: Anya Gujarat (ID: ...)
   ✅ Created and approved candidate

📋 Processing: Bhavesh Harilal Mandan
   ...

✅ Verification:
   Nidhi Ramesh Gandhi: APPROVED (Zone: Anya Gujarat)
   Bhavesh Harilal Mandan: APPROVED (Zone: Kutch)
   Raj Dhiraj Mandan: APPROVED (Zone: Kutch)
   Nikhil Vasant Gandhi: APPROVED (Zone: Kutch)

🗳️  Activating Yuva Pankh election...
   ✅ Election activated! New status: ACTIVE

============================================================
✅ SUCCESS! Yuva Pankh Election is now open for voting
============================================================

📊 Summary:
   • Total candidates processed: 4
   • Anya Gujarat: 1 candidate
   • Kutch: 3 candidates
   • All candidates: APPROVED
   • Election status: ACTIVE

🎉 Voting is now open for Yuva Pankh elections!
```

## Troubleshooting

### Error: DATABASE_URL not found
- **Solution**: Ensure `.env.local` file exists with `DATABASE_URL` set
- Check that the database connection string is correct

### Error: PDF file not found
- **Solution**: Verify all PDF files are in `yuvapankh_candidates` directory
- Check file names match exactly (case-sensitive)

### Error: Zone not found
- **Solution**: Ensure zones are seeded in database
- Run `npx prisma db seed` if needed

### Error: Cloudinary upload failed
- **Solution**: Script will fallback to local storage
- Check `./uploads` directory for uploaded files

## Manual Verification

After running the script, verify in admin panel:
1. Go to Admin → Yuva Pankh Nominations
2. Verify all 4 candidates show as "APPROVED"
3. Check that nomination forms are accessible
4. Verify zones are correctly assigned

## Post-Setup Checklist

- [ ] All 4 candidates created/updated
- [ ] All candidates have status: APPROVED
- [ ] Nomination PDFs uploaded successfully
- [ ] Zones correctly assigned (1 in ANYA_GUJARAT, 3 in KUTCH)
- [ ] Election status is ACTIVE
- [ ] Test voting flow for each zone

## Notes

- The script uses the names provided by the client (Gandhi) even though PDF files say "Mall"
- All candidates are automatically approved
- Election is automatically activated after processing
- File uploads use Cloudinary if configured, otherwise local storage

