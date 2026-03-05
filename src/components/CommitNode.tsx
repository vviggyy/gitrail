"use client";

import { useRef, useState } from "react";
import { Sphere } from "@react-three/drei";
import { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { DAGNode } from "@/lib/types";
import CommitTooltip from "./Tooltip";

interface CommitNodeProps {
  node: DAGNode;
  onSelect: (node: DAGNode | null) => void;
  selected: boolean;
}

export default function CommitNode({ node, onSelect, selected }: CommitNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const baseSize = 0.2 + Math.min(node.commit.filesChanged * 0.05, 0.4);
  const scale = hovered || selected ? 1.4 : 1;

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = "pointer";
  };

  const handlePointerOut = () => {
    setHovered(false);
    document.body.style.cursor = "auto";
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect(selected ? null : node);
  };

  return (
    <group position={[node.x, node.y, node.z]}>
      <Sphere
        ref={meshRef}
        args={[baseSize, 16, 16]}
        scale={scale}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <meshStandardMaterial
          color={node.color}
          emissive={node.color}
          emissiveIntensity={hovered || selected ? 0.4 : 0.1}
          roughness={0.4}
          metalness={0.3}
        />
      </Sphere>
      {(hovered || selected) && <CommitTooltip node={node} pinned={selected} />}
    </group>
  );
}
