
import React, { useState, useRef } from 'react';
import { Camera, Check, Loader2, X, Edit3, Tag, Layers } from 'lucide-react';
import { analyzeClothingImage } from '../services/geminiService';
import { useWardrobe } from '../context/WardrobeContext';
import { ClothingItem, ClothingCategory } from '../types';
import { useNavigate } from 'react-router-dom';
import { compressImage } from '../utils/imageHelpers';
import { useToast } from '../context/ToastContext';

const COMMON_STYLES = [
    "Casual", "Formal", "Streetwear", "Vintage", "Minimalist", 
    "Boho", "Chic", "Sporty", "Business", "Grunge", "Preppy", "Y2K"
];

const COMMON_MATERIALS = [
    "Cotton", "Polyester", "Denim", "Silk", "Wool", "Linen", 
    "Leather", "Velvet", "Satin", "Knitted", "Nylon", "Rayon"
];

const UploadPage: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<Partial<ClothingItem> | null>(null);
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addClothingItem } = useWardrobe();
  const navigate = useNavigate();
  const toast = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
          toast.error("File is too large (Max 10MB)");
          return;
      }
      try {
        // Compress immediately to save storage
        const compressed = await compressImage(file, 800, 800, 0.7);
        setSelectedImage(compressed);
        setAnalysisResult(null); 
        setIsAiGenerated(false);
        toast.info("Image processed and compressed");
      } catch (err) {
        console.error(err);
        toast.error("Failed to process image");
      }
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeClothingImage(selectedImage);
      setAnalysisResult(result);
      setIsAiGenerated(true);
      toast.success("AI Analysis Complete!");
    } catch (error: any) {
      console.error("Analysis Failed:", error);
      // Show the actual error message to the user
      const errorMessage = error?.message || "AI analysis failed";
      toast.error(errorMessage);
      
      // Fallback to manual entry silently so they can continue
      setAnalysisResult({
          category: ClothingCategory.TOP,
          color: '',
          style: '',
          material: '',
          description: ''
      });
      setIsAiGenerated(false);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleManualEntry = () => {
    setAnalysisResult({
        category: ClothingCategory.TOP,
        color: '',
        style: '',
        material: '',
        description: ''
    });
    setIsAiGenerated(false);
  };

  const addTag = (field: 'style' | 'material', value: string) => {
      if (!analysisResult) return;
      const current = analysisResult[field] || '';
      if (current.toLowerCase().includes(value.toLowerCase())) return;
      const newValue = current ? `${current}, ${value}` : value;
      setAnalysisResult({ ...analysisResult, [field]: newValue });
  };

  const handleSave = () => {
    if (!selectedImage || !analysisResult) return;
    
    const uniqueId = Date.now().toString(36) + Math.random().toString(36).substring(2, 9);

    const newItem: ClothingItem = {
      id: uniqueId,
      image: selectedImage,
      category: (analysisResult.category as ClothingCategory) || ClothingCategory.TOP,
      color: analysisResult.color || 'Unknown',
      style: analysisResult.style || 'Unknown',
      material: analysisResult.material || 'Unknown',
      description: analysisResult.description || 'Uploaded item',
      dateAdded: Date.now()
    };
    
    addClothingItem(newItem);
    navigate('/closet');
  };

  return (
    <div className="px-4 py-6 md:px-12 md:py-14 pb-32 max-w-6xl mx-auto page-enter">
      <h1 className="text-3xl md:text-4xl font-black text-p_dark mb-6 md:mb-10 tracking-tight">ADD NEW ITEM</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-start">
        
        {/* Left Column: Upload Area - Sticky on Desktop */}
        <div className="space-y-6 md:space-y-8 lg:sticky lg:top-24 z-10">
          <div 
            className={`border-4 border-dashed rounded-[2rem] md:rounded-[2.5rem] h-80 md:h-[550px] flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative overflow-hidden group ${selectedImage ? 'border-p_red bg-white shadow-lg' : 'border-p_teal/30 hover:border-p_red hover:bg-white bg-p_light'}`}
            onClick={() => !selectedImage && fileInputRef.current?.click()}
          >
            {selectedImage ? (
              <>
                <div className="absolute inset-0 p-4 md:p-6 flex items-center justify-center">
                    <img src={selectedImage} alt="Preview" className="max-w-full max-h-full object-contain rounded-xl md:rounded-2xl shadow-sm" />
                </div>
                {/* Enhanced Clear Button */}
                <button 
                  onClick={(e) => { e.stopPropagation(); setSelectedImage(null); setAnalysisResult(null); setIsAiGenerated(false); }}
                  className="absolute top-4 right-4 md:top-6 md:right-6 bg-white/80 backdrop-blur-md p-3 md:p-4 rounded-full text-p_dark hover:bg-p_red hover:text-white shadow-xl border border-p_dark/5 transition-all transform hover:scale-110 z-20 group/btn"
                  title="Remove Image"
                >
                  <X size={20} className="md:w-6 md:h-6 group-hover/btn:rotate-90 transition-transform duration-300" />
                </button>
                {/* Change Image Overlay hint */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <p className="text-white font-bold text-lg bg-white/20 backdrop-blur px-6 py-3 rounded-2xl">Click 'X' to remove</p>
                </div>
              </>
            ) : (
              <>
                <div className="bg-white p-6 md:p-10 rounded-full shadow-xl mb-4 md:mb-8 group-hover:scale-110 group-hover:rotate-[-5deg] transition-transform duration-300 border border-p_teal/10">
                    <Camera className="w-10 h-10 md:w-16 md:h-16 text-p_red group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-p_dark font-black text-xl md:text-2xl tracking-tight group-hover:text-p_red transition-colors">Upload Photo</p>
                <p className="text-p_brown text-sm md:text-base mt-2 font-medium">Click or drag & drop</p>
              </>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange}
            />
          </div>

          {/* Action Buttons */}
          {selectedImage && !analysisResult && (
            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in">
                <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="flex-1 py-4 md:py-5 bg-p_red text-white rounded-xl md:rounded-2xl font-bold shadow-xl hover:bg-red-500 disabled:opacity-50 flex items-center justify-center gap-3 btn-hover transition-all transform hover:-translate-y-1 hover:scale-[1.02] text-base md:text-lg"
                >
                {isAnalyzing ? (
                    <> <Loader2 className="animate-spin" size={20} /> Analyzing... </>
                ) : (
                    <> <SparklesIcon size={20} /> Analyze with AI </>
                )}
                </button>
                <button
                onClick={handleManualEntry}
                disabled={isAnalyzing}
                className="flex-1 py-4 md:py-5 bg-white border-2 border-p_dark/10 text-p_dark rounded-xl md:rounded-2xl font-bold shadow-sm hover:border-p_dark transition-all transform hover:-translate-y-1 hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-3 text-base md:text-lg"
                >
                    <Edit3 size={18} /> Manual Entry
                </button>
            </div>
          )}
        </div>

        {/* Right Column: Results / Form Area */}
        {analysisResult && (
          <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-2xl border-2 border-p_cream animate-fade-in relative overflow-hidden">
             {/* Decorative Background Element */}
             <div className="absolute top-0 right-0 w-80 h-80 bg-p_teal/5 rounded-bl-full pointer-events-none -mr-12 -mt-12"></div>
             
             <div className="relative z-10">
                 <div className="flex items-center justify-between mb-6 md:mb-10 pb-4 md:pb-6 border-b border-p_teal/10 sticky top-0 bg-white/95 backdrop-blur-sm z-20 pt-2 -mt-2">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black text-p_dark tracking-tight">ITEM DETAILS</h2>
                        <p className="text-xs md:text-sm text-p_brown mt-1 font-bold tracking-widest uppercase">Review & Save</p>
                    </div>
                    {isAiGenerated && (
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] md:text-xs font-bold bg-p_red/10 text-p_red px-3 md:px-4 py-1 md:py-1.5 rounded-full flex items-center gap-2 mb-1 animate-pulse">
                                <SparklesIcon size={12} /> AI GENERATED
                            </span>
                        </div>
                    )}
                 </div>
                 
                 <div className="space-y-6 md:space-y-10">
                    {/* Category Selection */}
                    <div className="group">
                       <label className="block text-xs font-bold text-p_brown uppercase tracking-widest mb-3 md:mb-4">Category</label>
                       <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3">
                         {Object.values(ClothingCategory).map(c => (
                             <button 
                                key={c}
                                onClick={() => setAnalysisResult({...analysisResult, category: c})}
                                className={`py-2 md:py-3 px-2 text-xs md:text-sm font-bold rounded-xl border-2 transition-all transform hover:scale-105 ${analysisResult.category === c ? 'border-p_dark bg-p_dark text-white shadow-md' : 'border-p_cream bg-white text-p_brown hover:border-p_teal'}`}
                             >
                                 {c}
                             </button>
                         ))}
                       </div>
                    </div>
                    
                    {/* Color */}
                    <div>
                        <label className="block text-xs font-bold text-p_brown uppercase tracking-widest mb-3 md:mb-4">Color</label>
                        <input 
                            type="text" 
                            value={analysisResult.color} 
                            onChange={(e) => setAnalysisResult({...analysisResult, color: e.target.value})}
                            className="w-full p-4 md:p-5 border-2 border-p_cream rounded-2xl bg-p_light text-p_dark font-bold focus:border-p_red outline-none transition shadow-sm text-base md:text-lg focus:shadow-md" 
                            placeholder="e.g. Navy Blue"
                        />
                    </div>

                    {/* Style */}
                    <div>
                        <div className="flex justify-between items-center mb-3 md:mb-4">
                            <label className="text-xs font-bold text-p_brown uppercase tracking-widest flex items-center gap-2">
                                Style <Tag size={14} />
                            </label>
                        </div>
                        <input 
                            type="text" 
                            value={analysisResult.style} 
                            onChange={(e) => setAnalysisResult({...analysisResult, style: e.target.value})}
                            className="w-full p-4 md:p-5 border-2 border-p_cream rounded-2xl bg-p_light text-p_dark font-bold focus:border-p_red outline-none transition shadow-sm text-base md:text-lg focus:shadow-md" 
                            placeholder="e.g. Casual, Streetwear"
                        />
                        <div className="flex flex-wrap gap-2 md:gap-3 mt-3 md:mt-4">
                            {COMMON_STYLES.map(style => (
                                <button
                                    key={style}
                                    onClick={() => addTag('style', style)}
                                    className="px-3 md:px-4 py-1.5 md:py-2 text-[10px] md:text-xs font-bold border border-p_teal/20 rounded-xl text-p_brown hover:bg-p_teal hover:text-white transition-all transform hover:scale-105 bg-white"
                                >
                                    + {style}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Material */}
                    <div>
                        <div className="flex justify-between items-center mb-3 md:mb-4">
                             <label className="text-xs font-bold text-p_brown uppercase tracking-widest flex items-center gap-2">
                                Material <Layers size={14} />
                            </label>
                        </div>
                        <input 
                            list="material-options"
                            type="text" 
                            value={analysisResult.material || ''} 
                            onChange={(e) => setAnalysisResult({...analysisResult, material: e.target.value})}
                            className="w-full p-4 md:p-5 border-2 border-p_cream rounded-2xl bg-p_light text-p_dark font-bold focus:border-p_red outline-none transition shadow-sm text-base md:text-lg focus:shadow-md" 
                            placeholder="e.g. Cotton, Denim"
                        />
                         <div className="flex flex-wrap gap-2 md:gap-3 mt-3 md:mt-4">
                            {COMMON_MATERIALS.map(mat => (
                                <button
                                    key={mat}
                                    onClick={() => addTag('material', mat)}
                                    className="px-3 md:px-4 py-1.5 md:py-2 text-[10px] md:text-xs font-bold border border-p_teal/20 rounded-xl text-p_brown hover:bg-p_teal hover:text-white transition-all transform hover:scale-105 bg-white"
                                >
                                    + {mat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-bold text-p_brown uppercase tracking-widest mb-3 md:mb-4">Description</label>
                        <textarea 
                            value={analysisResult.description} 
                            onChange={(e) => setAnalysisResult({...analysisResult, description: e.target.value})}
                            className="w-full p-4 md:p-5 border-2 border-p_cream rounded-2xl bg-p_light text-p_dark font-medium focus:border-p_red outline-none transition h-32 md:h-40 resize-none shadow-sm leading-relaxed text-sm md:text-base focus:shadow-md" 
                        />
                    </div>

                    <div className="pt-6 border-t border-p_teal/10">
                        <button 
                            onClick={handleSave}
                            className="w-full py-4 md:py-5 bg-p_dark text-p_cream rounded-2xl font-black text-lg md:text-xl hover:bg-black flex items-center justify-center gap-3 shadow-xl btn-hover transition-transform hover:scale-[1.02]"
                        >
                            <Check size={24} className="md:w-7 md:h-7" strokeWidth={3} /> Save to Closet
                        </button>
                    </div>
                 </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SparklesIcon = ({ size = 20 }: { size?: number }) => (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
);

export default UploadPage;
