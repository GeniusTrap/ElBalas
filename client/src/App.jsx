import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Banner from './components/Banner';
import About from './components/About';
import { assets } from './assets/assets';
import HowItWorks from './components/HowItWorks';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-fixed bg-cover bg-center"
      style={{ backgroundImage: `url(${assets.background})` }}>
        
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={
              <>
                <Banner />
                <About />
                <HowItWorks />
                <Footer />
                <ScrollToTop />
              </>
            } />
            
            <Route path="/admin" element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="bg-white p-8 rounded-xl shadow-lg text-center">
                  <p className="text-gray-600">Redirection en cours...</p>
                </div>
              </div>
            } />
            
            <Route path="*" element={<div>Page non trouvée</div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;