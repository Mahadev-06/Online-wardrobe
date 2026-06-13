import { Button } from "../components/ui/button";
import React, { useState, useEffect } from 'react';
import { useWardrobe } from '../context/WardrobeContext';
import { ClothingItem } from '../types';
import { generateOutfitRecommendation, reviewOutfit } from '../services/ai';
import { Sparkles, Loader2, RefreshCw, AlertCircle, Quote, CheckCircle, Lightbulb, Shirt, Footprints, ChevronDown, X, Layers, Watch } from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';

interface SlotBoxProps {
    label: string;
    item: ClothingItem | null;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
    onClear: () => void;
    className?: string;
}

const SlotBox: React.FC<SlotBoxProps> = ({
    label,
    item,
    icon,
    isActive,
    onClick,
    onClear,
    className = ""
}) => {
    return (
        <div
            onClick={onClick}
            className={`rounded-none border-2 cursor-pointer relative overflow-hidden transition-all duration-300 flex flex-col items-center justify-center p-4 ${className} ${
                item
                    ? 'bg-white border-[#0a0f1a] text-[#0a0f1a] shadow-[4px_4px_0_#FF5A50] hover:shadow-[5px_5px_0_#FF5A50] hover:translate-x-[-1px] hover:translate-y-[-1px]'
                    : isActive
                        ? 'border-dashed border-2 border-[#FF5A50] bg-red-50/50'
                        : 'border-dashed border-2 border-[#0a0f1a]/40 bg-gray-50 hover:border-[#0a0f1a] hover:bg-gray-100'
            }`}
        >
            {item ? (
                <>
                    <img
                        src={item.image}
                        alt={label}
                        className="w-full h-full object-contain p-1.5 transition-transform duration-500 hover:scale-105 animate-scale-in"
                    />
                    {/* Clear Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onClear();
                        }}
                        className="absolute top-2.5 right-2.5 z-20 w-6 h-6 rounded-none bg-white border-2 border-[#0a0f1a] hover:bg-p_red hover:text-white flex items-center justify-center text-[#0a0f1a] transition-all shadow-[1.5px_1.5px_0_#0a0f1a] hover:translate-x-[-0.5px] hover:translate-y-[-0.5px] hover:shadow-[2px_2px_0_#0a0f1a] cursor-pointer"
                        title="Remove Item"
                    >
                        <X size={10} />
                    </button>
                    {/* Item label */}
                    <div className="absolute bottom-2 left-0 right-0 text-center z-10 pointer-events-none">
                        <span className="font-mono text-[8px] font-black uppercase tracking-wider text-white bg-[#0a0f1a] px-2 py-0.5 rounded-none border border-[#0a0f1a] shadow-[1px_1px_0_#FF5A50]">{item.color}</span>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center text-center gap-1.5">
                    <div className="text-[#0a0f1a]/55">
                        {icon}
                    </div>
                    <span className="font-mono text-[10px] font-black uppercase tracking-widest text-[#0a0f1a]/70 mt-0.5">
                        {label}
                    </span>
                </div>
            )}
        </div>
    );
};

