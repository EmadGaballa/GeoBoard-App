// ======================================================
// GEOBOARD — LOCATION SERVICE
// Centralized backend location intelligence
// Supports: GPS, IP-based, manual city input, map-based pin
// ======================================================

import prisma from '../common/prisma.js'
import { NotFoundError } from '../common/errors.js'
import { getCache, CacheService } from '../cache/index.js'
import { config } from '../config/index.js'
import type { NormalizedLocation, LocationDTO, SavedLocationDTO } from '../types/index.js'

export class LocationService {
  // ── Normalize any location input ─────────────────────

  async normalize(location: {
    latitude?: number
    longitude?: number
    city?: string
    country?: string
    source: 'gps' | 'ip' | 'manual' | 'map'
  }): Promise<NormalizedLocation> {
    // If we have lat/lng but no city, reverse geocode
    if (location.latitude !== undefined && location.longitude !== undefined && !location.city) {
      return this.reverseGeocode(location.latitude, location.longitude, location.source)
    }

    // If we have city but no lat/lng, geocode it
    if (location.city && location.latitude === undefined) {
      return this.geocode(location.city, location.country)
    }

    // If IP-based, get from IP
    if (location.source === 'ip' && !location.city) {
      return this.locateByIP()
    }

    // Already have full data
    return {
      city: location.city || 'Unknown',
      country: location.country || 'Unknown',
      latitude: location.latitude ?? 0,
      longitude: location.longitude ?? 0,
      source: location.source,
    }
  }

  // ── Reverse Geocode (lat/lng → city/country) ─────────

  private async reverseGeocode(
    lat: number,
    lng: number,
    source: 'gps' | 'ip' | 'manual' | 'map',
  ): Promise<NormalizedLocation> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        { headers: { 'User-Agent': 'GeoBoard/1.0' } },
      )
      const data = await response.json() as {
        address?: {
          city?: string
          town?: string
          village?: string
          county?: string
          country?: string
        }
      }

      return {
        city: data.address?.city || data.address?.town || data.address?.village || data.address?.county || 'Unknown',
        country: data.address?.country || 'Unknown',
        latitude: lat,
        longitude: lng,
        source,
      }
    } catch {
      return {
        city: 'Unknown',
        country: 'Unknown',
        latitude: lat,
        longitude: lng,
        source,
      }
    }
  }

  // ── Geocode (city → lat/lng) ─────────────────────────

  private async geocode(city: string, country?: string): Promise<NormalizedLocation> {
    try {
      const query = country ? `${city}, ${country}` : city
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
        { headers: { 'User-Agent': 'GeoBoard/1.0' } },
      )
      const data = await response.json() as Array<{ lat: string; lon: string; display_name?: string }>

      if (data.length > 0) {
        const parts = data[0].display_name?.split(',') || []
        return {
          city: parts[0]?.trim() || city,
          country: parts[parts.length - 1]?.trim() || country || 'Unknown',
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
          source: 'manual',
        }
      }

      return {
        city,
        country: country || 'Unknown',
        latitude: 0,
        longitude: 0,
        source: 'manual',
      }
    } catch {
      return {
        city,
        country: country || 'Unknown',
        latitude: 0,
        longitude: 0,
        source: 'manual',
      }
    }
  }

  // ── IP-based Location ────────────────────────────────

  async locateByIP(ip?: string): Promise<NormalizedLocation> {
    try {
      const ipToUse = ip || '8.8.8.8' // fallback
      const response = await fetch(`https://ipapi.co/${ipToUse}/json/`)
      const data = await response.json() as {
        city?: string
        country_name?: string
        latitude?: number
        longitude?: number
      }

      return {
        city: data.city || 'Unknown',
        country: data.country_name || 'Unknown',
        latitude: data.latitude || 0,
        longitude: data.longitude || 0,
        source: 'ip',
      }
    } catch {
      return {
        city: 'Unknown',
        country: 'Unknown',
        latitude: 0,
        longitude: 0,
        source: 'ip',
      }
    }
  }

  // ── Persist Active Location ──────────────────────────

  async updateActiveLocation(
    userId: string,
    location: NormalizedLocation,
  ): Promise<LocationDTO> {
    // Deactivate all existing locations
    await prisma.location.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    })

    // Create new active location
    const saved = await prisma.location.create({
      data: {
        userId,
        city: location.city,
        country: location.country,
        latitude: location.latitude,
        longitude: location.longitude,
        source: location.source,
        isActive: true,
      },
    })

    // Invalidate cache
    const cache = getCache()
    await cache.del(CacheService.locationKey(userId))

    return {
      id: saved.id,
      city: saved.city,
      country: saved.country,
      latitude: saved.latitude,
      longitude: saved.longitude,
      source: saved.source,
      isActive: saved.isActive,
    }
  }

  // ── Get Active Location ─────────────────────────────

  async getActiveLocation(userId: string): Promise<LocationDTO | null> {
    const location = await prisma.location.findFirst({
      where: { userId, isActive: true },
      orderBy: { updatedAt: 'desc' },
    })

    if (!location) return null

    return {
      id: location.id,
      city: location.city,
      country: location.country,
      latitude: location.latitude,
      longitude: location.longitude,
      source: location.source,
      isActive: location.isActive,
    }
  }

  // ── Get Location History ────────────────────────────

  async getLocationHistory(userId: string): Promise<LocationDTO[]> {
    const locations = await prisma.location.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    })

    return locations.map(l => ({
      id: l.id,
      city: l.city,
      country: l.country,
      latitude: l.latitude,
      longitude: l.longitude,
      source: l.source,
      isActive: l.isActive,
    }))
  }

  // ── Save Location for Later ─────────────────────────

  async saveLocation(
    userId: string,
    location: {
      city: string
      country: string
      latitude: number
      longitude: number
      label?: string
    },
  ): Promise<SavedLocationDTO> {
    const saved = await prisma.savedLocation.upsert({
      where: {
        userId_city_country: {
          userId,
          city: location.city,
          country: location.country,
        },
      },
      update: {
        latitude: location.latitude,
        longitude: location.longitude,
        label: location.label,
      },
      create: {
        userId,
        city: location.city,
        country: location.country,
        latitude: location.latitude,
        longitude: location.longitude,
        label: location.label,
      },
    })

    return {
      id: saved.id,
      city: saved.city,
      country: saved.country,
      latitude: saved.latitude,
      longitude: saved.longitude,
      label: saved.label,
    }
  }

  // ── Get Saved Locations ─────────────────────────────

  async getSavedLocations(userId: string): Promise<SavedLocationDTO[]> {
    const locations = await prisma.savedLocation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return locations.map(l => ({
      id: l.id,
      city: l.city,
      country: l.country,
      latitude: l.latitude,
      longitude: l.longitude,
      label: l.label,
    }))
  }

  // ── Delete Saved Location ──────────────────────────

  async deleteSavedLocation(userId: string, locationId: string): Promise<void> {
    const location = await prisma.savedLocation.findFirst({
      where: { id: locationId, userId },
    })

    if (!location) {
      throw new NotFoundError('Saved location')
    }

    await prisma.savedLocation.delete({
      where: { id: locationId },
    })
  }
}

export const locationService = new LocationService()