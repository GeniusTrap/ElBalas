import React, { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, Line, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { assets } from '../assets/assets';

// Composant Bloc 3D (réutilisé depuis ConfigModal3D)
const Bloc3D = ({ position, hauteur, largeur, profondeur, nom, nbEtages, appartementsParEtage = [] }) => {
  const sketchMaterial = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    emissive: '#222222',
    roughness: 0.8,
    metalness: 0.1,
    transparent: true,
    opacity: 0.95
  });

  return (
    <group position={position}>
      <mesh 
        castShadow 
        receiveShadow
        position={[0, hauteur/2, 0]}
        material={sketchMaterial}
      >
        <boxGeometry args={[largeur, hauteur, profondeur]} />
      </mesh>

      <lineSegments 
        geometry={new THREE.EdgesGeometry(new THREE.BoxGeometry(largeur, hauteur, profondeur))} 
        position={[0, hauteur/2, 0]}
      >
        <lineBasicMaterial color="#F59E0B" linewidth={1} />
      </lineSegments>

      {[...Array(nbEtages - 1)].map((_, i) => {
        const yPosition = (i + 1) * (hauteur / nbEtages);
        return (
          <Line
            key={i}
            points={[
              [-largeur/2, yPosition, -profondeur/2],
              [largeur/2, yPosition, -profondeur/2],
              [largeur/2, yPosition, profondeur/2],
              [-largeur/2, yPosition, profondeur/2],
              [-largeur/2, yPosition, -profondeur/2]
            ]}
            color="#F59E0B"
            lineWidth={1.5}
          />
        );
      })}

      {/* Étiquette du bloc avec z-index controlé */}
      <Html 
        position={[0, hauteur + 1, 0]} 
        center
        style={{ 
          pointerEvents: 'none',
          zIndex: 1,
          transform: 'translateZ(0)'
        }}
      >
        <div className="bg-white/90 text-black px-2 py-0.5 rounded text-xs font-bold border border-black/30">
          {nom}
        </div>
      </Html>
    </group>
  );
};

const Blocs = ({ residenceData }) => {

  const [renderKey, setRenderKey] = useState(0);

  useEffect(() => {
    setRenderKey(prev => prev + 1);
  }, [residenceData]);

  const blocs = residenceData?.blocs || [];

  return (
    <div className="h-full w-full relative">
      {/* Canvas 3D en plein écran avec z-index controlé */}
      <div className="absolute inset-0" style={{ zIndex: 1 }}>
        <Canvas
          key={renderKey}
          shadows={false}
          camera={{ position: [15, 10, 15], fov: 50 }}
          className="w-full h-full"
        >
          <ambientLight intensity={1.2} />
          <directionalLight position={[5, 10, 5]} intensity={0.8} />
          
          <Grid 
            args={[30, 30]} 
            position={[0, -0.01, 0]} 
            cellColor="#cccccc" 
            sectionColor="#999999"
            cellSize={1}
            sectionSize={3}
          />
          
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
            <planeGeometry args={[30, 30]} />
            <meshStandardMaterial color="#f5f5f5" />
          </mesh>

          <Suspense fallback={null}>
            {blocs.map((bloc, index) => {
              // Convertir la position en tableau si c'est un objet
              const position = Array.isArray(bloc.position) 
                ? bloc.position 
                : [bloc.position?.x || 0, bloc.position?.y || 0, bloc.position?.z || 0];

              return (
                <Bloc3D
                  key={index}
                  nom={`Bloc ${bloc.nom}`}
                  position={position}
                  hauteur={bloc.hauteur || bloc.etages * 2}
                  largeur={bloc.largeur || 3}
                  profondeur={bloc.profondeur || 3}
                  nbEtages={bloc.etages}
                  appartementsParEtage={bloc.appartementsParEtage}
                />
              );
            })}
          </Suspense>

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

      {/* Message si aucun bloc */}
      {blocs.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Aucun bloc configuré</h2>
            <p className="text-gray-600">
              Ajoutez des blocs depuis le tableau de bord.
            </p>
          </div>
        </div>
      )}

      {/* Légende */}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3 text-sm" style={{ zIndex: 10 }}>
        <p className="text-gray-700">
          <span className="font-bold">Total :</span> {blocs.length} bloc(s)
        </p>
      </div>
    </div>
  );
};

export default Blocs;