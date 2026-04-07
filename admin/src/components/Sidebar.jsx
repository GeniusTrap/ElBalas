import React, { useState } from 'react';
import { FaHome, FaBuilding, FaDoorOpen, FaUsers, FaMoneyBill, FaCog, FaBars, FaTimes, FaSignOutAlt } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import { assets } from '../assets/assets';

const Sidebar = ({ onLogout, showExpiredModal }) => {  
  console.log('📁 [Sidebar] RENDER COMPLET - pathname:', window.location.pathname);
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
  const hasAcceptedTerms = userData.termsAccepted === true;

  const isActive = (path) => location.pathname === path;

  const isTrialExpired = () => {
  const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');

  
  const subscription = userData.subscription || {};
  const maintenant = new Date();
  
  const hasActiveSubscription = 
    (subscription.monthly && new Date(subscription.monthly) > maintenant) ||
    (subscription.semester && new Date(subscription.semester) > maintenant) ||
    (subscription.annual && new Date(subscription.annual) > maintenant);

  
  // Si abonnement actif → ignorer complètement l'essai
  if (hasActiveSubscription) {
    return false;
  }
  

  if (!userData.termsAcceptedDate) return false;
  
  const acceptedDate = new Date(userData.termsAcceptedDate);
  const trialEnd = new Date(acceptedDate);
  trialEnd.setDate(trialEnd.getDate() + 21);
  const isExpired = new Date() > trialEnd;

  
  return isExpired;
};

const isSubscriptionExpired = () => {
  const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
  const subscription = userData.subscription || {};
  const maintenant = new Date();

  
  const hasSubscription = subscription.monthly || subscription.semester || subscription.annual;
  if (!hasSubscription) {
    return false;
  }
  
  const isActive = 
    (subscription.monthly && new Date(subscription.monthly) > maintenant) ||
    (subscription.semester && new Date(subscription.semester) > maintenant) ||
    (subscription.annual && new Date(subscription.annual) > maintenant);
  
   const result = hasSubscription && !isActive;
  
  return result;
};

  const handleNavigation = (path) => {
    console.log('📁 [Sidebar] handleNavigation appelé vers:', path, 'pathname actuel:', window.location.pathname);
  const allowedPaths = ['/paiements', '/paiement/succes', '/paiement/annule', '/parametres'];

  const currentPath = window.location.pathname;
    const paymentPaths = ['/paiements', '/paiement/succes', '/paiement/annule'];
    
    if (paymentPaths.includes(currentPath)) {
      console.log('🚫 [Sidebar] Sur page paiement - Navigation directe sans modal vers:', path);
      navigate(path);
      return;
    }

  const subscriptionExpired = isSubscriptionExpired();
  const trialExpired = isTrialExpired();

  console.log('📁 [Sidebar] subscriptionExpired:', subscriptionExpired, 'trialExpired:', trialExpired);
  

  if (subscriptionExpired && !allowedPaths.includes(path)) {
    console.log('🚨 [Sidebar] Déclenchement modal ORANGE');
    window.dispatchEvent(new CustomEvent('showExpiredSubscriptionModal'));
    return;
  }
  
  if (isTrialExpired() && !allowedPaths.includes(path)) {
    console.log('🚨 [Sidebar] Déclenchement modal ROUGE');
    window.dispatchEvent(new CustomEvent('showExpiredModal'));
    return;
  }
  navigate(path);
};

  const menuItems = [
    { path: '/', label: 'Tableau de bord', icon: FaHome },
    { path: '/blocs', label: 'Mes Blocs', icon: FaBuilding },
    { path: '/appartements', label: 'Mes Appartements', icon: FaDoorOpen },
    { path: '/locataires', label: 'Locataires', icon: FaUsers },
    { path: '/paiements', label: 'Paiements', icon: FaMoneyBill },
    { path: '/parametres', label: 'Paramètres', icon: FaCog },
  ];

  return (
    <>
      {!isMobileOpen && hasAcceptedTerms && !showExpiredModal && (
        <button
          onClick={() => setIsMobileOpen(true)}
          className="md:hidden fixed top-4 left-4 z-[201] p-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-full shadow-lg hover:scale-110 transition-transform"
        >
          <FaBars size={20} />
        </button>
      )}

      {/* Sidebar Desktop */}
      <div className="hidden md:flex md:flex-col w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white h-full shadow-xl fixed left-0 top-0">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-center">
            <img 
              src={assets.elbalas} 
              alt="EL BALAS" 
              className="h-12 w-auto"
            />
          </div>
          <p className="text-gray-400 text-sm text-center mt-2">Administration</p>
        </div>

        {/* Menu items - prend tout l'espace disponible */}
        <div className="flex-1 py-6">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className={`w-full flex items-center px-6 py-4 hover:bg-gray-700 transition-colors ${
                isActive(item.path) ? 'border-l-4 border-yellow-500 bg-gray-800' : ''
              }`}
            >
              <item.icon className="text-xl mr-4" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Bouton Logout en bas */}
        <div className="border-t border-gray-700 p-4">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md"
          >
            <FaSignOutAlt className="text-lg" />
            <span className="font-medium">Déconnexion</span>
          </button>
        </div>
      </div>

      <div className={`
  md:hidden fixed inset-0 z-[200] transform transition-transform duration-300 ease-in-out
  ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
`}>
  <div className="relative w-full h-full bg-gradient-to-b from-gray-900 to-gray-800 text-white shadow-xl flex flex-col">
    {/* En-tête centré */}
    <div className="p-6 border-b border-gray-700 relative">
      <div className="flex flex-col items-center justify-center text-center">
        <img 
          src={assets.elbalas} 
          alt="EL BALAS" 
          className="h-10 w-auto"
        />
        <p className="text-gray-400 text-xs mt-1">Administration</p>
      </div>
      <button
        onClick={() => setIsMobileOpen(false)}
        className="absolute top-4 right-4 p-2 hover:bg-gray-700 rounded-lg"
      >
        <FaTimes size={20} />
      </button>
    </div>

    {/* Menu items centrés */}
    <div className="flex-1 flex flex-col items-center justify-start pt-4">
      {menuItems.map((item) => (
        <button
  key={item.path}
  onClick={() => {
    handleNavigation(item.path);
    setIsMobileOpen(false);
  }}
  className={`w-full flex items-center justify-center py-4 hover:bg-gray-700 transition-colors ${
    isActive(item.path) ? 'border-l-4 border-yellow-500 bg-gray-800' : ''
  }`}
>
          <item.icon className="text-xl mr-4" />
          <span className="font-medium">{item.label}</span>
        </button>
      ))}
    </div>

    {/* Bouton Logout centré */}
    <div className="border-t border-gray-700 p-4">
      <button
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md"
      >
        <FaSignOutAlt className="text-lg" />
        <span className="font-medium">Déconnexion</span>
      </button>
    </div>
  </div>
</div>
    </>
  );
};

export default Sidebar;