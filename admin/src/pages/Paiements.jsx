import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PaymentModal from '../components/PaymentModal';
import { assets } from '../assets/assets';
import { FaMoneyBillWave, FaCreditCard, FaBuilding, FaCheckCircle, FaClock, FaExclamationTriangle, FaCrown } from 'react-icons/fa';
import { backendUrl } from '../App';

const useTempsRestantEssai = () => {
  const [tempsRestant, setTempsRestant] = useState({
    jours: 0,
    heures: 0,
    minutes: 0,
    secondes: 0
  });

  useEffect(() => {
    const calculerTempsRestant = () => {
      const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
      
      if (!userData.termsAcceptedDate) {
        setTempsRestant({ jours: 0, heures: 0, minutes: 0, secondes: 0 });
        return;
      }
      
      const acceptedDate = new Date(userData.termsAcceptedDate);
      const trialEnd = new Date(acceptedDate);
      trialEnd.setDate(trialEnd.getDate() + 21);
      const maintenant = new Date();
      const diffSeconds = Math.max(0, Math.floor((trialEnd - maintenant) / 1000));
      
      setTempsRestant({
        jours: Math.floor(diffSeconds / 86400),
        heures: Math.floor((diffSeconds % 86400) / 3600),
        minutes: Math.floor((diffSeconds % 3600) / 60),
        secondes: diffSeconds % 60
      });
    };
    
    calculerTempsRestant();
    const interval = setInterval(calculerTempsRestant, 1000);
    return () => clearInterval(interval);
  }, []);
  
  return tempsRestant;
};

const useTempsRestantAbonnement = () => {
  const [tempsRestant, setTempsRestant] = useState({
    jours: 0,
    heures: 0,
    minutes: 0,
    secondes: 0,
    planActif: null,
    dateFin: null
  });

  useEffect(() => {
    const calculerTempsRestant = () => {
      const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
      const subscription = userData.subscription || {};
      
      let planActif = null;
      let dateFin = null;
      const maintenant = new Date();
      
      if (subscription.annual && new Date(subscription.annual) > maintenant) {
        planActif = 'annual';
        dateFin = new Date(subscription.annual);
      } else if (subscription.semester && new Date(subscription.semester) > maintenant) {
        planActif = 'semester';
        dateFin = new Date(subscription.semester);
      } else if (subscription.monthly && new Date(subscription.monthly) > maintenant) {
        planActif = 'monthly';
        dateFin = new Date(subscription.monthly);
      }
      
      if (!planActif || !dateFin) {
        setTempsRestant({
          jours: 0, heures: 0, minutes: 0, secondes: 0,
          planActif: null, dateFin: null
        });
        return;
      }
      
      const diffSeconds = Math.max(0, Math.floor((dateFin - maintenant) / 1000));
      
      setTempsRestant({
        jours: Math.floor(diffSeconds / 86400),
        heures: Math.floor((diffSeconds % 86400) / 3600),
        minutes: Math.floor((diffSeconds % 3600) / 60),
        secondes: diffSeconds % 60,
        planActif: planActif,
        dateFin: dateFin
      });
    };
    
    calculerTempsRestant();
    const interval = setInterval(calculerTempsRestant, 1000);
    return () => clearInterval(interval);
  }, []);
  
  return tempsRestant;
};

