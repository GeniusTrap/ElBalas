import React, { useState, Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, Line, Grid, Text } from '@react-three/drei';
import * as THREE from 'three';
import { assets } from '../assets/assets';
import AddLocataireModal from '../components/AddLocataireModal';
import DeleteLocataireModal from '../components/DeleteLocataireModal';
import TransfertLocataireModal from '../components/TransfertLocataireModal';
import { FaUser, FaUserFriends, FaHome, FaPhone } from 'react-icons/fa';
import { backendUrl } from '../App';
import AppartementDetails from '../components/AppartementDetails';
import { useNotifications } from '../contexts/NotificationContext';

const PersonIcon = ({ position, count }) => {
  const icons = [];
  
  for (let i = 0; i < count; i++) {
    let xOffset = 0, zOffset = 0;
    
    if (count === 1) {
      xOffset = 0;
    } else if (count === 2) {
      xOffset = (i === 0 ? -0.4 : 0.4);
    } else if (count === 3) {
      xOffset = (i === 0 ? -0.6 : i === 1 ? 0 : 0.6);
    } else if (count === 4) {
      xOffset = (i % 2 === 0 ? -0.4 : 0.4);
      zOffset = (i < 2 ? -0.4 : 0.4);
    }
    
    icons.push(
      <Html
        key={i}
        position={[position[0] + xOffset, position[1], position[2] + zOffset]}
        center
        style={{ pointerEvents: 'none', zIndex: 1 }}
      >
        <div className="text-black drop-shadow-lg">
          <FaUser size={16} />
        </div>
      </Html>
    );
  }
  
  return <>{icons}</>;
};

