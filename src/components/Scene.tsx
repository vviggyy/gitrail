"use client";

import { useState, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Text } from "@react-three/drei";
import { RepoGraph, DAGNode } from "@/lib/types";
import CommitNode from "./CommitNode";
import CommitEdge from "./CommitEdge";

interface SceneProps {
  graph: RepoGraph;
  visibleBranches: Set<string>;
}

export default function Scene({ graph, visibleBranches }: SceneProps) {
  const [selected, setSelected] = useState<DAGNode | null>(null);

  const nodeMap = useMemo(() => {
    const map = new Map<string, DAGNode>();
    for (const node of graph.nodes) {
      map.set(node.commit.sha, node);
    }
    return map;
  }, [graph.nodes]);

  const filteredNodes = useMemo(
    () => graph.nodes.filter((n) => visibleBranches.has(n.branch)),
    [graph.nodes, visibleBranches]
  );

  const filteredEdges = useMemo(
    () =>
      graph.edges.filter((e) => {
        const from = nodeMap.get(e.from);
        const to = nodeMap.get(e.to);
        return from && to && visibleBranches.has(from.branch) && visibleBranches.has(to.branch);
      }),
    [graph.edges, nodeMap, visibleBranches]
  );

  // Camera target: center of the graph
  const center = useMemo(() => {
    if (filteredNodes.length === 0) return [0, 0, 0] as const;
    const xs = filteredNodes.map((n) => n.x);
    const ys = filteredNodes.map((n) => n.y);
    const zs = filteredNodes.map((n) => n.z);
    return [
      (Math.min(...xs) + Math.max(...xs)) / 2,
      (Math.min(...ys) + Math.max(...ys)) / 2,
      (Math.min(...zs) + Math.max(...zs)) / 2,
    ] as const;
  }, [filteredNodes]);

  const cameraDistance = Math.max(filteredNodes.length * 1.2, 15);

  return (
    <Canvas
      camera={{
        position: [center[0] + cameraDistance * 0.5, cameraDistance * 0.4, center[2] + cameraDistance * 0.6],
        fov: 50,
        near: 0.1,
        far: 2000,
      }}
      className="w-full h-full"
      onPointerMissed={() => setSelected(null)}
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      <pointLight position={[-10, -10, -5]} intensity={0.3} />

      {/* Axis labels */}
      <Text
        position={[center[0], -1.5, center[2] - 2]}
        fontSize={0.6}
        color="#6b7280"
        anchorX="center"
      >
        time →
      </Text>

      <Grid
        args={[200, 200]}
        position={[center[0], -1, center[2]]}
        cellSize={2}
        cellColor="#1f2937"
        sectionSize={10}
        sectionColor="#374151"
        fadeDistance={100}
        infiniteGrid
      />

      {/* Branch labels */}
      {graph.branches
        .filter((b) => visibleBranches.has(b))
        .map((branch, i) => (
          <Text
            key={branch}
            position={[-3, 0, i * 3]}
            fontSize={0.4}
            color="#9ca3af"
            anchorX="right"
          >
            {branch}
          </Text>
        ))}

      {/* Edges first (behind nodes) */}
      {filteredEdges.map((edge) => {
        const from = nodeMap.get(edge.from);
        const to = nodeMap.get(edge.to);
        if (!from || !to) return null;
        return (
          <CommitEdge
            key={`${edge.from}-${edge.to}`}
            from={from}
            to={to}
            isMerge={edge.isMerge}
          />
        );
      })}

      {/* Commit nodes */}
      {filteredNodes.map((node) => (
        <CommitNode
          key={node.commit.sha}
          node={node}
          onSelect={setSelected}
          selected={selected?.commit.sha === node.commit.sha}
        />
      ))}

      <OrbitControls
        target={[center[0], center[1], center[2]]}
        enableDamping
        dampingFactor={0.1}
        maxDistance={500}
      />
    </Canvas>
  );
}
