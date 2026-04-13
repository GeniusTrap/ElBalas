import React, { useState, useEffect } from 'react';
import { FaBell, FaCheck, FaTrash, FaMoneyBillWave, FaMoneyBillAlt } from 'react-icons/fa';
import { assets } from '../assets/assets';
import { useNotifications } from '../contexts/NotificationContext';
import NotificationsModal from './NotificationsModal';

const Navbar = () => {
  const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAllNotifications, setShowAllNotifications] = useState(false);  
  
  const subscription = userData.subscription || {};
const maintenant = new Date();

const hasActiveSubscription = 
  (subscription.monthly && new Date(subscription.monthly) > maintenant) ||
  (subscription.semester && new Date(subscription.semester) > maintenant) ||
  (subscription.annual && new Date(subscription.annual) > maintenant);

let isTrialExpired = false;
if (!hasActiveSubscription && userData.termsAcceptedDate) {
  const acceptedDate = new Date(userData.termsAcceptedDate);
  const trialEnd = new Date(acceptedDate);
  trialEnd.setDate(trialEnd.getDate() + 21);
  isTrialExpired = new Date() > trialEnd;
}

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

  
  const { notifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const residenceData = JSON.parse(sessionStorage.getItem('residenceData') || '{}');
  const residenceName = residenceData.residenceName || 'EL BALAS';

  const getPageTitle = () => {
    const path = location.pathname;
    
    switch(path) {
      case '/':
        return `Dashboard ${residenceName}`;
      case '/blocs':
        return `Blocs ${residenceName}`;
      case '/appartements':
        return `Appartements ${residenceName}`;
      case '/locataires':
        return `Locataires ${residenceName}`;
      case '/paiements':
        return `Paiements ${residenceName}`;
      case '/parametres':
        return `Paramètres ${residenceName}`;
      default:
        return `Dashboard ${residenceName}`;
    }
  };

  const pageTitle = getPageTitle();

  const userNotifications = notifications.filter(n => n.userId === userData.id);
  const userUnreadCount = userNotifications.filter(n => !n.read).length;

  useEffect(() => {
    const otherNotifications = notifications.filter(n => n.userId && n.userId !== userData.id);
        
    if (otherNotifications.length > 0) {

    }
  }, [notifications, userData.id, userNotifications.length]);

  const formatDateTime = (dateStr, timeStr) => {
    return `${dateStr} à ${timeStr}`;
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 py-2 px-3 md:py-4 md:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-base md:text-xl font-bold text-gray-800 ml-12 md:ml-0 truncate max-w-[180px] md:max-w-none">
          {pageTitle}
        </h1>
        
        <div className="flex items-center space-x-2 md:space-x-4">
          <div className="relative">
            <button
  onClick={() => {
    if (isSubscriptionExpired()) {
    window.dispatchEvent(new CustomEvent('showExpiredSubscriptionModal'));
    return;
  }
  
    if (isTrialExpired) {
      window.dispatchEvent(new CustomEvent('showExpiredModal'));
      return;
    }
    setShowNotifications(!showNotifications);
  }}
  className="relative p-1.5 md:p-2 text-gray-600 hover:text-yellow-600 hover:bg-gray-100 rounded-full transition-colors"
>
              <FaBell size={20} />

              {userUnreadCount > 0 && ( 
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] md:text-xs rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center animate-pulse">
                  {userUnreadCount}  
                </span>
              )}
            </button>

            {showNotifications && (
              <>
                <div 
                  className="fixed inset-0 z-[60]"
                  onClick={() => setShowNotifications(false)}
                />
                <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] md:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-[70]">
                  <div className="p-3 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-800">Notifications</h3>
                    <div className="flex items-center gap-2">
                      {userUnreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <FaCheck size={12} />
                          Tout marquer comme lu
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
  {userNotifications.length > 0 ? (
    userNotifications.map((notif) => {
      if (notif.type === 'retard_paiement') {
      }
      
      return (
        <div
          key={notif._id || notif.id}
          className={`p-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors relative group ${
            !notif.read ? 'bg-blue-50' : ''
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="text-sm text-gray-800 font-medium">
                {notif.message}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatDateTime(notif.date, notif.time)}
              </p>
              
              {notif.details && (
  <div className="mt-2 text-xs text-gray-600 bg-gray-100 p-2 rounded space-y-1">
    {notif.type === 'transfert' ? (
      <>
        <p className="font-medium text-blue-600">Transfert</p>
        <p>De {notif.details.sourceBloc} • {notif.details.sourceAppart}</p>
        <p>Vers {notif.details.destBloc} • {notif.details.destAppart}</p>
        <p>📅 Transfert : {new Date(notif.details.dateArrivee).toLocaleDateString('fr-FR')}</p>
        <p className="capitalize">🏠 {notif.details.typeOccupation}</p>
      </>
      
    ) : notif.type === 'suppression' ? (
      <>
        <p className="font-medium text-red-600">Suppression</p>
        <p>Bloc {notif.details.bloc} • App {notif.details.appartement}</p>
        <p>🗑️ Supprimé le : {new Date(notif.details.dateSuppression).toLocaleDateString('fr-FR')}</p>
        <p className="capitalize">🏠 {notif.details.typeOccupation}</p>
      </>
      ) : notif.type === 'retard_paiement' ? (
      <>
        <p className="font-medium text-red-600">⚠️ RETARD DE PAIEMENT</p>
        <p>Appartement {notif.details.appartement}</p>
        <p>Période #{notif.details.periode} en retard</p>
        <p>📅 Depuis le : {new Date(notif.details.dateRetard).toLocaleDateString('fr-FR')}</p>
        <div className="flex items-center justify-between mt-1 pt-1 border-t border-gray-200 text-red-600">
          <span className="text-xs font-medium">⏰ Action requise !</span>
        </div>
      </>
    ) : (
      <>
        <p>Bloc {notif.details.bloc} • App {notif.details.appartement}</p>
        <p>📍 Arrivée : {new Date(notif.details.dateArrivee).toLocaleDateString('fr-FR')}</p>
        {notif.details.datePaiement && (
          <p>💰 Paiement : {new Date(notif.details.datePaiement).toLocaleDateString('fr-FR')}</p>
        )}
        <p className="capitalize">🏠 {notif.details.typeOccupation}</p>
      </>
    )}
    
    <div className={`flex items-center justify-between mt-1 pt-1 border-t border-gray-200 ${
      notif.details.estPaye ? 'text-green-600' : 'text-yellow-600'
    }`}>
      <span className="text-xs font-medium">
        {notif.details.estPaye ? '✓ Payé' : '⏳ Non payé'}
      </span>
    </div>
  </div>
)}
                            </div>
                            
                            <div className="flex items-center gap-1 ml-2">
                              {!notif.read && (
                                <button
                                  onClick={() => markAsRead(notif._id || notif.id)}
                                  className="p-1 text-blue-600 hover:text-blue-800 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Marquer comme lu"
                                >
                                  <FaCheck size={12} />
                                </button>
                              )}
                              <button
                                onClick={() => deleteNotification(notif._id || notif.id)}
                                className="p-1 text-red-600 hover:text-red-800 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Supprimer"
                              >
                                <FaTrash size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
      );
})
                    ) : (
                      <div className="p-8 text-center text-gray-500">
                        <FaBell className="mx-auto text-3xl mb-2 text-gray-300" />
                        <p>Aucune notification</p>
                      </div>
                    )}
                  </div>
                  
                  {userNotifications.length > 0 && (  
                    <div className="p-2 border-t border-gray-200">
                      <button 
                        onClick={() => {
                          setShowNotifications(false);
                          setShowAllNotifications(true);
                        }}
                        className="w-full text-center text-sm text-yellow-600 hover:text-yellow-700 py-1"
                      >
                        Voir toutes les notifications
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="hidden md:flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center text-white font-semibold">
              {userData.name ? userData.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="text-sm">
              <p className="text-gray-800 font-medium">{userData.name || 'Admin'}</p>
              <p className="text-gray-500 text-xs">{userData.email || 'admin@elbalas.com'}</p>
            </div>
          </div>
        </div>
        <NotificationsModal 
          isOpen={showAllNotifications}
          onClose={() => setShowAllNotifications(false)}
        />
      </div>
    </nav>
  );
};

export default Navbar;