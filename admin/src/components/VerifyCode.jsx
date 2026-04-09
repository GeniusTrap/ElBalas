import React, { useState, useEffect, useRef } from 'react';
import { assets } from '../assets/assets';
import { backendUrl } from '../App';

const VerifyCode = ({ navigate }) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [codeInvalidated, setCodeInvalidated] = useState(false);
  const isRefreshingRef = useRef(false);
  const initialLoadRef = useRef(true);
  const hasNavigatedBackRef = useRef(false); 

  useEffect(() => {
  const storedEmail = sessionStorage.getItem('resetEmail');
  if (storedEmail) {
    setEmail(storedEmail);
  } else {
    navigate('/forgot-password');
    return;
  }

  // Récupérer le timestamp de fin stocké
  const savedExpiry = sessionStorage.getItem('resetCodeExpiry');
  
  if (savedExpiry) {
    const now = Date.now();
    const expiry = parseInt(savedExpiry);
    const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
    
    
    if (remaining > 0) {
      setTimeRemaining(remaining);
    } else {
      setError('Le code a expiré. Veuillez demander un nouveau code.');
      setCodeInvalidated(true);
      setTimeRemaining(0);
      sessionStorage.removeItem('resetCodeExpiry');
    }
  } else {
    // Première fois, initialiser à 10 minutes (600 secondes)
    const expiryTime = Date.now() + (600 * 1000);
    sessionStorage.setItem('resetCodeExpiry', expiryTime.toString());
    setTimeRemaining(600);
  }
  
  initialLoadRef.current = false;
}, [navigate]);


  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
  if (timeRemaining === null) return;
  
  if (codeInvalidated || timeRemaining <= 0) return;
  
  
  const timer = setInterval(() => {
    setTimeRemaining(prev => {
      if (prev <= 1) {
        clearInterval(timer);
        setError('Le code a expiré. Veuillez demander un nouveau code.');
        setCodeInvalidated(true);
        
        fetch(`${backendUrl}/api/auth/invalidate-code`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }).catch(console.error);
        
        sessionStorage.removeItem('resetCodeExpiry');
        return 0;
      }
      
      const newValue = prev - 1;
      
      const newExpiry = Date.now() + (newValue * 1000);
      sessionStorage.setItem('resetCodeExpiry', newExpiry.toString());
      
      
      return newValue;
    });
  }, 1000);
  
  return () => {
    clearInterval(timer);
  };
}, [codeInvalidated, timeRemaining]); 

  useEffect(() => {
    
    const handleBeforeRefresh = () => {
      isRefreshingRef.current = true;
    };

    const handleAfterRefresh = () => {
      setTimeout(() => {
        isRefreshingRef.current = false;
      }, 100);
    };

    window.addEventListener('beforeunload', handleBeforeRefresh);
    window.addEventListener('load', handleAfterRefresh);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeRefresh);
      window.removeEventListener('load', handleAfterRefresh);
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      
      if (isRefreshingRef.current) {
        return;
      }
      
      if (timeRemaining !== null && !codeInvalidated && timeRemaining > 0 && timeRemaining <= 600) {
        e.preventDefault();
        e.returnValue = 'Si vous quittez cette page, le code ne sera plus valable. Voulez-vous vraiment continuer ?';
        return e.returnValue;
      } else {
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [codeInvalidated, timeRemaining]);

  useEffect(() => {
    const handlePopState = (e) => {
      
      if (hasNavigatedBackRef.current) {
        return;
      }
      
      if (timeRemaining !== null && !codeInvalidated && timeRemaining > 0 && timeRemaining <= 600) {
        const confirmLeave = window.confirm(
          'Si vous quittez cette page, le code expirera et vous devrez recommencer. Voulez-vous vraiment continuer ?'
        );
        if (!confirmLeave) {
          window.history.pushState(null, '', window.location.pathname);
          return;
        } else {
          hasNavigatedBackRef.current = true;
          
          invalidateCodeAndRedirectToLogin();
        }
      } else {
        hasNavigatedBackRef.current = true;
        navigateToLogin();
      }
    };

    window.history.pushState(null, '', window.location.pathname);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [codeInvalidated, timeRemaining, email]);

  const invalidateCodeAndRedirectToLogin = async () => {
  try {
    await fetch(`${backendUrl}/api/auth/invalidate-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    setCodeInvalidated(true);
    sessionStorage.removeItem('resetCodeExpiry'); 
    sessionStorage.removeItem('resetEmail');
    
    navigateToLogin();
  } catch (err) {
    console.error('❌ [VerifyCode] Erreur invalidation:', err);
    navigateToLogin();
  }
};

  const navigateToLogin = () => {
    navigate('/login');
  };

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

  // Vérifier si les 6 chiffres sont remplis
  const isComplete = newCode.every(digit => digit !== '');
  
  if (isComplete && !codeInvalidated && !loading) {
    // Utiliser directement la vérification sans passer par handleSubmit
    const fullCode = newCode.join('');
    
    // Appeler la vérification directement
    verifyCodeAutomatically(fullCode);
  }
};

// Ajouter cette nouvelle fonction après handleCodeChange
const verifyCodeAutomatically = async (fullCode) => {
  if (codeInvalidated) {
    setError('Le code a été invalidé. Veuillez demander un nouveau code.');
    return;
  }

  setLoading(true);
  setError('');

  try {
    
    const response = await fetch(`${backendUrl}/api/auth/verify-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, code: fullCode }),
    });

    const data = await response.json();

    if (data.success) {
      sessionStorage.removeItem('resetCodeExpiry');
      setCountdown(3);
      setTimeout(() => {
        navigate('/reset-password');
      }, 3000);
    } else {
      setError(data.message);
      setCode(['', '', '', '', '', '']);
      document.getElementById('code-0')?.focus();
    }
  } catch (err) {
    console.error('❌ [VerifyCode] Erreur:', err);
    setError('Erreur de connexion au serveur');
  } finally {
    setLoading(false);
  }
};

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (codeInvalidated) {
      setError('Le code a été invalidé. Veuillez demander un nouveau code.');
      return;
    }

    const fullCode = code.join('');
    
    if (fullCode.length !== 6) {
      setError('Veuillez entrer le code à 6 chiffres');
      return;
    }

    setLoading(true);
    setError('');

    try {
      
      const response = await fetch(`${backendUrl}/api/auth/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code: fullCode }),
      });

      const data = await response.json();

      if (data.success) {
        sessionStorage.removeItem('resetCodeExpiry');
        setCountdown(3);
        setTimeout(() => {
          navigate('/reset-password');
        }, 3000);
      } else {
        setError(data.message);
        setCode(['', '', '', '', '', '']);
        document.getElementById('code-0')?.focus();
      }
    } catch (err) {
      console.error('❌ [VerifyCode] Erreur:', err);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
  if (codeInvalidated) {
    setCodeInvalidated(false);
  }
  
  setLoading(true);
  setError('');
  
  try {
    const response = await fetch(`${backendUrl}/api/auth/forgot-password`, {
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
      // Réinitialiser le timer à 10 minutes
      const expiryTime = Date.now() + (600 * 1000);
      sessionStorage.setItem('resetCodeExpiry', expiryTime.toString());
      setTimeRemaining(600);
      alert('Nouveau code envoyé !');
    } else {
      setError(data.message);
    }
  } catch (err) {
    console.error('❌ [VerifyCode] Erreur renvoi code:', err);
    setError('Erreur de connexion au serveur');
  } finally {
    setLoading(false);
  }
};

  // MODIFICATION : Gestion du bouton retour - Rediriger vers login
  const handleBackToLogin = () => {
    const confirmLeave = window.confirm(
      'Si vous retournez à la connexion, le code expirera et vous devrez recommencer. Voulez-vous vraiment continuer ?'
    );
    
    if (confirmLeave) {
      invalidateCodeAndRedirectToLogin();
    }
  };

  if (timeRemaining === null) {
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
                <p className="text-green-600 font-semibold">Code valide !</p>
                <p className="text-gray-600 text-sm mt-2">Redirection dans {countdown} seconde{countdown > 1 ? 's' : ''}...</p>
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                <p className="text-center text-gray-600 mb-2">
                  Entrez le code à 6 chiffres envoyé à<br />
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

                <form onSubmit={handleSubmit}>
                  <div className="flex justify-between gap-1 md:gap-2 mb-6">
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
                        className="w-10 h-10 md:w-12 md:h-12 text-center text-xl md:text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500 outline-none"
                        disabled={loading || codeInvalidated}
                      />
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || codeInvalidated}
                    className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-white py-2.5 rounded-lg font-semibold hover:from-yellow-600 hover:to-yellow-700 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed mb-3"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Vérification...
                      </span>
                    ) : (
                      'Vérifier le code'
                    )}
                  </button>
                </form>

                <div className="text-center">
                  <button
                    onClick={handleResendCode}
                    disabled={loading}
                    className="text-yellow-600 hover:text-yellow-700 text-sm font-semibold hover:underline"
                  >
                    Renvoyer le code
                  </button>
                </div>

                {/* MODIFICATION : Bouton retour modifié pour rediriger vers login */}
                <p className="text-center mt-4 text-gray-600 text-sm">
                  <button
                    onClick={handleBackToLogin}
                    className="text-yellow-600 hover:text-yellow-700 font-semibold hover:underline focus:outline-none"
                  >
                    Retour à la connexion
                  </button>
                </p>
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

export default VerifyCode;