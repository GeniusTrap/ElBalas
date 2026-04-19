import React from 'react';
import { FaEnvelope, FaPhone } from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white pt-12 pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-8">
          
          {/* Colonne 1 - Logo et description */}
          <div>
            <h3 className="text-2xl font-bold text-yellow-500 mb-4">EL BALAS</h3>
            <p className="text-gray-400 text-sm leading-relaxed max-w-md">
              La solution complète pour la gestion de votre résidence.<br />
              Simplifiez l'administration de vos biens immobiliers<br />
              et suivez vos locataires en temps réel.
            </p>
          </div>

          {/* Colonne 2 - Contact */}
          <div className="md:text-right">
            <h4 className="text-lg font-semibold text-yellow-500 mb-4">Contact</h4>
            <div className="space-y-3">
              <a 
  href="https://mail.google.com/mail/?view=cm&fs=1&to=elbalas.support@gmail.com&su=Demande%20d%27information%20EL%20BALAS"
  target="_blank"
  rel="noopener noreferrer"
  className="flex items-center gap-3 text-gray-400 hover:text-yellow-500 transition-colors duration-300 md:justify-end"
>
  <FaEnvelope className="text-yellow-500" />
  <span>elbalas.support@gmail.com</span>
</a>
              <a 
                href="tel:+21621915864"
                className="flex items-center gap-3 text-gray-400 hover:text-yellow-500 transition-colors duration-300 md:justify-end"
              >
                <FaPhone className="text-yellow-500" />
                <span>21 915 864</span>
              </a>
            </div>
          </div>
        </div>

        {/* Séparateur */}
        <div className="border-t border-gray-800 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              © {currentYear} EL BALAS. Tous droits réservés.
            </p>
            <div className="flex gap-6 text-sm">
              <a href="#" className="text-gray-500 hover:text-yellow-500 transition-colors">
                Mentions légales
              </a>
              <a href="#" className="text-gray-500 hover:text-yellow-500 transition-colors">
                Politique de confidentialité
              </a>
              <a href="#" className="text-gray-500 hover:text-yellow-500 transition-colors">
                CGU
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;