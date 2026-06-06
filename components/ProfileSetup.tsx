import React, { useState, useEffect } from 'react';
import { useWardrobe } from '../context/WardrobeContext';
import { UserProfile } from '../types';
import {
  User,
  Ruler,
  Weight,
  Check,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
  UserPlus,
  ArrowLeft,
  LogIn,
  Palette
} from 'lucide-react';
import LoadingScreen from './LoadingScreen';

interface ProfileSetupProps {
  onBack: () => void;
  mode: 'signup' | 'login';
}

const SKIN_TONES = [
  { name: 'Fair',   hex: '#FAD1BC' },
  { name: 'Light',  hex: '#E0AC69' },
  { name: 'Medium', hex: '#C68642' },
  { name: 'Olive',  hex: '#8D5524' },
  { name: 'Brown',  hex: '#573C28' },
  { name: 'Dark',   hex: '#2A1D17' },
] as const;

const ProfileSetup: React.FC<ProfileSetupProps> = ({ onBack, mode }) => {
  const { setProfile, loginWithEmail, signupWithEmail, user, profile: existingProfile, logout } = useWardrobe();

  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authFormMode, setAuthFormMode] = useState<'login' | 'signup'>(mode);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync prop mode to state
  useEffect(() => {
    setAuthFormMode(mode);
  }, [mode]);

  // Form state
  const [name, setName] = useState('');
  const [gender, setGender] = useState<UserProfile['gender']>('Female');
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');

  const [heightCm, setHeightCm] = useState('170');
  const [heightFt, setHeightFt] = useState('5');
  const [heightIn, setHeightIn] = useState('7');

  const [weightKg, setWeightKg] = useState('65');
  const [weightLbs, setWeightLbs] = useState('143');

  const [selectedSkinTone, setSelectedSkinTone] = useState<{name: string, hex: string}>(SKIN_TONES[2]);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');

  // ── Effect: handle auth state transitions ────────────────────────────────
  useEffect(() => {
    if (user && existingProfile) {
      // User already has a profile — show restoring message
      setLoadingText('Restoring your wardrobe...');
      setIsLoading(true);
      // Parent component will redirect automatically when profile becomes truthy
    } else if (user && !existingProfile && step === 0) {
      // User logged in but no profile yet → advance to the data-entry form
      setName(user.name);
      setStep(1);
    }
  }, [user, existingProfile, step]);

  // ── Auth Handlers ─────────────────────────────────────────────────────────

  const handleLogin = async () => {
    setErrorMessage(null);
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter email and password.');
      return;
    }
    setIsLoading(true);
    setLoadingText('Logging in...');
    try {
      await loginWithEmail(email.trim(), password);
      setIsLoading(false);
    } catch {
      setErrorMessage('Login failed. Please check your credentials.');
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    setErrorMessage(null);
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter email and password.');
      return;
    }
    setIsLoading(true);
    setLoadingText('Creating account...');
    try {
      await signupWithEmail(email.trim(), password);
      setIsLoading(false);
    } catch {
      setErrorMessage('Signup failed. Email might be in use.');
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 1) {
      // If already logged in (via Google), log out so the useEffect
      // doesn't immediately push us back to step 1.
      if (user) logout();
      setStep(0);
    } else {
      onBack();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // ── Input validation ───────────────────────────────────────────────────
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('Please enter a display name.');
      return;
    }

    let finalHeight = 0;
    let finalWeight = 0;

    if (heightUnit === 'cm') {
      finalHeight = parseFloat(heightCm);
    } else {
      finalHeight = parseFloat(heightFt) * 30.48 + parseFloat(heightIn) * 2.54;
    }

    if (weightUnit === 'kg') {
      finalWeight = parseFloat(weightKg);
    } else {
      finalWeight = parseFloat(weightLbs) * 0.453592;
    }

    if (isNaN(finalHeight) || finalHeight < 50 || finalHeight > 280) {
      setErrorMessage('Please enter a valid height (50–280 cm).');
      return;
    }
    if (isNaN(finalWeight) || finalWeight < 20 || finalWeight > 300) {
      setErrorMessage('Please enter a valid weight (20–300 kg).');
      return;
    }

    setIsLoading(true);
    setLoadingText('Saving profile...');

    const newProfile: UserProfile = {
      name:         trimmedName,
      gender,
      height:       Math.round(finalHeight),
      weight:       Math.round(finalWeight),
      skinTone:     selectedSkinTone.name,
      skinToneHex:  selectedSkinTone.hex,
    };

    // Simulate brief AI-setup animation
    await new Promise<void>((resolve) => setTimeout(resolve, 1500));

    setProfile(newProfile);
    // Context state update causes parent to redirect automatically
  };

  const isLogin = authFormMode === 'login';

  // ── Loading Overlay ────────────────────────────────────────────────────────
  if (isLoading) {
    return <LoadingScreen message={loadingText || 'Processing...'} subMessage="Syncing Data • Calibrating Style" />;
  }

  // ── Setup / Login Card ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-p_dark p-4 relative page-enter overflow-hidden">

      {/* Back Button */}
      <button
        onClick={handleBack}
        className="absolute top-6 left-6 flex items-center gap-2 text-white bg-gray-800/50 hover:bg-gray-700 backdrop-blur-sm border border-white/10 px-5 py-2.5 rounded-full transition-all font-bold z-20 shadow-lg"
        type="button"
      >
        <ArrowLeft size={18} />
        <span>{step === 1 ? 'Back' : 'Home'}</span>
      </button>

      {/* Card */}
      <div className="glass-panel w-full max-w-[420px] p-8 shadow-2xl relative z-10 border border-white/10">

        {/* Header Icon */}
        <div className="flex justify-center mb-6">
          <div
            className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white shadow-xl transition-all duration-500 bg-p_teal`}
          >
            {isLogin ? <LogIn size={32} strokeWidth={2.5} /> : <UserPlus size={32} strokeWidth={2.5} />}
          </div>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-black text-white tracking-tight mb-1 transition-all">
            {step === 0 ? (isLogin ? 'Welcome Back' : 'Create Account') : 'Setup Profile'}
          </h1>
          <p className="text-sm text-gray-400 font-medium">
            {step === 0 
              ? (isLogin ? 'Sign in to access your wardrobe' : 'Register a new wardrobe account') 
              : 'Enter details to customize your experience'}
          </p>
        </div>

        {errorMessage && (
            <div className="mb-6 p-3 bg-red-500/20 text-red-400 rounded-xl text-sm font-bold flex items-center gap-2 animate-fade-in border border-red-500/30">
                <AlertCircle size={16} />
                {errorMessage}
            </div>
        )}

        {/* ── Step 0: Auth Selection ──────────────────────────────────────── */}
        {step === 0 && (
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (isLogin) {
                handleLogin();
              } else {
                handleSignup();
              }
            }} 
            className="space-y-4"
          >
            
            <div className="space-y-3">
               <div>
                 <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="Enter your email"
                    className="w-full glass-input rounded-xl px-4 py-3.5 font-bold text-white placeholder:text-gray-500 focus:outline-none shadow-sm border border-white/10 transition-all bg-gray-800/30 focus:border-p_teal"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
               </div>
               
               <div>
                 <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Password</label>
                 <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Enter your password"
                      className="w-full glass-input rounded-xl pl-4 pr-12 py-3.5 font-bold text-white placeholder:text-gray-500 focus:outline-none shadow-sm border border-white/10 transition-all bg-gray-800/30 focus:border-p_teal"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                   <button
                     type="button"
                     onClick={() => setShowPassword(!showPassword)}
                     className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-700/50 cursor-pointer"
                   >
                     {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                   </button>
                 </div>
               </div>

               <div className="pt-2">
                  <button
                    type="submit"
                    className={`w-full py-4 rounded-xl font-bold text-base shadow-lg transition-all flex items-center justify-center gap-2 group hover:scale-[1.02] active:scale-[0.98] cursor-pointer btn-glass-primary text-white shadow-teal-500/10`}
                  >
                   {isLogin ? (
                     <>
                       <LogIn size={18} /> Sign In
                     </>
                   ) : (
                     <>
                       <Check size={18} /> Sign Up
                     </>
                   )}
                 </button>
               </div>

               <div className="text-center pt-3 border-t border-white/10 mt-4">
                 <button
                   type="button"
                   onClick={() => {
                     setAuthFormMode(isLogin ? 'signup' : 'login');
                     setPassword('');
                   }}
                   className="text-xs font-bold text-gray-400 hover:text-white transition-colors cursor-pointer"
                 >
                   {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                 </button>
               </div>
            </div>
          </form>
        )}

        {/* ── Step 1: Profile Form ────────────────────────────────────────── */}
        {step === 1 && (
          <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in" noValidate>

            {/* Display Name */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                Display Name
              </label>
              <input
                id="profile-name"
                type="text"
                required
                autoComplete="name"
                maxLength={50}
                className="w-full glass-input rounded-xl px-4 py-3.5 font-bold text-white placeholder:text-gray-500 focus:outline-none shadow-sm border border-white/10 transition-all bg-gray-800/30 focus:border-p_teal"
                placeholder="e.g. Alex"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                Gender
              </label>
              <div className="flex bg-gray-800/30 backdrop-blur-md p-1 rounded-xl shadow-sm border border-white/10">
                {(['Female', 'Male', 'Other'] as UserProfile['gender'][]).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                      gender === g
                        ? 'bg-gray-700/50 backdrop-blur-md text-white shadow-md border border-white/20'
                        : 'bg-transparent text-gray-500 hover:text-white'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Height */}
              <div>
                <div className="flex justify-between items-center mb-1.5 ml-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                    <Ruler size={10} /> Height
                  </label>
                  <div className="flex bg-gray-800/50 rounded-md p-0.5 border border-white/10">
                    {(['cm', 'ft'] as const).map((unit) => (
                      <button
                        key={unit}
                        type="button"
                        onClick={() => setHeightUnit(unit)}
                        className={`text-[8px] font-black px-1.5 py-0.5 rounded ${
                          heightUnit === unit ? 'bg-white text-p_dark' : 'text-gray-400'
                        }`}
                      >
                        {unit.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                {heightUnit === 'cm' ? (
                  <input
                    type="number"
                    required
                    min={50}
                    max={280}
                    className="w-full glass-input rounded-xl px-4 py-3.5 font-bold text-white placeholder:text-gray-500 focus:outline-none shadow-sm border border-white/10 bg-gray-800/30 focus:border-p_teal"
                    placeholder="170"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                  />
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      required
                      min={1}
                      max={9}
                      className="w-full glass-input rounded-xl px-2 py-3.5 font-bold text-white placeholder:text-gray-500 focus:outline-none shadow-sm text-center border border-white/10 bg-gray-800/30 focus:border-p_teal"
                      placeholder="5"
                      value={heightFt}
                      onChange={(e) => setHeightFt(e.target.value)}
                    />
                    <input
                      type="number"
                      required
                      min={0}
                      max={11}
                      className="w-full glass-input rounded-xl px-2 py-3.5 font-bold text-white placeholder:text-gray-500 focus:outline-none shadow-sm text-center border border-white/10 bg-gray-800/30 focus:border-p_teal"
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
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                    <Weight size={10} /> Weight
                  </label>
                  <div className="flex bg-gray-800/50 rounded-md p-0.5 border border-white/10">
                    {(['kg', 'lbs'] as const).map((unit) => (
                      <button
                        key={unit}
                        type="button"
                        onClick={() => setWeightUnit(unit)}
                        className={`text-[8px] font-black px-1.5 py-0.5 rounded ${
                          weightUnit === unit ? 'bg-white text-p_dark' : 'text-gray-400'
                        }`}
                      >
                        {unit.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="number"
                  required
                  min={20}
                  max={300}
                  className="w-full glass-input rounded-xl px-4 py-3.5 font-bold text-white placeholder:text-gray-500 focus:outline-none shadow-sm border border-white/10 bg-gray-800/30 focus:border-p_teal"
                  placeholder={weightUnit === 'kg' ? '65' : '143'}
                  value={weightUnit === 'kg' ? weightKg : weightLbs}
                  onChange={(e) =>
                    weightUnit === 'kg' ? setWeightKg(e.target.value) : setWeightLbs(e.target.value)
                  }
                />
              </div>
            </div>

            {/* Skin Tone */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1 flex items-center gap-1">
                <Palette size={10} /> Skin Tone
              </label>
              <div className="flex justify-between bg-gray-800/30 backdrop-blur-md p-2 rounded-xl border border-white/10">
                {SKIN_TONES.map((tone) => (
                  <button
                    key={tone.name}
                    type="button"
                    onClick={() => setSelectedSkinTone(tone)}
                    className={`w-9 h-9 rounded-full transition-all duration-300 flex items-center justify-center relative ${
                      selectedSkinTone.name === tone.name
                        ? 'scale-110 shadow-md ring-2 ring-white'
                        : 'opacity-70 hover:opacity-100 hover:scale-105'
                    }`}
                    style={{ backgroundColor: tone.hex }}
                    title={tone.name}
                    aria-label={tone.name}
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
              className="w-full py-4 rounded-xl font-bold text-lg shadow-xl transition-all transform hover:-translate-y-1 active:scale-95 mt-4 btn-glass-primary text-white disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
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
