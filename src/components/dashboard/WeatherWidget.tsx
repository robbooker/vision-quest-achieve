 import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
 import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Wind, Droplets, MapPin, Navigation } from 'lucide-react';
 import { Input } from '@/components/ui/input';

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
 const [zipCode, setZipCode] = useState('');
 const [isSettingZip, setIsSettingZip] = useState(false);
 const [showZipInput, setShowZipInput] = useState(false);
 const [zipError, setZipError] = useState<string | null>(null);
 const [usingManualLocation, setUsingManualLocation] = useState(false);
 
 // Lookup zip code using free API
 const lookupZipCode = async (zip: string): Promise<{ latitude: number; longitude: number; city: string; state: string }> => {
   const response = await fetch(
     `https://public.opendatasoft.com/api/records/1.0/search/?dataset=us-zip-code-latitude-and-longitude&q=${zip}&rows=1`
   );
   const data = await response.json();
   
   if (data.records?.length > 0) {
     const record = data.records[0].fields;
     return {
       latitude: record.latitude,
       longitude: record.longitude,
       city: record.city,
       state: record.state
     };
   }
   throw new Error('Zip code not found');
 };
 
 // Fetch weather data with given coordinates
 const fetchWeatherData = useCallback(async (latitude: number, longitude: number, cityName: string) => {
   const response = await fetch(
     `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph`
   );
 
   if (!response.ok) throw new Error('Failed to fetch weather');
 
   const data = await response.json();
   
   if (!data.current) {
     throw new Error('Invalid weather data');
   }
 
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
 
   return weatherData;
 }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Check for cached weather data (cache for 30 min)
        const cached = localStorage.getItem('weather_cache');
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < 30 * 60 * 1000) {
            setWeather(data);
           // Check if we're using manual location
           const manualLocation = localStorage.getItem('weather_manual_location');
           setUsingManualLocation(!!manualLocation);
            setLoading(false);
            return;
          }
        }

       // Check for manual location first
       const manualLocation = localStorage.getItem('weather_manual_location');
       if (manualLocation) {
         const { latitude, longitude, city, state } = JSON.parse(manualLocation);
         const weatherData = await fetchWeatherData(latitude, longitude, `${city}, ${state}`);
         setWeather(weatherData);
         setUsingManualLocation(true);
         setError(null);
         setLoading(false);
         return;
       }
 
        // Check if geolocation is available
        if (!navigator.geolocation) {
          throw new Error('Geolocation not supported');
        }

        // Get user's location with better error handling
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 15000,
            enableHighAccuracy: false,
            maximumAge: 300000, // Accept cached position up to 5 min old
          });
        });

        const { latitude, longitude } = position.coords;

        // Get city name from reverse geocoding (don't fail if this doesn't work)
        let cityName = 'Your Location';
        try {
          const geoResponse = await fetch(
            `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&count=1`
          );
          const geoData = await geoResponse.json();
          cityName = geoData.results?.[0]?.name || 'Your Location';
        } catch {
          // Ignore geocoding errors, use default city name
        }

       const weatherData = await fetchWeatherData(latitude, longitude, cityName);
       setWeather(weatherData);
       setUsingManualLocation(false);
        setError(null);
      } catch (err) {
        console.error('Weather fetch error:', err);
        // Check for specific geolocation errors
        if (err instanceof GeolocationPositionError) {
          if (err.code === 1) {
            setError('Location access denied');
          } else if (err.code === 2) {
            setError('Location unavailable');
          } else {
            setError('Location timeout');
          }
        } else {
          setError('Weather unavailable');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
 }, [fetchWeatherData]);
 
 const handleSaveZip = async () => {
   const trimmedZip = zipCode.trim();
   
   // Validate format
   if (!/^\d{5}$/.test(trimmedZip)) {
     setZipError('Enter a valid 5-digit zip code');
     return;
   }
   
   setIsSettingZip(true);
   setZipError(null);
   
   try {
     const location = await lookupZipCode(trimmedZip);
     
     // Save manual location
     localStorage.setItem('weather_manual_location', JSON.stringify({
       zipCode: trimmedZip,
       ...location
     }));
     
     // Clear weather cache to force refresh
     localStorage.removeItem('weather_cache');
     
     // Fetch new weather
     const weatherData = await fetchWeatherData(location.latitude, location.longitude, `${location.city}, ${location.state}`);
     setWeather(weatherData);
     setUsingManualLocation(true);
     setShowZipInput(false);
     setZipCode('');
     setError(null);
   } catch (err) {
     setZipError('Zip code not found');
   } finally {
     setIsSettingZip(false);
   }
 };
 
 const handleUseMyLocation = async () => {
   // Clear manual location
   localStorage.removeItem('weather_manual_location');
   localStorage.removeItem('weather_cache');
   setUsingManualLocation(false);
   setShowZipInput(false);
   setLoading(true);
   setError(null);
   
   try {
     if (!navigator.geolocation) {
       throw new Error('Geolocation not supported');
     }
     
     const position = await new Promise<GeolocationPosition>((resolve, reject) => {
       navigator.geolocation.getCurrentPosition(resolve, reject, {
         timeout: 15000,
         enableHighAccuracy: false,
         maximumAge: 300000,
       });
     });
     
     const { latitude, longitude } = position.coords;
     
     let cityName = 'Your Location';
     try {
       const geoResponse = await fetch(
         `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&count=1`
       );
       const geoData = await geoResponse.json();
       cityName = geoData.results?.[0]?.name || 'Your Location';
     } catch {
       // Ignore
     }
     
     const weatherData = await fetchWeatherData(latitude, longitude, cityName);
     setWeather(weatherData);
   } catch (err) {
     if (err instanceof GeolocationPositionError) {
       if (err.code === 1) setError('Location access denied');
       else if (err.code === 2) setError('Location unavailable');
       else setError('Location timeout');
     } else {
       setError('Weather unavailable');
     }
   } finally {
     setLoading(false);
   }
 };

  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled className="gap-1.5 px-2">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-8" />
      </Button>
    );
  }

  if (error) {
    return (
      <Button variant="ghost" size="sm" className="gap-1.5 px-2 text-muted-foreground" disabled>
        <Cloud className="h-4 w-4" />
        <span className="text-xs">{error}</span>
      </Button>
    );
  }

  if (!weather) {
    return null;
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
           
           <div className="pt-3 border-t space-y-2">
             {showZipInput ? (
               <div className="space-y-2">
                 <div className="flex gap-2">
                   <Input
                     type="text"
                     placeholder="Enter zip code"
                     value={zipCode}
                     onChange={(e) => {
                       setZipCode(e.target.value);
                       setZipError(null);
                     }}
                     maxLength={5}
                     className="h-8 text-sm"
                     onKeyDown={(e) => {
                       if (e.key === 'Enter') handleSaveZip();
                     }}
                   />
                   <Button
                     size="sm"
                     onClick={handleSaveZip}
                     disabled={isSettingZip}
                     className="h-8"
                   >
                     {isSettingZip ? '...' : 'Save'}
                   </Button>
                 </div>
                 {zipError && (
                   <p className="text-xs text-destructive">{zipError}</p>
                 )}
                 <Button
                   variant="ghost"
                   size="sm"
                   className="w-full h-7 text-xs"
                   onClick={() => {
                     setShowZipInput(false);
                     setZipCode('');
                     setZipError(null);
                   }}
                 >
                   Cancel
                 </Button>
               </div>
             ) : (
               <div className="space-y-1">
                 <Button
                   variant="ghost"
                   size="sm"
                   className="w-full h-7 text-xs justify-start"
                   onClick={() => setShowZipInput(true)}
                 >
                   <MapPin className="h-3 w-3 mr-1.5" />
                   Set zip code
                 </Button>
                 {usingManualLocation && (
                   <Button
                     variant="ghost"
                     size="sm"
                     className="w-full h-7 text-xs justify-start text-muted-foreground"
                     onClick={handleUseMyLocation}
                   >
                     <Navigation className="h-3 w-3 mr-1.5" />
                     Use my location
                   </Button>
                 )}
               </div>
             )}
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
