-- CreateTable: election_config for results declaration flag
CREATE TABLE IF NOT EXISTS "election_config" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "election_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: unique key for lookup
CREATE UNIQUE INDEX IF NOT EXISTS "election_config_key_key" ON "election_config"("key");
