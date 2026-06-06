
import React, { useEffect, useState, useMemo } from 'react';
import { useWardrobe } from '../context/WardrobeContext';
import { CloudSun, Shirt, Sparkles, ArrowRight, Layers, Plus, Thermometer, MapPin, CloudRain, CloudSnow, Sun, Cloud, CloudFog, Loader2, RefreshCw, CloudOff, Bookmark, Wand2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ClothingCategory } from '../types';
import MagicBentoCard from '../components/MagicBentoCard';

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
  const { profile, clothes, savedOutfits } = useWardrobe();
  const [greeting, setGreeting] = useState('Hello');
  
  // Weather State
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  // Fetch Weather
  const fetchWeather = async (latitude: number, longitude: number, isFallback = false) => {
      try {
          const weatherRes = await fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,is_day`
          );
          if (!weatherRes.ok) throw new Error("Weather fetch failed");
          const weatherData = await weatherRes.json();
          
          let locationName = "New York, US";
          if (!isFallback) {
              try {
                  const geoRes = await fetch(
                      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
                  );
                  const geoData = await geoRes.json();
                  locationName = `${geoData.city || geoData.locality || 'Local'}, ${geoData.countryCode || ''}`;
              } catch (e) {
                  // Ignore reverse geocoding errors, use fallback name
              }
          }

          const current = weatherData.current;
          const condition = getWeatherLabel(current.weather_code);
          const advice = getStyleAdvice(current.temperature_2m, current.weather_code);

          setWeather({
              temp: Math.round(current.temperature_2m),
              humidity: current.relative_humidity_2m,
              code: current.weather_code,
              isDay: current.is_day === 1,
              condition: condition,
              location: locationName,
              advice: advice
          });
          setWeatherError(null);
      } catch (err) {
          console.error("Weather error:", err);
          setWeatherError("Unable to load weather");
      } finally {
          setLoadingWeather(false);
      }
  };

  useEffect(() => {
    const defaultLat = 40.7128;
    const defaultLon = -74.0060;

    if (!navigator.geolocation) {
        fetchWeather(defaultLat, defaultLon, true);
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            fetchWeather(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
            console.warn("Geo error, using fallback:", error);
            fetchWeather(defaultLat, defaultLon, true);
        },
        { timeout: 5000 }
    );
  }, []);

  const suggestionDisplay = useMemo(() => {
      if (savedOutfits.length > 0) {
          const random = savedOutfits[Math.floor(Math.random() * savedOutfits.length)];
          return { items: random.items.slice(0, 4), label: 'From your favorites', id: random.id };
      }

      const tops = clothes.filter(c => c.category === ClothingCategory.TOP || c.category === ClothingCategory.DRESS);
      const bottoms = clothes.filter(c => c.category === ClothingCategory.BOTTOM);
      const shoes = clothes.filter(c => c.category === ClothingCategory.SHOES);

      if (tops.length > 0 && bottoms.length > 0) {
          const randomTop = tops[Math.floor(Math.random() * tops.length)];
          const randomBottom = bottoms[Math.floor(Math.random() * bottoms.length)];
          const randomShoes = shoes.length > 0 ? shoes[Math.floor(Math.random() * shoes.length)] : null;
          
          return { 
              items: [randomTop, randomBottom, randomShoes].filter(Boolean), 
              label: 'Daily Auto-Suggestion',
              id: 'auto'
          };
      }

      return null;
  }, [clothes, savedOutfits]);

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
                                <Loader2 className="animate-spin text-p_teal" size={48} />
                            ) : weatherError ? (
                                <CloudSun size={48} className="text-gray-400 opacity-50" />
                            ) : (
                                <div className="text-center md:text-left flex flex-col md:flex-row items-center gap-3">
                                    <WeatherIcon code={weather!.code} isDay={weather!.isDay} className="text-p_teal" />
                                </div>
                            )}
                            
                            <div>
                                {loadingWeather ? (
                                    <div className="flex flex-col items-center">
                                    <CloudOff size={32} className="text-gray-500 mb-2" />
                                    <span className="text-xl font-bold text-gray-500">Offline</span>
                                    <span className="text-xs text-gray-400 mt-1 uppercase tracking-wider">No weather data</span>
                                </div>
                                ) : weatherError ? (
                                    <span className="text-xl font-bold text-p_teal">Offline</span>
                                ) : (
                                    <span className="text-5xl font-black tracking-tighter transition-all group-hover:tracking-normal text-white">{weather?.temp}°</span>
                                )}
                                
                                <div className="text-lg font-medium text-p_teal ml-1">
                                    {loadingWeather ? 'Loading...' : weather?.condition}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex gap-6 text-sm text-gray-400 font-medium mt-6">
                        {loadingWeather ? (
                             <div className="h-4 w-32 bg-gray-800/50 rounded animate-pulse"></div>
                        ) : weather ? (
                            <>
                                <span className="flex items-center gap-2"><Thermometer size={16}/> Humidity: {weather.humidity}%</span>
                            </>
                        ) : (
                            <span>Enable location for weather</span>
                        )}
                    </div>
                </div>

                <div className="text-right hidden sm:block text-white">
                     {weather && (
                         <>
                            <p className="font-bold text-lg">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</p>
                            <p className="text-gray-400 text-sm mt-1 max-w-[150px] leading-relaxed">
                                <Shirt size={14} className="inline mr-1 text-p_teal" />
                                {weather.advice}
                            </p>
                         </>
                     )}
                      {weatherError && (
                          <button 
                             onClick={() => window.location.reload()} 
                             className="btn-glass-secondary px-3 py-1.5 text-xs rounded-lg transition flex items-center gap-1 ml-auto hover:scale-105 shadow-sm border border-white/10"
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

        {/* Card 4: Outfit of the Day (2x2 - Large Feature) */}
        <MagicBentoCard to="/stylist" className="md:col-span-2 md:row-span-2 glass-panel relative group min-h-[300px] shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">

            <div className="flex justify-between items-start relative z-10">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-p_teal text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider shadow-md">Daily Pick</span>
                    </div>
                    <h3 className="text-2xl font-black text-white leading-tight mt-2">
                         {suggestionDisplay ? suggestionDisplay.label : "Start your collection"}
                    </h3>
                </div>
                <div className="bg-gray-800/50 backdrop-blur-md border border-white/10 p-2 rounded-full text-white shadow-sm group-hover:bg-gray-700 transition-colors duration-300">
                    <ArrowRight size={20} className="transition-transform duration-300 group-hover:translate-x-1" />
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center py-6 relative z-10">
                 {suggestionDisplay ? (
                    <div className="flex -space-x-4">
                        {suggestionDisplay.items.map((item, idx) => (
                            <div key={idx} className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-gray-800 bg-gray-900 shadow-lg overflow-hidden transform transition-transform duration-500 group-hover:scale-105 group-hover:shadow-xl group-hover:translate-y-[-5px]" style={{zIndex: 10-idx, transitionDelay: `${idx * 50}ms`}}>
                                <img src={item?.image} className="w-full h-full object-cover" alt="Clothing Item" />
                            </div>
                        ))}
                    </div>
                 ) : (
                    <div className="text-center text-gray-500">
                        <Shirt size={64} className="mx-auto mb-2 opacity-50 group-hover:scale-110 transition-transform duration-300" />
                        <p>Upload items to unlock</p>
                    </div>
                 )}
            </div>

            <p className="text-xs font-bold text-p_teal uppercase tracking-widest relative z-10 group-hover:text-white transition-colors">
                {suggestionDisplay ? "Tap to view details" : "Tap to upload"}
            </p>
        </MagicBentoCard>

        {/* Card 5: Quick Add (1x2 - Tall) */}
        <MagicBentoCard to="/upload" className="md:row-span-2 glass-panel flex flex-col items-center justify-center text-center gap-6 group min-h-[300px] shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <div className="w-20 h-20 rounded-[2rem] bg-gray-800/50 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:rotate-90 transition-all duration-500">
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
