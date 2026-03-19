export interface CommitData {
  sha: string;
  message: string;
  author: string;
  date: string; // ISO string
  parents: string[]; // parent SHAs
  filesChanged: number;
}

export interface BranchData {
  name: string;
  commitSha: string; // HEAD of branch
}

export interface DAGNode {
  commit: CommitData;
  x: number;
  y: number;
  z: number;
  branch: string; // primary branch assignment
  color: string;
}

export interface DAGEdge {
  from: string; // SHA
  to: string; // SHA
  isMerge: boolean;
}

export interface RepoGraph {
  nodes: DAGNode[];
  edges: DAGEdge[];
  branches: string[];
}

export interface RepoRequest {
  owner: string;
  repo: string;
}

export interface RepoPageResponse {
  commits: CommitData[];
  branches: BranchData[];
  hasMore: boolean;
  page: number;
}
