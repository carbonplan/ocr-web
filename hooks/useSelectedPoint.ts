import { useMemo } from 'react'
import { centerOfMass } from '@turf/turf'
import { useStore } from '@/lib/store'

// The selected building's centroid or the selected map point, as [lng, lat].
// Stable while the coordinates are: a building is set again once its row
// loads, and lookups at the same point shouldn't re-run for that.
export const useSelectedPoint = (): [number, number] | null => {
  const selectedBuilding = useStore((state) => state.selectedBuilding)
  const selectedArea = useStore((state) => state.selectedArea)
  let point: [number, number] | null = null
  if (selectedArea) point = [selectedArea.lng, selectedArea.lat]
  else if (selectedBuilding)
    point = centerOfMass(selectedBuilding).geometry.coordinates as [
      number,
      number,
    ]
  const key = point ? point.join(',') : null
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => point, [key])
}
