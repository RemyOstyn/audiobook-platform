import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, JobStatus } from "@prisma/client";
import { inngest } from "@/lib/inngest/client";

const prisma = new PrismaClient();

// GET /api/admin/jobs - List all processing jobs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const audiobookId = searchParams.get("audiobookId");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build where clause
    const where: {
      status?: JobStatus;
      audiobook_id?: string;
    } = {};
    if (status && Object.values(JobStatus).includes(status as JobStatus)) {
      where.status = status as JobStatus;
    }
    if (audiobookId) {
      where.audiobook_id = audiobookId;
    }

    // Get jobs with pagination
    const [jobs, totalCount] = await Promise.all([
      prisma.processingJob.findMany({
        where,
        include: {
          audiobook: {
            select: {
              id: true,
              title: true,
              author: true,
              status: true,
            },
          },
        },
        orderBy: {
          created_at: "desc",
        },
        take: limit,
        skip: offset,
      }),
      prisma.processingJob.count({ where }),
    ]);

    // Calculate processing statistics
    const stats = await prisma.processingJob.groupBy({
      by: ["status"],
      _count: {
        status: true,
      },
    });

    const statistics = stats.reduce((acc, stat) => {
      acc[stat.status] = stat._count.status;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      jobs: jobs.map((job) => ({
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
      })),
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
      statistics,
    });
  } catch (error) {
    console.error("Failed to fetch processing jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch processing jobs" },
      { status: 500 }
    );
  }
}

// POST /api/admin/jobs - Create a new processing job
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { audiobookId, force = false } = body;

    if (!audiobookId) {
      return NextResponse.json(
        { error: "audiobookId is required" },
        { status: 400 }
      );
    }

    // Get audiobook details
    const audiobook = await prisma.audiobook.findUnique({
      where: { id: audiobookId },
    });

    if (!audiobook) {
      return NextResponse.json(
        { error: "Audiobook not found" },
        { status: 404 }
      );
    }

    // Check if there's already a processing job for this audiobook
    if (!force) {
      const existingJob = await prisma.processingJob.findFirst({
        where: {
          audiobook_id: audiobookId,
          status: {
            in: [JobStatus.pending, JobStatus.processing],
          },
        },
      });

      if (existingJob) {
        return NextResponse.json(
          { 
            error: "Processing job already exists for this audiobook",
            existingJobId: existingJob.id,
          },
          { status: 409 }
        );
      }
    }

    // Validate audiobook has required field
    if (!audiobook.file_url) {
      return NextResponse.json(
        { error: "Audiobook missing file_url" },
        { status: 400 }
      );
    }

    // Extract file information from file_url
    const urlParts = audiobook.file_url.split('/');
    const fileName = urlParts[urlParts.length - 1]; // Last part is the filename
    
    // For existing files, extract the full path after /object/public/audiobooks/
    const bucketIndex = audiobook.file_url.indexOf('/object/public/audiobooks/');
    const filePath = bucketIndex !== -1 
      ? audiobook.file_url.substring(bucketIndex + '/object/public/audiobooks/'.length)
      : fileName; // Fallback to just filename for new uploads

    // Update audiobook status to processing
    await prisma.audiobook.update({
      where: { id: audiobookId },
      data: { status: "processing" },
    });

    // Send event to Inngest to start processing
    await inngest.send({
      name: "audiobook/uploaded",
      data: {
        audiobookId,
        fileName: fileName,
        fileSize: Number(audiobook.file_size_bytes || 0),
        filePath: filePath,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Processing job started",
      audiobookId,
    });

  } catch (error) {
    console.error("Failed to create processing job:", error);
    return NextResponse.json(
      { error: "Failed to create processing job" },
      { status: 500 }
    );
  }
}