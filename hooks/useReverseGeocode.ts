import { useCallback } from 'react'
import { useStore } from '@/lib/store'

export const useReverseGeocode = () => {
  const setReverseGeocodeLoading = useStore(
    (state) => state.setReverseGeocodeLoading,
  )

  const fetchAddress = useCallback(
    async (lat: number, lng: number) => {
      setReverseGeocodeLoading(true)
      try {
        const response = await fetch(
          `/api/geocode/reverse?lat=${lat}&lng=${lng}`,
        )
        if (response.ok) {
          const location = await response.json()
          return location
        }
      } catch (error) {
        console.error('Error fetching location details:', error)
      } finally {
        setReverseGeocodeLoading(false)
      }
      return null
    },
    [setReverseGeocodeLoading],
  )

  return { fetchAddress }
}
