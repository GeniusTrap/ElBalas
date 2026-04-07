import React, { useState, useEffect } from 'react';
import { FaTimes, FaUser, FaUsers, FaBuilding, FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import { backendUrl } from '../App';

const DeleteLocataireModal = ({ isOpen, onClose, onDelete, blocs, appartementsParBloc, locatairesData = {} }) => {
  const [step, setStep] = useState(1);
  const [selectedBloc, setSelectedBloc] = useState('');
  const [selectedAppart, setSelectedAppart] = useState('');
  const [locatairesExistants, setLocatairesExistants] = useState([]);
  const [selectedGroupe, setSelectedGroupe] = useState(null);
  const [selectedMembres, setSelectedMembres] = useState([]);
  const [loading, setLoading] = useState(false);
  const [typeExistant, setTypeExistant] = useState(null);

  useEffect(() => {
    const fetchLocatairesExistants = async () => {
      if (selectedAppart && locatairesData[selectedAppart] > 0) {
        setLoading(true);
        try {
          const token = sessionStorage.getItem('token');
          const response = await fetch(
            `${backendUrl}/api/locataires/appartement/${selectedBloc}/${selectedAppart}`,
            {
              headers: { 'Authorization': `Bearer ${token}` }
            }
          );
          const data = await response.json();
          
          if (data.success) {
            // Grouper les locataires par appartement
            const locatairesParAppart = {};
            data.locataires.forEach(loc => {
              if (!locatairesParAppart[loc.appartementNom]) {
                locatairesParAppart[loc.appartementNom] = [];
              }
              locatairesParAppart[loc.appartementNom].push(loc);
            });
            
            // Pour l'appartement sélectionné, fusionner les données si plusieurs documents
            const locatairesDeAppart = locatairesParAppart[selectedAppart] || [];
            
            if (locatairesDeAppart.length > 1) {
              // Fusionner les documents du même appartement
              const type = locatairesDeAppart[0].type;
              
              if (type === 'famille') {
                // Fusionner les familles
                const familleFusionnee = {
                  _id: locatairesDeAppart[0]._id,
                  type: 'famille',
                  nomFamille: locatairesDeAppart[0].nomFamille,
                  telephoneFamille: locatairesDeAppart[0].telephoneFamille,
                  nombreMembres: locatairesDeAppart.reduce((sum, loc) => sum + (loc.nombreMembres || 0), 0),
                  membres: []
                };
                setLocatairesExistants([familleFusionnee]);
                setTypeExistant('famille');
              } else {
                // Fusionner les individus
                const tousLesMembres = locatairesDeAppart.flatMap(loc => loc.membres || []);
                const individusFusionnes = {
                  _id: locatairesDeAppart[0]._id,
                  type: 'individus',
                  membres: tousLesMembres,
                  nombreMembres: tousLesMembres.length
                };
                setLocatairesExistants([individusFusionnes]);
                setTypeExistant('individus');
              }
            } else {
              setLocatairesExistants(locatairesDeAppart);
              setTypeExistant(locatairesDeAppart[0]?.type || null);
            }
          }
        } catch (error) {
          console.error('Erreur chargement locataires:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLocatairesExistants([]);
        setTypeExistant(null);
      }
    };

    if (selectedAppart) {
      fetchLocatairesExistants();
    }
  }, [selectedAppart, selectedBloc, locatairesData]);

  if (!isOpen) return null;

  const resetModal = () => {
    setStep(1);
    setSelectedBloc('');
    setSelectedAppart('');
    setLocatairesExistants([]);
    setSelectedGroupe(null);
    setSelectedMembres([]);
    setTypeExistant(null);
  };

  const handleSelectAllMembres = (groupe) => {
    if (groupe.type === 'famille') {
      // Pour une famille, sélectionner = supprimer tout le groupe
      setSelectedGroupe(groupe);
      setSelectedMembres([]);
    } else {
      // Pour des individus, on peut sélectionner plusieurs membres
      if (selectedGroupe?._id === groupe._id && selectedMembres.length === groupe.membres.length) {
        // Tout déselectionner
        setSelectedMembres([]);
        setSelectedGroupe(null);
      } else {
        // Tout sélectionner
        setSelectedMembres(groupe.membres.map((_, idx) => idx));
        setSelectedGroupe(groupe);
      }
    }
  };

  const handleToggleMembre = (groupe, membreIndex) => {
    if (selectedGroupe?._id !== groupe._id) {
      // Nouveau groupe sélectionné
      setSelectedGroupe(groupe);
      setSelectedMembres([membreIndex]);
    } else {
      // Même groupe, on toggle le membre
      if (selectedMembres.includes(membreIndex)) {
        setSelectedMembres(selectedMembres.filter(i => i !== membreIndex));
        if (selectedMembres.length === 1) {
          // Si c'était le dernier membre, on déselectionne le groupe
          setSelectedGroupe(null);
        }
      } else {
        setSelectedMembres([...selectedMembres, membreIndex]);
      }
    }
  };

  const handleDelete = async () => {
    if (!selectedGroupe) return;

    try {
      const token = sessionStorage.getItem('token');
      const suppressionData = {
      type: selectedGroupe.type,
      bloc: selectedBloc,
      appartement: selectedAppart,
      typeOccupation: 'location' // ou récupérer depuis les données si disponible
    };

    if (selectedGroupe.type === 'famille') {
      suppressionData.nomFamille = selectedGroupe.nomFamille;
      suppressionData.nombreMembres = selectedGroupe.nombreMembres;
    } else {
      // Pour les individus, on prend les membres sélectionnés
      const membresSupprimes = selectedMembres.map(idx => ({
        nom: selectedGroupe.membres[idx].nom,
        prenom: selectedGroupe.membres[idx].prenom
      }));
      suppressionData.membres = membresSupprimes;
      suppressionData.nombreMembres = selectedMembres.length;
      
      if (selectedMembres.length === 1) {
        const membre = selectedGroupe.membres[selectedMembres[0]];
        suppressionData.nomMembre = `${membre.prenom} ${membre.nom}`;
      }
    }
      let response;

      if (selectedGroupe.type === 'famille') {
        // Supprimer toute la famille
        response = await fetch(`${backendUrl}/api/locataires/${selectedGroupe._id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } else {
        // Pour des individus, on peut soit supprimer tout le groupe, soit des membres spécifiques
        if (selectedMembres.length === selectedGroupe.membres.length) {
          // Supprimer tout le groupe
          response = await fetch(`${backendUrl}/api/locataires/${selectedGroupe._id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
        } else {
          // Supprimer seulement les membres sélectionnés
          const membresRestants = selectedGroupe.membres.filter((_, idx) => !selectedMembres.includes(idx));
          
          if (membresRestants.length === 0) {
            // Si plus aucun membre, supprimer le document
            response = await fetch(`${backendUrl}/api/locataires/${selectedGroupe._id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });
          } else {
            // Mettre à jour avec les membres restants
            response = await fetch(`${backendUrl}/api/locataires/${selectedGroupe._id}`, {
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
      }

      const result = await response.json();

      if (result.success) {
        onDelete(suppressionData);
        resetModal();
        onClose();
      }
    } catch (error) {
      console.error('Erreur suppression locataires:', error);
    }
  };

  const getAppartementsForBloc = () => {
    if (!selectedBloc || !appartementsParBloc) return [];
    const appartements = appartementsParBloc[selectedBloc] || [];
    return appartements.map(appart => ({
      nom: appart,
      estOccupe: locatairesData[appart] > 0
    }));
  };

  const isDeleteDisabled = () => {
  if (!selectedGroupe) return true;
  if (selectedGroupe.type === 'famille') {
    return false; // ← ICI le problème ? 
  }
  return selectedMembres.length === 0;
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
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-6 py-4 rounded-t-2xl flex justify-between items-center sticky top-0">
          <div className="flex items-center">
            <FaTrash className="text-2xl mr-3" />
            <h2 className="text-2xl font-bold">Supprimer des locataires</h2>
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
            <div className={`flex-1 text-center ${step >= 1 ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
              Bloc
            </div>
            <div className={`flex-1 text-center ${step >= 2 ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
              Appartement
            </div>
            <div className={`flex-1 text-center ${step >= 3 ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
              Sélection
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Étape 1 : Choix du bloc */}
          {step === 1 && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sélectionnez un bloc
              </label>
              <select
                value={selectedBloc}
                onChange={(e) => setSelectedBloc(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                required
              >
                <option value="">Choisir un bloc...</option>
                {blocs.map((bloc) => (
                  <option key={bloc.nom} value={bloc.nom}>
                    Bloc {bloc.nom}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setStep(2)}
                disabled={!selectedBloc}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
          )}

          {/* Étape 2 : Choix de l'appartement */}
          {step === 2 && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sélectionnez un appartement
              </label>
              <select
                value={selectedAppart}
                onChange={(e) => setSelectedAppart(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                required
              >
                <option value="">Choisir un appartement...</option>
                {getAppartementsForBloc().map((appart) => (
                  <option key={appart.nom} value={appart.nom} className={appart.estOccupe ? 'text-green-600' : 'text-gray-400'}>
                    {appart.nom} {appart.estOccupe ? '✓ Occupé' : '○ Libre'}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-lg font-semibold"
                >
                  Retour
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!selectedAppart || !locatairesData[selectedAppart]}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              </div>
              {selectedAppart && !locatairesData[selectedAppart] && (
                <p className="text-xs text-red-500 mt-1">
                  Cet appartement est vide
                </p>
              )}
            </div>
          )}

          {/* Étape 3 : Sélection des locataires à supprimer */}
          {step === 3 && (
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto" />
                </div>
              ) : locatairesExistants.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Aucun locataire dans cet appartement
                </div>
              ) : (
                <>
                  <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm text-red-700 flex items-center gap-2">
                      <FaExclamationTriangle className="text-red-500" />
                      Sélectionnez les locataires à supprimer
                    </p>
                  </div>

                  {locatairesExistants.map((groupe, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* En-tête du groupe */}
                      <div 
                        className={`px-4 py-3 flex justify-between items-center cursor-pointer transition-colors ${
                          selectedGroupe?._id === groupe._id 
                            ? 'bg-red-100 border-red-300' 
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                        onClick={() => handleSelectAllMembres(groupe)}
                      >
                        <div className="flex items-center gap-2">
                          {groupe.type === 'famille' ? (
                            <FaUsers className="text-red-600" />
                          ) : (
                            <FaUser className="text-red-600" />
                          )}
                          <span className="font-medium">
                            {groupe.type === 'famille' 
                              ? `Famille ${groupe.nomFamille}` 
                              : `Résidents (${groupe.membres.length})`}
                          </span>
                        </div>
                        {selectedGroupe?._id === groupe._id && (
                          <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full">
                            {groupe.type === 'famille' ? 'Sélectionné' : `${selectedMembres.length} sélectionné(s)`}
                          </span>
                        )}
                      </div>

                      {/* Liste des membres (pour les individus) */}
                      {groupe.type === 'individus' && selectedGroupe?._id === groupe._id && (
                        <div className="p-3 border-t border-gray-200 space-y-2">
                          {groupe.membres.map((membre, membreIdx) => (
                            <div
                              key={membreIdx}
                              className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                                selectedMembres.includes(membreIdx)
                                  ? 'bg-red-100 border border-red-300'
                                  : 'bg-gray-50 hover:bg-gray-100'
                              }`}
                              onClick={() => handleToggleMembre(groupe, membreIdx)}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={selectedMembres.includes(membreIdx)}
                                  onChange={() => {}}
                                  className="rounded text-red-600"
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

                  {/* Boutons */}
                  <div className="flex gap-2 pt-4">
                    <button
                      onClick={() => setStep(2)}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-lg font-semibold"
                    >
                      Retour
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleteDisabled()}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <FaTrash size={14} />
                      Supprimer
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeleteLocataireModal;