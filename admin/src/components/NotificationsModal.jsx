// Dans NotificationsModal.jsx, remplace le fetch par ceci :

import React, { useState, useEffect } from 'react';
import { FaTimes, FaBell, FaCheck, FaTrash, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { backendUrl } from '../App';
import { useNotifications } from '../contexts/NotificationContext';

const NotificationsModal = ({ isOpen, onClose }) => {
  const [allNotifications, setAllNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  
  const { notifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');

  const fetchNotifications = async (pageNum = 1) => {
    setLoading(true);
    try {
      const userNotifications = notifications.filter(n => n.userId === userData.id);
      
      if (pageNum === 1 && userNotifications.length > 0) {
        setAllNotifications(userNotifications.slice(0, 50));
        setTotal(userNotifications.length);
        setTotalPages(Math.ceil(userNotifications.length / 50));
        setLoading(false);
        return;
      }
      
      // Sinon, aller chercher dans le backend
      const token = sessionStorage.getItem('token');
      
      const response = await fetch(
        `${backendUrl}/api/notifications/paginated?page=${pageNum}&limit=50`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      const data = await response.json();
      
      if (data.success) {
        setAllNotifications(data.notifications);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('❌ Erreur chargement notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshNotifications = async () => {
  try {
    const token = sessionStorage.getItem('token');
    const response = await fetch(`${backendUrl}/api/notifications/paginated?page=1&limit=50`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    
    if (data.success) {
      setAllNotifications(data.notifications);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setPage(1);
    }
  } catch (error) {
    console.error('❌ Erreur rafraîchissement:', error);
  }
};


  // Tout effacer
  const handleDeleteAll = async () => {
    if (!window.confirm('⚠️ Êtes-vous sûr de vouloir supprimer TOUTES les notifications ?')) return;
    
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${backendUrl}/api/notifications/all`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (data.success) {
        alert(`✅ ${data.deletedCount} notifications supprimées`);

        await refreshNotifications();
        window.dispatchEvent(new Event('notifications-updated'));
        
      }
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
    }
  };

  // Charger au montage
  useEffect(() => {
    if (isOpen) {
      fetchNotifications(1);
    }
  }, [isOpen, notifications]); // ← Ajoute notifications comme dépendance

  // Formater la date
  const formatDateTime = (dateStr, timeStr) => {
    return `${dateStr} à ${timeStr}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-white px-6 py-4 rounded-t-2xl flex justify-between items-center">
          <div className="flex items-center gap-3">
            <FaBell size={24} />
            <h2 className="text-2xl font-bold">Toutes les notifications</h2>
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
              Total: {total}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <FaTimes size={24} />
          </button>
        </div>

        {/* Actions */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={markAllAsRead}
              className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm flex items-center gap-2 transition-colors"
            >
              <FaCheck size={12} />
              Tout marquer comme lu
            </button>
            <button
              onClick={handleDeleteAll}
              className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm flex items-center gap-2 transition-colors"
            >
              <FaTrash size={12} />
              Tout effacer
            </button>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setPage(p => Math.max(1, p - 1));
                  fetchNotifications(page - 1);
                }}
                disabled={page === 1}
                className="p-1.5 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50 transition-colors"
              >
                <FaChevronLeft size={14} />
              </button>
              <span className="text-sm text-gray-600">
                Page {page} / {totalPages}
              </span>
              <button
                onClick={() => {
                  setPage(p => Math.min(totalPages, p + 1));
                  fetchNotifications(page + 1);
                }}
                disabled={page === totalPages}
                className="p-1.5 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50 transition-colors"
              >
                <FaChevronRight size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Liste des notifications */}
        <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500" />
            </div>
          ) : allNotifications.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {allNotifications.map((notif) => (
                <div
                  key={notif._id}
                  className={`p-4 hover:bg-gray-50 transition-colors relative group ${
                    !notif.read ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-gray-800 font-medium">{notif.message}</p>
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
                              <p>📅 {new Date(notif.details.dateArrivee).toLocaleDateString('fr-FR')}</p>
                            </>
                          ) : notif.type === 'suppression' ? (
                            <>
                              <p className="font-medium text-red-600">Suppression</p>
                              <p>Bloc {notif.details.bloc} • App {notif.details.appartement}</p>
                              <p>🗑️ {new Date(notif.details.dateSuppression).toLocaleDateString('fr-FR')}</p>
                            </>
                          ) : (
                            <>
                              <p>Bloc {notif.details.bloc} • App {notif.details.appartement}</p>
                              <p>📍 {new Date(notif.details.dateArrivee).toLocaleDateString('fr-FR')}</p>
                            </>
                          )}
                          
                          <div className={`flex items-center justify-between mt-1 pt-1 border-t border-gray-200 ${
                            notif.details.estPaye ? 'text-green-600' : 'text-yellow-600'
                          }`}>
                            <span>{notif.details.estPaye ? '✓ Payé' : '⏳ Non payé'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 ml-2">
                      {!notif.read && (
                        <button
                          onClick={() => markAsRead(notif._id)}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded opacity-0 group-hover:opacity-100 transition-all"
                          title="Marquer comme lu"
                        >
                          <FaCheck size={12} />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notif._id)}
                        className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100 transition-all"
                        title="Supprimer"
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <FaBell className="mx-auto text-5xl text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">Aucune notification</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
          Affichage des {allNotifications.length} dernières notifications sur {total} au total
        </div>
      </div>
    </div>
  );
};

export default NotificationsModal;