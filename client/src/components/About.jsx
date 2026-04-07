import { assets } from '../assets/assets';
import Residence3D from './Residence3D';

const About = () => {
  return (
    <div id="about" className="min-h-screen">
      <div className="py-20">
        <h3 className="text-6xl font-bold text-center text-yellow-500">
          À propos
        </h3>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid md:grid-cols-2 gap-16">
          
          <div>
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              EL BALAS est une plateforme conçue pour les propriétaires de résidences 
              qui souhaitent simplifier la gestion de leurs biens immobiliers.
            </p>
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              Que vous ayez plusieurs blocs, des étages avec de nombreux appartements, 
              notre solution vous aide à organiser et suivre l'ensemble de vos locataires 
              et de vos paiements.
            </p>
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              Plus besoin de cahiers ou de fichiers Excel, tout est centralisé dans 
              un espace admin clair et intuitif.
            </p>
            <div className="border-l-4 border-yellow-500 pl-6 mt-8">
              <p className="text-xl text-gray-800 italic">
                "Une gestion simple pour les propriétaires, un confort pour les locataires"
              </p>
            </div>
          </div>

          {/* REMPLACÉ : Espace photo → Résidence 3D */}
          <div className="flex items-center justify-center">
            <Residence3D />
          </div>
        </div>
      </div>

      {/* Section Pourquoi EL BALAS - inchangée */}
      <div className="bg-gray-50 py-20 mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
            Pourquoi EL BALAS ?
          </h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Simplifiez</h3>
              <p className="text-gray-600 leading-relaxed">
                Plus de paperasse. Toutes vos informations sont accessibles depuis votre tableau de bord.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Organisez</h3>
              <p className="text-gray-600 leading-relaxed">
                Structurez votre résidence par blocs, étages et appartements pour y voir plus clair.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Suivez</h3>
              <p className="text-gray-600 leading-relaxed">
                Gardez un œil sur les paiements et les occupants en temps réel.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;