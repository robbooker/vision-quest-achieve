import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Droplets, Wind, ThermometerSun } from 'lucide-react';
import { format, parseISO, eachDayOfInterval, isWithinInterval } from 'date-fns';

interface DayForecast {
  date: string;
  tempMax: number;
  tempMin: number;
  weatherCode: number;
  description: string;
  icon: string;
  precipProbability: number;
  windSpeed: number;
}

interface TripWeatherForecastProps {
  destination: string;
  startDate: string;
  endDate: string;
}

function getWeatherIcon(code: number, className: string = "h-5 w-5") {
  if (code === 0 || code === 1) return <Sun className={`${className} text-yellow-500`} />;
  if (code >= 2 && code <= 3) return <Cloud className={`${className} text-muted-foreground`} />;
  if (code >= 45 && code <= 48) return <Cloud className={`${className} text-muted-foreground`} />;
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return <CloudRain className={`${className} text-blue-500`} />;
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return <CloudSnow className={`${className} text-blue-300`} />;
  if (code >= 95) return <CloudLightning className={`${className} text-yellow-600`} />;
  return <Cloud className={`${className} text-muted-foreground`} />;
}

function getDescription(code: number): string {
  if (code === 0) return 'Clear';
  if (code === 1) return 'Mostly clear';
  if (code === 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code >= 45 && code <= 48) return 'Foggy';
  if (code >= 51 && code <= 55) return 'Drizzle';
  if (code >= 56 && code <= 57) return 'Freezing drizzle';
  if (code >= 61 && code <= 65) return 'Rain';
  if (code >= 66 && code <= 67) return 'Freezing rain';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 80 && code <= 82) return 'Showers';
  if (code >= 85 && code <= 86) return 'Snow showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Unknown';
}

export function TripWeatherForecast({ destination, startDate, endDate }: TripWeatherForecastProps) {
  const [forecasts, setForecasts] = useState<DayForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchForecast = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try geocoding with multiple strategies
        let latitude: number | null = null;
        let longitude: number | null = null;

        // Strategy 1: Open-Meteo geocoding - try city name only (before comma)
        const cityName = destination.split(',')[0].trim();
        
        for (const query of [destination.trim(), cityName]) {
          if (latitude !== null) break;
          try {
            const geoRes = await fetch(
              `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en`
            );
            const geoData = await geoRes.json();
            if (geoData.results?.length) {
              latitude = geoData.results[0].latitude;
              longitude = geoData.results[0].longitude;
            }
          } catch { /* try next */ }
        }

        // Strategy 2: Nominatim fallback (no custom headers to avoid CORS)
        if (latitude === null) {
          try {
            const geoRes = await fetch(
              `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination)}&format=json&limit=1`
            );
            const geoData = await geoRes.json();
            if (geoData?.length) {
              latitude = parseFloat(geoData[0].lat);
              longitude = parseFloat(geoData[0].lon);
            }
          } catch { /* continue */ }
        }

        if (latitude === null || longitude === null) {
          throw new Error('Location not found');
        }

        // Open-Meteo forecast API supports up to 16 days ahead
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max,wind_speed_10m_max&temperature_unit=fahrenheit&wind_speed_unit=mph&forecast_days=16`
        );

        if (!weatherRes.ok) throw new Error('Weather fetch failed');

        const weatherData = await weatherRes.json();
        if (cancelled) return;

        if (!weatherData.daily) throw new Error('No forecast data');

        const tripStart = parseISO(startDate);
        const tripEnd = parseISO(endDate);

        // Filter to only trip dates that fall within the forecast window
        const dailyForecasts: DayForecast[] = [];
        const dates = weatherData.daily.time as string[];

        dates.forEach((dateStr: string, i: number) => {
          const date = parseISO(dateStr);
          if (isWithinInterval(date, { start: tripStart, end: tripEnd })) {
            dailyForecasts.push({
              date: dateStr,
              tempMax: Math.round(weatherData.daily.temperature_2m_max[i]),
              tempMin: Math.round(weatherData.daily.temperature_2m_min[i]),
              weatherCode: weatherData.daily.weather_code[i],
              description: getDescription(weatherData.daily.weather_code[i]),
              icon: '',
              precipProbability: weatherData.daily.precipitation_probability_max?.[i] ?? 0,
              windSpeed: Math.round(weatherData.daily.wind_speed_10m_max?.[i] ?? 0),
            });
          }
        });

        if (dailyForecasts.length === 0) {
          throw new Error('Trip dates are beyond the 16-day forecast window');
        }

        setForecasts(dailyForecasts);
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Unable to load forecast');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchForecast();
    return () => { cancelled = true; };
  }, [destination, startDate, endDate]);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <ThermometerSun className="h-5 w-5 text-primary" />
            <span className="font-semibold">Weather Forecast</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24 w-20 rounded-lg flex-shrink-0" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ThermometerSun className="h-5 w-5" />
            <span className="text-sm">{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (forecasts.length === 0) return null;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <ThermometerSun className="h-5 w-5 text-primary" />
          <span className="font-semibold">Weather Forecast</span>
          <span className="text-xs text-muted-foreground ml-auto">
            {forecasts.length} day{forecasts.length !== 1 ? 's' : ''} available
          </span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
          {forecasts.map((day) => (
            <div
              key={day.date}
              className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-muted/50 min-w-[5rem] flex-shrink-0"
            >
              <span className="text-xs font-medium text-muted-foreground">
                {format(parseISO(day.date), 'EEE')}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {format(parseISO(day.date), 'M/d')}
              </span>
              {getWeatherIcon(day.weatherCode)}
              <div className="text-center">
                <span className="text-sm font-semibold">{day.tempMax}°</span>
                <span className="text-xs text-muted-foreground ml-1">{day.tempMin}°</span>
              </div>
              {day.precipProbability > 0 && (
                <div className="flex items-center gap-0.5 text-blue-500">
                  <Droplets className="h-3 w-3" />
                  <span className="text-[10px]">{day.precipProbability}%</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
