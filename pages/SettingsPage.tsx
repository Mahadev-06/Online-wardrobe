
import React, { useState, useEffect, useRef } from 'react';
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
    <div className="min-h-screen page-enter pb-24 bg-p_cream max-w-[1600px] mx-auto">
      
      {/* Toast Notification */}
      {inlineMessage && createPortal(
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[99999] animate-slide-up">
              <div className={`px-5 py-3 rounded-full shadow-2xl flex items-center gap-2 text-sm font-bold border ${
                  inlineMessage.type === 'error' ? 'bg-red-500/20 text-red-500 border-red-500/30' :
                  inlineMessage.type === 'success' ? 'bg-p_teal/20 text-p_teal border-p_teal/30' :
                  'bg-blue-500/20 text-blue-500 border-blue-500/30'
              } backdrop-blur-md`}>
                  {inlineMessage.type === 'success' && <CheckCircle size={16} />}
                  {inlineMessage.type === 'error' && <AlertCircle size={16} />}
                  {inlineMessage.type === 'info' && <Info size={16} />}
                  {inlineMessage.text}
              </div>
          </div>,
          document.body
      )}

      {/* Page Header */}
      <div className="px-6 md:px-12 pt-8 pb-6">
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight uppercase font-mono">Settings</h1>
        <p className="text-white/70 text-sm mt-1 font-medium">Manage your personal details and app preferences.</p>
      </div>

      {/* Two-Column Layout */}
      <div className="px-6 md:px-12 flex flex-col lg:flex-row gap-6">

        {/* ─── Left Sidebar ─── */}
        <div className="lg:w-[320px] shrink-0 flex flex-col gap-6">
          
          {/* Profile Card */}
          <div className="glass-panel rounded-[2rem] border border-p_dark/10 p-6 flex flex-col items-center gap-4 shadow-lg text-p_dark">
              <div 
                  className="w-28 h-28 bg-white rounded-full border-2 border-p_dark/15 flex items-center justify-center overflow-hidden cursor-pointer relative group shrink-0 shadow-sm"
                  onClick={() => fileInputRef.current?.click()}
               >
                   {formData.bodyPhoto ? (
                        <>
                          <img src={formData.bodyPhoto} className="w-full h-full object-cover animate-scale-in" alt="Profile" />
                          <div className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Camera className="text-white" size={22} />
                          </div>
                        </>
                   ) : (
                        <User className="w-10 h-10 text-p_dark/40" />
                   )}
               </div>

               <div className="text-center">
                   <h3 className="text-p_dark font-bold text-base">{formData.name || 'Your Name'}</h3>
                   <p className="text-p_dark/60 text-xs mt-0.5">{formData.gender || 'Not set'} · {formData.height ? `${formData.height}cm` : 'Height not set'}</p>
               </div>

               <div className="flex gap-2 w-full">
                   <button 
                       type="button"
                       onClick={() => fileInputRef.current?.click()}
                       className="flex-1 px-4 py-2.5 bg-white border border-p_dark/10 rounded-full font-bold text-xs text-p_dark hover:bg-p_dark/5 transition-all shadow-sm cursor-pointer"
                   >
                       Change
                   </button>
                   {formData.bodyPhoto && (
                        <button 
                            type="button"
                            onClick={() => setFormData({...formData, bodyPhoto: undefined})}
                            className="px-4 py-2.5 bg-p_red/10 border border-p_red/25 text-p_red hover:bg-p_red hover:text-white transition-all text-xs font-bold rounded-full shadow-sm cursor-pointer"
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
          </div>
        </div>

        {/* ─── Right Main Content ─── */}
        <div className="flex-1 min-w-0">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            {/* Personal Details Card */}
            <div className="glass-panel rounded-[2rem] border border-p_dark/10 p-6 md:p-8 shadow-lg text-p_dark">
              <h3 className="text-xs font-black text-p_dark/60 uppercase tracking-widest font-mono mb-6">Personal Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-p_dark/75 mb-2 uppercase tracking-wide">Display Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-white border border-p_dark/10 rounded-[2rem] outline-none text-p_dark text-sm focus:border-p_red/30 focus:bg-white transition shadow-sm placeholder-p_dark/40"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-p_dark/75 mb-2 uppercase tracking-wide">Gender</label>
                  <div className="flex gap-2 p-1 bg-p_dark/5 rounded-[2rem] border border-p_dark/10 animate-scale-in">
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, gender: 'Female'})}
                        className={`flex-1 py-2.5 rounded-[2.5rem] text-sm font-bold transition cursor-pointer ${formData.gender === 'Female' ? 'bg-p_red text-white shadow-sm' : 'text-p_dark/60 hover:text-p_dark'}`}
                    >
                        Female
                    </button>
                    <button
                        type="button"
                        onClick={() => setFormData({...formData, gender: 'Male'})}
                        className={`flex-1 py-2.5 rounded-[2.5rem] text-sm font-bold transition cursor-pointer ${formData.gender === 'Male' ? 'bg-p_red text-white shadow-sm' : 'text-p_dark/60 hover:text-p_dark'}`}
                    >
                        Male
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Body Measurements Card */}
            <div className="glass-panel rounded-[2rem] border border-p_dark/10 p-6 md:p-8 shadow-lg text-p_dark">
              <h3 className="text-xs font-black text-p_dark/60 uppercase tracking-widest font-mono mb-6">Body Measurements</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-p_dark/75 uppercase tracking-wide">Height</label>
                    <div className="flex bg-p_dark/5 rounded-full p-0.5 border border-p_dark/10">
                      {(['cm', 'ft'] as const).map((unit) => (
                        <button
                          key={unit}
                          type="button"
                          onClick={() => setHeightUnit(unit)}
                          className={`text-[9px] font-black px-2.5 py-0.5 rounded-full transition cursor-pointer ${
                            heightUnit === unit ? 'bg-p_red text-white shadow-sm' : 'text-p_dark/60 hover:text-p_dark'
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
                        className="w-full px-4 py-3 bg-white border border-p_dark/10 rounded-[2rem] outline-none text-p_dark text-sm focus:border-p_red/30 focus:bg-white transition shadow-sm placeholder-p_dark/40"
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
                          className="w-full px-2 py-3 bg-white border border-p_dark/10 rounded-[2rem] outline-none text-p_dark text-sm focus:border-p_red/30 focus:bg-white transition text-center shadow-sm placeholder-p_dark/40"
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
                          className="w-full px-2 py-3 bg-white border border-p_dark/10 rounded-[2rem] outline-none text-p_dark text-sm focus:border-p_red/30 focus:bg-white transition text-center shadow-sm placeholder-p_dark/40"
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

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-p_dark/75 uppercase tracking-wide">Weight</label>
                    <div className="flex bg-p_dark/5 rounded-full p-0.5 border border-p_dark/10">
                      {(['kg', 'lbs'] as const).map((unit) => (
                        <button
                          key={unit}
                          type="button"
                          onClick={() => setWeightUnit(unit)}
                          className={`text-[9px] font-black px-2.5 py-0.5 rounded-full transition cursor-pointer ${
                            weightUnit === unit ? 'bg-p_red text-white shadow-sm' : 'text-p_dark/60 hover:text-p_dark'
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
                    className="w-full px-4 py-3 bg-white border border-p_dark/10 rounded-[2rem] outline-none text-p_dark text-sm focus:border-p_red/30 focus:bg-white transition shadow-sm placeholder-p_dark/40"
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
            </div>

            {/* Appearance Card */}
            <div className="glass-panel rounded-[2rem] border border-p_dark/10 p-6 md:p-8 shadow-lg text-p_dark">
              <h3 className="text-xs font-black text-p_dark/60 uppercase tracking-widest font-mono mb-6">Appearance</h3>
              
              <div>
                 <label className="block text-xs font-bold text-p_dark/75 mb-3 uppercase tracking-wide">Skin Tone</label>
                 <div className="flex justify-center gap-2.5 bg-p_dark/5 p-2.5 rounded-[2.5rem] border border-p_dark/10 shadow-inner max-w-md">
                    {SKIN_TONES.map((tone) => (
                      <button
                        key={tone.name}
                        type="button"
                        onClick={() => setFormData({...formData, skinTone: tone.name, skinToneHex: tone.hex})}
                        className={`w-9 h-9 md:w-11 md:h-11 rounded-full transition-all duration-300 flex items-center justify-center relative cursor-pointer shrink-0 ${
                          formData.skinTone === tone.name
                            ? 'scale-110 shadow-lg ring-2 ring-white'
                            : 'opacity-70 hover:opacity-100 hover:scale-105'
                        }`}
                        style={{ backgroundColor: tone.hex }}
                        title={tone.name}
                        aria-label={tone.name}
                      >
                        {formData.skinTone === tone.name && (
                          <Check size={14} className="text-white/95 stroke-[3px]" />
                        )}
                      </button>
                    ))}
                  </div>
              </div>

              {/* Body Type */}
              <div className="mt-6">
                <label className="block text-xs font-bold text-p_dark/75 mb-3 uppercase tracking-wide">Body Type</label>
                <div className="grid grid-cols-5 gap-2 max-w-lg">
                  {BODY_TYPES.map((bt) => (
                    <button
                      key={bt.id}
                      type="button"
                      onClick={() => setFormData({...formData, bodyType: bt.label})}
                      className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl transition-all duration-300 border cursor-pointer ${
                        formData.bodyType === bt.label
                          ? 'bg-p_red/10 border-p_red/40 shadow-lg scale-105 ring-2 ring-p_red/30'
                          : 'bg-p_dark/5 border-p_dark/10 opacity-60 hover:opacity-100 hover:scale-105'
                      }`}
                    >
                      <div className="w-8 h-12 flex items-center justify-center">
                        {bt.id === 'slim' && (
                          <svg viewBox="0 0 24 40" fill="currentColor" className={`w-full h-full ${formData.bodyType === bt.label ? 'text-p_red' : 'text-p_dark/40'}`}>
                            <circle cx="12" cy="4" r="3.5" />
                            <path d="M12 8 C9 8 9 12 10 18 L10 32 Q10 35 8 38 M12 8 C15 8 15 12 14 18 L14 32 Q14 35 16 38" stroke="currentColor" strokeWidth="1.5" fill="none" />
                            <rect x="10" y="8" width="4" height="14" rx="2" opacity="0.8" />
                          </svg>
                        )}
                        {bt.id === 'athletic' && (
                          <svg viewBox="0 0 24 40" fill="currentColor" className={`w-full h-full ${formData.bodyType === bt.label ? 'text-p_red' : 'text-p_dark/40'}`}>
                            <circle cx="12" cy="4" r="3.5" />
                            <path d="M12 8 C7 8 7 13 9 18 L9.5 32 Q9.5 35 7 38 M12 8 C17 8 17 13 15 18 L14.5 32 Q14.5 35 17 38" stroke="currentColor" strokeWidth="1.5" fill="none" />
                            <path d="M8 10 Q12 14 16 10 L16 16 Q12 20 8 16 Z" opacity="0.8" />
                          </svg>
                        )}
                        {bt.id === 'average' && (
                          <svg viewBox="0 0 24 40" fill="currentColor" className={`w-full h-full ${formData.bodyType === bt.label ? 'text-p_red' : 'text-p_dark/40'}`}>
                            <circle cx="12" cy="4" r="3.5" />
                            <path d="M12 8 C8 8 7.5 13 9.5 18 L9.5 32 Q9.5 35 7.5 38 M12 8 C16 8 16.5 13 14.5 18 L14.5 32 Q14.5 35 16.5 38" stroke="currentColor" strokeWidth="1.5" fill="none" />
                            <path d="M8.5 10 Q12 13 15.5 10 L15.5 17 Q12 20 8.5 17 Z" opacity="0.8" />
                          </svg>
                        )}
                        {bt.id === 'curvy' && (
                          <svg viewBox="0 0 24 40" fill="currentColor" className={`w-full h-full ${formData.bodyType === bt.label ? 'text-p_red' : 'text-p_dark/40'}`}>
                            <circle cx="12" cy="4" r="3.5" />
                            <path d="M12 8 C7 8 6 13 8 17 C6 19 7 24 9 26 L9 32 Q9 35 7 38 M12 8 C17 8 18 13 16 17 C18 19 17 24 15 26 L15 32 Q15 35 17 38" stroke="currentColor" strokeWidth="1.5" fill="none" />
                            <path d="M8 10 Q12 13 16 10 L16 17 Q12 20 8 17 Z" opacity="0.8" />
                          </svg>
                        )}
                        {bt.id === 'plus_size' && (
                          <svg viewBox="0 0 24 40" fill="currentColor" className={`w-full h-full ${formData.bodyType === bt.label ? 'text-p_red' : 'text-p_dark/40'}`}>
                            <circle cx="12" cy="4" r="3.5" />
                            <path d="M12 8 C6 8 5 14 7 18 C5 20 6 26 8 28 L8.5 32 Q8.5 35 6 38 M12 8 C18 8 19 14 17 18 C19 20 18 26 16 28 L15.5 32 Q15.5 35 18 38" stroke="currentColor" strokeWidth="1.5" fill="none" />
                            <path d="M7 10 Q12 14 17 10 L17.5 18 Q12 22 6.5 18 Z" opacity="0.8" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-[9px] font-bold tracking-wide ${formData.bodyType === bt.label ? 'text-p_red' : 'text-p_dark/50'}`}>
                        {bt.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                  type="submit"
                  className="h-12 px-10 bg-p_red hover:bg-[#E04B42] text-white font-bold rounded-full shadow-lg transition-all cursor-pointer transform hover:scale-[1.02] active:scale-[0.98] text-sm"
                >
                  Save Changes
                </button>
            </div>
          </form>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="px-6 md:px-12 mt-8 mb-6 flex justify-center">
          <button 
              type="button"
              onClick={() => setShowLogoutModal(true)}
              className="px-8 py-3.5 bg-red-500/10 border border-red-500/20 text-red-500 font-bold text-sm hover:bg-red-500 hover:text-white transition-all cursor-pointer shadow-sm transform hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 rounded-full"
          >
              <LogOut size={16} /> Log Out
          </button>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && createPortal(
          <div 
            ref={modalOverlayRef}
            onClick={handleOverlayClick}
            className="fixed inset-0 w-screen h-screen z-[99999] flex items-center justify-center p-4 bg-p_dark/60 backdrop-blur-sm animate-fade-in"
          >
              <div className="glass-panel rounded-[2.5rem] p-6 max-w-sm w-full border border-p_dark/10 relative shadow-2xl text-p_dark">
                  <button 
                    onClick={() => setShowLogoutModal(false)}
                    className="absolute top-4 right-4 text-p_dark/50 hover:text-p_dark transition-colors cursor-pointer"
                  >
                      <X size={18} />
                  </button>
                  <h3 className="text-lg font-bold text-p_dark mb-2">Log Out?</h3>
                  <p className="text-p_dark/60 text-sm mb-6">Are you sure you want to log out? You will be returned to the login screen.</p>
                  
                  <div className="flex gap-3">
                      <button 
                        onClick={() => setShowLogoutModal(false)}
                        className="flex-1 py-2.5 px-4 text-sm font-bold bg-white border border-p_dark/15 rounded-full text-p_dark hover:bg-p_dark/5 transition shadow-sm cursor-pointer"
                      >
                          Cancel
                      </button>
                      <button 
                        onClick={handleLogout}
                        className="flex-1 py-2.5 px-4 text-sm font-bold bg-p_red hover:bg-[#E04B42] text-white rounded-full transition shadow-sm cursor-pointer"
                      >
                          Log Out
                      </button>
                  </div>
              </div>
          </div>,
          document.body
      )}
    </div>
  );
};

export default SettingsPage;
