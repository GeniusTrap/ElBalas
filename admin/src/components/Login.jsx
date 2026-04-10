import React, { useState } from 'react';
import { assets } from '../assets/assets';
import { backendUrl } from '../App';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import ReactCountryFlag from "react-country-flag";

const countries = [
  { code: '+216', name: 'Tunisie', countryCode: 'TN', example: '20 123 456' },
  { code: '+33', name: 'France', countryCode: 'FR', example: '6 12 34 56 78' },
  { code: '+213', name: 'Algérie', countryCode: 'DZ', example: '5 51 23 45 67' },
  { code: '+212', name: 'Maroc', countryCode: 'MA', example: '6 12 34 56 78' },
  { code: '+1', name: 'USA/Canada', countryCode: 'US', example: '123 456 7890' },
  { code: '+44', name: 'Royaume-Uni', countryCode: 'GB', example: '7123 456789' },
  { code: '+49', name: 'Allemagne', countryCode: 'DE', example: '151 23456789' },
  { code: '+32', name: 'Belgique', countryCode: 'BE', example: '471 12 34 56' },
  { code: '+41', name: 'Suisse', countryCode: 'CH', example: '76 123 45 67' },
  { code: '+39', name: 'Italie', countryCode: 'IT', example: '312 345 6789' },
  { code: '+34', name: 'Espagne', countryCode: 'ES', example: '612 34 56 78' },
  { code: '+90', name: 'Turquie', countryCode: 'TR', example: '532 123 4567' },
  { code: '+20', name: 'Égypte', countryCode: 'EG', example: '10 1234 5678' },
  { code: '+966', name: 'Arabie Saoudite', countryCode: 'SA', example: '5 1234 5678' },
  { code: '+971', name: 'Émirats Arabes Unis', countryCode: 'AE', example: '50 123 4567' },
];

// Fonctions de validation du mot de passe
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

const validateEmailFormat = (email) => {
  const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
  return emailRegex.test(email);
};

const validatePhoneNumber = (phone, countryCode) => {
  // Supprimer tous les espaces et caractères non numériques
  const cleanPhone = phone.replace(/\s/g, '');
  
  // Accepter les numéros avec ou sans l'indicatif
  // Si le numéro commence déjà par l'indicatif, le retirer pour validation
  let numberToValidate = cleanPhone;
  if (numberToValidate.startsWith(countryCode.replace('+', ''))) {
    numberToValidate = numberToValidate.substring(countryCode.replace('+', '').length);
  }
  
  // Vérifier selon le pays (minimum 6 chiffres, maximum 15)
  const isValid = numberToValidate.length >= 6 && numberToValidate.length <= 15 && /^[0-9]+$/.test(numberToValidate);
  
  return {
    isValid: isValid,
    cleanValue: cleanPhone,
    fullNumber: cleanPhone.startsWith(countryCode.replace('+', '')) ? cleanPhone : countryCode.replace('+', '') + cleanPhone
  };
};

const getPasswordStrengthMessage = (password) => {
  if (!password) return '';
  const validation = validatePassword(password);
  if (validation.isValid) return '✓ Mot de passe fort';
  return `⚠️ ${validation.errors.join(', ')}`;
};

