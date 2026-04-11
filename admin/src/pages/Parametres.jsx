import React, { useState, useEffect } from 'react';
import { 
  FaUser, FaEnvelope, FaPhone, FaLock, FaBuilding, FaDoorOpen, 
  FaTrash, FaSave, FaKey, FaExclamationTriangle, FaEdit, FaPlus, 
  FaTimes, FaChevronDown, FaChevronUp, FaHome, FaCheck, FaEye, FaEyeSlash
} from 'react-icons/fa';
import { backendUrl } from '../App';
import AddBlocModal from '../components/AddBlocModal';
import ReactCountryFlag from "react-country-flag";

const Parametres = () => {
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    role: '',
    phone: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [residenceSuccess, setResidenceSuccess] = useState('');
  const [showAddBlocModal, setShowAddBlocModal] = useState(false);
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [currentPasswordError, setCurrentPasswordError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [shakeCurrent, setShakeCurrent] = useState(false);
  const [shakeNew, setShakeNew] = useState(false);
  const [shakeConfirm, setShakeConfirm] = useState(false);
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  
  const [residenceData, setResidenceData] = useState(null);
  const [showResidenceModal, setShowResidenceModal] = useState(false);
  const [expandedBloc, setExpandedBloc] = useState(null);
  const [editingBloc, setEditingBloc] = useState(null);
  const [editingAppart, setEditingAppart] = useState(null);
  const [newAppartName, setNewAppartName] = useState('');
  const [selectedBlocForAppart, setSelectedBlocForAppart] = useState(null);
  const [showAddAppart, setShowAddAppart] = useState(false);
  const [showEtageConfig, setShowEtageConfig] = useState(false);
  const [selectedBlocForEtage, setSelectedBlocForEtage] = useState(null);
  const [etageAppartCount, setEtageAppartCount] = useState();
  const [selectedEtageForAppart, setSelectedEtageForAppart] = useState(0);
  
  const [editedResidenceName, setEditedResidenceName] = useState('');
  const [isEditingResidenceName, setIsEditingResidenceName] = useState(false);
  const [originalResidenceName, setOriginalResidenceName] = useState('');

  const [editedBlocName, setEditedBlocName] = useState('');
  const [isEditingBlocName, setIsEditingBlocName] = useState(false);
  const [originalBlocName, setOriginalBlocName] = useState('');

  const [highlightEtage, setHighlightEtage] = useState(false);

  const [showDeleteBlocConfirm, setShowDeleteBlocConfirm] = useState(false);
  const [showDeleteAppartConfirm, setShowDeleteAppartConfirm] = useState(false);
  const [blocToDelete, setBlocToDelete] = useState(null);
  const [appartToDelete, setAppartToDelete] = useState(null);
  const [appartDeleteInfo, setAppartDeleteInfo] = useState({ blocIndex: null, etageIndex: null, appartIndex: null });

  const [editedAppartName, setEditedAppartName] = useState('');
  const [isEditingAppartName, setIsEditingAppartName] = useState(false);
  const [originalAppartName, setOriginalAppartName] = useState('');
  const [editingAppartInfo, setEditingAppartInfo] = useState({ blocIndex: null, etageIndex: null, appartIndex: null });

  const [editedName, setEditedName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [originalName, setOriginalName] = useState('');


  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [etageError, setEtageError] = useState('');
  const [shakeEtage, setShakeEtage] = useState(false);

  const [phoneError, setPhoneError] = useState('');
  const [shakePhone, setShakePhone] = useState(false);
  const phonePrefixes = [
  { code: '+216', countryCode: 'TN', name: 'Tunisie' },
  { code: '+33', countryCode: 'FR', name: 'France' },
  { code: '+213', countryCode: 'DZ', name: 'Algérie' },
  { code: '+212', countryCode: 'MA', name: 'Maroc' },
  { code: '+1', countryCode: 'US', name: 'USA/Canada' },
  { code: '+44', countryCode: 'GB', name: 'Royaume-Uni' },
  { code: '+49', countryCode: 'DE', name: 'Allemagne' },
  { code: '+32', countryCode: 'BE', name: 'Belgique' },
  { code: '+41', countryCode: 'CH', name: 'Suisse' },
  { code: '+39', countryCode: 'IT', name: 'Italie' },
  { code: '+34', countryCode: 'ES', name: 'Espagne' },
  { code: '+90', countryCode: 'TR', name: 'Turquie' },
  { code: '+20', countryCode: 'EG', name: 'Égypte' },
  { code: '+966', countryCode: 'SA', name: 'Arabie Saoudite' },
  { code: '+971', countryCode: 'AE', name: 'Émirats Arabes Unis' },
];

const getCountryFromPhone = (phone) => {
  if (!phone) return { code: '+216', countryCode: 'TN', name: 'Tunisie' };
  const cleanPhone = phone.replace(/\s/g, '');
  const prefixes = [...phonePrefixes].sort((a, b) => b.code.length - a.code.length);
  for (const prefix of prefixes) {
    const prefixWithoutPlus = prefix.code.replace('+', '');
    if (cleanPhone.startsWith(prefixWithoutPlus)) {
      return prefix;
    }
  }
  return { code: '+216', countryCode: 'TN', name: 'Tunisie' };
};

const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  const clean = phone.replace(/\D/g, '');
  const country = getCountryFromPhone(phone);
  const prefixWithoutPlus = country.code.replace('+', '');
  let numberPart = clean;
  if (numberPart.startsWith(prefixWithoutPlus)) {
    numberPart = numberPart.substring(prefixWithoutPlus.length);
  }
  
  // Formatage personnalisé selon le pays
  switch (country.countryCode) {
    case 'TN': // Tunisie : 2 chiffres + 3 chiffres + 3 chiffres (ex: 21 915 864)
      if (numberPart.length >= 8) {
        return `${numberPart.slice(0, 2)} ${numberPart.slice(2, 5)} ${numberPart.slice(5, 8)}`;
      }
      break;
    case 'FR': // France : 2 chiffres + 2 chiffres + 2 chiffres + 2 chiffres + 2 chiffres
      if (numberPart.length >= 10) {
        return `${numberPart.slice(0, 2)} ${numberPart.slice(2, 4)} ${numberPart.slice(4, 6)} ${numberPart.slice(6, 8)} ${numberPart.slice(8, 10)}`;
      }
      break;
    case 'DZ': // Algérie : 2 chiffres + 2 chiffres + 2 chiffres + 2 chiffres
    case 'MA': // Maroc : 2 chiffres + 2 chiffres + 2 chiffres + 2 chiffres
      if (numberPart.length >= 8) {
        return `${numberPart.slice(0, 2)} ${numberPart.slice(2, 4)} ${numberPart.slice(4, 6)} ${numberPart.slice(6, 8)}`;
      }
      break;
    case 'US': 
      if (numberPart.length >= 10) {
        return `${numberPart.slice(0, 3)} ${numberPart.slice(3, 6)} ${numberPart.slice(6, 10)}`;
      }
      break;
    default: 
      const groups = numberPart.match(/.{1,2}/g);
      return groups ? groups.join(' ') : numberPart;
  }
  
  const groups = numberPart.match(/.{1,2}/g);
  return groups ? groups.join(' ') : numberPart;
};

  const isTrialExpired = () => {
  const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
  
  const subscription = userData.subscription || {};
  const maintenant = new Date();
  
  const hasActiveSubscription = 
    (subscription.monthly && new Date(subscription.monthly) > maintenant) ||
    (subscription.semester && new Date(subscription.semester) > maintenant) ||
    (subscription.annual && new Date(subscription.annual) > maintenant);
  
  // Si abonnement actif → ignorer l'essai
  if (hasActiveSubscription) {
    return false;
  }
  
  // Sinon vérifier l'essai normalement
  if (!userData.termsAcceptedDate) return false;
  
  const acceptedDate = new Date(userData.termsAcceptedDate);
  const trialEnd = new Date(acceptedDate);
  trialEnd.setDate(trialEnd.getDate() + 21);
  return new Date() > trialEnd;
};

const isSubscriptionExpired = () => {
  const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
  const subscription = userData.subscription || {};
  const maintenant = new Date();
  
  const hasSubscription = subscription.monthly || subscription.semester || subscription.annual;
  if (!hasSubscription) return false;
  
  const isActive = 
    (subscription.monthly && new Date(subscription.monthly) > maintenant) ||
    (subscription.semester && new Date(subscription.semester) > maintenant) ||
    (subscription.annual && new Date(subscription.annual) > maintenant);
  
  return hasSubscription && !isActive;
};

  useEffect(() => {
    fetchUserData();
    fetchResidenceData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${backendUrl}/api/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setUserData(data.user);
      }
    } catch (error) {
      console.error('Erreur chargement utilisateur:', error);
      setGlobalError('Impossible de charger vos informations');
    } finally {
      setLoading(false);
    }
  };

  const fetchResidenceData = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${backendUrl}/api/residence/my-residence`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success && data.residence) {
        // Trier les blocs par nom
        const sortedBlocs = data.residence.blocs.sort((a, b) => a.nom.localeCompare(b.nom));
        setResidenceData({
          ...data.residence,
          blocs: sortedBlocs
        });
        return data.residence;
      }
    } catch (error) {
      console.error('Erreur chargement résidence:', error);
    }
  };

  const refreshResidenceData = async () => {
    const updatedData = await fetchResidenceData(); 
    
    
    if (typeof window.refreshAppResidence === 'function' && updatedData) {
      window.refreshAppResidence();
    } else {
    }
  };

  const saveResidenceChanges = async (dataToSave = residenceData) => {
    

    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${backendUrl}/api/residence/residence`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          residenceName: dataToSave.residenceName,
          blocs: dataToSave.blocs
        })
      });

      const data = await response.json();

      if (data.success) {
        setResidenceSuccess('Résidence mise à jour avec succès');
        setTimeout(() => setResidenceSuccess(''), 3000);
      } else {
        setGlobalError(data.message || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setGlobalError('Erreur lors de la mise à jour');
    }
  };

  const handleSaveBloc = async (newBloc) => {

    if (residenceData.blocs.length >= 11) {
    alert("❌ Limite atteinte ! Vous ne pouvez pas créer plus de 11 blocs.");
    return;
  }

  const updatedResidence = {
    ...residenceData,
    blocs: [...residenceData.blocs, newBloc]
  };
  
  const positionsFixes = [
    [-9, 0, -7],   
    [-3, 0, -7],   
    [3, 0, -7],    
    [9, 0, -7],    
    [-6, 0, 0],    
    [0, 0, 0],     
    [6, 0, 0],     
    [-9, 0, 7],    
    [-3, 0, 7],    
    [3, 0, 7],    
    [9, 0, 7],     
  ];
  
  const sortedBlocs = [...updatedResidence.blocs].sort((a, b) => a.nom.localeCompare(b.nom));
  
  const blocsAvecPositions = sortedBlocs.map((bloc, index) => ({
    ...bloc,
    position: positionsFixes[index] || [index * 8, 0, 0]
  }));
  
  const finalResidence = {
    ...updatedResidence,
    blocs: blocsAvecPositions
  };
  
  await saveResidenceChanges(finalResidence);
  await refreshResidenceData();
};

  const handleDeleteBloc = async (blocIndex) => {
    const updatedResidence = {
      ...residenceData,
      blocs: residenceData.blocs.filter((_, index) => index !== blocIndex)
    };
    await saveResidenceChanges(updatedResidence);
    await refreshResidenceData();
  };

  const handleUpdateBlocName = async (blocIndex, newName) => {
    const updatedResidence = { ...residenceData };
    updatedResidence.blocs[blocIndex].nom = newName;

    setEditingBloc(null);
    await saveResidenceChanges(updatedResidence);
    await refreshResidenceData();
  };

  const handleAddAppartement = async (etageIndex) => {
    if (!newAppartName.trim() || selectedBlocForAppart === null) return;

    const updatedResidence = { ...residenceData };
    const bloc = updatedResidence.blocs[selectedBlocForAppart];
    
    // S'assurer que le tableau de l'étage existe
    if (!bloc.appartementsParEtage[etageIndex]) {
      bloc.appartementsParEtage[etageIndex] = [];
    }
    
    bloc.appartementsParEtage[etageIndex].push(newAppartName);
    
    bloc.totalAppartements = bloc.appartementsParEtage.flat().length;

    await saveResidenceChanges(updatedResidence);
    await refreshResidenceData();

    setNewAppartName('');
    setSelectedBlocForAppart(null);
    setShowAddAppart(false);
    setSelectedEtageForAppart(0);
  };

  const handleAddEtageWithConfig = async () => {

    if (etageAppartCount === '' || etageAppartCount === null) {
    setEtageError('Veuillez saisir le nombre d\'appartements');
    setShakeEtage(true);
    setTimeout(() => setShakeEtage(false), 500);
    return;
  }
  
  const numValue = Number(etageAppartCount);
  if (isNaN(numValue) || numValue < 1 || numValue > 10) {
    setEtageError('Veuillez saisir un nombre entre 1 et 10');
    setShakeEtage(true);
    setTimeout(() => setShakeEtage(false), 500);
    return;
  }
  
  setEtageError('');

    if (selectedBlocForEtage === null) return;

    const updatedResidence = { ...residenceData };
    const bloc = updatedResidence.blocs[selectedBlocForEtage];
    const newEtageNumber = bloc.etages + 1;
    
    // Incrémenter le nombre d'étages
    bloc.etages += 1;
    bloc.hauteur = bloc.etages * 2;
    
    // S'assurer que appartementsParEtage existe
    if (!bloc.appartementsParEtage) {
      bloc.appartementsParEtage = [];
    }
    
    // Créer les appartements pour le nouvel étage avec la bonne nomenclature
    const newApparts = [];
    for (let i = 1; i <= etageAppartCount; i++) {
      let appartName;
      
      // Si c'est le RDC (premier étage) et que le bloc n'a qu'un seul étage
      if (newEtageNumber === 1) {
        appartName = `${bloc.nom}-RDC${i}`;
      } 
      // Si on ajoute un étage et que l'étage 1 existe déjà (qui était le RDC)
      else if (newEtageNumber === 2 && bloc.appartementsParEtage.length === 1) {
        // Le premier étage existant était le RDC, maintenant on ajoute l'étage 1
        appartName = `${bloc.nom}1${i}`;
      }
      // Pour tous les autres cas
      else {
        // Si le bloc a déjà un RDC, les étages suivants sont numérotés normalement
        const hasRDC = bloc.appartementsParEtage[0]?.[0]?.includes('-RDC');
        
        if (hasRDC) {
          // Le premier étage est le RDC, donc l'étage suivant est le 1
          appartName = `${bloc.nom}${newEtageNumber - 1}${i}`;
        } else {
          // Pas de RDC, numérotation normale
          appartName = `${bloc.nom}${newEtageNumber}${i}`;
        }
      }
      
      newApparts.push(appartName);
    }
    
    // Ajouter le nouvel étage
    bloc.appartementsParEtage.push(newApparts);
    
    // Mettre à jour le total d'appartements
    bloc.totalAppartements = bloc.appartementsParEtage.flat().length;
    
    // Mettre à jour appartementsAttendus si nécessaire
    if (bloc.appartementsAttendus) {
      bloc.appartementsAttendus.push(etageAppartCount);
    } else {
      bloc.appartementsAttendus = Array(bloc.etages - 1).fill(4).concat([etageAppartCount]);
    }

    await saveResidenceChanges(updatedResidence);
    await refreshResidenceData();

    setShowEtageConfig(false);
    setSelectedBlocForEtage(null);
    setEtageAppartCount(4);
  };

  const validatePhoneNumber = (phone) => {
  // Supprimer tous les espaces et caractères non numériques
  const cleanPhone = phone.replace(/\s/g, '');
  
  // Vérifier si c'est exactement 8 chiffres
  const phoneRegex = /^[0-9]{8}$/;
  
  return {
    isValid: phoneRegex.test(cleanPhone),
    cleanValue: cleanPhone
  };
};

  const handleDeleteAppartement = async (blocIndex, etageIndex, appartIndex) => {
    const updatedResidence = { ...residenceData };
    const bloc = updatedResidence.blocs[blocIndex];
    
    if (bloc.appartementsParEtage[etageIndex]) {
      bloc.appartementsParEtage[etageIndex] = bloc.appartementsParEtage[etageIndex].filter((_, index) => index !== appartIndex);
      bloc.totalAppartements = bloc.appartementsParEtage.flat().length;
    }

    await saveResidenceChanges(updatedResidence);
    await refreshResidenceData();
  };

  const handleUpdateAppartementName = async (blocIndex, etageIndex, appartIndex, newName) => {
    const updatedResidence = { ...residenceData };
    const bloc = updatedResidence.blocs[blocIndex];
    
    if (bloc.appartementsParEtage[etageIndex]) {
      bloc.appartementsParEtage[etageIndex][appartIndex] = newName;
    }

    setEditingAppart(null);
    await saveResidenceChanges(updatedResidence);
    await refreshResidenceData();
  };

  const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('8 caractères minimum');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('une majuscule');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('une minuscule');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('un chiffre');
  }
  
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

