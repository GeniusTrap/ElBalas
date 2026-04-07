import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { backendUrl } from '../App';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastCheck, setLastCheck] = useState(Date.now());
  
  // Récupérer l'utilisateur actuel
  const getCurrentUser = () => {
    return JSON.parse(sessionStorage.getItem('userData') || '{}');
  };

    // Charger les notifications depuis le backend
  useEffect(() => {
    const fetchNotifications = async () => {
      const currentUser = getCurrentUser();
      
      if (!currentUser.id) {
        return;
      }
      
      try {
        const token = sessionStorage.getItem('token');
        
        const response = await fetch(`${backendUrl}/api/notifications`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.success) {
          const retards = data.notifications.filter(n => n.type === 'retard_paiement');
          if (retards.length > 0) {
          } else {
          }
          setNotifications(data.notifications);
        }
      } catch (error) {
        console.error('❌ [FRONTEND] Erreur chargement notifications:', error);
      }
    };

    fetchNotifications();
    
    // ✅ AJOUTE L'INTERVALLE ICI
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Mettre à jour unreadCount à chaque changement
  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  // Écouter les événements de mise à jour
  useEffect(() => {
    const handleNotificationsUpdate = () => {
      const fetchNotifications = async () => {
        const currentUser = getCurrentUser();
        if (!currentUser.id) return;
        
        try {
          const token = sessionStorage.getItem('token');
          const response = await fetch(`${backendUrl}/api/notifications`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();
          if (data.success) {
            setNotifications(data.notifications);
          }
        } catch (error) {
          console.error('❌ Erreur rechargement:', error);
        }
      };
      
      fetchNotifications();
    };

    window.addEventListener('notifications-updated', handleNotificationsUpdate);
    
    return () => {
      window.removeEventListener('notifications-updated', handleNotificationsUpdate);
    };
  }, []);


  // Ajouter une notification
  const addNotification = async (type, data) => {
    const currentUser = getCurrentUser();
    
    
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const timeStr = now.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    let message = '';
    let details = {};

    // Construction du message selon le type
    if (type === 'ajout') {
      if (data.type === 'famille') {
        message = `Nouvelle famille ${data.nomFamille} (${data.nombreMembres} pers.)`;
      } else {
        const premierMembre = data.membres[0];
        message = `Nouveau locataire ${premierMembre?.prenom} ${premierMembre?.nom}`;
        if (data.membres.length > 1) {
          message += ` et ${data.membres.length - 1} autre(s)`;
        }
      }
      
      details = {
        bloc: data.blocNom,
        appartement: data.appartementNom,
        typeOccupation: data.typeOccupation,
        dateArrivee: data.dateArrivee,
        datePaiement: data.datePaiement,
        estPaye: !!data.datePaiement,
        montant: data.montant || null
      };
    }
    
    else if (type === 'transfert') {
      if (data.type === 'famille') {
        message = `Famille ${data.nomFamille} transférée (${data.nombreMembres} pers.)`;
      } else {
        if (data.nombreMembres === 1 && data.nomMembre) {
          message = `${data.nomMembre} transféré(e)`;
        } else {
          message = `${data.nombreMembres} locataires transférés`;
        }
      }
      
      details = {
        sourceBloc: data.sourceBloc,
        sourceAppart: data.sourceAppart,
        destBloc: data.destBloc,
        destAppart: data.destAppart,
        typeOccupation: data.typeOccupation,
        dateArrivee: data.dateArrivee,
        datePaiement: data.datePaiement,
        estPaye: !!data.datePaiement,
        nomFamille: data.nomFamille
      };
    }

    else if (type === 'suppression') {
      if (data.type === 'famille') {
        message = `Famille ${data.nomFamille} supprimée (${data.nombreMembres} pers.)`;
      } else {
        if (data.nombreMembres === 1 && data.nomMembre) {
          message = `${data.nomMembre} supprimé(e)`;
        } else {
          message = `${data.nombreMembres} locataires supprimés`;
        }
      }
      
      details = {
        bloc: data.bloc,
        appartement: data.appartement,
        typeOccupation: data.typeOccupation || 'location',
        dateSuppression: new Date().toISOString().split('T')[0],
        estPaye: false,
        nomFamille: data.nomFamille
      };
    }

    else if (type === 'paiement') {
      if (data.type === 'famille') {
        message = `Paiement reçu pour la famille ${data.nomFamille}`;
      } else {
        if (data.nombreMembres === 1 && data.nomMembre) {
          message = `Paiement reçu pour ${data.nomMembre}`;
        } else {
          message = `Paiement reçu pour ${data.nombreMembres} locataires`;
        }
      }
      
      details = {
        bloc: data.bloc,
        appartement: data.appartement,
        typeOccupation: data.typeOccupation || 'location',
        datePaiement: data.datePaiement,
        dateArrivee: data.dateArrivee,
        montant: data.montant || null,
        estPaye: true
      };
    } else if (type === 'retard_paiement') {
  message = data.message;
  details = data.details;
}

    const newNotification = {
      type,
      message,
      details,
      date: dateStr,
      time: timeStr,
      timestamp: now.toISOString(),
      read: false
    };

    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${backendUrl}/api/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newNotification)
      });

      const result = await response.json();
      
      if (result.success) {
        setNotifications(prev => [result.notification, ...prev]);
      }
    } catch (error) {
      console.error('❌ Erreur sauvegarde notification:', error);
    }
  };

  // Marquer comme lu
  const markAsRead = async (id) => {
    const currentUser = getCurrentUser();
    
    try {
      const token = sessionStorage.getItem('token');
      await fetch(`${backendUrl}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('❌ Erreur markAsRead:', error);
    }
  };

  // Marquer tout comme lu
  const markAllAsRead = async () => {
    const currentUser = getCurrentUser();
    
    try {
      const token = sessionStorage.getItem('token');
      await fetch(`${backendUrl}/api/notifications/read-all`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
    } catch (error) {
      console.error('❌ Erreur markAllAsRead:', error);
    }
  };

  // Supprimer une notification
  const deleteNotification = async (id) => {
    const currentUser = getCurrentUser();
    
    try {
      const token = sessionStorage.getItem('token');
      await fetch(`${backendUrl}/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (error) {
      console.error('❌ Erreur deleteNotification:', error);
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      lastCheck
    }}>
      {children}
    </NotificationContext.Provider>
  );
};