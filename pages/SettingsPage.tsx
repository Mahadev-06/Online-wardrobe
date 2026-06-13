import React, { useState, useEffect, useRef } from 'react';
import { Button } from "../components/ui/button";
import { createPortal } from 'react-dom';
import { useWardrobe } from '../context/WardrobeContext';
import { UserProfile } from '../types';
import { User, Ruler, Weight, Palette, Save, LogOut, Camera, Trash2, Users, CheckCircle, AlertCircle, AlertTriangle, Info, X, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { compressImage } from '../utils/imageHelpers';

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

const SettingsPage: React.FC = () => {
  const { profile, setProfile, logout } = useWardrobe();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<UserProfile | null>(null);
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [inlineMessage, setInlineMessage] = useState<{text: string, type: 'error' | 'success' | 'info'} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalOverlayRef = useRef<HTMLDivElement>(null);

  // Prevent scroll when modal is open
  useEffect(() => {
    if (showLogoutModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showLogoutModal]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === modalOverlayRef.current) {
      setShowLogoutModal(false);
    }
  };

  useEffect(() => {
    if (profile) setFormData(profile);
  }, [profile]);

  // Auto-clear message after 3 seconds
  useEffect(() => {
    if (inlineMessage) {
        const timer = setTimeout(() => setInlineMessage(null), 3000);
        return () => clearTimeout(timer);
    }
  }, [inlineMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
        setProfile(formData);
        setInlineMessage({text: "Profile updated successfully!", type: 'success'});
    }
  };

  const handleLogout = () => {
      navigate('/');
      logout();
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        try {
            const compressed = await compressImage(file, 600, 800, 0.7);
            setFormData(prev => prev ? ({ ...prev, bodyPhoto: compressed }) : null);
            setInlineMessage({text: "Photo updated", type: 'info'});
        } catch (err) {
            setInlineMessage({text: "Failed to process photo", type: 'error'});
        }
    }
  };

  if (!formData) return null;

  return (
    <div className="min-h-screen page-enter pb-24 max-w-5xl mx-auto px-4 md:px-8 pt-8">
      {/* Toast Notification */}
      {inlineMessage && createPortal(
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[99999] animate-slide-up">
              <div className={`px-5 py-3 shadow-[4px_4px_0_rgba(255,90,80,0.25)] flex items-center gap-2 text-xs font-mono font-black uppercase border-2 ${
                  inlineMessage.type === 'error' ? 'bg-red-500/20 text-red-500 border-red-500/30' :
                  inlineMessage.type === 'success' ? 'bg-p_teal/20 text-[#FF5A50] border-[#FF5A50]/30' :
                  'bg-blue-500/20 text-blue-500 border-blue-500/30'
              } backdrop-blur-md`}>
                  {inlineMessage.type === 'success' && <CheckCircle size={14} />}
                  {inlineMessage.type === 'error' && <AlertCircle size={14} />}
                  {inlineMessage.type === 'info' && <Info size={14} />}
                  {inlineMessage.text}
              </div>
          </div>,
          document.body
      )}

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-wider uppercase font-mono">Settings</h1>
        <p className="text-gray-400 text-xs font-mono font-bold uppercase mt-1">Manage your personal details and app preferences.</p>
      </div>

      {/* Unified Single-Page Panel */}
      <div className="glass-panel p-6 md:p-8">
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-8">

          {/* Left Column: Avatar & Log Out */}
          <div className="md:w-1/3 flex flex-col items-center gap-5 md:border-r-2 md:border-[#0a0f1a] md:pr-8">
            <h3 className="w-full text-left text-[10px] font-black text-[#0a0f1a]/70 uppercase tracking-widest font-mono">Profile Photo</h3>

            <div
              className="w-32 h-32 bg-gray-50 border-2 border-[#0a0f1a] flex items-center justify-center overflow-hidden cursor-pointer relative group shadow-[3px_3px_0_#0a0f1a] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#0a0f1a] transition-all rounded-none"
              onClick={() => fileInputRef.current?.click()}
            >
               {formData.bodyPhoto ? (
                    <>
                      <img src={formData.bodyPhoto} className="w-full h-full object-cover animate-scale-in" alt="Profile" />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera className="text-white animate-pulse" size={24} />
                      </div>
                    </>
               ) : (
                     <User className="w-12 h-12 text-[#0a0f1a]/30" />
               )}
            </div>

            <div className="text-center">
              <h3 className="text-[#0a0f1a] font-mono font-black uppercase text-base tracking-wider">{formData.name || 'Your Name'}</h3>
              <p className="text-[#0a0f1a]/60 font-mono text-xs uppercase tracking-wide mt-1">
                {formData.gender || 'Not set'} · {formData.height ? `${formData.height}cm` : 'Height not set'}
              </p>
            </div>

            <div className="flex gap-2 w-full">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 px-3 py-2 bg-gray-100 border-2 border-[#0a0f1a] font-mono font-bold text-[10px] text-[#0a0f1a] hover:bg-gray-200 transition-all cursor-pointer uppercase tracking-wider shadow-[2px_2px_0_#0a0f1a] hover:translate-x-[-0.5px] hover:translate-y-[-0.5px] hover:shadow-[2.5px_2.5px_0_#0a0f1a]"
              >
                Change
              </button>
              {formData.bodyPhoto && (
                <button
                  type="button"
                  onClick={() => setFormData({...formData, bodyPhoto: undefined})}
                  className="px-3 py-2 bg-red-500/10 border-2 border-[#0a0f1a] text-[#FF5A50] hover:bg-[#FF5A50] hover:text-white transition-all text-[10px] font-mono font-bold cursor-pointer uppercase tracking-wider shadow-[2px_2px_0_#0a0f1a] hover:translate-x-[-0.5px] hover:translate-y-[-0.5px] hover:shadow-[2.5px_2.5px_0_#0a0f1a]"
                >
                  Remove
                </button>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />

            <div className="w-full pt-5 border-t-2 border-[#0a0f1a] mt-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(true)}
                className="w-full py-3 bg-red-500/10 border-2 border-[#0a0f1a] text-red-600 font-mono font-black text-xs hover:bg-red-500 hover:text-white transition-all cursor-pointer shadow-[3px_3px_0_#0a0f1a] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#0a0f1a] uppercase tracking-widest"
              >
                Log Out
              </button>
            </div>
          </div>

          {/* Right Column: Editable Details */}
          <div className="flex-1 space-y-6">

            {/* Grid for Personal Details & Measurements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b-2 border-[#0a0f1a]">

              {/* Display Name */}
              <div>
                <label className="block text-[10px] font-black text-[#0a0f1a]/70 uppercase tracking-widest mb-2 font-mono">Display Name</label>
                <input
                  type="text"
                  required
                  className="w-full bg-gray-50 border-2 border-[#0a0f1a] focus:bg-white focus:border-[#FF5A50] focus:outline-none px-4 py-3 font-mono text-sm font-bold text-[#0a0f1a] placeholder:text-gray-400 transition-all rounded-none shadow-[2px_2px_0_#0a0f1a] focus:shadow-[3px_3px_0_#FF5A50]"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter your name"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-[10px] font-black text-[#0a0f1a]/70 uppercase tracking-widest mb-2 font-mono">Gender</label>
                <div className="flex bg-gray-100 p-1 border-2 border-[#0a0f1a] rounded-none shadow-[2px_2px_0_#0a0f1a]">
                  {(['Female', 'Male', 'Other'] as UserProfile['gender'][]).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setFormData({...formData, gender: g})}
                      className={`flex-1 py-2 text-xs font-mono font-bold transition-all uppercase cursor-pointer ${
                        formData.gender === g
                          ? 'bg-[#FF5A50] text-white border-2 border-[#0a0f1a] shadow-[2px_2px_0_#0a0f1a]'
                          : 'bg-transparent text-[#0a0f1a]/65 hover:text-[#0a0f1a] border border-transparent'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Height */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-black text-[#0a0f1a]/70 uppercase tracking-widest flex items-center gap-1 font-mono">
                    <Ruler size={10} /> Height
                  </label>
                  <div className="flex bg-gray-100 rounded-none p-0.5 border-2 border-[#0a0f1a] shadow-[1px_1px_0_#0a0f1a]">
                    {(['cm', 'ft'] as const).map((unit) => (
                      <button
                        key={unit}
                        type="button"
                        onClick={() => setHeightUnit(unit)}
                        className={`text-[8px] font-mono font-black px-1.5 py-0.5 rounded-none cursor-pointer ${
                          heightUnit === unit ? 'bg-[#FF5A50] text-white border border-[#0a0f1a]' : 'text-[#0a0f1a]/65 hover:text-[#0a0f1a]'
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
                      className="w-full bg-gray-50 border-2 border-[#0a0f1a] focus:bg-white focus:border-[#FF5A50] focus:outline-none px-4 py-3 font-mono text-sm font-bold text-[#0a0f1a] placeholder:text-gray-400 transition-all rounded-none shadow-[2px_2px_0_#0a0f1a] focus:shadow-[3px_3px_0_#FF5A50]"
                      value={formData.height || ''}
                      onChange={(e) => setFormData({...formData, height: Number(e.target.value)})}
                      placeholder="e.g. 170"
                    />
                ) : (
                    <div className="flex gap-2">
                      <input
                        type="number"
                        required
                        min={1}
                        max={9}
                        className="w-full bg-gray-50 border-2 border-[#0a0f1a] focus:bg-white focus:border-[#FF5A50] focus:outline-none px-2 py-3 font-mono text-sm font-bold text-[#0a0f1a] placeholder:text-gray-400 transition-all rounded-none shadow-[2px_2px_0_#0a0f1a] focus:shadow-[3px_3px_0_#FF5A50] text-center"
                        value={Math.floor((formData.height || 170) / 30.48)}
                        onChange={(e) => {
                            const ft = Number(e.target.value);
                            const currentIn = Math.round(((formData.height || 170) / 2.54) % 12);
                            setFormData({...formData, height: Math.round(ft * 30.48 + currentIn * 2.54)});
                        }}
                      />
                      <input
                        type="number"
                        required
                        min={0}
                        max={11}
                        className="w-full bg-gray-50 border-2 border-[#0a0f1a] focus:bg-white focus:border-[#FF5A50] focus:outline-none px-2 py-3 font-mono text-sm font-bold text-[#0a0f1a] placeholder:text-gray-400 transition-all rounded-none shadow-[2px_2px_0_#0a0f1a] focus:shadow-[3px_3px_0_#FF5A50] text-center"
                        value={Math.round(((formData.height || 170) / 2.54) % 12)}
                        onChange={(e) => {
                            const inch = Number(e.target.value);
                            const currentFt = Math.floor((formData.height || 170) / 30.48);
                            setFormData({...formData, height: Math.round(currentFt * 30.48 + inch * 2.54)});
                        }}
                      />
                    </div>
                )}
              </div>

              {/* Weight */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-black text-[#0a0f1a]/70 uppercase tracking-widest flex items-center gap-1 font-mono">
                    <Weight size={10} /> Weight
                  </label>
                  <div className="flex bg-gray-100 rounded-none p-0.5 border-2 border-[#0a0f1a] shadow-[1px_1px_0_#0a0f1a]">
                    {(['kg', 'lbs'] as const).map((unit) => (
                      <button
                        key={unit}
                        type="button"
                        onClick={() => setWeightUnit(unit)}
                        className={`text-[8px] font-mono font-black px-1.5 py-0.5 rounded-none cursor-pointer ${
                          weightUnit === unit ? 'bg-[#FF5A50] text-white border border-[#0a0f1a]' : 'text-[#0a0f1a]/65 hover:text-[#0a0f1a]'
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
                  className="w-full bg-gray-50 border-2 border-[#0a0f1a] focus:bg-white focus:border-[#FF5A50] focus:outline-none px-4 py-3 font-mono text-sm font-bold text-[#0a0f1a] placeholder:text-gray-400 transition-all rounded-none shadow-[2px_2px_0_#0a0f1a] focus:shadow-[3.5px_3.5px_0_#FF5A50]"
                  value={weightUnit === 'kg' ? (formData.weight || '') : Math.round((formData.weight || 65) * 2.20462)}
                  onChange={(e) => {
                      const val = Number(e.target.value);
                      const newKg = weightUnit === 'kg' ? val : val * 0.453592;
                      setFormData({...formData, weight: Math.round(newKg)});
                  }}
                  placeholder={weightUnit === 'kg' ? 'e.g. 65' : 'e.g. 143'}
                />
              </div>
            </div>

            {/* Appearance */}
            <div className="space-y-6">

              {/* Skin Tone */}
              <div>
                 <label className="block text-[10px] font-black text-[#0a0f1a]/70 uppercase tracking-widest mb-2 font-mono">Skin Tone</label>
                 <div className="flex justify-start gap-2 bg-gray-50 p-2 rounded-none border-2 border-[#0a0f1a] shadow-[2px_2px_0_#0a0f1a] max-w-md">
                    {SKIN_TONES.map((tone) => (
                      <button
                        key={tone.name}
                        type="button"
                        onClick={() => setFormData({...formData, skinTone: tone.name, skinToneHex: tone.hex})}
                        className={`w-9 h-9 rounded-none transition-all duration-300 flex items-center justify-center relative cursor-pointer shrink-0 border-2 border-[#0a0f1a] shadow-[1.5px_1.5px_0_#0a0f1a] ${
                          formData.skinTone === tone.name
                            ? 'scale-105 border-2 border-[#0a0f1a] bg-[#FF5A50] shadow-[2.5px_2.5px_0_#0a0f1a]'
                            : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: tone.hex }}
                        title={tone.name}
                        aria-label={tone.name}
                      >
                        {formData.skinTone === tone.name && (
                          <Check size={14} className="text-white/95 stroke-[4px]" />
                        )}
                      </button>
                    ))}
                  </div>
              </div>

              {/* Body Type */}
              <div>
                <label className="block text-[10px] font-black text-[#0a0f1a]/70 uppercase tracking-widest mb-2 font-mono">Body Type</label>
                <div className="grid grid-cols-5 gap-2 max-w-xl">
                  {BODY_TYPES.map((bt) => (
                    <button
                      key={bt.id}
                      type="button"
                      onClick={() => setFormData({...formData, bodyType: bt.label})}
                      className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-none transition-all duration-300 border-2 border-[#0a0f1a] cursor-pointer ${
                        formData.bodyType === bt.label
                          ? 'bg-[#FF5A50] text-white shadow-[2px_2px_0_#0a0f1a] translate-x-[-1px] translate-y-[-1px]'
                          : 'bg-gray-50 text-[#0a0f1a]/60 hover:text-[#0a0f1a] hover:bg-gray-100 shadow-[1px_1px_0_#0a0f1a]'
                      }`}
                    >
                      <div className="w-8 h-12 flex items-center justify-center">
                        {bt.id === 'slim' && (
                          <svg viewBox="0 0 24 40" fill="currentColor" className={`w-full h-full ${formData.bodyType === bt.label ? 'text-white' : 'text-[#0a0f1a]/45'}`}>
                            <circle cx="12" cy="4" r="3.5" />
                            <path d="M12 8 C9 8 9 12 10 18 L10 32 Q10 35 8 38 M12 8 C15 8 15 12 14 18 L14 32 Q14 35 16 38" stroke="currentColor" strokeWidth="1.5" fill="none" />
                            <rect x="10" y="8" width="4" height="14" rx="2" opacity="0.8" />
                          </svg>
                        )}
                        {bt.id === 'athletic' && (
                          <svg viewBox="0 0 24 40" fill="currentColor" className={`w-full h-full ${formData.bodyType === bt.label ? 'text-white' : 'text-[#0a0f1a]/45'}`}>
                            <circle cx="12" cy="4" r="3.5" />
                            <path d="M12 8 C7 8 7 13 9 18 L9.5 32 Q9.5 35 7 38 M12 8 C17 8 17 13 15 18 L14.5 32 Q14.5 35 17 38" stroke="currentColor" strokeWidth="1.5" fill="none" />
                            <path d="M8 10 Q12 14 16 10 L16 16 Q12 20 8 16 Z" opacity="0.8" />
                          </svg>
                        )}
                        {bt.id === 'average' && (
                          <svg viewBox="0 0 24 40" fill="currentColor" className={`w-full h-full ${formData.bodyType === bt.label ? 'text-white' : 'text-[#0a0f1a]/45'}`}>
                            <circle cx="12" cy="4" r="3.5" />
                            <path d="M12 8 C8 8 7.5 13 9.5 18 L9.5 32 Q9.5 35 7.5 38 M12 8 C16 8 16.5 13 14.5 18 L14.5 32 Q14.5 35 16.5 38" stroke="currentColor" strokeWidth="1.5" fill="none" />
                            <path d="M8.5 10 Q12 13 15.5 10 L15.5 17 Q12 20 8.5 17 Z" opacity="0.8" />
                          </svg>
                        )}
                        {bt.id === 'curvy' && (
                          <svg viewBox="0 0 24 40" fill="currentColor" className={`w-full h-full ${formData.bodyType === bt.label ? 'text-white' : 'text-[#0a0f1a]/45'}`}>
                            <circle cx="12" cy="4" r="3.5" />
                            <path d="M12 8 C7 8 6 13 8 17 C6 19 7 24 9 26 L9 32 Q9 35 7 38 M12 8 C17 8 18 13 16 17 C18 19 17 24 15 26 L15 32 Q15 35 17 38" stroke="currentColor" strokeWidth="1.5" fill="none" />
                            <path d="M8 10 Q12 13 16 10 L16 17 Q12 20 8 17 Z" opacity="0.8" />
                          </svg>
                        )}
                        {bt.id === 'plus_size' && (
                          <svg viewBox="0 0 24 40" fill="currentColor" className={`w-full h-full ${formData.bodyType === bt.label ? 'text-white' : 'text-[#0a0f1a]/45'}`}>
                            <circle cx="12" cy="4" r="3.5" />
                            <path d="M12 8 C6 8 5 14 7 18 C5 20 6 26 8 28 L8.5 32 Q8.5 35 6 38 M12 8 C18 8 19 14 17 18 C19 20 18 26 16 28 L15.5 32 Q15.5 35 18 38" stroke="currentColor" strokeWidth="1.5" fill="none" />
                            <path d="M7 10 Q12 14 17 10 L17.5 18 Q12 22 6.5 18 Z" opacity="0.8" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-[9px] font-mono uppercase ${formData.bodyType === bt.label ? 'text-white font-black' : 'text-[#0a0f1a]/60 font-bold'}`}>
                        {bt.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                variant="default" size="lg" className="py-4 px-10 font-mono font-black text-sm uppercase tracking-wider bg-[#FF5A50] border-2 border-[#0a0f1a] text-white shadow-[3px_3px_0_#0a0f1a] hover:bg-[#E04B42] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#0a0f1a] rounded-none"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && createPortal(
          <div
            ref={modalOverlayRef}
            onClick={handleOverlayClick}
            className="fixed inset-0 w-screen h-screen z-[99999] flex items-center justify-center p-4 bg-[#0a0f1a]/85 backdrop-blur-sm animate-fade-in"
          >
              <div className="glass-panel p-8 max-w-sm w-full relative shadow-[6px_6px_0_#0a0f1a] text-[#0a0f1a] rounded-none">
                  <button
                    onClick={() => setShowLogoutModal(false)}
                    className="absolute top-4 right-4 text-[#0a0f1a]/50 hover:text-[#0a0f1a] transition-colors cursor-pointer"
                  >
                      <X size={18} />
                  </button>
                  <h3 className="text-lg font-mono font-black uppercase tracking-wider text-[#0a0f1a] mb-2">Log Out?</h3>
                  <p className="text-[#0a0f1a]/60 font-mono text-xs uppercase tracking-wide mb-6">Are you sure you want to log out? You will be returned to the login screen.</p>

                  <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setShowLogoutModal(false)}
                        className="flex-1 py-2.5 px-4 text-xs font-mono font-bold bg-gray-100 border-2 border-[#0a0f1a] text-[#0a0f1a] hover:bg-gray-200 transition shadow-[2px_2px_0_#0a0f1a] cursor-pointer uppercase tracking-wider rounded-none"
                      >
                          Cancel
                      </button>
                      <Button
                        onClick={handleLogout}
                        variant="default" className="flex-1 py-2.5 px-4 text-xs font-mono font-black bg-[#FF5A50] border-2 border-[#0a0f1a] text-white shadow-[2px_2px_0_#0a0f1a] hover:bg-[#E04B42] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_#0a0f1a] rounded-none uppercase tracking-wider"
                      >
                          Log Out
                      </Button>
                  </div>
              </div>
          </div>,
          document.body
      )}
    </div>
  );
};

export default SettingsPage;
