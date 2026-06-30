const STORAGE_KEY = 'geoboard-location'

export const saveLocation = (location: { latitude: number; longitude: number; city: string; country: string; timezone: string }) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(location))
}

export const loadLocation = () => {
  const data = localStorage.getItem(STORAGE_KEY)

  if (!data) return null

  try {
    return JSON.parse(data)
  } catch {
    return null
  }
}

export const clearLocation = () => {
  localStorage.removeItem(STORAGE_KEY)
}
