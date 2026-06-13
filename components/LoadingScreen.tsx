import React from 'react';
import { Sparkles } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  subMessage?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
    message = "Loading", 
    subMessage 
}) => {
  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#0a0f1a] page-enter overflow-hidden text-center w-screen h-screen">
      {/* Grid Overlay Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Dynamic Background Effects */}
      <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-p_red/5 rounded-none blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-p_red/5 rounded-none blur-[120px] animate-pulse delay-700" />

      <div className="relative z-10 flex flex-col items-center">
        {/* Brutalist Spinner Container */}
        <div className="w-24 h-24 mb-8 relative flex items-center justify-center">
          {/* Rotating square frames with thick borders */}
          <div className="absolute inset-0 bg-[#0d1325] border-2 border-white/10 shadow-[4px_4px_0_rgba(255,90,80,0.2)] rounded-none animate-spin" style={{ animationDuration: '4s' }} />
          <div className="absolute inset-0 bg-transparent border-2 border-[#FF5A50] shadow-[2px_2px_0_rgba(255,255,255,0.1)] rounded-none animate-spin" style={{ animationDuration: '6s', animationDirection: 'reverse' }} />
          
          <div className="absolute inset-0 flex items-center justify-center text-[#FF5A50] animate-pulse">
            <Sparkles size={32} />
          </div>
        </div>

        <h2 className="text-2xl font-mono font-black text-white tracking-wider uppercase mb-2">
          {message}
        </h2>

        {subMessage && (
            <div className="flex flex-col gap-1 items-center text-[#FF5A50] font-mono font-bold text-xs tracking-widest uppercase opacity-80">
                <span className="animate-pulse">{subMessage}</span>
            </div>
        )}
      </div>
    </div>
  );
};

export default LoadingScreen;
