"use client";

import { useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import RepoInput from "@/components/RepoInput";
import BranchFilter from "@/components/BranchFilter";
import TimelineScrubber from "@/components/TimelineScrubber";
import { CommitData, BranchData, RepoGraph } from "@/lib/types";
import { buildGraph } from "@/lib/dag";

const Scene = dynamic(() => import("@/components/Scene"), { ssr: false });

const MAX_WINDOW = 200;

export default function Home() {
  const [allCommits, setAllCommits] = useState<CommitData[]>([]);
  const [branches, setBranches] = useState<BranchData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visibleBranches, setVisibleBranches] = useState<Set<string>>(new Set());
  const [windowStart, setWindowStart] = useState(0);
  const [windowEnd, setWindowEnd] = useState(0);

  // Sort commits oldest-first for consistent ordering
  const sortedCommits = useMemo(() => {
    return [...allCommits].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [allCommits]);

  // Build full graph once (branch assignment needs all commits + branch tips)
  const fullGraph: RepoGraph | null = useMemo(() => {
    if (sortedCommits.length === 0 || branches.length === 0) return null;
    return buildGraph(sortedCommits, branches);
  }, [sortedCommits, branches]);

  // Window into the full graph for rendering
  const graph: RepoGraph | null = useMemo(() => {
    if (!fullGraph) return null;
    const windowNodes = fullGraph.nodes.slice(windowStart, windowEnd);
    if (windowNodes.length === 0) return null;
    const windowShas = new Set(windowNodes.map((n) => n.commit.sha));
    const windowEdges = fullGraph.edges.filter(
      (e) => windowShas.has(e.from) && windowShas.has(e.to)
    );
    return { nodes: windowNodes, edges: windowEdges, branches: fullGraph.branches };
  }, [fullGraph, windowStart, windowEnd]);

  const handleWindowChange = useCallback((start: number, end: number) => {
    setWindowStart(start);
    setWindowEnd(end);
  }, []);

  const handleSubmit = useCallback(async (url: string) => {
    setLoading(true);
    setError(null);
    setAllCommits([]);
    setBranches([]);
    setWindowStart(0);
    setWindowEnd(0);

    try {
      const res = await fetch(`/api/repo?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch repo");

      const commits: CommitData[] = data.commits;
      const fetchedBranches: BranchData[] = data.branches;

      setAllCommits(commits);
      setBranches(fetchedBranches);

      // Set initial window: pinned to right (most recent), up to 100 wide
      const sorted = [...commits].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      const total = sorted.length;
      const wSize = Math.min(total, 100);
      setWindowStart(total - wSize);
      setWindowEnd(total);

      setVisibleBranches(new Set(fetchedBranches.map((b) => b.name)));
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

  const showScene = graph && !loading;

  return (
    <div className="h-screen w-screen bg-neutral-100 text-neutral-900 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-neutral-300 shrink-0 bg-white">
        <h1 className="text-lg font-semibold tracking-tight font-mono">
          <span className="text-neutral-400">git</span>rail
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
              <div className="text-4xl font-bold font-mono">
                <span className="text-neutral-400">git</span>rail
              </div>
              <p className="text-neutral-500 text-sm max-w-md">
                Paste a public GitHub repo URL to visualize its commit graph in 3D.
                <br />
                Try{" "}
                <button
                  onClick={() => handleSubmit("github.com/expressjs/express")}
                  className="text-blue-600 hover:underline"
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
              <div className="w-5 h-5 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-neutral-500 text-sm">Fetching commit history...</span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 max-w-md">
              {error}
            </div>
          </div>
        )}

        {/* 3D Scene */}
        {showScene && (
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
            <div className="absolute bottom-4 left-4 text-xs text-neutral-400 font-mono">
              {nodeCount} commits &middot; {graph.branches.length} branches
              {sortedCommits.length > windowEnd - windowStart && (
                <span> &middot; {sortedCommits.length} total fetched</span>
              )}
            </div>

            {/* Timeline Scrubber */}
            <TimelineScrubber
              totalCommits={sortedCommits.length}
              windowStart={windowStart}
              windowEnd={windowEnd}
              maxWindow={MAX_WINDOW}
              backfilling={false}
              onWindowChange={handleWindowChange}
            />
          </>
        )}
      </main>
    </div>
  );
}
