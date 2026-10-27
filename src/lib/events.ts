import "server-only";
import { EventEmitter } from "node:events";
import { sql } from "./db";
import type { RealtimeEvent } from "./types";

// Realtime fan-out: API routes NOTIFY on a Postgres channel, and every server
// instance LISTENs and forwards events to its connected SSE clients.

const CHANNEL = "melodyshare_events";

interface Envelope {
  userIds: string[];
  event: RealtimeEvent;
}

const globalForEvents = globalThis as unknown as {
  eventBus?: EventEmitter;
  eventListen?: Promise<unknown>;
};

const bus = (globalForEvents.eventBus ??= new EventEmitter().setMaxListeners(0));

function ensureListening() {
  globalForEvents.eventListen ??= sql
    .listen(CHANNEL, (payload) => {
      const { userIds, event } = JSON.parse(payload) as Envelope;
      for (const userId of userIds) bus.emit(userId, event);
    })
    .catch((error) => {
      globalForEvents.eventListen = undefined;
      throw error;
    });
  return globalForEvents.eventListen;
}

export async function publish(userIds: string[], event: RealtimeEvent) {
  const envelope: Envelope = { userIds: [...new Set(userIds)], event };
  await sql.notify(CHANNEL, JSON.stringify(envelope));
}

export async function subscribe(userId: string, listener: (event: RealtimeEvent) => void) {
  await ensureListening();
  bus.on(userId, listener);
  return () => {
    bus.off(userId, listener);
  };
}
