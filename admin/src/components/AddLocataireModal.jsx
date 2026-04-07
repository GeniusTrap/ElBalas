import React, { useState, useEffect } from 'react';
import { FaTimes, FaUser, FaUsers, FaBuilding } from 'react-icons/fa';
import { backendUrl } from '../App';

const AddLocataireModal = ({ isOpen, onClose, onSave, blocs, appartementsParBloc, locatairesData = {} }) => {
  const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

  const [step, setStep] = useState(1);
  const [selectedBloc, setSelectedBloc] = useState('');
  const [selectedAppart, setSelectedAppart] = useState('');
  const [appartementEstOccupe, setAppartementEstOccupe] = useState(false);
  const [locatairesExistants, setLocatairesExistants] = useState([]);
  const [typeExistant, setTypeExistant] = useState(null); 
  const [dateArrivee, setDateArrivee] = useState(getTodayDate());
  const [datePaiement, setDatePaiement] = useState('');
  const [typeOccupation, setTypeOccupation] = useState('location');
  const [locataireData, setLocataireData] = useState({
    type: 'famille',
    nomFamille: '',
    nombreMembres: '',
    telephone: '',
    membres: [{ nom: '', prenom: '', age: '', telephone: '' }]
  });

  useEffect(() => {
  const fetchLocatairesExistants = async () => {
    if (selectedAppart && locatairesData[selectedAppart] > 0) {
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
              
              setLocataireData(prev => ({
                ...prev,
                nomFamille: familleFusionnee.nomFamille
              }));
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
            
            // Pré-remplir le nom de famille si c'est une famille
            const familleExistante = locatairesDeAppart.find(l => l.type === 'famille');
            if (familleExistante) {
              setLocataireData(prev => ({
                ...prev,
                nomFamille: familleExistante.nomFamille
              }));
            }
          }
          
          setAppartementEstOccupe(true);
        }
      } catch (error) {
        console.error('Erreur chargement locataires:', error);
      }
    } else {
      setAppartementEstOccupe(false);
      setLocatairesExistants([]);
      setTypeExistant(null);
    }
  };

  if (selectedAppart) {
    fetchLocatairesExistants();
  }
}, [selectedAppart, selectedBloc, locatairesData]);

  if (!isOpen) return null;


  const handleAddMembre = () => {
    setLocataireData({
      ...locataireData,
      membres: [...locataireData.membres, { nom: '', prenom: '', age: '', telephone: '' }]
    });
  };

  const resetModal = () => {
  setStep(1);
  setSelectedBloc('');
  setSelectedAppart('');
  setLocataireData({
    type: 'famille',
    nomFamille: '',
    nombreMembres: '',
    telephone: '',
    membres: [{ nom: '', prenom: '', age: '', telephone: '' }]
  });
  setAppartementEstOccupe(false);
  setLocatairesExistants([]);
  setTypeExistant(null);
  setDateArrivee(getTodayDate());
  setDatePaiement('');
  setTypeOccupation('location');
};

  const handleRemoveMembre = (index) => {
    const newMembres = locataireData.membres.filter((_, i) => i !== index);
    setLocataireData({
      ...locataireData,
      membres: newMembres
    });
  };

  const handleMembreChange = (index, field, value) => {
    const newMembres = [...locataireData.membres];
    newMembres[index][field] = value;
    setLocataireData({
      ...locataireData,
      membres: newMembres
    });
  };

  const handleSubmit = async () => {
  let locatairesAPreparer;

  
  
  if (appartementEstOccupe && typeExistant === 'famille') {
    const familleExistante = locatairesExistants.find(l => l.type === 'famille');
    locatairesAPreparer = {
      id: familleExistante?._id,
      blocNom: selectedBloc,
      appartementNom: selectedAppart,
      type: 'famille',
      nomFamille: locataireData.nomFamille,
      nombreMembres: (familleExistante?.nombreMembres || 0) + locataireData.nombreMembres,
      telephoneFamille: familleExistante?.telephoneFamille || locataireData.telephone,
      membres: [],
      dateArrivee: dateArrivee,
      datePaiement: datePaiement || null,
      typeOccupation: typeOccupation,
      statutPaiement: datePaiement ? 'paye' : 'non_paye' 
    };

  } else if (appartementEstOccupe && typeExistant === 'individus') {
    const individusExistants = locatairesExistants.find(l => l.type === 'individus');
    const nouveauxMembres = locataireData.membres.map(membre => ({
      nom: membre.nom,
      prenom: membre.prenom,
      age: membre.age || null,
      telephone: membre.telephone || null
    }));

    locatairesAPreparer = {
      id: individusExistants?._id,
      blocNom: selectedBloc,
      appartementNom: selectedAppart,
      type: 'individus',
      membres: [...(individusExistants?.membres || []), ...nouveauxMembres],
      dateArrivee: dateArrivee,
      datePaiement: datePaiement || null,
      typeOccupation: typeOccupation,
      statutPaiement: datePaiement ? 'paye' : 'non_paye'
      
    };
  } else {
    if (locataireData.type === 'famille') {
      locatairesAPreparer = {
        blocNom: selectedBloc,
        appartementNom: selectedAppart,
        type: 'famille',
        nomFamille: locataireData.nomFamille,
        nombreMembres: locataireData.nombreMembres,
        telephoneFamille: locataireData.telephone || null,
        membres: [],
        dateArrivee: dateArrivee,
        datePaiement: datePaiement || null,
        typeOccupation: typeOccupation,
        statutPaiement: datePaiement ? 'paye' : 'non_paye' 
      };
    } else {
      const membresData = locataireData.membres.map(membre => ({
        nom: membre.nom,
        prenom: membre.prenom,
        age: membre.age || null,
        telephone: membre.telephone || null
      }));

      locatairesAPreparer = {
        blocNom: selectedBloc,
        appartementNom: selectedAppart,
        type: 'individus',
        membres: membresData,
        dateArrivee: dateArrivee,
        datePaiement: datePaiement || null,
        typeOccupation: typeOccupation,
        statutPaiement: datePaiement ? 'paye' : 'non_paye'
      };
    }
  }
  
  onSave(locatairesAPreparer);
  resetModal();
  onClose();
};



  const getAppartementsForBloc = () => {
    if (!selectedBloc || !appartementsParBloc) return [];
    
    const appartements = appartementsParBloc[selectedBloc] || [];
    
    return appartements.map(appart => ({
      nom: appart,
      estOccupe: locatairesData[appart] > 0
    }));
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
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-4 rounded-t-2xl flex justify-between items-center sticky top-0">
          <div className="flex items-center">
            <FaUsers className="text-2xl mr-3" />
            <h2 className="text-2xl font-bold">Ajouter des locataires</h2>
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
              Bloc
            </div>
            <div className={`flex-1 text-center ${step >= 2 ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
              Appartement
            </div>
            <div className={`flex-1 text-center ${step >= 3 ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
              Locataires
            </div>
            <div className={`flex-1 text-center ${step >= 4 ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
      Confirmation
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
              <button
                onClick={() => setStep(2)}
                disabled={!selectedBloc}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Choisir un appartement...</option>
                {getAppartementsForBloc().map((appart) => (
                  <option key={appart.nom} value={appart.nom} className={appart.estOccupe ? 'text-green-600' : 'text-blue-600'}>
                    {appart.nom} {appart.estOccupe ? '✓ Occupé' : '○ Libre'}
                  </option>
                ))}
              </select>
              <div className="flex gap-2 pt-4">
  <button
    onClick={() => setStep(1)}
    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-lg font-semibold"
  >
    Retour
  </button>
  <button
    onClick={() => setStep(3)}  
    disabled={!selectedAppart}
    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
  >
    Suivant
  </button>
</div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
{appartementEstOccupe && locatairesExistants.length > 0 && (
  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
    <h3 className="text-sm font-semibold text-blue-800 mb-2">
      Locataires actuels :
    </h3>
    {locatairesExistants.map((groupe, idx) => (
      <div key={idx} className="text-sm text-gray-700 mb-2 pb-2 border-b border-blue-100 last:border-0">
        {groupe.type === 'famille' ? (
          <>
            <p className="font-medium">Famille {groupe.nomFamille}</p>
            <p className="text-xs text-gray-500">{groupe.nombreMembres} personnes</p>
            {groupe.telephoneFamille && (
              <p className="text-xs text-gray-500">📞 {groupe.telephoneFamille}</p>
            )}
          </>
        ) : (
          <>
            <p className="font-medium">Résidents ({groupe.membres.length}) :</p>
            {groupe.membres.map((m, i) => (
              <p key={i} className="text-xs text-gray-600 ml-2">
                • {m.prenom} {m.nom} {m.age && `(${m.age} ans)`}
                {m.telephone && ` - 📞 ${m.telephone}`}
              </p>
            ))}
          </>
        )}
      </div>
    ))}
    <p className="text-xs text-gray-500 mt-2">
      ➕ Ajouter de nouveaux membres ci-dessous
    </p>
  </div>
)}

              {/* Interface adaptée selon le type d'occupation */}
              {!appartementEstOccupe ? (
                /* APPARTEMENT LIBRE - avec choix du type */
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type de saisie
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="famille"
                          checked={locataireData.type === 'famille'}
                          onChange={(e) => setLocataireData({
                            type: e.target.value,
                            nomFamille: '',
                            nombreMembres: '',
                            telephone: '',
                            membres: [{ nom: '', prenom: '', age: '', telephone: '' }]
                          })}
                          className="mr-2"
                        />
                        <span>Famille</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="individus"
                          checked={locataireData.type === 'individus'}
                          onChange={(e) => setLocataireData({
                            type: e.target.value,
                            nomFamille: '',
                            nombreMembres: '',
                            telephone: '',
                            membres: [{ nom: '', prenom: '', age: '', telephone: '' }]
                          })}
                          className="mr-2"
                        />
                        <span>Individus séparés</span>
                      </label>
                    </div>
                  </div>

                  {/* Mode Famille pour appartement libre */}
                  {locataireData.type === 'famille' && (
                    <div className="space-y-4">
                      <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Nom de la famille
  </label>
  <input
  type="text"
  value={locataireData.nomFamille}
  onChange={(e) => setLocataireData({ ...locataireData, nomFamille: e.target.value })}
  placeholder="Ex: Gharbi, Trabelsi..."
  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
  required
/>
</div>

                      <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Nombre de membres
  </label>
  <input
  type="number"
  min="1"
  max="20"
  value={locataireData.nombreMembres === '' ? '' : locataireData.nombreMembres}
  onChange={(e) => {
    const value = e.target.value;
    if (value === '') {
      setLocataireData({ ...locataireData, nombreMembres: '' });
    } else {
      setLocataireData({ ...locataireData, nombreMembres: parseInt(value) || 1 });
    }
  }}
  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
/>
</div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Téléphone (optionnel)
                        </label>
                        <input
                          type="tel"
                          value={locataireData.telephone}
                          onChange={(e) => setLocataireData({
                            ...locataireData,
                            telephone: e.target.value
                          })}
                          placeholder="Ex: 99 123 456"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Un seul numéro pour toute la famille
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Mode Individus pour appartement libre */}
                  {locataireData.type === 'individus' && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="block text-sm font-medium text-gray-700">
                          Membres ({locataireData.membres.length})
                        </label>
                        <button
                          onClick={handleAddMembre}
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Ajouter
                        </button>
                      </div>

                      {locataireData.membres.map((membre, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg relative">
                          {index > 0 && (
                            <button
                              onClick={() => handleRemoveMembre(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            >
                              <FaTimes size={12} />
                            </button>
                          )}
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <input
                              type="text"
                              placeholder="Nom"
                              value={membre.nom}
                              onChange={(e) => handleMembreChange(index, 'nom', e.target.value)}
                              className="col-span-1 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                            <input
                              type="text"
                              placeholder="Prénom"
                              value={membre.prenom}
                              onChange={(e) => handleMembreChange(index, 'prenom', e.target.value)}
                              className="col-span-1 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="number"
                              placeholder="Âge"
                              value={membre.age}
                              onChange={(e) => handleMembreChange(index, 'age', e.target.value)}
                              className="col-span-1 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                            <input
                              type="tel"
                              placeholder="Téléphone"
                              value={membre.telephone}
                              onChange={(e) => handleMembreChange(index, 'telephone', e.target.value)}
                              className="col-span-1 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                /* APPARTEMENT OCCUPÉ - interface adaptée au type existant */
                <>
                  {typeExistant === 'famille' && (
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-3">
                          Ajouter à la famille <span className="font-semibold">{locataireData.nomFamille}</span>
                        </p>
                        <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Nombre de nouveaux membres
  </label>
  <input
  type="number"
  min="1"
  max="20"
  value={locataireData.nombreMembres === '' ? '' : locataireData.nombreMembres}
  onChange={(e) => {
    const value = e.target.value;
    if (value === '') {
      setLocataireData({ ...locataireData, nombreMembres: '' });
    } else {
      setLocataireData({ ...locataireData, nombreMembres: parseInt(value) || 1 });
    }
  }}
  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
/>
  <p className="text-xs text-gray-500 mt-1">
    Ces membres seront ajoutés sans coordonnées individuelles
  </p>
</div>
                      </div>
                    </div>
                  )}

                  {typeExistant === 'individus' && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="block text-sm font-medium text-gray-700">
                          Nouveaux membres à ajouter ({locataireData.membres.length})
                        </label>
                        <button
                          onClick={handleAddMembre}
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Ajouter
                        </button>
                      </div>

                      {locataireData.membres.map((membre, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg relative">
                          {index > 0 && (
                            <button
                              onClick={() => handleRemoveMembre(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            >
                              <FaTimes size={12} />
                            </button>
                          )}
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <input
                              type="text"
                              placeholder="Nom"
                              value={membre.nom}
                              onChange={(e) => handleMembreChange(index, 'nom', e.target.value)}
                              className="col-span-1 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                            <input
                              type="text"
                              placeholder="Prénom"
                              value={membre.prenom}
                              onChange={(e) => handleMembreChange(index, 'prenom', e.target.value)}
                              className="col-span-1 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="number"
                              placeholder="Âge"
                              value={membre.age}
                              onChange={(e) => handleMembreChange(index, 'age', e.target.value)}
                              className="col-span-1 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                            <input
                              type="tel"
                              placeholder="Téléphone"
                              value={membre.telephone}
                              onChange={(e) => handleMembreChange(index, 'telephone', e.target.value)}
                              className="col-span-1 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Boutons de navigation */}
              <div className="flex gap-2 pt-4">
  <button
    onClick={() => setStep(2)}
    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-lg font-semibold"
  >
    Retour
  </button>
  
  {appartementEstOccupe ? (
    /* ✅ APPARTEMENT OCCUPÉ - Ajout direct */
    <button
  onClick={handleSubmit}
  disabled={
    (typeExistant === 'famille' && (!locataireData.nombreMembres || locataireData.nombreMembres <= 0)) ||
    (typeExistant === 'individus' && locataireData.membres.some(m => !m.nom || !m.prenom))
  }
  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
>
  Ajouter
</button>
  ) : (
    /* ✅ APPARTEMENT LIBRE - Aller à l'étape 4 */
    <button
  onClick={() => setStep(4)}
  disabled={
    (locataireData.type === 'famille' && (!locataireData.nomFamille.trim() || !locataireData.nombreMembres || locataireData.nombreMembres <= 0)) ||
    (locataireData.type === 'individus' && locataireData.membres.some(m => !m.nom || !m.prenom))
  }
  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
>
  Suivant
</button>
  )}
</div>
            </div>
          )}
          {step === 4 && (
  <div className="space-y-4">
    {/* Résumé des locataires */}
    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
      <h3 className="text-sm font-semibold text-blue-800 mb-2">Récapitulatif</h3>
      {locataireData.type === 'famille' ? (
        <p className="text-sm text-gray-700">
          Famille <span className="font-semibold">{locataireData.nomFamille}</span> • {locataireData.nombreMembres} membres
        </p>
      ) : (
        <p className="text-sm text-gray-700">
          {locataireData.membres.length} membre(s) à ajouter
        </p>
      )}
    </div>

    {/* Date d'arrivée */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Date d'arrivée
      </label>
      <div className="flex gap-2 items-center">
        <input
          type="date"
          value={dateArrivee}
          onChange={(e) => setDateArrivee(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={() => setDateArrivee(getTodayDate())} 
          className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm"
        >
          Aujourd'hui
        </button>
      </div>
    </div>

    {/* Date de paiement */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Date de paiement (optionnel)
      </label>
      <input
        type="date"
        value={datePaiement}
        onChange={(e) => setDatePaiement(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
      />
    </div>

    {/* Type d'occupation */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Type d'occupation
      </label>
      <div className="flex gap-4">
        <label className="flex items-center">
          <input
            type="radio"
            value="location"
            checked={typeOccupation === 'location'}
            onChange={(e) => setTypeOccupation(e.target.value)}
            className="mr-2"
          />
          <span>Location</span>
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            value="achat"
            checked={typeOccupation === 'achat'}
            onChange={(e) => setTypeOccupation(e.target.value)}
            className="mr-2"
          />
          <span>Achat</span>
        </label>
      </div>
    </div>

    {/* Boutons de navigation */}
    <div className="flex gap-2 pt-4">
      <button
        onClick={() => setStep(3)}
        className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-lg font-semibold"
      >
        Retour
      </button>
      <button
        onClick={handleSubmit}
        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold"
      >
        Confirmer
      </button>
    </div>
  </div>
)}
        </div>
      </div>
    </div>
  );
};

export default AddLocataireModal;