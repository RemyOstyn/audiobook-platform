import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/admin/transcriptions/[id] - Get transcription details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: transcriptionId } = await params;

    const transcription = await prisma.transcription.findUnique({
      where: { id: transcriptionId },
      include: {
        audiobook: {
          select: {
            id: true,
            title: true,
            author: true,
          },
        },
      },
    });

    if (!transcription) {
      return NextResponse.json(
        { error: "Transcription not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: transcription.id,
      audiobookId: transcription.audiobook_id,
      fullText: transcription.full_text,
      wordCount: transcription.word_count,
      confidenceScore: transcription.confidence_score,
      processingTimeMs: transcription.processing_time_ms,
      createdAt: transcription.created_at,
      language: transcription.language,
      audiobook: transcription.audiobook,
    });
  } catch (error) {
    console.error("Failed to fetch transcription:", error);
    return NextResponse.json(
      { error: "Failed to fetch transcription" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/transcriptions/[id] - Update transcription
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: transcriptionId } = await params;
    const body = await request.json();
    const { fullText } = body;

    if (!fullText || typeof fullText !== "string") {
      return NextResponse.json(
        { error: "fullText is required and must be a string" },
        { status: 400 }
      );
    }

    // Calculate new word count
    const wordCount = fullText.split(/\s+/).filter(word => word.length > 0).length;

    const updatedTranscription = await prisma.transcription.update({
      where: { id: transcriptionId },
      data: {
        full_text: fullText,
        word_count: wordCount,
      },
      include: {
        audiobook: {
          select: {
            id: true,
            title: true,
            author: true,
          },
        },
      },
    });

    return NextResponse.json({
      id: updatedTranscription.id,
      audiobookId: updatedTranscription.audiobook_id,
      fullText: updatedTranscription.full_text,
      wordCount: updatedTranscription.word_count,
      confidenceScore: updatedTranscription.confidence_score,
      createdAt: updatedTranscription.created_at,
      audiobook: updatedTranscription.audiobook,
    });
  } catch (error) {
    console.error("Failed to update transcription:", error);
    return NextResponse.json(
      { error: "Failed to update transcription" },
      { status: 500 }
    );
  }
}