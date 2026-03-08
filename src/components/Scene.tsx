"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Grid, Text } from "@react-three/drei";
import * as THREE from "three";
import { RepoGraph, DAGNode } from "@/lib/types";
import CommitNode from "./CommitNode";
import CommitEdge from "./CommitEdge";

// Safe min/max that won't blow the call stack on large arrays
function arrayMin(arr: number[]): number {
  let min = Infinity;
  for (let i = 0; i < arr.length; i++) if (arr[i] < min) min = arr[i];
  return min;
}
function arrayMax(arr: number[]): number {
  let max = -Infinity;
  for (let i = 0; i < arr.length; i++) if (arr[i] > max) max = arr[i];
  return max;
}

interface SceneProps {
  graph: RepoGraph;
  visibleBranches: Set<string>;
}

function CameraRig({ nodes }: { nodes: DAGNode[] }) {
  const { camera } = useThree();
  const fitted = useRef(false);

  useEffect(() => {
    if (nodes.length === 0 || fitted.current) return;
    fitted.current = true;

    const xs = nodes.map((n) => n.x);
    const ys = nodes.map((n) => n.y);
    const zs = nodes.map((n) => n.z);

    const cx = (arrayMin(xs) + arrayMax(xs)) / 2;
    const cy = (arrayMin(ys) + arrayMax(ys)) / 2;
    const cz = (arrayMin(zs) + arrayMax(zs)) / 2;

    const rangeX = arrayMax(xs) - arrayMin(xs);
    const rangeZ = arrayMax(zs) - arrayMin(zs);
    const maxRange = Math.max(rangeX, rangeZ, 10);

    const dist = maxRange * 0.8;
    camera.position.set(cx + dist * 0.3, cy + dist * 0.5, cz + dist * 0.6);
    camera.lookAt(cx, cy, cz);
    camera.far = Math.max(dist * 4, 2000);
    camera.updateProjectionMatrix();
  }, [nodes, camera]);

  return null;
}

function SceneContent({ graph, visibleBranches }: SceneProps) {
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

  const GRID_CELL = 2; // must match dag.ts GRID_CELL

  const { center, graphExtent } = useMemo(() => {
    if (filteredNodes.length === 0)
      return { center: new THREE.Vector3(0, 0, 0), graphExtent: 10 };
    const xs = filteredNodes.map((n) => n.x);
    const ys = filteredNodes.map((n) => n.y);
    const zs = filteredNodes.map((n) => n.z);
    // Snap center to nearest grid intersection so grid lines align with nodes
    const snap = (v: number) => Math.round(v / GRID_CELL) * GRID_CELL;
    const rangeX = arrayMax(xs) - arrayMin(xs);
    const rangeZ = arrayMax(zs) - arrayMin(zs);
    return {
      center: new THREE.Vector3(
        snap((arrayMin(xs) + arrayMax(xs)) / 2),
        (arrayMin(ys) + arrayMax(ys)) / 2,
        snap((arrayMin(zs) + arrayMax(zs)) / 2)
      ),
      graphExtent: Math.max(rangeX, rangeZ, 10),
    };
  }, [filteredNodes]);

  const fadeDist = Math.max(graphExtent * 1.5, 120);

  return (
    <>
      <color attach="background" args={["#f5f5f5"]} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 10, 5]} intensity={0.6} />
      <pointLight position={[-10, -10, -5]} intensity={0.2} />

      <CameraRig nodes={filteredNodes} />

      {/* Primary grid — cell lines */}
      <Grid
        args={[200, 200]}
        position={[center.x, -0.01, center.z]}
        cellSize={2}
        cellColor="#d4d4d4"
        sectionSize={10}
        sectionColor="#a3a3a3"
        fadeDistance={fadeDist}
        infiniteGrid
      />

      {/* Branch labels */}
      {graph.branches
        .filter((b) => visibleBranches.has(b))
        .map((branch, i) => (
          <Text
            key={branch}
            position={[-3, 0, i * 4]}
            fontSize={0.4}
            color="#737373"
            anchorX="right"
            font={undefined}
          >
            {branch}
          </Text>
        ))}

      {/* Edges */}
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
        target={[center.x, center.y, center.z]}
        enableDamping
        dampingFactor={0.1}
        maxDistance={Math.max(graphExtent * 3, 500)}
      />
    </>
  );
}

export default function Scene({ graph, visibleBranches }: SceneProps) {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Canvas
        camera={{ fov: 50, near: 0.1, far: 10000, position: [20, 15, 20] }}
        onPointerMissed={() => {}}
        gl={{ antialias: true }}
        style={{ background: "#f5f5f5" }}
      >
        <SceneContent graph={graph} visibleBranches={visibleBranches} />
      </Canvas>
    </div>
  );
}