// Composant Bloc 3D pour la vue principale
const Bloc3D = ({ 
  position, hauteur, largeur, profondeur, nom, nbEtages, appartementsParEtage = [],
  appartementsLocataires = {},
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

  const generatePersonIcons = () => {
    const icons = [];
    
    for (let etage = 1; etage <= nbEtages; etage++) {
      const appartsDeLetage = appartementsParEtage[etage - 1] || [];
      const yPosition = (etage - 0.5) * (hauteur / nbEtages);
      
      const appartsParFace = Math.ceil(appartsDeLetage.length / 4);
      
      appartsDeLetage.forEach((appartNom, index) => {
        const i = index + 1;
        const faceIndex = Math.floor((i - 1) / appartsParFace);
        const positionDansFace = (i - 1) % appartsParFace;
        
        const espacement = largeur / (appartsParFace + 1);
        const offset = -largeur/2 + espacement * (positionDansFace + 1);
        
        let x = 0, z = 0;
        
        switch(faceIndex) {
          case 0: x = offset; z = profondeur/2 + 0.2; break;
          case 1: x = largeur/2 + 0.2; z = -profondeur/2 + espacement * (positionDansFace + 1); break;
          case 2: x = -offset; z = -profondeur/2 - 0.2; break;
          case 3: x = -largeur/2 - 0.2; z = profondeur/2 - espacement * (positionDansFace + 1); break;
        }
        
        const locatairesCount = appartementsLocataires[appartNom] || 0;
        
        icons.push(
          <PersonIcon
            key={`${etage}-${i}`}
            position={[x, yPosition, z]}
            count={locatairesCount}
          />
        );
      });
    }
    return icons;
  };

  const totalLocatairesBloc = Object.entries(appartementsLocataires)
    .filter(([appartNom]) => appartNom.startsWith(nom))
    .reduce((sum, [_, count]) => sum + count, 0);

  return (
    <group position={position}>
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

      <Html position={[0, hauteur + 1, 0]} center>
        <div className="bg-white/90 text-black px-2 py-0.5 rounded text-xs font-bold border border-black/30 flex items-center gap-1">
          <span>{nom}</span>
          <span className="text-blue-600 flex items-center gap-0.5">
            <FaUserFriends size={10} />
            <span>{totalLocatairesBloc}</span>
          </span>
        </div>
      </Html>

      {generatePersonIcons()}
    </group>
  );
};

// Vue détaillée du bloc avec le style AppartementsGrid
const LocatairesGrid = ({ bloc, onRetour, onAppartClick }) => {
  const [locatairesData, setLocatairesData] = useState({});
  const [statutData, setStatutData] = useState({});
  const [appartementsData, setAppartementsData] = useState([]);
  const [filteredAppartements, setFilteredAppartements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtrePaiement, setFiltrePaiement] = useState('tous');

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
          
          // ✅ RECALCULER si la période actuelle est payée
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
            apparts.push({
              id: `${bloc.nom}${etage}${index + 1}`,
              nom: nom,
              etage: etage,
              locatairesCount: locatairesParAppart[nom] || 0,
              estOccupe: (locatairesParAppart[nom] || 0) > 0,
              estPaye: statutParAppart[nom] || false
            });
          });
        }
        setAppartementsData(apparts);
        setFilteredAppartements(apparts);
      }
    } catch (error) {
      console.error('Erreur chargement locataires:', error);
    } finally {
      setLoading(false);
    }
  };

  fetchLocatairesForBloc();
  
  // ✅ AJOUTE CET INTERVALLE POUR RAFRAÎCHIR TOUTES LES 30 SECONDES
  const interval = setInterval(() => {
    fetchLocatairesForBloc();
  }, 30000);
  
  return () => clearInterval(interval);
}, [bloc]);

  const filtrerAppartements = (filtre) => {
    setFiltrePaiement(filtre);
    
    if (filtre === 'tous') {
      setFilteredAppartements(appartementsData);
    } else if (filtre === 'paye') {
      const payes = appartementsData.filter(appart => appart.estOccupe && appart.estPaye);
      setFilteredAppartements(payes);
    } else if (filtre === 'nonPaye') {
      const nonPayes = appartementsData.filter(appart => appart.estOccupe && !appart.estPaye);
      setFilteredAppartements(nonPayes);
    }
  };

  useEffect(() => {
    if (appartementsData.length > 0) {
      filtrerAppartements(filtrePaiement);
    }
  }, [appartementsData]);


  // Grouper les appartements par étage
  const appartementsParEtage = [];
  for (let etage = 1; etage <= bloc.etages; etage++) {
    const apparts = appartementsData.filter(a => a.etage === etage);
    appartementsParEtage.push({ etage, appartements: apparts });
  }

  return (
  <div 
  className="min-h-screen bg-cover bg-center p-8 rounded-2xl"
>
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={onRetour}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour aux blocs
        </button>

        {/* Filtre des paiements - À DROITE */}
        <div className="flex gap-2">
          <button
            onClick={() => filtrerAppartements('tous')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all shadow-lg ${
              filtrePaiement === 'tous'
                ? 'bg-blue-600 text-white'
                : 'bg-white/90 text-gray-700 hover:bg-white'
            }`}
          >
            Tous ({appartementsData.length})
          </button>
          <button
            onClick={() => filtrerAppartements('paye')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all shadow-lg flex items-center gap-1 ${
              filtrePaiement === 'paye'
                ? 'bg-green-600 text-white'
                : 'bg-white/90 text-green-600 hover:bg-white'
            }`}
          >
            <span>✅</span> Payé
          </button>
          <button
            onClick={() => filtrerAppartements('nonPaye')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all shadow-lg flex items-center gap-1 ${
              filtrePaiement === 'nonPaye'
                ? 'bg-red-600 text-white'
                : 'bg-white/90 text-red-600 hover:bg-white'
            }`}
          >
            <span>⏳</span> Non payé
          </button>
        </div>
      </div>

      {/* En-tête */}
      <div className="text-center mb-12 pt-8">
  <div className="inline-block bg-white/95 backdrop-blur-sm rounded-xl shadow-lg px-8 py-4">
    <h1 className="text-4xl font-bold text-gray-800">Bloc {bloc.nom}</h1>
    <p className="text-gray-600 mt-1">
      {bloc.etages} étages • {bloc.totalAppartements} appartements • {Object.values(locatairesData).reduce((a, b) => a + b, 0)} locataires
    </p>
  </div>
</div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto" />
        </div>
      ) : (
        
        <div className="space-y-12">
          {/* Grouper les appartements filtrés par étage */}
          {Array.from({ length: bloc.etages }, (_, i) => i + 1).map((etage) => {
            const appartementsDeLetage = filteredAppartements.filter(a => a.etage === etage);
            if (appartementsDeLetage.length === 0) return null;
            
            return (
              <div key={etage}>
                <h2 className="text-2xl font-bold text-yellow-600 drop-shadow-lg pb-2 mb-4">
                  {etage === 1 ? 'REZ-DE-CHAUSSÉE' : `${etage-1}ER ÉTAGE`}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {appartementsDeLetage.map((appartement) => (
                    <div
                      key={appartement.id}
                      className="bg-white transform rotate-[-1deg] hover:rotate-0 hover:scale-105 transition-all duration-300 shadow-xl p-6 rounded-lg cursor-pointer"
                      style={{ boxShadow: '5px 5px 15px rgba(0,0,0,0.3)' }}
                      onClick={() => onAppartClick(appartement.nom)}
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
                               appartement.estPaye ? 'Payé' : 'Non payé'}
                            </span>
                          </p>
                          {appartement.estOccupe && (
                            <p className="flex justify-between border-b border-black border-opacity-20 pb-1">
                              <span>Locataires</span>
                              <span className="font-bold flex items-center gap-1">
                                <FaUser size={12} />
                                {appartement.locatairesCount} pers.
                              </span>
                            </p>
                          )}
                        </div>
                        <div className="mt-4 text-xs text-gray-600 italic">
                          Cliquez pour voir
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  </div>
);
};

// Composant principal
const Locataires = ({ residenceData }) => {
  const [selectedBloc, setSelectedBloc] = useState(null);
  const [selectedAppart, setSelectedAppart] = useState(null);
  const [locatairesData, setLocatairesData] = useState({});
  const [showAddLocataireModal, setShowAddLocataireModal] = useState(false);
  const [showDeleteLocataireModal, setShowDeleteLocataireModal] = useState(false);
  const [showTransfertLocataireModal, setShowTransfertLocataireModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
const [searchResults, setSearchResults] = useState([]);
const [showSearchResults, setShowSearchResults] = useState(false);
const [allLocataires, setAllLocataires] = useState([]);
const [fromSearch, setFromSearch] = useState(false);
const { addNotification } = useNotifications();


useEffect(() => {
  const handleLocatairesUpdated = () => {
    // Recharger toutes les données
    fetchLocataires();
  };

  window.addEventListener('locataires-updated', handleLocatairesUpdated);
  
  return () => {
    window.removeEventListener('locataires-updated', handleLocatairesUpdated);
  };
}, []);



  const fetchLocataires = async () => {
  try {
    const token = sessionStorage.getItem('token');
    const response = await fetch(`${backendUrl}/api/locataires`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    
    if (data.success) {
      const locatairesParAppart = {};
      data.locataires.forEach(loc => {
        if (loc.type === 'famille') {
          locatairesParAppart[loc.appartementNom] = loc.nombreMembres;
        } else {
          locatairesParAppart[loc.appartementNom] = loc.nombreTotal;
        }
      });
      setLocatairesData(locatairesParAppart);
      setAllLocataires(data.locataires);
    }
  } catch (error) {
    console.error('Erreur chargement locataires:', error);
  }
};

// 2. APPELER la fonction dans useEffect
useEffect(() => {
  if (residenceData) {
    fetchLocataires();
  }
}, [residenceData]);

  const appartementsParBloc = {};
  if (residenceData?.blocs) {
    residenceData.blocs.forEach(bloc => {
      if (bloc.appartementsParEtage) {
        appartementsParBloc[bloc.nom] = bloc.appartementsParEtage.flat();
      }
    });
  }

  const handleSearch = (e) => {
  const term = e.target.value.toLowerCase();
  setSearchTerm(term);
  
  if (term.length < 2) {
    setShowSearchResults(false);
    setSearchResults([]);
    return;
  }
  
  // Rechercher dans tous les locataires
  const results = [];
  
  allLocataires.forEach(loc => {
    if (loc.type === 'famille') {
      // Recherche dans les familles
      if (loc.nomFamille.toLowerCase().includes(term)) {
        results.push({
          id: loc._id,
          type: 'famille',
          nom: loc.nomFamille,
          telephone: loc.telephoneFamille,
          bloc: loc.blocNom,
          appartement: loc.appartementNom,
          membres: loc.nombreMembres
        });
      }
    } else {
      // Recherche dans les individus
      loc.membres.forEach(membre => {
        const fullName = `${membre.prenom} ${membre.nom}`.toLowerCase();
        const phoneMatch = membre.telephone && membre.telephone.includes(term);
        
        if (fullName.includes(term) || phoneMatch || loc.appartementNom.toLowerCase().includes(term)) {
          results.push({
            id: loc._id,
            type: 'individu',
            nom: `${membre.prenom} ${membre.nom}`,
            telephone: membre.telephone,
            bloc: loc.blocNom,
            appartement: loc.appartementNom,
            age: membre.age,
            membreData: membre
          });
        }
      });
    }
  });
  
  setSearchResults(results.slice(0, 10)); 
  setShowSearchResults(results.length > 0);
};

  const handleDeleteSuccess = (suppressionData) => {
  const currentUser = JSON.parse(sessionStorage.getItem('userData') || '{}');

  
  addNotification('suppression', suppressionData);
  
  const fetchLocataires = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${backendUrl}/api/locataires`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        const locatairesParAppart = {};
        data.locataires.forEach(loc => {
          if (loc.type === 'famille') {
            locatairesParAppart[loc.appartementNom] = loc.nombreMembres;
          } else {
            locatairesParAppart[loc.appartementNom] = loc.nombreTotal;
          }
        });
        setLocatairesData(locatairesParAppart);
      }
    } catch (error) {
      console.error('Erreur rechargement après suppression:', error);
    }
  };
  
  fetchLocataires();
};

