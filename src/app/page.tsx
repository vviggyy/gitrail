"use client";

import { useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import RepoInput from "@/components/RepoInput";
import BranchFilter from "@/components/BranchFilter";
import { RepoGraph } from "@/lib/types";

// Dynamic import to avoid SSR issues with Three.js
const Scene = dynamic(() => import("@/components/Scene"), { ssr: false });

export default function Home() {
  const [graph, setGraph] = useState<RepoGraph | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visibleBranches, setVisibleBranches] = useState<Set<string>>(new Set());

  const handleSubmit = useCallback(async (url: string) => {
    setLoading(true);
    setError(null);
    setGraph(null);

    try {
      const res = await fetch(`/api/repo?url=${encodeURIComponent(url)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch repo");
      }

      setGraph(data as RepoGraph);
      setVisibleBranches(new Set(data.branches));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleToggleBranch = useCallback((branch: string) => {
    setVisibleBranches((prev) => {
      const next = new Set(prev);
      if (next.has(branch)) {
        next.delete(branch);
      } else {
        next.add(branch);
      }
      return next;
    });
  }, []);

  const nodeCount = useMemo(
    () => graph?.nodes.filter((n) => visibleBranches.has(n.branch)).length ?? 0,
    [graph, visibleBranches]
  );

  return (
    <div className="h-screen w-screen bg-gray-950 text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-gray-800/50 shrink-0">
        <h1 className="text-lg font-semibold tracking-tight">
          <span className="text-blue-400">git</span>rail
        </h1>
        <div className="flex items-center gap-4">
          <RepoInput onSubmit={handleSubmit} loading={loading} />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 relative">
        {/* Empty state */}
        {!graph && !loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="text-4xl font-bold">
                <span className="text-blue-400">git</span>rail
              </div>
              <p className="text-gray-500 text-sm max-w-md">
                Paste a public GitHub repo URL to visualize its commit graph in 3D.
                <br />
                Try{" "}
                <button
                  onClick={() => handleSubmit("github.com/expressjs/express")}
                  className="text-blue-400 hover:underline"
                >
                  expressjs/express
                </button>{" "}
                or any public repo.
              </p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-400 text-sm">Fetching commit history...</span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-red-900/30 border border-red-800 rounded-lg px-4 py-3 text-sm text-red-300 max-w-md">
              {error}
            </div>
          </div>
        )}

        {/* 3D Scene */}
        {graph && !loading && (
          <>
            <Scene graph={graph} visibleBranches={visibleBranches} />

            {/* Overlay controls */}
            <div className="absolute top-4 left-4 space-y-3">
              <BranchFilter
                branches={graph.branches}
                visible={visibleBranches}
                onToggle={handleToggleBranch}
              />
            </div>

            {/* Stats */}
            <div className="absolute bottom-4 left-4 text-xs text-gray-500 font-mono">
              {nodeCount} commits &middot; {graph.branches.length} branches
            </div>
          </>
        )}
      </main>
    </div>
  );
}
