import React, { useState, useEffect } from 'react';
import { FaTimes, FaBuilding, FaArrowRight, FaCheck } from 'react-icons/fa';

const AddBlocModal = ({ isOpen, onClose, onSave, currentBlocCount = 0, existingBlocNames = [] }) => {
  const [step, setStep] = useState(1);
  const [blocData, setBlocData] = useState({
    nom: '',
    etages: 1,
    appartementsAttendus: [],
    appartementsParEtage: []
  });
  const [currentEtage, setCurrentEtage] = useState(1);

  const calculateBlocPosition = () => {
    const positions = [
      [-8, 0, 0], [0, 0, 0], [8, 0, 0], [-4, 0, 6], 
      [4, 0, 6], [-6, 0, -6], [6, 0, -6], [-2, 0, 12], [2, 0, 12]
    ];
    
    return positions[currentBlocCount] || [currentBlocCount * 8 - 12, 0, currentBlocCount % 2 === 0 ? 0 : 6];
  };

  const resetModal = () => {
  setStep(1);
  setBlocData({
    nom: '',
    etages: 1,
    appartementsAttendus: [],
    appartementsParEtage: []
  });
  setCurrentEtage(1);
};

useEffect(() => {
    if (!isOpen) {
      resetModal();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNomSubmit = (e) => {
  e.preventDefault();
  if (currentBlocCount >= 11) {
    alert("❌ Limite atteinte ! Vous ne pouvez pas créer plus de 11 blocs.");
    onClose();
    return;
  }
  
  const nomBloc = blocData.nom.trim().toUpperCase();
  
  if (existingBlocNames.includes(nomBloc)) {
    alert(`❌ Le bloc "${nomBloc}" existe déjà. Veuillez choisir un autre nom.`);
    return;
  }
  
  if (nomBloc) {
    setStep(2);
  }
};

  const handleEtagesSubmit = (e) => {
    e.preventDefault();
    if (blocData.etages > 0) {
      setBlocData({
        ...blocData,
        appartementsAttendus: Array(blocData.etages).fill(0),
        appartementsParEtage: Array(blocData.etages).fill([]).map(() => [])
      });
      setCurrentEtage(1);
      setStep(3);
    }
  };

  const handleNbAppartementsSubmit = (nb) => {
    const updatedAttendus = [...blocData.appartementsAttendus];
    updatedAttendus[currentEtage - 1] = nb;
    
    setBlocData({
      ...blocData,
      appartementsAttendus: updatedAttendus
    });
    setStep(4);
  };

  const handleAddAppartement = (nom) => {
    const updatedAppartements = [...blocData.appartementsParEtage];
    if (!updatedAppartements[currentEtage - 1]) {
      updatedAppartements[currentEtage - 1] = [];
    }
    
    // Vérifier qu'on n'ajoute pas plus que le maximum
    const maxAppart = blocData.appartementsAttendus[currentEtage - 1];
    const currentCount = updatedAppartements[currentEtage - 1].length;
    
    if (currentCount < maxAppart) {
      updatedAppartements[currentEtage - 1].push(nom);
      
      setBlocData({
        ...blocData,
        appartementsParEtage: updatedAppartements
      });
    }
  };

  const getDefaultAppartName = () => {
    const etage = currentEtage;
    const currentCount = blocData.appartementsParEtage[etage - 1]?.length || 0;
    const num = currentCount + 1;
    
    if (etage === 1) {
      return `${blocData.nom}-RDC${num}`;
    } else {
      return `${blocData.nom}${etage - 1}${num}`;
    }
  };

  const handleNextEtage = () => {
    if (currentEtage < blocData.etages) {
      setCurrentEtage(currentEtage + 1);
      setStep(3);
    } else {
      const totalAppartements = blocData.appartementsParEtage.reduce(
        (sum, etage) => sum + (etage?.length || 0), 0
      );
      
      const newBloc = {
        ...blocData,
        totalAppartements,
        position: calculateBlocPosition(),  
        hauteur: blocData.etages * 2,
        largeur: 3,
        profondeur: 3
      };
      
      onSave(newBloc);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-4 rounded-t-2xl flex justify-between items-center">
  <div className="flex items-center">
    <FaBuilding className="text-2xl mr-3" />
    <h2 className="text-2xl font-bold">Ajouter un bloc</h2>
  </div>
  <div className="flex items-center gap-3">
    <span className="text-sm bg-blue-700 px-2 py-1 rounded">
      {currentBlocCount}/11 blocs
    </span>
    <button onClick={onClose} className="text-white hover:text-gray-200">
      <FaTimes size={24} />
    </button>
  </div>
</div>

        {/* Stepper */}
        <div className="px-6 pt-4">
          <div className="flex justify-between text-sm">
            <div className={`flex-1 text-center ${step >= 1 ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
              Nom
            </div>
            <div className={`flex-1 text-center ${step >= 2 ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
              Étages
            </div>
            <div className={`flex-1 text-center ${step >= 3 ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
              Config
            </div>
            <div className={`flex-1 text-center ${step >= 4 ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
              Apparts
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Étape 1 : Nom du bloc */}
          {step === 1 && (
            <form onSubmit={handleNomSubmit} className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du bloc
              </label>
              <input
                type="text"
                value={blocData.nom}
                onChange={(e) => setBlocData({...blocData, nom: e.target.value.toUpperCase()})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: A, B, C..."
                autoFocus
                required
              />
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold"
              >
                Suivant
              </button>
            </form>
          )}

          {/* Étape 2 : Nombre d'étages */}
          {step === 2 && (
            <form onSubmit={handleEtagesSubmit} className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre d'étages
              </label>
              <input
                type="number"
                value={blocData.etages}
                onChange={(e) => setBlocData({...blocData, etages: parseInt(e.target.value)})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="1"
                max="10"
                required
              />
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold"
              >
                Suivant
              </button>
            </form>
          )}

          {/* Étape 3 : Nombre d'appartements par étage */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-gray-700">
                {currentEtage === 1 ? 'Rez-de-chaussée' : `Étage ${currentEtage - 1}`} ({currentEtage}/{blocData.etages})
              </p>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre d'appartements
              </label>
              <input
                type="number"
                id="nbAppartements"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="1"
                max="10"
                autoFocus
              />
              <button
                onClick={() => {
                  const nb = parseInt(document.getElementById('nbAppartements').value);
                  if (nb > 0) handleNbAppartementsSubmit(nb);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold"
              >
                Valider
              </button>
            </div>
          )}

          {/* Étape 4 : Saisie des noms d'appartements */}
          {step === 4 && (
            <div className="space-y-4">
              <p className="text-gray-700 font-semibold">
                {currentEtage === 1 ? 'Rez-de-chaussée' : `Étage ${currentEtage - 1}`} - {blocData.appartementsAttendus[currentEtage-1]} appartements
              </p>
              
              {/* Formulaire d'ajout - visible seulement s'il reste des places */}
              {(blocData.appartementsParEtage[currentEtage-1]?.length || 0) < blocData.appartementsAttendus[currentEtage-1] && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const nom = e.target.appartementNom.value;
                    if (nom.trim()) {
                      handleAddAppartement(nom);
                      e.target.reset();
                      // Focus sur le champ après ajout
                      setTimeout(() => {
                        const input = document.querySelector('input[name="appartementNom"]');
                        if (input) input.focus();
                      }, 100);
                    }
                  }}
                  className="space-y-2"
                >
                  <input
                    type="text"
                    name="appartementNom"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder={`Nom appartement (ex: ${getDefaultAppartName()})`}
                    defaultValue={getDefaultAppartName()}
                    autoFocus
                    required
                  />
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold"
                  >
                    Ajouter ({blocData.appartementsParEtage[currentEtage-1]?.length || 0}/{blocData.appartementsAttendus[currentEtage-1]})
                  </button>
                </form>
              )}

              {/* Message si l'étage est complet */}
              {(blocData.appartementsParEtage[currentEtage-1]?.length || 0) >= blocData.appartementsAttendus[currentEtage-1] && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <p className="text-sm text-green-700 font-medium">
                    ✓ Étage complet ! ({blocData.appartementsAttendus[currentEtage-1]}/{blocData.appartementsAttendus[currentEtage-1]} appartements)
                  </p>
                </div>
              )}

              {/* Liste des appartements saisis */}
              {blocData.appartementsParEtage[currentEtage-1]?.length > 0 && (
                <div className="mt-2 p-2 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600 mb-1">Appartements :</p>
                  <div className="flex flex-wrap gap-1">
                    {blocData.appartementsParEtage[currentEtage-1].map((nom, idx) => (
                      <span key={idx} className="bg-gray-200 px-2 py-1 rounded text-xs">
                        {nom}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Bouton pour passer à l'étage suivant ou terminer */}
              {(blocData.appartementsParEtage[currentEtage-1]?.length || 0) >= blocData.appartementsAttendus[currentEtage-1] && (
                <button
                  onClick={handleNextEtage}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2"
                >
                  {currentEtage < blocData.etages ? (
                    <>Passer à l'étage suivant <FaArrowRight /></>
                  ) : (
                    <>Terminer le bloc <FaCheck /></>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddBlocModal;