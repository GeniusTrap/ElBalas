import React, { useState, useEffect } from 'react';
import { FaTimes, FaUser, FaUsers, FaBuilding, FaExchangeAlt, FaArrowRight } from 'react-icons/fa';
import { backendUrl } from '../App';

const TransfertLocataireModal = ({ isOpen, onClose, onTransfert, blocs, appartementsParBloc, locatairesData = {}, preselectedSource }) => {
  const [step, setStep] = useState(1);
  
  // Source
  const [sourceBloc, setSourceBloc] = useState('');
  const [sourceAppart, setSourceAppart] = useState('');
  const [locatairesSource, setLocatairesSource] = useState([]);
  const [selectedGroupe, setSelectedGroupe] = useState(null);
  const [selectedMembres, setSelectedMembres] = useState([]);
  const [typeSource, setTypeSource] = useState(null);
  
  // Destination
  const [destBloc, setDestBloc] = useState('');
  const [destAppart, setDestAppart] = useState('');
  const [locatairesDest, setLocatairesDest] = useState([]);
  const [typeDest, setTypeDest] = useState(null);
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
  if (preselectedSource && isOpen) {
    setSourceBloc(preselectedSource.bloc);
    setSourceAppart(preselectedSource.appartement);
    setSelectedGroupe(preselectedSource.groupe);
    setStep(2); // Aller directement à l'étape 2
  }
}, [preselectedSource, isOpen]);

  // Charger les locataires de la source
  useEffect(() => {
    const fetchLocatairesSource = async () => {
      if (sourceAppart && locatairesData[sourceAppart] > 0) {
        setLoading(true);
        try {
          const token = sessionStorage.getItem('token');
          const response = await fetch(
            `${backendUrl}/api/locataires/appartement/${sourceBloc}/${sourceAppart}`,
            {
              headers: { 'Authorization': `Bearer ${token}` }
            }
          );
          const data = await response.json();
          
          if (data.success) {
            // Grouper et fusionner comme dans les autres modaux
            const locatairesParAppart = {};
            data.locataires.forEach(loc => {
              if (!locatairesParAppart[loc.appartementNom]) {
                locatairesParAppart[loc.appartementNom] = [];
              }
              locatairesParAppart[loc.appartementNom].push(loc);
            });
            
            const locatairesDeAppart = locatairesParAppart[sourceAppart] || [];
            
            if (locatairesDeAppart.length > 1) {
              const type = locatairesDeAppart[0].type;
              
              if (type === 'famille') {
                const familleFusionnee = {
                  _id: locatairesDeAppart[0]._id,
                  type: 'famille',
                  nomFamille: locatairesDeAppart[0].nomFamille,
                  telephoneFamille: locatairesDeAppart[0].telephoneFamille,
                  nombreMembres: locatairesDeAppart.reduce((sum, loc) => sum + (loc.nombreMembres || 0), 0),
                  membres: []
                };
                setLocatairesSource([familleFusionnee]);
                setTypeSource('famille');
              } else {
                const tousLesMembres = locatairesDeAppart.flatMap(loc => loc.membres || []);
                const individusFusionnes = {
                  _id: locatairesDeAppart[0]._id,
                  type: 'individus',
                  membres: tousLesMembres,
                  nombreMembres: tousLesMembres.length
                };
                setLocatairesSource([individusFusionnes]);
                setTypeSource('individus');
              }
            } else {
              setLocatairesSource(locatairesDeAppart);
              setTypeSource(locatairesDeAppart[0]?.type || null);
            }
          }
        } catch (error) {
          console.error('Erreur chargement source:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLocatairesSource([]);
        setTypeSource(null);
      }
    };

    if (sourceAppart) {
      fetchLocatairesSource();
    }
  }, [sourceAppart, sourceBloc, locatairesData]);

  // Charger les locataires de la destination (pour vérifier la compatibilité)
  useEffect(() => {
    const fetchLocatairesDest = async () => {
      if (destAppart && locatairesData[destAppart] > 0) {
        try {
          const token = sessionStorage.getItem('token');
          const response = await fetch(
            `${backendUrl}/api/locataires/appartement/${destBloc}/${destAppart}`,
            {
              headers: { 'Authorization': `Bearer ${token}` }
            }
          );
          const data = await response.json();
          
          if (data.success) {
            const type = data.locataires[0]?.type || null;
            setTypeDest(type);
            setLocatairesDest(data.locataires);
          }
        } catch (error) {
          console.error('Erreur chargement destination:', error);
        }
      } else {
        setTypeDest(null);
        setLocatairesDest([]);
      }
    };

    if (destAppart) {
      fetchLocatairesDest();
    }
  }, [destAppart, destBloc, locatairesData]);

  if (!isOpen) return null;

  const resetModal = () => {
    setStep(1);
    setSourceBloc('');
    setSourceAppart('');
    setDestBloc('');
    setDestAppart('');
    setLocatairesSource([]);
    setLocatairesDest([]);
    setSelectedGroupe(null);
    setSelectedMembres([]);
    setTypeSource(null);
    setTypeDest(null);
  };

  const handleSelectAllMembres = (groupe) => {
    if (groupe.type === 'famille') {
      setSelectedGroupe(groupe);
      setSelectedMembres([]);
    } else {
      if (selectedGroupe?._id === groupe._id && selectedMembres.length === groupe.membres.length) {
        setSelectedMembres([]);
        setSelectedGroupe(null);
      } else {
        setSelectedMembres(groupe.membres.map((_, idx) => idx));
        setSelectedGroupe(groupe);
      }
    }
  };

  const handleToggleMembre = (groupe, membreIndex) => {
    if (selectedGroupe?._id !== groupe._id) {
      setSelectedGroupe(groupe);
      setSelectedMembres([membreIndex]);
    } else {
      if (selectedMembres.includes(membreIndex)) {
        setSelectedMembres(selectedMembres.filter(i => i !== membreIndex));
        if (selectedMembres.length === 1) {
          setSelectedGroupe(null);
        }
      } else {
        setSelectedMembres([...selectedMembres, membreIndex]);
      }
    }
  };

  const handleTransfert = async () => {
  if (!selectedGroupe || !destAppart) return;

  try {
    const token = sessionStorage.getItem('token');
    
    if (selectedGroupe.type === 'famille') {
      await fetch(`${backendUrl}/api/locataires/${selectedGroupe._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } else {
      const membresRestants = selectedGroupe.membres.filter((_, idx) => !selectedMembres.includes(idx));
      
      if (membresRestants.length === 0) {
        await fetch(`${backendUrl}/api/locataires/${selectedGroupe._id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } else {
        await fetch(`${backendUrl}/api/locataires/${selectedGroupe._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            ...selectedGroupe,
            membres: membresRestants
          })
        });
      }
    }

    // 2. Créer les membres à transférer
    let membresATransferer = [];
    const today = new Date().toISOString().split('T')[0];
    
    if (selectedGroupe.type === 'famille') {
      // Créer le bon nombre de membres pour la famille
      for (let i = 0; i < selectedGroupe.nombreMembres; i++) {
        membresATransferer.push({
          nom: selectedGroupe.nomFamille,
          prenom: `Membre ${i + 1}`,
          age: null,
          telephone: i === 0 ? selectedGroupe.telephoneFamille : null,
          dateArrivee: today
        });
      }
    } else {
      membresATransferer = selectedMembres.map(idx => ({
    ...selectedGroupe.membres[idx],
    dateArrivee: today  // ← AJOUT (écrase l'ancienne date)
  }));
    }

    const transfertData = {
  type: selectedGroupe.type,
  sourceBloc: sourceBloc,
  sourceAppart: sourceAppart,
  destBloc: destBloc,
  destAppart: destAppart,
  typeOccupation: 'location', // ou récupérer depuis les données si disponible
  dateArrivee: new Date().toISOString().split('T')[0],
  datePaiement: null
};

if (selectedGroupe.type === 'famille') {
  transfertData.nomFamille = selectedGroupe.nomFamille;
  transfertData.nombreMembres = selectedGroupe.nombreMembres;
} else {
  transfertData.membres = selectedMembres.map(idx => selectedGroupe.membres[idx]);
  transfertData.nombreMembres = selectedMembres.length;
}

    // 3. Ajouter les membres à la destination
    if (typeDest === 'famille') {
      // Ajouter à une famille existante
      const familleDest = locatairesDest.find(l => l.type === 'famille');
      await fetch(`${backendUrl}/api/locataires/${familleDest._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...familleDest,
          nombreMembres: (familleDest.nombreMembres || 0) + membresATransferer.length
        })
      });
    } else if (typeDest === 'individus') {
      // Ajouter à des individus existants
      const individusDest = locatairesDest.find(l => l.type === 'individus');
      await fetch(`${backendUrl}/api/locataires/${individusDest._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...individusDest,
          membres: [...(individusDest.membres || []), ...membresATransferer]
        })
      });
    } else {
      await fetch(`${backendUrl}/api/locataires`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          blocNom: destBloc,
          appartementNom: destAppart,
          type: selectedGroupe.type,
          ...(selectedGroupe.type === 'famille' && {
            nomFamille: selectedGroupe.nomFamille,
            nombreMembres: membresATransferer.length,
            telephoneFamille: selectedGroupe.telephoneFamille,
            dateArrivee: today
          }),
          ...(selectedGroupe.type === 'individus' && {
            membres: membresATransferer
          })
        })
      });
    }

    onTransfert(transfertData);
    resetModal();
    onClose();
  } catch (error) {
    console.error('Erreur transfert:', error);
  }
};

  const getAppartementsForBloc = (bloc, excludeAppart = null) => {
    if (!bloc || !appartementsParBloc) return [];
    const appartements = appartementsParBloc[bloc] || [];
    return appartements
      .filter(appart => appart !== excludeAppart)
      .map(appart => ({
        nom: appart,
        estOccupe: locatairesData[appart] > 0
      }));
  };

  const isTransfertDisabled = () => {
  if (!selectedGroupe) return true; // Pas de groupe sélectionné → désactivé
  if (selectedGroupe.type === 'famille') {
    return !destAppart; // Pour une famille, besoin d'une destination
  }
  // Pour des individus, besoin d'au moins un membre ET une destination
  return !(selectedMembres.length > 0 && destAppart);
};

  const isSelectionValid = () => {
    if (!selectedGroupe) return false;
    if (selectedGroupe.type === 'famille') return true;
    return selectedMembres.length > 0;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm" 
        onClick={() => {
          resetModal();
          onClose();
        }} 
      />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-4 rounded-t-2xl flex justify-between items-center sticky top-0">
          <div className="flex items-center">
            <FaExchangeAlt className="text-2xl mr-3" />
            <h2 className="text-2xl font-bold">Transférer des locataires</h2>
          </div>
          <button 
            onClick={() => {
              resetModal();
              onClose();
            }} 
            className="text-white hover:text-gray-200"
          >
            <FaTimes size={24} />
          </button>
        </div>

        {/* Stepper */}
        <div className="px-6 pt-4">
          <div className="flex justify-between text-sm">
            <div className={`flex-1 text-center ${step >= 1 ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
              Source
            </div>
            <div className={`flex-1 text-center ${step >= 2 ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
              Sélection
            </div>
            <div className={`flex-1 text-center ${step >= 3 ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
              Destination
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Étape 1 : Source */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bloc source
                </label>
                <select
                  value={sourceBloc}
                  onChange={(e) => setSourceBloc(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Choisir un bloc...</option>
                  {blocs.map((bloc) => (
                    <option key={bloc.nom} value={bloc.nom}>
                      Bloc {bloc.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Appartement source
                </label>
                <select
                  value={sourceAppart}
                  onChange={(e) => setSourceAppart(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Choisir un appartement...</option>
                  {getAppartementsForBloc(sourceBloc).map((appart) => (
                    <option key={appart.nom} value={appart.nom} className={appart.estOccupe ? 'text-green-600' : 'text-gray-400'}>
                      {appart.nom} {appart.estOccupe ? '✓ Occupé' : '○ Libre'}
                    </option>
                  ))}
                </select>
                {sourceAppart && !locatairesData[sourceAppart] && (
                  <p className="text-xs text-red-500 mt-1">
                    Cet appartement est vide
                  </p>
                )}
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!sourceAppart || !locatairesData[sourceAppart]}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
          )}

          {/* Étape 2 : Sélection des locataires à transférer */}
          {step === 2 && (
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
                </div>
              ) : locatairesSource.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Aucun locataire dans cet appartement
                </div>
              ) : (
                <>
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700">
                      Sélectionnez les locataires à transférer
                    </p>
                  </div>

                  {locatairesSource.map((groupe, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* En-tête du groupe */}
                      <div 
                        className={`px-4 py-3 flex justify-between items-center cursor-pointer transition-colors ${
                          selectedGroupe?._id === groupe._id 
                            ? 'bg-blue-100 border-blue-300' 
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                        onClick={() => handleSelectAllMembres(groupe)}
                      >
                        <div className="flex items-center gap-2">
                          {groupe.type === 'famille' ? (
                            <FaUsers className="text-blue-600" />
                          ) : (
                            <FaUser className="text-blue-600" />
                          )}
                          <span className="font-medium">
                            {groupe.type === 'famille' 
                              ? `Famille ${groupe.nomFamille}` 
                              : `Résidents (${groupe.membres.length})`}
                          </span>
                        </div>
                        {selectedGroupe?._id === groupe._id && (
                          <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                            {groupe.type === 'famille' ? 'Sélectionné' : `${selectedMembres.length} sélectionné(s)`}
                          </span>
                        )}
                      </div>

                      {/* Liste des membres */}
                      {groupe.type === 'individus' && selectedGroupe?._id === groupe._id && (
                        <div className="p-3 border-t border-gray-200 space-y-2">
                          {groupe.membres.map((membre, membreIdx) => (
                            <div
                              key={membreIdx}
                              className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                                selectedMembres.includes(membreIdx)
                                  ? 'bg-blue-100 border border-blue-300'
                                  : 'bg-gray-50 hover:bg-gray-100'
                              }`}
                              onClick={() => handleToggleMembre(groupe, membreIdx)}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={selectedMembres.includes(membreIdx)}
                                  onChange={() => {}}
                                  className="rounded text-blue-600"
                                />
                                <span className="text-sm">
                                  {membre.prenom} {membre.nom}
                                  {membre.age && ` (${membre.age} ans)`}
                                </span>
                              </div>
                              {membre.telephone && (
                                <span className="text-xs text-gray-500">
                                  📞 {membre.telephone}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="flex gap-2 pt-4">
                    <button
                      onClick={() => setStep(1)}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-lg font-semibold"
                    >
                      Retour
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      disabled={!isSelectionValid()}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Suivant
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Étape 3 : Destination */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Résumé de la sélection */}
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700 mb-1">
                  À transférer :
                </p>
                {selectedGroupe?.type === 'famille' ? (
                  <p className="font-medium">Famille {selectedGroupe.nomFamille} ({selectedGroupe.nombreMembres} personnes)</p>
                ) : (
                  <p className="font-medium">
                    {selectedMembres.length} membre(s) sélectionné(s)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bloc destination
                </label>
                <select
                  value={destBloc}
                  onChange={(e) => setDestBloc(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choisir un bloc...</option>
                  {blocs.map((bloc) => (
                    <option key={bloc.nom} value={bloc.nom}>
                      Bloc {bloc.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Appartement destination
                </label>
                <select
                  value={destAppart}
                  onChange={(e) => setDestAppart(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choisir un appartement...</option>
                  {getAppartementsForBloc(destBloc, sourceAppart).map((appart) => (
                    <option key={appart.nom} value={appart.nom} className={appart.estOccupe ? 'text-green-600' : 'text-gray-400'}>
                      {appart.nom} {appart.estOccupe ? '✓ Occupé' : '○ Libre'}
                    </option>
                  ))}
                </select>

                {/* Avertissement de compatibilité */}
                {destAppart && typeDest && typeDest !== selectedGroupe?.type && (
                  <p className="text-xs text-yellow-600 mt-2 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Attention : Mélange de types différents
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-lg font-semibold"
                >
                  Retour
                </button>
                <button
                  onClick={handleTransfert}
                  disabled={isTransfertDisabled()}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <FaExchangeAlt size={14} />
                  Transférer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransfertLocataireModal;