import { useState } from 'react';
import { assets } from '../assets/assets';

const Banner = () => {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Vidéo de fond */}
      <video
        autoPlay
        loop
        muted
        playsInline
        onLoadedData={() => setIsVideoLoaded(true)}
        className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-1000 ${
          isVideoLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <source src={assets.video} type="video/mp4" />
        Votre navigateur ne supporte pas la vidéo.
      </video>

      <div className="absolute inset-0 bg-black/40" />

      {/* Contenu */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10">
        <h1 className="text-5xl md:text-7xl font-bold mb-4 text-center">
          <span className="text-yellow-500">EL BALAS</span>
        </h1>
        <p className="text-xl md:text-2xl mb-8 text-center max-w-2xl px-4">
          Votre résidence dans un cadre
        </p>
        <button className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-black px-8 py-3 rounded-md font-semibold text-lg hover:from-yellow-500 hover:to-yellow-400 transition-all duration-300 transform hover:scale-105">
          Découvrir
        </button>
      </div>

    </div>
  );
};

export default Banner;