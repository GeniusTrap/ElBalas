import React, { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, Line, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { backendUrl } from '../App';

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
        <lineBasicMaterial color="#000000" linewidth={1} />
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
            color="black"
            lineWidth={1.5}
          />
        );
      })}

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

const ConfigModal3D = ({ setShowConfigModal, setIsFirstTime, setResidenceData }) => {
  const [step, setStep] = useState(1); 
  const [formData, setFormData] = useState({
    residenceName: '',
    blocs: []
  });


  const isBlocNameTaken = (nom) => {
  return formData.blocs.some(bloc => bloc.nom === nom);
};
  
  const [currentBloc, setCurrentBloc] = useState({
    nom: '',
    etages: 0,
    appartementsParEtage: []
  });
  

  const [currentEtage, setCurrentEtage] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const loadExistingData = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const response = await fetch(`${backendUrl}/api/residence/my-residence`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        
        if (data.success && data.residence) {
          setFormData({
            residenceName: data.residence.residenceName,
            blocs: data.residence.blocs || []
          });
          if (data.residence.blocs && data.residence.blocs.length > 0) {
            setStep(2);
          }
        }
      } catch (error) {
        console.error('Erreur chargement:', error);
      }
    };
    
    loadExistingData();
  }, []); 

  const getBlocPosition = (index) => {
  
  const positions = [
    { x: -9, z: -7 },   // Bloc A
    { x: -3, z: -7 },   // Bloc B
    { x: 3, z: -7 },    // Bloc C
    { x: 9, z: -7 },    // Bloc D
    
    // Rangée 2 (milieu) - Z = 0 (espace de 7 unités avec rangée 1)
    { x: -6, z: 0 },    // Bloc E
    { x: 0, z: 0 },     // Bloc F
    { x: 6, z: 0 },     // Bloc G
    
    // Rangée 3 (arrière) - Z = 7 (espace de 7 unités avec rangée 2)
    { x: -9, z: 7 },    // Bloc H
    { x: -3, z: 7 },    // Bloc I
    { x: 3, z: 7 },     // Bloc J
    { x: 9, z: 7 },     // Bloc K
  ];
  
  if (index < positions.length) {
    return [positions[index].x, 0, positions[index].z];
  }
  
  // Fallback pour plus de 11 blocs
  const blocsParLigne = 4;
  const espacementX = 6;
  const espacementZ = 7;  // Augmenté aussi pour le fallback
  const ligne = Math.floor((index - positions.length) / blocsParLigne) + 3;
  const colonne = (index - positions.length) % blocsParLigne;
  const offsetX = (blocsParLigne - 1) * espacementX / 2;
  const x = colonne * espacementX - offsetX;
  const z = ligne * espacementZ;
  
  return [x, 0, z];
};

  const handleResidenceSubmit = (e) => {
    e.preventDefault();
    if (formData.residenceName) {
      setStep(2);
    }
  };

  const handleBlocNameSubmit = (e) => {
  e.preventDefault();
  const nom = currentBloc.nom;

  if (formData.blocs.length >= 11) {
    alert("❌ Limite atteinte ! Vous ne pouvez pas créer plus de 11 blocs.");
    return;
  }
  
  if (isBlocNameTaken(nom)) {
    alert(`Le bloc "${nom}" existe déjà. Veuillez choisir un autre nom.`);
    return;
  }
  
  if (currentBloc.nom) {
    setStep(3);
  }
};

  const handleEtagesSubmit = (e) => {
    e.preventDefault();
    if (currentBloc.etages > 0) {
      setCurrentBloc({
        ...currentBloc,
        appartementsParEtage: Array(currentBloc.etages).fill(0)
      });
      setCurrentEtage(1);
      setStep(4);
    }
  };

