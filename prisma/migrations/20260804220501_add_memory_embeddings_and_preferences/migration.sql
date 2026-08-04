-- AlterTable
ALTER TABLE "discord_users" ADD COLUMN     "memory_enabled" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "memories" ADD COLUMN     "embedding" DOUBLE PRECISION[] DEFAULT ARRAY[]::DOUBLE PRECISION[];
