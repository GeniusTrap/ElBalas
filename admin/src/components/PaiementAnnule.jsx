import React from 'react';
import { FaTimesCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const PaiementAnnule = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
        <FaTimesCircle className="text-6xl text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Paiement annulé
        </h1>
        <p className="text-gray-600 mb-6">
          Le paiement a été annulé. Vous pouvez réessayer quand vous voulez.
        </p>
        <button
          onClick={() => navigate('/paiements')}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg"
        >
          Retour aux paiements
        </button>
      </div>
    </div>
  );
};

export default PaiementAnnule;