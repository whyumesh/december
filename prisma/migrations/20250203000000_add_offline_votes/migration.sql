-- AlterTable: Add isOfflineVoteAdmin to admins
ALTER TABLE "admins" ADD COLUMN IF NOT EXISTS "isOfflineVoteAdmin" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex for isOfflineVoteAdmin (optional, for faster lookups)
CREATE INDEX IF NOT EXISTS "admins_isOfflineVoteAdmin_idx" ON "admins"("isOfflineVoteAdmin");

-- CreateTable: offline_votes for storing offline trustee votes
CREATE TABLE IF NOT EXISTS "offline_votes" (
    "id" TEXT NOT NULL,
    "voterId" TEXT NOT NULL,
    "trusteeCandidateId" TEXT,
    "electionId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "isMerged" BOOLEAN NOT NULL DEFAULT false,
    "mergedAt" TIMESTAMP(3),

    CONSTRAINT "offline_votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "offline_votes_voterId_idx" ON "offline_votes"("voterId");
CREATE INDEX IF NOT EXISTS "offline_votes_electionId_idx" ON "offline_votes"("electionId");
CREATE INDEX IF NOT EXISTS "offline_votes_adminId_idx" ON "offline_votes"("adminId");
CREATE INDEX IF NOT EXISTS "offline_votes_isMerged_idx" ON "offline_votes"("isMerged");
CREATE INDEX IF NOT EXISTS "offline_votes_trusteeCandidateId_idx" ON "offline_votes"("trusteeCandidateId");
CREATE INDEX IF NOT EXISTS "offline_votes_timestamp_idx" ON "offline_votes"("timestamp");

-- AddForeignKey
ALTER TABLE "offline_votes" ADD CONSTRAINT "offline_votes_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "elections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "offline_votes" ADD CONSTRAINT "offline_votes_trusteeCandidateId_fkey" FOREIGN KEY ("trusteeCandidateId") REFERENCES "trustee_candidates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "offline_votes" ADD CONSTRAINT "offline_votes_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;
