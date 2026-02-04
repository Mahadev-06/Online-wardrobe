
import React, { useState, useEffect, useRef } from 'react';
import { useWardrobe } from '../context/WardrobeContext';
import { UserProfile } from '../types';
import { User, Ruler, Weight, Palette, Save, LogOut, Camera, Trash2, Users, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { compressImage } from '../utils/imageHelpers';
import { useToast } from '../context/ToastContext';
import { getAiStatus } from '../services/geminiService';

const SettingsPage: React.FC = () => {
  const { profile, setProfile, logout } = useWardrobe();
  const navigate = useNavigate();
  const toast = useToast();
  const [formData, setFormData] = useState<UserProfile | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const status = getAiStatus();

  useEffect(() => {
    if (profile) setFormData(profile);
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
        setProfile(formData);
        toast.success("Profile updated successfully!");
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
            toast.info("Photo updated");
        } catch (err) {
            toast.error("Failed to process photo");
        }
    }
  };

  if (!formData) return null;

  // Determine status display
  let statusColor = 'bg-red-50 border-red-200 text-red-700';
  let statusIcon = <AlertCircle size={16} />;
  let statusText = 'AI Config Missing';

  if (status === 'OK') {
      statusColor = 'bg-green-50 border-green-200 text-green-700';
      statusIcon = <CheckCircle size={16} />;
      statusText = 'AI System Online';
  } else if (status === 'INVALID_FORMAT') {
      statusColor = 'bg-amber-50 border-amber-200 text-amber-700';
      statusIcon = <AlertTriangle size={16} />;
      statusText = 'Invalid Key Format';
  }

  return (
    <div className="px-4 py-8 md:px-12 md:py-14 pb-32 max-w-4xl mx-auto page-enter">
      <div className="flex justify-between items-center mb-6 md:mb-10">
        <h1 className="text-3xl font-black text-p_dark tracking-tight">SETTINGS</h1>
        
        {/* AI Status Indicator */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${statusColor}`}>
            {statusIcon}
            <span className="text-xs font-bold uppercase tracking-wider">{statusText}</span>
        </div>
      </div>
      
      {status === 'INVALID_FORMAT' && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-sm text-amber-800 flex items-start gap-3">
              <AlertTriangle className="shrink-0 mt-0.5" size={18} />
              <div>
                  <p className="font-bold">Check your API Key</p>
                  <p>The key provided looks like a Project ID (e.g., "gen-lang-client..."). Please ensure you are using a valid API Key from Google AI Studio, which always starts with "AIza".</p>
              </div>
          </div>
      )}

      {status === 'MISSING' && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8 text-sm text-blue-900 flex items-start gap-4 shadow-sm">
             <Info className="shrink-0 mt-1 text-blue-600" size={24} />
             <div>
                 <h3 className="font-black text-lg text-blue-800 mb-2">Final Step: Connect AI</h3>
                 <p className="mb-4 leading-relaxed">To enable the Stylist and Virtual Try-On features, you need to add your Google Gemini API Key to your deployment settings.</p>
                 
                 <div className="bg-white/60 p-4 rounded-xl border border-blue-100">
                     <p className="font-bold text-xs uppercase tracking-widest text-blue-500 mb-2">Vercel Instructions</p>
                     <ol className="list-decimal ml-4 space-y-2 font-medium">
                         <li>Go to your Vercel Project Dashboard.</li>
                         <li>Navigate to <b>Settings</b> &gt; <b>Environment Variables</b>.</li>
                         <li>Add a new variable with Key: <code className="bg-white px-2 py-0.5 rounded border border-blue-200">API_KEY</code></li>
                         <li>Paste your API Key as the Value.</li>
                         <li>Go to <b>Deployments</b> and click <b>Redeploy</b> on the latest build.</li>
                     </ol>
                 </div>
             </div>
          </div>
      )}

      <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-lg border border-p_teal/10 p-6 md:p-12 mb-10">
        <h2 className="text-xl md:text-2xl font-bold text-p_dark mb-6 md:mb-8 flex items-center gap-3">
            <div className="bg-p_red/10 p-2 md:p-3 rounded-xl text-p_red"><User size={24} className="md:w-[28px] md:h-[28px]"/></div>
            Edit Profile
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
          
          {/* Body Photo Section */}
          <div className="bg-p_light/50 p-6 md:p-8 rounded-3xl border border-p_cream">
             <label className="block text-xs font-bold text-p_brown uppercase tracking-widest mb-4">Virtual Try-On Model</label>
             <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                 <div 
                    className="w-24 h-32 md:w-32 md:h-40 bg-white rounded-2xl border-2 border-dashed border-p_teal/30 flex items-center justify-center overflow-hidden cursor-pointer hover:border-p_red transition relative group shadow-sm shrink-0"
                    onClick={() => fileInputRef.current?.click()}
                 >
                     {formData.bodyPhoto ? (
                         <>
                            <img src={formData.bodyPhoto} className="w-full h-full object-cover" alt="Body Model" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                <Camera className="text-white" size={24} />
                            </div>
                         </>
                     ) : (
                         <div className="text-center p-2">
                             <User className="w-8 h-8 md:w-10 md:h-10 text-p_teal/50 mx-auto mb-2" />
                             <span className="text-[10px] text-p_brown font-bold uppercase tracking-wide">Add Photo</span>
                         </div>
                     )}
                 </div>
                 <div className="flex-1 text-center md:text-left">
                     <h3 className="font-bold text-p_dark text-base md:text-lg">Full Body Photo</h3>
                     <p className="text-p_brown/70 mt-1 mb-4 leading-relaxed font-medium text-sm">Upload a photo of yourself to enable the 360° AI Virtual Try-On features.</p>
                     <div className="flex gap-3 justify-center md:justify-start">
                        <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 md:px-5 md:py-2.5 bg-white border border-p_teal/20 rounded-xl text-xs md:text-sm font-bold text-p_dark hover:bg-p_light transition shadow-sm"
                        >
                            Upload New
                        </button>
                        {formData.bodyPhoto && (
                            <button 
                                type="button"
                                onClick={() => setFormData({...formData, bodyPhoto: undefined})}
                                className="px-3 py-2 md:px-4 md:py-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition"
                            >
                                <Trash2 size={16} className="md:w-[18px] md:h-[18px]" />
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
          </div>

          <div>
            <label className="block text-xs font-bold text-p_brown uppercase tracking-widest mb-2">Display Name</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 md:px-5 md:py-4 border-2 border-p_cream rounded-2xl focus:border-p_red outline-none bg-p_light text-p_dark font-bold text-base md:text-lg"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          {/* Gender Section */}
          <div>
             <label className="block text-xs font-bold text-p_brown uppercase tracking-widest mb-3 flex items-center gap-1">
                <Users size={14} /> Gender
             </label>
             <div className="flex gap-4">
                <button
                    type="button"
                    onClick={() => setFormData({...formData, gender: 'Female'})}
                    className={`flex-1 py-3 px-4 md:py-4 rounded-xl font-bold transition-all border-2 text-base md:text-lg ${formData.gender === 'Female' ? 'bg-p_red text-white border-p_red shadow-md' : 'bg-white text-p_brown border-p_cream hover:border-p_red/30'}`}
                >
                    Female
                </button>
                <button
                    type="button"
                    onClick={() => setFormData({...formData, gender: 'Male'})}
                    className={`flex-1 py-3 px-4 md:py-4 rounded-xl font-bold transition-all border-2 text-base md:text-lg ${formData.gender === 'Male' ? 'bg-p_teal text-white border-p_teal shadow-md' : 'bg-white text-p_brown border-p_cream hover:border-p_teal/30'}`}
                >
                    Male
                </button>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4 md:gap-8">
            <div>
              <label className="block text-xs font-bold text-p_brown uppercase tracking-widest mb-2 flex items-center gap-1">
                <Ruler size={14} /> Height (cm)
              </label>
              <input
                type="number"
                required
                className="w-full px-4 py-3 md:px-5 md:py-4 border-2 border-p_cream rounded-2xl focus:border-p_red outline-none bg-p_light text-p_dark font-bold text-base md:text-lg"
                value={formData.height}
                onChange={(e) => setFormData({...formData, height: Number(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-p_brown uppercase tracking-widest mb-2 flex items-center gap-1">
                <Weight size={14} /> Weight (kg)
              </label>
              <input
                type="number"
                required
                className="w-full px-4 py-3 md:px-5 md:py-4 border-2 border-p_cream rounded-2xl focus:border-p_red outline-none bg-p_light text-p_dark font-bold text-base md:text-lg"
                value={formData.weight}
                onChange={(e) => setFormData({...formData, weight: Number(e.target.value)})}
              />
            </div>
          </div>

          <div>
             <label className="block text-xs font-bold text-p_brown uppercase tracking-widest mb-2 flex items-center gap-1">
                <Palette size={14} /> Skin Tone
              </label>
            <select
                className="w-full px-4 py-3 md:px-5 md:py-4 border-2 border-p_cream rounded-2xl focus:border-p_red outline-none bg-p_light text-p_dark font-bold text-base md:text-lg cursor-pointer"
                value={formData.skinTone}
                onChange={(e) => setFormData({...formData, skinTone: e.target.value})}
            >
                <option value="Fair">Fair / Pale</option>
                <option value="Light">Light</option>
                <option value="Medium">Medium / Tan</option>
                <option value="Olive">Olive</option>
                <option value="Brown">Brown</option>
                <option value="Dark">Dark / Ebony</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-p_dark hover:bg-black text-white font-bold py-4 md:py-5 rounded-2xl transition flex items-center justify-center gap-3 shadow-xl btn-hover text-lg mt-4"
          >
            <Save size={20} className="md:w-[24px] md:h-[24px]" /> Save Changes
          </button>
        </form>
      </div>

      <div className="bg-red-50 rounded-[2rem] border border-red-100 p-8 md:p-10">
          <h3 className="text-red-900 font-bold mb-3 text-lg">Account Actions</h3>
          <p className="text-red-700/80 text-sm mb-6 md:mb-8 font-medium leading-relaxed">Logging out will remove your personal session from this device. Your wardrobe data will remain stored locally in your browser.</p>
          <button 
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="w-full sm:w-auto px-8 md:px-10 py-3 md:py-4 bg-white border border-red-200 text-red-600 font-bold rounded-2xl hover:bg-red-600 hover:text-white transition flex items-center justify-center gap-3 shadow-sm cursor-pointer"
          >
              <LogOut size={20} /> Log Out
          </button>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-p_dark/60 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center border-4 border-p_cream transform scale-100 transition-all">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner animate-pulse">
                      <LogOut size={32} className="md:w-[36px] md:h-[36px]" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-2xl font-black text-p_dark mb-3 tracking-tight">Log Out?</h3>
                  <p className="text-p_brown font-medium mb-8 leading-relaxed text-sm md:text-base">Are you sure you want to log out? You will be returned to the login screen.</p>
                  
                  <div className="flex gap-4">
                      <button 
                        onClick={() => setShowLogoutModal(false)}
                        className="flex-1 py-3 md:py-4 px-4 rounded-xl font-bold border-2 border-p_dark/10 text-p_dark hover:bg-p_light transition hover:scale-105"
                      >
                          Cancel
                      </button>
                      <button 
                        onClick={handleLogout}
                        className="flex-1 py-3 md:py-4 px-4 rounded-xl font-bold bg-p_red text-white hover:bg-red-600 shadow-xl shadow-red-200 transition hover:scale-105"
                      >
                          Yes, Log Out
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default SettingsPage;
