import { Canvas, useFrame } from '@react-three/fiber';
import { Float, PerspectiveCamera, Environment, Stars } from '@react-three/drei';
import { useRef, useState } from 'react';
import * as THREE from 'three';

function FloatingShape({ position, color, ...props }: any) {
    const meshRef = useRef<THREE.Mesh>(null);
    const [hovered, setHover] = useState(false);

    useFrame((_, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.x += delta * 0.2;
            meshRef.current.rotation.y += delta * 0.3;
        }
    });

    return (
        <Float speed={2} rotationIntensity={1} floatIntensity={1}>
            <mesh
                ref={meshRef}
                position={position}
                onPointerOver={() => setHover(true)}
                onPointerOut={() => setHover(false)}
                scale={hovered ? 1.2 : 1}
                {...props}
            >
                <icosahedronGeometry args={[1, 0]} />
                <meshStandardMaterial
                    color={color}
                    roughness={0.1}
                    metalness={0.8}
                    emissive={color}
                    emissiveIntensity={0.2}
                />
            </mesh>
        </Float>
    );
}

export function Hero3D() {
    return (
        <div className="absolute inset-0 -z-10 h-full w-full">
            <Canvas>
                <PerspectiveCamera makeDefault position={[0, 0, 10]} />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <pointLight position={[-10, -10, -10]} color="purple" intensity={2} />

                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

                <FloatingShape position={[-4, 2, -5]} color="#6d28d9" />
                <FloatingShape position={[4, -2, -5]} color="#db2777" />
                <FloatingShape position={[0, 3, -8]} color="#2563eb" />
                <FloatingShape position={[-6, -3, -10]} color="#4f46e5" />
                <FloatingShape position={[6, 4, -12]} color="#9333ea" />

                <Environment preset="city" />
            </Canvas>
        </div>
    );
}