const handleTransfertSuccess = (transfertData) => {
  const currentUser = JSON.parse(sessionStorage.getItem('userData') || '{}');

  
  addNotification('transfert', transfertData);
  
  const fetchLocataires = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${backendUrl}/api/locataires`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        const locatairesParAppart = {};
        data.locataires.forEach(loc => {
          if (loc.type === 'famille') {
            locatairesParAppart[loc.appartementNom] = loc.nombreMembres;
          } else {
            locatairesParAppart[loc.appartementNom] = loc.nombreTotal;
          }
        });
        setLocatairesData(locatairesParAppart);
      }
    } catch (error) {
      console.error('Erreur rechargement après transfert:', error);
    }
  };
  
  fetchLocataires();
};

  const handleSaveLocataires = async (data) => {

  try {
    const token = sessionStorage.getItem('token');
    let response;
    
    // Récupérer l'utilisateur actuel pour le log
    const currentUser = JSON.parse(sessionStorage.getItem('userData') || '{}');

    
    if (data.id) {
      response = await fetch(`${backendUrl}/api/locataires/${data.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
    } else {
      response = await fetch(`${backendUrl}/api/locataires`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
    }



    const result = await response.json();

    if (result.success) {
      addNotification('ajout', data);
      
      const fetchResponse = await fetch(`${backendUrl}/api/locataires`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const fetchData = await fetchResponse.json();
      
      if (fetchData.success) {
        const locatairesParAppart = {};
        fetchData.locataires.forEach(loc => {
          if (loc.type === 'famille') {
            locatairesParAppart[loc.appartementNom] = loc.nombreMembres;
          } else {
            locatairesParAppart[loc.appartementNom] = loc.nombreTotal;
          }
        });
        setLocatairesData(locatairesParAppart);
      }
    } else {
    }
  } catch (error) {

  }
};

  const handleBlocClick = (bloc) => {
    setSelectedBloc(bloc);
    setSelectedAppart(null);
  };

  if (selectedAppart) {
  return (
    <AppartementDetails 
      bloc={selectedBloc} 
      appartementNom={selectedAppart} 
      onClose={() => {
        setSelectedAppart(null);
        if (fromSearch) {
          // Si on vient de la recherche, on revient à la vue principale
          setSelectedBloc(null);
          setFromSearch(false);
        }
        fetchLocataires();
        // Sinon, on reste sur le bloc (selectedBloc reste inchangé)
      }} 
      residenceData={residenceData}
      onSaveLocataires={handleSaveLocataires}
    />
  );
}

  if (selectedBloc) {
    return <LocatairesGrid bloc={selectedBloc} onRetour={() => setSelectedBloc(null)} onAppartClick={(appartNom) => {
  setSelectedAppart(appartNom);
  setFromSearch(false); 
}}/>;
  }

  const blocs = residenceData?.blocs || [];

  return (
    <div className="h-full w-full relative" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Interface utilisateur */}
      <div className="absolute top-0 left-0 w-full z-50 pointer-events-none">
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-full max-w-4xl px-4 pointer-events-auto">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-3 flex flex-col md:flex-row gap-3 items-center">
            <div className="flex-1 w-full md:w-auto relative">
  <input
    type="text"
    value={searchTerm}
    onChange={handleSearch}
    onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
    onFocus={() => searchTerm.length >= 2 && setShowSearchResults(true)}
    placeholder="Rechercher par nom, prénom, appartement ou téléphone..."
    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all text-sm"
  />
  
  {/* Résultats de recherche */}
  {showSearchResults && searchResults.length > 0 && (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto z-[100]">
      {searchResults.map((result, idx) => (
        <div
          key={idx}
          className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            // Trouver le bloc et l'appartement correspondants
            const bloc = residenceData?.blocs.find(b => b.nom === result.bloc);
            if (bloc) {
              setSelectedBloc(bloc);
              setSelectedAppart(result.appartement);
              setFromSearch(true);
            }
            setShowSearchResults(false);
            setSearchTerm('');
          }}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              result.type === 'famille' ? 'bg-purple-100' : 'bg-blue-100'
            }`}>
              {result.type === 'famille' ? (
                <FaUser className="text-purple-600" size={14} />
              ) : (
                <FaUser className="text-blue-600" size={14} />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-800">{result.nom}</p>
              <p className="text-xs text-gray-500">
                {result.bloc} • {result.appartement}
                {result.type === 'famille' && ` • ${result.membres} personnes`}
                {result.type === 'individu' && result.age && ` • ${result.age} ans`}
              </p>
            </div>
            {result.telephone && (
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <FaPhone size={10} />
                {result.telephone}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )}
  
  {showSearchResults && searchResults.length === 0 && searchTerm.length >= 2 && (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 p-4 text-center text-gray-500">
      Aucun résultat trouvé
    </div>
  )}
</div>

            <div className="flex gap-2 w-full md:w-auto justify-end">
              <button 
  onClick={() => setShowDeleteLocataireModal(true)}
  className="px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold text-sm transition-all transform hover:scale-105 flex items-center gap-2"
>
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
  Supprimer
</button>
              <button
                onClick={() => setShowAddLocataireModal(true)}
                className="px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold text-sm transition-all transform hover:scale-105 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Ajouter
              </button>
              <button 
  onClick={() => setShowTransfertLocataireModal(true)}
  className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold text-sm transition-all transform hover:scale-105 flex items-center gap-2"
>
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
  Transfert
</button>
            </div>
          </div>
        </div>
      </div>

      {/* Canvas 3D */}
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
                  appartementsLocataires={locatairesData}
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

      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3 text-sm z-40 pointer-events-auto">
        <p className="text-gray-700 flex items-center gap-2">
          <FaUser className="text-blue-600" />
          <span> = 1 locataire</span>
        </p>
        <p className="text-gray-500 text-xs mt-1">Cliquez sur un bloc pour voir le détail</p>
      </div>

      <AddLocataireModal
        isOpen={showAddLocataireModal}
        onClose={() => setShowAddLocataireModal(false)}
        onSave={handleSaveLocataires}
        blocs={residenceData?.blocs || []}
        appartementsParBloc={appartementsParBloc}
        locatairesData={locatairesData}
      />
      {/* Modal de suppression des locataires */}
<DeleteLocataireModal
  isOpen={showDeleteLocataireModal}
  onClose={() => setShowDeleteLocataireModal(false)}
  onDelete={handleDeleteSuccess}
  blocs={residenceData?.blocs || []}
  appartementsParBloc={appartementsParBloc}
  locatairesData={locatairesData}
/>
<TransfertLocataireModal
  isOpen={showTransfertLocataireModal}
  onClose={() => setShowTransfertLocataireModal(false)}
  onTransfert={handleTransfertSuccess}
  blocs={residenceData?.blocs || []}
  appartementsParBloc={appartementsParBloc}
  locatairesData={locatairesData}
/>
    </div>
  );
};

export default Locataires;