const getPasswordStrengthMessage = (password) => {
  if (!password) return '';
  const validation = validatePassword(password);
  if (validation.isValid) return '✓ Mot de passe fort';
  return `⚠️ ${validation.errors.join(', ')}`;
};

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    setCurrentPasswordError('');
    setNewPasswordError('');
    setConfirmPasswordError('');
    setGlobalError('');
    setPasswordSuccess('');
    
    let hasError = false;

    if (!passwordData.currentPassword) {
      setCurrentPasswordError('Le mot de passe actuel est requis');
      setShakeCurrent(true);
      setTimeout(() => setShakeCurrent(false), 500);
      hasError = true;
    }

    if (!passwordData.newPassword) {
  setNewPasswordError('Le nouveau mot de passe est requis');
  setShakeNew(true);
  setTimeout(() => setShakeNew(false), 500);
  hasError = true;
} else {
  const passwordValidation = validatePassword(passwordData.newPassword);
  if (!passwordValidation.isValid) {
    setNewPasswordError(`Mot de passe invalide : ${passwordValidation.errors.join(', ')}`);
    setShakeNew(true);
    setTimeout(() => setShakeNew(false), 500);
    hasError = true;
  }
}

    if (!passwordData.confirmPassword) {
      setConfirmPasswordError('Veuillez confirmer le mot de passe');
      setShakeConfirm(true);
      setTimeout(() => setShakeConfirm(false), 500);
      hasError = true;
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      setConfirmPasswordError('Les mots de passe ne correspondent pas');
      setShakeConfirm(true);
      setTimeout(() => setShakeConfirm(false), 500);
      hasError = true;
    }

    if (passwordData.currentPassword && passwordData.newPassword && 
        passwordData.currentPassword === passwordData.newPassword) {
      setNewPasswordError('Le nouveau mot de passe doit être différent de l\'ancien');
      setShakeNew(true);
      setTimeout(() => setShakeNew(false), 500);
      hasError = true;
    }

    if (hasError) return;

    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${backendUrl}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        setPasswordSuccess('Mot de passe modifié avec succès');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        if (data.message === 'Mot de passe actuel incorrect') {
          setCurrentPasswordError('Mot de passe actuel incorrect');
          setShakeCurrent(true);
          setTimeout(() => setShakeCurrent(false), 500);
        } else {
          setGlobalError(data.message || 'Erreur lors du changement de mot de passe');
        }
      }
    } catch (error) {
      console.error('Erreur:', error);
      setGlobalError('Erreur lors du changement de mot de passe');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'SUPPRIMER') {
      setGlobalError('Veuillez taper "SUPPRIMER" pour confirmer');
      return;
    }

    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${backendUrl}/api/auth/delete-account`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        sessionStorage.clear();
        window.location.href = '/login';
      } else {
        setGlobalError(data.message || 'Erreur lors de la suppression du compte');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setGlobalError('Erreur lors de la suppression du compte');
    }
  };

  const handleUpdateProfile = async (field, value) => {
  if (field === 'phone') {
    const country = getCountryFromPhone(userData.phone);
    const prefixWithoutPlus = country.code.replace('+', '');
    const cleanNumber = value.replace(/\D/g, '');
    
    if (cleanNumber.length < 6 || cleanNumber.length > 15) {
      setPhoneError(`Le numéro doit contenir entre 6 et 15 chiffres (${country.code})`);
      setShakePhone(true);
      setTimeout(() => setShakePhone(false), 500);
      return;
    }
    
    const fullNumber = prefixWithoutPlus + cleanNumber;
    setPhoneError('');
    
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${backendUrl}/api/auth/update-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ [field]: fullNumber })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUserData(prev => ({ ...prev, [field]: fullNumber }));
        setProfileSuccess(`Téléphone mis à jour avec succès`);
        setTimeout(() => setProfileSuccess(''), 3000);
      } else {
        setGlobalError(data.message || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setGlobalError('Erreur lors de la mise à jour');
    }
    return;
  }
  // Nom
  try {
    const token = sessionStorage.getItem('token');
    const response = await fetch(`${backendUrl}/api/auth/update-profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ [field]: value })
    });

    const data = await response.json();

    if (data.success) {
      setUserData(prev => ({ ...prev, [field]: value }));
      setProfileSuccess(`${field === 'name' ? 'Nom' : 'Téléphone'} mis à jour avec succès`);
      setTimeout(() => setProfileSuccess(''), 3000);
    } else {
      setGlobalError(data.message || 'Erreur lors de la mise à jour');
    }
  } catch (error) {
    console.error('Erreur:', error);
    setGlobalError('Erreur lors de la mise à jour');
  }
};

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4" />
          <p className="text-gray-600">Chargement de vos paramètres...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-3 md:px-4 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Paramètres du compte</h1>
        
        {residenceData && (
          <button
  onClick={() => {
    if (isSubscriptionExpired()) {
    window.dispatchEvent(new CustomEvent('showExpiredSubscriptionModal'));
    return;
  }
    if (isTrialExpired()) {
      window.dispatchEvent(new CustomEvent('showExpiredModal'));
      return;
    }
    setShowResidenceModal(true);
  }}
  className="bg-blue-600 hover:bg-blue-700 text-white px-3 md:px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 text-sm md:text-base"
>
  <FaHome className="text-base md:text-lg" />
  <span className="truncate max-w-[150px] md:max-w-none">Résidence {residenceData.residenceName}</span>
  <FaEdit className="text-sm" />
</button>
        )}
      </div>

      {globalError && (
  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm md:text-base">
    {globalError}
  </div>
)}

