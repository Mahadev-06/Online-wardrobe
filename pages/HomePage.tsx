
import React, { useEffect, useState, useMemo } from 'react';
import { useWardrobe } from '../context/WardrobeContext';
import { CloudSun, Shirt, Sparkles, ArrowRight, Layers, Plus, Thermometer, MapPin, CloudRain, CloudSnow, Sun, Cloud, CloudFog, Loader2, RefreshCw, CloudOff, Bookmark, Wand2, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ClothingCategory, ClothingItem } from '../types';
import MagicBentoCard from '../components/MagicBentoCard';
import { generateOutfitRecommendation } from '../services/ai';
import { Skeleton } from '../components/ui/skeleton';

interface WeatherData {
    temp: number;
    condition: string;
    humidity: number;
    location: string;
    isDay: boolean;
    advice: string;
    code: number;
}

const HomePage: React.FC = () => {
  const { 
    profile, 
    clothes, 
    savedOutfits, 
    weather, 
    loadingWeather, 
    weatherError, 
    recommendation, 
    loadingRec, 
    recError 
  } = useWardrobe();
  const [greeting, setGreeting] = useState('Hello');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  const resolvedRecommendationItems = useMemo(() => {
      if (!recommendation || !recommendation.outfitItemIds || recommendation.outfitItemIds.length === 0) {
          return [];
      }
      return recommendation.outfitItemIds.map(id => clothes.find(c => c.id === id)).filter(Boolean) as ClothingItem[];
  }, [recommendation, clothes]);

  // Helper for Weather Icon
  const WeatherIcon = ({ code, isDay, size = 48, className = "" }: { code: number, isDay: boolean, size?: number, className?: string }) => {
      // WMO Weather interpretation codes (WW)
      if (code === 0 || code === 1) return isDay ? <Sun size={size} className={className} /> : <CloudSun size={size} className={className} />;
      if (code === 2 || code === 3) return <Cloud size={size} className={className} />;
      if (code >= 45 && code <= 48) return <CloudFog size={size} className={className} />;
      if (code >= 51 && code <= 67) return <CloudRain size={size} className={className} />;
      if (code >= 71 && code <= 77) return <CloudSnow size={size} className={className} />;
      if (code >= 80 && code <= 99) return <CloudRain size={size} className={className} />;
      return <CloudSun size={size} className={className} />;
  };

  return (
    <div className="px-6 py-10 md:px-12 md:py-14 pb-8 md:pb-14 max-w-7xl mx-auto page-enter">
      
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">{greeting}, {profile?.name}.</h1>
        <p className="text-gray-400 mt-3 text-lg font-medium opacity-80">Here is your style overview.</p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 auto-rows-[minmax(200px,auto)]">
        
        {/* Card 1: Weather (2x1 on Desktop) */}
        <MagicBentoCard className="md:col-span-2 glass-panel relative overflow-hidden group shadow-lg hover:shadow-2xl transition-all duration-300">
            
            <div className="relative z-10 flex justify-between items-start h-full">
                <div className="flex flex-col justify-between h-full">
                    <div>
                        <h3 className="text-p_teal font-bold tracking-widest text-xs uppercase mb-3 flex items-center gap-2">
                             <MapPin size={12} className="group-hover:bounce" />
                             {loadingWeather ? 'Locating...' : weather?.location || 'Unknown Location'}
                        </h3>
                        <div className="flex items-center gap-4">
                            {loadingWeather ? (
                                <div className="flex items-center space-x-4">
                                    <Skeleton className="h-12 w-12 rounded-full" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 sm:w-[250px] w-[100px]" />
                                        <Skeleton className="h-4 sm:w-[200px] w-[100px]" />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {weatherError ? (
                                        <div className="flex flex-col items-center">
                                            <CloudOff size={32} className="text-gray-500 mb-2" />
                                            <span className="text-xl font-bold text-gray-500">Offline</span>
                                            <span className="text-xs text-gray-400 mt-1 uppercase tracking-wider">No weather data</span>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="text-center md:text-left flex flex-col md:flex-row items-center gap-3">
                                                <WeatherIcon code={weather!.code} isDay={weather!.isDay} className="text-p_teal" />
                                            </div>
                                            <div>
                                                <span className="text-5xl font-black tracking-tighter transition-all group-hover:tracking-normal text-white">{weather?.temp}°</span>
                                                <div className="text-lg font-medium text-p_teal ml-1">
                                                    {weather?.condition}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex gap-6 text-sm text-gray-400 font-medium mt-6">
                        {loadingWeather ? (
                             <Skeleton className="h-4 w-32" />
                        ) : weather ? (
                            <>
                                <span className="flex items-center gap-2"><Thermometer size={16}/> Humidity: {weather.humidity}%</span>
                            </>
                        ) : (
                            <span>Enable location for weather</span>
                        )}
                    </div>
                </div>

                <div className="text-right hidden sm:flex flex-col justify-between h-full items-end text-white max-w-[220px]">
                     {weather && (
                          <>
                             <div className="text-right">
                                <p className="font-bold text-lg leading-tight">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</p>
                                <p className="text-gray-400 text-xs mt-1.5 leading-relaxed">
                                    <Shirt size={12} className="inline mr-1 text-p_teal" />
                                    {weather.advice}
                                </p>
                             </div>
                             
                             {/* 3-day forecast */}
                             {weather.forecast && weather.forecast.length > 0 && (
                                 <div className="flex gap-2 mt-4 border-t border-[#0a0f1a]/10 pt-3 w-full justify-end">
                                     {weather.forecast.map((f, idx) => (
                                         <div key={idx} className="flex flex-col items-center bg-[#0d1325] rounded-xl px-2 py-1 min-w-[52px] border border-[#0a0f1a]/15">
                                             <span className="text-[9px] text-gray-400 font-bold uppercase">{f.day}</span>
                                             <div className="text-p_teal my-0.5">
                                                 <WeatherIcon code={f.code} isDay={true} size={14} />
                                             </div>
                                             <span className="text-[9px] font-black text-white">{f.tempMin}°/{f.tempMax}°</span>
                                         </div>
                                     ))}
                                 </div>
                             )}
                          </>
                      )}
                      {weatherError && (
                          <button 
                             onClick={() => window.location.reload()} 
                             className="btn-glass-secondary px-3 py-1.5 text-xs rounded-[2.5rem] flex items-center gap-1 ml-auto border border-white/10 animate-fade-in"
                          >
                             <RefreshCw size={12} /> Retry
                          </button>
                      )}
                </div>
            </div>
        </MagicBentoCard>

        {/* Card 2: Stats (1x1) */}
        <MagicBentoCard className="glass-panel group shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-6 md:mb-10">
                <Layers size={32} className="text-p_teal transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1" />
                <span className="text-4xl font-black text-white transition-transform duration-300 group-hover:scale-110">{clothes.length}</span>
            </div>
            <div>
                <h3 className="font-bold text-white text-lg">Total Items</h3>
                <p className="text-xs text-gray-400 mt-1">In your digital closet</p>
            </div>
        </MagicBentoCard>

        {/* Card 3: Saved Looks Count (1x1) */}
        <MagicBentoCard to="/closet" state={{ activeTab: 'outfits' }} className="glass-panel group shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
             <div className="flex items-center justify-between mb-6 md:mb-10">
                <Bookmark size={32} className="text-p_teal transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1" />
                <span className="text-4xl font-black text-white transition-transform duration-300 group-hover:scale-110">{savedOutfits.length}</span>
            </div>
            <div>
                <h3 className="font-bold text-white text-lg">Saved Looks</h3>
                <p className="text-xs text-gray-400 mt-1">Curated outfits</p>
            </div>
        </MagicBentoCard>

        {/* Card 4: Outfit Recommendation (2x2 - Large Feature) */}
        <MagicBentoCard to="/stylist" className="md:col-span-2 md:row-span-2 glass-panel relative group min-h-[350px] shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-start p-6 md:p-8 gap-4">

            <div className="flex justify-between items-start relative z-10 w-full">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="bg-p_teal text-white text-[10px] font-bold px-2 py-1 rounded-[2rem] uppercase tracking-wider shadow-md">Recommendation</span>
                    </div>
                    <h3 className="text-2xl font-black text-white leading-tight mt-2">
                         {loadingRec ? "Stylist is thinking..." : 
                          resolvedRecommendationItems.length > 0 ? "Today's Curated Look" : "Outfit Not Available"}
                    </h3>
                </div>
            </div>

            {loadingRec ? (
                <div className="flex-1 flex flex-col items-center justify-center py-6 relative z-10 w-full gap-6">
                    <div className="flex -space-x-4">
                        <Skeleton className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-[#0d1325]" />
                        <Skeleton className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-[#0d1325]" />
                        <Skeleton className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-[#0d1325]" />
                    </div>
                    <div className="w-full space-y-2 max-w-sm px-4">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                    </div>
                </div>
            ) : resolvedRecommendationItems.length > 0 ? (
                <>
                    <div className="flex-1 flex items-center justify-center py-4 relative z-10">
                        <div className="flex -space-x-4">
                            {resolvedRecommendationItems.map((item, idx) => (
                                <div key={idx} className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-gray-800 bg-gray-900 shadow-lg overflow-hidden transform transition-transform duration-500 group-hover:scale-105 group-hover:shadow-xl group-hover:translate-y-[-5px]" style={{zIndex: 10-idx, transitionDelay: `${idx * 50}ms`}}>
                                    <img src={item.image} className="w-full h-full object-cover" alt="Recommended Item" />
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {recommendation?.reasoning && (
                        <div className="relative z-10 bg-gray-100 border border-gray-200 rounded-none p-4 mb-2">
                            <p className="text-xs text-gray-800 leading-relaxed italic">
                                "{recommendation.reasoning}"
                            </p>
                        </div>
                    )}
                </>
            ) : (
                <div className="flex-1 flex flex-col justify-center py-6 relative z-10">
                    <div className="text-center text-gray-500">
                        {clothes.length < 2 ? (
                            <>
                                <Shirt size={56} className="mx-auto mb-2 opacity-40 group-hover:scale-110 transition-transform duration-300" />
                                <p className="text-sm">Upload at least 2 items to get recommendations</p>
                            </>
                        ) : (
                            <>
                                <AlertTriangle size={48} className="mx-auto mb-2 text-yellow-600 animate-pulse" />
                                <p className="text-[#0a0f1a] font-bold text-lg mb-2">No suitable clothes for this weather</p>
                                {recommendation?.reasoning ? (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-none p-4 text-left">
                                        <p className="text-xs text-yellow-800 leading-relaxed font-medium">
                                            {recommendation.reasoning}
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-500">Add clothes matching current weather conditions.</p>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </MagicBentoCard>

        {/* Card 5: Quick Add (1x2 - Tall) */}
        <MagicBentoCard to="/upload" className="md:row-span-2 glass-panel flex flex-col items-center justify-center text-center gap-6 group min-h-[300px] shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <div className="w-20 h-20 bg-gray-100 border-2 border-[#0a0f1a] text-[#0a0f1a] flex items-center justify-center shadow-[3px_3px_0_rgba(0,0,0,0.15)] group-hover:scale-110 group-hover:rotate-90 transition-all duration-500 rounded-none">
                <Plus size={40} />
            </div>
            <div>
                <h3 className="text-xl font-black text-white">Add Item</h3>
                <p className="text-sm text-gray-400 mt-2 px-4">Snap a photo to digitize your clothes.</p>
            </div>
        </MagicBentoCard>

        {/* Card 6: Browse Closet (1x1) */}
        <MagicBentoCard to="/closet" className="glass-panel group shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <div className="h-full flex flex-col justify-between">
                <Shirt size={32} className="text-p_teal transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1" />
                <div>
                     <h3 className="font-bold text-white text-lg">Browse Closet</h3>
                     <p className="text-xs text-gray-400">View full inventory</p>
                </div>
            </div>
        </MagicBentoCard>

        {/* Card 7: AI Stylist (1x1) */}
        <MagicBentoCard to="/stylist" className="glass-panel group shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <div className="h-full flex flex-col justify-between">
                <Wand2 size={32} className="text-p_teal transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1" />
                <div>
                     <h3 className="font-bold text-white text-lg">AI Stylist</h3>
                     <p className="text-xs text-gray-400">Generate new looks</p>
                </div>
            </div>
        </MagicBentoCard>

      </div>
    </div>
  );
};

// Utilities
const getWeatherLabel = (code: number) => {
    if (code === 0) return "Clear Sky";
    if (code === 1 || code === 2 || code === 3) return "Partly Cloudy";
    if (code >= 45 && code <= 48) return "Foggy";
    if (code >= 51 && code <= 55) return "Drizzle";
    if (code >= 56 && code <= 57) return "Freezing Drizzle";
    if (code >= 61 && code <= 65) return "Rainy";
    if (code >= 66 && code <= 67) return "Freezing Rain";
    if (code >= 71 && code <= 77) return "Snow";
    if (code >= 80 && code <= 82) return "Showers";
    if (code >= 95 && code <= 99) return "Thunderstorm";
    return "Unknown";
};

const getStyleAdvice = (temp: number, code: number) => {
    if (code >= 61 && code <= 67) return "Don't forget an umbrella!";
    if (code >= 71) return "Wear thick layers & boots.";
    if (temp < 5) return "Heavy coat recommended.";
    if (temp < 15) return "Perfect for layering.";
    if (temp < 22) return "Light jacket or sweater.";
    if (temp < 28) return "T-shirt weather!";
    return "Stay cool, wear breathable fabrics.";
};

export default HomePage;
