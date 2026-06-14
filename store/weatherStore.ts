import { create } from 'zustand';
import { ForecastDay, WeatherData } from '../context/WardrobeContext';

interface WeatherState {
  weather: WeatherData | null;
  loadingWeather: boolean;
  weatherError: string | null;
  setWeather: (weather: WeatherData | null) => void;
  setLoadingWeather: (loading: boolean) => void;
  setWeatherError: (error: string | null) => void;
  fetchWeather: (latitude: number, longitude: number, isFallback?: boolean) => Promise<void>;
}

// Weather Utilities
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

export const useWeatherStore = create<WeatherState>((set) => ({
  weather: null,
  loadingWeather: true,
  weatherError: null,

  setWeather: (weather) => set({ weather }),
  setLoadingWeather: (loadingWeather) => set({ loadingWeather }),
  setWeatherError: (weatherError) => set({ weatherError }),

  fetchWeather: async (latitude, longitude, isFallback = false) => {
    try {
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,is_day&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`
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
          // Ignore
        }
      }

      const current = weatherData.current;
      const daily = weatherData.daily;

      const condition = getWeatherLabel(current.weather_code);
      const advice = getStyleAdvice(current.temperature_2m, current.weather_code);

      const forecast: ForecastDay[] = [];
      if (daily && daily.time) {
        for (let i = 0; i < Math.min(3, daily.time.length); i++) {
          const dateStr = daily.time[i];
          const dayName = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' });
          forecast.push({
            day: i === 0 ? "Today" : dayName,
            tempMin: Math.round(daily.temperature_2m_min[i]),
            tempMax: Math.round(daily.temperature_2m_max[i]),
            code: daily.weather_code[i]
          });
        }
      }

      set({
        weather: {
          temp: Math.round(current.temperature_2m),
          humidity: current.relative_humidity_2m,
          code: current.weather_code,
          isDay: current.is_day === 1,
          condition: condition,
          location: locationName,
          advice: advice,
          forecast: forecast
        },
        weatherError: null
      });
    } catch (err) {
      console.error("Weather error:", err);
      set({ weatherError: "Unable to load weather" });
    } finally {
      set({ loadingWeather: false });
    }
  }
}));