{profileSuccess && (
  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm md:text-base">
    {profileSuccess}
  </div>
)}

{residenceSuccess && (
  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm md:text-base">
    {residenceSuccess}
  </div>
)}

      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-gray-800 to-gray-700 text-white px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center">
            <FaUser className="text-lg md:text-xl mr-2 md:mr-3" />
            <h2 className="text-lg md:text-xl font-semibold">Informations personnelles</h2>
          </div>
        </div>
        
        <div className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Nom complet
  </label>
  <div className="relative">
    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
      <FaUser size={18} />
    </div>
    <input
      type="text"
      value={isEditingName ? editedName : userData.name}
      onChange={(e) => {
        setEditedName(e.target.value);
        setIsEditingName(true);
      }}
      onFocus={() => {
        setEditedName(userData.name);
        setOriginalName(userData.name);
        setIsEditingName(true);
      }}
      className="w-full pl-9 md:pl-10 pr-16 md:pr-20 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
    />
    
    
    {isEditingName && (
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1 md:space-x-2">
        <button
          onClick={async () => {
            if (editedName !== originalName && editedName.trim()) {
              await handleUpdateProfile('name', editedName);
            }
            setIsEditingName(false);
          }}
          className="text-green-600 hover:text-green-800 bg-white rounded-full p-1"
          title="Valider"
        >
          <FaCheck size={18} />
        </button>
        <button
          onClick={() => {
            setEditedName(originalName);
            setIsEditingName(false);
          }}
          className="text-red-600 hover:text-red-800 bg-white rounded-full p-1"
          title="Annuler"
        >
          <FaTimes size={18} />
        </button>
      </div>
    )}
  </div>
  <p className="text-xs text-green-600 mt-1">Modifiable</p>
