import { NextRequest } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

const openai = new OpenAI({
  baseURL: "https://space.ai-builders.com/backend/v1",
  apiKey: process.env.AI_BUILDER_TOKEN,
  defaultHeaders: {
    "Authorization": `Bearer ${process.env.AI_BUILDER_TOKEN}`,
  },
});

export async function POST(req: NextRequest) {
  try {
    // Check if API key is configured
    const apiToken = process.env.AI_BUILDER_TOKEN;
    if (!apiToken) {
      console.error("AI_BUILDER_TOKEN is not configured");
      return new Response(
        JSON.stringify({ error: "API token not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Log token status (first 20 chars only for security)
    console.log("API Token status:", apiToken ? `Configured (${apiToken.substring(0, 20)}...)` : "NOT configured");

    const { messages, model = "grok-4-fast" } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate model
    const validModels = ["grok-4-fast", "supermind-agent-v1"];
    const selectedModel = validModels.includes(model) ? model : "grok-4-fast";

    // supermind-agent-v1 doesn't support streaming
    const useStreaming = selectedModel !== "supermind-agent-v1";

    console.log("Making API request with model:", selectedModel);
    console.log("Base URL:", "https://space.ai-builders.com/backend/v1");
    console.log("Messages count:", messages.length);
    console.log("Streaming:", useStreaming);

    const completion = await openai.chat.completions.create({
      model: selectedModel,
      messages: messages,
      stream: useStreaming,
      temperature: 0.7,
    });

    const encoder = new TextEncoder();

    if (useStreaming) {
      // Streaming response for grok-4-fast
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of completion as any) {
              const content = chunk.choices[0]?.delta?.content || "";
              if (content) {
                const data = `data: ${JSON.stringify({ content })}\n\n`;
                controller.enqueue(encoder.encode(data));
              }
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } catch (error: any) {
            console.error("Streaming error:", error);
            const errorData = `data: ${JSON.stringify({ 
              error: error.message || "Streaming error occurred" 
            })}\n\n`;
            controller.enqueue(encoder.encode(errorData));
            controller.close();
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    } else {
      // Non-streaming response for supermind-agent-v1
      const content = (completion as any).choices[0]?.message?.content || "";
      const readableStream = new ReadableStream({
        start(controller) {
          if (content) {
            // Send content in chunks to simulate streaming
            const chunkSize = 10;
            let index = 0;
            const sendChunk = () => {
              if (index < content.length) {
                const chunk = content.slice(index, index + chunkSize);
                const data = `data: ${JSON.stringify({ content: chunk })}\n\n`;
                controller.enqueue(encoder.encode(data));
                index += chunkSize;
                setTimeout(sendChunk, 10);
              } else {
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                controller.close();
              }
            };
            sendChunk();
          } else {
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }
  } catch (error: any) {
    console.error("Chat API error:", error);
    const errorMessage = error.message || "Failed to process chat request";
    console.error("Error details:", {
      message: errorMessage,
      status: error.status,
      type: error.constructor.name,
    });
    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: error.status ? `Status: ${error.status}` : undefined,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
