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
      <div className="bg-gray-900/95 backdrop-blur text-white text-xs rounded-lg px-3 py-2 w-64 shadow-xl border border-gray-700/50">
        <div className="font-mono text-yellow-400 mb-1">
          {commit.sha.slice(0, 8)}
        </div>
        <div className="font-medium mb-1 leading-tight">{commit.message}</div>
        <div className="text-gray-400 space-y-0.5">
          <div>{commit.author}</div>
          <div>{date}</div>
          <div className="text-blue-400">{branch}</div>
          {commit.filesChanged > 0 && (
            <div>{commit.filesChanged} files changed</div>
          )}
        </div>
      </div>
    </Html>
  );
}
