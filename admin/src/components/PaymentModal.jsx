import React, { useState } from 'react';
import { FaTimes, FaCheckCircle, FaShieldAlt, FaClock } from 'react-icons/fa';
import { backendUrl } from '../App';

const PaymentModal = ({ isOpen, onClose, onAccept }) => {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  
  if (!isOpen) return null;

const handleAccept = async () => {
  if (!acceptedTerms || !acceptedPrivacy) return;

  
  const token = sessionStorage.getItem('token');
  const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
  
  
  setIsSubmitting(true);
  
  try {
    const response = await fetch(`${backendUrl}/api/auth/accept-terms`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    
    if (data.success) {
      userData.termsAccepted = true;
      userData.termsAcceptedDate = data.termsAcceptedDate;
      sessionStorage.setItem('userData', JSON.stringify(userData));
            
          
      onAccept();
    } else {
      alert('Erreur: ' + data.message);
    }
  } catch (error) {
    console.error('❌ Erreur acceptation termes:', error);
    alert('Erreur lors de l\'acceptation. Veuillez réessayer.');
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fadeIn">
        
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FaShieldAlt className="text-2xl mr-3" />
              <h2 className="text-2xl font-bold">Bienvenue sur EL BALAS</h2>
            </div>
          </div>
        </div>

        <div className="p-6">
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <FaClock className="text-green-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <p className="text-green-800 font-semibold"> 21 jours d'essai gratuit !</p>
                <p className="text-sm text-green-700 mt-1">
                  Profitez de toutes les fonctionnalités d'EL BALAS pendant 21 jours sans aucun paiement.
                  Après cette période, un abonnement sera nécessaire pour continuer à utiliser le service.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 text-gray-600 text-sm">
            <p>
              <FaCheckCircle className="inline text-green-500 mr-2" />
              Accès à toutes les fonctionnalités pendant 21 jours
            </p>
            
            <p>
              <FaCheckCircle className="inline text-green-500 mr-2" />
              Gestion complète de votre résidence
            </p>
            
            <p>
              <FaCheckCircle className="inline text-green-500 mr-2" />
              Support technique disponible
            </p>
            
            <p>
              <FaCheckCircle className="inline text-green-500 mr-2" />
              Sans engagement, résiliable à tout moment
            </p>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-bold text-gray-800 mb-2">Après l'essai gratuit</h4>
            <p className="text-sm text-gray-600">
              À l'issue des 21 jours, vous pourrez choisir parmi nos différents plans d'abonnement 
              pour continuer à utiliser EL BALAS sans interruption.
            </p>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
  <p className="text-sm text-gray-700 leading-relaxed">
    <span className="font-semibold text-blue-700">💰 Paiement sécurisé via DHMAD.tn</span><br />
    Pour souscrire à un abonnement, vous devrez d'abord créer un compte sur la plateforme <span className="font-medium">DHMAD.tn</span>, 
    où vous pourrez déposer vos fonds en toute sécurité. Une fois votre compte approvisionné, vous pourrez utiliser cet espace 
    pour régler vos abonnements mensuels, semestriels ou annuels. DHMAD.tn garantit des transactions 100% sécurisées et 
    conformes aux normes tunisiennes (e-DINAR, cartes bancaires).
  </p>
</div>

          <div className="space-y-3 border-t border-gray-200 mt-6 pt-4">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
              />
              <span className="text-sm text-gray-600">
                J'accepte les <span className="text-yellow-600 font-semibold">conditions générales d'utilisation</span> et je reconnais avoir pris connaissance de la période d'essai de 21 jours.
              </span>
            </label>

            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedPrivacy}
                onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                className="mt-1 w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
              />
              <span className="text-sm text-gray-600">
                J'accepte la <span className="text-yellow-600 font-semibold">politique de confidentialité</span> et le traitement de mes données personnelles.
              </span>
            </label>
          </div>

          {/* Bouton */}
          <button
  onClick={handleAccept}
  disabled={!acceptedTerms || !acceptedPrivacy || isSubmitting}
  className={`w-full mt-6 py-3 rounded-lg font-semibold transition-colors ${
    acceptedTerms && acceptedPrivacy && !isSubmitting
      ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
  }`}
>
  {isSubmitting ? (
    <div className="flex items-center justify-center gap-2">
      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
      <span>Enregistrement...</span>
    </div>
  ) : (
    'Commencer mon essai gratuit de 21 jours'
  )}
</button>

          <p className="text-center text-xs text-gray-400 mt-4">
            En cliquant, vous acceptez nos conditions générales.
          </p>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-2xl">
          <p className="text-center text-xs text-gray-500">
            © 2026 EL BALAS. Essai gratuit de 21 jours - Sans engagement.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default PaymentModal;