import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useThemeUI, get } from 'theme-ui'
import {
  ExpressionSpecification,
  MapMouseEvent,
  VectorTileSource,
} from 'maplibre-gl'
import { centerOfMass } from '@turf/turf'
import { useStore } from '@/lib/store'
import { useBuildingUtils } from '@/hooks/useBuildingUtils'
import { BUILDING_SELECT_MIN_ZOOM, LAYERS } from '@/lib/config'
import { useColormap } from '@/lib/colormaps'
import { getRiskVariable } from '@/lib/risk-utils'
import { getMapLayer } from '@/lib/hazards'
import { buildingTileUrl } from '@/lib/risk-layers'
import { Building } from '@/types/location'

const Buildings = () => {
  const { theme } = useThemeUI()
  const map = useStore((state) => state.map)
  const clearSelections = useStore((state) => state.clearSelections)
  const timePeriod = useStore((state) => state.timePeriod)
  const futureWindow = useStore((state) => state.futureWindow)
  const colorLimits = useStore((state) => state.colorLimits)
  const riskConfig = useStore((state) => state.riskConfig)
  const buildingsMode = riskConfig.buildingsMode
  // outlines over the raster, as in query mode, while a layer of another
  // quantity is shown: the tiles carry only the risk variables
  const showsOtherQuantity = useStore(
    (state) => !!getMapLayer(state.riskConfig, state.mapLayer)?.variable,
  )
  const outlined = buildingsMode === 'query' || showsOtherQuantity
  const unitScale = riskConfig.unitScale
  const { selectBuilding, selectArea, highlightBuildingAtLocation } =
    useBuildingUtils()
  const riskAttribute = getRiskVariable(riskConfig, {
    timePeriod,
    futureWindow,
  })
  const tiles = useMemo(() => buildingTileUrl(riskConfig), [riskConfig])
  const buildingsFile = riskConfig.vector.buildings
  const hoveredFeatureId = useRef<string | number | null>(null)
  const colormap = useColormap()

  const colorExpression: ExpressionSpecification = useMemo(() => {
    if (outlined) return ['literal', 'transparent']
    if (!colormap?.length) return ['literal', 'transparent']

    const riskPercentExpression: ExpressionSpecification = [
      '*',
      unitScale,
      ['to-number', ['get', riskAttribute]],
    ]
    const wrap = (expr: ExpressionSpecification) => [
      'case',
      ['==', riskPercentExpression, 0],
      colormap[0],
      expr,
    ]

    const makeDiscrete = (): ExpressionSpecification => {
      const steps: (string | number)[] = []

      colorLimits.binBoundaries.forEach((value: number, index: number) => {
        if (index + 1 < colormap.length) {
          steps.push(value, colormap[index + 1])
        }
      })

      return [
        'step',
        riskPercentExpression,
        colormap[0],
        ...steps,
      ] as ExpressionSpecification
    }

    return wrap(makeDiscrete()) as ExpressionSpecification
  }, [colormap, riskAttribute, unitScale, colorLimits.binBoundaries, outlined])

  const lineColorExpression: ExpressionSpecification = useMemo(() => {
    return [
      'case',
      ['boolean', ['feature-state', 'selected'], false],
      get(theme, 'rawColors.primary'),
      ['boolean', ['feature-state', 'hovered'], false],
      get(theme, 'rawColors.primary'),
      // over the raster, muted reads against both the bin colors and the bare
      // basemap where the raster is transparent
      outlined
        ? get(theme, 'rawColors.muted')
        : get(theme, 'rawColors.secondary'),
    ] as ExpressionSpecification
  }, [theme, outlined])

  const lineWidthExpression: ExpressionSpecification = useMemo(() => {
    const width = (selected: number, hovered: number, base: number) =>
      [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        selected,
        ['boolean', ['feature-state', 'hovered'], false],
        hovered,
        base,
      ] as ExpressionSpecification
    if (outlined) {
      return [
        'interpolate',
        ['linear'],
        ['zoom'],
        12,
        width(2, 1, 0),
        14,
        width(2, 1, 0.5),
        17,
        width(2.5, 1.5, 1),
      ] as ExpressionSpecification
    }
    return [
      'interpolate',
      ['linear'],
      ['zoom'],
      12,
      width(2, 1, 0),
      14,
      width(2, 1, 0.3),
    ] as ExpressionSpecification
  }, [outlined])

  const handleBuildingMouseMove = useCallback(
    (e: MapMouseEvent) => {
      if (!map || map.getZoom() <= 13) return

      const features = map.queryRenderedFeatures(e.point, {
        layers: [LAYERS.buildings.layerIds.fill],
      })

      if (features.length > 0) {
        const feature = features[0]

        if (feature.id !== hoveredFeatureId.current) {
          if (hoveredFeatureId.current !== null) {
            map.setFeatureState(
              {
                source: LAYERS.buildings.sourceId,
                id: hoveredFeatureId.current,
                sourceLayer: LAYERS.buildings.layerName,
              },
              { hovered: false },
            )
          }

          if (feature.id !== undefined && feature.properties) {
            hoveredFeatureId.current = feature.id

            map.setFeatureState(
              {
                source: LAYERS.buildings.sourceId,
                id: feature.id,
                sourceLayer: LAYERS.buildings.layerName,
              },
              { hovered: true },
            )
          }
        }
      } else {
        if (hoveredFeatureId.current !== null) {
          map.setFeatureState(
            {
              source: LAYERS.buildings.sourceId,
              id: hoveredFeatureId.current,
              sourceLayer: LAYERS.buildings.layerName,
            },
            { hovered: false },
          )
          hoveredFeatureId.current = null
        }
      }
    },
    [map],
  )

  const handleBuildingEnter = useCallback(() => {
    if (map && map.getZoom() >= BUILDING_SELECT_MIN_ZOOM) {
      map.getCanvas().style.cursor = 'pointer'
    }
  }, [map])

  const handleBuildingLeave = useCallback(() => {
    if (!map) return

    if (hoveredFeatureId.current !== null) {
      map.setFeatureState(
        {
          source: LAYERS.buildings.sourceId,
          id: hoveredFeatureId.current,
          sourceLayer: LAYERS.buildings.layerName,
        },
        { hovered: false },
      )
      hoveredFeatureId.current = null
    }

    map.getCanvas().style.cursor = ''
  }, [map])

  const handleMapClick = useCallback(
    async (e: MapMouseEvent) => {
      if (!map) return

      const features =
        map.getZoom() < BUILDING_SELECT_MIN_ZOOM
          ? []
          : map.queryRenderedFeatures(e.point, {
              layers: [LAYERS.buildings.layerIds.fill],
            })

      if (features.length > 0) {
        if (hoveredFeatureId.current !== null) {
          map.setFeatureState(
            {
              source: LAYERS.buildings.sourceId,
              id: hoveredFeatureId.current,
              sourceLayer: LAYERS.buildings.layerName,
            },
            { hovered: false },
          )
          hoveredFeatureId.current = null
        }

        const feature = features[0]
        selectBuilding(feature as unknown as Building)
      } else if (buildingsMode === 'query') {
        // the raster is coarse enough that any point is meaningful
        selectArea(e.lngLat.lng, e.lngLat.lat)
      } else {
        clearSelections()
      }
    },
    [map, selectBuilding, selectArea, clearSelections, buildingsMode],
  )

  useEffect(() => {
    if (!map) return

    map.on('click', handleMapClick)
    map.on('mouseenter', LAYERS.buildings.layerIds.fill, handleBuildingEnter)
    map.on('mousemove', LAYERS.buildings.layerIds.fill, handleBuildingMouseMove)
    map.on('mouseleave', LAYERS.buildings.layerIds.fill, handleBuildingLeave)

    return () => {
      if (!map) return
      map.off('click', handleMapClick)
      map.off('mouseenter', LAYERS.buildings.layerIds.fill, handleBuildingEnter)
      map.off(
        'mousemove',
        LAYERS.buildings.layerIds.fill,
        handleBuildingMouseMove,
      )
      map.off('mouseleave', LAYERS.buildings.layerIds.fill, handleBuildingLeave)
    }
  }, [
    map,
    handleMapClick,
    handleBuildingEnter,
    handleBuildingMouseMove,
    handleBuildingLeave,
  ])

  useEffect(() => {
    const source = map?.getSource<VectorTileSource>(LAYERS.buildings.sourceId)
    if (!map || !source || source.tiles?.[0] === tiles) return
    source.setTiles([tiles])
    // a selection's id is a row of the file it was made in; once this file's
    // tiles are drawn, a selection from another file is found again by place
    const fromOtherFile = () => {
      const selected = useStore.getState().selectedBuilding
      return selected && selected.file !== buildingsFile ? selected : null
    }
    if (!fromOtherFile()) return
    map.once('idle', () => {
      // checked again: the user may have selected something since
      const selected = fromOtherFile()
      if (!selected) return
      const [lng, lat] = centerOfMass(selected).geometry.coordinates
      const options = { easeTo: false, fetchAddress: false }
      if (!highlightBuildingAtLocation(lng, lat, options)) clearSelections()
    })
  }, [map, tiles, buildingsFile, highlightBuildingAtLocation, clearSelections])

  useEffect(() => {
    // update color expression when variable selection changes
    if (!map || !map.getLayer(LAYERS.buildings.layerIds.fill)) return
    map.setPaintProperty(
      LAYERS.buildings.layerIds.fill,
      'fill-color',
      colorExpression,
    )
  }, [map, colorExpression])

  useEffect(() => {
    // update line highlight color when theme changes
    if (!map || !map.getLayer(LAYERS.buildings.layerIds.line)) return
    map.setPaintProperty(
      LAYERS.buildings.layerIds.line,
      'line-color',
      lineColorExpression,
    )
  }, [map, lineColorExpression])

  useEffect(() => {
    if (!map || !map.getLayer(LAYERS.buildings.layerIds.line)) return
    map.setPaintProperty(
      LAYERS.buildings.layerIds.line,
      'line-width',
      lineWidthExpression,
    )
  }, [map, lineWidthExpression])

  return null
}

export default Buildings
