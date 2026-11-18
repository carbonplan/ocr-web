import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Marker } from 'maplibre-gl'
import { Box, Flex } from 'theme-ui'
import { useStore } from '@/lib/store'
import { formatAddress, formatRegionName } from '@/lib/address-utils'
import { Building } from '@/types/location'

const calculateTopMiddlePosition = (
  geometry: Building['geometry'],
): [number, number] | null => {
  if (!geometry) return null
  if (geometry.type !== 'Polygon') return null
  const ring = geometry.coordinates?.[0]
  if (!ring?.length) return null
  let maxLat = -Infinity
  for (const [, lat] of ring) {
    if (lat > maxLat) maxLat = lat
  }
  const tol = 1e-5
  let minLng = Infinity
  let maxLng = -Infinity
  for (const [lng, lat] of ring) {
    if (maxLat - lat <= tol) {
      if (lng < minLng) minLng = lng
      if (lng > maxLng) maxLng = lng
    }
  }
  const middleLng = (minLng + maxLng) / 2
  return [middleLng, maxLat]
}

const SelectionMarker = () => {
  const map = useStore((state) => state.map)
  const selectedLocation = useStore((state) => state.selectedLocation)
  const selectedBuilding = useStore((state) => state.selectedBuilding)
  const selectedArea = useStore((state) => state.selectedArea)
  const reverseGeocodeLoading = useStore((state) => state.reverseGeocodeLoading)

  let point: [number, number] | null = null
  if (selectedBuilding?.geometry) {
    point = calculateTopMiddlePosition(selectedBuilding.geometry)
  } else if (selectedArea) {
    point = [selectedArea.lng, selectedArea.lat]
  }
  // kept while the position is: a building is set again once its row loads
  const pointKey = point ? point.join(',') : null
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const markerPoint = useMemo(() => point, [pointKey])

  const addressString = useMemo(() => {
    if (!selectedLocation) return null
    if (selectedArea) {
      return formatRegionName(selectedLocation.address)
    }
    return formatAddress(selectedLocation.address, {
      abbreviate: true,
      requireStreet: true,
    })
  }, [selectedLocation, selectedArea])

  const containerRef = useRef<HTMLDivElement | null>(null)
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  const markerRef = useRef<Marker | null>(null)

  useEffect(() => {
    if (!map || !selectedLocation || !markerPoint) {
      if (markerRef.current) {
        markerRef.current.remove()
        markerRef.current = null
      }
      containerRef.current = null
      return
    }

    const container = document.createElement('div')
    containerRef.current = container
    setContainer(container)

    markerRef.current = new Marker({
      element: container,
      anchor: 'bottom',
      offset: [0, -3],
    })
      .setLngLat(markerPoint)
      .addTo(map)

    return () => {
      if (markerRef.current) {
        markerRef.current.remove()
        markerRef.current = null
      }
      containerRef.current = null
      setContainer(null)
    }
  }, [map, selectedLocation, markerPoint])

  if (
    (!selectedBuilding && !selectedArea) ||
    !selectedLocation ||
    !markerPoint ||
    !container ||
    reverseGeocodeLoading
  ) {
    return null
  }

  return createPortal(
    <Flex
      sx={{
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Flex
        sx={{
          alignItems: 'center',
          fontFamily: 'mono',
          letterSpacing: 'mono',
          fontSize: 2,
          bg: 'hinted',
          px: 2,
          height: '28px',
          borderRadius: '14px',
          border: `1px solid`,
          borderColor: 'secondary',
        }}
      >
        {addressString ||
          (selectedArea ? 'Selected area' : 'Selected building')}
      </Flex>
      <Box
        sx={{
          width: '10px',
          height: '10px',
          bg: 'hinted',
          transform: 'rotate(45deg)',
          mt: '-5px',
          borderRight: '1px solid',
          borderBottom: '1px solid',
          borderColor: 'secondary',
        }}
      />
    </Flex>,
    container,
  )
}

export default SelectionMarker
