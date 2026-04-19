import React, { useState, useEffect } from 'react';
import { assets } from '../assets/assets';
import TransfertLocataireModal from './TransfertLocataireModal';
import { 
  FaUser, FaHome, FaPhone, FaCalendar, FaUsers, FaTimes,
  FaMoneyBillWave, FaMoneyBillAlt, FaCreditCard, FaTrash, FaExchangeAlt, FaExclamationTriangle 
} from 'react-icons/fa';
import { backendUrl } from '../App';
import { useNotifications } from '../contexts/NotificationContext';
import AddLocataireSimpleModal from './AddLocataireSimpleModal';

const useTempsRestant = (dateArrivee, typeOccupation) => {
  const [tempsRestant, setTempsRestant] = useState({
    jours: 0,
    heures: 0,
    minutes: 0,
    secondes: 0,
    totalSeconds: 0
  });

  useEffect(() => {
    const calculerTempsRestant = () => {
      if (!dateArrivee) return;

      if (typeOccupation === 'achat') {
        setTempsRestant({ jours: 0, heures: 0, minutes: 0, secondes: 0, totalSeconds: 0 });
        return;
      }

      const maintenant = new Date();
      const arrivee = new Date(dateArrivee);
      arrivee.setHours(0, 0, 0, 0);
      
      // ✅ Calculer la période actuelle
      const joursDepuisArrivee = Math.floor((maintenant - arrivee) / (1000 * 60 * 60 * 24));
      const numeroPeriode = Math.floor(joursDepuisArrivee / 30) + 1;
      
      // ✅ Début de la période actuelle
      const debutPeriode = new Date(arrivee);
      debutPeriode.setDate(debutPeriode.getDate() + ((numeroPeriode - 1) * 30));
      debutPeriode.setHours(0, 0, 0, 0);
      
      // ✅ Temps écoulé depuis le début de la période (toujours)
      const diffSeconds = Math.max(0, Math.floor((maintenant - debutPeriode) / 1000));
      
      const jours = Math.floor(diffSeconds / (3600 * 24));
      const heures = Math.floor((diffSeconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((diffSeconds % 3600) / 60);
      const secondes = diffSeconds % 60;

      setTempsRestant({ jours, heures, minutes, secondes, totalSeconds: diffSeconds });
    };

    calculerTempsRestant();
    const interval = setInterval(calculerTempsRestant, 1000);

    return () => clearInterval(interval);
  }, [dateArrivee, typeOccupation]);

  return tempsRestant;
};

const CompteurPaiement = ({ dateArrivee, typeOccupation, paiements = [], periodeEnCours }) => {
  if (typeOccupation === 'achat') {
    return null;
  }
  const tempsRestant = useTempsRestant(dateArrivee, typeOccupation);
  
  if (!dateArrivee) return null;

  // ✅ Vérifier si la période en cours est payée
  const periodePayee = paiements.some(p => p.periode === periodeEnCours);
  
  // ✅ Calculer le temps restant jusqu'à la fin de la période (pour "Prochain paiement")
  const tempsRestantJusquaFin = () => {
    const maintenant = new Date();
    const arrivee = new Date(dateArrivee);
    arrivee.setHours(0, 0, 0, 0);
    
    const joursDepuisArrivee = Math.floor((maintenant - arrivee) / (1000 * 60 * 60 * 24));
    const numeroPeriode = Math.floor(joursDepuisArrivee / 30) + 1;
    
    const debutPeriode = new Date(arrivee);
    debutPeriode.setDate(debutPeriode.getDate() + ((numeroPeriode - 1) * 30));
    debutPeriode.setHours(0, 0, 0, 0);
    
    const finPeriode = new Date(debutPeriode);
    finPeriode.setDate(finPeriode.getDate() + 30);
    finPeriode.setHours(23, 59, 59, 999);
    
    const diffSeconds = Math.max(0, Math.floor((finPeriode - maintenant) / 1000));
    
    return {
      jours: Math.floor(diffSeconds / (3600 * 24)),
      heures: Math.floor((diffSeconds % (3600 * 24)) / 3600),
      minutes: Math.floor((diffSeconds % 3600) / 60),
      secondes: diffSeconds % 60,
      totalSeconds: diffSeconds
    };
  };

  // ✅ Calculer la période actuelle (pour l'affichage)
  const arrivee = new Date(dateArrivee);
  const maintenant = new Date();
  
  const arriveeUTC = Date.UTC(
    arrivee.getUTCFullYear(),
    arrivee.getUTCMonth(),
    arrivee.getUTCDate()
  );
  
  const maintenantUTC = Date.UTC(
    maintenant.getUTCFullYear(),
    maintenant.getUTCMonth(),
    maintenant.getUTCDate(),
    maintenant.getUTCHours(),
    maintenant.getUTCMinutes(),
    maintenant.getUTCSeconds()
  );

  const joursDepuisArrivee = Math.floor((maintenantUTC - arriveeUTC) / (1000 * 60 * 60 * 24));
  const numeroPeriode = Math.max(1, Math.floor(joursDepuisArrivee / 30) + 1);

  // ✅ Déterminer le texte et la couleur
  let texte = '';
  let color = '';
  let affichageTemps = null;
  
  if (periodePayee) {
    // Période payée : afficher "Prochain paiement dans"
    texte = 'Prochain paiement dans';
    color = 'text-green-600';
    const temps = tempsRestantJusquaFin();
    affichageTemps = (
      <div className="flex gap-1 text-sm">
        {temps.totalSeconds > 0 ? (
          <>
            <span className="font-mono">{temps.jours}j</span>
            <span className="font-mono">{String(temps.heures).padStart(2, '0')}h</span>
            <span className="font-mono">{String(temps.minutes).padStart(2, '0')}m</span>
            <span className="font-mono">{String(temps.secondes).padStart(2, '0')}s</span>
          </>
        ) : (
          <span className="text-green-600">Paiement dû</span>
        )}
      </div>
    );
  } else {
    // Période non payée : afficher "Retard de paiement"
    texte = 'Retard de paiement';
    color = 'text-red-600';
    affichageTemps = (
      <div className="flex gap-1 text-sm">
        {tempsRestant.totalSeconds > 0 ? (
          <>
            <span className="font-mono">{tempsRestant.jours}j</span>
            <span className="font-mono">{String(tempsRestant.heures).padStart(2, '0')}h</span>
            <span className="font-mono">{String(tempsRestant.minutes).padStart(2, '0')}m</span>
            <span className="font-mono">{String(tempsRestant.secondes).padStart(2, '0')}s</span>
          </>
        ) : (
          <span className="text-red-600">En retard</span>
        )}
      </div>
    );
  }

  return (
    <div className="mt-2 p-3 bg-gray-100 rounded-lg">
      <p className="text-xs text-gray-600 mb-1">Période #{numeroPeriode}</p>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-semibold ${color}`}>
          {texte} :
        </span>
        {affichageTemps}
      </div>
    </div>
  );
};


const HistoriquePaiement = ({ 
  dateArrivee, 
  dernierPaiement, 
  typeOccupation, 
  paiements = [],  
  statutPaiement,
  onMarquerPaye     
}) => {
  const [periodesImpayees, setPeriodesImpayees] = useState([]);
  
  useEffect(() => {
    if (!dateArrivee || typeOccupation === 'achat') return;
    
    const calculerPeriodesImpayees = () => {
      const maintenant = new Date();
      const arrivee = new Date(dateArrivee);
      arrivee.setHours(0, 0, 0, 0);
      maintenant.setHours(0, 0, 0, 0);
      
      const joursDepuisArrivee = Math.floor((maintenant - arrivee) / (1000 * 60 * 60 * 24));
      const periodeActuelle = Math.floor(joursDepuisArrivee / 30) + 1;
      
      // Récupérer les périodes déjà payées
      const periodesPayees = paiements.map(p => p.periode);
      
      const periodes = [];
      
      for (let periode = 1; periode < periodeActuelle; periode++) {
        if (!periodesPayees.includes(periode)) {
          const debutPeriode = new Date(arrivee);
          debutPeriode.setDate(debutPeriode.getDate() + ((periode - 1) * 30));
          debutPeriode.setHours(0, 0, 0, 0);
          
          const finPeriode = new Date(debutPeriode);
          finPeriode.setDate(finPeriode.getDate() + 30);
          finPeriode.setHours(23, 59, 59, 999);
          
          periodes.push({
            numero: periode,
            debutPeriode,
            finPeriode
          });
        }
      }
      
      setPeriodesImpayees(periodes);
    };
    
    calculerPeriodesImpayees();
    const interval = setInterval(calculerPeriodesImpayees, 1000);
    return () => clearInterval(interval);
  }, [dateArrivee, paiements, typeOccupation]);
  
  if (typeOccupation === 'achat') {
  const estPaye = statutPaiement === 'paye';
  return (
    <div className="mt-2 p-3 bg-gray-100 rounded-lg">
      <p className={`text-sm font-medium ${estPaye ? 'text-green-600' : 'text-red-600'}`}>
        {estPaye ? '✓ Achat - Payé' : '✗ Achat - Non payé'}
      </p>
    </div>
  );
}
  
  if (periodesImpayees.length === 0) {
    return null;
  }
  
  return (
    <div className="mt-3 space-y-2">
      {periodesImpayees.map((periode) => (
        <div 
          key={periode.numero} 
          className="p-3 rounded-lg border-l-4 border-red-500 bg-red-50"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-200 text-red-700">
                Période #{periode.numero}
              </span>
              <span className="text-xs text-gray-500">
                {periode.debutPeriode.toLocaleDateString('fr-FR')} → {periode.finPeriode.toLocaleDateString('fr-FR')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-red-600">
                ✗ Non payé
              </span>
              {/* ✅ Bouton pour payer UNIQUEMENT cette période */}
              <button
                onClick={() => onMarquerPaye(periode.numero)}
                className="px-2 py-1 text-xs font-semibold bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors"
              >
                Marquer payé
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const AppartementDetails = ({ bloc, appartementNom, onClose, residenceData, onSaveLocataires }) => {
  const { addNotification } = useNotifications();
  const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
  const [locataires, setLocataires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appartementStatut, setAppartementStatut] = useState('libre');
  const [paiementGlobal, setPaiementGlobal] = useState({ 
    estPaye: false, 
    datePaiement: null,
    montant: null 
  });
  const [showPaiementModal, setShowPaiementModal] = useState(false);
  const [datePaiementManuelle, setDatePaiementManuelle] = useState(getTodayDate());
  const [showTransfertModal, setShowTransfertModal] = useState(false);
  const [selectedGroupeForTransfert, setSelectedGroupeForTransfert] = useState(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [selectedGroupeForDelete, setSelectedGroupeForDelete] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleOpenTransfertModal = (groupe) => {
  setSelectedGroupeForTransfert(groupe);
  setShowTransfertModal(true);
};

  const handleMarquerPeriodePaye = async (periodeNumero) => {
  
  try {
    const token = sessionStorage.getItem('token');
    const datePaiement = getTodayDate();
    
    for (const groupe of locataires) {
      const paiementsExistants = groupe.paiements || [];
      
      if (paiementsExistants.some(p => p.periode === periodeNumero)) {
        continue;
      }
      
      const nouveauxPaiements = [
        ...paiementsExistants,
        {
          periode: periodeNumero,
          datePaiement: datePaiement,
          estPaye: true
        }
      ];
      
      
      const response = await fetch(`${backendUrl}/api/locataires/${groupe._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          paiements: nouveauxPaiements,
          dernierPaiement: datePaiement
        })
      });
      
      const result = await response.json();
    }

    const paiementData = {
  type: locataires[0]?.type || 'famille',
  nomFamille: locataires[0]?.nomFamille,
  nombreMembres: locataires.reduce((sum, g) => sum + (g.nombreMembres || g.membres?.length || 0), 0),
  nomMembre: locataires[0]?.membres?.length === 1 ? `${locataires[0].membres[0].prenom} ${locataires[0].membres[0].nom}` : null,
  bloc: bloc.nom,
  appartement: appartementNom,
  typeOccupation: locataires[0]?.typeOccupation || 'location',
  datePaiement: datePaiement,
  dateArrivee: locataires[0]?.dateArrivee,
  montant: 0,
  periode: periodeNumero
};
addNotification('paiement', paiementData);
    
    // Recharger les données
    const response = await fetch(
      `${backendUrl}/api/locataires/appartement/${bloc.nom}/${appartementNom}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    const data = await response.json();
    
    
    if (data.success) {
      setLocataires(data.locataires);
      
      // Recalculer paiementGlobal
      const maintenant = new Date();
      maintenant.setHours(0, 0, 0, 0);
      
      let toutesPeriodesPayees = true;
      
      for (const groupe of data.locataires) {
        const dateArrivee = new Date(groupe.dateArrivee);
        dateArrivee.setHours(0, 0, 0, 0);
        
        const joursDepuisArrivee = Math.floor((maintenant - dateArrivee) / (1000 * 60 * 60 * 24));
        const periodeActuelle = Math.floor(joursDepuisArrivee / 30) + 1;
        
        const paiements = groupe.paiements || [];
        const periodesPayees = paiements.map(p => p.periode);
        
        
        for (let periode = 1; periode <= periodeActuelle; periode++) {
          const estPayee = periodesPayees.includes(periode);
          if (!estPayee) {
            toutesPeriodesPayees = false;
          }
        }
      }
      
      setPaiementGlobal({
        estPaye: toutesPeriodesPayees,
        datePaiement: null,
        montant: null
      });
    }
    
  } catch (error) {
    console.error('❌ [handleMarquerPeriodePaye] Erreur:', error);
  }
};

  useEffect(() => {
  const fetchLocatairesForAppartement = async () => {
    try {
      const token = sessionStorage.getItem('token');
      
      const response = await fetch(
        `${backendUrl}/api/locataires/appartement/${bloc.nom}/${appartementNom}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await response.json();
      
      
      if (data.success) {
        setLocataires(data.locataires);
        setAppartementStatut(data.locataires.length > 0 ? 'occupé' : 'libre');
        
        const maintenant = new Date();
        maintenant.setHours(0, 0, 0, 0);
        
        let toutesPeriodesPayees = true;

for (const groupe of data.locataires) {
  const dateArrivee = new Date(groupe.dateArrivee);
  dateArrivee.setHours(0, 0, 0, 0);
  
  const maintenant = new Date();
  maintenant.setHours(0, 0, 0, 0);
  
  const joursDepuisArrivee = Math.floor((maintenant - dateArrivee) / (1000 * 60 * 60 * 24));
  const periodeActuelle = Math.floor(joursDepuisArrivee / 30) + 1;
  
  const paiements = groupe.paiements || [];
  const periodesPayees = paiements.map(p => p.periode);
  
  
  const estPayee = periodesPayees.includes(periodeActuelle);
  
  
  if (!estPayee) {
    toutesPeriodesPayees = false;
  }
}
        
        
        setPaiementGlobal({
          estPaye: toutesPeriodesPayees,
          datePaiement: null,
          montant: null
        });
      }
    } catch (error) {
      console.error('❌ [fetch] Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  fetchLocatairesForAppartement();
  const interval = setInterval(() => {
    fetchLocatairesForAppartement();
  }, 30000);
  
  return () => clearInterval(interval);
}, [bloc, appartementNom, addNotification]);

const handleTransfertSuccess = (transfertData) => {
  addNotification('transfert', transfertData);

  window.dispatchEvent(new Event('locataires-updated'));
  
  // Rafraîchir les données
  const fetchLocataires = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(
        `${backendUrl}/api/locataires/appartement/${bloc.nom}/${appartementNom}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      const data = await response.json();
      
      if (data.success) {
        setLocataires(data.locataires);
        setAppartementStatut(data.locataires.length > 0 ? 'occupé' : 'libre');
      }
    } catch (error) {
      console.error('Erreur rechargement:', error);
    }
  };
  
  fetchLocataires();
  setShowTransfertModal(false);
  setSelectedGroupeForTransfert(null);
};

  const handleAddSuccess = (data) => {

    onSaveLocataires(data);
  
  const fetchLocataires = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(
        `${backendUrl}/api/locataires/appartement/${bloc.nom}/${appartementNom}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      const data = await response.json();

      
      if (data.success) {
        setLocataires(data.locataires);
        setAppartementStatut(data.locataires.length > 0 ? 'occupé' : 'libre');
        
        const maintenant = new Date();
maintenant.setHours(0, 0, 0, 0);

let toutesPeriodesPayees = true;

for (const groupe of data.locataires) {
  const dateArrivee = new Date(groupe.dateArrivee);
  dateArrivee.setHours(0, 0, 0, 0);
  
  const joursDepuisArrivee = Math.floor((maintenant - dateArrivee) / (1000 * 60 * 60 * 24));
  const periodeActuelle = Math.floor(joursDepuisArrivee / 30) + 1;
  
  const paiements = groupe.paiements || [];
  const periodesPayees = paiements.map(p => p.periode);

  
  for (let periode = 1; periode <= periodeActuelle; periode++) {
            const estPayee = periodesPayees.includes(periode);
            if (!estPayee) {
              toutesPeriodesPayees = false;
            }
          }
        }


setPaiementGlobal({
  estPaye: toutesPeriodesPayees,
  datePaiement: null,
  montant: null
});
      }
    } catch (error) {
      console.error('Erreur rechargement après ajout:', error);
    }
  };
  
  fetchLocataires();
  setShowAddModal(false);
};


  const handleDeleteDirect = async (groupe) => {

  try {
    const token = sessionStorage.getItem('token');
    
    // Préparer les données pour la notification
    const suppressionData = {
      type: groupe.type,
      bloc: bloc.nom,
      appartement: appartementNom,
      typeOccupation: 'location'
    };

    if (groupe.type === 'famille') {
      suppressionData.nomFamille = groupe.nomFamille;
      suppressionData.nombreMembres = groupe.nombreMembres;
      
      // Supprimer la famille
      await fetch(`${backendUrl}/api/locataires/${groupe._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } else {
      suppressionData.nombreMembres = groupe.membres.length;
      if (groupe.membres.length === 1) {
        const membre = groupe.membres[0];
        suppressionData.nomMembre = `${membre.prenom} ${membre.nom}`;
      }
      
      // Supprimer tous les individus
      await fetch(`${backendUrl}/api/locataires/${groupe._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    }

    // Notification
    addNotification('suppression', suppressionData);

    // Rafraîchir les données
    const response = await fetch(
      `${backendUrl}/api/locataires/appartement/${bloc.nom}/${appartementNom}`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    const data = await response.json();
    
    if (data.success) {
      setLocataires(data.locataires);
      setAppartementStatut(data.locataires.length > 0 ? 'occupé' : 'libre');
    }

  } catch (error) {
    console.error('Erreur suppression:', error);
  }
};
  

  const handleMarquerPaye = async () => {
  
  try {
    const token = sessionStorage.getItem('token');
    
    const updatePromises = locataires.map(groupe => {
      const dateArrivee = new Date(groupe.dateArrivee);
      const maintenant = new Date();
      const joursDepuisArrivee = Math.floor((maintenant - dateArrivee) / (1000 * 60 * 60 * 24));
      const periodeEnCours = Math.floor(joursDepuisArrivee / 30) + 1;
      
      
      const paiementsExistants = groupe.paiements || [];
      
      if (paiementsExistants.some(p => p.periode === periodeEnCours)) {
        return Promise.resolve();
      }
      
      const nouveauxPaiements = [
        ...paiementsExistants,
        {
          periode: periodeEnCours,
          datePaiement: datePaiementManuelle,
          estPaye: true
        }
      ];
      
      
      return fetch(`${backendUrl}/api/locataires/${groupe._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          paiements: nouveauxPaiements,
          datePaiement: datePaiementManuelle,
          dernierPaiement: datePaiementManuelle,
          statutPaiement: 'paye'
        })
      });
    });

    await Promise.all(updatePromises);

    const paiementData = {
  type: locataires[0]?.type || 'famille',
  nomFamille: locataires[0]?.nomFamille,
  nombreMembres: locataires.reduce((sum, g) => sum + (g.nombreMembres || g.membres?.length || 0), 0),
  nomMembre: locataires[0]?.membres?.length === 1 ? `${locataires[0].membres[0].prenom} ${locataires[0].membres[0].nom}` : null,
  bloc: bloc.nom,
  appartement: appartementNom,
  typeOccupation: locataires[0]?.typeOccupation || 'location',
  datePaiement: datePaiementManuelle,
  dateArrivee: locataires[0]?.dateArrivee,
  montant: 0
};
addNotification('paiement', paiementData);

    // Recharger les données
    const response = await fetch(
      `${backendUrl}/api/locataires/appartement/${bloc.nom}/${appartementNom}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    const data = await response.json();
    
    
    if (data.success) {
      setLocataires(data.locataires);
      
      const maintenant = new Date();
      maintenant.setHours(0, 0, 0, 0);
      
      let toutesPeriodesPayees = true;
      
      for (const groupe of data.locataires) {
        const dateArrivee = new Date(groupe.dateArrivee);
        dateArrivee.setHours(0, 0, 0, 0);
        
        const joursDepuisArrivee = Math.floor((maintenant - dateArrivee) / (1000 * 60 * 60 * 24));
        const periodeActuelle = Math.floor(joursDepuisArrivee / 30) + 1;
        
        const paiements = groupe.paiements || [];
        const periodesPayees = paiements.map(p => p.periode);
        
        
        for (let periode = 1; periode <= periodeActuelle; periode++) {
          const estPayee = periodesPayees.includes(periode);
          if (!estPayee) {
            toutesPeriodesPayees = false;
          }
        }
      }
      

      setPaiementGlobal({
        estPaye: toutesPeriodesPayees,
        datePaiement: null,
        montant: null
      });
    }
    
  } catch (error) {
    console.error('❌ [handleMarquerPaye] Erreur:', error);
  }
};

  const getEtageFromAppartement = () => {
    if (appartementNom.includes('-RDC')) return 'Rez-de-chaussée';
    const match = appartementNom.match(/\d+/);
    return match ? `Étage ${match[0]}` : 'Étage inconnu';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      <div 
        className="relative bg-white transform rotate-[-1deg] hover:rotate-0 transition-all duration-300 shadow-2xl rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: '5px 5px 15px rgba(0,0,0,0.3)' }}
      >
        <div className="flex justify-center -mt-4 mb-2 sticky top-0 z-10">
          <div className="w-8 h-8 bg-gray-400 rounded-full shadow-inner border-2 border-gray-500" />
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-20"
        >
          <FaTimes size={20} />
        </button>

        <div className="text-center px-6 pt-2 pb-4 border-b border-black border-opacity-10">
  <h1 className="text-4xl font-bold text-gray-800 mb-1">
    {appartementNom}
  </h1>
  <p className="text-gray-600">
    Bloc {bloc.nom} • {getEtageFromAppartement()}
  </p>
  
  <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
    {/* ✅ NOUVEAU : Badge Location/Achat */}
    {appartementStatut === 'occupé' && locataires.length > 0 && (
      <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
        locataires[0].typeOccupation === 'location' 
          ? 'bg-purple-100 text-purple-700 border border-purple-300' 
          : 'bg-orange-100 text-orange-700 border border-orange-300'
      }`}>
        {locataires[0].typeOccupation === 'location' ? '📍 Location' : '🏠 Achat'}
      </span>
    )}

    <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
      appartementStatut === 'occupé' 
        ? 'bg-green-500 text-white' 
        : 'bg-blue-500 text-white'
    }`}>
      {appartementStatut === 'occupé' ? 'Occupé' : 'Libre'}
    </span>

    <button
      onClick={() => setShowAddModal(true)}
      className="px-4 py-2 rounded-full text-sm font-semibold bg-green-500 hover:bg-green-600 text-white flex items-center gap-1 transition-colors"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
      Ajouter
    </button>
    
    {appartementStatut === 'occupé' && (
      <>
        <span className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-1 ${
          paiementGlobal.estPaye 
            ? 'bg-green-100 text-green-700 border border-green-300' 
            : 'bg-yellow-100 text-yellow-700 border border-yellow-300'
        }`}>
          {paiementGlobal.estPaye ? (
            <>
              <FaMoneyBillWave size={14} />
              <span>Payé</span>
            </>
          ) : (
            <>
              <FaMoneyBillAlt size={14} />
              <span>Non payé</span>
            </>
          )}
        </span>
        
        {/* ✅ Bouton pour marquer comme payé */}
        {(() => {
  // Vérifier si la période en cours est payée
  const maintenant = new Date();
  let periodeEnCoursPayee = false;
  
  for (const groupe of locataires) {
    const dateArrivee = new Date(groupe.dateArrivee);
    dateArrivee.setHours(0, 0, 0, 0);
    const joursDepuisArrivee = Math.floor((maintenant - dateArrivee) / (1000 * 60 * 60 * 24));
    const periodeEnCours = Math.floor(joursDepuisArrivee / 30) + 1;
    
    const paiements = groupe.paiements || [];
    if (paiements.some(p => p.periode === periodeEnCours)) {
      periodeEnCoursPayee = true;
      break;
    }
  }
  
  if (!periodeEnCoursPayee) {
    return (
      <button
        onClick={() => setShowPaiementModal(true)}
        className="px-4 py-2 rounded-full text-sm font-semibold bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-1 transition-colors"
      >
        <FaCreditCard size={14} />
        <span>Marquer comme payé</span>
      </button>
    );
  }
  return null;
})()}
      </>
    )}
  </div>
</div>

        {showPaiementModal && (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/50" onClick={() => setShowPaiementModal(false)} />
    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Enregistrer un paiement</h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Date du paiement
        </label>
        <div className="flex gap-2">
          <input
            type="date"
            value={datePaiementManuelle}
            onChange={(e) => setDatePaiementManuelle(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => setDatePaiementManuelle(getTodayDate())}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm whitespace-nowrap"
          >
            Aujourd'hui
          </button>
        </div>
      </div>
      
      <div className="flex gap-2">
        <button
  onClick={async () => {
    await handleMarquerPaye();
    setShowPaiementModal(false);
  }}
  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold"
>
  Confirmer
</button>
        <button
          onClick={() => setShowPaiementModal(false)}
          className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-lg font-semibold"
        >
          Annuler
        </button>
      </div>
    </div>
  </div>
)}

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto" />
            </div>
          ) : locataires.length === 0 ? (
            <div className="text-center py-8">
              <FaHome className="text-6xl text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Appartement vide</h2>
              <p className="text-gray-500">Aucun locataire n'est enregistré.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {locataires.map((groupe) => (
                <div key={groupe._id} className="bg-gray-50 rounded-lg p-4">
                  {groupe.type === 'famille' ? (
  <div>
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
  <div className="flex items-center gap-2">
    <FaUsers className="text-blue-600" />
    <h2 className="font-semibold text-gray-800">
      Famille {groupe.nomFamille}
    </h2>
  </div>
  <div className="flex flex-wrap items-center gap-2">
    <span className="text-xs bg-gray-200 px-2 py-1 rounded-full flex items-center gap-1">
      <FaCalendar size={10} className="text-gray-500" />
      {new Date(groupe.dateArrivee).toLocaleDateString('fr-FR')}
    </span>
    <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">
      {groupe.nombreMembres} pers.
    </span>
    <div className="flex items-center gap-1">
      <button
        onClick={() => {
          setSelectedGroupeForDelete(groupe);
          setShowDeleteConfirmModal(true);
        }}
        className="p-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-full transition-colors"
        title="Supprimer"
      >
        <FaTrash size={12} />
      </button>
      <button
        onClick={() => handleOpenTransfertModal(groupe)}
        className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full transition-colors"
        title="Transférer"
      >
        <FaExchangeAlt size={12} />
      </button>
    </div>
  </div>
</div>
    
    {groupe.telephoneFamille && (
      <div className="mt-3 flex items-center gap-2 text-gray-600">
        <FaPhone className="text-blue-600" size={12} />
        <span className="text-sm">{groupe.telephoneFamille}</span>
      </div>
    )}
    <HistoriquePaiement 
  dateArrivee={groupe.dateArrivee}
  dernierPaiement={groupe.dernierPaiement}
  typeOccupation={groupe.typeOccupation}
  paiements={groupe.paiements || []}
  statutPaiement={groupe.statutPaiement}
  onMarquerPaye={handleMarquerPeriodePaye}
/>
    <CompteurPaiement 
  dateArrivee={groupe.dateArrivee}
  typeOccupation={groupe.typeOccupation}
  paiements={groupe.paiements || []}
  periodeEnCours={Math.floor((new Date() - new Date(groupe.dateArrivee)) / (1000 * 60 * 60 * 24) / 30) + 1}
/>
  </div>
                  ) : (
                    <div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-gray-200">
  <div className="flex items-center gap-2">
    <FaUsers className="text-blue-600" />
    <h2 className="font-semibold text-gray-800">Résidents</h2>
  </div>
  <div className="flex flex-wrap items-center gap-2">
    <span className="text-xs bg-gray-200 px-2 py-1 rounded-full flex items-center gap-1">
      <FaCalendar size={10} className="text-gray-500" />
      {new Date(groupe.dateArrivee).toLocaleDateString('fr-FR')}
    </span>
    <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">
      {groupe.membres.length} pers.
    </span>
    <div className="flex items-center gap-1">
      <button
        onClick={() => handleDeleteDirect(groupe)}
        className="p-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-full transition-colors"
        title="Supprimer"
      >
        <FaTrash size={12} />
      </button>
      <button
        onClick={() => handleOpenTransfertModal(groupe)}
        className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full transition-colors"
        title="Transférer"
      >
        <FaExchangeAlt size={12} />
      </button>
    </div>
  </div>
</div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {groupe.membres.map((membre, idx) => (
                          <div key={idx} className="bg-white rounded-lg p-3 border border-gray-100">
                            <div className="flex items-start gap-3">
                              <div className="bg-blue-100 p-2 rounded-full">
                                <FaUser className="text-blue-600" size={14} />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-gray-800">
                                  {membre.prenom} {membre.nom}
                                </p>
                                <div className="mt-1 space-y-1">
                                  {membre.age && (
                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                      <FaCalendar size={10} />
                                      {membre.age} ans
                                    </p>
                                  )}
                                  {membre.telephone && (
                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                      <FaPhone size={10} />
                                      {membre.telephone}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <HistoriquePaiement 
  dateArrivee={groupe.dateArrivee}
  dernierPaiement={groupe.dernierPaiement}
  typeOccupation={groupe.typeOccupation}
  paiements={groupe.paiements || []}
  statutPaiement={groupe.statutPaiement}
  onMarquerPaye={handleMarquerPeriodePaye}
/>
                      <CompteurPaiement 
  dateArrivee={groupe.dateArrivee}
  typeOccupation={groupe.typeOccupation}
  paiements={groupe.paiements || []}
  periodeEnCours={Math.floor((new Date() - new Date(groupe.dateArrivee)) / (1000 * 60 * 60 * 24) / 30) + 1}
/>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <TransfertLocataireModal
  isOpen={showTransfertModal}
  onClose={() => {
    setShowTransfertModal(false);
    setSelectedGroupeForTransfert(null);
  }}
  onTransfert={handleTransfertSuccess}
  blocs={residenceData?.blocs || []}  // ← CORRIGÉ : Tous les blocs
  appartementsParBloc={(() => {
    // Construire l'objet des appartements par bloc
    const appartMap = {};
    residenceData?.blocs?.forEach(b => {
      appartMap[b.nom] = b.appartementsParEtage?.flat() || [];
    });
    return appartMap;
  })()}
  locatairesData={(() => {
    // Construire l'objet des données des locataires
    const dataMap = {};
    residenceData?.blocs?.forEach(b => {
      b.appartementsParEtage?.flat().forEach(appart => {
        dataMap[appart] = 0; // Valeur par défaut
      });
    });
    // Mettre à jour avec les vrais locataires si disponibles
    if (locataires.length > 0) {
      dataMap[appartementNom] = locataires.length;
    }
    return dataMap;
  })()}
  preselectedSource={{
    bloc: bloc.nom,
    appartement: appartementNom,
    groupe: selectedGroupeForTransfert
  }}
/>
<AddLocataireSimpleModal
  isOpen={showAddModal}
  onClose={() => setShowAddModal(false)}
  onSave={handleAddSuccess}
  bloc={bloc}
  appartementNom={appartementNom}
  locatairesExistants={locataires}
  typeExistant={locataires.length > 0 ? locataires[0].type : null}
/>

{showDeleteConfirmModal && (
  <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteConfirmModal(false)} />
    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6 transform animate-fadeIn">
      {/* Icône d'avertissement */}
      <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <FaExclamationTriangle className="text-red-600 text-3xl" />
      </div>
      
      {/* Titre */}
      <h3 className="text-xl font-bold text-gray-800 text-center mb-2">
        Confirmer la suppression
      </h3>
      
      {/* Message */}
      <p className="text-gray-600 text-center mb-6">
        {selectedGroupeForDelete?.type === 'famille' 
          ? `Voulez-vous vraiment supprimer la famille ${selectedGroupeForDelete.nomFamille} (${selectedGroupeForDelete.nombreMembres} personnes) ?`
          : `Voulez-vous vraiment supprimer tous les résidents (${selectedGroupeForDelete?.membres?.length || 0} personnes) ?`
        }
      </p>
      
      <p className="text-sm text-gray-500 text-center mb-6">
        Cette action est irréversible.
      </p>
      
      {/* Boutons */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowDeleteConfirmModal(false)}
          className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-colors"
        >
          Annuler
        </button>
        <button
          onClick={() => {
            handleDeleteDirect(selectedGroupeForDelete);
            setShowDeleteConfirmModal(false);
          }}
          className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <FaTrash size={16} />
          Supprimer
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default AppartementDetails;