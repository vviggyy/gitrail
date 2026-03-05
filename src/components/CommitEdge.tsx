"use client";

import { useMemo } from "react";
import { Line } from "@react-three/drei";
import { DAGNode } from "@/lib/types";
import * as THREE from "three";

interface CommitEdgeProps {
  from: DAGNode;
  to: DAGNode;
  isMerge: boolean;
}

export default function CommitEdge({ from, to, isMerge }: CommitEdgeProps) {
  const points = useMemo(() => {
    const start = new THREE.Vector3(from.x, from.y, from.z);
    const end = new THREE.Vector3(to.x, to.y, to.z);

    // For merge edges or cross-branch edges, create a curved path
    if (isMerge || from.z !== to.z) {
      const mid = new THREE.Vector3()
        .addVectors(start, end)
        .multiplyScalar(0.5);
      mid.y += 0.5; // arc upward
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      return curve.getPoints(20);
    }

    return [start, end];
  }, [from, to, isMerge]);

  return (
    <Line
      points={points}
      color={isMerge ? "#f59e0b" : "#6b7280"}
      lineWidth={isMerge ? 2 : 1.5}
      opacity={isMerge ? 0.7 : 0.5}
      transparent
    />
  );
}
