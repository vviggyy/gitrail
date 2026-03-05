import { Octokit } from "octokit";
import { CommitData, BranchData } from "./types";

const octokit = new Octokit();

export function parseRepoUrl(url: string): { owner: string; repo: string } | null {
  // Handle formats: github.com/owner/repo, https://github.com/owner/repo, owner/repo
  const cleaned = url.trim().replace(/\/+$/, "");
  const patterns = [
    /github\.com\/([^/]+)\/([^/]+)/,
    /^([^/]+)\/([^/]+)$/,
  ];
  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match) {
      return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
    }
  }
  return null;
}

export async function fetchBranches(
  owner: string,
  repo: string
): Promise<BranchData[]> {
  const { data } = await octokit.rest.repos.listBranches({
    owner,
    repo,
    per_page: 30,
  });
  return data.map((b) => ({
    name: b.name,
    commitSha: b.commit.sha,
  }));
}

export async function fetchCommitsForBranch(
  owner: string,
  repo: string,
  branch: string,
  perPage = 100
): Promise<CommitData[]> {
  const { data } = await octokit.rest.repos.listCommits({
    owner,
    repo,
    sha: branch,
    per_page: perPage,
  });

  return data.map((c) => ({
    sha: c.sha,
    message: c.commit.message.split("\n")[0], // first line only
    author: c.commit.author?.name || c.author?.login || "unknown",
    date: c.commit.author?.date || new Date().toISOString(),
    parents: c.parents.map((p) => p.sha),
    filesChanged: 0, // we'll estimate from stats if available
  }));
}

export async function fetchRepoData(
  owner: string,
  repo: string
): Promise<{ commits: CommitData[]; branches: BranchData[] }> {
  const branches = await fetchBranches(owner, repo);

  // Fetch commits for each branch, deduplicate by SHA
  const commitMap = new Map<string, CommitData>();
  const branchCommits = new Map<string, Set<string>>();

  for (const branch of branches) {
    const commits = await fetchCommitsForBranch(owner, repo, branch.name);
    const shaSet = new Set<string>();
    for (const commit of commits) {
      commitMap.set(commit.sha, commit);
      shaSet.add(commit.sha);
    }
    branchCommits.set(branch.name, shaSet);
  }

  return {
    commits: Array.from(commitMap.values()),
    branches,
  };
}
