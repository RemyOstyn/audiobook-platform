-- AlterEnum
ALTER TYPE "JobStatus" ADD VALUE 'downloading';
ALTER TYPE "JobStatus" ADD VALUE 'chunking';
ALTER TYPE "JobStatus" ADD VALUE 'transcribing';
ALTER TYPE "JobStatus" ADD VALUE 'generating_content';