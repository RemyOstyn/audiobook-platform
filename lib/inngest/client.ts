import { Inngest } from "inngest";

if (!process.env.INNGEST_EVENT_KEY) {
  throw new Error("INNGEST_EVENT_KEY is required");
}

if (!process.env.INNGEST_SIGNING_KEY) {
  throw new Error("INNGEST_SIGNING_KEY is required");
}

// Create the Inngest client
export const inngest = new Inngest({
  id: "audiobook-platform",
  name: "Audiobook Platform",
  eventKey: process.env.INNGEST_EVENT_KEY,
  signingKey: process.env.INNGEST_SIGNING_KEY,
  isDev: process.env.NODE_ENV === "development",
});

// Event types for type safety
export type InngestEvents = {
  "audiobook/uploaded": {
    data: {
      audiobookId: string;
      fileName: string;
      fileSize: number;
      filePath: string;
    };
  };
  "audiobook/processing-complete": {
    data: {
      audiobookId: string;
      success: boolean;
      error?: string;
    };
  };
  "audiobook/transcription-complete": {
    data: {
      audiobookId: string;
      transcriptionId: string;
      wordCount: number;
    };
  };
};