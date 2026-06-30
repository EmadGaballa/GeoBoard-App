import { apiClient } from '../apiClient'
import { WeatherData, ForecastDay, HourlyForecast } from '../types'

const API_BASE = '/api/weather'

// ======================================================
// API SERVICE: WEATHER — via backend proxy
// ======================================================

/**
 * Fetch current weather data and forecast
 */
export const fetchWeatherData = async (
  latitude: number,
  longitude: number
): Promise<WeatherData> => {
  try {
    const response = await apiClient.get<{ success: boolean; data: WeatherData }>(
      `${API_BASE}/current?lat=${latitude}&lng=${longitude}`
    )
    return response.data
  } catch (error) {
    console.error('Error fetching weather:', error)
    return getMockWeatherData()
  }
}

/**
 * Fetch 7-day forecast
 */
export const fetch7DayForecast = async (
  latitude: number,
  longitude: number
): Promise<ForecastDay[]> => {
  try {
    const response = await apiClient.get<{ success: boolean; data: ForecastDay[] }>(
      `${API_BASE}/forecast?lat=${latitude}&lng=${longitude}`
    )
    return response.data
  } catch (error) {
    console.error('Error fetching 7-day forecast:', error)
    return getMock7DayForecast()
  }
}

/**
 * Fetch hourly forecast
 */
export const fetchHourlyForecast = async (
  latitude: number,
  longitude: number,
  hours: number = 24
): Promise<HourlyForecast[]> => {
  try {
    const response = await apiClient.get<{ success: boolean; data: HourlyForecast[] }>(
      `${API_BASE}/hourly?lat=${latitude}&lng=${longitude}&hours=${hours}`
    )
    return response.data
  } catch (error) {
    console.error('Error fetching hourly forecast:', error)
    return getMockHourlyForecast()
  }
}

// ======================================================
// HELPER FUNCTIONS
// ======================================================

export const getWeatherIcon = (condition: string): string => {
  const lowerCondition = condition.toLowerCase()
  if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle')) return '🌧️'
  if (lowerCondition.includes('cloud')) return '☁️'
  if (lowerCondition.includes('clear') || lowerCondition.includes('sunny')) return '☀️'
  if (lowerCondition.includes('snow')) return '❄️'
  if (lowerCondition.includes('storm') || lowerCondition.includes('thunder')) return '⛈️'
  if (lowerCondition.includes('fog')) return '🌫️'
  if (lowerCondition.includes('partly')) return '⛅'
  return '🌤️'
}

const getMockWeatherData = (): WeatherData => ({
  temperature: 22,
  feelsLike: 21,
  condition: 'Partly Cloudy',
  humidity: 65,
  windSpeed: 12,
  pressure: 1013,
  visibility: 10,
  uvIndex: 4,
  sunrise: '06:30',
  sunset: '18:45',
  timezone: 'UTC',
})

const getMock7DayForecast = (): ForecastDay[] => [
  {
    day: 'Monday',
    temp: 22,
    tempMin: 18,
    tempMax: 25,
    condition: 'Sunny',
    icon: '☀️',
    humidity: 50,
    windSpeed: 10,
  },
  {
    day: 'Tuesday',
    temp: 20,
    tempMin: 16,
    tempMax: 24,
    condition: 'Cloudy',
    icon: '☁️',
    humidity: 60,
    windSpeed: 12,
  },
  {
    day: 'Wednesday',
    temp: 18,
    tempMin: 15,
    tempMax: 21,
    condition: 'Rainy',
    icon: '🌧️',
    humidity: 80,
    windSpeed: 15,
  },
  {
    day: 'Thursday',
    temp: 19,
    tempMin: 16,
    tempMax: 22,
    condition: 'Partly Cloudy',
    icon: '⛅',
    humidity: 65,
    windSpeed: 11,
  },
  {
    day: 'Friday',
    temp: 23,
    tempMin: 20,
    tempMax: 26,
    condition: 'Sunny',
    icon: '☀️',
    humidity: 45,
    windSpeed: 8,
  },
  {
    day: 'Saturday',
    temp: 24,
    tempMin: 21,
    tempMax: 27,
    condition: 'Clear',
    icon: '🌟',
    humidity: 40,
    windSpeed: 7,
  },
  {
    day: 'Sunday',
    temp: 21,
    tempMin: 18,
    tempMax: 24,
    condition: 'Cloudy',
    icon: '☁️',
    humidity: 55,
    windSpeed: 9,
  },
]

const getMockHourlyForecast = (): HourlyForecast[] => {
  const now = new Date()
  return Array.from({ length: 24 }, (_, i) => {
    const time = new Date(now.getTime() + i * 3600000)
    return {
      hour: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      temp: 20 + Math.sin(i / 4) * 5,
      condition: ['Clear', 'Cloudy', 'Rainy'][Math.floor(Math.random() * 3)],
      humidity: 50 + Math.random() * 30,
      windSpeed: 8 + Math.random() * 12,
    }
  })
}