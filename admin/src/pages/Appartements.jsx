import React, { useState, Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, Line, Grid, Text } from '@react-three/drei';
import * as THREE from 'three';
import { assets } from '../assets/assets';
import { backendUrl } from '../App';

// Composant Bloc 3D
const Bloc3D = ({ 
  position, hauteur, largeur, profondeur, nom, nbEtages, appartementsParEtage = [],
  onBlocClick,
  isSelected
}) => {
  const sketchMaterial = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    emissive: '#222222',
    roughness: 0.8,
    metalness: 0.1,
    transparent: true,
    opacity: 0.95
  });

  if (isSelected) return null;


const generateAppartementNumbers = () => {
  const numbers = [];
  
  for (let etage = 1; etage <= nbEtages; etage++) {
    const appartsDeLetage = appartementsParEtage[etage - 1] || [];
    const yPosition = (etage - 0.5) * (hauteur / nbEtages);
    
    // 🔥 Vérifier si c'est le RDC (etage === 1)
    const isRDC = (etage === 1);
    
    appartsDeLetage.forEach((appartNom, index) => {
      let x = 0, z = 0;
      let rotationY = 0;
      
      if (isRDC) {
        // 🟢 RDC : Disposition VERTICALE CENTRÉE sur les 4 faces
        const appartsParFace = Math.ceil(appartsDeLetage.length / 4);
        const faceIndex = Math.floor(index / appartsParFace);
        const positionDansFace = index % appartsParFace;
        
        // Nombre d'appartements sur cette face
        const appartsSurCetteFace = Math.min(appartsParFace, appartsDeLetage.length - (faceIndex * appartsParFace));
        
        // 🔥 CORRECTION : Limiter la zone verticale du RDC seulement
        const rdcStartY = 0;                    // bas du RDC
        const rdcEndY = hauteur / nbEtages;      // haut du RDC (juste avant l'étage 2)
        
        // Espacement plus serré pour que les noms restent dans leur zone
        const spacing = (rdcEndY - rdcStartY) / (appartsSurCetteFace + 1);
        const yOffset = rdcStartY + spacing * (positionDansFace + 1);
        
        // Position horizontale selon la face
        switch(faceIndex) {
          case 0: // Face avant
            x = 0;
            z = profondeur/2 + 0.05;
            rotationY = 0;
            break;
          case 1: // Face droite
            x = largeur/2 + 0.05;
            z = 0;
            rotationY = Math.PI / 2;
            break;
          case 2: // Face arrière
            x = 0;
            z = -profondeur/2 - 0.05;
            rotationY = Math.PI;
            break;
          case 3: // Face gauche
            x = -largeur/2 - 0.05;
            z = 0;
            rotationY = -Math.PI / 2;
            break;
        }
        
        numbers.push(
          <Text
            key={`${etage}-${index}`}
            position={[x, yOffset, z]}
            rotation={[0, rotationY, 0]}
            fontSize={0.4}
            color="black"
            anchorX="center"
            anchorY="middle"
            strokeWidth={0.02}
            strokeColor="black"
          >
            {appartNom}
          </Text>
        );
      } else {
        // 🔵 Autres étages : Disposition HORIZONTALE sur les 4 faces (inchangé)
        const appartsParFace = Math.ceil(appartsDeLetage.length / 4);
        const faceIndex = Math.floor(index / appartsParFace);
        const positionDansFace = index % appartsParFace;
        
        const espacement = largeur / (appartsParFace + 1);
        const offset = -largeur/2 + espacement * (positionDansFace + 1);
        
        switch(faceIndex) {
          case 0: 
            x = offset;
            z = profondeur/2 + 0.05;
            rotationY = 0;
            break;
          case 1: 
            x = largeur/2 + 0.05;
            z = -profondeur/2 + espacement * (positionDansFace + 1);
            rotationY = Math.PI / 2;
            break;
          case 2: 
            x = -offset;
            z = -profondeur/2 - 0.05;
            rotationY = Math.PI;
            break;
          case 3:
            x = -largeur/2 - 0.05;
            z = profondeur/2 - espacement * (positionDansFace + 1);
            rotationY = -Math.PI / 2;
            break;
        }
        
        numbers.push(
          <Text
            key={`${etage}-${index}`}
            position={[x, yPosition, z]}
            rotation={[0, rotationY, 0]}
            fontSize={0.4}
            color="black"
            anchorX="center"
            anchorY="middle"
            strokeWidth={0.02}
            strokeColor="black"
          >
            {appartNom}
          </Text>
        );
      }
    });
  }
  return numbers;
};

  return (
    <group position={position}>
      {/* Corps du bâtiment */}
      <mesh 
        castShadow 
        receiveShadow
        position={[0, hauteur/2, 0]}
        material={sketchMaterial}
        onClick={() => onBlocClick()}
        onPointerEnter={() => document.body.style.cursor = 'pointer'}
        onPointerLeave={() => document.body.style.cursor = 'default'}
      >
        <boxGeometry args={[largeur, hauteur, profondeur]} />
      </mesh>

      {/* Lignes de contour */}
      <lineSegments 
        geometry={new THREE.EdgesGeometry(new THREE.BoxGeometry(largeur, hauteur, profondeur))} 
        position={[0, hauteur/2, 0]}
      >
        <lineBasicMaterial color="#F59E0B" linewidth={1} />
      </lineSegments>

      {[...Array(nbEtages - 1)].map((_, i) => (
        <Line
          key={i}
          points={[
            [-largeur/2, (i + 1) * (hauteur / nbEtages), -profondeur/2],
            [largeur/2, (i + 1) * (hauteur / nbEtages), -profondeur/2],
            [largeur/2, (i + 1) * (hauteur / nbEtages), profondeur/2],
            [-largeur/2, (i + 1) * (hauteur / nbEtages), profondeur/2],
            [-largeur/2, (i + 1) * (hauteur / nbEtages), -profondeur/2]
          ]}
          color="#F59E0B"
          lineWidth={1.5}
        />
      ))}

      {/* Étiquette du bloc */}
      <Html 
  position={[0, hauteur + 1, 0]} 
  center
  style={{ 
    pointerEvents: 'none',
    zIndex: 1,  // ← Ajoutez ceci
    transform: 'translateZ(0)'  // ← Force un nouveau stacking context
  }}
>
  <div className="bg-white/90 text-black px-2 py-0.5 rounded text-xs font-bold border border-black/30">
    {nom}
  </div>
</Html>

      {generateAppartementNumbers()}
    </group>
  );
};

