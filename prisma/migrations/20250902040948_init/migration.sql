-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('admin', 'user');

-- CreateEnum
CREATE TYPE "public"."AudiobookStatus" AS ENUM ('draft', 'processing', 'active', 'inactive');

-- CreateEnum
CREATE TYPE "public"."JobType" AS ENUM ('transcription', 'summary', 'categorization');

-- CreateEnum
CREATE TYPE "public"."JobStatus" AS ENUM ('pending', 'processing', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "public"."OrderStatus" AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- CreateTable
CREATE TABLE "public"."profiles" (
    "id" UUID NOT NULL,
    "role" "public"."UserRole" NOT NULL DEFAULT 'user',
    "display_name" TEXT,
    "phone" VARCHAR(20),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audiobooks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "narrator" TEXT,
    "isbn" VARCHAR(13),
    "publication_year" INTEGER,
    "description" TEXT,
    "ai_summary" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "duration_seconds" INTEGER,
    "file_size_bytes" BIGINT,
    "file_url" TEXT NOT NULL,
    "cover_image_url" TEXT,
    "sample_url" TEXT,
    "status" "public"."AudiobookStatus" NOT NULL DEFAULT 'processing',
    "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "language" VARCHAR(10) NOT NULL DEFAULT 'en',
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audiobooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."transcriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "audiobook_id" UUID NOT NULL,
    "full_text" TEXT,
    "word_count" INTEGER,
    "language" VARCHAR(10) NOT NULL DEFAULT 'en',
    "confidence_score" DECIMAL(3,2),
    "processing_time_ms" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transcriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."processing_jobs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "audiobook_id" UUID NOT NULL,
    "job_type" "public"."JobType" NOT NULL,
    "status" "public"."JobStatus" NOT NULL DEFAULT 'pending',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processing_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cart_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "session_id" TEXT,
    "audiobook_id" UUID NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_number" VARCHAR(20) NOT NULL,
    "user_id" UUID,
    "email" TEXT NOT NULL,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "status" "public"."OrderStatus" NOT NULL DEFAULT 'pending',
    "payment_method" VARCHAR(50),
    "payment_intent_id" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."order_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "audiobook_id" UUID NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_library" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "audiobook_id" UUID NOT NULL,
    "order_id" UUID,
    "purchased_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_accessed" TIMESTAMP(3),
    "download_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "user_library_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."api_usage" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "service" VARCHAR(50) NOT NULL,
    "endpoint" VARCHAR(100),
    "tokens_used" INTEGER,
    "cost_usd" DECIMAL(10,4),
    "audiobook_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cart_items_user_id_audiobook_id_key" ON "public"."cart_items"("user_id", "audiobook_id");

-- CreateIndex
CREATE UNIQUE INDEX "cart_items_session_id_audiobook_id_key" ON "public"."cart_items"("session_id", "audiobook_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_number_key" ON "public"."orders"("order_number");

-- CreateIndex
CREATE UNIQUE INDEX "user_library_user_id_audiobook_id_key" ON "public"."user_library"("user_id", "audiobook_id");

-- AddForeignKey
ALTER TABLE "public"."audiobooks" ADD CONSTRAINT "audiobooks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transcriptions" ADD CONSTRAINT "transcriptions_audiobook_id_fkey" FOREIGN KEY ("audiobook_id") REFERENCES "public"."audiobooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."processing_jobs" ADD CONSTRAINT "processing_jobs_audiobook_id_fkey" FOREIGN KEY ("audiobook_id") REFERENCES "public"."audiobooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cart_items" ADD CONSTRAINT "cart_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cart_items" ADD CONSTRAINT "cart_items_audiobook_id_fkey" FOREIGN KEY ("audiobook_id") REFERENCES "public"."audiobooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_items" ADD CONSTRAINT "order_items_audiobook_id_fkey" FOREIGN KEY ("audiobook_id") REFERENCES "public"."audiobooks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_library" ADD CONSTRAINT "user_library_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_library" ADD CONSTRAINT "user_library_audiobook_id_fkey" FOREIGN KEY ("audiobook_id") REFERENCES "public"."audiobooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_library" ADD CONSTRAINT "user_library_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."api_usage" ADD CONSTRAINT "api_usage_audiobook_id_fkey" FOREIGN KEY ("audiobook_id") REFERENCES "public"."audiobooks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
