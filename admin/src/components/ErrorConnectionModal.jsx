import React from 'react';
import { FaExclamationTriangle, FaSync, FaSignOutAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const ErrorConnectionModal = ({ isOpen, onClose, onRetry }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleLogout = () => {
    // Déconnexion
    sessionStorage.removeItem('isAdminLoggedIn');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userData');
    
    // Redirection vers login
    navigate('/login');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header avec gradient rouge */}
        <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-6 py-4 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <FaExclamationTriangle className="text-3xl" />
            <h2 className="text-2xl font-bold">Erreur de connexion</h2>
          </div>
        </div>

        <div className="p-6">
          {/* Message d'erreur */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <FaExclamationTriangle className="text-red-500 text-4xl" />
              </div>
            </div>
            <p className="text-gray-700 mb-2 text-lg">
              Impossible de se connecter au serveur.
            </p>
            <p className="text-sm text-gray-500">
              Vérifiez votre connexion internet ou réessayez plus tard.
            </p>
          </div>

          {/* Boutons d'action - SIMPLIFIÉS */}
          <div className="space-y-3">
            <button
              onClick={handleRefresh}
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-white py-3 rounded-lg font-semibold hover:from-yellow-600 hover:to-yellow-700 transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <FaSync className="text-lg" />
              Rafraîchir la page
            </button>
            
            <button
              onClick={handleLogout}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2"
            >
              <FaSignOutAlt className="text-lg" />
              Se déconnecter
            </button>
          </div>

          {/* Note pour l'admin */}
          <p className="text-xs text-gray-400 text-center mt-4">
            Si le problème persiste, vérifiez que le serveur backend est bien lancé.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ErrorConnectionModal;