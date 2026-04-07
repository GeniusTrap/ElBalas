import React, { useState, useEffect } from 'react';
import { FaTimes, FaUser, FaUsers } from 'react-icons/fa';
import { backendUrl } from '../App';

const AddLocataireSimpleModal = ({ isOpen, onClose, onSave, bloc, appartementNom }) => {
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [step, setStep] = useState(1);
  const [typeAjout, setTypeAjout] = useState('famille');
  const [locatairesExistants, setLocatairesExistants] = useState([]);
  const [typeExistant, setTypeExistant] = useState(null);
  const [familleExistante, setFamilleExistante] = useState(null);
  const [individusExistants, setIndividusExistants] = useState(null);
  
  const [nomFamille, setNomFamille] = useState('');
  const [nombreMembres, setNombreMembres] = useState('');
  const [telephoneFamille, setTelephoneFamille] = useState('');
  
  const [membres, setMembres] = useState([{ nom: '', prenom: '', age: '', telephone: '' }]);
  
  const [dateArrivee, setDateArrivee] = useState(getTodayDate());
  const [datePaiement, setDatePaiement] = useState('');
  const [typeOccupation, setTypeOccupation] = useState('location');

  const [nomFamilleError, setNomFamilleError] = useState('');
  const [shakeNomFamille, setShakeNomFamille] = useState(false);
  const [nombreMembresError, setNombreMembresError] = useState('');
  const [shakeNombreMembres, setShakeNombreMembres] = useState(false);
  const [membresError, setMembresError] = useState('');
  const [shakeMembres, setShakeMembres] = useState(false);

  useEffect(() => {
  const fetchLocatairesExistants = async () => {
    if (appartementNom && bloc) {
      try {
        const token = sessionStorage.getItem('token');
        const response = await fetch(
          `${backendUrl}/api/locataires/appartement/${bloc.nom}/${appartementNom}`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        const data = await response.json();


        
        if (data.success && data.locataires.length > 0) {
          setLocatairesExistants(data.locataires);
          setTypeExistant(data.locataires[0].type);
          
          if (data.locataires[0].type === 'famille') {
            setFamilleExistante(data.locataires[0]);
            setNomFamille(data.locataires[0].nomFamille);
            setTelephoneFamille(data.locataires[0].telephoneFamille || '');
          }
          else if (data.locataires[0].type === 'individus') {
            setIndividusExistants(data.locataires[0]);
          }
        } else {
          setLocatairesExistants([]);
          setTypeExistant(null);
          setFamilleExistante(null);
          setIndividusExistants(null);
        }
      } catch (error) {
        console.error('Erreur chargement locataires:', error);
      }
    }
  };

  if (isOpen) {
    fetchLocatairesExistants();
  }
}, [isOpen, bloc, appartementNom]);

useEffect(() => {
  if (typeExistant === 'famille') {
    setTypeAjout('famille');
  } else if (typeExistant === 'individus') {
    setTypeAjout('individus');
  }
}, [typeExistant]);

  if (!isOpen) return null;

  const resetModal = () => {
    setStep(1);
    setTypeAjout('famille');
    setNomFamille('');
    setNombreMembres(1);
    setTelephoneFamille('');
    setMembres([{ nom: '', prenom: '', age: '', telephone: '' }]);
    setDateArrivee(getTodayDate());
    setDatePaiement('');
    setTypeOccupation('location');
  };

  const handleAddMembre = () => {
    setMembres([...membres, { nom: '', prenom: '', age: '', telephone: '' }]);
  };

  const handleRemoveMembre = (index) => {
    setMembres(membres.filter((_, i) => i !== index));
  };

  const handleMembreChange = (index, field, value) => {
    const newMembres = [...membres];
    newMembres[index][field] = value;
    setMembres(newMembres);
  };

  const handleSubmit = async () => {

  
    let dataToSave;

    if (typeExistant === 'famille' && familleExistante) {
      dataToSave = {
        id: familleExistante._id,
        blocNom: bloc.nom,
        appartementNom: appartementNom,
        type: 'famille',
        nomFamille: familleExistante.nomFamille,
        nombreMembres: (familleExistante.nombreMembres || 0) + nombreMembres,
        telephoneFamille: familleExistante.telephoneFamille || null,
        membres: [],
        dateArrivee: dateArrivee,
        datePaiement: datePaiement || null,
        typeOccupation: typeOccupation,
        statutPaiement: datePaiement ? 'paye' : 'non_paye'
      };
    }

    else if (typeExistant === 'individus' && individusExistants) {
    const membresData = membres.map(m => ({
      nom: m.nom,
      prenom: m.prenom,
      age: m.age || null,
      telephone: m.telephone || null
    }));

    dataToSave = {
      id: individusExistants._id,
      blocNom: bloc.nom,
      appartementNom: appartementNom,
      type: 'individus',
      membres: [...(individusExistants.membres || []), ...membresData],
      dateArrivee: dateArrivee,
      datePaiement: datePaiement || null,
      typeOccupation: typeOccupation,
      statutPaiement: datePaiement ? 'paye' : 'non_paye'
    };
  }
    
    else if (typeAjout === 'famille') {
      dataToSave = {
        blocNom: bloc.nom,
        appartementNom: appartementNom,
        type: 'famille',
        nomFamille: nomFamille,
        nombreMembres: nombreMembres,
        telephoneFamille: telephoneFamille || null,
        membres: [],
        dateArrivee: dateArrivee,
        datePaiement: datePaiement || null,
        typeOccupation: typeOccupation,
        statutPaiement: datePaiement ? 'paye' : 'non_paye'
      };
    }

    else if (typeAjout === 'individus') {
  const membresData = membres.map(m => ({
    nom: m.nom,
    prenom: m.prenom,
    age: m.age || null,
    telephone: m.telephone || null
  }));

  dataToSave = {
    blocNom: bloc.nom,
    appartementNom: appartementNom,
    type: 'individus',
    membres: membresData,
    dateArrivee: dateArrivee,           
    datePaiement: datePaiement || null,  
    typeOccupation: typeOccupation,
    statutPaiement: datePaiement ? 'paye' : 'non_paye'        
  };
}


    await onSave(dataToSave);
    resetModal();
    onClose();
  };

  const isFormValid = () => {
  // Validation Famille existante
  if (typeExistant === 'famille') {
    if (nombreMembres === '' || nombreMembres === null || nombreMembres <= 0) {
      return false;
    }
    return true;
  }

  // Validation Individus existants
  if (typeExistant === 'individus') {
    const membresIncomplets = membres.some(m => !m.nom || !m.prenom);
    if (membresIncomplets) {
      return false;
    }
    return true;
  }
  
  // Validation Nouvelle famille
  if (typeAjout === 'famille') {
    if (!nomFamille.trim()) {
      return false;
    }
    if (nombreMembres === '' || nombreMembres === null || nombreMembres <= 0) {
      return false;
    }
    return true;
  }
  
  // Validation Nouveaux individus
  if (typeAjout === 'individus') {
    const membresIncomplets = membres.some(m => !m.nom || !m.prenom);
    if (membresIncomplets) {
      return false;
    }
    return true;
  }
  
  return false;
};

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={() => { resetModal(); onClose(); }} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-green-600 to-green-500 text-white px-6 py-4 rounded-t-2xl flex justify-between items-center sticky top-0">
          <div className="flex items-center">
            <FaUsers className="text-2xl mr-3" />
            <h2 className="text-2xl font-bold">
  {typeExistant === 'famille' ? 'Ajouter des membres' : 
   typeExistant === 'individus' ? 'Ajouter des résidents' : 
   'Ajouter des locataires'}
</h2>
          </div>
          <button onClick={() => { resetModal(); onClose(); }} className="text-white hover:text-gray-200">
            <FaTimes size={24} />
          </button>
        </div>

        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <p className="text-sm text-gray-600">
            Appartement <span className="font-semibold">{appartementNom}</span> • Bloc {bloc.nom}
          </p>
        </div>

        <div className="p-6">
          {/* ÉTAPE 1 : Choix du type (SEULEMENT si appartement vide) */}
          {step === 1 && !typeExistant && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Que voulez-vous ajouter ?
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="famille"
                    checked={typeAjout === 'famille'}
                    onChange={(e) => setTypeAjout(e.target.value)}
                    className="mr-2"
                  />
                  <span>Famille</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="individus"
                    checked={typeAjout === 'individus'}
                    onChange={(e) => setTypeAjout(e.target.value)}
                    className="mr-2"
                  />
                  <span>Individus</span>
                </label>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!typeAjout}
                className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          )}

          {/* ÉTAPE 2 : Saisie des données */}
{(step === 2 || typeExistant) && (
  <div className="space-y-4">
    {/* Afficher la famille existante si c'est le cas */}
    {typeExistant === 'famille' && familleExistante && (
      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">
          Famille existante
        </h3>
        <div className="text-sm text-gray-700">
          <p className="font-medium">Famille {familleExistante.nomFamille}</p>
          <p className="text-xs text-gray-500">
            {familleExistante.nombreMembres} personnes actuellement
          </p>
          {familleExistante.telephoneFamille && (
            <p className="text-xs text-gray-500 mt-1">
              📞 {familleExistante.telephoneFamille}
            </p>
          )}
          {/* Afficher la date d'arrivée existante pour info */}
          <p className="text-xs text-gray-500 mt-2">
            📅 Arrivée : {new Date(familleExistante.dateArrivee).toLocaleDateString('fr-FR')}
          </p>
          <p className="text-xs text-gray-500">
            {familleExistante.typeOccupation === 'location' ? '🏠 Location' : '🏠 Achat'}
          </p>
        </div>
      </div>
    )}

    {typeExistant === 'individus' && individusExistants && (
  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
    <h3 className="text-sm font-semibold text-blue-800 mb-2">
      Résidents actuels
    </h3>
    <div className="text-sm text-gray-700">
      <p className="text-xs text-gray-500 mb-2">
        {individusExistants.membres.length} personne(s) actuellement
      </p>
      <div className="space-y-1 max-h-32 overflow-y-auto">
        {individusExistants.membres.map((m, idx) => (
          <p key={idx} className="text-xs text-gray-600">
            • {m.prenom} {m.nom} {m.age && `(${m.age} ans)`}
            {m.telephone && ` - 📞 ${m.telephone}`}
          </p>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-2">
        📅 Arrivée : {new Date(individusExistants.dateArrivee).toLocaleDateString('fr-FR')}
      </p>
      <p className="text-xs text-gray-500">
        {individusExistants.typeOccupation === 'location' ? '🏠 Location' : '🏠 Achat'}
      </p>
    </div>
  </div>
)}

    {/* Interface Famille (nouvelle ou existante) */}
    {(typeExistant === 'famille' || typeAjout === 'famille') && (
      <div className="space-y-4">
        {!typeExistant && (
          <>
            <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Nom de la famille
  </label>
  <input
    type="text"
    value={nomFamille}
    onChange={(e) => {
      setNomFamille(e.target.value);
      setNomFamilleError('');
    }}
    placeholder="Ex: Gharbi, Trabelsi..."
    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
      nomFamilleError ? 'border-red-500' : 'border-gray-300'
    }`}
    required
  />
  {nomFamilleError && (
    <p className={`text-red-500 text-sm mt-1 ${shakeNomFamille ? 'animate-shake' : ''}`}>
      {nomFamilleError}
    </p>
  )}
</div>

            <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Nombre de membres
  </label>
  <input
    type="number"
    min="1"
    max="20"
    value={nombreMembres === '' ? '' : nombreMembres}
    onChange={(e) => {
      const value = e.target.value;
      if (value === '') {
        setNombreMembres('');
      } else {
        setNombreMembres(parseInt(value) || 1);
      }
      setNombreMembresError('');
    }}
    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
      nombreMembresError ? 'border-red-500' : 'border-gray-300'
    }`}
  />
  {nombreMembresError && (
    <p className={`text-red-500 text-sm mt-1 ${shakeNombreMembres ? 'animate-shake' : ''}`}>
      {nombreMembresError}
    </p>
  )}
</div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Téléphone (optionnel)
              </label>
              <input
                type="tel"
                value={telephoneFamille}
                onChange={(e) => setTelephoneFamille(e.target.value)}
                placeholder="Ex: 99 123 456"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Un seul numéro pour toute la famille
              </p>
            </div>
          </>
        )}

        {/* SI C'EST UNE FAMILLE EXISTANTE - UN SEUL CHAMP */}
        {typeExistant === 'famille' && (
          <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Nombre de nouveaux membres
  </label>
  <input
    type="number"
    min="1"
    max="20"
    value={nombreMembres === '' ? '' : nombreMembres}
    onChange={(e) => {
      const value = e.target.value;
      if (value === '') {
        setNombreMembres('');
      } else {
        setNombreMembres(parseInt(value) || 1);
      }
      setNombreMembresError('');
    }}
    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
      nombreMembresError ? 'border-red-500' : 'border-gray-300'
    }`}
  />
  {nombreMembresError && (
    <p className={`text-red-500 text-sm mt-1 ${shakeNombreMembres ? 'animate-shake' : ''}`}>
      {nombreMembresError}
    </p>
  )}
  <p className="text-xs text-gray-500 mt-1">
    Ces membres seront ajoutés sans coordonnées individuelles
  </p>
</div>
        )}
      </div>
    )}

    {/* Interface Individus (uniquement pour appartement vide) */}
    {(typeExistant === 'individus' || (!typeExistant && typeAjout === 'individus')) && (
  <div className="space-y-3">
    <div className="flex justify-between items-center">
      <label className="block text-sm font-medium text-gray-700">
        {typeExistant === 'individus' ? 'Nouveaux membres à ajouter' : 'Membres'} ({membres.length})
      </label>
      <button
        onClick={handleAddMembre}
        className="text-green-600 hover:text-green-800 text-sm flex items-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Ajouter
      </button>
    </div>

    {membres.map((membre, index) => (
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
            placeholder="Nom *"
            value={membre.nom}
            onChange={(e) => {
              handleMembreChange(index, 'nom', e.target.value);
              setMembresError('');
            }}
            className={`col-span-1 px-2 py-1 border rounded text-sm ${
              membresError && !membre.nom ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          <input
            type="text"
            placeholder="Prénom *"
            value={membre.prenom}
            onChange={(e) => {
              handleMembreChange(index, 'prenom', e.target.value);
              setMembresError('');
            }}
            className={`col-span-1 px-2 py-1 border rounded text-sm ${
              membresError && !membre.prenom ? 'border-red-500' : 'border-gray-300'
            }`}
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
    
    {membresError && (
      <p className={`text-red-500 text-sm mt-1 ${shakeMembres ? 'animate-shake' : ''}`}>
        {membresError}
      </p>
    )}
  </div>
)}

    {/* Informations complémentaires - UNIQUEMENT POUR APPARTEMENT VIDE */}
    {!typeExistant && (
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h3 className="font-medium text-gray-700 mb-3">Informations complémentaires</h3>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date d'arrivée
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateArrivee}
                onChange={(e) => setDateArrivee(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={() => setDateArrivee(getTodayDate())}
                className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm"
              >
                Aujourd'hui
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date de paiement (optionnel)
            </label>
            <input
              type="date"
              value={datePaiement}
              onChange={(e) => setDatePaiement(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>

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
        </div>
      </div>
    )}

    {/* Boutons */}
    <div className="flex gap-2 pt-4">
      {!typeExistant && (
        <button
          onClick={() => setStep(1)}
          className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-lg font-semibold"
        >
          Retour
        </button>
      )}
      <button
  onClick={handleSubmit}
  disabled={!isFormValid()}
  className={`${typeExistant ? 'flex-1' : 'flex-1'} bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold disabled:opacity-50`}
>
  {typeExistant === 'famille' ? 'Ajouter' : 
   typeExistant === 'individus' ? 'Ajouter' : 
   'Confirmer'}
</button>
    </div>
  </div>
)}
        </div>
      </div>
    </div>
  );
};

export default AddLocataireSimpleModal;