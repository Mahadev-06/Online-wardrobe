
import React from 'react';
import { Shirt, Sparkles, ArrowRight } from 'lucide-react';
import BlurText from '../components/BlurText';
import Aurora from '../components/Aurora';

interface LandingPageProps {
  onSignup: () => void;
  onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSignup, onLogin }) => {
  return (
    <div className="min-h-screen bg-p_dark text-white flex flex-col page-enter relative overflow-hidden">
      {/* Dynamic Aurora Background */}
      <Aurora 
        colorStops={['#E64833', '#90AEAD', '#FBE9D0']} 
        speed={0.5} 
        amplitude={1.2}
      />

      {/* Navbar */}
      <nav className="p-4 md:p-6 flex justify-between items-center max-w-7xl mx-auto w-full relative z-10">
        <div className="flex items-center gap-2 group cursor-default">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-p_teal rounded-[2.5rem] flex items-center justify-center text-white font-cotta text-xl md:text-2xl shadow-lg transform rotate-3 pt-1 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">W</div>
            <span className="font-cotta text-white text-2xl md:text-3xl tracking-wide transition-colors group-hover:text-gray-300">Wardrobe</span>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
            <button 
                onClick={onLogin}
                className="px-3 md:px-6 py-2 text-white font-bold hover:text-gray-300 transition-colors relative group text-sm md:text-base"
            >
                Sign In
                <span className="absolute bottom-1 left-6 right-6 h-0.5 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
            </button>
            <button 
                onClick={onSignup}
                className="px-5 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold rounded-[2.5rem] hover:bg-white/20 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] shadow-lg hover:scale-105 active:scale-[0.98] text-sm md:text-base"
            >
                Get Started
            </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 max-w-5xl mx-auto mt-4 md:mt-12 relative z-10">
        
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 text-white rounded-full text-[10px] uppercase tracking-[0.2em] font-semibold mb-6 md:mb-8 backdrop-blur-sm cursor-default hover:bg-white/10 transition-colors duration-500">
            <Sparkles size={12} className="text-gray-300 animate-pulse" />
            <span>Smart Styling System</span>
        </div>
        
        <div className="mb-6 flex flex-col items-center justify-center select-none">
            <BlurText 
                text="CLOSET OF THE" 
                delay={50}
                animateBy="chars"
                className="text-4xl sm:text-5xl md:text-7xl font-black text-white leading-tight tracking-tight text-center mb-2 drop-shadow-lg" 
            />
            
            <BlurText 
                text="FUTURE." 
                delay={50}
                animateBy="chars"
                className="text-4xl sm:text-5xl md:text-7xl font-black text-p_teal leading-tight tracking-tight text-center drop-shadow-lg"
            />
        </div>
        
        <p className="text-lg md:text-xl text-gray-400 mb-8 md:mb-10 max-w-2xl leading-relaxed font-medium drop-shadow-md opacity-90 px-4">
            Digitize your wardrobe. Curate your daily aesthetic and plan your outfits with our robust organization tools.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 md:gap-6 w-full justify-center px-6">
            <button 
                onClick={onSignup}
                className="group px-8 md:px-10 py-4 bg-p_teal/10 hover:bg-p_teal/20 backdrop-blur-md border border-p_teal/30 text-p_teal rounded-[2.5rem] font-bold text-lg md:text-xl shadow-2xl hover:shadow-p_teal/20 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] flex items-center justify-center gap-4 hover:scale-105 active:scale-[0.98] w-full sm:w-auto"
            >
                <span>Start Styling</span>
                <div className="w-8 h-8 rounded-full bg-p_teal/20 group-hover:bg-p_teal/30 flex items-center justify-center transition-all duration-500 group-hover:translate-x-1 group-hover:-translate-y-[1px] group-hover:scale-105">
                    <ArrowRight className="w-4 h-4 text-p_teal" />
                </div>
            </button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-16 md:mt-24 w-full max-w-3xl">
            <FeatureCard 
                icon={<Shirt className="w-8 h-8 text-white group-hover:scale-110 transition-transform duration-300" />}
                title="DIGITIZE"
                desc="Upload your collection and easily categorize materials, styles, and colors."
            />
            <FeatureCard 
                icon={<Sparkles className="w-8 h-8 text-white group-hover:rotate-12 transition-transform duration-300" />}
                title="ORGANIZE"
                desc="Build and schedule your favorite outfits efficiently for any occasion."
            />
        </div>
      </div>

      <footer className="p-6 md:p-8 text-center text-gray-500 text-xs md:text-sm mt-auto border-t border-white/10 relative z-10 font-medium">
        © 2026 Online Wardrobe. Engineered for Style.
      </footer>
    </div>
  );
};

const FeatureCard: React.FC<{icon: React.ReactNode, title: string, desc: string}> = ({ icon, title, desc }) => (
    <div className="group bg-white/5 border border-white/10 p-1 rounded-[2.5rem] hover:scale-[1.02] transition duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] shadow-xl cursor-default hover:shadow-2xl">
        <div className="bg-[#050505]/30 backdrop-blur-md p-6 md:p-8 rounded-[calc(2.5rem-0.25rem)] border border-white/5 h-full">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-white/5 border border-white/10 rounded-[2rem] flex items-center justify-center mb-4 md:mb-6 shadow-sm transition-colors duration-500 group-hover:bg-white/10">
                {icon}
            </div>
            <h3 className="font-extrabold text-white text-lg md:text-xl mb-2 md:mb-3 tracking-wide">{title}</h3>
            <p className="text-gray-400 text-sm md:text-base leading-relaxed font-medium">{desc}</p>
        </div>
    </div>
);

export default LandingPage;
