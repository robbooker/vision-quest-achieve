import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Wind, Droplets, MapPin } from 'lucide-react';

interface WeatherData {
  temp: number;
  feels_like: number;
  humidity: number;
  description: string;
  icon: string;
  wind_speed: number;
  city: string;
}

const getWeatherIcon = (iconCode: string) => {
  // Map OpenWeatherMap icon codes to Lucide icons
  if (iconCode.startsWith('01')) return <Sun className="h-4 w-4 text-yellow-500" />;
  if (iconCode.startsWith('02') || iconCode.startsWith('03') || iconCode.startsWith('04')) 
    return <Cloud className="h-4 w-4 text-muted-foreground" />;
  if (iconCode.startsWith('09') || iconCode.startsWith('10')) 
    return <CloudRain className="h-4 w-4 text-blue-500" />;
  if (iconCode.startsWith('11')) return <CloudLightning className="h-4 w-4 text-yellow-600" />;
  if (iconCode.startsWith('13')) return <CloudSnow className="h-4 w-4 text-blue-200" />;
  return <Cloud className="h-4 w-4 text-muted-foreground" />;
};

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Check for cached weather data (cache for 30 min)
        const cached = localStorage.getItem('weather_cache');
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < 30 * 60 * 1000) {
            setWeather(data);
            setLoading(false);
            return;
          }
        }

        // Get user's location
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
            enableHighAccuracy: false,
          });
        });

        const { latitude, longitude } = position.coords;

        // Use Open-Meteo API (free, no API key needed)
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph`
        );

        if (!response.ok) throw new Error('Failed to fetch weather');

        const data = await response.json();
        
        // Get city name from reverse geocoding
        const geoResponse = await fetch(
          `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&count=1`
        );
        const geoData = await geoResponse.json();
        const cityName = geoData.results?.[0]?.name || 'Your Location';

        // Map weather code to description and icon
        const weatherCode = data.current.weather_code;
        const { description, icon } = getWeatherDescription(weatherCode);

        const weatherData: WeatherData = {
          temp: Math.round(data.current.temperature_2m),
          feels_like: Math.round(data.current.apparent_temperature),
          humidity: data.current.relative_humidity_2m,
          description,
          icon,
          wind_speed: Math.round(data.current.wind_speed_10m),
          city: cityName,
        };

        // Cache the data
        localStorage.setItem('weather_cache', JSON.stringify({
          data: weatherData,
          timestamp: Date.now(),
        }));

        setWeather(weatherData);
      } catch (err) {
        console.error('Weather fetch error:', err);
        setError('Unable to get weather');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled className="gap-1.5 px-2">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-8" />
      </Button>
    );
  }

  if (error || !weather) {
    return null; // Don't show anything if we can't get weather
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 px-2 text-muted-foreground hover:text-foreground">
          {getWeatherIcon(weather.icon)}
          <span className="font-medium">{weather.temp}°F</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" align="end">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {weather.city}
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-3xl font-semibold">{weather.temp}°</div>
            <div className="text-sm text-muted-foreground">
              <p className="capitalize">{weather.description}</p>
              <p>Feels like {weather.feels_like}°</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Droplets className="h-3.5 w-3.5" />
              <span>{weather.humidity}%</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Wind className="h-3.5 w-3.5" />
              <span>{weather.wind_speed} mph</span>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Map WMO weather codes to descriptions and icons
function getWeatherDescription(code: number): { description: string; icon: string } {
  if (code === 0) return { description: 'Clear sky', icon: '01d' };
  if (code === 1) return { description: 'Mainly clear', icon: '01d' };
  if (code === 2) return { description: 'Partly cloudy', icon: '02d' };
  if (code === 3) return { description: 'Overcast', icon: '04d' };
  if (code >= 45 && code <= 48) return { description: 'Foggy', icon: '50d' };
  if (code >= 51 && code <= 55) return { description: 'Drizzle', icon: '09d' };
  if (code >= 56 && code <= 57) return { description: 'Freezing drizzle', icon: '09d' };
  if (code >= 61 && code <= 65) return { description: 'Rain', icon: '10d' };
  if (code >= 66 && code <= 67) return { description: 'Freezing rain', icon: '10d' };
  if (code >= 71 && code <= 77) return { description: 'Snow', icon: '13d' };
  if (code >= 80 && code <= 82) return { description: 'Rain showers', icon: '09d' };
  if (code >= 85 && code <= 86) return { description: 'Snow showers', icon: '13d' };
  if (code >= 95) return { description: 'Thunderstorm', icon: '11d' };
  return { description: 'Unknown', icon: '03d' };
}