const AppartementsGrid = ({ bloc, onRetour }) => {
  const [locatairesData, setLocatairesData] = useState({});
  const [statutData, setStatutData] = useState({});
  const [appartementsData, setAppartementsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocatairesForBloc = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const response = await fetch(`${backendUrl}/api/locataires?bloc=${bloc.nom}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (data.success) {
          // Organiser les locataires par appartement
          const locatairesParAppart = {};
          const statutParAppart = {};

          data.locataires.forEach(loc => {
            locatairesParAppart[loc.appartementNom] = loc.nombreTotal;
            
            // Calculer si le loyer est payé pour la période actuelle
            const maintenant = new Date();
            const dateArrivee = new Date(loc.dateArrivee);
            dateArrivee.setHours(0, 0, 0, 0);
            
            const joursDepuisArrivee = Math.floor((maintenant - dateArrivee) / (1000 * 60 * 60 * 24));
            const periodeActuelle = Math.floor(joursDepuisArrivee / 30) + 1;
            
            const paiements = loc.paiements || [];
            const periodesPayees = paiements.map(p => p.periode);
            const periodePayee = periodesPayees.includes(periodeActuelle);
            
            statutParAppart[loc.appartementNom] = periodePayee;
          });
          
          setLocatairesData(locatairesParAppart);
          setStatutData(statutParAppart);
          
          // Préparer les données des appartements
          const apparts = [];
          for (let etage = 1; etage <= bloc.etages; etage++) {
            const appartsDeLetage = bloc.appartementsParEtage[etage - 1] || [];
            appartsDeLetage.forEach((nom, index) => {
              const locatairesCount = locatairesParAppart[nom] || 0;
              apparts.push({
                id: `${bloc.nom}${etage}${index + 1}`,
                nom: nom,
                etage: etage,
                locatairesCount: locatairesCount,
                estOccupe: locatairesCount > 0,
                estPaye: statutParAppart[nom] || false
              });
            });
          }
          setAppartementsData(apparts);
        }
      } catch (error) {
        console.error('Erreur chargement locataires:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLocatairesForBloc();
  }, [bloc]);


  if (loading) {
    return (
      <div className="min-h-screen bg-cover bg-center p-8 rounded-2xl flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cover bg-center p-8 rounded-2xl">
      <div className="mb-6">
        <button
          onClick={onRetour}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour aux blocs
        </button>
      </div>

      <div className="text-center mb-12 pt-8">
        <div className="inline-block bg-white/95 backdrop-blur-sm rounded-xl shadow-lg px-8 py-4">
          <h1 className="text-4xl font-bold text-gray-800">Bloc {bloc.nom}</h1>
          <p className="text-gray-600 mt-1">
            {bloc.etages} étages • {bloc.totalAppartements} appartements
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-12">
        {/* Grouper les appartements par étage */}
        {Array.from({ length: bloc.etages }, (_, i) => i + 1).map((etage) => {
          const appartementsDeLetage = appartementsData.filter(a => a.etage === etage);
          if (appartementsDeLetage.length === 0) return null;
          
          return (
            <div key={etage}>
              <h2 className="text-2xl font-bold text-yellow-600 drop-shadow-lg pb-2 mb-4">
  {etage === 1 ? 'REZ-DE-CHAUSSÉE' : `${etage - 1}ER ÉTAGE`}
</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {appartementsDeLetage.map((appartement) => (
                  <div
                    key={appartement.id}
                    className="bg-white transform rotate-[-1deg] hover:rotate-0 hover:scale-105 transition-all duration-300 shadow-xl p-6 rounded-lg cursor-pointer"
                    style={{ boxShadow: '5px 5px 15px rgba(0,0,0,0.3)' }}
                    onClick={() => console.log('Appartement cliqué:', appartement.nom)}
                  >
                    <div className="flex justify-center -mt-8 mb-4">
                      <div className={`w-6 h-6 rounded-full shadow-inner border-2 ${
                        !appartement.estOccupe ? 'bg-gray-400 border-gray-500' :
                        appartement.estPaye ? 'bg-green-500 border-green-600' : 'bg-yellow-500 border-yellow-600'
                      }`} />
                    </div>
                    <div className="text-center">
                      <h3 className="text-3xl font-bold text-gray-800 mb-2">{appartement.nom}</h3>
                      <div className="space-y-2 text-gray-700">
                        <p className="flex justify-between border-b border-black border-opacity-20 pb-1">
                          <span>Statut</span>
                          <span className={`font-bold ${
                            !appartement.estOccupe ? 'text-blue-600' :
                            appartement.estPaye ? 'text-green-600' : 'text-yellow-600'
                          }`}>
                            {!appartement.estOccupe ? 'Libre' : 
                             appartement.estPaye ? 'Occupé (payé)' : 'Occupé (non payé)'}
                          </span>
                        </p>
                        {appartement.estOccupe && (
                          <p className="flex justify-between border-b border-black border-opacity-20 pb-1">
                            <span>Locataires</span>
                            <span className="font-bold">{appartement.locatairesCount} pers.</span>
                          </p>
                        )}
                      </div>
                      <div className="mt-4 text-xs text-gray-600 italic">Cliquez pour gérer</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Composant principal
const Appartements = ({ residenceData }) => {
  const [selectedBloc, setSelectedBloc] = useState(null);

  useEffect(() => {
  }, [residenceData]);

  const handleBlocClick = (bloc) => {
    setSelectedBloc(bloc);
  };

  if (selectedBloc) {
    return <AppartementsGrid bloc={selectedBloc} onRetour={() => setSelectedBloc(null)} />;
  }

  const blocs = residenceData?.blocs || [];

  return (
    <div className="h-full w-full relative">
      <div className="absolute inset-0" style={{ zIndex: 1 }}>
        <Canvas
          key={blocs.length}
          shadows={false}
          camera={{ position: [15, 10, 15], fov: 50 }}
        >
          <ambientLight intensity={1.2} />
          <directionalLight position={[5, 10, 5]} intensity={0.8} />
          
          <Grid args={[30, 30]} position={[0, -0.01, 0]} cellColor="#cccccc" sectionColor="#999999" cellSize={1} sectionSize={3} />
          
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
            <planeGeometry args={[30, 30]} />
            <meshStandardMaterial color="#f5f5f5" />
          </mesh>

          <Suspense fallback={null}>
  {blocs.map((bloc, index) => {
    const position = Array.isArray(bloc.position) 
      ? bloc.position 
      : [bloc.position?.x || 0, bloc.position?.y || 0, bloc.position?.z || 0];

    return (
      <Bloc3D
        key={index}
        nom={bloc.nom}
        position={position}
        hauteur={bloc.hauteur || bloc.etages * 2}
        largeur={bloc.largeur || 3}
        profondeur={bloc.profondeur || 3}
        nbEtages={bloc.etages}
        appartementsParEtage={bloc.appartementsParEtage}
        onBlocClick={() => handleBlocClick(bloc)}
        isSelected={selectedBloc?.nom === bloc.nom}
      />
    );
  })}
</Suspense>

          <OrbitControls enableZoom={true} enablePan={true} enableRotate={true} maxPolarAngle={Math.PI / 2} minDistance={5} maxDistance={30} />
        </Canvas>
      </div>

      {blocs.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Aucun bloc configuré</h2>
            <p className="text-gray-600">Ajoutez des blocs depuis le tableau de bord.</p>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3 text-sm" style={{ zIndex: 10 }}>
        <p className="text-gray-700">👆 Cliquez sur un bloc pour voir tous ses appartements</p>
      </div>
    </div>
  );
};

export default Appartements;