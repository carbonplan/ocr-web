import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import { RASTER_ZOOM_THRESHOLD } from '@/lib/config'
import WmsLayers from './wms-layers'
import ZarrLayer from './zarr-layer'

const RasterLayer = () => {
  const map = useStore((state) => state.map)
  const [isAboveThreshold, setIsAboveThreshold] = useState<boolean | undefined>(
    undefined,
  )

  useEffect(() => {
    if (!map) return

    const handleZoom = () => {
      const zoom = map.getZoom()
      const aboveThreshold = zoom >= RASTER_ZOOM_THRESHOLD
      if (
        isAboveThreshold === undefined ||
        aboveThreshold !== isAboveThreshold
      ) {
        setIsAboveThreshold(aboveThreshold)
      }
    }

    handleZoom()
    map.on('zoom', handleZoom)
    return () => {
      map.off('zoom', handleZoom)
    }
  }, [map, isAboveThreshold])

  return (
    <>
      {isAboveThreshold === false && <ZarrLayer />}
      {isAboveThreshold && <WmsLayers />}
    </>
  )
}

export default RasterLayer
