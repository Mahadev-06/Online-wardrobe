import { Button } from "./ui/button";
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

const BODY_TYPES = [
  { id: 'slim',      label: 'Slim',      desc: 'Lean & slender frame' },
  { id: 'athletic',  label: 'Athletic',  desc: 'Toned & muscular build' },
  { id: 'average',   label: 'Average',   desc: 'Balanced proportions' },
  { id: 'curvy',     label: 'Curvy',     desc: 'Defined curves & shape' },
  { id: 'plus_size', label: 'Plus Size', desc: 'Full & broad frame' },
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
  const [selectedBodyType, setSelectedBodyType] = useState<typeof BODY_TYPES[number]>(BODY_TYPES[2]); // default: Average

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
      bodyType:     selectedBodyType.label,
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
    <div className="min-h-screen flex items-center justify-center bg-transparent p-4 py-16 relative page-enter overflow-y-auto">
      {/* Grid Overlay Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Back Button */}
      <Button
        onClick={handleBack}
        variant="default" size="default" className="absolute top-6 left-6 flex items-center gap-2 bg-[#0d1325] border border-white/10 hover:bg-[#FF5A50]/5 px-5 py-2.5 font-mono font-bold z-20 shadow-[3px_3px_0_rgba(255,90,80,0.2)]"
        type="button"
      >
        <ArrowLeft size={18} />
        <span>{step === 1 ? 'BACK' : 'HOME'}</span>
      </Button>

      {/* Card */}
      <div className="w-full max-w-[420px] bg-[#0d1325] p-8 relative z-10 border-2 border-white/10 shadow-[6px_6px_0_rgba(255,90,80,0.15)] rounded-none">

        {/* Header Icon */}
        <div className="flex justify-center mb-6">
          <div
            className="w-20 h-20 rounded-none border-2 border-white/10 flex items-center justify-center text-white shadow-[4px_4px_0_rgba(255,90,80,0.2)] bg-[#FF5A50]"
          >
            {isLogin ? <LogIn size={32} strokeWidth={2.5} /> : <UserPlus size={32} strokeWidth={2.5} />}
          </div>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-mono font-black text-white tracking-wider uppercase mb-1">
            {step === 0 ? (isLogin ? 'Welcome Back' : 'Create Account') : 'Setup Profile'}
          </h1>
          <p className="text-xs text-gray-500 font-mono font-bold uppercase tracking-wider">
            {step === 0 
              ? (isLogin ? 'Sign in to access your wardrobe' : 'Register a new wardrobe account') 
              : 'Enter details to customize your experience'}
          </p>
        </div>

        {errorMessage && (
            <div className="mb-6 p-3 bg-red-500/10 text-red-400 border-2 border-red-500/30 rounded-none text-xs font-mono font-bold uppercase flex items-center gap-2 animate-fade-in">
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
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1 font-mono">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="Enter your email"
                    className="w-full bg-white/5 border-2 border-white/10 hover:border-white/20 focus:border-[#FF5A50] focus:outline-none px-4 py-3.5 font-mono text-sm font-bold text-white placeholder:text-gray-600 transition-all rounded-none shadow-[2px_2px_0_rgba(255,255,255,0.05)] focus:shadow-[2px_2px_0_rgba(255,90,80,0.2)]"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
               </div>
               
               <div>
                 <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1 font-mono">Password</label>
                 <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Enter your password"
                      className="w-full bg-white/5 border-2 border-white/10 hover:border-white/20 focus:border-[#FF5A50] focus:outline-none pl-4 pr-12 py-3.5 font-mono text-sm font-bold text-white placeholder:text-gray-600 transition-all rounded-none shadow-[2px_2px_0_rgba(255,255,255,0.05)] focus:shadow-[2px_2px_0_rgba(255,90,80,0.2)]"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                   <button
                     type="button"
                     onClick={() => setShowPassword(!showPassword)}
                     className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-1.5 rounded-none hover:bg-white/5 border border-transparent hover:border-white/10 cursor-pointer"
                   >
                     {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                   </button>
                 </div>
               </div>

               <div className="pt-2">
                  <Button
                    type="submit"
                    variant="default" size="lg" className="w-full py-4 font-mono font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 group bg-[#FF5A50]-white/10 shadow-[3px_3px_0_rgba(255,90,80,0.3)] hover:shadow-[5px_5px_0_rgba(255,90,80,0.4)]x-0.5y-0.5"
                  >
                   {isLogin ? (
                     <>
                       <LogIn size={18} /> SIGN IN
                     </>
                   ) : (
                     <>
                       <Check size={18} /> SIGN UP
                     </>
                   )}
                 </Button>
               </div>

               <div className="text-center pt-3 border-t border-white/10 mt-4">
                 <button
                   type="button"
                   onClick={() => {
                     setAuthFormMode(isLogin ? 'signup' : 'login');
                     setPassword('');
                   }}
                   className="text-xs font-mono font-bold text-gray-400 hover:text-[#FF5A50] transition-colors cursor-pointer uppercase tracking-wider"
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
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1 font-mono">
                Display Name
              </label>
              <input
                id="profile-name"
                type="text"
                required
                autoComplete="name"
                maxLength={50}
                className="w-full bg-white/5 border-2 border-white/10 hover:border-white/20 focus:border-[#FF5A50] focus:outline-none px-4 py-3.5 font-mono text-sm font-bold text-white placeholder:text-gray-600 transition-all rounded-none shadow-[2px_2px_0_rgba(255,255,255,0.05)] focus:shadow-[2px_2px_0_rgba(255,90,80,0.2)]"
                placeholder="e.g. Alex"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1 font-mono">
                Gender
              </label>
              <div className="flex bg-white/5 p-1 border-2 border-white/10 rounded-none shadow-[2px_2px_0_rgba(255,255,255,0.05)]">
                {(['Female', 'Male', 'Other'] as UserProfile['gender'][]).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`flex-1 py-2.5 rounded-none text-xs font-mono font-bold transition-all uppercase cursor-pointer ${
                      gender === g
                        ? 'bg-[#FF5A50] text-white border border-white/10 shadow-[2px_2px_0_rgba(255,90,80,0.2)]'
                        : 'bg-transparent text-gray-500 hover:text-white border border-transparent'
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
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1 font-mono">
                    <Ruler size={10} /> Height
                  </label>
                  <div className="flex bg-white/5 rounded-none p-0.5 border border-white/10">
                    {(['cm', 'ft'] as const).map((unit) => (
                      <button
                        key={unit}
                        type="button"
                        onClick={() => setHeightUnit(unit)}
                        className={`text-[8px] font-mono font-black px-1.5 py-0.5 rounded-none cursor-pointer ${
                          heightUnit === unit ? 'bg-[#FF5A50] text-white' : 'text-gray-400 hover:text-white'
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
                    className="w-full bg-white/5 border-2 border-white/10 hover:border-white/20 focus:border-[#FF5A50] focus:outline-none px-4 py-3.5 font-mono text-sm font-bold text-white placeholder:text-gray-600 transition-all rounded-none shadow-[2px_2px_0_rgba(255,255,255,0.05)] focus:shadow-[2px_2px_0_rgba(255,90,80,0.2)]"
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
                      className="w-full bg-white/5 border-2 border-white/10 hover:border-white/20 focus:border-[#FF5A50] focus:outline-none px-2 py-3.5 font-mono text-sm font-bold text-white placeholder:text-gray-600 transition-all rounded-none shadow-[2px_2px_0_rgba(255,255,255,0.05)] focus:shadow-[2px_2px_0_rgba(255,90,80,0.2)] text-center"
                      placeholder="5"
                      value={heightFt}
                      onChange={(e) => setHeightFt(e.target.value)}
                    />
                    <input
                      type="number"
                      required
                      min={0}
                      max={11}
                      className="w-full bg-white/5 border-2 border-white/10 hover:border-white/20 focus:border-[#FF5A50] focus:outline-none px-2 py-3.5 font-mono text-sm font-bold text-white placeholder:text-gray-600 transition-all rounded-none shadow-[2px_2px_0_rgba(255,255,255,0.05)] focus:shadow-[2px_2px_0_rgba(255,90,80,0.2)] text-center"
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
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1 font-mono">
                    <Weight size={10} /> Weight
                  </label>
                  <div className="flex bg-white/5 rounded-none p-0.5 border border-white/10">
                    {(['kg', 'lbs'] as const).map((unit) => (
                      <button
                        key={unit}
                        type="button"
                        onClick={() => setWeightUnit(unit)}
                        className={`text-[8px] font-mono font-black px-1.5 py-0.5 rounded-none cursor-pointer ${
                          weightUnit === unit ? 'bg-[#FF5A50] text-white' : 'text-gray-400 hover:text-white'
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
                  className="w-full bg-white/5 border-2 border-white/10 hover:border-white/20 focus:border-[#FF5A50] focus:outline-none px-4 py-3.5 font-mono text-sm font-bold text-white placeholder:text-gray-600 transition-all rounded-none shadow-[2px_2px_0_rgba(255,255,255,0.05)] focus:shadow-[2px_2px_0_rgba(255,90,80,0.2)]"
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
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1 flex items-center gap-1 font-mono">
                <Palette size={10} /> Skin Tone
              </label>
              <div className="flex justify-center gap-2.5 bg-white/5 p-2 rounded-none border-2 border-white/10 shadow-[2px_2px_0_rgba(255,255,255,0.05)]">
                {SKIN_TONES.map((tone) => (
                  <button
                    key={tone.name}
                    type="button"
                    onClick={() => setSelectedSkinTone(tone)}
                    className={`w-9 h-9 rounded-none transition-all duration-300 flex items-center justify-center relative shrink-0 border border-white/20 shadow-[1px_1px_0_rgba(255,255,255,0.1)] cursor-pointer ${
                      selectedSkinTone.name === tone.name
                        ? 'scale-110 border-2 border-white shadow-[2px_2px_0_rgba(255,90,80,0.3)]'
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

            {/* Body Type */}
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1 flex items-center gap-1 font-mono">
                <User size={10} /> Body Type
              </label>
              <div className="grid grid-cols-5 gap-2">
                {BODY_TYPES.map((bt) => (
                  <button
                    key={bt.id}
                    type="button"
                    onClick={() => setSelectedBodyType(bt)}
                    className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-none transition-all duration-300 border-2 cursor-pointer ${
                      selectedBodyType.id === bt.id
                        ? 'bg-[#FF5A50]/10 border-[#FF5A50] shadow-[3px_3px_0_rgba(255,90,80,0.3)]'
                        : 'bg-white/5 border-white/10 opacity-60 hover:opacity-100'
                    }`}
                  >
                    {/* Silhouette SVG icons */}
                    <div className="w-8 h-12 flex items-center justify-center">
                      {bt.id === 'slim' && (
                        <svg viewBox="0 0 24 40" fill="currentColor" className={`w-full h-full ${selectedBodyType.id === bt.id ? 'text-[#FF5A50]' : 'text-gray-600'}`}>
                          <circle cx="12" cy="4" r="3.5" />
                          <path d="M12 8 C9 8 9 12 10 18 L10 32 Q10 35 8 38 M12 8 C15 8 15 12 14 18 L14 32 Q14 35 16 38" stroke="currentColor" strokeWidth="1.5" fill="none" />
                          <rect x="10" y="8" width="4" height="14" rx="2" opacity="0.8" />
                        </svg>
                      )}
                      {bt.id === 'athletic' && (
                        <svg viewBox="0 0 24 40" fill="currentColor" className={`w-full h-full ${selectedBodyType.id === bt.id ? 'text-[#FF5A50]' : 'text-gray-600'}`}>
                          <circle cx="12" cy="4" r="3.5" />
                          <path d="M12 8 C7 8 7 13 9 18 L9.5 32 Q9.5 35 7 38 M12 8 C17 8 17 13 15 18 L14.5 32 Q14.5 35 17 38" stroke="currentColor" strokeWidth="1.5" fill="none" />
                          <path d="M8 10 Q12 14 16 10 L16 16 Q12 20 8 16 Z" opacity="0.8" />
                        </svg>
                      )}
                      {bt.id === 'average' && (
                        <svg viewBox="0 0 24 40" fill="currentColor" className={`w-full h-full ${selectedBodyType.id === bt.id ? 'text-[#FF5A50]' : 'text-gray-600'}`}>
                          <circle cx="12" cy="4" r="3.5" />
                          <path d="M12 8 C8 8 7.5 13 9.5 18 L9.5 32 Q9.5 35 7.5 38 M12 8 C16 8 16.5 13 14.5 18 L14.5 32 Q14.5 35 16.5 38" stroke="currentColor" strokeWidth="1.5" fill="none" />
                          <path d="M8.5 10 Q12 13 15.5 10 L15.5 17 Q12 20 8.5 17 Z" opacity="0.8" />
                        </svg>
                      )}
                      {bt.id === 'curvy' && (
                        <svg viewBox="0 0 24 40" fill="currentColor" className={`w-full h-full ${selectedBodyType.id === bt.id ? 'text-[#FF5A50]' : 'text-gray-600'}`}>
                          <circle cx="12" cy="4" r="3.5" />
                          <path d="M12 8 C7 8 6 13 8 17 C6 19 7 24 9 26 L9 32 Q9 35 7 38 M12 8 C17 8 18 13 16 17 C18 19 17 24 15 26 L15 32 Q15 35 17 38" stroke="currentColor" strokeWidth="1.5" fill="none" />
                          <path d="M8 10 Q12 13 16 10 L16 17 Q12 20 8 17 Z" opacity="0.8" />
                        </svg>
                      )}
                      {bt.id === 'plus_size' && (
                        <svg viewBox="0 0 24 40" fill="currentColor" className={`w-full h-full ${selectedBodyType.id === bt.id ? 'text-[#FF5A50]' : 'text-gray-600'}`}>
                          <circle cx="12" cy="4" r="3.5" />
                          <path d="M12 8 C6 8 5 14 7 18 C5 20 6 26 8 28 L8.5 32 Q8.5 35 6 38 M12 8 C18 8 19 14 17 18 C19 20 18 26 16 28 L15.5 32 Q15.5 35 18 38" stroke="currentColor" strokeWidth="1.5" fill="none" />
                          <path d="M7 10 Q12 14 17 10 L17.5 18 Q12 22 6.5 18 Z" opacity="0.8" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-[9px] font-mono font-bold tracking-wide uppercase ${selectedBodyType.id === bt.id ? 'text-white' : 'text-gray-500'}`}>
                      {bt.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isLoading}
              variant="default" size="lg" className="w-full py-4 font-mono font-black text-sm uppercase tracking-wider mt-4 bg-[#FF5A50]-white/10 shadow-[3px_3px_0_rgba(255,90,80,0.3)] hover:shadow-[5px_5px_0_rgba(255,90,80,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              Complete Setup
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ProfileSetup;
