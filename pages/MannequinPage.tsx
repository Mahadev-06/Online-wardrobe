
import React, { useState } from 'react';
import { useWardrobe } from '../context/WardrobeContext';
import { suggestOutfit, generateTryOnTurnaround } from '../services/geminiService';
import { ClothingItem, ClothingCategory, TryOnImages, Outfit } from '../types';
import { Sparkles, Save, RotateCcw, Loader2, Shirt, Footprints, Quote, Check, Wand2, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const MannequinPage: React.FC = () => {
  const { clothes, profile, saveOutfit } = useWardrobe();
  const navigate = useNavigate();
  const [selectedTop, setSelectedTop] = useState<ClothingItem | null>(null);
  const [selectedBottom, setSelectedBottom] = useState<ClothingItem | null>(null);
  const [selectedShoes, setSelectedShoes] = useState<ClothingItem | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [aiSuggestionText, setAiSuggestionText] = useState<string | null>(null);
  const [occasion, setOccasion] = useState('Casual');
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  
  // Virtual Try On State
  const [isGeneratingTryOn, setIsGeneratingTryOn] = useState(false);
  const [tryOnResult, setTryOnResult] = useState<TryOnImages | null>(null);
  const [showTryOnModal, setShowTryOnModal] = useState(false);

  const handleSuggest = async () => {
    if (!profile || clothes.length < 2) return;
    setIsSuggesting(true);
    setAiSuggestionText(null);
    try {
        const { suggestion, recommendedItemIds } = await suggestOutfit(profile, clothes, occasion);
        setAiSuggestionText(suggestion);
        
        // Auto-select items
        const recommendedItems = clothes.filter(c => recommendedItemIds.includes(c.id));
        
        const top = recommendedItems.find(i => i.category === ClothingCategory.TOP || i.category === ClothingCategory.DRESS);
        const bottom = recommendedItems.find(i => i.category === ClothingCategory.BOTTOM);
        const shoes = recommendedItems.find(i => i.category === ClothingCategory.SHOES);

        // Reset first to ensure clean state if AI changes mind
        setSelectedTop(null);
        setSelectedBottom(null);
        setSelectedShoes(null);

        if (top) setSelectedTop(top);
        if (bottom) setSelectedBottom(bottom);
        if (shoes) setSelectedShoes(shoes);

    } catch (error) {
        console.error(error);
    } finally {
        setIsSuggesting(false);
    }
  };

  const handleVirtualTryOn = async () => {
      if (!profile?.bodyPhoto) {
          alert("Please upload a full-body photo in Settings first.");
          return;
      }
      
      const items = [selectedTop, selectedBottom, selectedShoes].filter(Boolean) as ClothingItem[];
      if (items.length === 0) {
          alert("Select at least one clothing item.");
          return;
      }

      setIsGeneratingTryOn(true);
      setShowTryOnModal(true);
      setTryOnResult(null);
      
      try {
          // Generate all 4 angles
          const results = await generateTryOnTurnaround(profile.bodyPhoto, items);
          setTryOnResult(results);
      } catch (e) {
          console.error("Try-on generation failed:", e);
          alert("Failed to generate try-on images. Please try again.");
          setShowTryOnModal(false);
      } finally {
          setIsGeneratingTryOn(false);
      }
  };

  const handleSaveLook = () => {
      const items = [selectedTop, selectedBottom, selectedShoes].filter(Boolean) as ClothingItem[];
      if (items.length === 0) return;
      
      try {
          const newOutfit: Outfit = {
              id: Date.now().toString(), // Use Date.now() for safer ID generation than crypto.randomUUID
              items,
              date: new Date().toISOString(),
              aiFeedback: aiSuggestionText || undefined,
              tryOnImages: tryOnResult || undefined 
          };

          saveOutfit(newOutfit);
          
          // Close modal if open
          if (showTryOnModal) setShowTryOnModal(false);

          setShowSuccessPopup(true);
          
          // Redirect to Closet after a brief success animation
          setTimeout(() => {
              setShowSuccessPopup(false);
              navigate('/closet', { state: { activeTab: 'outfits' } });
          }, 1500);
      } catch (error) {
          console.error("Failed to save outfit:", error);
          alert("Failed to save outfit. Storage might be full.");
      }
  };

  const clearLook = () => {
      setSelectedTop(null);
      setSelectedBottom(null);
      setSelectedShoes(null);
      setAiSuggestionText(null);
      setTryOnResult(null);
  }

  // Categories for the selection drawer
  const tops = clothes.filter(c => c.category === ClothingCategory.TOP || c.category === ClothingCategory.DRESS);
  const bottoms = clothes.filter(c => c.category === ClothingCategory.BOTTOM);
  const shoesList = clothes.filter(c => c.category === ClothingCategory.SHOES);

  const hasItemsSelected = selectedTop || selectedBottom || selectedShoes;

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-p_cream page-enter overflow-hidden relative pt-0">
        
        {/* Left Panel: Outfit Canvas Wrapper */}
        <div className="flex-1 h-full overflow-y-auto relative flex flex-col pt-4 md:pt-8 pb-32 md:pb-12 px-4 md:px-8 scroll-smooth">
            
            {/* Top Controls */}
            <div className="w-full max-w-3xl mx-auto flex flex-wrap justify-end gap-2 md:gap-4 mb-4 md:mb-8 z-30">
                 <select 
                    value={occasion} 
                    onChange={(e) => setOccasion(e.target.value)}
                    className="flex-1 md:flex-none px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl border-2 border-p_teal/10 bg-white text-p_dark text-xs md:text-sm font-bold focus:outline-none focus:border-p_red shadow-sm cursor-pointer transition hover:border-p_teal/30"
                 >
                    <option value="Casual">Casual</option>
                    <option value="Work">Work / Business</option>
                    <option value="Date Night">Date Night</option>
                    <option value="Party">Party</option>
                    <option value="Gym">Gym / Sport</option>
                    <option value="Formal">Formal Event</option>
                 </select>
                 <button onClick={clearLook} className="p-2 md:p-3 bg-white rounded-xl md:rounded-2xl shadow-sm border-2 border-transparent hover:border-p_red text-p_brown hover:text-p_red transition group" title="Clear Board">
                     <RotateCcw size={20} className="md:w-[22px] md:h-[22px] group-hover:-rotate-180 transition-transform duration-500"/>
                 </button>
                 <button onClick={handleSuggest} disabled={isSuggesting} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 md:px-8 py-2 md:py-3 bg-p_red text-white rounded-xl md:rounded-2xl shadow-lg hover:bg-red-500 transition btn-hover">
                     {isSuggesting ? <Loader2 className="animate-spin" size={18}/> : <Sparkles size={18}/>}
                     <span className="text-xs md:text-sm font-bold">AI Stylist</span>
                 </button>
            </div>

            {/* Canvas Card */}
            <div className="w-full max-w-3xl mx-auto bg-white rounded-[2rem] md:rounded-[3rem] shadow-xl border-4 border-p_dark/5 flex flex-col relative overflow-visible transition-all duration-500 mb-12">
                
                {/* Header inside Canvas - Sticky */}
                <div className="w-full flex justify-between items-start px-6 md:px-10 pt-6 md:pt-10 pb-4 md:pb-6 border-b border-p_teal/10 bg-white/95 backdrop-blur-sm z-20 sticky top-0 rounded-t-[2rem] md:rounded-t-[3rem]">
                    <div>
                        <h3 className="text-xs md:text-sm font-black text-p_teal tracking-[0.2em] uppercase">Style Board</h3>
                        <p className="text-[10px] md:text-xs text-p_brown mt-1 font-medium opacity-60">Curated for {profile?.name}</p>
                    </div>
                    <div className="flex gap-3">
                         {profile?.bodyPhoto ? (
                             <button 
                                onClick={handleVirtualTryOn}
                                disabled={!hasItemsSelected}
                                className={`text-[10px] font-bold px-3 md:px-4 py-2 rounded-xl shadow-sm tracking-wider flex items-center gap-2 transition-all ${hasItemsSelected ? 'bg-p_dark text-white hover:bg-black' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                             >
                                 <Wand2 size={12} className="md:w-[14px] md:h-[14px]" /> <span className="hidden md:inline">TRY ON 360°</span> <span className="md:hidden">TRY ON</span>
                             </button>
                         ) : (
                             <Link to="/settings" className="text-[10px] font-bold bg-p_red/10 text-p_red px-3 md:px-4 py-2 rounded-xl shadow-sm tracking-wider hover:bg-p_red hover:text-white transition">
                                 SETUP TRY-ON
                             </Link>
                         )}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col items-center p-6 md:p-12 gap-6 md:gap-10 w-full min-h-[400px] md:min-h-[550px]">
                    {isSuggesting ? (
                         /* SKELETON LOADER */
                         <div className="w-full flex flex-col items-center gap-6 md:gap-8 py-8">
                            <div className="w-48 h-48 md:w-72 md:h-72 rounded-[2rem] md:rounded-[2.5rem] bg-p_teal/5 border-2 border-dashed border-p_teal/30 relative overflow-hidden animate-pulse flex items-center justify-center">
                                <Sparkles className="text-p_teal/40 animate-bounce opacity-50" size={40} />
                            </div>
                            <div className="flex gap-4 md:gap-6 w-full justify-center">
                                <div className="w-32 h-32 md:w-48 md:h-48 rounded-[1.5rem] md:rounded-[2rem] bg-p_teal/5 border-2 border-dashed border-p_teal/30 relative overflow-hidden animate-pulse flex items-center justify-center">
                                    <div className="w-12 md:w-20 h-2 bg-p_teal/20 rounded-full"></div>
                                </div>
                                <div className="w-32 h-32 md:w-48 md:h-48 rounded-[1.5rem] md:rounded-[2rem] bg-p_teal/5 border-2 border-dashed border-p_teal/30 relative overflow-hidden animate-pulse flex items-center justify-center">
                                    <div className="w-12 md:w-20 h-2 bg-p_teal/20 rounded-full"></div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-p_teal font-bold text-[10px] md:text-xs tracking-[0.25em] animate-pulse mt-4 md:mt-6 bg-white px-6 py-2.5 rounded-full shadow-sm border border-p_teal/10">
                                <Loader2 className="animate-spin" size={14} /> GENERATING LOOK...
                            </div>
                         </div>
                    ) : (
                        /* OUTFIT GRID */
                        <div className="flex flex-col items-center gap-4 md:gap-8 w-full">
                            {/* Top Slot */}
                            <div className="w-48 h-48 md:w-72 md:h-72 border-2 border-dashed border-p_teal/30 rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center bg-p_cream/20 overflow-hidden relative transition-all hover:border-p_red hover:bg-p_cream/40 group shadow-inner">
                                {selectedTop ? (
                                    <img src={selectedTop.image} className="w-full h-full object-contain p-6 md:p-8 drop-shadow-xl transition-transform duration-500 group-hover:scale-105" alt="Selected Top" />
                                ) : (
                                    <div className="text-p_teal/40 flex flex-col items-center group-hover:text-p_red/60 transition-colors">
                                        <Shirt size={40} className="md:w-[56px] md:h-[56px]" strokeWidth={1} />
                                        <span className="text-[10px] md:text-xs mt-3 md:mt-4 font-bold tracking-[0.15em] uppercase">Add Top</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-4 md:gap-6 w-full justify-center">
                                {/* Bottom Slot */}
                                <div className="w-32 h-32 md:w-48 md:h-48 border-2 border-dashed border-p_teal/30 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center bg-p_cream/20 overflow-hidden relative transition-all hover:border-p_red hover:bg-p_cream/40 group shadow-inner">
                                    {selectedBottom ? (
                                        <img src={selectedBottom.image} className="w-full h-full object-contain p-4 md:p-6 drop-shadow-xl transition-transform duration-500 group-hover:scale-105" alt="Selected Bottom" />
                                    ) : (
                                        <div className="text-p_teal/40 flex flex-col items-center group-hover:text-p_red/60 transition-colors">
                                            <div className="w-10 h-10 md:w-14 md:h-14 border-2 border-current rounded-md mb-2 md:mb-3 opacity-60"></div>
                                            <span className="text-[10px] md:text-xs font-bold tracking-[0.15em] uppercase">Bottom</span>
                                        </div>
                                    )}
                                </div>

                                {/* Shoes Slot */}
                                <div className="w-32 h-32 md:w-48 md:h-48 border-2 border-dashed border-p_teal/30 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center bg-p_cream/20 overflow-hidden relative transition-all hover:border-p_red hover:bg-p_cream/40 group shadow-inner">
                                    {selectedShoes ? (
                                        <img src={selectedShoes.image} className="w-full h-full object-contain p-4 md:p-6 drop-shadow-xl transition-transform duration-500 group-hover:scale-105" alt="Selected Shoes" />
                                    ) : (
                                        <div className="text-p_teal/40 flex flex-col items-center group-hover:text-p_red/60 transition-colors">
                                            <Footprints size={40} className="md:w-[56px] md:h-[56px]" strokeWidth={1} />
                                            <span className="text-[10px] md:text-xs mt-3 md:mt-4 font-bold tracking-[0.15em] uppercase">Shoes</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* AI Feedback Text - Distinct Section */}
                    {aiSuggestionText && !isSuggesting && (
                        <div className="w-full mt-4 md:mt-8 animate-fade-in border-t border-dashed border-p_teal/20 pt-6 md:pt-10 pb-4">
                            <div className="bg-gradient-to-br from-p_light to-white p-6 md:p-10 rounded-[2rem] border border-p_teal/10 shadow-sm relative">
                                <div className="absolute -top-3 md:-top-4 left-6 md:left-8 bg-p_dark text-p_cream px-4 md:px-5 py-2 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-widest shadow-md flex items-center gap-2">
                                    <Sparkles size={12} className="text-p_red" />
                                    Stylist Note
                                </div>
                                <Quote className="absolute top-6 right-6 md:top-8 md:right-8 text-p_red/10 rotate-180 w-12 h-12 md:w-20 md:h-20" />
                                
                                <p className="relative z-10 text-p_dark/80 text-sm md:text-lg leading-loose font-medium italic pl-4 md:pl-6 border-l-4 border-p_red/20 mt-2">
                                    "{aiSuggestionText}"
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Save Button Area - Sticky Bottom of Card */}
                {(selectedTop || selectedBottom || selectedShoes) && !isSuggesting && (
                    <div className="p-6 md:p-8 pt-0 flex justify-center w-full bg-white z-20 rounded-b-[2rem] md:rounded-b-[3rem]">
                        <button 
                            onClick={handleSaveLook}
                            className="flex items-center gap-3 px-8 md:px-12 py-3 md:py-4 bg-p_dark text-p_cream rounded-full hover:bg-black hover:scale-105 transition-all shadow-xl font-bold tracking-widest text-xs md:text-sm uppercase btn-hover w-full md:w-auto justify-center"
                        >
                            <Save size={18} className="md:w-[20px] md:h-[20px]" /> Save Look
                        </button>
                    </div>
                )}
            </div>
        </div>

        {/* Right Panel: Item Selector */}
        <div className="w-full md:w-[28rem] bg-white border-l border-p_teal/10 h-[40vh] md:h-full overflow-y-auto z-20 shadow-[-5px_0_30px_rgba(0,0,0,0.02)] flex flex-col shrink-0">
            <div className="p-6 md:p-8 sticky top-0 bg-white/95 backdrop-blur z-10 border-b border-p_teal/10">
                <h3 className="font-black text-p_dark text-lg md:text-xl tracking-tight uppercase flex items-center gap-3">
                    <span className="w-2 h-6 md:h-8 bg-p_red rounded-full block"></span>
                    Wardrobe
                </h3>
            </div>
            
            <div className="p-6 md:p-8 space-y-8 md:space-y-12 pb-40">
                <section>
                    <div className="flex items-center justify-between mb-4 md:mb-5">
                         <h4 className="text-xs font-bold text-p_brown uppercase tracking-widest">Tops & Dresses</h4>
                         <span className="text-[10px] bg-p_cream text-p_brown px-3 py-1 rounded-full font-bold">{tops.length}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 md:gap-4">
                        {tops.map(item => (
                            <button key={item.id} onClick={() => setSelectedTop(item)} className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-300 group ${selectedTop?.id === item.id ? 'border-p_red ring-2 ring-p_red/20 scale-105 shadow-md' : 'border-p_cream hover:border-p_teal hover:shadow-lg'}`}>
                                <img src={item.image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            </button>
                        ))}
                        {tops.length === 0 && <div className="col-span-3 text-xs text-p_brown text-center py-8 bg-p_cream/30 rounded-2xl border border-dashed border-p_teal/20">No tops found</div>}
                    </div>
                </section>

                <section>
                    <div className="flex items-center justify-between mb-4 md:mb-5">
                         <h4 className="text-xs font-bold text-p_brown uppercase tracking-widest">Bottoms</h4>
                         <span className="text-[10px] bg-p_cream text-p_brown px-3 py-1 rounded-full font-bold">{bottoms.length}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 md:gap-4">
                         {bottoms.map(item => (
                            <button key={item.id} onClick={() => setSelectedBottom(item)} className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-300 group ${selectedBottom?.id === item.id ? 'border-p_red ring-2 ring-p_red/20 scale-105 shadow-md' : 'border-p_cream hover:border-p_teal hover:shadow-lg'}`}>
                                <img src={item.image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            </button>
                        ))}
                         {bottoms.length === 0 && <div className="col-span-3 text-xs text-p_brown text-center py-8 bg-p_cream/30 rounded-2xl border border-dashed border-p_teal/20">No bottoms found</div>}
                    </div>
                </section>

                <section>
                    <div className="flex items-center justify-between mb-4 md:mb-5">
                         <h4 className="text-xs font-bold text-p_brown uppercase tracking-widest">Shoes</h4>
                         <span className="text-[10px] bg-p_cream text-p_brown px-3 py-1 rounded-full font-bold">{shoesList.length}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 md:gap-4">
                         {shoesList.map(item => (
                            <button key={item.id} onClick={() => setSelectedShoes(item)} className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-300 group ${selectedShoes?.id === item.id ? 'border-p_red ring-2 ring-p_red/20 scale-105 shadow-md' : 'border-p_cream hover:border-p_teal hover:shadow-lg'}`}>
                                <img src={item.image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            </button>
                        ))}
                         {shoesList.length === 0 && <div className="col-span-3 text-xs text-p_brown text-center py-8 bg-p_cream/30 rounded-2xl border border-dashed border-p_teal/20">No shoes found</div>}
                    </div>
                </section>
            </div>
        </div>

        {/* Success Popup */}
        {showSuccessPopup && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] animate-fade-in"></div>
                <div className="bg-white rounded-[2rem] shadow-2xl p-8 flex flex-col items-center gap-4 relative z-10 page-enter border-4 border-p_cream max-w-sm w-full text-center">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center shadow-inner mb-2">
                        <Check size={32} strokeWidth={4} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-p_dark uppercase tracking-tight mb-1">Look Saved!</h3>
                        <p className="text-p_brown font-medium">Redirecting to closet...</p>
                    </div>
                </div>
            </div>
        )}

        {/* Virtual Try-On Modal */}
        {showTryOnModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-p_dark/90 backdrop-blur-md animate-fade-in" onClick={() => setShowTryOnModal(false)}></div>
                <div className="bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl overflow-hidden relative z-10 w-full max-w-5xl max-h-[85vh] md:max-h-[90vh] flex flex-col animate-fade-in">
                    <button 
                        onClick={() => setShowTryOnModal(false)}
                        className="absolute top-4 right-4 md:top-8 md:right-8 p-2 md:p-3 bg-white/80 hover:bg-white rounded-full z-20 text-p_dark hover:text-p_red transition shadow-sm"
                    >
                        <X size={20} className="md:w-6 md:h-6" />
                    </button>

                    <div className="p-6 md:p-10 pb-4 md:pb-6 text-center border-b border-p_teal/10">
                         <div className="inline-flex items-center gap-2 bg-p_teal/10 text-p_teal px-4 md:px-5 py-2 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest mb-2 md:mb-4">
                             <Wand2 size={12} className="md:w-[14px] md:h-[14px]" /> AI Virtual Try-On
                         </div>
                         <h2 className="text-2xl md:text-4xl font-black text-p_dark tracking-tight">360° View</h2>
                         <p className="text-p_brown/70 text-sm md:text-base mt-2">Generating view from all angles...</p>
                    </div>

                    <div className="flex-1 p-6 md:p-10 overflow-y-auto min-h-[300px] md:min-h-[450px]">
                        {isGeneratingTryOn ? (
                            <div className="flex flex-col items-center justify-center h-full gap-8 md:gap-10">
                                <div className="relative">
                                    <div className="w-20 h-20 md:w-28 md:h-28 rounded-full border-4 border-p_cream border-t-p_red animate-spin"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Sparkles className="text-p_red animate-pulse" size={24} />
                                    </div>
                                </div>
                                <div className="text-center">
                                    <p className="font-bold text-xl md:text-2xl text-p_dark mb-2">Generating Turnaround...</p>
                                    <p className="text-p_brown text-sm md:text-base">Creating Front, Left, Right, and Back views.<br/>This may take up to 45 seconds to ensure quality.</p>
                                </div>
                            </div>
                        ) : tryOnResult ? (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                                {['front', 'left', 'right', 'back'].map((angle) => {
                                    const img = tryOnResult[angle as keyof typeof tryOnResult];
                                    const labels: Record<string, string> = { front: 'Front', left: 'Left Side', right: 'Right Side', back: 'Back' };
                                    
                                    return (
                                        <div key={angle} className="flex flex-col gap-2 md:gap-4">
                                            <div className="bg-p_light rounded-2xl md:rounded-3xl overflow-hidden border border-p_teal/10 shadow-inner aspect-[3/4] flex items-center justify-center relative group">
                                                {img ? (
                                                    <img src={img} alt={`${angle} view`} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="text-p_brown/40 text-xs">Failed to load</div>
                                                )}
                                                <div className="absolute top-2 left-2 md:top-3 md:left-3 bg-black/60 text-white text-[10px] font-bold px-2 py-1 md:px-3 md:py-1.5 rounded-lg backdrop-blur-md">
                                                    {labels[angle]}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="text-center text-p_brown flex items-center justify-center h-full">
                                <p>Something went wrong. Please try again.</p>
                            </div>
                        )}
                    </div>
                    
                    {tryOnResult && !isGeneratingTryOn && (
                        <div className="p-6 md:p-10 pt-4 md:pt-6 flex justify-center border-t border-p_teal/10 bg-white">
                             <button 
                                onClick={handleSaveLook}
                                className="px-8 md:px-12 py-4 md:py-5 bg-p_dark text-white rounded-2xl font-bold hover:bg-black transition shadow-xl flex items-center gap-3 text-base md:text-lg"
                             >
                                 <Save size={20} className="md:w-[24px] md:h-[24px]" /> Save Full Look
                             </button>
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};

export default MannequinPage;
