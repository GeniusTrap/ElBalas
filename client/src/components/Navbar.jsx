import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { assets } from '../assets/assets';  

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Détecte le scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fonctions de scroll
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  const scrollToFooter = () => {
    const footer = document.querySelector('footer');
    if (footer) {
      footer.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  return (
    <nav className="w-full fixed top-0 z-50 bg-transparent">
      <div className="px-10 py-3"> 
        <div className="flex justify-between items-center">
          
          {/* Logo - toujours visible à gauche */}
          <button onClick={scrollToTop} className="flex-shrink-0 sticky left-0 cursor-pointer"> 
            <img 
              src={assets.elbalas}  
              alt="EL BALAS" 
              className="h-12 w-auto object-contain hover:scale-105 transition-transform duration-300" 
            />
          </button>

          {/* Conteneur pour grouper les éléments de droite avec fond blanc */}
          <div className={`flex items-center bg-white/90 backdrop-blur-sm rounded-full px-4 py-1.5 shadow-lg transition-opacity duration-300 ${
            isScrolled ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}>
            {/* Menu Desktop */}
            <div className="hidden md:flex items-center space-x-6 mr-4"> 
              <button 
                onClick={scrollToTop}
                className="text-gray-800 hover:text-yellow-600 transition-colors duration-300 font-medium px-2 py-1"
              >
                Accueil
              </button>
              <button 
                onClick={() => scrollToSection('about')}
                className="text-gray-800 hover:text-yellow-600 transition-colors duration-300 font-medium px-2 py-1"
              >
                À propos
              </button>
              <button 
                onClick={scrollToFooter}
                className="text-gray-800 hover:text-yellow-600 transition-colors duration-300 font-medium px-2 py-1"
              >
                Contact
              </button>
            </div>

            {/* Bouton Admin */}
            <div className="flex items-center space-x-2">
              <a 
                href="http://localhost:5174" 
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:block bg-gradient-to-r from-yellow-600 to-yellow-500 text-black px-5 py-2 rounded-full font-semibold hover:from-yellow-500 hover:to-yellow-400 transition-all duration-300 text-sm"
              >
                Espace Admin
              </a>

              {/* Menu mobile button */}
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden text-yellow-600 hover:text-yellow-700 focus:outline-none ml-2"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Menu Mobile - apparaît quand on clique même en scroll */}
        {isMenuOpen && (
  <div className={`md:hidden bg-white border-t border-gray-200 mt-2 py-2 rounded-lg shadow-lg transition-opacity duration-300 ${
    isScrolled ? 'opacity-0 pointer-events-none' : 'opacity-100'
  }`}>
    <div className="flex flex-col space-y-2">
      <button 
        onClick={scrollToTop}
        className="text-gray-700 hover:text-yellow-600 transition-colors duration-300 py-2 px-4"
      >
        Accueil
      </button>
      <button 
        onClick={() => scrollToSection('about')}
        className="text-gray-700 hover:text-yellow-600 transition-colors duration-300 py-2 px-4"
      >
        À propos
      </button>
      <button 
        onClick={scrollToFooter}
        className="text-gray-700 hover:text-yellow-600 transition-colors duration-300 py-2 px-4"
      >
        Contact
      </button>
      <a 
        href="https://elbalas-admin.vercel.app" 
        target="_blank"
        rel="noopener noreferrer"
        className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-black px-4 py-2 rounded-md font-semibold text-center mx-4 mb-2"
        onClick={() => setIsMenuOpen(false)}
      >
        Espace Admin
      </a>
    </div>
  </div>
)}
      </div>
    </nav>
  );
};

export default Navbar;