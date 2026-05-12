/**
 * VWorld Geocoder: 도로명/지번 주소 → 위경도 좌표 (EPSG:4326).
 * 도로명 시도 후 실패하면 지번으로 폴백.
 */

import { getVworldDomain, vworldFetch } from './client'

const VWORLD_BASE = 'https://api.vworld.kr/req/address'

export interface GeocodeResult {
  /** 경도 longitude */
  x: number
  /** 위도 latitude */
  y: number
  refinedAddress?: string
}

interface GeocodeApiResponse {
  response?: {
    status?: string
    result?: {
      point?: { x: string | number; y: string | number }
    }
    refined?: { text?: string }
  }
}

async function geocodeOnce(
  address: string,
  type: 'ROAD' | 'PARCEL',
): Promise<GeocodeResult | null> {
  const apiKey = process.env.VWORLD_API_KEY
  if (!apiKey) {
    console.error('[vworld] VWORLD_API_KEY not set')
    return null
  }

  const url = new URL(VWORLD_BASE)
  url.searchParams.set('service', 'address')
  url.searchParams.set('request', 'getCoord')
  url.searchParams.set('version', '2.0')
  url.searchParams.set('crs', 'EPSG:4326')
  url.searchParams.set('type', type)
  url.searchParams.set('address', address)
  url.searchParams.set('format', 'json')
  url.searchParams.set('key', apiKey)
  url.searchParams.set('domain', getVworldDomain())

  const data = (await vworldFetch(url)) as GeocodeApiResponse | null
  if (!data?.response || data.response.status !== 'OK') return null

  const point = data.response.result?.point
  if (!point) return null

  const x = Number(point.x)
  const y = Number(point.y)
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null

  return {
    x,
    y,
    refinedAddress: data.response.refined?.text,
  }
}

/**
 * 주소 → 좌표.
 * 도로명 우선, 실패 시 지번으로 자동 폴백.
 */
export async function geocodeAddress(
  address: string,
): Promise<GeocodeResult | null> {
  const trimmed = address.trim()
  if (!trimmed) return null

  const roadResult = await geocodeOnce(trimmed, 'ROAD')
  if (roadResult) return roadResult

  return geocodeOnce(trimmed, 'PARCEL')
}
