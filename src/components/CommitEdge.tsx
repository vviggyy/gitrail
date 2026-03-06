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

    if (isMerge || from.z !== to.z) {
      const mid = new THREE.Vector3()
        .addVectors(start, end)
        .multiplyScalar(0.5);
      mid.y += 0.5;
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      return curve.getPoints(20);
    }

    return [start, end];
  }, [from, to, isMerge]);

  return (
    <Line
      points={points}
      color={isMerge ? "#b45309" : "#404040"}
      lineWidth={isMerge ? 2.5 : 1.8}
      opacity={isMerge ? 0.8 : 0.6}
      transparent
    />
  );
}
