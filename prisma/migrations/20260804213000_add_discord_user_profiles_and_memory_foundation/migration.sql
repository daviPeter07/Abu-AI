-- CreateEnum
CREATE TYPE "MemoryScope" AS ENUM ('USER', 'GROUP');

-- CreateEnum
CREATE TYPE "MemoryType" AS ENUM ('FACT', 'PREFERENCE', 'RELATIONSHIP', 'PROJECT', 'EVENT', 'OTHER');

-- CreateEnum
CREATE TYPE "MemoryStatus" AS ENUM ('ACTIVE', 'SUPERSEDED', 'REJECTED');

-- CreateTable
CREATE TABLE "discord_users" (
    "id" TEXT NOT NULL,
    "discord_user_id" TEXT NOT NULL,
    "username" TEXT,
    "display_name" TEXT NOT NULL,
    "first_seen_at" TIMESTAMP(3) NOT NULL,
    "last_seen_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discord_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "discord_users_discord_user_id_key" ON "discord_users"("discord_user_id");

-- BackfillUserProfiles
INSERT INTO "discord_users" (
    "id",
    "discord_user_id",
    "username",
    "display_name",
    "first_seen_at",
    "last_seen_at",
    "created_at",
    "updated_at"
)
SELECT
    'legacy_' || md5("author_id"),
    "author_id",
    NULL,
    (ARRAY_AGG("author_name" ORDER BY "discord_created_at" DESC, "discord_message_id" DESC))[1],
    MIN("discord_created_at"),
    MAX("discord_created_at"),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "conversation_messages"
GROUP BY "author_id";

-- CreateIndex
CREATE INDEX "conversation_messages_author_id_idx" ON "conversation_messages"("author_id");

-- AddForeignKey
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "discord_users"("discord_user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "memories" (
    "id" TEXT NOT NULL,
    "scope" "MemoryScope" NOT NULL,
    "type" "MemoryType" NOT NULL,
    "content" TEXT NOT NULL,
    "normalized_content" TEXT NOT NULL,
    "subject_user_id" TEXT,
    "guild_id" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL,
    "status" "MemoryStatus" NOT NULL DEFAULT 'ACTIVE',
    "source_message_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_confirmed_at" TIMESTAMP(3),

    CONSTRAINT "memories_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "memories_confidence_check" CHECK ("confidence" >= 0 AND "confidence" <= 1),
    CONSTRAINT "memories_scope_check" CHECK (
        ("scope" = 'USER' AND "subject_user_id" IS NOT NULL AND "guild_id" IS NULL)
        OR
        ("scope" = 'GROUP' AND "guild_id" IS NOT NULL)
    )
);

-- CreateIndex
CREATE INDEX "memories_scope_subject_user_id_created_at_idx" ON "memories"("scope", "subject_user_id", "created_at");

-- CreateIndex
CREATE INDEX "memories_scope_guild_id_created_at_idx" ON "memories"("scope", "guild_id", "created_at");

-- CreateIndex
CREATE INDEX "memories_source_message_id_idx" ON "memories"("source_message_id");

-- AddForeignKey
ALTER TABLE "memories" ADD CONSTRAINT "memories_subject_user_id_fkey" FOREIGN KEY ("subject_user_id") REFERENCES "discord_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memories" ADD CONSTRAINT "memories_source_message_id_fkey" FOREIGN KEY ("source_message_id") REFERENCES "conversation_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