const Paiements = () => {
  const userDataForLog = JSON.parse(sessionStorage.getItem('userData') || '{}');
  const [showPaymentModal, setShowPaymentModal] = useState(() => {
  const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
  // Ouvre le modal SEULEMENT si les termes ne sont pas acceptés
  return !userData.termsAccepted;
});
  const [selectedPlan, setSelectedPlan] = useState(null);  
  const [showBankDetails, setShowBankDetails] = useState(false);  
  const [paymentStatus, setPaymentStatus] = useState('pending'); 
  const tempsRestant = useTempsRestantEssai();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const tempsRestantAbonnement = useTempsRestantAbonnement();
  const hasActiveSubscription = tempsRestantAbonnement.planActif !== null;
  const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
  const termsAccepted = userData.termsAccepted === true;


  // Récupérer trialEndDate spécifique à l'utilisateur
  let isTrialExpired = false;
if (userData.termsAcceptedDate) {
  const acceptedDate = new Date(userData.termsAcceptedDate);
  const trialEnd = new Date(acceptedDate);
  trialEnd.setDate(trialEnd.getDate() + 21);
  isTrialExpired = new Date() > trialEnd;
}
  const navigate = useNavigate();

  const isSubscriptionExpired = () => {
  const subscription = userData.subscription || {};
  const maintenant = new Date();
  
  const hasSubscription = subscription.monthly || subscription.semester || subscription.annual;
  if (!hasSubscription) return false;
  
  const isActive = 
    (subscription.monthly && new Date(subscription.monthly) > maintenant) ||
    (subscription.semester && new Date(subscription.semester) > maintenant) ||
    (subscription.annual && new Date(subscription.annual) > maintenant);
  
  const expired = hasSubscription && !isActive;
    return expired;
};


//  React.useEffect(() => {
//  const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
 // const hasAccepted = userData.termsAccepted === true;

  
 // if (!hasAccepted && !showPaymentModal) {
 //   setShowPaymentModal(true);
 // } else if (hasAccepted && showPaymentModal) {
   // setShowPaymentModal(false);
 // }
//}, [showPaymentModal]);


  const handleAcceptTerms = () => {
    setShowPaymentModal(false);
  };

  const getPlanName = (plan) => {
  switch(plan) {
    case 'monthly': return 'Mensuel';
    case 'semester': return 'Semestriel';
    case 'annual': return 'Annuel';
    default: return '';
  }
};

  const plans = [
    {
      id: 1,
      name: 'Mensuel',
      price: '49 TND',
      period: 'par mois',
      features: [],
      popular: false,
      priceValue: 49,
      planKey: 'monthly'
    },
    {
      id: 2,
      name: 'Semestriel',
      price: '249 TND',
      period: 'par 6 mois',
      features: [],
      popular: true,
      save: 'Économisez 45 TND',
      priceValue: 249,
      planKey: 'semester'
    },
    {
      id: 3,
      name: 'Annuel',
      price: '449 TND',
      period: 'par an',
      features: [],
      popular: false,
      save: 'Économisez 139 TND',
      priceValue: 449,
      planKey: 'annual'
    }
  ];

  const handlePlanSelect = (plan) => {
    console.log('🎯 [Paiements] Plan sélectionné:', plan);
  console.log('🎯 [Paiements] showBankDetails avant:', showBankDetails);
    setSelectedPlan(plan);
    setShowBankDetails(true);
    setPaymentStatus('pending');
    setTimeout(() => {
    const formulaireElement = document.getElementById('payment-form');
    if (formulaireElement) {
      formulaireElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }, 100);
    console.log('🎯 [Paiements] showBankDetails après:', true);
  };

  const connectedUser = JSON.parse(sessionStorage.getItem('userData') || '{}');

const [clientInfo, setClientInfo] = useState({
  fullName: connectedUser.name || '',
  email: connectedUser.email || '',  
  phone: connectedUser.phone || ''
});

  const handleDHMADPayment = async (e) => {
  e.preventDefault();
  console.log('💳 [Paiements] Début paiement DHMAD');
  setIsProcessingPayment(true);
  
  if (!selectedPlan) {
    console.log('❌ [Paiements] Pas de plan sélectionné');
    alert('Veuillez choisir un plan');
    return;
  }

  if (!clientInfo.fullName || !clientInfo.email) {
    console.log('❌ [Paiements] Infos client manquantes');
    alert('Veuillez remplir vos informations');
    setIsProcessingPayment(false);
    return;
  }
  console.log('📦 [Paiements] Envoi requête:', {
    amount: selectedPlan.priceValue,
    plan: selectedPlan.planKey,
    clientInfo: clientInfo
  });

  try {
    const response = await fetch(`${backendUrl}/api/paiements/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionStorage.getItem('token')}`
      },
      body: JSON.stringify({
        amount: selectedPlan.priceValue,
        plan: selectedPlan.planKey,
        clientInfo: clientInfo
      })
    });
    
    const data = await response.json();
    console.log('📡 [Paiements] Réponse serveur:', data);
    
    if (data.success) {
      console.log('✅ [Paiements] Redirection vers:', data.payment_url);
      console.log('🎯 [Paiements] disableExpirationChecks devrait être true sur cette page');
      window.location.href = data.payment_url;
    } else {
      console.log('❌ [Paiements] Erreur:', data.message);
      alert('Erreur: ' + data.message);
      setIsProcessingPayment(false);
    }
    
  } catch (error) {
    console.error('❌ [Paiements] Erreur DHMAD:', error);
    console.error('Erreur DHMAD:', error);
    alert('Erreur lors de l\'initialisation du paiement');
    setIsProcessingPayment(false);
  }
};

  return (
    <>
    {isProcessingPayment && (
      <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4" />
          <p className="text-gray-700">Redirection vers la plateforme de paiement...</p>
        </div>
      </div>
    )}
      <PaymentModal 
        isOpen={showPaymentModal}
        onClose={() => {
          alert('Veuillez accepter les conditions pour continuer');
        }}
        onAccept={handleAcceptTerms}
      />
      
      {/* Conteneur principal responsive */}
      <div className="w-full px-3 md:px-4">
        
        {/* Bannière Abonnement Actif (VERT) */}
{hasActiveSubscription && (
  <div className="w-full mb-6">
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 md:p-6">
      <FaCrown className="text-4xl text-green-500 mx-auto mb-3" />
      <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2 text-center">
        Abonnement {getPlanName(tempsRestantAbonnement.planActif)} Actif
      </h2>
      <p className="text-gray-600 text-center text-sm md:text-base">
        Vous bénéficiez de toutes les fonctionnalités d'EL BALAS.
      </p>
      
      <div className="mt-4 p-3 md:p-4 bg-white rounded-lg shadow-inner">
        <p className="text-xs md:text-sm text-gray-600 mb-2 text-center font-semibold">
          Temps restant avant la fin de votre abonnement :
        </p>
        <div className="flex flex-wrap justify-center gap-2 md:gap-4 text-center">
          <div className="bg-green-100 rounded-lg p-1 md:p-2 min-w-[60px] md:min-w-[70px]">
            <div className="text-xl md:text-2xl font-bold text-green-700 font-mono">
              {String(tempsRestantAbonnement.jours).padStart(2, '0')}
            </div>
            <div className="text-[10px] md:text-xs text-green-600">Jours</div>
          </div>
          <div className="bg-green-100 rounded-lg p-1 md:p-2 min-w-[60px] md:min-w-[70px]">
            <div className="text-xl md:text-2xl font-bold text-green-700 font-mono">
              {String(tempsRestantAbonnement.heures).padStart(2, '0')}
            </div>
            <div className="text-[10px] md:text-xs text-green-600">Heures</div>
          </div>
          <div className="bg-green-100 rounded-lg p-1 md:p-2 min-w-[60px] md:min-w-[70px]">
            <div className="text-xl md:text-2xl font-bold text-green-700 font-mono">
              {String(tempsRestantAbonnement.minutes).padStart(2, '0')}
            </div>
            <div className="text-[10px] md:text-xs text-green-600">Minutes</div>
          </div>
          <div className="bg-green-100 rounded-lg p-1 md:p-2 min-w-[60px] md:min-w-[70px]">
            <div className="text-xl md:text-2xl font-bold text-green-700 font-mono">
              {String(tempsRestantAbonnement.secondes).padStart(2, '0')}
            </div>
            <div className="text-[10px] md:text-xs text-green-600">Secondes</div>
          </div>
        </div>
      </div>
      
      {tempsRestantAbonnement.dateFin && (
        <p className="text-xs md:text-sm text-gray-500 mt-3 text-center">
          Fin de l'abonnement : {tempsRestantAbonnement.dateFin.toLocaleDateString('fr-FR')}
        </p>
      )}
    </div>
  </div>
)}

{/* Bannière d'expiration */}
{!hasActiveSubscription && (
  <div className="w-full mb-6">
    {isSubscriptionExpired() ? (
      // Bannière ORANGE pour abonnement expiré
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 md:p-6">
        <FaExclamationTriangle className="text-4xl text-orange-500 mx-auto mb-3" />
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">Abonnement expiré</h2>
        <p className="text-gray-600 text-sm md:text-base">Votre abonnement a expiré.</p>
        <p className="text-orange-600 font-semibold mt-2 text-sm md:text-base">Veuillez renouveler votre abonnement pour continuer à utiliser EL BALAS.</p>
        {(() => {
          let endDate = '--/--/----';
          const subscription = userData.subscription || {};
          if (subscription.monthly) endDate = new Date(subscription.monthly).toLocaleDateString('fr-FR');
          else if (subscription.semester) endDate = new Date(subscription.semester).toLocaleDateString('fr-FR');
          else if (subscription.annual) endDate = new Date(subscription.annual).toLocaleDateString('fr-FR');
          return <p className="text-xs md:text-sm text-gray-500 mt-3 text-center">Fin de l'abonnement : {endDate}</p>;
        })()}
      </div>
    ) : isTrialExpired ? (
      // Bannière ROUGE pour essai expiré
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 md:p-6">
        <FaExclamationTriangle className="text-4xl text-red-500 mx-auto mb-3" />
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">Période d'essai expirée</h2>
        <p className="text-gray-600 text-sm md:text-base">Votre période d'essai gratuit de 21 jours est terminée.</p>
        <p className="text-red-600 font-semibold mt-2 text-sm md:text-base">Veuillez choisir un abonnement pour continuer à utiliser EL BALAS.</p>
        {(() => {
          let endDate = '--/--/----';
          if (userData.termsAcceptedDate) {
            const acceptedDate = new Date(userData.termsAcceptedDate);
            const trialEnd = new Date(acceptedDate);
            trialEnd.setDate(trialEnd.getDate() + 21);
            endDate = trialEnd.toLocaleDateString('fr-FR');
          }
          return <p className="text-xs md:text-sm text-gray-500 mt-3 text-center">Fin de l'essai : {endDate}</p>;
        })()}
      </div>
    ) : termsAccepted ? (
      // Bannière BLEUE pour essai actif
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 md:p-6">
        <FaClock className="text-4xl text-blue-500 mx-auto mb-3" />
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">Période d'essai gratuite</h2>
        <p className="text-gray-600 text-sm md:text-base">Vous êtes actuellement en période d'essai gratuit de 21 jours. Profitez de toutes les fonctionnalités d'EL BALAS sans limitation.</p>
        
        <div className="mt-4 p-3 md:p-4 bg-white rounded-lg shadow-inner">
          <p className="text-xs md:text-sm text-gray-600 mb-2 text-center font-semibold">Temps restant avant la fin de l'essai :</p>
          <div className="flex flex-wrap justify-center gap-2 md:gap-4 text-center">
            <div className="bg-blue-100 rounded-lg p-1 md:p-2 min-w-[60px] md:min-w-[70px]">
              <div className="text-xl md:text-2xl font-bold text-blue-700 font-mono">{String(tempsRestant.jours).padStart(2, '0')}</div>
              <div className="text-[10px] md:text-xs text-blue-600">Jours</div>
            </div>
            <div className="bg-blue-100 rounded-lg p-1 md:p-2 min-w-[60px] md:min-w-[70px]">
              <div className="text-xl md:text-2xl font-bold text-blue-700 font-mono">{String(tempsRestant.heures).padStart(2, '0')}</div>
              <div className="text-[10px] md:text-xs text-blue-600">Heures</div>
            </div>
            <div className="bg-blue-100 rounded-lg p-1 md:p-2 min-w-[60px] md:min-w-[70px]">
              <div className="text-xl md:text-2xl font-bold text-blue-700 font-mono">{String(tempsRestant.minutes).padStart(2, '0')}</div>
              <div className="text-[10px] md:text-xs text-blue-600">Minutes</div>
            </div>
            <div className="bg-blue-100 rounded-lg p-1 md:p-2 min-w-[60px] md:min-w-[70px]">
              <div className="text-xl md:text-2xl font-bold text-blue-700 font-mono">{String(tempsRestant.secondes).padStart(2, '0')}</div>
              <div className="text-[10px] md:text-xs text-blue-600">Secondes</div>
            </div>
          </div>
        </div>
        
        {(() => {
          let endDate = '--/--/----';
          if (userData.termsAcceptedDate) {
            const acceptedDate = new Date(userData.termsAcceptedDate);
            const trialEnd = new Date(acceptedDate);
            trialEnd.setDate(trialEnd.getDate() + 21);
            endDate = trialEnd.toLocaleDateString('fr-FR');
          }
          return <p className="text-xs md:text-sm text-gray-500 mt-3 text-center">Fin de l'essai : {endDate}</p>;
        })()}
      </div>
    ) : null}
  </div>
)}
        {!hasActiveSubscription && (
  <>
        {/* Grille des plans */}
        <div className="flex flex-col md:grid md:grid-cols-3 gap-4 md:gap-8 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`
                bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all duration-300
                hover:scale-105 hover:shadow-2xl
                ${plan.popular ? 'ring-2 ring-yellow-500 relative' : ''}
                ${selectedPlan?.id === plan.id ? 'ring-4 ring-green-500' : ''}
              `}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-yellow-500 text-white px-4 py-1 text-sm font-bold rounded-bl-lg">
                  Populaire
                </div>
              )}
              
              <div className="p-6 md:p-8">
                <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl md:text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-500 ml-2 text-sm md:text-base">{plan.period}</span>
                </div>
                
                {plan.save && (
                  <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold inline-block mb-4">
                    {plan.save}
                  </div>
                )}
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start text-gray-600 text-sm md:text-base">
                      <FaCheckCircle className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button
                  onClick={() => handlePlanSelect(plan)}
                  disabled={paymentStatus === 'success'}
                  className={`
                    w-full py-3 rounded-lg font-semibold transition-all
                    ${paymentStatus === 'success' && selectedPlan?.id === plan.id
                      ? 'bg-green-500 text-white cursor-not-allowed'
                      : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                    }
                  `}
                >
                  {paymentStatus === 'success' && selectedPlan?.id === plan.id
                    ? 'Paiement effectué ✓'
                    : 'Choisir ce plan'
                  }
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Formulaire de paiement */}
        {showBankDetails && selectedPlan && (
          <div id="payment-form" className="w-full mb-12">
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 transform transition-all duration-500 animate-fadeIn">
              
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-6">
                Paiement sécurisé par carte bancaire
              </h2>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <FaCreditCard className="text-blue-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-blue-800 font-medium">
                      Paiement 100% sécurisé via DHMAD (e-DINAR & cartes bancaires)
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleDHMADPayment}>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom complet sur la carte *
                    </label>
                    <input
                      type="text"
                      value={clientInfo.fullName}
                      onChange={(e) => setClientInfo({...clientInfo, fullName: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                      placeholder="Mohamed Ben Ali"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
  type="email"
  value={clientInfo.email}
  readOnly  
  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
  required
/>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Téléphone (optionnel)
                    </label>
                    <input
                      type="tel"
                      value={clientInfo.phone}
                      onChange={(e) => setClientInfo({...clientInfo, phone: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                      placeholder="20 123 456"
                    />
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Montant à payer :</span>
                      <span className="text-2xl font-bold text-gray-900">{selectedPlan.price}</span>
                    </div>
                  </div>
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <FaCreditCard className="mr-2" />
                  Payer {selectedPlan.price} par carte
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowBankDetails(false)}
                  className="w-full mt-2 py-2 text-gray-500 hover:text-gray-700 text-sm"
                >
                  Annuler
                </button>
              </form>

              <div className="mt-6 text-center">
  <div className="flex items-center justify-center gap-4">
    <img 
      src={assets.visa} 
      alt="Visa"
      className="h-5 object-contain"
    />
    <img 
      src={assets.mastercard} 
      alt="MasterCard"
      className="h-7 object-contain"
    />
    <img 
      src={assets.d17} 
      alt="MasterCard"
      className="h-7 object-contain"
    />
  </div>
  <p className="text-xs text-gray-400 mt-2">
    Paiement sécurisé - e-DINAR, Visa, Mastercard
  </p>
</div>
            </div>
          </div>
        )}
        </>
        )}

        {hasActiveSubscription && (
          <div className="text-center py-12">
            <FaCrown className="text-6xl text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Vous êtes déjà abonné(e) !
            </h3>
            <p className="text-gray-600">
              Votre abonnement {getPlanName(tempsRestantAbonnement.planActif)} est actif jusqu'au {tempsRestantAbonnement.dateFin?.toLocaleDateString('fr-FR')}.
            </p>
            <button
              onClick={() => navigate('/')}
              className="mt-6 bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              Retour au tableau de bord
            </button>
          </div>
        )}

        
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
      
    </>
  );
};

export default Paiements;