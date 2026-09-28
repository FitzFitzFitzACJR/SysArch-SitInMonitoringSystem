"use client";

import { useEffect, useState } from "react";
import type { LabSnapshot } from "./types";

export type Connection = "connecting" | "live" | "reconnecting";

/**
 * Subscribes to a lab's live snapshot. Starts from the server-rendered snapshot so the
 * first paint is complete, then replaces it with every update pushed over SSE.
 */
export function useLiveLab(initial: LabSnapshot) {
  const [snapshot, setSnapshot] = useState(initial);
  const [connection, setConnection] = useState<Connection>("connecting");

  // Navigating to another lab gives a new initial snapshot: adopt it.
  const [prevInitial, setPrevInitial] = useState(initial);
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    setSnapshot(initial);
  }

  useEffect(() => {
    const source = new EventSource(`/api/labs/${initial.labId}/stream`);
    source.addEventListener("snapshot", (e) => {
      setSnapshot(JSON.parse((e as MessageEvent<string>).data));
      setConnection("live");
    });
    source.onopen = () => setConnection("live");
    // EventSource retries by itself (we close the stream every ~55s on purpose).
    source.onerror = () => setConnection("reconnecting");
    return () => source.close();
  }, [initial.labId]);

  return { snapshot, connection };
}
