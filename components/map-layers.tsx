import { useState } from 'react'
import { Box, Flex } from 'theme-ui'
//@ts-expect-error - carbonplan components types not available
import { Expander } from '@carbonplan/components'
import { useStore } from '@/lib/store'
import EyeCheckbox from './eye-checkbox'
import Section from './section'

const sx = {
  text: {
    fontFamily: 'mono',
    letterSpacing: 'mono',
    textTransform: 'uppercase',
    lineHeight: 1.2,
  } as const,
  label: {
    fontSize: [0, 0, 1, 1],
    mt: '1px',
    transition: '0.2s color',
    '&:hover': { color: 'primary' },
    cursor: 'pointer',
  },
}

const LayersSelector = () => {
  const [expanded, setExpanded] = useState(false)
  const satellite = useStore((state) => state.satellite)
  const setSatellite = useStore((state) => state.setSatellite)
  const riskRaster = useStore((state) => state.riskRaster)
  const setRiskRaster = useStore((state) => state.setRiskRaster)

  return (
    <Flex
      sx={{
        alignItems: 'center',
        justifyContent: expanded ? 'flex-end' : 'center',
        minHeight: '24px',
        flexDirection: ['column', 'column', 'column-reverse', 'column-reverse'],
        borderRadius: '12px',
        backgroundColor: 'hinted',
        px: 2,
        gap: 1,
        border: `1px solid`,
        borderColor: 'secondary',
      }}
    >
      <Flex
        sx={{
          width: 'fit-content',
          gap: 2,
          alignItems: 'center',
          cursor: 'pointer',
          transition: '.2s color',
          userSelect: 'none',
          '&:hover': { color: 'secondary' },
          '&:hover svg': { stroke: 'secondary' },
        }}
        as='label'
      >
        <Box sx={{ ...sx.text, fontSize: [0, 0, 1, 1] }}>Map layers</Box>
        <Expander
          id='expander'
          onClick={() => setExpanded(!expanded)}
          value={expanded}
          sx={{ stroke: 'primary', width: '10px', p: 0 }}
        />
      </Flex>

      {expanded && (
        <Flex
          sx={{
            flexDirection: 'column',
            gap: 2,
            mt: [0, 0, 1, 1],
            mb: [1, 1, 0, 0],
          }}
        >
          <Flex sx={{ gap: 2 }} as='label'>
            <EyeCheckbox
              checked={riskRaster}
              onChange={(e) => setRiskRaster(e.target.checked)}
              aria-label='Toggle risk raster visibility'
            />
            <Box
              sx={{
                ...sx.text,
                ...sx.label,
                color: riskRaster ? 'primary' : 'secondary',
              }}
            >
              Raw data
            </Box>
          </Flex>
          <Flex sx={{ gap: 2 }} as='label'>
            <EyeCheckbox
              checked={satellite}
              onChange={(e) => setSatellite(e.target.checked)}
              aria-label='Toggle satellite imagery visibility'
            />
            <Box
              sx={{
                ...sx.text,
                ...sx.label,
                color: satellite ? 'primary' : 'secondary',
              }}
            >
              Satellite
            </Box>
          </Flex>
        </Flex>
      )}
    </Flex>
  )
}

export default function MapLayers() {
  return <Section label='Map layers'>TK</Section>
}
