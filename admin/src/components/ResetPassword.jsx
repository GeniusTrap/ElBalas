import React, { useState, useEffect, useRef } from 'react';
import { assets } from '../assets/assets';
import { backendUrl } from '../App';
import { FaEye, FaEyeSlash } from 'react-icons/fa';


const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('8 caractères minimum');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('une majuscule');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('une minuscule');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('un chiffre');
  }
  
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push('un caractère spécial');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

const getPasswordStrengthMessage = (password) => {
  if (!password) return '';
  const validation = validatePassword(password);
  if (validation.isValid) return '✓ Mot de passe fort';
  return `⚠️ ${validation.errors.join(', ')}`;
};

const ResetPassword = ({ navigate }) => {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const isRefreshingRef = useRef(false);
  const hasNavigatedBackRef = useRef(false);
  const passwordResetDoneRef = useRef(false); 
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const email = sessionStorage.getItem('resetEmail');
    if (!email) {
      navigate('/forgot-password');
      return;
    }
    
    
    // Ajouter un état dans l'historique pour gérer le retour
    window.history.pushState(null, '', window.location.pathname);
  }, [navigate]);

  // Détecter le refresh
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

  // Bloquer la fermeture de l'onglet
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      
      if (isRefreshingRef.current) {
        return;
      }
      
      // Si le mot de passe a déjà été changé avec succès, pas d'alerte
      if (passwordResetDoneRef.current) {
        return;
      }
      
      if (!success && !passwordResetDoneRef.current) {
        e.preventDefault();
        e.returnValue = 'Si vous quittez cette page, vous devrez recommencer le processus. Voulez-vous vraiment continuer ?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [success]);

  useEffect(() => {
    const handlePopState = (e) => {
      
      // Empêcher la navigation multiple
      if (hasNavigatedBackRef.current) {
        return;
      }
      
      if (passwordResetDoneRef.current || success) {
        hasNavigatedBackRef.current = true;
        navigateToLogin();
        return;
      }
      
      // Sinon, demander confirmation
      const confirmLeave = window.confirm(
        'Si vous quittez cette page, vous devrez recommencer le processus de réinitialisation. Voulez-vous vraiment continuer ?'
      );
      
      if (!confirmLeave) {
        // Empêcher la navigation
        window.history.pushState(null, '', window.location.pathname);
        return;
      } else {
        hasNavigatedBackRef.current = true;
        
        // Nettoyer les données et rediriger vers forgot-password
        cleanupAndRedirectToLogin();
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [success]);

  const cleanupAndRedirectToLogin = () => {
  
  // Nettoyer toutes les données de session
  sessionStorage.removeItem('resetEmail');
  sessionStorage.removeItem('resetCodeTimeRemaining');
  sessionStorage.removeItem('resetCodeExpiry');
  
  
  // Rediriger vers login
  navigate('/login');
};

  const navigateToLogin = () => {
    sessionStorage.removeItem('resetEmail');
    sessionStorage.removeItem('resetCodeTimeRemaining');
    sessionStorage.removeItem('resetCodeExpiry');
    navigate('/login');
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    const passwordValidation = validatePassword(formData.password);
if (!passwordValidation.isValid) {
  setError(`Mot de passe invalide : ${passwordValidation.errors.join(', ')}`);
  setLoading(false);
  return;
}

    try {
      const email = sessionStorage.getItem('resetEmail');
      
      if (!email) {
        setError('Session expirée, veuillez recommencer');
        setTimeout(() => {
          navigate('/forgot-password');
        }, 2000);
        setLoading(false);
        return;
      }
      
      const response = await fetch(`${backendUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          newPassword: formData.password
        }),
      });

      const data = await response.json();

      if (data.success) {
        passwordResetDoneRef.current = true; // Marquer que le mot de passe a été changé
        setSuccess('Mot de passe modifié avec succès !');
        
        // Nettoyer le stockage
        sessionStorage.removeItem('resetEmail');
        sessionStorage.removeItem('resetCodeTimeRemaining');
        sessionStorage.removeItem('resetCodeExpiry');
        
        // Redirection après 3 secondes
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(data.message || 'Erreur lors de la réinitialisation');
      }
    } catch (err) {
      console.error('❌ [ResetPassword] Erreur:', err);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    const confirmLeave = window.confirm(
      'Si vous retournez à la connexion, vous devrez recommencer le processus de réinitialisation. Voulez-vous vraiment continuer ?'
    );
    
    if (confirmLeave) {
      cleanupAndRedirectToLogin();
    }
  };

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
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-600 text-sm">{success}</p>
                <p className="text-green-600 text-xs mt-1">Redirection vers la connexion...</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Nouveau mot de passe
  </label>
  <div className="relative">
    <input
      type={showPassword ? "text" : "password"}
      name="password"
      value={formData.password}
      onChange={handleChange}
      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all pr-10"
      placeholder="••••••••"
      required
      minLength="6"
      disabled={loading || success !== ''}
    />
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
    >
      {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
    </button>
  </div>
  {formData.password && (
    <p className={`text-xs mt-1 ${validatePassword(formData.password).isValid ? 'text-green-600' : 'text-yellow-600'}`}>
      {getPasswordStrengthMessage(formData.password)}
    </p>
  )}
</div>

              <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Confirmer le mot de passe
  </label>
  <div className="relative">
    <input
      type={showConfirmPassword ? "text" : "password"}
      name="confirmPassword"
      value={formData.confirmPassword}
      onChange={handleChange}
      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all pr-10"
      placeholder="••••••••"
      required
      disabled={loading || success !== ''}
    />
    <button
      type="button"
      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
    >
      {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
    </button>
  </div>
</div>

              <button
                type="submit"
                disabled={loading || success !== ''}
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-white py-2.5 rounded-lg font-semibold hover:from-yellow-600 hover:to-yellow-700 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Réinitialisation...
                  </span>
                ) : (
                  'Réinitialiser mon mot de passe'
                )}
              </button>
            </form>

            <p className="text-center mt-4 text-gray-600 text-sm">
              <button
                onClick={handleBackToLogin}
                className="text-yellow-600 hover:text-yellow-700 font-semibold hover:underline focus:outline-none"
                disabled={loading}
              >
                Retour à la connexion
              </button>
            </p>
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

export default ResetPassword;