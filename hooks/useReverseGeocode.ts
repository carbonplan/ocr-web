import { useCallback, useRef } from 'react'
import { useStore } from '@/lib/store'
import { BASE_PATH } from '@/lib/config'

export const useReverseGeocode = () => {
  const setReverseGeocodeLoading = useStore(
    (state) => state.setReverseGeocodeLoading,
  )
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchAddress = useCallback(
    async (lat: number, lng: number) => {
      abortControllerRef.current?.abort()
      const controller = new AbortController()
      abortControllerRef.current = controller

      setReverseGeocodeLoading(true)
      try {
        const response = await fetch(
          `${BASE_PATH}/api/geocode/reverse?lat=${lat}&lng=${lng}`,
          { signal: controller.signal },
        )
        if (response.ok) {
          const location = await response.json()
          return location
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return null
        }
        console.error('Error fetching location details:', error)
      } finally {
        if (abortControllerRef.current === controller) {
          setReverseGeocodeLoading(false)
        }
      }
      return null
    },
    [setReverseGeocodeLoading],
  )

  return { fetchAddress }
}
