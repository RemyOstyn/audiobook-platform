import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { processAudiobook, retryFailedJob } from "@/lib/inngest/functions";

// Create the Inngest serve handler
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    processAudiobook,
    retryFailedJob,
    // Add more functions here as they're created
  ],
  streaming: false, // Set to true in production for better performance
});

// Optional: Add a health check
export async function HEAD() {
  return new Response(null, { status: 200 });
}