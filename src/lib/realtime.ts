"use client";

import { useEffect, useRef } from "react";
import type { RealtimeEvent } from "./types";

// One shared EventSource per tab, opened while at least one component is listening

type Listener = (event: RealtimeEvent) => void;

const listeners = new Set<Listener>();
let source: EventSource | null = null;

function dispatch(event: RealtimeEvent) {
  for (const listener of listeners) listener(event);
}

function connect() {
  let hasConnected = false;
  source = new EventSource("/api/events");
  source.onopen = () => {
    // EventSource reconnects on its own; anything sent while we were offline was missed
    if (hasConnected) dispatch({ type: "reconnected" });
    hasConnected = true;
  };
  source.onmessage = (message) => dispatch(JSON.parse(message.data) as RealtimeEvent);
}

export function useRealtimeEvent(handler: Listener, enabled = true) {
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    if (!enabled) return;
    const listener: Listener = (event) => handlerRef.current(event);
    listeners.add(listener);
    if (!source) connect();

    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        source?.close();
        source = null;
      }
    };
  }, [enabled]);
}
