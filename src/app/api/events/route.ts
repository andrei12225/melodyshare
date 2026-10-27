import { NextRequest } from "next/server";
import { getCurrentUser, unauthorized } from "@/lib/auth";
import { subscribe } from "@/lib/events";

export const dynamic = "force-dynamic";

// Server-Sent Events stream of realtime updates for the signed-in user
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const encoder = new TextEncoder();
  let cleanup = () => {};

  const stream = new ReadableStream({
    async start(controller) {
      const write = (chunk: string) => {
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          cleanup();
        }
      };

      const unsubscribe = await subscribe(user.id, (event) => write(`data: ${JSON.stringify(event)}\n\n`));
      // Keep proxies from closing idle connections
      const keepAlive = setInterval(() => write(": ping\n\n"), 25_000);

      cleanup = () => {
        clearInterval(keepAlive);
        unsubscribe();
      };
      request.signal.addEventListener("abort", () => {
        cleanup();
        try {
          controller.close();
        } catch {}
      });

      write(": connected\n\n");
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
