import { useEffect } from 'react'
import { useStore } from '../lib/store'
import { BASE_PATH } from '../lib/config'

const CASING_LAYERS = [
  'roads_minor_service_casing',
  'roads_minor_casing',
  'roads_link_casing',
  'roads_major_casing_late',
  'roads_highway_casing_late',
  'roads_major_casing_early',
  'roads_highway_casing_early',
  'roads_bridges_other_casing',
  'roads_bridges_link_casing',
  'roads_bridges_minor_casing',
  'roads_bridges_major_casing',
  'roads_bridges_highway_casing',
  'roads_tunnels_other_casing',
  'roads_tunnels_minor_casing',
  'roads_tunnels_link_casing',
  'roads_tunnels_major_casing',
  'roads_tunnels_highway_casing',
]

const SatelliteLayer = () => {
  const map = useStore((state) => state.map)
  const satellite = useStore((state) => state.satellite)

  useEffect(() => {
    if (!map) return

    const sourceId = 'satellite'
    const layerId = 'satellite'

    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: 'raster',
        tiles: [`${BASE_PATH}/api/map/tiles/{z}/{x}/{y}`],
        tileSize: 512,
        attribution: `&copy; ${new Date().getFullYear()} HERE Technologies`,
      })
    }

    if (!map.getLayer(layerId)) {
      const firstLayerId = map.getStyle().layers?.[0]?.id
      map.addLayer(
        {
          id: layerId,
          type: 'raster',
          source: sourceId,
          paint: {
            'raster-saturation': -1,
            'raster-contrast': -0.5,
            'raster-opacity': 0.5,
          },
          layout: {
            visibility: 'none',
          },
        },
        firstLayerId,
      )
    }
  }, [map])

  useEffect(() => {
    if (!map) return

    if (map.getLayer('satellite')) {
      map.setLayoutProperty(
        'satellite',
        'visibility',
        satellite ? 'visible' : 'none',
      )
    }

    if (map.getLayer('water')) {
      map.setLayoutProperty(
        'water',
        'visibility',
        satellite ? 'none' : 'visible',
      )
    }

    CASING_LAYERS.forEach((layerId) => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(
          layerId,
          'visibility',
          satellite ? 'none' : 'visible',
        )
      }
    })
  }, [satellite, map])

  return null
}

export default SatelliteLayer
