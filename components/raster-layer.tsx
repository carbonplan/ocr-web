import { useEffect, useState, useMemo } from 'react'
import { useStore } from '@/lib/store'
import { RASTER_ZOOM_THRESHOLD } from '@/lib/config'
import WmsLayers from './wms-layers'
import ZarrLayer from './zarr-layer'

const RasterLayer = () => {
  const map = useStore((state) => state.map)
  const riskRaster = useStore((state) => state.riskRaster)
  const [currentZoom, setCurrentZoom] = useState<number | undefined>(undefined)

  const shouldShowZarr = useMemo(() => {
    if (currentZoom === undefined) return false
    return riskRaster && currentZoom < RASTER_ZOOM_THRESHOLD
  }, [riskRaster, currentZoom])

  const shouldShowWms = useMemo(() => {
    if (currentZoom === undefined) return false
    return riskRaster && currentZoom >= RASTER_ZOOM_THRESHOLD
  }, [riskRaster, currentZoom])

  useEffect(() => {
    if (!map) return

    const handleZoom = () => {
      const zoom = map.getZoom()
      setCurrentZoom(zoom)
    }

    handleZoom()
    map.on('zoom', handleZoom)
    return () => {
      map.off('zoom', handleZoom)
    }
  }, [map])

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

