import axios from 'axios';
import { logger } from '../utils/logger';

const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com/v1/forecast';

export interface WeatherForecast {
  date: string;
  temperature_max: number;
  temperature_min: number;
  precipitation_probability: number;
  weather_code: number;
  weather_description: string;
}

export interface LocationWeather {
  latitude: number;
  longitude: number;
  timezone: string;
  forecasts: WeatherForecast[];
}

/**
 * Weather code descriptions from Open Meteo
 * https://open-meteo.com/en/docs
 */
function getWeatherDescription(code: number): string {
  const descriptions: { [key: number]: string } = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail'
  };

  return descriptions[code] || 'Unknown';
}

/**
 * Weather Service using Open Meteo API
 */
export class WeatherService {
  /**
   * Fetch weather forecast for a location (race circuit)
   * @param latitude Circuit latitude
   * @param longitude Circuit longitude
   * @param startDate Start date for forecast (ISO format: YYYY-MM-DD)
   * @param days Number of days to forecast (max 16)
   */
  async getWeatherForecast(
    latitude: number,
    longitude: number,
    startDate: string,
    days: number = 3
  ): Promise<LocationWeather | null> {
    try {
      // Build the API request
      const params = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        daily: [
          'temperature_2m_max',
          'temperature_2m_min',
          'precipitation_probability_max',
          'weather_code'
        ].join(','),
        timezone: 'auto',
        start_date: startDate,
        // Calculate end date (startDate + days - 1)
        end_date: this.addDaysToDate(startDate, days - 1)
      });

      const url = `${OPEN_METEO_BASE_URL}?${params.toString()}`;
      logger.log(`Fetching weather from Open Meteo: ${url}`);

      const response = await axios.get(url);
      const data = response.data;

      if (!data.daily) {
        logger.error('No daily forecast data returned from Open Meteo');
        return null;
      }

      // Transform the response into our format
      const forecasts: WeatherForecast[] = data.daily.time.map((date: string, index: number) => ({
        date,
        temperature_max: data.daily.temperature_2m_max[index],
        temperature_min: data.daily.temperature_2m_min[index],
        precipitation_probability: data.daily.precipitation_probability_max[index] || 0,
        weather_code: data.daily.weather_code[index],
        weather_description: getWeatherDescription(data.daily.weather_code[index])
      }));

      return {
        latitude: data.latitude,
        longitude: data.longitude,
        timezone: data.timezone,
        forecasts
      };
    } catch (error) {
      logger.error('Error fetching weather forecast:', error);
      return null;
    }
  }

  /**
   * Get weather forecast for Friday, Saturday, and Sunday of a race weekend
   * @param latitude Circuit latitude
   * @param longitude Circuit longitude
   * @param fridayDate Friday date of the race weekend (ISO format: YYYY-MM-DD)
   */
  async getRaceWeekendForecast(
    latitude: number,
    longitude: number,
    fridayDate: string
  ): Promise<{
    friday: WeatherForecast | null;
    saturday: WeatherForecast | null;
    sunday: WeatherForecast | null;
  }> {
    const weather = await this.getWeatherForecast(latitude, longitude, fridayDate, 3);

    if (!weather || weather.forecasts.length < 3) {
      return {
        friday: null,
        saturday: null,
        sunday: null
      };
    }

    return {
      friday: weather.forecasts[0],
      saturday: weather.forecasts[1],
      sunday: weather.forecasts[2]
    };
  }

  /**
   * Helper to add days to a date string
   */
  private addDaysToDate(dateStr: string, days: number): string {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }

  /**
   * Batch fetch weather for multiple races
   * This allows us to fetch weather for all upcoming races at once
   * to reduce API calls when sending emails to all users
   */
  async batchFetchRaceWeatherForecasts(
    races: Array<{ latitude: number; longitude: number; fridayDate: string; raceId: string }>
  ): Promise<Map<string, { friday: WeatherForecast | null; saturday: WeatherForecast | null; sunday: WeatherForecast | null }>> {
    const weatherMap = new Map();

    // Fetch weather for all races (with slight delay to avoid rate limiting)
    for (const race of races) {
      const weather = await this.getRaceWeekendForecast(
        race.latitude,
        race.longitude,
        race.fridayDate
      );

      weatherMap.set(race.raceId, weather);

      // Small delay to avoid hitting rate limits (Open Meteo allows ~10,000 requests/day)
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return weatherMap;
  }
}

// Export singleton instance
export const weatherService = new WeatherService();