const handleAppartementsSubmit = (e) => {
  e.preventDefault();
  const appartementNom = e.target.appartementNom.value;
  
  const nbAttendu = currentBloc.appartementsAttendus?.[currentEtage - 1];
  if (!nbAttendu) {
    alert("Veuillez d'abord définir le nombre d'appartements pour cet étage !");
    return;
  }
  
  const currentCount = currentBloc.appartementsParEtage[currentEtage - 1]?.length || 0;
  if (currentCount >= nbAttendu) {
    alert(`Vous avez déjà ajouté les ${nbAttendu} appartements de cet étage !`);
    return;
  }
  
  if (!currentBloc.appartementsParEtage[currentEtage - 1]) {
    currentBloc.appartementsParEtage[currentEtage - 1] = [];
  }
  
  const updatedAppartements = [...currentBloc.appartementsParEtage];
  updatedAppartements[currentEtage - 1] = [
    ...(updatedAppartements[currentEtage - 1] || []),
    appartementNom
  ];
  
  setCurrentBloc({
    ...currentBloc,
    appartementsParEtage: updatedAppartements
  });
  
  e.target.reset();
  
  if (currentCount + 1 >= nbAttendu) {
  } else {
    e.target.appartementNom.focus();
  }
};

  const finalizeBloc = (appartementsParEtage, appartementsAttendus) => {
  setIsAdding(true);
  
  setTimeout(() => {
    const totalAppartements = appartementsParEtage.reduce((total, etage) => {
      return total + (etage?.length || 0);
    }, 0);
    
    const newBloc = {
      nom: currentBloc.nom,
      etages: currentBloc.etages,
      appartementsParEtage: appartementsParEtage,
      appartementsAttendus: appartementsAttendus, 
      totalAppartements: totalAppartements,
      position: getBlocPosition(formData.blocs.length),
      hauteur: currentBloc.etages * 2,
      largeur: 3,
      profondeur: 3
    };

    
    setFormData({
      ...formData,
      blocs: [...formData.blocs, newBloc]
    });
    
    setCurrentBloc({
      nom: '',
      etages: 0,
      appartementsParEtage: [],
      appartementsAttendus: []
    });
    
    setIsAdding(false);
    setStep(2); 
  }, 500);
};

  const handleFinalSubmit = async () => {
  try {
    const token = sessionStorage.getItem('token');
    
    const checkResponse = await fetch(`${backendUrl}/api/residence/my-residence`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const checkData = await checkResponse.json();
    const hasExistingResidence = checkData.residence !== null;
    
    const method = hasExistingResidence ? 'PUT' : 'POST';
    
    const response = await fetch(`${backendUrl}/api/residence/residence`, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      setResidenceData(data.residence);
      setShowConfigModal(false); 

      if (method === 'POST') {
        
        window.location.href = '/paiements'; 
      }
    } else {
      console.error('Erreur API:', data.message);
      alert('Erreur: ' + data.message);
    }
  } catch (error) {
    console.error('Erreur:', error);
    alert('Erreur de connexion au serveur');
  }
};

  return (
    <div className="relative bg-white rounded-2xl shadow-2xl max-w-6xl w-full mx-4 h-[90vh] overflow-hidden">
      
      <div className="absolute inset-0" style={{ zIndex: 1 }}>
        <Canvas
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
  {formData.blocs.map((bloc, index) => {
    // Convertir la position en tableau si c'est un objet
    const position = Array.isArray(bloc.position) 
      ? bloc.position 
      : [bloc.position?.x || 0, bloc.position?.y || 0, bloc.position?.z || 0];

    return (
      <Bloc3D
        key={index}
        nom={bloc.nom}
        position={position}
        hauteur={bloc.hauteur}
        largeur={bloc.largeur}
        profondeur={bloc.profondeur}
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


      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-4 z-20">
  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-4 max-h-[40vh] overflow-y-auto">
          
          <div className="flex justify-between mb-6 text-sm">
            <div className={`flex-1 text-center ${step >= 1 ? 'text-yellow-600 font-semibold' : 'text-gray-400'}`}>
              Résidence
            </div>
            <div className={`flex-1 text-center ${step >= 2 ? 'text-yellow-600 font-semibold' : 'text-gray-400'}`}>
              Bloc
            </div>
            <div className={`flex-1 text-center ${step >= 3 ? 'text-yellow-600 font-semibold' : 'text-gray-400'}`}>
              Étages
            </div>
            <div className={`flex-1 text-center ${step >= 4 ? 'text-yellow-600 font-semibold' : 'text-gray-400'}`}>
              Appartements
            </div>
          </div>

          {step === 1 && (
            <form onSubmit={handleResidenceSubmit} className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800">Nom de votre résidence</h3>
              <input
                type="text"
                value={formData.residenceName}
                onChange={(e) => setFormData({...formData, residenceName: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                placeholder="Ex: Résidence Narjess"
                autoFocus
                required
              />
              <button
                type="submit"
                className="w-full bg-yellow-500 text-white py-3 rounded-lg font-semibold hover:bg-yellow-600"
              >
                Suivant
              </button>
            </form>
          )}

{step === 2 && (
  <form onSubmit={handleBlocNameSubmit} className="space-y-4">
    <h3 className="text-xl font-bold text-gray-800">Nom du bloc</h3>
    <p className="text-sm text-gray-500">
      Blocs créés : {formData.blocs.length}/11
      {formData.blocs.length >= 11 && (
        <span className="text-red-500 ml-2"> Limite atteinte</span>
      )}
    </p>
    <input
      type="text"
      value={currentBloc.nom}
      onChange={(e) => setCurrentBloc({...currentBloc, nom: e.target.value.toUpperCase()})}
      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
      placeholder="Ex: A, B, C..."  
      autoFocus
      required
      disabled={formData.blocs.length >= 11}
    />
    <button
      type="submit"
      className={`w-full py-3 rounded-lg font-semibold ${
        formData.blocs.length >= 11 
          ? 'bg-gray-400 cursor-not-allowed' 
          : 'bg-yellow-500 hover:bg-yellow-600'
      } text-white`}
      disabled={formData.blocs.length >= 11}
    >
      Suivant
    </button>
  </form>
)}

          {step === 3 && (
            <form onSubmit={handleEtagesSubmit} className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800">Nombre d'étages pour le bloc {currentBloc.nom}</h3>
              <input
                type="number"
                value={currentBloc.etages || ''}
                onChange={(e) => setCurrentBloc({...currentBloc, etages: parseInt(e.target.value)})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                placeholder="Ex: 4"
                min="1"
                max="10"
                autoFocus
                required
              />
              <button
                type="submit"
                className="w-full bg-yellow-500 text-white py-3 rounded-lg font-semibold hover:bg-yellow-600"
              >
                Suivant
              </button>
            </form>
          )}

{step === 4 && (
  <div className="space-y-4">
    <h3 className="text-xl font-bold text-gray-800">
      Bloc {currentBloc.nom} • Étage {currentEtage}/{currentBloc.etages}
    </h3>
    
    {!currentBloc.appartementsAttendus?.[currentEtage - 1] && (
      <div className="space-y-2">
        <input
          type="number"
          id="nbAppartements"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
          placeholder={`Nombre d'appartements pour l'étage ${currentEtage}`}
          min="1"
          max="10"
          autoFocus
        />
        <button
          type="button"
          onClick={(e) => {
            const nb = parseInt(document.getElementById('nbAppartements').value);
            if (nb > 0) {
              const nouveauxAppartementsAttendus = [...(currentBloc.appartementsAttendus || [])];
              nouveauxAppartementsAttendus[currentEtage - 1] = nb;
              
              const nouveauxAppartements = [...(currentBloc.appartementsParEtage || [])];
              nouveauxAppartements[currentEtage - 1] = []; 
              
              setCurrentBloc({
                ...currentBloc,
                appartementsAttendus: nouveauxAppartementsAttendus,
                appartementsParEtage: nouveauxAppartements
              });
            }
          }}
          className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600"
        >
          Valider le nombre d'appartements pour l'étage {currentEtage}
        </button>
      </div>
    )}
    
    {currentBloc.appartementsAttendus?.[currentEtage - 1] && (
      <>
        {/* Afficher le formulaire d'ajout SEULEMENT si pas encore complet */}
        {currentBloc.appartementsParEtage[currentEtage-1]?.length < currentBloc.appartementsAttendus[currentEtage - 1] && (
          <form onSubmit={handleAppartementsSubmit} className="space-y-4">
            <input
              type="text"
              name="appartementNom"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
              placeholder={`Nom appartement étage ${currentEtage} (ex: ${currentBloc.nom}${currentEtage === 1 ? '-RDC' : currentEtage-1}1)`}
              defaultValue={`${currentBloc.nom}${currentEtage === 1 ? '-RDC' : currentEtage-1}${(currentBloc.appartementsParEtage[currentEtage-1]?.length || 0) + 1}`}
              autoFocus
              required
            />
            
            <button
              type="submit"
              className="w-full bg-yellow-500 text-white py-3 rounded-lg font-semibold hover:bg-yellow-600"
            >
              Ajouter cet appartement ({currentBloc.appartementsParEtage[currentEtage-1]?.length || 0}/{currentBloc.appartementsAttendus[currentEtage - 1]})
            </button>
          </form>
        )}
        
        {/* Message "Étage complet !" quand l'étage est fini */}
        {currentBloc.appartementsParEtage[currentEtage-1]?.length === currentBloc.appartementsAttendus[currentEtage - 1] && (
          <div className="bg-green-100 border border-green-300 rounded-lg p-3 text-center">
            <p className="text-green-700 font-semibold">
              ✓ Étage complet ! ({currentBloc.appartementsAttendus[currentEtage - 1]}/{currentBloc.appartementsAttendus[currentEtage - 1]} appartements)
            </p>
          </div>
        )}
        
        {/* Liste des appartements de l'étage */}
        {currentBloc.appartementsParEtage[currentEtage-1]?.length > 0 && (
          <div className="mt-2 p-2 bg-gray-50 rounded">
            <p className="text-sm text-gray-600 mb-1">
              Appartements étage {currentEtage} : 
              <span className="font-bold ml-1">
                {currentBloc.appartementsParEtage[currentEtage-1].length}/{currentBloc.appartementsAttendus[currentEtage - 1]}
              </span>
            </p>
            <div className="flex flex-wrap gap-1">
              {currentBloc.appartementsParEtage[currentEtage-1].map((nom, idx) => (
                <span key={idx} className="bg-gray-200 px-2 py-1 rounded text-xs">
                  {nom}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Bouton "Passer à l'étage suivant" - toujours visible quand l'étage est complet */}
        {currentBloc.appartementsParEtage[currentEtage-1]?.length === currentBloc.appartementsAttendus?.[currentEtage - 1] && 
         currentBloc.appartementsAttendus?.[currentEtage - 1] > 0 && (
          <button
            type="button"
            onClick={() => {
              if (currentEtage < currentBloc.etages) {
                setCurrentEtage(currentEtage + 1);
              } else {
                finalizeBloc(currentBloc.appartementsParEtage, currentBloc.appartementsAttendus);
              }
            }}
            className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600"
          >
            {currentEtage < currentBloc.etages 
              ? `Passer à l'étage ${currentEtage + 1}` 
              : 'Terminer ce bloc'}
          </button>
        )}
      </>
    )}
  </div>
)}

          {formData.blocs.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Blocs configurés :</p>
              <div className="flex flex-wrap gap-2">
                {formData.blocs.map((bloc, index) => (
                  <span key={index} className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                    Bloc {bloc.nom} ({bloc.etages} étages, {bloc.totalAppartements} apparts)
                  </span>
                ))}
              </div>
            </div>
          )}

          

          {formData.blocs.length > 0 && step !== 1 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={handleFinalSubmit}
                className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600"
              >
                Terminer la configuration
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfigModal3D;