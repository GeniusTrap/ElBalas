import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { FaExclamationTriangle } from 'react-icons/fa';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Blocs from './pages/Blocs'; 
import Appartements from './pages/Appartements';
import Locataires from './pages/Locataires';
import ConfigModal3D from './components/ConfigModal3D';
import Paiements from './pages/Paiements';
import PaiementAnnule from './components/PaiementAnnule';
import PaiementSucces from './components/PaiementSucces';
import Parametres from './pages/Parametres';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import ErrorConnectionModal from './components/ErrorConnectionModal';
import { NotificationProvider } from './contexts/NotificationContext';
import VerifyCode from './components/VerifyCode';
import VerifyEmailCode from './components/VerifyEmailCode';
import { assets } from './assets/assets';


export const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

function AppContent() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const auth = sessionStorage.getItem('isAdminLoggedIn') === 'true';
    return auth;
  });

  const [loading, setLoading] = useState(true);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [showExpiredSubscriptionModal, setShowExpiredSubscriptionModal] = useState(false);
  const [residenceData, setResidenceData] = useState({
    residenceName: '',
    blocs: []
  });
  const [loadingUser, setLoadingUser] = useState(true);
  

  const [paymentAccepted, setPaymentAccepted] = useState(() => {
  const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
  // justCreated n'existe plus, on se base uniquement sur termsAccepted
  return userData.termsAccepted === true;
});


const getDaysRemaining = () => {
  const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
  if (userData.termsAcceptedDate) {
    const acceptedDate = new Date(userData.termsAcceptedDate);
    const trialEnd = new Date(acceptedDate);
    trialEnd.setDate(trialEnd.getDate() + 21);
    const now = new Date();
    const diffTime = trialEnd - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }
  return 21;
};

