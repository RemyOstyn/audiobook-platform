import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { inngest } from "@/lib/inngest/client";

const prisma = new PrismaClient();

// GET /api/admin/jobs/[id] - Get specific job details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;

    const job = await prisma.processingJob.findUnique({
      where: { id: jobId },
      include: {
        audiobook: {
          select: {
            id: true,
            title: true,
            author: true,
            status: true,
            description: true,
            categories: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Processing job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: job.id,
      audiobookId: job.audiobook_id,
      jobType: job.job_type,
      status: job.status,
      progress: job.progress,
      error: job.error_message,
      createdAt: job.created_at,
      completedAt: job.completed_at,
      metadata: job.metadata,
      audiobook: job.audiobook,
    });
  } catch (error) {
    console.error("Failed to fetch processing job:", error);
    return NextResponse.json(
      { error: "Failed to fetch processing job" },
      { status: 500 }
    );
  }
}

// POST /api/admin/jobs/[id]/retry - Retry a failed job
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;

    // Get the job details
    const job = await prisma.processingJob.findUnique({
      where: { id: jobId },
      include: {
        audiobook: true,
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Processing job not found" },
        { status: 404 }
      );
    }

    // Only allow retry for failed jobs
    if (job.status !== "failed") {
      return NextResponse.json(
        { 
          error: "Only failed jobs can be retried",
          currentStatus: job.status,
        },
        { status: 400 }
      );
    }

    // Reset job status
    await prisma.processingJob.update({
      where: { id: jobId },
      data: {
        status: "pending",
        progress: 0,
        error_message: null,
        completed_at: null,
      },
    });

    // Update audiobook status
    await prisma.audiobook.update({
      where: { id: job.audiobook_id },
      data: { status: "processing" },
    });

    // Send retry event to Inngest
    await inngest.send({
      name: "audiobook/retry-processing",
      data: {
        audiobookId: job.audiobook_id,
        originalJobId: jobId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Job retry initiated",
      jobId,
    });

  } catch (error) {
    console.error("Failed to retry processing job:", error);
    return NextResponse.json(
      { error: "Failed to retry processing job" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/jobs/[id] - Cancel a running job
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;

    // Get the job details
    const job = await prisma.processingJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Processing job not found" },
        { status: 404 }
      );
    }

    // Only allow cancellation for running jobs
    const cancellableStatuses = ["pending", "downloading", "chunking", "transcribing", "generating_content"];
    if (!cancellableStatuses.includes(job.status)) {
      return NextResponse.json(
        { 
          error: "Job cannot be cancelled",
          currentStatus: job.status,
          message: "Only pending or running jobs can be cancelled",
        },
        { status: 400 }
      );
    }

    // Mark job as cancelled
    await prisma.processingJob.update({
      where: { id: jobId },
      data: {
        status: "failed",
        error_message: "Job cancelled by admin",
        completed_at: new Date(),
      },
    });

    // Update audiobook status back to uploaded
    await prisma.audiobook.update({
      where: { id: job.audiobook_id },
      data: { status: "draft" },
    });

    // Note: In a full implementation, you'd also send a cancellation signal
    // to Inngest to stop the running job, but that requires more complex setup

    return NextResponse.json({
      success: true,
      message: "Job cancelled successfully",
      jobId,
    });

  } catch (error) {
    console.error("Failed to cancel processing job:", error);
    return NextResponse.json(
      { error: "Failed to cancel processing job" },
      { status: 500 }
    );
  }
}