const Login = ({ setIsAuthenticated, navigate }) => {
  const [isLogin, setIsLogin] = useState(true); 
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  let phoneValidation = null; 

  if (!isLogin && formData.password !== formData.confirmPassword) {
    setError('Les mots de passe ne correspondent pas');
    setLoading(false);
    return;
  }

  if (!isLogin) {
    if (!validateEmailFormat(formData.email)) {
      setError('Veuillez entrer une adresse email valide (ex: nom@domaine.com)');
      setLoading(false);
      return;
    }

    phoneValidation = validatePhoneNumber(formData.phone, selectedCountry.code);
if (!phoneValidation.isValid) {
  setError(`Veuillez entrer un numéro de téléphone valide pour ${selectedCountry.name} (${selectedCountry.code} XXXXXXXXX)`);
  setLoading(false);
  return;
}
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      setError(`Mot de passe invalide : ${passwordValidation.errors.join(', ')}`);
      setLoading(false);
      return;
    }
  }

  try {
    const url = isLogin 
      ? `${backendUrl}/api/auth/login`
      : `${backendUrl}/api/auth/register`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
  email: formData.email,
  password: formData.password,
  ...(!isLogin && { 
    name: formData.name, 
    phone: phoneValidation ? phoneValidation.fullNumber : ''  // Envoyer le numéro complet avec indicatif
  })
}),
    });

    const data = await response.json();

    if (data.success) {
      if (isLogin) {
        // Connexion normale
        sessionStorage.clear();
        sessionStorage.setItem('isAdminLoggedIn', 'true');
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('userData', JSON.stringify(data.user));
        setIsAuthenticated(true);
        
        if (data.user.termsAccepted === true) {
          navigate('/');
        } else {
          setTimeout(() => {
            navigate('/paiements');
          }, 100);
        }
      } else {
        // Inscription - Envoyer le code de vérification
        const userId = data.user.id;
        
        // Envoyer le code de vérification
        const verifyResponse = await fetch(`${backendUrl}/api/auth/send-verification-code`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            email: formData.email, 
            name: formData.name,
            userId: userId 
          }),
        });
        
        const verifyData = await verifyResponse.json();
        
        if (verifyData.success) {
          // Stocker les données temporairement pour la vérification
          sessionStorage.setItem('pendingVerificationEmail', formData.email);
          sessionStorage.setItem('pendingVerificationToken', data.token);
          sessionStorage.setItem('pendingVerificationUserData', JSON.stringify(data.user));
          
          // Rediriger vers la page de vérification
          navigate('/verify-email');
        } else {
          setError('Erreur lors de l\'envoi du code de vérification');
        }
      }
    } else {
      setError(data.message);
    }
  } catch (err) {
    console.error('Erreur:', err);
    setError('Erreur de connexion au serveur');
  } finally {
    setLoading(false);
  }
};

  const handleGoogleLogin = () => {
    window.location.href = `${backendUrl}/api/auth/google`;
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

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
  <>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Nom complet
      </label>
      <input
        type="text"
        name="name"
        value={formData.name}
        onChange={handleChange}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
        placeholder="Votre nom"
        required={!isLogin}
      />
    </div>

    <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Téléphone
  </label>
  <div className="flex gap-2">
    {/* Sélecteur de pays */}
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowCountryDropdown(!showCountryDropdown)}
        className="flex items-center gap-1 px-3 py-2.5 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-yellow-500"
      >
        <ReactCountryFlag countryCode={selectedCountry.countryCode} svg style={{ width: '1.2em', height: '1.2em' }} />
        <span className="font-medium">{selectedCountry.code}</span>
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {/* Dropdown des pays */}
      {showCountryDropdown && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
          {countries.map((country, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setSelectedCountry(country);
                setShowCountryDropdown(false);
                const phoneInput = document.querySelector('input[name="phone"]');
                if (phoneInput) phoneInput.placeholder = country.example;
              }}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left"
            >
              <ReactCountryFlag countryCode={country.countryCode} svg style={{ width: '1.2em', height: '1.2em' }} />
              <span className="text-sm font-medium">{country.code}</span>
              <span className="text-sm text-gray-500">{country.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
    
    <input
      type="tel"
      name="phone"
      value={formData.phone}
      onChange={handleChange}
      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
      placeholder={selectedCountry.example}
      required={!isLogin}
    />
  </div>
</div>
  </>
)}
              

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                  placeholder="admin@elbalas.com"
                  required
                />
              </div>

              <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Mot de passe
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
    />
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
    >
      {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
    </button>
  </div>
  {!isLogin && formData.password && (
    <p className={`text-xs mt-1 ${validatePassword(formData.password).isValid ? 'text-green-600' : 'text-yellow-600'}`}>
      {getPasswordStrengthMessage(formData.password)}
    </p>
  )}
</div>

              {!isLogin && (
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
        required={!isLogin}
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
)}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-white py-2.5 rounded-lg font-semibold hover:from-yellow-600 hover:to-yellow-700 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Chargement...
                  </span>
                ) : (
                  isLogin ? 'Se connecter' : 'Créer mon compte'
                )}
              </button>
            </form>


            <p className="text-center mt-4 text-gray-600 text-sm">
              {isLogin ? "Vous n'avez pas de compte ?" : "Vous avez déjà un compte ?"}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setFormData({
                    email: '',
                    password: '',
                    confirmPassword: '',
                    name: '',
                    phone: ''
                  });
                }}
                className="ml-1 text-yellow-600 hover:text-yellow-700 font-semibold hover:underline focus:outline-none"
              >
                {isLogin ? 'Créer un compte' : 'Se connecter'}
              </button>
            </p>
            {isLogin && (
  <p className="text-center mt-2">
    <button
      onClick={() => navigate('/forgot-password')}
      className="text-sm text-gray-500 hover:text-yellow-600 hover:underline focus:outline-none"
    >
      Vous avez oublié votre mot de passe ?
    </button>
  </p>
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

export default Login;