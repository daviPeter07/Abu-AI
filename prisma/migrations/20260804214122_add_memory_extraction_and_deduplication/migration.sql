-- CreateTable
CREATE TABLE "memory_evidence" (
    "id" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "memory_id" TEXT NOT NULL,
    "source_message_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memory_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "memory_evidence_idempotency_key_key" ON "memory_evidence"("idempotency_key");

-- CreateIndex
CREATE INDEX "memory_evidence_memory_id_idx" ON "memory_evidence"("memory_id");

-- CreateIndex
CREATE INDEX "memory_evidence_source_message_id_idx" ON "memory_evidence"("source_message_id");

-- AddForeignKey
ALTER TABLE "memory_evidence" ADD CONSTRAINT "memory_evidence_memory_id_fkey" FOREIGN KEY ("memory_id") REFERENCES "memories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_evidence" ADD CONSTRAINT "memory_evidence_source_message_id_fkey" FOREIGN KEY ("source_message_id") REFERENCES "conversation_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
