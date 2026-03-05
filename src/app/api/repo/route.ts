import { NextRequest, NextResponse } from "next/server";
import { fetchRepoData, parseRepoUrl } from "@/lib/github";
import { buildGraph } from "@/lib/dag";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing 'url' parameter" }, { status: 400 });
  }

  const parsed = parseRepoUrl(url);
  if (!parsed) {
    return NextResponse.json(
      { error: "Invalid GitHub repo URL. Use format: github.com/owner/repo" },
      { status: 400 }
    );
  }

  try {
    const { commits, branches } = await fetchRepoData(parsed.owner, parsed.repo);
    const graph = buildGraph(commits, branches);
    return NextResponse.json(graph);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch repo data";
    const status =
      message.includes("Not Found") ? 404 :
      message.includes("rate limit") ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
