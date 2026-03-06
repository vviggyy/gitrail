import { CommitData, BranchData, DAGNode, DAGEdge, RepoGraph } from "./types";

// Deterministic color from author name
function authorColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = ((hash % 360) + 360) % 360;
  // Darker saturation/lightness so colors read well on white background
  return `hsl(${hue}, 65%, 45%)`;
}

// Assign each commit to its "primary" branch
function assignBranches(
  commits: CommitData[],
  branches: BranchData[]
): Map<string, string> {
  const assignment = new Map<string, string>();
  const commitSet = new Set(commits.map((c) => c.sha));
  const parentToChildren = new Map<string, string[]>();

  for (const c of commits) {
    for (const p of c.parents) {
      if (!parentToChildren.has(p)) parentToChildren.set(p, []);
      parentToChildren.get(p)!.push(c.sha);
    }
  }

  // Build reachability: which commits are reachable from each branch tip
  const branchReach = new Map<string, Set<string>>();
  const commitsByDate = [...commits].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const shaToCommit = new Map(commits.map((c) => [c.sha, c]));

  for (const branch of branches) {
    const reachable = new Set<string>();
    const stack = [branch.commitSha];
    while (stack.length > 0) {
      const sha = stack.pop()!;
      if (reachable.has(sha) || !commitSet.has(sha)) continue;
      reachable.add(sha);
      const commit = shaToCommit.get(sha);
      if (commit) {
        for (const p of commit.parents) stack.push(p);
      }
    }
    branchReach.set(branch.name, reachable);
  }

  // Priority: main/master first, then by name length (shorter = more primary)
  const sortedBranches = [...branches].sort((a, b) => {
    const aMain = a.name === "main" || a.name === "master" ? 0 : 1;
    const bMain = b.name === "main" || b.name === "master" ? 0 : 1;
    if (aMain !== bMain) return aMain - bMain;
    return a.name.length - b.name.length;
  });

  // Assign each commit to the highest-priority branch that contains it
  for (const commit of commits) {
    for (const branch of sortedBranches) {
      if (branchReach.get(branch.name)?.has(commit.sha)) {
        assignment.set(commit.sha, branch.name);
        break;
      }
    }
    if (!assignment.has(commit.sha)) {
      assignment.set(commit.sha, sortedBranches[0]?.name || "unknown");
    }
  }

  return assignment;
}

export function buildGraph(
  commits: CommitData[],
  branches: BranchData[]
): RepoGraph {
  if (commits.length === 0) {
    return { nodes: [], edges: [], branches: [] };
  }

  const branchAssignment = assignBranches(commits, branches);

  // Sort commits by date for X-axis positioning
  const sorted = [...commits].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Determine branch names and their Z-index
  const branchNames = [
    ...new Set(
      branches
        .sort((a, b) => {
          const aMain = a.name === "main" || a.name === "master" ? 0 : 1;
          const bMain = b.name === "main" || b.name === "master" ? 0 : 1;
          if (aMain !== bMain) return aMain - bMain;
          return a.name.localeCompare(b.name);
        })
        .map((b) => b.name)
    ),
  ];
  const branchZIndex = new Map<string, number>();
  branchNames.forEach((name, i) => branchZIndex.set(name, i));

  // Grid-snapped spacing — every node sits on a grid intersection
  const GRID_CELL = 2; // matches the grid cellSize in Scene
  const LANE_SPACING = 3; // Z gap per branch lane (snapped to grid)

  // Build nodes — all positions land on grid intersections
  const nodes: DAGNode[] = sorted.map((commit, i) => {
    const branch = branchAssignment.get(commit.sha) || branchNames[0];
    const zIdx = branchZIndex.get(branch) || 0;

    return {
      commit,
      x: i * GRID_CELL,
      y: 0, // flat on the grid plane
      z: zIdx * LANE_SPACING,
      branch,
      color: authorColor(commit.author),
    };
  });

  // Build edges
  const shaSet = new Set(commits.map((c) => c.sha));
  const edges: DAGEdge[] = [];
  for (const commit of commits) {
    for (const parentSha of commit.parents) {
      if (shaSet.has(parentSha)) {
        const isMerge = commit.parents.length > 1;
        edges.push({
          from: parentSha,
          to: commit.sha,
          isMerge,
        });
      }
    }
  }

  return { nodes, edges, branches: branchNames };
}