</div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="flex items-center p-2 md:p-3 bg-gray-50 rounded-lg border border-gray-200">
                <FaEnvelope className="text-gray-400 mr-2 text-sm md:text-base" />
                <span className="text-gray-800 text-sm md:text-base truncate">{userData.email}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Non modifiable</p>
            </div>

            {userData.phone ? (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Téléphone
    </label>
    <div className="flex gap-2">
      {/* Drapeau non cliquable */}
      <div className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
        <ReactCountryFlag 
          countryCode={getCountryFromPhone(userData.phone).countryCode} 
          svg 
          style={{ width: '1.2em', height: '1.2em' }} 
        />
        <span className="font-medium text-gray-500">{getCountryFromPhone(userData.phone).code}</span>
      </div>
      
      {/* Champ numéro non modifiable */}
      <div className="relative flex-1">
        <input
          type="tel"
          value={formatPhoneNumber(userData.phone)}
          className="w-full px-4 py-2 text-sm md:text-base border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
          readOnly
          disabled
        />
      </div>
    </div>
    <p className="text-xs text-gray-500 mt-1">Non modifiable</p>
  </div>
) : (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Téléphone
    </label>
    <div className="text-gray-500 italic bg-gray-50 p-3 rounded-lg border border-gray-200">
      Aucun numéro renseigné (compte Google)
    </div>
  </div>
)}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rôle
              </label>
              <div className="flex items-center p-2 md:p-3 bg-gray-50 rounded-lg border border-gray-200">
                <FaKey className="text-gray-400 mr-2 text-sm md:text-base" />
                <span className="text-gray-800 text-sm md:text-base capitalize">{userData.role}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-white px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center">
            <FaLock className="text-lg md:text-xl mr-2 md:mr-3" />
            <h2 className="text-lg md:text-xl font-semibold">Changer le mot de passe</h2>
          </div>
        </div>
        
        <form onSubmit={handlePasswordChange} className="p-4 md:p-6">
          <div className="space-y-4">
            <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Mot de passe actuel
  </label>
  <div className="relative">
    <input
      type={showCurrentPassword ? "text" : "password"}
      value={passwordData.currentPassword}
      onChange={(e) => {
        setPasswordData({...passwordData, currentPassword: e.target.value});
        setCurrentPasswordError('');
      }}
      className="w-full px-4 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 pr-10"
      required
    />
    <button
      type="button"
      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
    >
      {showCurrentPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
    </button>
  </div>
  {currentPasswordError && (
    <p className={`text-red-500 text-xs md:text-sm mt-1 ${shakeCurrent ? 'animate-shake' : ''}`}>
      {currentPasswordError}
    </p>
  )}
</div>

            <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Nouveau mot de passe
  </label>
  <div className="relative">
    <input
      type={showNewPassword ? "text" : "password"}
      value={passwordData.newPassword}
      onChange={(e) => {
        setPasswordData({...passwordData, newPassword: e.target.value});
        setNewPasswordError('');
      }}
      className="w-full px-4 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 pr-10"
      required
      minLength="6"
    />
    <button
      type="button"
      onClick={() => setShowNewPassword(!showNewPassword)}
      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
    >
      {showNewPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}

    </button>
  </div>
  {passwordData.newPassword && (
    <p className={`text-xs mt-1 ${validatePassword(passwordData.newPassword).isValid ? 'text-green-600' : 'text-yellow-600'}`}>
      {getPasswordStrengthMessage(passwordData.newPassword)}
    </p>
  )}
  {newPasswordError && (
    <p className={`text-red-500 text-xs md:text-sm mt-1 ${shakeNew ? 'animate-shake' : ''}`}>
      {newPasswordError}
    </p>
  )}
</div>

            <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Confirmer le nouveau mot de passe
  </label>
  <div className="relative">
    <input
      type={showConfirmPassword ? "text" : "password"}
      value={passwordData.confirmPassword}
      onChange={(e) => {
        setPasswordData({...passwordData, confirmPassword: e.target.value});
        setConfirmPasswordError('');
      }}
      className="w-full px-4 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 pr-10"
      required
    />
    <button
      type="button"
      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
    >
      {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
    </button>
  </div>
  {confirmPasswordError && (
    <p className={`text-red-500 text-xs md:text-sm mt-1 ${shakeConfirm ? 'animate-shake' : ''}`}>
      {confirmPasswordError}
    </p>
  )}
</div>

            {passwordSuccess && (
  <div className="text-green-600 text-xs md:text-sm mt-2">
    ✓ {passwordSuccess}
  </div>
)}

            <button
              type="submit"
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 md:px-6 py-2 rounded-lg font-semibold transition-colors flex items-center text-sm md:text-base"
            >
              <FaSave className="mr-2 text-sm md:text-base" />
              Changer le mot de passe
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-red-200">
        <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center">
            <FaExclamationTriangle className="text-lg md:text-xl mr-2 md:mr-3" />
            <h2 className="text-lg md:text-xl font-semibold">Zone dangereuse</h2>
          </div>
        </div>
        
        <div className="p-4 md:p-6">
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="bg-red-500 hover:bg-red-600 text-white px-4 md:px-6 py-2 rounded-lg font-semibold transition-colors flex items-center text-sm md:text-base"
            >
              <FaTrash className="mr-2 text-sm md:text-base" />
              Supprimer mon compte
            </button>
          ) : (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 md:p-4">
                <p className="text-red-700 font-medium mb-2 text-sm md:text-base">
                  ⚠️ Cette action est irréversible !
                </p>
                <p className="text-xs md:text-sm text-red-600">
                  La suppression de votre compte entraînera la perte définitive de toutes vos données.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tapez <span className="font-bold">SUPPRIMER</span> pour confirmer
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className="w-full px-4 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="SUPPRIMER"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleDeleteAccount}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 md:px-6 py-2 rounded-lg font-semibold transition-colors text-sm md:text-base"
                >
                  Confirmer la suppression
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmation('');
                  }}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 md:px-6 py-2 rounded-lg font-semibold transition-colors text-sm md:text-base"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showResidenceModal && residenceData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4">
          <div 
  className="absolute inset-0 bg-black/70 backdrop-blur-sm" 
  onClick={() => {
    setShowResidenceModal(false);
    // Réinitialiser l'état d'édition du nom
    setIsEditingResidenceName(false);
    setEditedResidenceName('');
    setEditingBloc(null);
    setIsEditingBlocName(false);
    setEditingAppart(null);
    setIsEditingAppartName(false);
    setEditingAppartInfo({ blocIndex: null, etageIndex: null, appartIndex: null });
    setExpandedBloc(null);
    setShowAddAppart(false);
    setSelectedBlocForAppart(null);
    setShowEtageConfig(false);
    setSelectedBlocForEtage(null);
    setNewAppartName('');
  }} 
