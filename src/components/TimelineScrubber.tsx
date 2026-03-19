"use client";

import { useRef, useCallback, useEffect, useState } from "react";

interface TimelineScrubberProps {
  totalCommits: number;
  windowStart: number;
  windowEnd: number;
  maxWindow: number;
  backfilling: boolean;
  onWindowChange: (start: number, end: number) => void;
}

type DragMode = "left" | "right" | "body" | null;

export default function TimelineScrubber({
  totalCommits,
  windowStart,
  windowEnd,
  maxWindow,
  backfilling,
  onWindowChange,
}: TimelineScrubberProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragMode = useRef<DragMode>(null);
  const dragStartX = useRef(0);
  const dragStartWindow = useRef({ start: 0, end: 0 });
  const [dragging, setDragging] = useState(false);

  const windowSize = windowEnd - windowStart;

  const toTrackFraction = useCallback(
    (index: number) => (totalCommits <= 1 ? 0 : index / (totalCommits - 1)),
    [totalCommits]
  );

  const fromTrackPixel = useCallback(
    (px: number) => {
      const track = trackRef.current;
      if (!track || totalCommits <= 1) return 0;
      const rect = track.getBoundingClientRect();
      const frac = Math.max(0, Math.min(1, (px - rect.left) / rect.width));
      return Math.round(frac * (totalCommits - 1));
    },
    [totalCommits]
  );

  const clampWindow = useCallback(
    (start: number, end: number): [number, number] => {
      let s = Math.max(0, Math.round(start));
      let e = Math.min(totalCommits, Math.round(end));
      // Enforce max window
      if (e - s > maxWindow) {
        // Keep the side that isn't being dragged
        if (dragMode.current === "left") {
          s = e - maxWindow;
        } else {
          e = s + maxWindow;
        }
      }
      // Minimum window size of 10
      if (e - s < 10) {
        if (dragMode.current === "left") {
          s = Math.max(0, e - 10);
        } else {
          e = Math.min(totalCommits, s + 10);
        }
      }
      s = Math.max(0, s);
      e = Math.min(totalCommits, e);
      return [s, e];
    },
    [totalCommits, maxWindow]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent, mode: DragMode) => {
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      dragMode.current = mode;
      dragStartX.current = e.clientX;
      dragStartWindow.current = { start: windowStart, end: windowEnd };
      setDragging(true);
    },
    [windowStart, windowEnd]
  );

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!dragMode.current || !trackRef.current) return;
      const track = trackRef.current;
      const rect = track.getBoundingClientRect();
      const deltaFrac = (e.clientX - dragStartX.current) / rect.width;
      const deltaIndex = Math.round(deltaFrac * (totalCommits - 1));

      const { start: origStart, end: origEnd } = dragStartWindow.current;

      let newStart: number, newEnd: number;

      if (dragMode.current === "body") {
        const size = origEnd - origStart;
        newStart = origStart + deltaIndex;
        newEnd = newStart + size;
        if (newStart < 0) {
          newStart = 0;
          newEnd = size;
        }
        if (newEnd > totalCommits) {
          newEnd = totalCommits;
          newStart = totalCommits - size;
        }
        onWindowChange(Math.max(0, newStart), Math.min(totalCommits, newEnd));
      } else if (dragMode.current === "left") {
        newStart = origStart + deltaIndex;
        newEnd = origEnd;
        const [s, e] = clampWindow(newStart, newEnd);
        onWindowChange(s, e);
      } else {
        newStart = origStart;
        newEnd = origEnd + deltaIndex;
        const [s, e] = clampWindow(newStart, newEnd);
        onWindowChange(s, e);
      }
    },
    [totalCommits, clampWindow, onWindowChange]
  );

  const onPointerUp = useCallback(() => {
    dragMode.current = null;
    setDragging(false);
  }, []);

  useEffect(() => {
    if (!dragging) return;
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [dragging, onPointerMove, onPointerUp]);

  if (totalCommits === 0) return null;

  const leftPct = toTrackFraction(windowStart) * 100;
  const widthPct = toTrackFraction(windowEnd - 1) * 100 - leftPct + (1 / Math.max(totalCommits - 1, 1)) * 100;

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[min(80vw,600px)] select-none">
      {/* Commit count label */}
      <div
        className="text-[10px] text-neutral-400 font-mono mb-1 whitespace-nowrap"
        style={{
          marginLeft: `${leftPct + widthPct / 2}%`,
          transform: "translateX(-50%)",
        }}
      >
        {windowSize} commits ({windowStart}–{windowEnd})
        {backfilling && (
          <span className="ml-2 text-neutral-300">
            <span className="inline-block w-2 h-2 border border-neutral-400 border-t-transparent rounded-full animate-spin mr-1 align-middle" />
            loading...
          </span>
        )}
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        className="relative h-6 flex items-center"
      >
        {/* Grey track line */}
        <div className="absolute left-0 right-0 h-[3px] bg-neutral-300 rounded-full" />

        {/* Accent slider */}
        <div
          className="absolute h-[7px] bg-neutral-500 rounded-full cursor-grab active:cursor-grabbing"
          style={{
            left: `${leftPct}%`,
            width: `${Math.max(widthPct, 1)}%`,
          }}
          onPointerDown={(e) => onPointerDown(e, "body")}
        >
          {/* Left handle */}
          <div
            className="absolute -left-1 top-1/2 -translate-y-1/2 w-3 h-4 cursor-ew-resize"
            onPointerDown={(e) => onPointerDown(e, "left")}
          >
            <div className="w-[3px] h-full bg-neutral-600 rounded-full mx-auto" />
          </div>

          {/* Right handle */}
          <div
            className="absolute -right-1 top-1/2 -translate-y-1/2 w-3 h-4 cursor-ew-resize"
            onPointerDown={(e) => onPointerDown(e, "right")}
          >
            <div className="w-[3px] h-full bg-neutral-600 rounded-full mx-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}
