"use client";

import { Html } from "@react-three/drei";
import { DAGNode } from "@/lib/types";

interface TooltipProps {
  node: DAGNode;
  pinned: boolean;
}

export default function CommitTooltip({ node, pinned }: TooltipProps) {
  const { commit, branch } = node;
  const date = new Date(commit.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Html
      distanceFactor={10}
      position={[0, 0.6, 0]}
      style={{ pointerEvents: pinned ? "auto" : "none" }}
    >
      <div
        style={{
          background: "rgba(255,255,255,0.96)",
          backdropFilter: "blur(8px)",
          color: "#1a1a1a",
          fontSize: "11px",
          borderRadius: "6px",
          padding: "8px 12px",
          width: "256px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
          border: "1px solid #d4d4d4",
          fontFamily: "ui-monospace, monospace",
        }}
      >
        <div style={{ color: "#b45309", fontWeight: 600, marginBottom: 4 }}>
          {commit.sha.slice(0, 8)}
        </div>
        <div style={{ fontWeight: 500, marginBottom: 4, lineHeight: 1.3 }}>
          {commit.message}
        </div>
        <div style={{ color: "#737373", lineHeight: 1.5 }}>
          <div>{commit.author}</div>
          <div>{date}</div>
          <div style={{ color: "#2563eb" }}>{branch}</div>
          {commit.filesChanged > 0 && (
            <div>{commit.filesChanged} files changed</div>
          )}
        </div>
      </div>
    </Html>
  );
}
