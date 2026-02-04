
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
            <div className="w-8 h-8 md:w-10 md:h-10 bg-p_red rounded-xl flex items-center justify-center text-white font-cotta text-xl md:text-2xl shadow-lg transform rotate-3 pt-1 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">W</div>
            <span className="font-cotta text-white text-2xl md:text-3xl tracking-wide transition-colors group-hover:text-p_cream">Wardrobe</span>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
            <button 
                onClick={onLogin}
                className="px-3 md:px-6 py-2 text-white font-bold hover:text-p_cream transition-colors relative group text-sm md:text-base"
            >
                Sign In
                <span className="absolute bottom-1 left-6 right-6 h-0.5 bg-p_cream transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
            </button>
            <button 
                onClick={onSignup}
                className="px-4 md:px-6 py-2 md:py-2.5 bg-p_red text-white font-bold rounded-lg hover:bg-red-500 transition-all shadow-lg btn-hover hover:scale-105 text-sm md:text-base"
            >
                Get Started
            </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 max-w-5xl mx-auto mt-4 md:mt-12 relative z-10">
        
        <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-white/10 border border-white/20 text-white rounded-full text-xs md:text-sm font-bold mb-6 md:mb-8 backdrop-blur-sm animate-pulse cursor-default hover:bg-white/20 transition-colors">
            <Sparkles size={14} className="text-p_cream" />
            <span>AI-Powered Styling Engine</span>
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
                className="text-4xl sm:text-5xl md:text-7xl font-black text-p_red leading-tight tracking-tight text-center drop-shadow-lg"
            />
        </div>
        
        <p className="text-lg md:text-xl text-p_light mb-8 md:mb-10 max-w-2xl leading-relaxed font-medium drop-shadow-md opacity-90 px-4">
            Digitize your wardrobe. Let artificial intelligence curate your daily aesthetic based on your unique profile.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 md:gap-6 w-full justify-center px-6">
            <button 
                onClick={onSignup}
                className="group px-8 md:px-10 py-4 md:py-5 bg-p_red text-white rounded-xl font-bold text-lg md:text-xl shadow-2xl hover:shadow-p_red/50 transition-all btn-hover flex items-center justify-center gap-2 border-2 border-transparent hover:border-white/20 hover:scale-105 w-full sm:w-auto"
            >
                Start Styling <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-16 md:mt-24 w-full max-w-3xl">
            <FeatureCard 
                icon={<Shirt className="w-8 h-8 text-p_dark group-hover:scale-110 transition-transform duration-300" />}
                title="DIGITIZE"
                desc="Upload your collection. AI automatically categorizes materials, styles, and colors."
            />
            <FeatureCard 
                icon={<Sparkles className="w-8 h-8 text-p_dark group-hover:rotate-12 transition-transform duration-300" />}
                title="SYNTHESIZE"
                desc="Daily outfit generation calibrated to your biometrics and local weather."
            />
        </div>
      </div>

      <footer className="p-6 md:p-8 text-center text-white/60 text-xs md:text-sm mt-auto border-t border-white/10 relative z-10 font-medium">
        © 2026 Online Wardrobe. Engineered for Style.
      </footer>
    </div>
  );
};

const FeatureCard: React.FC<{icon: React.ReactNode, title: string, desc: string}> = ({ icon, title, desc }) => (
    <div className="group bg-p_cream p-6 md:p-8 rounded-3xl border border-white/50 text-left hover:scale-[1.02] transition duration-300 shadow-xl cursor-default hover:shadow-2xl">
        <div className="w-12 h-12 md:w-16 md:h-16 bg-p_teal rounded-2xl flex items-center justify-center mb-4 md:mb-6 shadow-inner transition-colors group-hover:bg-white">
            {icon}
        </div>
        <h3 className="font-black text-p_dark text-lg md:text-xl mb-2 md:mb-3 tracking-wide">{title}</h3>
        <p className="text-p_brown text-sm md:text-base leading-relaxed font-medium">{desc}</p>
    </div>
);

export default LandingPage;
