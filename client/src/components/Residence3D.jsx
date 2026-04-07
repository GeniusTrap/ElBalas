import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Html, Line } from '@react-three/drei';
import { Suspense, useRef } from 'react';
import * as THREE from 'three';

const Bloc = ({ position, hauteur, largeur, profondeur, nom, nbEtages }) => {
  const meshRef = useRef();
  
  // Création du matériau style esquisse
  const sketchMaterial = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    emissive: '#222222',
    roughness: 0.8,
    metalness: 0.1,
    wireframe: false,
    transparent: true,
    opacity: 0.95
  });

  // Lignes de contour (style crayon)
  const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(largeur, hauteur, profondeur));
  
  return (
    <group position={position}>
      {/* Corps du bâtiment - blanc cassé */}
      <mesh 
        ref={meshRef}
        castShadow 
        receiveShadow
        position={[0, hauteur/2, 0]}
        material={sketchMaterial}
      >
        <boxGeometry args={[largeur, hauteur, profondeur]} />
      </mesh>

      {/* Lignes de contour noires (style crayon) */}
      <lineSegments geometry={edges} position={[0, hauteur/2, 0]}>
        <lineBasicMaterial color="#000000" linewidth={1} />
      </lineSegments>

      {/* LIGNES D'ÉTAGES - visibles à l'intérieur */}
      {[...Array(nbEtages - 1)].map((_, i) => {
        const yPosition = (i + 1) * (hauteur / nbEtages);
        return (
          <group key={`etage-${i}`}>
            {/* Ligne horizontale qui traverse le bâtiment */}
            <Line
              points={[
                [-largeur/2, yPosition, -profondeur/2],
                [largeur/2, yPosition, -profondeur/2],
                [largeur/2, yPosition, profondeur/2],
                [-largeur/2, yPosition, profondeur/2],
                [-largeur/2, yPosition, -profondeur/2]
              ]}
              color="black"
              lineWidth={1.5}
              closed={true}
            />
            
            {/* Petits traits sur les côtés pour renforcer l'effet étage */}
            <Line
              points={[
                [-largeur/2 - 0.2, yPosition, 0],
                [-largeur/2, yPosition, 0]
              ]}
              color="black"
              lineWidth={1}
            />
            <Line
              points={[
                [largeur/2 + 0.2, yPosition, 0],
                [largeur/2, yPosition, 0]
              ]}
              color="black"
              lineWidth={1}
            />
          </group>
        );
      })}

      {/* Numéros d'étages (optionnel - petits indicateurs) */}
      {[...Array(nbEtages)].map((_, i) => {
        const yPosition = (i + 0.5) * (hauteur / nbEtages);
        return (
          <Html
            key={`numero-${i}`}
            position={[-largeur/2 - 0.5, yPosition, 0]}
            center
          >
            <div className="text-xs text-gray-500 opacity-60" style={{ fontFamily: 'monospace' }}>
              {i + 1}
            </div>
          </Html>
        );
      })}

      {/* Toit - style crayonné */}
      <mesh position={[0, hauteur + 0.2, 0]}>
        <coneGeometry args={[largeur * 0.8, 0.5, 4]} />
        <meshStandardMaterial color="#eeeeee" emissive="#111111" wireframe={false} />
      </mesh>
      
      {/* Contour du toit */}
      <Line
        points={[
          [-largeur*0.4, hauteur + 0.5, -largeur*0.4],
          [largeur*0.4, hauteur + 0.5, -largeur*0.4],
          [largeur*0.4, hauteur + 0.5, largeur*0.4],
          [-largeur*0.4, hauteur + 0.5, largeur*0.4],
          [-largeur*0.4, hauteur + 0.5, -largeur*0.4]
        ]}
        color="black"
        lineWidth={1}
      />

      {/* Étiquette du bloc avec nombre d'étages */}
      <Html position={[0, hauteur + 2, 0]} center>
        <div className="bg-white/90 text-black px-3 py-1 rounded-sm text-sm font-bold border border-black/30 shadow-none" style={{ fontFamily: 'monospace' }}>
          BLOC {nom} 
        </div>
      </Html>
    </group>
  );
};

const Residence3D = ({ blocs = [] }) => {
  const defaultBlocs = [
    { nom: 'A', position: [-8, 0, 0], hauteur: 8, largeur: 3, profondeur: 3, nbEtages: 4 },
    { nom: 'B', position: [0, 0, 0], hauteur: 8, largeur: 3, profondeur: 3, nbEtages: 4 },
    { nom: 'C', position: [8, 0, 0], hauteur: 8, largeur: 3, profondeur: 3, nbEtages: 4 },
    { nom: 'D', position: [-4, 0, 6], hauteur: 6, largeur: 3, profondeur: 3, nbEtages: 3 },
    { nom: 'E', position: [4, 0, 6], hauteur: 6, largeur: 3, profondeur: 3, nbEtages: 3 },
  ];

  const blocsToRender = blocs.length > 0 ? blocs : defaultBlocs;

  return (
    <div className="w-full h-[600px] bg-white rounded-2xl overflow-hidden border-2 border-gray-200">
      <Canvas
        shadows={false}
        camera={{ position: [15, 10, 15], fov: 50 }}
      >
        <ambientLight intensity={1.2} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />
        
        <gridHelper args={[30, 20]} position={[0, -0.01, 0]} color="#cccccc" />
        
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
          <planeGeometry args={[30, 30]} />
          <meshStandardMaterial color="#f5f5f5" />
        </mesh>

        {/* Les blocs */}
        <Suspense fallback={null}>
          {blocsToRender.map((bloc, index) => (
            <Bloc
              key={index}
              nom={bloc.nom}
              position={bloc.position}
              hauteur={bloc.hauteur}
              largeur={bloc.largeur || 3}
              profondeur={bloc.profondeur || 3}
              nbEtages={bloc.nbEtages}
            />
          ))}
        </Suspense>

        {/* Contrôles */}
        <OrbitControls
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          maxPolarAngle={Math.PI / 2}
          minDistance={5}
          maxDistance={30}
        />
      </Canvas>
    </div>
  );
};

export default Residence3D;