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
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#0a0f12]/90 backdrop-blur-xl page-enter overflow-hidden text-center w-screen h-screen">
      {/* Dynamic Background Effects */}
      <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-p_teal/10 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-p_teal/10 rounded-full blur-[100px] animate-pulse delay-700" />

      <div className="relative z-10 flex flex-col items-center">
        {/* Liquid Glass Spinner Container */}
        <div className="w-24 h-24 mb-8 relative flex items-center justify-center">
          {/* Glass panels rotating */}
          <div className="absolute inset-0 bg-white/5 border border-white/10 shadow-xl backdrop-blur-sm rounded-3xl animate-spin" style={{ animationDuration: '4s' }} />
          <div className="absolute inset-0 bg-p_teal/5 border border-p_teal/10 shadow-lg backdrop-blur-md rounded-3xl animate-spin" style={{ animationDuration: '5s', animationDirection: 'reverse' }} />
          
          <div className="absolute inset-0 flex items-center justify-center text-p_teal animate-pulse">
            <Sparkles size={32} />
          </div>
        </div>

        <h2 className="text-2xl font-black text-white tracking-tight mb-2 drop-shadow-md">
          {message}
        </h2>

        {subMessage && (
            <div className="flex flex-col gap-1 items-center text-p_teal font-bold text-xs tracking-widest uppercase opacity-80">
                <span className="animate-pulse">{subMessage}</span>
            </div>
        )}
      </div>
    </div>
  );
};

export default LoadingScreen;
