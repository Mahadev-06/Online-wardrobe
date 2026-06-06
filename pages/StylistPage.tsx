import React, { useState, useEffect } from 'react';
import { useWardrobe } from '../context/WardrobeContext';
import { ClothingItem } from '../types';
import { generateOutfitRecommendation } from '../services/ai';
import { Sparkles, Save, X, Loader2, RefreshCw, AlertCircle, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import CustomSelect from '../components/CustomSelect';

const StylistPage: React.FC = () => {
    const { clothes, profile, saveOutfit } = useWardrobe();
    const navigate = useNavigate();
    const [inlineMessage, setInlineMessage] = useState<{text: string, type: 'error' | 'success'} | null>(null);

    const [occasion, setOccasion] = useState('Casual Day Out');
    const [weather, setWeather] = useState('Sunny and Mild');
    
    const [loading, setLoading] = useState(false);
    const [generatedOutfit, setGeneratedOutfit] = useState<{items: ClothingItem[], reasoning: string} | null>(null);

    // Auto-clear message after 3 seconds
    useEffect(() => {
      if (inlineMessage) {
          const timer = setTimeout(() => setInlineMessage(null), 3000);
          return () => clearTimeout(timer);
      }
    }, [inlineMessage]);

    const handleGenerate = async () => {
        setInlineMessage(null);
        if (!profile) {
            setInlineMessage({text: "Please complete your profile first!", type: 'error'});
            return;
        }
        
        if (clothes.length < 2) {
            setInlineMessage({text: "Not enough clothes in your wardrobe! Add some first.", type: 'error'});
            return;
        }

        setLoading(true);
        try {
            const res = await generateOutfitRecommendation(clothes, profile, occasion, weather);
            
            if (res.success) {
                const selectedItems = res.outfitItemIds
                    .map(id => clothes.find(c => c.id === id))
                    .filter(Boolean) as ClothingItem[];
                
                setGeneratedOutfit({ items: selectedItems, reasoning: res.reasoning });
                setInlineMessage({text: "Look generated!", type: 'success'});
            } else {
                setInlineMessage({text: res.reasoning, type: 'error'});
                setGeneratedOutfit(null);
            }
        } catch (err) {
            setInlineMessage({text: "Failed to generate look. Try again.", type: 'error'});
        } finally {
            setLoading(false);
        }
    };

    const handleSaveOutfit = () => {
        if (!generatedOutfit) return;
        saveOutfit({
            id: Date.now().toString(),
            items: generatedOutfit.items,
            date: new Date().toISOString(),
            notes: generatedOutfit.reasoning
        });
        setInlineMessage({text: "Outfit saved to Closet!", type: 'success'});
        navigate('/closet', { state: { activeTab: 'outfits' } });
    };

    return (
        <div className="px-4 py-8 md:px-12 md:py-14 pb-8 md:pb-14 min-h-screen max-w-[1200px] mx-auto page-enter">
            <div className="mb-10 text-center">
                <div className="inline-flex items-center justify-center mb-4 transition-transform hover:scale-110 duration-300">
                    <Sparkles className="w-14 h-14 text-p_teal" />
                </div>
                <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">AI STYLIST</h1>
                <p className="text-gray-400 mt-4 max-w-lg mx-auto font-medium">
                    Let our intelligent AI analyze your current wardrobe and build the perfect look based on rules and standard color theory.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                
                {/* Configuration Panel */}
                <div className="md:col-span-5 glass-panel p-6 md:p-8 relative z-20 shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-white/10 group">
                    <div className="absolute inset-0 bg-gradient-to-br from-p_teal/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-[2rem]"></div>
                    
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Sparkles size={20} className="text-p_teal" /> Parameters
                    </h3>

                    {inlineMessage && (
                        <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 animate-fade-in ${
                            inlineMessage.type === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-p_teal/20 text-p_teal border border-p_teal/30'
                        }`}>
                            {inlineMessage.type === 'error' ? <AlertCircle size={16} /> : <Sparkles size={16} />}
                            {inlineMessage.text}
                        </div>
                    )}
                    
                    <CustomSelect 
                        label="Occasion / Mood"
                        value={occasion}
                        onChange={setOccasion}
                        options={["Casual Day Out", "Date Night", "Business Office", "Party / Club", "Gym / Activewear", "Lounging at Home", "Formal Event"]}
                    />

                    <div className="h-4"></div>

                    <CustomSelect 
                        label="Local Weather"
                        value={weather}
                        onChange={setWeather}
                        options={["Sunny and Mild", "Hot Summer", "Cold Winter", "Rainy / Breezy"]}
                    />

                    <button 
                        onClick={handleGenerate}
                        disabled={loading}
                        className="w-full mt-6 py-4 btn-glass-primary text-white rounded-2xl font-black uppercase tracking-wider transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-p_teal/20 flex justify-center items-center gap-3 group/btn relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000"></div>
                        {loading ? (
                            <Loader2 className="animate-spin w-6 h-6 text-white" />
                        ) : (
                            <>
                                <RefreshCw className="w-5 h-5 group-hover/btn:rotate-180 transition-transform duration-700" />
                                Generate Look
                            </>
                        )}
                    </button>
                </div>

                {/* Results Panel */}
                <div className="md:col-span-7 relative z-10">
                    {loading ? (
                        <div className="h-full min-h-[400px] flex flex-col justify-center items-center bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-[2.5rem] p-8 animate-pulse">
                            <Sparkles className="w-12 h-12 text-p_teal mb-4 animate-bounce" />
                            <p className="font-bold text-xl text-white tracking-tight">Designing your outfit...</p>
                            <p className="text-gray-400 text-sm mt-2 font-medium">Matching colors and occasions.</p>
                        </div>
                    ) : generatedOutfit ? (
                        <div className="glass-panel p-6 md:p-8 animate-fade-in relative shadow-2xl border border-white/10">
                            <div className="bg-[#0a0f12]/50 backdrop-blur-md p-6 rounded-3xl mb-8 relative border border-white/5 shadow-inner">
                                <h3 className="font-black text-p_teal text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Sparkles size={14} /> Stylist Reasoning
                                </h3>
                                <p className="text-gray-300 font-medium italic leading-relaxed">"{generatedOutfit.reasoning}"</p>
                            </div>

                            <div className="flex flex-wrap gap-4 justify-center py-6 mb-8">
                                {generatedOutfit.items.map(item => (
                                    <div key={item.id} className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 shadow-sm p-4 transform hover:scale-105 transition-all duration-300 cursor-pointer relative group">
                                        <img src={item.image} className="w-full h-full object-contain drop-shadow-md" alt={item.category} />
                                        <div className="absolute inset-0 bg-[#0a0f12]/80 text-white text-xs font-bold flex flex-col justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl backdrop-blur-sm p-2 text-center border border-white/10">
                                            <span className="uppercase text-[10px] text-p_teal tracking-widest mb-1">{item.category}</span>
                                            {item.color}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-4 border-t border-white/10 pt-8">
                                <button 
                                    onClick={() => setGeneratedOutfit(null)}
                                    className="flex-1 py-4 btn-glass-secondary border border-white/10 rounded-2xl font-bold transition-all text-gray-400 hover:text-white hover:bg-white/5"
                                >
                                    Discard
                                </button>
                                <button 
                                    onClick={handleSaveOutfit}
                                    className="flex-1 py-4 btn-glass-primary text-white rounded-2xl font-bold shadow-[0_4px_20px_rgba(45,212,191,0.3)] hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(45,212,191,0.4)] transition-all flex items-center justify-center gap-2 group/save"
                                >
                                    <Save className="w-5 h-5 transition-transform group-hover/save:scale-110" /> Save Outfit
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full min-h-[400px] flex flex-col justify-center items-center bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-[2.5rem] p-8 text-center group cursor-default">
                            <Sparkles className="w-16 h-16 text-gray-400 group-hover:text-p_teal group-hover:scale-110 mb-6 transition-all duration-500" />
                            <h3 className="font-bold text-2xl text-white tracking-tight">Ready to style</h3>
                            <p className="text-gray-400 max-w-sm mt-3 font-medium leading-relaxed">Select your occasion and weather on the left pane and hit generate to see magic!</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default StylistPage;
