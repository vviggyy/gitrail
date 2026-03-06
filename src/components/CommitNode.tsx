"use client";

import { useRef, useState } from "react";
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

  const baseSize = 0.55 + Math.min(node.commit.filesChanged * 0.08, 0.35);
  const scale = hovered || selected ? 1.25 : 1;

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
      {/* Flat cylindrical node — industrial / schematic feel */}
      <mesh
        ref={meshRef}
        scale={scale}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <cylinderGeometry args={[baseSize, baseSize, 0.18, 32]} />
        <meshStandardMaterial
          color={node.color}
          roughness={0.6}
          metalness={0.4}
          emissive={node.color}
          emissiveIntensity={hovered || selected ? 0.3 : 0.05}
        />
      </mesh>
      {/* Thin ring outline */}
      <mesh scale={scale} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[baseSize * 0.95, baseSize * 1.1, 32]} />
        <meshBasicMaterial
          color={hovered || selected ? "#171717" : "#525252"}
          side={THREE.DoubleSide}
        />
      </mesh>
      {(hovered || selected) && <CommitTooltip node={node} pinned={selected} />}
    </group>
  );
}
