
import React from 'react';
import { UserProfile, ClothingItem } from '../types';

interface MannequinDisplayProps {
  profile: UserProfile | null;
  top?: ClothingItem | null;
  bottom?: ClothingItem | null;
  shoes?: ClothingItem | null;
  scale?: number;
}

const MannequinDisplay: React.FC<MannequinDisplayProps> = ({ profile, top, bottom, shoes, scale = 1 }) => {
  if (!profile) return null;

  // Mannequin Calculation Logic
  // Base standards: Height 170cm, Weight 65kg
  const heightRatio = Math.max(0.8, Math.min(1.2, profile.height / 170));
  const weightRatio = Math.max(0.8, Math.min(1.4, profile.weight / 65));

  const skinColor = profile.skinToneHex || '#C68642';

  // Dimensions (Base px)
  const headSize = 50 * scale;
  const torsoWidth = 80 * weightRatio * scale;
  const torsoHeight = 110 * heightRatio * scale;
  const legWidth = (torsoWidth / 2.2); 
  const legHeight = 140 * heightRatio * scale;
  const armWidth = 18 * weightRatio * scale;
  const armHeight = 120 * heightRatio * scale;

  return (
    <div className="relative flex flex-col items-center justify-end" style={{ height: `${400 * scale}px`, width: '100%' }}>
      
      {/* Mannequin Body Construction */}
      <div className="relative flex flex-col items-center z-0 transition-all duration-500">
        
        {/* Head */}
        <div 
            className="rounded-full mb-1 shadow-sm relative z-20"
            style={{ 
                width: `${headSize}px`, 
                height: `${headSize}px`, 
                backgroundColor: skinColor 
            }}
        />

        {/* Neck */}
        <div 
            className="mb-[-5px] relative z-10"
            style={{ 
                width: `${headSize * 0.4}px`, 
                height: `${headSize * 0.4}px`, 
                backgroundColor: skinColor 
            }}
        />

        <div className="relative flex justify-center">
            {/* Left Arm */}
            <div 
                className="rounded-full absolute top-2 right-full mr-1 origin-top-right transform -rotate-6"
                style={{ 
                    width: `${armWidth}px`, 
                    height: `${armHeight}px`, 
                    backgroundColor: skinColor 
                }}
            />

            {/* Torso */}
            <div 
                className="rounded-3xl relative z-10"
                style={{ 
                    width: `${torsoWidth}px`, 
                    height: `${torsoHeight}px`, 
                    backgroundColor: skinColor 
                }}
            >
                {/* Torso Shading for shape */}
                <div className="absolute inset-0 bg-black/5 rounded-3xl" />
            </div>

            {/* Right Arm */}
             <div 
                className="rounded-full absolute top-2 left-full ml-1 origin-top-left transform rotate-6"
                style={{ 
                    width: `${armWidth}px`, 
                    height: `${armHeight}px`, 
                    backgroundColor: skinColor 
                }}
            />
        </div>

        {/* Legs Container */}
        <div className="flex gap-2 mt-[-10px] relative z-0">
             {/* Left Leg */}
             <div 
                className="rounded-b-full"
                style={{ 
                    width: `${legWidth}px`, 
                    height: `${legHeight}px`, 
                    backgroundColor: skinColor 
                }}
            />
            {/* Right Leg */}
            <div 
                className="rounded-b-full"
                style={{ 
                    width: `${legWidth}px`, 
                    height: `${legHeight}px`, 
                    backgroundColor: skinColor 
                }}
            />
        </div>
      </div>

      {/* Clothing Overlays */}
      <div className="absolute inset-0 flex flex-col items-center z-30 pointer-events-none">
          {/* Top Overlay */}
          <div className="mt-[50px]" style={{ width: `${torsoWidth * 1.8}px`, height: `${torsoHeight * 1.2}px`, marginTop: `${headSize}px` }}>
              {top && (
                  <img src={top.image} className="w-full h-full object-contain drop-shadow-xl" />
              )}
          </div>
      </div>
      
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-[10px] z-20 pointer-events-none">
           {/* Bottom Overlay */}
           <div className="absolute" style={{ bottom: `${legHeight * 0.4}px`, width: `${torsoWidth * 1.4}px`, height: `${legHeight * 0.8}px` }}>
              {bottom && (
                  <img src={bottom.image} className="w-full h-full object-contain drop-shadow-xl" />
              )}
           </div>

           {/* Shoes Overlay */}
           <div className="absolute bottom-0 flex gap-4" style={{ width: `${torsoWidth * 1.5}px`, height: `${headSize}px` }}>
              {shoes && (
                  <img src={shoes.image} className="w-full h-full object-contain drop-shadow-lg" />
              )}
           </div>
      </div>

    </div>
  );
};

export default MannequinDisplay;