useEffect(() => {
  const fetchUser = async () => {
    const token = sessionStorage.getItem('token');


    if (token) {
      setLoadingUser(true);
      
      const response = await fetch(`${backendUrl}/api/auth/verify`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {

        const oldUserData = JSON.parse(sessionStorage.getItem('userData') || '{}');
        
        // Stocker dans sessionStorage (unique par session)
        sessionStorage.setItem('userData', JSON.stringify(data.user));
        

        
        // Mettre à jour paymentAccepted
        const hasAccepted = data.user.termsAccepted === true;
const newPaymentAccepted = hasAccepted;

        
        setPaymentAccepted(newPaymentAccepted);
        
        // Garder trialEndDate pour l'affichage
        
      } else {
      }
      setLoadingUser(false);
    } else {
      setLoadingUser(false);
    }
  };
  fetchUser();
}, [isAuthenticated]);

useEffect(() => {
  if (residenceData.residenceName) {
    sessionStorage.setItem('residenceData', JSON.stringify(residenceData));
  }
}, [residenceData]);

  const refreshPaymentStatus = () => {
  const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
  const hasAccepted = userData.termsAccepted === true;
  
  
  setPaymentAccepted(hasAccepted);
  setLoadingUser(false);
};

const forceRefreshUserData = async () => {
  try {
    const token = sessionStorage.getItem('token');
    
    const response = await fetch(`${backendUrl}/api/auth/force-refresh`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    
    if (data.success) {
      
      sessionStorage.setItem('userData', JSON.stringify(data.user));
      refreshPaymentStatus();
      
      // Vérifier expiration directement
      const isExpired = data.user.termsAcceptedDate && new Date() > new Date(new Date(data.user.termsAcceptedDate).setDate(new Date(data.user.termsAcceptedDate).getDate() + 21));
      
      if (isExpired) {
        setShowExpiredModal(true);
      }
    } else {
      console.error('❌ [APP] Échec force refresh:', data);
    }
  } catch (error) {
    console.error('❌ [APP] Erreur force refresh:', error);
  }
};

// Exposez la fonction dans la console globale pour tester
window.forceRefresh = forceRefreshUserData;

  useEffect(() => {
  const handleStorageChange = (e) => {
    if (e.key === 'userData') {
      
      refreshPaymentStatus();
    }
  };

  window.addEventListener('storage', handleStorageChange);
  
  const interval = setInterval(() => {
    const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
    if (userData.termsAccepted === true && !paymentAccepted) {
      refreshPaymentStatus();
    }
  }, 1000); 

  return () => {
    window.removeEventListener('storage', handleStorageChange);
    clearInterval(interval);
  };
}, [paymentAccepted]);

  useEffect(() => {
  if (isAuthenticated && residenceData.residenceName) {
    document.title = `${residenceData.residenceName} - EL BALAS`;
  } else if (isAuthenticated && !residenceData.residenceName) {
    document.title = 'Configuration - EL BALAS';
  } else {
    document.title = 'EL BALAS - Administration';
  }
}, [isAuthenticated, residenceData.residenceName]);

useEffect(() => {
  const handleShowExpiredModal = () => setShowExpiredModal(true);
  window.addEventListener('showExpiredModal', handleShowExpiredModal);
  return () => window.removeEventListener('showExpiredModal', handleShowExpiredModal);
}, []);

useEffect(() => {
  const handleShowExpiredSubscriptionModal = () => setShowExpiredSubscriptionModal(true);
  window.addEventListener('showExpiredSubscriptionModal', handleShowExpiredSubscriptionModal);
  return () => window.removeEventListener('showExpiredSubscriptionModal', handleShowExpiredSubscriptionModal);
}, []);



useEffect(() => {
  if (loadingUser) return;

  const disableAllChecks = sessionStorage.getItem('disableAllExpirationChecks') === 'true';
  if (disableAllChecks) {
    return;
  }
  
  const pathname = window.location.pathname;
  const paymentPaths = ['/paiements', '/paiement/succes', '/paiement/annule'];
  if (paymentPaths.includes(pathname)) {
    return;
  }
  
  const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
  const subscription = userData.subscription || {};
  const maintenant = new Date();

  const hasActiveSubscription = 
    (subscription.monthly && new Date(subscription.monthly) > maintenant) ||
    (subscription.semester && new Date(subscription.semester) > maintenant) ||
    (subscription.annual && new Date(subscription.annual) > maintenant);
  
  if (hasActiveSubscription) {
    return;
  }
  
  const hasSubscription = subscription.monthly || subscription.semester || subscription.annual;
  const isSubscriptionActive = 
    (subscription.monthly && new Date(subscription.monthly) > maintenant) ||
    (subscription.semester && new Date(subscription.semester) > maintenant) ||
    (subscription.annual && new Date(subscription.annual) > maintenant);
  const isSubscriptionExpired = hasSubscription && !isSubscriptionActive;
  
  let isTrialExpired = false;
  if (userData.termsAcceptedDate) {
    const acceptedDate = new Date(userData.termsAcceptedDate);
    const trialEnd = new Date(acceptedDate);
    trialEnd.setDate(trialEnd.getDate() + 21);
    isTrialExpired = new Date() > trialEnd;
  }
  
  if (isSubscriptionExpired) {
    setShowExpiredSubscriptionModal(true);
  } else if (isTrialExpired) {
    setShowExpiredModal(true);
  }
}, [loadingUser]);

useEffect(() => {
  if (!isAuthenticated) return;
  
  let isMounted = true;
  
  const checkForUpdates = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) return;
      
      
      const response = await fetch(`${backendUrl}/api/auth/force-refresh`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (!isMounted) return;
      
      if (data.success) {
        const currentUserData = JSON.parse(sessionStorage.getItem('userData') || '{}');
        const currentSubscription = currentUserData.subscription || {};
        const newSubscription = data.user.subscription || {};
        
        // Vérifier si la date d'abonnement a changé
        const subscriptionChanged = 
          currentSubscription.monthly !== newSubscription.monthly ||
          currentSubscription.semester !== newSubscription.semester ||
          currentSubscription.annual !== newSubscription.annual;
        
        const trialDateChanged = currentUserData.termsAcceptedDate !== data.user.termsAcceptedDate;
        
        if (subscriptionChanged || trialDateChanged) {
          
          sessionStorage.setItem('userData', JSON.stringify(data.user));
          refreshPaymentStatus();
          
          const now = new Date();
          const isSubscriptionExpired = () => {
            if (newSubscription.monthly && new Date(newSubscription.monthly) < now) return true;
            if (newSubscription.semester && new Date(newSubscription.semester) < now) return true;
            if (newSubscription.annual && new Date(newSubscription.annual) < now) return true;
            return false;
          };
          
          const isTrialExpired = data.user.termsAcceptedDate && new Date() > new Date(new Date(data.user.termsAcceptedDate).setDate(new Date(data.user.termsAcceptedDate).getDate() + 21));
          
          if (isSubscriptionExpired()) {
            setShowExpiredSubscriptionModal(true);
          } else if (isTrialExpired) {
            setShowExpiredModal(true);
          }
        } else {
        }
      }
    } catch (error) {
      console.error('❌ [POLLING] Erreur:', error);
    }
  };
  
  // Vérifier toutes les 30 secondes
  const interval = setInterval(checkForUpdates, 30000); // 30 secondes
  
  // Vérifier immédiatement au montage
  checkForUpdates();
  
  return () => {
    isMounted = false;
    clearInterval(interval);
  };
}, [isAuthenticated]);

  useEffect(() => {
    const checkResidence = async () => {
      if (isAuthenticated) {
        try {
          const token = sessionStorage.getItem('token');

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const response = await fetch(`${backendUrl}/api/residence/my-residence`, {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            signal: controller.signal 
          });

          clearTimeout(timeoutId);
          const data = await response.json();
          
          if (data.success && data.residence) {
            setResidenceData(data.residence);
            setShowConfigModal(false);
            setConnectionError(false);
          } else {
            setShowConfigModal(true);
          }
        } catch (error) {
          console.error('❌ [App] Erreur vérification résidence:', error);

          
if (error.name === 'AbortError' || error.message.includes('Failed to fetch')) {
          setConnectionError(true);
          setShowErrorModal(true);
          setShowConfigModal(false);
        } else {
          setShowConfigModal(true);
        }
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    
    checkResidence();
  }, [isAuthenticated]);

  window.refreshAppResidence = async () => {
    const token = sessionStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await fetch(`${backendUrl}/api/residence/my-residence`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.residence) {
        setResidenceData(data.residence);
      }
    } catch (error) {
      console.error('❌ Erreur rafraîchissement:', error);
    }
  };


  const handleLogout = () => {


  sessionStorage.clear();
    


    setIsAuthenticated(false);
  };

  const handleRetryConnection = async () => {
  setShowErrorModal(false);
  setLoading(true);
  setConnectionError(false);
  
  try {
    const token = sessionStorage.getItem('token');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${backendUrl}/api/residence/my-residence`, {
      headers: { 'Authorization': `Bearer ${token}` },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const data = await response.json();
    
    if (data.success && data.residence) {
      setResidenceData(data.residence);
      setShowConfigModal(false);
    } else {
      setShowConfigModal(true);
    }
  } catch (error) {
    console.error('❌ [App] Erreur reconnexion:', error);
    setShowErrorModal(true);
  } finally {
    setLoading(false);
  }
};

  const AdminLayout = ({ children, disableExpirationChecks = false }) => {
  const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
  const subscription = userData.subscription || {};
  const maintenant = new Date();

  // 🔥 PRIORITÉ ABSOLUE À L'ABONNEMENT ACTIF
  const hasActiveSubscription = 
    (subscription.monthly && new Date(subscription.monthly) > maintenant) ||
    (subscription.semester && new Date(subscription.semester) > maintenant) ||
    (subscription.annual && new Date(subscription.annual) > maintenant);

  // 🔥 Si abonnement actif, IGNORER COMPLÈTEMENT L'EXPIRATION
  if (hasActiveSubscription) {
    return (
      <div className="flex h-screen bg-cover bg-center bg-fixed" 
           style={{ 
             backgroundImage: `url(${assets.background})`,
             backgroundSize: 'cover',
             backgroundPosition: 'center',
             backgroundRepeat: 'no-repeat'
           }}>
        <Sidebar onLogout={handleLogout} showExpiredModal={showExpiredModal} />
        <div className="flex-1 flex flex-col md:ml-64">
          <Navbar />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    );
  }

  // 🔥 Si PAS d'abonnement actif, vérifier l'expiration normale
  const hasSubscription = subscription.monthly || subscription.semester || subscription.annual;
  const isSubscriptionActive = 
    (subscription.monthly && new Date(subscription.monthly) > maintenant) ||
    (subscription.semester && new Date(subscription.semester) > maintenant) ||
    (subscription.annual && new Date(subscription.annual) > maintenant);
  const isSubscriptionExpired = hasSubscription && !isSubscriptionActive;

  let isTrialExpired = false;
  if (userData.termsAcceptedDate) {
    const acceptedDate = new Date(userData.termsAcceptedDate);
    const trialEnd = new Date(acceptedDate);
    trialEnd.setDate(trialEnd.getDate() + 21);
    isTrialExpired = new Date() > trialEnd;
  }

  const isExpired = isSubscriptionExpired || isTrialExpired;
  const pathname = window.location.pathname;
  const allowedPaths = ['/paiements', '/paiement/succes', '/paiement/annule', '/parametres'];
  
  useEffect(() => {
  
  if (!disableExpirationChecks && isExpired && !allowedPaths.includes(pathname)) {
    if (isSubscriptionExpired) {
      setShowExpiredSubscriptionModal(true);
    } else {
      setShowExpiredModal(true);
    }
  } else {
  }
}, [pathname, isExpired, isSubscriptionExpired, disableExpirationChecks, isTrialExpired]);
  
  if (!disableExpirationChecks && isExpired && !allowedPaths.includes(pathname)) {
    return null;
  }
  
  return (
    <div className="flex h-screen bg-cover bg-center bg-fixed" 
         style={{ 
           backgroundImage: `url(${assets.background})`,
           backgroundSize: 'cover',
           backgroundPosition: 'center',
           backgroundRepeat: 'no-repeat'
         }}>
      <Sidebar onLogout={handleLogout} showExpiredModal={showExpiredModal} />
      <div className="flex-1 flex flex-col md:ml-64">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

  if ((loading || loadingUser) && isAuthenticated) {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4" />
        <p className="text-gray-600">Chargement de votre profil...</p>
      </div>
    </div>
  );
}

  const termsAccepted = paymentAccepted;


  return (
    <div>
      {!isAuthenticated ? (
        <Routes>
        <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} navigate={navigate} />} />
        <Route path="/forgot-password" element={<ForgotPassword navigate={navigate} />} />
        <Route path="/verify-code" element={<VerifyCode navigate={navigate} />} />
        <Route path="/verify-email" element={<VerifyEmailCode navigate={navigate} setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="/reset-password" element={<ResetPassword navigate={navigate} />} />
        <Route path="/auth/callback" element={<Login setIsAuthenticated={setIsAuthenticated} navigate={navigate} />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
      ) : (
        <>
          <div className={`${showConfigModal ? 'blur-sm pointer-events-none' : ''} transition-all duration-300`}>
            <Routes>
              
              <Route path="/" element={ 
                termsAccepted ? (
                  <AdminLayout>
                    <Dashboard residenceData={residenceData} />
                  </AdminLayout>
                ) : (
                  <Navigate to="/paiements" />
                )
              } />
              
              <Route path="/blocs" element={
                termsAccepted ? (
                  <AdminLayout>
                    <Blocs residenceData={residenceData} />
                  </AdminLayout>
                ) : (
                  <Navigate to="/paiements" />
                )
              } />
              
              <Route path="/appartements" element={
                termsAccepted ? (
                  <AdminLayout>
                    <Appartements residenceData={residenceData} />
                  </AdminLayout>
                ) : (
                  <Navigate to="/paiements" />
                )
              } />

              <Route path="/locataires" element={
    termsAccepted ? (
      <AdminLayout>
        <Locataires residenceData={residenceData} />
      </AdminLayout>
    ) : (
      <Navigate to="/paiements" />
    )
  } />
              
              <Route path="/paiements" element={
                <AdminLayout disableExpirationChecks={true}>
                  <Paiements />
                </AdminLayout>
              } />

              <Route path="/parametres" element={
  <AdminLayout>
    <Parametres />
  </AdminLayout>
} />

              <Route path="/paiement/succes" element={
  <AdminLayout disableExpirationChecks={true}>
    <PaiementSucces />
  </AdminLayout>
} />

<Route path="/paiement/annule" element={
  <AdminLayout disableExpirationChecks={true}>
    <PaiementAnnule />
  </AdminLayout>
} />
              
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
          <ErrorConnectionModal
            isOpen={showErrorModal}
            onClose={() => setShowErrorModal(false)}
            onRetry={handleRetryConnection}
          />

          {showExpiredModal && (
  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowExpiredModal(false)} />
    <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fadeIn">
      <div className="text-center">
        <FaExclamationTriangle className="text-5xl text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Période d'essai expirée
        </h2>
        <p className="text-gray-600 mb-4">
          Votre période d'essai de 21 jours est terminée.
        </p>
        <p className="text-red-600 font-semibold mb-6">
          Veuillez choisir un abonnement pour continuer à utiliser EL BALAS.
        </p>
        <button
          onClick={() => {
            setShowExpiredModal(false);
            navigate('/paiements');
          }}
          className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-semibold transition-colors"
        >
          Choisir un abonnement
        </button>
      </div>
    </div>
  </div>
)}

{showExpiredSubscriptionModal && (
  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowExpiredSubscriptionModal(false)} />
    <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fadeIn">
      <div className="text-center">
        <FaExclamationTriangle className="text-5xl text-orange-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Abonnement expiré
        </h2>
        <p className="text-gray-600 mb-4">
          Votre abonnement a expiré.
        </p>
        <p className="text-orange-600 font-semibold mb-6">
          Veuillez renouveler votre abonnement pour continuer à utiliser EL BALAS.
        </p>
        <button
          onClick={() => {
            setShowExpiredSubscriptionModal(false);
            navigate('/paiements');
          }}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold transition-colors"
        >
          Renouveler mon abonnement
        </button>
      </div>
    </div>
  </div>
)}

          {showConfigModal && (
            <div className="fixed inset-0 flex items-center justify-center z-50">
              <div className="absolute inset-0 bg-black/50" />
              <ConfigModal3D 
                setShowConfigModal={setShowConfigModal}
                setIsFirstTime={() => setShowConfigModal(false)}
                setResidenceData={setResidenceData}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </Router>
  );
}


export default App;