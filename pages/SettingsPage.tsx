
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useWardrobe } from '../context/WardrobeContext';
import { UserProfile } from '../types';
import { User, Ruler, Weight, Palette, Save, LogOut, Camera, Trash2, Users, CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { compressImage } from '../utils/imageHelpers';
import CustomSelect from '../components/CustomSelect';

const SettingsPage: React.FC = () => {
  const { profile, setProfile, logout } = useWardrobe();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<UserProfile | null>(null);
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
    <div className="px-4 py-8 md:px-12 md:py-14 pb-8 md:pb-14 max-w-6xl mx-auto page-enter">
      <div className="flex justify-between items-center mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">SETTINGS</h1>
      </div>

      {inlineMessage && (
          <div className={`px-4 py-3 rounded-xl text-sm font-bold animate-fade-in mb-6 ${
              inlineMessage.type === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
              inlineMessage.type === 'success' ? 'bg-p_teal/20 text-p_teal border border-p_teal/30' :
              'bg-blue-500/20 text-blue-400 border border-blue-500/30'
          }`}>
              {inlineMessage.text}
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 relative z-10">
        
        {/* Left Column: Photo & Account Actions */}
        <div className="flex flex-col gap-6 md:gap-8 lg:col-span-1">
            
            {/* Profile Photo Card */}
            <div className="glass-panel p-6 md:p-8 flex flex-col items-center text-center shadow-2xl relative overflow-hidden group border border-white/10">
                <div className="absolute inset-0 bg-gradient-to-br from-p_teal/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 w-full text-left flex items-center gap-2">
                    <Camera size={16} /> Profile Picture
                </h3>
                
                <div 
                    className="w-32 h-32 md:w-40 md:h-40 bg-gray-900/50 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden cursor-pointer hover:border-p_teal transition-all duration-300 relative group/photo shadow-lg shrink-0 mb-6"
                    onClick={() => fileInputRef.current?.click()}
                 >
                     {formData.bodyPhoto ? (
                         <>
                            <img src={formData.bodyPhoto} className="w-full h-full object-cover" alt="Body Model" />
                            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-all duration-300 backdrop-blur-sm">
                                <Camera className="text-white mb-1" size={24} />
                                <span className="text-[10px] font-bold text-white uppercase tracking-wider">Change</span>
                            </div>
                         </>
                     ) : (
                         <div className="text-center p-2 flex flex-col items-center opacity-70 group-hover/photo:opacity-100 transition-opacity">
                             <User className="w-10 h-10 text-gray-400 mb-2" />
                             <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Upload Photo</span>
                         </div>
                     )}
                 </div>

                 <p className="text-gray-400 text-xs leading-relaxed font-medium mb-6">Upload a photo to personalize your stylist experience.</p>
                 
                 <div className="flex gap-3 w-full">
                     <button 
                         type="button"
                         onClick={() => fileInputRef.current?.click()}
                         className="flex-1 py-2.5 btn-glass-secondary rounded-xl text-sm font-bold transition shadow-sm border border-white/10 hover:bg-white/10"
                     >
                         Upload
                     </button>
                     {formData.bodyPhoto && (
                         <button 
                             type="button"
                             onClick={() => setFormData({...formData, bodyPhoto: undefined})}
                             className="px-4 py-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/20 hover:text-red-300 transition"
                             title="Remove Photo"
                         >
                            <Trash2 size={18} />
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

            {/* Account Actions Card */}
            <div className="glass-panel p-6 md:p-8 shadow-2xl border border-white/10 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-tr from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <LogOut size={16} /> Account
                </h3>
                <p className="text-gray-400 text-xs mb-6 font-medium leading-relaxed">Logging out will safely remove your session from this device. Your data remains secure.</p>
                <button 
                    type="button"
                    onClick={() => setShowLogoutModal(true)}
                    className="w-full py-3 btn-glass-secondary border border-white/10 text-gray-300 font-bold rounded-xl hover:text-white hover:border-white/30 transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                    <LogOut size={18} /> Log Out
                </button>
            </div>
        </div>

        {/* Right Column: Profile Details */}
        <div className="lg:col-span-2 flex flex-col">
            <div className="glass-panel p-6 md:p-10 shadow-2xl border border-white/10 relative overflow-hidden flex-1 group">
                <div className="absolute inset-0 bg-gradient-to-bl from-p_teal/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                
                <h2 className="text-xl md:text-2xl font-bold text-white mb-8 flex items-center gap-3">
                    <div className="bg-p_teal/20 backdrop-blur-md p-2.5 rounded-xl text-p_teal shadow-inner border border-p_teal/30">
                        <User size={22} className="md:w-[26px] md:h-[26px]" />
                    </div>
                    Personal Details
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
                  
                  <div className="space-y-6">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Display Name</label>
                        <input
                          type="text"
                          required
                          className="w-full px-5 py-4 glass-input rounded-2xl outline-none font-bold text-white text-lg border border-white/10 focus:border-p_teal/50 focus:bg-white/10 transition-all duration-300 shadow-inner"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                      </div>

                      {/* Gender Section */}
                      <div>
                         <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Users size={16} /> Gender
                         </label>
                         <div className="flex gap-4 p-1.5 bg-white/5 rounded-2xl border border-white/10 shadow-inner backdrop-blur-sm">
                             <button
                                type="button"
                                onClick={() => setFormData({...formData, gender: 'Female'})}
                                className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all duration-300 text-sm md:text-base ${formData.gender === 'Female' ? 'bg-p_teal text-white shadow-lg scale-[1.02]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                            >
                                Female
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({...formData, gender: 'Male'})}
                                className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all duration-300 text-sm md:text-base ${formData.gender === 'Male' ? 'bg-p_teal text-white shadow-lg scale-[1.02]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                            >
                                Male
                            </button>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-5 md:gap-6">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Ruler size={16} /> Height (cm)
                          </label>
                          <input
                            type="number"
                            required
                            className="w-full px-5 py-4 glass-input rounded-2xl outline-none font-bold text-white text-lg border border-white/10 focus:border-p_teal/50 focus:bg-white/10 transition-all duration-300 shadow-inner"
                            value={formData.height}
                            onChange={(e) => setFormData({...formData, height: Number(e.target.value)})}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Weight size={16} /> Weight (kg)
                          </label>
                          <input
                            type="number"
                            required
                            className="w-full px-5 py-4 glass-input rounded-2xl outline-none font-bold text-white text-lg border border-white/10 focus:border-p_teal/50 focus:bg-white/10 transition-all duration-300 shadow-inner"
                            value={formData.weight}
                            onChange={(e) => setFormData({...formData, weight: Number(e.target.value)})}
                          />
                        </div>
                      </div>

                      <div className="relative z-20">
                         <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Palette size={16} /> Skin Tone
                          </label>
                        <CustomSelect 
                            value={formData.skinTone}
                            onChange={(val) => setFormData({...formData, skinTone: val})}
                            options={["Fair", "Light", "Medium", "Olive", "Brown", "Dark"]}
                        />
                      </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-white/10">
                      <button
                        type="submit"
                        className="w-full btn-glass-primary text-white font-black py-4 md:py-5 rounded-2xl transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-3 shadow-xl text-lg group/btn"
                      >
                        <Save size={20} className="md:w-[24px] md:h-[24px] transition-transform group-hover/btn:scale-110" /> 
                        Save Changes
                      </button>
                  </div>
                </form>
            </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && createPortal(
          <div 
            ref={modalOverlayRef}
            onClick={handleOverlayClick}
            className="fixed inset-0 w-screen h-screen z-[99999] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-md animate-fade-in"
          >
              <div className="glass-panel bg-gray-900/95 backdrop-blur-2xl rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center border border-white/10 relative animate-scale-in">
                  <button 
                    onClick={() => setShowLogoutModal(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white hover:bg-gray-800 p-1.5 rounded-full transition-colors cursor-pointer"
                  >
                      <X size={18} />
                  </button>
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-800/50 text-gray-300 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                      <LogOut size={32} className="md:w-[36px] md:h-[36px]" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-3 tracking-tight">Log Out?</h3>
                  <p className="text-gray-400 font-medium mb-8 leading-relaxed text-sm md:text-base">Are you sure you want to log out? You will be returned to the login screen.</p>
                  
                  <div className="flex gap-4">
                      <button 
                        onClick={() => setShowLogoutModal(false)}
                        className="flex-1 py-3 md:py-4 px-4 rounded-xl font-bold btn-glass-secondary border border-white/10 text-gray-300 transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
                      >
                          Cancel
                      </button>
                      <button 
                        onClick={handleLogout}
                        className="flex-1 py-3 md:py-4 px-4 rounded-xl font-bold btn-glass-primary text-white shadow-xl transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
                      >
                          Yes, Log Out
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
