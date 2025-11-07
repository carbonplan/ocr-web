import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import { RASTER_ZOOM_THRESHOLD } from '@/lib/config'
import WmsLayers from './wms-layers'
import ZarrLayer from './zarr-layer'

const RasterLayer = () => {
  const map = useStore((state) => state.map)
  const [activeLayer, setActiveLayer] = useState<'zarr' | 'png' | null>(null)

  useEffect(() => {
    if (!map) return

    const handleZoom = () => {
      const zoom = map.getZoom()
      setActiveLayer(zoom >= RASTER_ZOOM_THRESHOLD ? 'png' : 'zarr')
    }

    handleZoom()
    map.on('zoom', handleZoom)
    return () => {
      map.off('zoom', handleZoom)
    }
  }, [map])

  return (
    <>
      {activeLayer === 'zarr' && <ZarrLayer />}
      {activeLayer === 'png' && <WmsLayers />}
    </>
  )
}

export default RasterLayer
