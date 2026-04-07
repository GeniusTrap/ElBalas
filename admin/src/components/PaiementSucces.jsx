import React, { useEffect, useState } from 'react';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { backendUrl } from '../App';

const PaiementSucces = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const testMode = searchParams.get('test_mode') === 'true';
  const plan = searchParams.get('plan');
  const escrowId = searchParams.get('escrow_id');

  useEffect(() => {
    sessionStorage.setItem('disableAllExpirationChecks', 'true');
    console.log('🔒 [PaiementSucces] Vérifications d\'expiration désactivées');
    
    const verifyPayment = async () => {
  if (!sessionId && !escrowId) {
    setError(true);
    setLoading(false);
    return;
  }
  
  try {
    const token = sessionStorage.getItem('token');
    const verifyResponse = await fetch(`${backendUrl}/api/auth/verify`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const userData = await verifyResponse.json();
    
    if (userData.success && userData.user.subscription) {
      const sub = userData.user.subscription;
      const maintenant = new Date();
      const hasActive = 
        (sub.monthly && new Date(sub.monthly) > maintenant) ||
        (sub.semester && new Date(sub.semester) > maintenant) ||
        (sub.annual && new Date(sub.annual) > maintenant);
      
      if (hasActive) {
        console.log('✅ Abonnement déjà actif (webhook)');
        setLoading(false);
        return;
      }
    }
  } catch (err) {
    console.log('Erreur vérification:', err);
  }
  
  if (testMode) {
    try {
      const response = await fetch(`${backendUrl}/api/paiements/activate-subscription`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ plan: plan.toLowerCase() })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        const refreshResponse = await fetch(`${backendUrl}/api/auth/force-refresh`, {
          headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
        });
        const refreshData = await refreshResponse.json();
        if (refreshData.success) {
          sessionStorage.setItem('userData', JSON.stringify(refreshData.user));
        }
        setLoading(false);
      } else {
        setError(true);
        setLoading(false);
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError(true);
      setLoading(false);
    }
  } else {
    let attempts = 0;
    const checkInterval = setInterval(async () => {
      attempts++;
      try {
        const token = sessionStorage.getItem('token');
        const response = await fetch(`${backendUrl}/api/auth/verify`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (data.success && data.user.subscription) {
          const sub = data.user.subscription;
          const maintenant = new Date();
          const hasActive = 
            (sub.monthly && new Date(sub.monthly) > maintenant) ||
            (sub.semester && new Date(sub.semester) > maintenant) ||
            (sub.annual && new Date(sub.annual) > maintenant);
          
          if (hasActive) {
            clearInterval(checkInterval);
            sessionStorage.setItem('userData', JSON.stringify(data.user));
            setLoading(false);
          }
        }
        if (attempts > 30) { 
          clearInterval(checkInterval);
          setError(true);
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
      }
    }, 1000);
  }
};
    
    verifyPayment();
    
    const timer = setTimeout(() => {
      sessionStorage.removeItem('disableAllExpirationChecks');
      console.log('🔓 [PaiementSucces] Vérifications d\'expiration réactivées');
    }, 10000);
    
    return () => clearTimeout(timer);
  }, [sessionId, testMode, plan]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4" />
          <p className="text-gray-600">Activation de votre abonnement...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <FaTimesCircle className="text-6xl text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Erreur</h1>
          <p className="text-gray-600 mb-6">Impossible d'activer votre abonnement. Contactez le support.</p>
          <button onClick={() => navigate('/paiements')} className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg">
            Retour
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
        <FaCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Paiement réussi !</h1>
        <p className="text-gray-600 mb-6">Votre abonnement {plan} a été activé.</p>
        <button onClick={() => navigate('/')} className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg">
          Accéder au dashboard
        </button>
      </div>
    </div>
  );
};

export default PaiementSucces;