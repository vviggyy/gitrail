"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Grid, Text } from "@react-three/drei";
import * as THREE from "three";
import { RepoGraph, DAGNode } from "@/lib/types";
import CommitNode from "./CommitNode";
import CommitEdge from "./CommitEdge";

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

    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    const cz = (Math.min(...zs) + Math.max(...zs)) / 2;

    const rangeX = Math.max(...xs) - Math.min(...xs);
    const rangeZ = Math.max(...zs) - Math.min(...zs);
    const maxRange = Math.max(rangeX, rangeZ, 10);

    const dist = maxRange * 0.8;
    camera.position.set(cx + dist * 0.3, cy + dist * 0.5, cz + dist * 0.6);
    camera.lookAt(cx, cy, cz);
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

  const center = useMemo(() => {
    if (filteredNodes.length === 0) return new THREE.Vector3(0, 0, 0);
    const xs = filteredNodes.map((n) => n.x);
    const ys = filteredNodes.map((n) => n.y);
    const zs = filteredNodes.map((n) => n.z);
    return new THREE.Vector3(
      (Math.min(...xs) + Math.max(...xs)) / 2,
      (Math.min(...ys) + Math.max(...ys)) / 2,
      (Math.min(...zs) + Math.max(...zs)) / 2
    );
  }, [filteredNodes]);

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
        fadeDistance={120}
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
        maxDistance={500}
      />
    </>
  );
}

export default function Scene({ graph, visibleBranches }: SceneProps) {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Canvas
        camera={{ fov: 50, near: 0.1, far: 2000, position: [20, 15, 20] }}
        onPointerMissed={() => {}}
        gl={{ antialias: true }}
        style={{ background: "#f5f5f5" }}
      >
        <SceneContent graph={graph} visibleBranches={visibleBranches} />
      </Canvas>
    </div>
  );
}
