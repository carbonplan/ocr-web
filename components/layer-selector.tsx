import { Box } from 'theme-ui'
import {
  Filter,
  Row,
  Column,
  //@ts-expect-error - carbonplan components types not available
} from '@carbonplan/components'

import { useStore } from '@/lib/store'
import { RISK_LAYER_ID, getMapLayer } from '@/lib/hazards'
import TooltipWrapper from './tooltip'

const LayerSelector = () => {
  const riskConfig = useStore((state) => state.riskConfig)
  const mapLayer = useStore((state) => state.mapLayer)
  const setMapLayer = useStore((state) => state.setMapLayer)
  const selectorValue = useStore((state) => state.mapLayerSelectorValue)
  const setMapLayerSelectorValue = useStore(
    (state) => state.setMapLayerSelectorValue,
  )

  const layers = riskConfig.mapLayers
  if (!layers?.length) return null

  const options = [
    { id: RISK_LAYER_ID, label: riskConfig.riskLayerLabel ?? 'Risk' },
    ...layers.map(({ id, label }) => ({ id, label })),
  ]
  const activeLayer = getMapLayer(riskConfig, mapLayer)
  const selector = activeLayer?.selector

  return (
    <>
      <Row columns={[6, 8, 4, 4]}>
        <Column start={[1]} width={1}>
          <Box variant='label'>Layer</Box>
        </Column>
        <Column start={[3, 2, 2, 2]} width={[4, 7, 3, 3]} sx={{ mb: '-5px' }}>
          <TooltipWrapper
            tooltip={activeLayer?.description ?? riskConfig.description}
            sx={{ justifyContent: 'flex-start', gap: 3 }}
          >
            <Filter
              role='group'
              aria-label='Select map layer'
              variant='filter'
              values={Object.fromEntries(
                options.map(({ id }) => [id, id === mapLayer]),
              )}
              labels={Object.fromEntries(
                options.map(({ id, label }) => [id, label]),
              )}
              setValues={(values: Record<string, boolean>) => {
                const selected = Object.keys(values).find((key) => values[key])
                if (selected) setMapLayer(selected)
              }}
            />
          </TooltipWrapper>
        </Column>
      </Row>
      {selector && (
        <Row columns={[6, 8, 4, 4]} sx={{ mt: 3 }}>
          <Column start={[3, 2, 2, 2]} width={[4, 7, 3, 3]} sx={{ mb: '-5px' }}>
            <Filter
              role='group'
              aria-label='Select return period'
              variant='filter'
              values={Object.fromEntries(
                selector.values.map((value) => [
                  String(value),
                  value === selectorValue,
                ]),
              )}
              labels={Object.fromEntries(
                selector.values.map((value) => [
                  String(value),
                  selector.formatOption(value),
                ]),
              )}
              setValues={(values: Record<string, boolean>) => {
                const selected = Object.keys(values).find((key) => values[key])
                if (selected) setMapLayerSelectorValue(Number(selected))
              }}
            />
          </Column>
        </Row>
      )}
    </>
  )
}

export default LayerSelector
