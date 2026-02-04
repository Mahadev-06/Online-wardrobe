
import React, { useState, useEffect } from 'react';
import { useWardrobe } from '../context/WardrobeContext';
import { UserProfile } from '../types';
import { User, Ruler, Weight, Palette, ArrowLeft, LogIn, Check, Sparkles, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProfileSetupProps {
  onBack: () => void;
  mode: 'signup' | 'login';
}

const SKIN_TONES = [
  { name: 'Fair', hex: '#FAD1BC' },
  { name: 'Light', hex: '#E0AC69' },
  { name: 'Medium', hex: '#C68642' },
  { name: 'Olive', hex: '#8D5524' },
  { name: 'Brown', hex: '#573C28' },
  { name: 'Dark', hex: '#2A1D17' },
];

const ProfileSetup: React.FC<ProfileSetupProps> = ({ onBack, mode }) => {
  const { setProfile, loginWithGoogle, user, profile: existingProfile } = useWardrobe();
  const navigate = useNavigate();
  
  // Step state: 0 = Auth Choice, 1 = Data Entry
  const [step, setStep] = useState(0);

  // Internal state for form
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Female');
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  
  const [heightCm, setHeightCm] = useState<string>('170');
  const [heightFt, setHeightFt] = useState<string>('5');
  const [heightIn, setHeightIn] = useState<string>('7');

  const [weightKg, setWeightKg] = useState<string>('65');
  const [weightLbs, setWeightLbs] = useState<string>('143');

  const [selectedSkinTone, setSelectedSkinTone] = useState(SKIN_TONES[2]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');

  // Effect: If user logs in via Google and has a profile, skip setup
  useEffect(() => {
    if (user && existingProfile) {
        // User has data, done.
        setLoadingText('Restoring your wardrobe...');
        setIsLoading(true);
        setTimeout(() => {
           // Parent component will handle redirect if profile exists
        }, 1000);
    } else if (user && !existingProfile && step === 0) {
        // User logged in but no profile data yet -> Go to Step 1 (Form)
        setName(user.name); // Pre-fill name from Google
        setStep(1);
    }
  }, [user, existingProfile, step]);

  const handleGoogleLogin = async () => {
      setIsLoading(true);
      setLoadingText('Connecting to Google...');
      await loginWithGoogle();
      setIsLoading(false);
      // The useEffect above will handle the next transition
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoadingText('Creating your digital stylist...');

    let finalHeight = 0;
    let finalWeight = 0;

    if (heightUnit === 'cm') {
      finalHeight = parseFloat(heightCm);
    } else {
      finalHeight = (parseFloat(heightFt) * 30.48) + (parseFloat(heightIn) * 2.54);
    }

    if (weightUnit === 'kg') {
      finalWeight = parseFloat(weightKg);
    } else {
      finalWeight = parseFloat(weightLbs) * 0.453592;
    }

    const newProfile: UserProfile = {
      name,
      gender,
      height: Math.round(finalHeight),
      weight: Math.round(finalWeight),
      skinTone: selectedSkinTone.name,
      skinToneHex: selectedSkinTone.hex,
    };

    // Simulate AI setup
    await new Promise(resolve => setTimeout(resolve, 2000));
    setProfile(newProfile);
    // Context update will trigger app redirect
  };

  const isLogin = mode === 'login';

  if (isLoading) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-p_dark p-6 relative page-enter overflow-hidden text-center">
            {/* Background Decorations */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-p_red/10 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-p_teal/10 rounded-full blur-[100px] animate-pulse delay-700"></div>

            <div className="relative z-10 flex flex-col items-center">
                <div className="w-24 h-24 mb-8 relative">
                     <div className="absolute inset-0 border-4 border-p_red/30 rounded-full animate-ping"></div>
                     <div className="absolute inset-0 border-4 border-t-p_red rounded-full animate-spin"></div>
                     <div className="absolute inset-0 flex items-center justify-center text-p_cream">
                        <Sparkles size={32} />
                     </div>
                </div>
                
                <h2 className="text-3xl font-black text-white tracking-tight mb-4 animate-fade-in">
                    {loadingText || 'Processing...'}
                </h2>
                
                <div className="flex flex-col gap-2 items-center text-p_teal/80 font-medium text-sm tracking-widest uppercase">
                    <span className="animate-pulse">Syncing Data</span>
                    <span className="animate-pulse delay-300">Calibrating Style</span>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-p_dark p-4 relative page-enter overflow-hidden">
        
      {/* Back Button */}
      <button 
        onClick={step === 1 ? () => setStep(0) : onBack}
        className="absolute top-6 left-6 flex items-center gap-2 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 px-5 py-2.5 rounded-full transition-all font-bold z-20 shadow-lg"
      >
        <ArrowLeft size={18} />
        <span>{step === 1 ? 'Back' : 'Home'}</span>
      </button>

      {/* Card */}
      <div className="bg-p_cream w-full max-w-[420px] rounded-[2.5rem] p-8 shadow-2xl relative z-10 animate-scale-in border-4 border-p_dark/5">
        
        {/* Header Icon */}
        <div className="flex justify-center mb-6">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white shadow-xl transform rotate-0 ${isLogin ? 'bg-p_teal' : 'bg-p_red'}`}>
                {isLogin ? <LogIn size={32} strokeWidth={2.5} /> : <User size={32} strokeWidth={2.5} />}
            </div>
        </div>

        <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-p_dark tracking-tight mb-1">
                {step === 0 ? (isLogin ? 'Welcome Back' : 'Create Account') : 'Setup Profile'}
            </h1>
            <p className="text-xs font-bold text-p_brown/60 uppercase tracking-wide">
                 {step === 0 ? 'Choose how you want to continue' : 'Enter details for your AI stylist'}
            </p>
        </div>

        {/* Step 0: Auth Selection */}
        {step === 0 && (
            <div className="space-y-4">
                 <button
                    onClick={handleGoogleLogin}
                    className="w-full py-4 bg-white text-gray-700 rounded-xl font-bold text-base shadow-lg hover:bg-gray-50 transition-all flex items-center justify-center gap-3 border border-gray-200 group hover:scale-[1.02]"
                >
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6 group-hover:scale-110 transition" alt="Google" />
                    Continue with Google
                </button>

                <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-300"></span></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-p_cream px-2 text-p_brown/60 font-bold">Or continue as guest</span></div>
                </div>

                <button
                    onClick={() => setStep(1)}
                    className="w-full py-4 bg-p_dark text-white rounded-xl font-bold text-base shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
                >
                    <User size={20} /> Guest Setup
                </button>
                
                <div className="bg-p_red/10 p-3 rounded-lg flex items-start gap-2 mt-4">
                     <AlertCircle size={16} className="text-p_red shrink-0 mt-0.5" />
                     <p className="text-xs text-p_red font-medium text-left leading-tight">
                        Guest data is saved to this browser only. Use Google to sync across devices.
                     </p>
                </div>
            </div>
        )}

        {/* Step 1: Profile Form */}
        {step === 1 && (
            <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
                
                {/* Display Name */}
                <div>
                    <label className="block text-[10px] font-black text-p_red uppercase tracking-widest mb-1.5 ml-1">Display Name</label>
                    <input
                        type="text"
                        required
                        className="w-full bg-white rounded-xl px-4 py-3.5 font-bold text-p_dark placeholder:text-gray-300 focus:outline-none focus:ring-4 focus:ring-p_red/10 shadow-sm border-2 border-transparent focus:border-p_red/20 transition-all"
                        placeholder="e.g. Alex"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>

                {/* Gender */}
                <div>
                    <label className="block text-[10px] font-black text-p_red uppercase tracking-widest mb-2 ml-1">Gender</label>
                    <div className="flex bg-white p-1 rounded-xl shadow-sm">
                        <button
                            type="button"
                            onClick={() => setGender('Female')}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${gender === 'Female' ? 'bg-p_red text-white shadow-md' : 'text-gray-400 hover:text-p_dark'}`}
                        >
                            Female
                        </button>
                        <button
                            type="button"
                            onClick={() => setGender('Male')}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${gender === 'Male' ? 'bg-p_teal text-white shadow-md' : 'text-gray-400 hover:text-p_dark'}`}
                        >
                            Male
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Height */}
                    <div>
                        <div className="flex justify-between items-center mb-1.5 ml-1">
                            <label className="text-[10px] font-black text-p_red uppercase tracking-widest flex items-center gap-1"><Ruler size={10}/> Height</label>
                            <div className="flex bg-white/50 rounded-md p-0.5">
                                <button type="button" onClick={() => setHeightUnit('cm')} className={`text-[8px] font-black px-1.5 py-0.5 rounded ${heightUnit === 'cm' ? 'bg-p_dark text-white' : 'text-p_brown'}`}>CM</button>
                                <button type="button" onClick={() => setHeightUnit('ft')} className={`text-[8px] font-black px-1.5 py-0.5 rounded ${heightUnit === 'ft' ? 'bg-p_dark text-white' : 'text-p_brown'}`}>FT</button>
                            </div>
                        </div>
                        {heightUnit === 'cm' ? (
                            <input
                                type="number"
                                required
                                className="w-full bg-white rounded-xl px-4 py-3.5 font-bold text-p_dark placeholder:text-gray-300 focus:outline-none focus:ring-4 focus:ring-p_red/10 shadow-sm"
                                placeholder="170"
                                value={heightCm}
                                onChange={(e) => setHeightCm(e.target.value)}
                            />
                        ) : (
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    required
                                    className="w-full bg-white rounded-xl px-2 py-3.5 font-bold text-p_dark placeholder:text-gray-300 focus:outline-none shadow-sm text-center"
                                    placeholder="5"
                                    value={heightFt}
                                    onChange={(e) => setHeightFt(e.target.value)}
                                />
                                <input
                                    type="number"
                                    required
                                    className="w-full bg-white rounded-xl px-2 py-3.5 font-bold text-p_dark placeholder:text-gray-300 focus:outline-none shadow-sm text-center"
                                    placeholder="7"
                                    value={heightIn}
                                    onChange={(e) => setHeightIn(e.target.value)}
                                />
                            </div>
                        )}
                    </div>

                    {/* Weight */}
                    <div>
                        <div className="flex justify-between items-center mb-1.5 ml-1">
                            <label className="text-[10px] font-black text-p_red uppercase tracking-widest flex items-center gap-1"><Weight size={10}/> Weight</label>
                            <div className="flex bg-white/50 rounded-md p-0.5">
                                <button type="button" onClick={() => setWeightUnit('kg')} className={`text-[8px] font-black px-1.5 py-0.5 rounded ${weightUnit === 'kg' ? 'bg-p_dark text-white' : 'text-p_brown'}`}>KG</button>
                                <button type="button" onClick={() => setWeightUnit('lbs')} className={`text-[8px] font-black px-1.5 py-0.5 rounded ${weightUnit === 'lbs' ? 'bg-p_dark text-white' : 'text-p_brown'}`}>LBS</button>
                            </div>
                        </div>
                        <input
                            type="number"
                            required
                            className="w-full bg-white rounded-xl px-4 py-3.5 font-bold text-p_dark placeholder:text-gray-300 focus:outline-none focus:ring-4 focus:ring-p_red/10 shadow-sm"
                            placeholder={weightUnit === 'kg' ? '65' : '143'}
                            value={weightUnit === 'kg' ? weightKg : weightLbs}
                            onChange={(e) => weightUnit === 'kg' ? setWeightKg(e.target.value) : setWeightLbs(e.target.value)}
                        />
                    </div>
                </div>

                {/* Skin Tone */}
                <div>
                    <label className="block text-[10px] font-black text-p_red uppercase tracking-widest mb-2 ml-1 flex items-center gap-1"><Palette size={10}/> Skin Tone</label>
                    <div className="flex justify-between bg-white/50 p-2 rounded-xl">
                        {SKIN_TONES.map((tone) => (
                            <button
                                key={tone.name}
                                type="button"
                                onClick={() => setSelectedSkinTone(tone)}
                                className={`w-9 h-9 rounded-full transition-all duration-300 flex items-center justify-center relative ${selectedSkinTone.name === tone.name ? 'scale-110 shadow-md ring-2 ring-white' : 'opacity-70 hover:opacity-100 hover:scale-105'}`}
                                style={{ backgroundColor: tone.hex }}
                                title={tone.name}
                            >
                                {selectedSkinTone.name === tone.name && (
                                    <Check size={14} className="text-white/90 stroke-[4px]" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-xl transition-all transform hover:-translate-y-1 active:scale-95 mt-4 bg-p_red hover:bg-red-500 shadow-p_red/30`}
                >
                    Complete Setup
                </button>
            </form>
        )}

      </div>
    </div>
  );
};

export default ProfileSetup;
