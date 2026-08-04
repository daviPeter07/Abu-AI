-- CreateEnum
CREATE TYPE "MemoryAuditAction" AS ENUM ('FORGET', 'CLEAR', 'DISABLE', 'ENABLE');

-- CreateTable
CREATE TABLE "memory_audits" (
    "id" TEXT NOT NULL,
    "action" "MemoryAuditAction" NOT NULL,
    "actor_discord_user_id" TEXT NOT NULL,
    "memory_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memory_audits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "memory_audits_actor_discord_user_id_created_at_idx" ON "memory_audits"("actor_discord_user_id", "created_at");

-- CreateIndex
CREATE INDEX "memory_audits_memory_id_idx" ON "memory_audits"("memory_id");

-- AddForeignKey
ALTER TABLE "memory_audits" ADD CONSTRAINT "memory_audits_actor_discord_user_id_fkey" FOREIGN KEY ("actor_discord_user_id") REFERENCES "discord_users"("discord_user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_audits" ADD CONSTRAINT "memory_audits_memory_id_fkey" FOREIGN KEY ("memory_id") REFERENCES "memories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
