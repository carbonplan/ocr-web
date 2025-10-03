import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Marker } from 'maplibre-gl'
import { Box, Flex } from 'theme-ui'
//@ts-expect-error - carbonplan components types not available
import { Badge } from '@carbonplan/components'
import { useStore } from '@/lib/store'
import { formatAddress } from '@/lib/address-utils'
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
  console.log(selectedBuilding)

  const markerPoint = useMemo(() => {
    if (selectedBuilding && selectedBuilding.geometry) {
      return calculateTopMiddlePosition(selectedBuilding.geometry)
    }
    return null
  }, [selectedBuilding])

  const addressString = useMemo(() => {
    if (selectedLocation) {
      return formatAddress(selectedLocation.address, true)
    }
    return null
  }, [selectedLocation])

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
      offset: [0, -2],
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
  }, [map, selectedLocation, selectedBuilding, markerPoint])

  if (
    !selectedBuilding ||
    !selectedLocation ||
    !markerPoint ||
    !addressString ||
    !container
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
      <Badge>{addressString}</Badge>
      <Box
        sx={{
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: `8px solid`,
          borderTopColor: 'muted',
        }}
      />
    </Flex>,
    container,
  )
}

export default SelectionMarker