/>
          
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 md:px-6 py-3 md:py-4 rounded-t-2xl flex justify-between items-center">
              <div className="flex items-center">
                <FaBuilding className="text-xl md:text-2xl mr-2 md:mr-3" />
                <h2 className="text-xl md:text-2xl font-bold">Gestion de la résidence</h2>
              </div>
              <button
  onClick={() => {
    setShowResidenceModal(false);
    setIsEditingResidenceName(false);
    setEditedResidenceName('');

    setEditingBloc(null);
    setIsEditingBlocName(false);
    setEditingAppart(null);
    setIsEditingAppartName(false);
    setEditingAppartInfo({ blocIndex: null, etageIndex: null, appartIndex: null });
    setExpandedBloc(null);
    setShowAddAppart(false);
    setSelectedBlocForAppart(null);
    setShowEtageConfig(false);
    setSelectedBlocForEtage(null);
    setNewAppartName(''); 
    
  }}
  className="text-white hover:text-gray-200"
>
  <FaTimes size={24} />
</button>
            </div>

            <div className="p-4 md:p-6">
              <div className="mb-6 relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de la résidence
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={isEditingResidenceName ? editedResidenceName : residenceData.residenceName}
                    onChange={(e) => {
                      setEditedResidenceName(e.target.value);
                      setIsEditingResidenceName(true);
                    }}
                    onFocus={() => {
                      setEditedResidenceName(residenceData.residenceName);
                      setOriginalResidenceName(residenceData.residenceName);
                      setIsEditingResidenceName(true);
                    }}
                    className="w-full px-4 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 pr-16 md:pr-20"
                  />
                  
                  {/* Icônes de validation/annulation */}
                  {isEditingResidenceName && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1 md:space-x-2">
                      {/* Check vert - Valider */}
                      <button
                        onClick={async () => {
                          if (editedResidenceName !== originalResidenceName) {
                            const updatedResidence = {
                              ...residenceData,
                              residenceName: editedResidenceName
                            };
                            await saveResidenceChanges(updatedResidence);
                            await refreshResidenceData();
                          }
                          setIsEditingResidenceName(false);
                        }}
                        className="text-green-600 hover:text-green-800 bg-white rounded-full p-1"
                        title="Valider"
                      >
                        <FaCheck size={18} />
                      </button>
                      
                      {/* X rouge - Annuler */}
                      <button
                        onClick={() => {
                          setEditedResidenceName(originalResidenceName);
                          setIsEditingResidenceName(false);
                        }}
                        className="text-red-600 hover:text-red-800 bg-white rounded-full p-1"
                        title="Annuler"
                      >
                        <FaTimes size={18} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
  <h3 className="text-base md:text-lg font-semibold text-gray-800">
    Blocs ({residenceData.blocs.length}/11)
    {residenceData.blocs.length >= 11 && (
      <span className="text-red-500 text-xs md:text-sm ml-2"> Limite atteinte</span>
    )}
  </h3>
  <button
    onClick={() => {
      if (residenceData.blocs.length >= 11) {
        alert("❌ Limite atteinte ! Vous ne pouvez pas créer plus de 11 blocs.");
        return;
      }
      setShowAddBlocModal(true);
    }}
    className={`px-3 py-1 rounded-lg text-xs md:text-sm flex items-center ${
      residenceData.blocs.length >= 11
        ? 'bg-gray-400 cursor-not-allowed'
        : 'bg-green-500 hover:bg-green-600'
    } text-white`}
    disabled={residenceData.blocs.length >= 11}
  >
    <FaPlus className="mr-1" size={12} />
    Ajouter un bloc
  </button>
</div>

                {residenceData.blocs.map((bloc, blocIndex) => (
                  <div key={blocIndex} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div
                      className="bg-gray-50 px-3 md:px-4 py-2 md:py-3 flex justify-between items-center cursor-pointer hover:bg-gray-100"
                      onClick={() => setExpandedBloc(expandedBloc === blocIndex ? null : blocIndex)}
                    >
                      <div className="flex items-center space-x-2 md:space-x-3">
                        {/* Dans l'en-tête du bloc, remplace la partie editingBloc */}
{editingBloc === blocIndex ? (
  <div className="flex items-center space-x-1 md:space-x-2">
    <input
      type="text"
      value={editedBlocName}
      onChange={(e) => setEditedBlocName(e.target.value.toUpperCase())}
      onFocus={() => {
        setEditedBlocName(bloc.nom);
        setOriginalBlocName(bloc.nom);
        setIsEditingBlocName(true);
      }}
      className="px-2 py-1 text-sm md:text-base border border-gray-300 rounded"
      autoFocus
      onClick={(e) => e.stopPropagation()}
    />
    {isEditingBlocName && (
      <div className="flex space-x-1">
        <button
          onClick={async (e) => {
            e.stopPropagation();
            if (editedBlocName !== originalBlocName) {
              await handleUpdateBlocName(blocIndex, editedBlocName);
            }
            setEditingBloc(null);
            setIsEditingBlocName(false);
          }}
          className="text-green-600 hover:text-green-800"
        >
          <FaCheck size={14} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setEditedBlocName(originalBlocName);
            setEditingBloc(null);
            setIsEditingBlocName(false);
          }}
          className="text-red-600 hover:text-red-800"
        >
          <FaTimes size={14} />
        </button>
      </div>
    )}
  </div>
) : (
  <>
    <FaBuilding className="text-gray-600 text-sm md:text-base" />
    <span className="font-medium text-sm md:text-base">{bloc.nom}</span>
    <span className="text-xs md:text-sm text-gray-500">
      ({bloc.totalAppartements} appartements)
    </span>
  </>
)}
                      </div>
                      <div className="flex items-center space-x-1 md:space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingBloc(blocIndex);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <FaEdit size={18} />
                        </button>
                        <button
  onClick={(e) => {
    e.stopPropagation();
    setBlocToDelete(blocIndex);
    setShowDeleteBlocConfirm(true);
  }}
  className="text-red-600 hover:text-red-800"
>
  <FaTrash size={18} />
</button>
                        {expandedBloc === blocIndex ? <FaChevronUp /> : <FaChevronDown />}
                      </div>
                    </div>

                    {expandedBloc === blocIndex && (
                      <div className="p-3 md:p-4 border-t border-gray-200">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                          <h4 className="font-medium text-gray-700 text-sm md:text-base">Appartements</h4>
                          <div className="flex gap-2">
                            {/* Bouton pour ajouter un étage */}
                            <button
                              onClick={() => {
                                setSelectedBlocForEtage(blocIndex);
                                setShowEtageConfig(true);
                              }}
                              className="bg-purple-500 hover:bg-purple-600 text-white px-2 py-1 rounded text-xs md:text-sm flex items-center"
                            >
                              <FaPlus className="mr-1" size={12} />
                              Ajouter étage
                            </button>
                            
                            {/* Bouton pour ajouter un appartement */}
                            <button
  onClick={() => {
    setSelectedBlocForAppart(blocIndex);
    setSelectedEtageForAppart(0);
    const bloc = residenceData.blocs[blocIndex];
    const appartCount = bloc.appartementsParEtage[0]?.length || 0;
    const nextNum = appartCount + 1;
    const suggestedName = `${bloc.nom}-RDC${nextNum}`;
    setNewAppartName(suggestedName);
    setShowAddAppart(true);
    
    // 👇 AJOUTE CETTE LIGNE POUR ACTIVER L'EFFET DÈS L'OUVERTURE
    setHighlightEtage(true);
    // L'effet dure 3 secondes, assez pour que l'admin voie qu'il doit choisir
    setTimeout(() => setHighlightEtage(false), 3000);
  }}
  className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs md:text-sm flex items-center"
>
  <FaPlus className="mr-1" size={12} />
  Ajouter appart
</button>
                          </div>
                        </div>

                        {/* Configuration pour ajouter un étage */}
                        {showEtageConfig && selectedBlocForEtage === blocIndex && (
                          <div className="bg-purple-50 p-3 md:p-4 rounded-lg mb-4 border border-purple-200">
                            <p className="text-xs md:text-sm font-medium text-purple-800 mb-2">
                              Ajouter un étage au bloc {bloc.nom}
                            </p>
                            <p className="text-xs text-purple-600 mb-3">
                              L'étage {bloc.etages + 1} sera créé avec le nombre d'appartements choisi
                            </p>
                            
                            <label className="block text-xs md:text-sm text-gray-600 mb-1">
                              Nombre d'appartements pour l'étage {bloc.etages + 1}
                            </label>
                            {etageError && (
  <p className={`text-red-500 text-xs md:text-sm mt-1 ${shakeEtage ? 'animate-shake' : ''}`}>
    {etageError}
  </p>
)}
                            <input
  type="number"
  value={etageAppartCount === '' ? '' : etageAppartCount}
  onChange={(e) => {
    const value = e.target.value;
    if (value === '') {
      setEtageAppartCount('');
      setEtageError('');
    } else {
      setEtageAppartCount(parseInt(value) || 1);
      setEtageError('');
    }
  }}
  min="1"
  max="10"
  className={`w-full px-3 py-2 text-sm md:text-base border rounded-lg mb-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
    etageError ? 'border-red-500' : 'border-purple-300'
  }`}
  autoFocus
/>


                            
                            <div className="flex flex-col sm:flex-row gap-2">
                              <button
                                onClick={handleAddEtageWithConfig}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-xs md:text-sm font-medium flex-1"
                              >
                                Ajouter l'étage
                              </button>
                              <button
                                onClick={() => {
                                  setShowEtageConfig(false);
                                  setSelectedBlocForEtage(null);
                                  setEtageAppartCount(4);
                                }}
                                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg text-xs md:text-sm font-medium"
                              >
                                Annuler
                              </button>
                            </div>
                          </div>
                        )}

                        {showAddAppart && selectedBlocForAppart === blocIndex && (
                          <div className="bg-gray-50 p-3 rounded-lg mb-3">
                            {/* Sélecteur d'étage */}
                            <div className="mb-2">
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Choisir l'étage :
                              </label>
                              <select
  value={selectedEtageForAppart}
  onChange={(e) => {
    const etageIndex = parseInt(e.target.value);
    setSelectedEtageForAppart(etageIndex);
    
    // Ajouter l'effet highlight
    setHighlightEtage(true);
    setTimeout(() => setHighlightEtage(false), 1500);
    
    // Générer automatiquement le nom suggéré
    const bloc = residenceData.blocs[blocIndex];
    const appartCount = bloc.appartementsParEtage[etageIndex]?.length || 0;
    const nextNum = appartCount + 1;
    
    let suggestedName;
    if (etageIndex === 0) {
      suggestedName = `${bloc.nom}-RDC${nextNum}`;
    } else {
      suggestedName = `${bloc.nom}${etageIndex}${nextNum}`;
    }
    
    setNewAppartName(suggestedName);
  }}
  className={`w-full px-2 py-1 border rounded text-xs md:text-sm mb-2 transition-all duration-300 ${
  highlightEtage ? 'border-yellow-600 bg-yellow-200 shadow-lg ring-2 ring-yellow-400' : 'border-gray-300'
}`}
>
  {bloc.appartementsParEtage.map((etage, idx) => {
    const count = etage?.length || 0;
    const max = bloc.appartementsAttendus?.[idx] || 0;
    
    let etageLabel;
    if (idx === 0) {
      etageLabel = `Rez-de-chaussée (${count}/${max} apparts)`;
    } else {
      etageLabel = `Étage ${idx} (${count}/${max} apparts)`;
    }
    
    return (
      <option key={idx} value={idx}>
        {etageLabel}
      </option>
    );
  })}
</select>
                            </div>
                            
                            {/* Champ de saisie du nom */}
                            <input
                              type="text"
                              value={newAppartName}
                              onChange={(e) => setNewAppartName(e.target.value)}
                              placeholder="Nom de l'appartement"
                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs md:text-sm mb-2"
                              autoFocus
                            />
                            
                            {/* Message d'aide */}
                            <p className="text-xs text-gray-500 mb-2">
                              Suggestion: {newAppartName || "Saisissez un nom"}
                            </p>
                            
                            {/* Boutons */}
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleAddAppartement(selectedEtageForAppart)}
                                className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs flex-1"
                              >
                                Ajouter
                              </button>
                              <button
                                onClick={() => {
                                  setShowAddAppart(false);
                                  setNewAppartName('');
                                  setSelectedBlocForAppart(null);
                                  setSelectedEtageForAppart(0);
                                }}
                                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-2 py-1 rounded text-xs"
                              >
                                Annuler
                              </button>
                            </div>
                          </div>
                        )}
                        <div className="space-y-4">
                          {bloc.appartementsParEtage.map((etageApparts, etageIndex) => (
                            <div key={etageIndex} className="border-l-2 border-gray-200 pl-2 md:pl-3">
                              <h5 className="text-xs font-semibold text-gray-500 mb-2">
                                {etageIndex === 0 ? 'Rez-de-chaussée' : `Étage ${etageIndex}`}
                              </h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {etageApparts?.map((appart, appartIndex) => (
                                  <div key={appartIndex} className="bg-gray-50 p-2 rounded flex justify-between items-center">
                                    {/* Dans la liste des appartements, remplace la partie editingAppart */}
{editingAppart === `${blocIndex}-${etageIndex}-${appartIndex}` ? (
  <div className="flex items-center space-x-1 w-full">
    <input
      type="text"
      value={editedAppartName}
      onChange={(e) => setEditedAppartName(e.target.value)}
      onFocus={() => {
        setEditedAppartName(appart);
        setOriginalAppartName(appart);
        setIsEditingAppartName(true);
        setEditingAppartInfo({ blocIndex, etageIndex, appartIndex });
      }}
      className="w-full px-2 py-1 border border-gray-300 rounded text-xs md:text-sm"
      autoFocus
    />
    {isEditingAppartName && 
     editingAppartInfo.blocIndex === blocIndex && 
     editingAppartInfo.etageIndex === etageIndex && 
     editingAppartInfo.appartIndex === appartIndex && (
      <div className="flex space-x-1">
        <button
          onClick={() => {
            if (editedAppartName !== originalAppartName) {
              handleUpdateAppartementName(blocIndex, etageIndex, appartIndex, editedAppartName);
            }
            setEditingAppart(null);
            setIsEditingAppartName(false);
            setEditingAppartInfo({ blocIndex: null, etageIndex: null, appartIndex: null });
          }}
          className="text-green-600 hover:text-green-800"
        >
          <FaCheck size={12} />
        </button>
        <button
          onClick={() => {
            setEditedAppartName(originalAppartName);
            setEditingAppart(null);
            setIsEditingAppartName(false);
            setEditingAppartInfo({ blocIndex: null, etageIndex: null, appartIndex: null });
          }}
          className="text-red-600 hover:text-red-800"
        >
          <FaTimes size={12} />
        </button>
      </div>
    )}
  </div>
) : (
  <>
    <span className="text-xs md:text-sm">{appart}</span>
    <div className="flex space-x-1">
      <button
        onClick={() => {
          setEditingAppart(`${blocIndex}-${etageIndex}-${appartIndex}`);
          setEditedAppartName(appart);
          setOriginalAppartName(appart);
          setIsEditingAppartName(true);
          setEditingAppartInfo({ blocIndex, etageIndex, appartIndex });
        }}
        className="text-blue-600 hover:text-blue-800"
      >
        <FaEdit size={14} />
      </button>
      <button
  onClick={() => {
    setAppartToDelete({ blocIndex, etageIndex, appartIndex });
    setAppartDeleteInfo({ blocIndex, etageIndex, appartIndex, appartName: appart });
    setShowDeleteAppartConfirm(true);
  }}
  className="text-red-600 hover:text-red-800"
>
  <FaTrash size={14} />
</button>
    </div>
  </>
)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>  
            </div>  
          </div>  
        </div>  
      )}

      <AddBlocModal
        isOpen={showAddBlocModal}
        onClose={() => setShowAddBlocModal(false)}
        onSave={handleSaveBloc}
        currentBlocCount={residenceData?.blocs?.length || 0}
        existingBlocNames={residenceData?.blocs?.map(bloc => bloc.nom) || []}
      />

{showDeleteBlocConfirm && (
  <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteBlocConfirm(false)} />
    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-4 md:p-6 transform animate-fadeIn">
      <div className="mx-auto w-12 h-12 md:w-16 md:h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <FaExclamationTriangle className="text-red-600 text-2xl md:text-3xl" />
      </div>
      
      <h3 className="text-lg md:text-xl font-bold text-gray-800 text-center mb-2">
        Confirmer la suppression
      </h3>
      
      <p className="text-sm md:text-base text-gray-600 text-center mb-6">
        Voulez-vous vraiment supprimer le bloc {residenceData?.blocs[blocToDelete]?.nom} ?
      </p>
      
      <p className="text-xs md:text-sm text-gray-500 text-center mb-6">
        Cette action est irréversible et supprimera tous les appartements de ce bloc.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => setShowDeleteBlocConfirm(false)}
          className="flex-1 px-4 py-2 md:py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-colors text-sm md:text-base"
        >
          Annuler
        </button>
        <button
          onClick={() => {
            handleDeleteBloc(blocToDelete);
            setShowDeleteBlocConfirm(false);
            setBlocToDelete(null);
          }}
          className="flex-1 px-4 py-2 md:py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
        >
          <FaTrash size={14} className="md:size-16" />
          Supprimer
        </button>
      </div>
    </div>
  </div>
)}

{/* Modal de confirmation suppression appartement */}
{showDeleteAppartConfirm && (
  <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteAppartConfirm(false)} />
    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-4 md:p-6 transform animate-fadeIn">
      <div className="mx-auto w-12 h-12 md:w-16 md:h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <FaExclamationTriangle className="text-red-600 text-2xl md:text-3xl" />
      </div>
      
      <h3 className="text-lg md:text-xl font-bold text-gray-800 text-center mb-2">
        Confirmer la suppression
      </h3>
      
      <p className="text-sm md:text-base text-gray-600 text-center mb-6">
        Voulez-vous vraiment supprimer l'appartement ?
      </p>
      
      <p className="text-xs md:text-sm text-gray-500 text-center mb-6">
        Cette action est irréversible.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => setShowDeleteAppartConfirm(false)}
          className="flex-1 px-4 py-2 md:py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-colors text-sm md:text-base"
        >
          Annuler
        </button>
        <button
          onClick={() => {
            handleDeleteAppartement(appartDeleteInfo.blocIndex, appartDeleteInfo.etageIndex, appartDeleteInfo.appartIndex);
            setShowDeleteAppartConfirm(false);
            setAppartToDelete(null);
            setAppartDeleteInfo({ blocIndex: null, etageIndex: null, appartIndex: null });
          }}
          className="flex-1 px-4 py-2 md:py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
        >
          <FaTrash size={14} className="md:size-16" />
          Supprimer
        </button>
      </div>
    </div>
  </div>
)}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default Parametres;