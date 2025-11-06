import { useEffect, useState, useMemo } from 'react'
import { useStore } from '@/lib/store'
import { RASTER_ZOOM_THRESHOLD } from '@/lib/config'
import WmsLayers from './wms-layers'
import ZarrLayer from './zarr-layer'

const RasterLayer = () => {
  const map = useStore((state) => state.map)
  const riskRaster = useStore((state) => state.riskRaster)
  const [isAboveThreshold, setIsAboveThreshold] = useState<boolean | undefined>(
    undefined,
  )

  const shouldShowZarr = useMemo(() => {
    if (isAboveThreshold === undefined) return false
    return riskRaster && !isAboveThreshold
  }, [riskRaster, isAboveThreshold])

  const shouldShowWms = useMemo(() => {
    if (isAboveThreshold === undefined) return false
    return riskRaster && isAboveThreshold
  }, [riskRaster, isAboveThreshold])

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

  if (!riskRaster) {
    return null
  }

  return (
    <>
      {shouldShowZarr && <ZarrLayer />}
      {shouldShowWms && <WmsLayers />}
    </>
  )
}

export default RasterLayer
