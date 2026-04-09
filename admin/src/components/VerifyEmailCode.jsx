import React, { useState, useEffect, useRef } from 'react';
import { assets } from '../assets/assets';
import { backendUrl } from '../App';

const VerifyEmailCode = ({ navigate, setIsAuthenticated }) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [codeInvalidated, setCodeInvalidated] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [redirectCountdown, setRedirectCountdown] = useState(0);
  const isRefreshingRef = useRef(false);
  const hasNavigatedBackRef = useRef(false);
  const deletionInProgressRef = useRef(false);
  const hasStartedDeletionRef = useRef(false);
  const isVerifyingRef = useRef(false);

  // Chargement initial
  useEffect(() => {
    const storedEmail = sessionStorage.getItem('pendingVerificationEmail');
    const storedToken = sessionStorage.getItem('pendingVerificationToken');
    const storedUserData = sessionStorage.getItem('pendingVerificationUserData');
    
    if (storedEmail && storedToken && storedUserData) {
      setEmail(storedEmail);
      
      const savedExpiry = sessionStorage.getItem('emailVerificationExpiry');
      
      if (savedExpiry) {
        const now = Date.now();
        const expiry = parseInt(savedExpiry);
        const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
        
        if (remaining > 0) {
          setTimeRemaining(remaining);
        } else {
          setError('Le code a expiré. Veuillez vous réinscrire.');
          setCodeInvalidated(true);
          setTimeRemaining(0);
        }
      } else {
        const expiryTime = Date.now() + (600 * 1000);
        sessionStorage.setItem('emailVerificationExpiry', expiryTime.toString());
        setTimeRemaining(600);
      }
    } else {
      setTimeout(() => {
        if (!isVerifyingRef.current) {
          navigate('/login');
        }
      }, 100);
      return;
    }
  }, [navigate]);

  // Fonction pour supprimer le compte non vérifié
  const deleteUnverifiedAccount = async (isSilent = false) => {
    if (deletionInProgressRef.current || hasStartedDeletionRef.current) return;
    if (!email) return;
    
    hasStartedDeletionRef.current = true;
    deletionInProgressRef.current = true;
    
    try {
      const response = await fetch(`${backendUrl}/api/auth/delete-unverified-account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (data.success) {
      } else {
        console.error('❌ Erreur suppression compte:', data.message);
      }
    } catch (err) {
      console.error('❌ Erreur lors de la suppression:', err);
    } finally {
      sessionStorage.removeItem('pendingVerificationEmail');
      sessionStorage.removeItem('pendingVerificationToken');
      sessionStorage.removeItem('pendingVerificationUserData');
      sessionStorage.removeItem('emailVerificationExpiry');
    }
  };

  // ⭐ NOUVEAU : Gestion de la fermeture/rafraîchissement avec confirmation
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      // Ne pas afficher si le code est déjà invalidé ou expiré
      if (codeInvalidated || timeRemaining <= 0 || timeRemaining === null) return;
      
      return;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [codeInvalidated, timeRemaining]);

  // ⭐ NOUVEAU : Gestion de la fermeture (pagehide) avec suppression
  useEffect(() => {
  let isNavigation = false;
  
  // Détecter si c'est une navigation interne (pas une vraie fermeture)
  const handlePageHide = (e) => {
    // Attendre un peu pour voir si c'est une navigation ou une vraie fermeture
    setTimeout(() => {
      // Ne pas supprimer si c'est une navigation interne
      if (isNavigation) return;
      
      // Si l'utilisateur ferme vraiment et que le code n'est pas vérifié
      if (!codeInvalidated && timeRemaining > 0 && timeRemaining !== null && email) {
        fetch(`${backendUrl}/api/auth/delete-unverified-account`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
          keepalive: true
        }).catch(err => console.error('❌ Erreur envoi suppression:', err));
      }
    }, 100);
  };

  // Intercepter les navigations internes
  const originalPushState = window.history.pushState;
  const originalReplaceState = window.history.replaceState;
  
  window.history.pushState = function(...args) {
    isNavigation = true;
    originalPushState.apply(window.history, args);
    setTimeout(() => { isNavigation = false; }, 500);
  };
  
  window.history.replaceState = function(...args) {
    isNavigation = true;
    originalReplaceState.apply(window.history, args);
    setTimeout(() => { isNavigation = false; }, 500);
  };

  window.addEventListener('pagehide', handlePageHide);
  
  return () => {
    window.removeEventListener('pagehide', handlePageHide);
    window.history.pushState = originalPushState;
    window.history.replaceState = originalReplaceState;
  };
}, [codeInvalidated, timeRemaining, email]);

  // ⭐ NOUVEAU : Empêcher la navigation interne sans confirmation
  useEffect(() => {
    const handleLinkClick = (e) => {
      // Vérifier si c'est un lien de navigation
      const target = e.target.closest('a');
      if (!target) return;
      
      // Ne pas bloquer si le code est déjà invalidé
      if (codeInvalidated || timeRemaining <= 0 || timeRemaining === null) return;
      
      const href = target.getAttribute('href');
      if (href && !href.startsWith('javascript:') && href !== '#') {
        const confirmMessage = "⚠️ ATTENTION ! ⚠️\n\nSi vous quittez cette page :\n❌ Votre compte sera définitivement SUPPRIMÉ\n❌ Vous devrez vous réinscrire\n\nVoulez-vous vraiment continuer ?";
        
        if (!window.confirm(confirmMessage)) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        } else {
          // Si confirmation, supprimer le compte
          deleteUnverifiedAccount();
        }
      }
    };

    // Ajouter l'écouteur sur tout le document
    document.addEventListener('click', handleLinkClick);
    
    return () => {
      document.removeEventListener('click', handleLinkClick);
    };
  }, [codeInvalidated, timeRemaining]);

  // Gestion du bouton retour du navigateur
  useEffect(() => {
    const handlePopState = async (e) => {
      if (hasNavigatedBackRef.current) return;
      
      if (!codeInvalidated && timeRemaining > 0 && timeRemaining !== null) {
        const confirmLeave = window.confirm(
          '⚠️ ATTENTION ! ⚠️\n\nSi vous retournez en arrière, votre compte sera définitivement SUPPRIMÉ car vous n\'avez pas vérifié votre email.\n\nVoulez-vous vraiment continuer ?'
        );
        if (!confirmLeave) {
          window.history.pushState(null, '', window.location.pathname);
          return;
        } else {
          hasNavigatedBackRef.current = true;
          await deleteUnverifiedAccount();
          navigate('/login');
        }
      } else {
        hasNavigatedBackRef.current = true;
        navigate('/login');
      }
    };

    window.history.pushState(null, '', window.location.pathname);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [codeInvalidated, timeRemaining, email]);

  // Fonction quand le code expire
  const handleExpiredCode = async () => {
    if (codeInvalidated) return;
    
    setError('Le code a expiré. Redirection vers la connexion dans 3 secondes...');
    setCodeInvalidated(true);
    setTimeRemaining(0);
    
    await deleteUnverifiedAccount();
    
    setRedirectCountdown(3);
    const timer = setInterval(() => {
      setRedirectCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/login');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Timer pour le compte à rebours
  useEffect(() => {
    if (timeRemaining === null) return;
    if (codeInvalidated || timeRemaining <= 0) return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleExpiredCode();
          return 0;
        }
        
        const newValue = prev - 1;
        const newExpiry = Date.now() + (newValue * 1000);
        sessionStorage.setItem('emailVerificationExpiry', newExpiry.toString());
        return newValue;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [codeInvalidated, timeRemaining]);

  // Le reste de ton code (formatTime, handleCodeChange, verifyCodeAutomatically, etc.) reste identique
  // ... (garde toutes tes autres fonctions existantes)

  const formatTime = (seconds) => {
    if (seconds === null) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCodeChange = (index, value) => {
    if (value.length > 1) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');

    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      if (nextInput) nextInput.focus();
    }

    const isComplete = newCode.every(digit => digit !== '');
    
    if (isComplete && !codeInvalidated && !loading) {
      const fullCode = newCode.join('');
      verifyCodeAutomatically(fullCode);
    }
  };

  const verifyCodeAutomatically = async (fullCode) => {
    if (codeInvalidated) {
      setError('Le code a expiré. Veuillez vous réinscrire.');
      return;
    }

    isVerifyingRef.current = true;
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${backendUrl}/api/auth/verify-email-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code: fullCode }),
      });

      const data = await response.json();

      if (data.success) {
        sessionStorage.removeItem('emailVerificationExpiry');
        sessionStorage.removeItem('isRefreshing');
        
        const token = sessionStorage.getItem('pendingVerificationToken');
        const userData = JSON.parse(sessionStorage.getItem('pendingVerificationUserData') || '{}');
        
        userData.emailVerified = true;
        
        sessionStorage.setItem('isAdminLoggedIn', 'true');
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('userData', JSON.stringify(userData));
        
        sessionStorage.removeItem('pendingVerificationEmail');
        sessionStorage.removeItem('pendingVerificationToken');
        sessionStorage.removeItem('pendingVerificationUserData');
        
        if (setIsAuthenticated) {
          setIsAuthenticated(true);
        }
        
        setCountdown(3);
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        setError(data.message || 'Code invalide');
        setCode(['', '', '', '', '', '']);
        document.getElementById('code-0')?.focus();
      }
    } catch (err) {
      console.error('❌ [VerifyEmailCode] Erreur:', err);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
      isVerifyingRef.current = false;
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleResendCode = async () => {
    if (codeInvalidated) {
      setError('Le code a expiré. Veuillez vous réinscrire.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${backendUrl}/api/auth/resend-verification-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setCode(['', '', '', '', '', '']);
        setError('');
        const expiryTime = Date.now() + (600 * 1000);
        sessionStorage.setItem('emailVerificationExpiry', expiryTime.toString());
        setTimeRemaining(600);
        setCodeInvalidated(false);
        alert('Nouveau code envoyé !');
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error('❌ [VerifyEmailCode] Erreur renvoi code:', err);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = async () => {
    const confirmLeave = window.confirm(
      '⚠️ ATTENTION ! ⚠️\n\nSi vous retournez à la connexion, votre compte sera définitivement SUPPRIMÉ car vous n\'avez pas vérifié votre email.\n\nVoulez-vous vraiment continuer ?'
    );
    
    if (confirmLeave) {
      await deleteUnverifiedAccount();
      navigate('/login');
    }
  };

  // Affichage pendant la redirection
  if (redirectCountdown > 0) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-cover bg-center bg-fixed"
           style={{ 
             backgroundImage: `url(${assets.background})`,
             backgroundSize: 'cover',
             backgroundPosition: 'center',
             backgroundRepeat: 'no-repeat'
           }}>
        <div className="relative z-10 w-full max-w-md px-4 py-8">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4" />
              <p className="text-red-600 font-semibold text-lg">Code expiré !</p>
              <p className="text-gray-600 mt-2">Votre compte a été supprimé.</p>
              <p className="text-gray-600 mt-2">Redirection vers la connexion dans {redirectCountdown} seconde{redirectCountdown > 1 ? 's' : ''}...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (timeRemaining === null && !error) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500" />
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center bg-cover bg-center bg-fixed"
      style={{ 
        backgroundImage: `url(${assets.background})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0" />
      
      <div className="relative z-10 w-full max-w-md px-4 py-8">
        <div className="text-center mb-8">
          <img 
            src={assets.elbalas} 
            alt="EL BALAS" 
            className="h-16 mx-auto mb-3"
          />
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-6">
            {countdown > 0 ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4" />
                <p className="text-green-600 font-semibold">Email vérifié avec succès !</p>
                <p className="text-gray-600 text-sm mt-2">Redirection vers la configuration dans {countdown} seconde{countdown > 1 ? 's' : ''}...</p>
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                <p className="text-center text-gray-600 mb-2">
                  Entrez le code de vérification à 6 chiffres envoyé à<br />
                  <span className="font-semibold">{email}</span>
                </p>

                <div className="text-center mb-4">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                    timeRemaining < 60 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Code valable : {formatTime(timeRemaining)}</span>
                  </div>
                </div>

                <div className="flex justify-between gap-2 mb-6">
                  {code.map((digit, index) => (
                    <input
                      key={index}
                      id={`code-${index}`}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-12 h-12 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500 outline-none"
                      disabled={loading || codeInvalidated}
                    />
                  ))}
                </div>

                <button
                  onClick={handleResendCode}
                  disabled={loading || codeInvalidated}
                  className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-white py-2.5 rounded-lg font-semibold hover:from-yellow-600 hover:to-yellow-700 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed mb-3"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Envoi...
                    </span>
                  ) : (
                    'Renvoyer le code'
                  )}
                </button>

                <p className="text-center mt-4 text-gray-600 text-sm">
                  <button
                    onClick={handleBackToLogin}
                    className="text-red-600 hover:text-red-700 font-semibold hover:underline focus:outline-none"
                  >
                    Retour à la connexion (le compte sera supprimé)
                  </button>
                </p>

                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-700 text-xs text-center">
                    ⚠️ Attention : Si vous fermez cet onglet ou rafraîchissez la page sans vérifier votre code,<br />
                    votre compte sera définitivement supprimé.
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <p className="text-center text-gray-500 text-sm">
              © 2026 EL BALAS. Tous droits réservés.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailCode;