"use client";

import {
  Center,
  Float,
  Html,
  Sparkles,
  useGLTF,
} from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useRef } from "react";
import type { Group, Mesh } from "three";
import { MathUtils } from "three";

type Scene3DProps = {
  className?: string;
  scale?: number;
  particleCount?: number;
  interactive?: boolean;
};

type ModelProps = {
  scale: number;
  interactive: boolean;
};

function ModelFallback() {
  return (
    <Html center>
      <div className="flex items-center justify-center">
        <div className="h-16 w-16 rounded-full border border-cyan-300/20 bg-cyan-300/10 shadow-[0_0_35px_rgba(34,211,238,0.24)]" />
      </div>
    </Html>
  );
}

function FloatingModel({ scale, interactive }: ModelProps) {
  const { scene } = useGLTF("/models/neuro-object.glb");
  const { size } = useThree();
  const pivotRef = useRef<Group>(null);
  const groupRef = useRef<Group>(null);
  const resolvedScale = size.width < 640 ? scale * 0.82 : scale;

  useEffect(() => {
    scene.traverse((child) => {
      const mesh = child as Mesh;

      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
  }, [scene]);

  useFrame((state, delta) => {
    const pivot = pivotRef.current;
    const group = groupRef.current;

    if (!pivot || !group) {
      return;
    }

    const pointerX = interactive ? state.pointer.x : 0;
    const pointerY = interactive ? state.pointer.y : 0;

    pivot.rotation.x = MathUtils.lerp(pivot.rotation.x, 0.08 - pointerY * 0.08, 0.045);
    pivot.rotation.y = MathUtils.lerp(pivot.rotation.y, 0.12 + pointerX * 0.14, 0.05);
    pivot.rotation.z = MathUtils.lerp(pivot.rotation.z, pointerX * 0.035, 0.04);
    pivot.position.x = MathUtils.lerp(pivot.position.x, pointerX * 0.16, 0.04);
    pivot.position.y = MathUtils.lerp(pivot.position.y, pointerY * 0.12, 0.04);

    group.rotation.y += delta * 0.08;
  });

  return (
    <Float speed={1} rotationIntensity={0.35} floatIntensity={1}>
      <group ref={pivotRef}>
        <group ref={groupRef} scale={resolvedScale}>
          <Center>
            <primitive object={scene} />
          </Center>
        </group>
      </group>
    </Float>
  );
}

export function Scene3D({
  className,
  scale = 1.2,
  particleCount = 36,
  interactive = true,
}: Scene3DProps) {
  return (
    <div
      className={["relative flex w-full items-center justify-center overflow-visible", className]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="pointer-events-none absolute inset-x-[18%] top-1/2 h-[48%] -translate-y-1/2 rounded-full bg-cyan-400/[0.18] blur-3xl" />
      <div className="pointer-events-none absolute inset-x-[28%] top-[58%] h-[28%] -translate-y-1/2 rounded-full bg-sky-400/[0.12] blur-2xl" />

      <Canvas
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 1.5]}
        camera={{ position: [0, 0.15, 4.8], fov: 36 }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.55} color="#dcf8ff" />
        <directionalLight
          position={[2.8, 3.6, 4.2]}
          intensity={1.7}
          color="#d2f8ff"
        />
        <pointLight position={[-2.4, -1.8, 2.8]} intensity={3.6} color="#38bdf8" />

        <Sparkles
          count={particleCount}
          scale={[5.5, 4, 5]}
          size={2.4}
          speed={0.22}
          opacity={0.55}
          color="#8ae7ff"
        />

        <Suspense fallback={<ModelFallback />}>
          <FloatingModel scale={scale} interactive={interactive} />
        </Suspense>
      </Canvas>

      <div className="pointer-events-none absolute inset-[-8%] bg-[radial-gradient(circle,rgba(103,232,249,0.18),transparent_58%)] blur-xl" />
    </div>
  );
}

useGLTF.preload("/models/neuro-object.glb");