const StylistPage: React.FC = () => {
    const {
        clothes,
        profile,
        saveOutfit,
        customRecommendation,
        customLoading,
        generateCustomRecommendation,
        clearCustomRecommendation
    } = useWardrobe();
    const [inlineMessage, setInlineMessage] = useState<{text: string, type: 'error' | 'success'} | null>(null);

    // Dropdowns open state
    const [isOccasionOpen, setIsOccasionOpen] = useState(false);
    const [isWeatherOpen, setIsWeatherOpen] = useState(false);

    // Auto Mode State
    const [occasion, setOccasion] = useState('Casual Day Out');
    const [weather, setWeather] = useState('Sunny and Mild');
    // Mode State
    const [stylistNotes, setStylistNotes] = useState<string>('');
    const [manualTopId, setManualTopId] = useState<string>('');
    const [manualBottomId, setManualBottomId] = useState<string>('');
    const [manualShoesId, setManualShoesId] = useState<string>('');
    const [manualOuterwearId, setManualOuterwearId] = useState<string>('');
    const [manualAccessoryId, setManualAccessoryId] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'Outerwear' | 'Top' | 'Bottom' | 'Shoes' | 'Accessory'>('Top');
    const [reviewing, setReviewing] = useState(false);
    const [reviewResult, setReviewResult] = useState<{score: number, review: string} | null>(null);

    const manualTop = clothes.find(c => c.id === manualTopId) || null;
    const manualBottom = clothes.find(c => c.id === manualBottomId) || null;
    const manualShoes = clothes.find(c => c.id === manualShoesId) || null;
    const manualOuterwear = clothes.find(c => c.id === manualOuterwearId) || null;
    const manualAccessory = clothes.find(c => c.id === manualAccessoryId) || null;

    const hasSelectedItems = !!(manualTopId || manualBottomId || manualShoesId || manualOuterwearId || manualAccessoryId);
    const showReviewButton = !customLoading && !stylistNotes && hasSelectedItems;

    useEffect(() => {
      if (inlineMessage) {
          const timer = setTimeout(() => setInlineMessage(null), 4000);
          return () => clearTimeout(timer);
      }
    }, [inlineMessage]);

    useEffect(() => {
        if (customRecommendation) {
            const selectedItems = customRecommendation.outfitItemIds
                .map(id => clothes.find(c => c.id === id))
                .filter(Boolean) as ClothingItem[];
            setManualTopId(selectedItems.find(i => i.category === 'Top' || i.category === 'Dress')?.id || '');
            setManualBottomId(selectedItems.find(i => i.category === 'Bottom')?.id || '');
            setManualShoesId(selectedItems.find(i => i.category === 'Shoes')?.id || '');
            setManualOuterwearId(selectedItems.find(i => i.category === 'Outerwear')?.id || '');
            setManualAccessoryId(selectedItems.find(i => i.category === 'Accessory')?.id || '');

            setStylistNotes(customRecommendation.reasoning);
            setReviewResult(null); // Clear manual reviews
            setInlineMessage({text: "Outfit generated! Check the board below and save it to your closet if you like it.", type: 'success'});

            clearCustomRecommendation();
        }
    }, [customRecommendation]);

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

        try {
            await generateCustomRecommendation(occasion, weather);
        } catch (err: any) {
            setInlineMessage({text: err.message || "Failed to generate look. Try again.", type: 'error'});
        }
    };

    const handleReview = async () => {
        setInlineMessage(null);
        if (!profile) return;

        const selected = [manualTop, manualBottom, manualShoes, manualOuterwear, manualAccessory].filter(Boolean) as ClothingItem[];
        if (selected.length === 0) {
            setInlineMessage({text: "Select at least one item to review.", type: 'error'});
            return;
        }

        setReviewing(true);
        try {
            const res = await reviewOutfit(selected, profile);
            if (res.success) {
                setReviewResult({ score: res.score, review: res.review });
            } else {
                setInlineMessage({text: res.review, type: 'error'});
            }
        } catch (err) {
            setInlineMessage({text: "Failed to review outfit.", type: 'error'});
        } finally {
            setReviewing(false);
        }
    };

    const handleSaveOutfit = async () => {
        setInlineMessage(null);
        if (!profile) return;

        const selected = [manualTop, manualBottom, manualShoes, manualOuterwear, manualAccessory].filter(Boolean) as ClothingItem[];
        if (selected.length === 0) {
            setInlineMessage({text: "Please select at least one item to save.", type: 'error'});
            return;
        }

        try {
            await saveOutfit({
                id: Date.now().toString(),
                items: selected,
                date: new Date().toISOString(),
                notes: stylistNotes || reviewResult?.review || "Custom styling look"
            });
            setInlineMessage({text: "Outfit saved to Closet!", type: 'success'});
        } catch (err) {
            setInlineMessage({text: "Failed to save outfit.", type: 'error'});
        }
    };

    const handleSuggestAlternative = () => {
        setReviewResult(null);
        handleGenerate();
    };

    const handleClearNotes = (id: string, setter: (val: string) => void) => {
        setter(id);
        setStylistNotes(''); // Clear AI notes when user makes a manual change
        setReviewResult(null);
    };

    const tops = clothes.filter(c => c.category === 'Top' || c.category === 'Dress');
    const bottoms = clothes.filter(c => c.category === 'Bottom');
    const shoes = clothes.filter(c => c.category === 'Shoes');
    const outerwears = clothes.filter(c => c.category === 'Outerwear');
    const accessories = clothes.filter(c => c.category === 'Accessory');

    return (
        <div className="px-4 py-8 md:px-12 md:py-10 max-w-[1600px] mx-auto page-enter pb-24">
            {inlineMessage && (
                <div className={`px-5 py-3 rounded-none text-sm font-bold mb-6 flex items-center gap-2 animate-fade-in bg-white border-2 border-[#0a0f1a] shadow-[3px_3px_0_#0a0f1a] ${
                    inlineMessage.type === 'error' ? 'text-red-600' : 'text-[#FF5A50]'
                }`}>
                    {inlineMessage.type === 'error' ? <AlertCircle size={16} /> : <Sparkles size={16} />}
                    {inlineMessage.text}
                </div>
            )}

            <div className="flex flex-col lg:flex-row min-h-[calc(100vh-160px)] gap-6 bg-transparent">

                {/* Left Area: Style Board Canvas */}
                <div className="flex-1 p-6 md:p-8 flex flex-col gap-6 bg-white border-2 border-[#0a0f1a] shadow-[6px_6px_0_#FF5A50] text-[#0a0f1a] rounded-none">

                    {/* Top Action Bar */}
                    <div className="flex flex-col md:flex-row justify-center items-center gap-3 w-full mb-2">
                        {/* Selector Row (Side-by-side on mobile) */}
                        <div className="flex gap-2 w-full md:w-auto flex-1 md:flex-none">
                            {/* Occasion Selector */}
                            <div className="relative flex-1 md:flex-none">
                                <button
                                    onClick={() => { setIsOccasionOpen(!isOccasionOpen); setIsWeatherOpen(false); }}
                                    className="h-12 px-4 md:px-5 bg-gray-100 border-2 border-[#0a0f1a] rounded-none font-bold text-[#0a0f1a] flex items-center justify-between gap-2 md:gap-3 shadow-[3px_3px_0_#0a0f1a] hover:bg-gray-200 transition-all cursor-pointer w-full md:min-w-[150px]"
                                >
                                    <span className="text-xs md:text-sm truncate">{occasion.split(' ')[0]}</span>
                                    <ChevronDown className="w-4 h-4 text-[#0a0f1a]/70 shrink-0" />
                                </button>
                                {isOccasionOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsOccasionOpen(false)}></div>
                                        <div className="absolute z-50 w-full mt-1 bg-white border-2 border-[#0a0f1a] rounded-none shadow-[4px_4px_0_#FF5A50] overflow-hidden animate-scale-in max-h-60 overflow-y-auto p-1.5 scrollbar-hide">
                                            {["Casual", "Date Night", "Business", "Party", "Activewear", "Lounging", "Formal"].map(opt => (
                                                <div
                                                    key={opt}
                                                    className={`p-2.5 font-bold text-xs cursor-pointer transition-all rounded-none mb-1 last:mb-0 ${occasion.startsWith(opt) ? 'bg-[#FF5A50] text-white border border-[#0a0f1a] shadow-[1.5px_1.5px_0_#0a0f1a]' : 'text-[#0a0f1a]/70 hover:bg-gray-100 hover:text-[#0a0f1a]'}`}
                                                    onClick={() => {
                                                        const mapped = opt === "Casual" ? "Casual Day Out" :
                                                                       opt === "Business" ? "Business Office" :
                                                                       opt === "Party" ? "Party / Club" :
                                                                       opt === "Lounging" ? "Lounging at Home" :
                                                                       opt === "Formal" ? "Formal Event" : opt;
                                                        setOccasion(mapped);
                                                        setIsOccasionOpen(false);
                                                    }}
                                                >
                                                    {opt}
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Weather Selector */}
                            <div className="relative flex-1 md:flex-none">
                                <button
                                    onClick={() => { setIsWeatherOpen(!isWeatherOpen); setIsOccasionOpen(false); }}
                                    className="h-12 px-4 md:px-5 bg-gray-100 border-2 border-[#0a0f1a] rounded-none font-bold text-[#0a0f1a] flex items-center justify-between gap-2 md:gap-3 shadow-[3px_3px_0_#0a0f1a] hover:bg-gray-200 transition-all cursor-pointer w-full md:min-w-[150px]"
                                >
                                    <span className="text-xs md:text-sm truncate">{weather.split(' ')[0]}</span>
                                    <ChevronDown className="w-4 h-4 text-[#0a0f1a]/70 shrink-0" />
                                </button>
                                {isWeatherOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsWeatherOpen(false)}></div>
                                        <div className="absolute z-50 w-full mt-1 bg-white border-2 border-[#0a0f1a] rounded-none shadow-[4px_4px_0_#FF5A50] overflow-hidden animate-scale-in max-h-60 overflow-y-auto p-1.5 scrollbar-hide">
                                            {["Sunny and Mild", "Hot Summer", "Cold Winter", "Rainy / Breezy"].map(opt => (
                                                <div
                                                    key={opt}
                                                    className={`p-2.5 font-bold text-xs cursor-pointer transition-all rounded-none mb-1 last:mb-0 ${weather === opt ? 'bg-[#FF5A50] text-white border border-[#0a0f1a] shadow-[1.5px_1.5px_0_#0a0f1a]' : 'text-[#0a0f1a]/70 hover:bg-gray-100 hover:text-[#0a0f1a]'}`}
                                                    onClick={() => {
                                                        setWeather(opt);
                                                        setIsWeatherOpen(false);
                                                    }}
                                                >
                                                    {opt.split(' ')[0]}
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Action Row (Side-by-side on mobile) */}
                        <div className="flex gap-2 w-full md:w-auto shrink-0 justify-center">
                            {/* Reset button */}
                            <button
                                onClick={() => {
                                    setManualTopId('');
                                    setManualBottomId('');
                                    setManualShoesId('');
                                    setManualOuterwearId('');
                                    setManualAccessoryId('');
                                    setStylistNotes('');
                                    setReviewResult(null);
                                }}
                                className="w-12 h-12 bg-white border-2 border-[#0a0f1a] rounded-none flex items-center justify-center text-[#0a0f1a] hover:bg-gray-105 transition-all cursor-pointer shadow-[3px_3px_0_#0a0f1a] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#0a0f1a] shrink-0"
                                title="Reset Board"
                            >
                                <RefreshCw className="w-4 h-4 shrink-0" />
                            </button>

                            {/* AI Stylist button */}
                            <Button
                                onClick={handleGenerate}
                                disabled={customLoading}
                                variant="default"
                                className="h-12 flex-1 md:flex-none md:px-6"
                            >
                                {customLoading ? (
                                    <Loader2 className="animate-spin w-4 h-4 shrink-0" strokeWidth={2.5} />
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 shrink-0" />
                                        <span className="text-sm">AI Stylist</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Main Style Board Card */}
                    <div className="bg-gray-50 rounded-none border-2 border-[#0a0f1a] p-6 md:p-8 flex-1 flex flex-col min-h-[480px]">

                        {/* Style Board Card Header */}
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="font-mono text-sm font-black tracking-widest text-[#0a0f1a] uppercase">STYLE BOARD</h3>
                                <p className="text-[10px] md:text-xs text-[#0a0f1a]/75 font-bold mt-0.5">Curated for {profile?.name || 'Demo Stylist'}</p>
                            </div>
                            <div className="flex gap-2">
                                {hasSelectedItems && (
                                    <Button
                                        onClick={handleSaveOutfit}
                                        variant="default" size="default" className="px-4 py-2 font-bold text-[10px] md:text-xs flex items-center gap-1.5"
                                    >
                                        <CheckCircle size={12} />
                                        SAVE TO CLOSET
                                    </Button>
                                )}
                                <button
                                    onClick={() => {
                                        setInlineMessage({ text: "Virtual Try-on coming soon!", type: "success" });
                                    }}
                                    className="px-4 py-2 border-2 border-[#FF5A50] text-[#FF5A50] bg-white transition-all font-bold text-[10px] md:text-xs cursor-pointer shadow-[3px_3px_0_#0a0f1a] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#0a0f1a] rounded-none"
                                >
                                    SETUP TRY-ON
                                </button>
                            </div>
                        </div>

                        {/* Canvas Area with Slots in a Triangle */}
                        {customLoading ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-4 gap-4 md:gap-6 animate-pulse">
                                {/* Top Slot Skeleton */}
                                <div className="flex justify-center">
                                    <Skeleton className="w-40 h-40 md:w-48 md:h-48 border-2 border-[#0a0f1a] bg-gray-200" />
                                </div>
                                {/* Bottom Slots Skeleton */}
                                <div className="flex justify-center gap-4 md:gap-6">
                                    <Skeleton className="w-32 h-32 md:w-38 md:h-38 border-2 border-[#0a0f1a] bg-gray-200" />
                                    <Skeleton className="w-32 h-32 md:w-38 md:h-38 border-2 border-[#0a0f1a] bg-gray-200" />
                                </div>
                                {/* Extras Row Skeleton */}
                                <div className="flex justify-center gap-4 border-t border-[#0a0f1a]/15 pt-4 w-full max-w-sm mt-2">
                                    <Skeleton className="w-24 h-24 md:w-28 md:h-28 border-2 border-[#0a0f1a] bg-gray-200" />
                                    <Skeleton className="w-24 h-24 md:w-28 md:h-28 border-2 border-[#0a0f1a] bg-gray-200" />
                                </div>
                                <div className="mt-2 text-center flex items-center justify-center gap-2">
                                    <Sparkles className="w-4 h-4 text-p_teal animate-spin-slow" />
                                    <p className="font-bold text-[#0a0f1a]/70 tracking-tight text-xs uppercase font-mono">AI Stylist Curating Outfit...</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center py-4 gap-4 md:gap-6">
                                {/* Top Slot */}
                                <div className="flex justify-center">
                                    <SlotBox
                                        label="ADD TOP"
                                        item={manualTop}
                                        icon={<Shirt className="w-8 h-8 md:w-10 md:h-10 text-[#0a0f1a]/55" strokeWidth={1.5} />}
                                        isActive={activeTab === 'Top'}
                                        onClick={() => setActiveTab('Top')}
                                        onClear={() => handleClearNotes('', setManualTopId)}
                                        className="w-40 h-40 md:w-48 md:h-48"
                                    />
                                </div>
                                {/* Bottom Slots */}
                                <div className="flex justify-center gap-4 md:gap-6">
                                    <SlotBox
                                        label="BOTTOM"
                                        item={manualBottom}
                                        icon={
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 md:w-8 md:h-8 text-[#0a0f1a]/55">
                                                <path d="M 6 3 L 18 3 L 19.5 9 L 18 22 L 14 22 L 12 12 L 10 22 L 6 22 L 4.5 9 Z" />
                                            </svg>
                                        }
                                        isActive={activeTab === 'Bottom'}
                                        onClick={() => setActiveTab('Bottom')}
                                        onClear={() => handleClearNotes('', setManualBottomId)}
                                        className="w-32 h-32 md:w-38 md:h-38"
                                    />
                                    <SlotBox
                                        label="SHOES"
                                        item={manualShoes}
                                        icon={<Footprints className="w-7 h-7 md:w-8 md:h-8 text-[#0a0f1a]/55" strokeWidth={1.5} />}
                                        isActive={activeTab === 'Shoes'}
                                        onClick={() => setActiveTab('Shoes')}
                                        onClear={() => handleClearNotes('', setManualShoesId)}
                                        className="w-32 h-32 md:w-38 md:h-38"
                                    />
                                </div>

                                {/* Extras Row (Outerwear & Accessories) */}
                                <div className="flex justify-center gap-4 border-t border-[#0a0f1a]/15 pt-4 w-full max-w-sm mt-2">
                                    <SlotBox
                                        label="JACKET"
                                        item={manualOuterwear}
                                        icon={<Layers className="w-5 h-5 md:w-6 md:h-6 text-[#0a0f1a]/55" strokeWidth={1.5} />}
                                        isActive={activeTab === 'Outerwear'}
                                        onClick={() => setActiveTab('Outerwear')}
                                        onClear={() => handleClearNotes('', setManualOuterwearId)}
                                        className="w-24 h-24 md:w-28 md:h-28"
                                    />
                                    <SlotBox
                                        label="ACCESSORY"
                                        item={manualAccessory}
                                        icon={<Watch className="w-5 h-5 md:w-6 md:h-6 text-[#0a0f1a]/55" strokeWidth={1.5} />}
                                        isActive={activeTab === 'Accessory'}
                                        onClick={() => setActiveTab('Accessory')}
                                        onClear={() => handleClearNotes('', setManualAccessoryId)}
                                        className="w-24 h-24 md:w-28 md:h-28"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Critique / Reasoning Area (Light Theme) */}
                    {(stylistNotes || reviewResult) && (
                        <div className="animate-fade-in flex flex-col gap-4">
                            {stylistNotes && !reviewResult && (
                                <div className="bg-white border-2 border-[#0a0f1a] p-6 flex flex-col shadow-[4px_4px_0_#FF5A50] rounded-none text-[#0a0f1a]">
                                    <div className="flex items-center gap-2 mb-3 text-[#FF5A50]">
                                        <Quote className="w-5 h-5" />
                                        <h4 className="font-mono font-bold uppercase tracking-widest text-xs">Stylist Notes</h4>
                                    </div>
                                    <p className="text-sm text-[#0a0f1a] leading-relaxed font-medium">
                                        {stylistNotes}
                                    </p>
                                </div>
                            )}

                            {reviewResult && (
                                <div className="bg-white border-2 border-[#0a0f1a] p-6 flex flex-col shadow-[4px_4px_0_#8B5CF6] rounded-none text-[#0a0f1a]">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2 text-[#8B5CF6]">
                                            <CheckCircle className="w-5 h-5" />
                                            <h4 className="font-mono font-bold uppercase tracking-widest text-xs">Fashion Critique</h4>
                                        </div>
                                        <div className="bg-purple-100 text-[#8B5CF6] font-mono font-black px-3 py-1 text-xs border-2 border-[#0a0f1a] rounded-none shadow-[1.5px_1.5px_0_#0a0f1a]">
                                            {reviewResult.score}/10
                                        </div>
                                    </div>
                                    <p className="text-sm text-[#0a0f1a] leading-relaxed font-medium mb-4">
                                        {reviewResult.review}
                                    </p>

                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleSuggestAlternative}
                                            className="px-5 py-2.5 bg-[#FF5A50] text-white font-bold hover:bg-[#E04B42] transition-colors text-xs flex items-center gap-2 cursor-pointer shadow-[3px_3px_0_#0a0f1a] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#0a0f1a] rounded-none border-2 border-[#0a0f1a]"
                                        >
                                            <Lightbulb className="w-3.5 h-3.5" /> Suggest Alternative
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Area: Wardrobe Sidebar */}
                <div className="w-full lg:w-[380px] bg-white border-2 border-[#0a0f1a] p-6 flex flex-col shrink-0 text-[#0a0f1a] shadow-[6px_6px_0_#FF5A50] lg:shadow-none rounded-none">

                    {/* Sidebar Header */}
                    <div className="flex items-center gap-3 pb-6 border-b border-[#0a0f1a] mb-6 shrink-0">
                        <div className="w-1.5 h-6 bg-p_red"></div>
                        <h2 className="font-black text-xl text-[#0a0f1a] uppercase tracking-wider font-mono">WARDROBE</h2>
                    </div>

                    {/* Wardrobe Items Scrollable List */}
                    <div className="flex-1 overflow-y-auto pr-1 space-y-6 scrollbar-hide">
                        {/* Tops Section */}
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="font-mono text-xs font-bold tracking-widest text-[#0a0f1a]/70 uppercase">TOPS & DRESSES</h4>
                                <span className="w-5 h-5 bg-gray-100 text-[#0a0f1a] font-mono font-bold text-[10px] flex items-center justify-center border border-[#0a0f1a] rounded-none shadow-[1px_1px_0_#0a0f1a]">{tops.length}</span>
                            </div>
                            {tops.length === 0 ? (
                                <div className="border-2 border-dashed border-[#0a0f1a]/30 p-6 text-center text-xs text-[#0a0f1a]/60 bg-gray-50 rounded-none font-mono font-bold">
                                    No tops found
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-2 animate-scale-in">
                                    {tops.map(item => (
                                        <div
                                            key={item.id}
                                            onClick={() => handleClearNotes(item.id === manualTopId ? '' : item.id, setManualTopId)}
                                            className={`group aspect-square border-2 cursor-pointer transition-all overflow-hidden bg-gray-50 flex items-center justify-center p-2 rounded-none ${item.id === manualTopId ? 'border-[#FF5A50] bg-red-50/50 shadow-[2px_2px_0_#0a0f1a]' : 'border-[#0a0f1a]/25 hover:border-[#0a0f1a] hover:bg-gray-100 shadow-[1px_1px_0_#0a0f1a]'}`}
                                            title={`${item.color} ${item.category}`}
                                        >
                                            <img src={item.image} className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110" alt={item.description} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Bottoms Section */}
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="font-mono text-xs font-bold tracking-widest text-[#0a0f1a]/70 uppercase">BOTTOMS</h4>
                                <span className="w-5 h-5 bg-gray-100 text-[#0a0f1a] font-mono font-bold text-[10px] flex items-center justify-center border border-[#0a0f1a] rounded-none shadow-[1px_1px_0_#0a0f1a]">{bottoms.length}</span>
                            </div>
                            {bottoms.length === 0 ? (
                                <div className="border-2 border-dashed border-[#0a0f1a]/30 p-6 text-center text-xs text-[#0a0f1a]/60 bg-gray-50 rounded-none font-mono font-bold">
                                    No bottoms found
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-2 animate-scale-in">
                                    {bottoms.map(item => (
                                        <div
                                            key={item.id}
                                            onClick={() => handleClearNotes(item.id === manualBottomId ? '' : item.id, setManualBottomId)}
                                            className={`group aspect-square border-2 cursor-pointer transition-all overflow-hidden bg-gray-50 flex items-center justify-center p-2 rounded-none ${item.id === manualBottomId ? 'border-[#FF5A50] bg-red-50/50 shadow-[2px_2px_0_#0a0f1a]' : 'border-[#0a0f1a]/25 hover:border-[#0a0f1a] hover:bg-gray-100 shadow-[1px_1px_0_#0a0f1a]'}`}
                                            title={`${item.color} ${item.category}`}
                                        >
                                            <img src={item.image} className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110" alt={item.description} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Shoes Section */}
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="font-mono text-xs font-bold tracking-widest text-[#0a0f1a]/70 uppercase">SHOES</h4>
                                <span className="w-5 h-5 bg-gray-100 text-[#0a0f1a] font-mono font-bold text-[10px] flex items-center justify-center border border-[#0a0f1a] rounded-none shadow-[1px_1px_0_#0a0f1a]">{shoes.length}</span>
                            </div>
                            {shoes.length === 0 ? (
                                <div className="border-2 border-dashed border-[#0a0f1a]/30 p-6 text-center text-xs text-[#0a0f1a]/60 bg-gray-50 rounded-none font-mono font-bold">
                                    No shoes found
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-2 animate-scale-in">
                                    {shoes.map(item => (
                                        <div
                                            key={item.id}
                                            onClick={() => handleClearNotes(item.id === manualShoesId ? '' : item.id, setManualShoesId)}
                                            className={`group aspect-square border-2 cursor-pointer transition-all overflow-hidden bg-gray-50 flex items-center justify-center p-2 rounded-none ${item.id === manualShoesId ? 'border-[#FF5A50] bg-red-50/50 shadow-[2px_2px_0_#0a0f1a]' : 'border-[#0a0f1a]/25 hover:border-[#0a0f1a] hover:bg-gray-100 shadow-[1px_1px_0_#0a0f1a]'}`}
                                            title={`${item.color} ${item.category}`}
                                        >
                                            <img src={item.image} className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110" alt={item.description} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Outerwear Section */}
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="font-mono text-xs font-bold tracking-widest text-[#0a0f1a]/70 uppercase">OUTERWEAR</h4>
                                <span className="w-5 h-5 bg-gray-100 text-[#0a0f1a] font-mono font-bold text-[10px] flex items-center justify-center border border-[#0a0f1a] rounded-none shadow-[1px_1px_0_#0a0f1a]">{outerwears.length}</span>
                            </div>
                            {outerwears.length === 0 ? (
                                <div className="border-2 border-dashed border-[#0a0f1a]/30 p-6 text-center text-xs text-[#0a0f1a]/60 bg-gray-50 rounded-none font-mono font-bold">
                                    No outerwear found
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-2 animate-scale-in">
                                    {outerwears.map(item => (
                                        <div
                                            key={item.id}
                                            onClick={() => handleClearNotes(item.id === manualOuterwearId ? '' : item.id, setManualOuterwearId)}
                                            className={`group aspect-square border-2 cursor-pointer transition-all overflow-hidden bg-gray-50 flex items-center justify-center p-2 rounded-none ${item.id === manualOuterwearId ? 'border-[#FF5A50] bg-red-50/50 shadow-[2px_2px_0_#0a0f1a]' : 'border-[#0a0f1a]/25 hover:border-[#0a0f1a] hover:bg-gray-100 shadow-[1px_1px_0_#0a0f1a]'}`}
                                            title={`${item.color} ${item.category}`}
                                        >
                                            <img src={item.image} className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110" alt={item.description} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Accessories Section */}
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="font-mono text-xs font-bold tracking-widest text-[#0a0f1a]/70 uppercase">ACCESSORIES</h4>
                                <span className="w-5 h-5 bg-gray-100 text-[#0a0f1a] font-mono font-bold text-[10px] flex items-center justify-center border border-[#0a0f1a] rounded-none shadow-[1px_1px_0_#0a0f1a]">{accessories.length}</span>
                            </div>
                            {accessories.length === 0 ? (
                                <div className="border-2 border-dashed border-[#0a0f1a]/30 p-6 text-center text-xs text-[#0a0f1a]/60 bg-gray-50 rounded-none font-mono font-bold">
                                    No accessories found
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-2 animate-scale-in">
                                    {accessories.map(item => (
                                        <div
                                            key={item.id}
                                            onClick={() => handleClearNotes(item.id === manualAccessoryId ? '' : item.id, setManualAccessoryId)}
                                            className={`group aspect-square border-2 cursor-pointer transition-all overflow-hidden bg-gray-50 flex items-center justify-center p-2 rounded-none ${item.id === manualAccessoryId ? 'border-[#FF5A50] bg-red-50/50 shadow-[2px_2px_0_#0a0f1a]' : 'border-[#0a0f1a]/25 hover:border-[#0a0f1a] hover:bg-gray-100 shadow-[1px_1px_0_#0a0f1a]'}`}
                                            title={`${item.color} ${item.category}`}
                                        >
                                            <img src={item.image} className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110" alt={item.description} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Ask for Review Button at Bottom of Sidebar */}
                    {showReviewButton && (
                        <div className="pt-4 border-t-2 border-[#0a0f1a] mt-6 shrink-0 animate-fade-in">
                            <button
                                onClick={handleReview}
                                disabled={reviewing}
                                className="group w-full py-3.5 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold rounded-none border-2 border-[#0a0f1a] shadow-[4px_4px_0_#0a0f1a] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0_#0a0f1a] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed flex justify-center items-center gap-2 cursor-pointer"
                            >
                                {reviewing ? (
                                    <Loader2 className="animate-spin w-4 h-4" />
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4" />
                                        <span>Ask AI for Review</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default StylistPage;
