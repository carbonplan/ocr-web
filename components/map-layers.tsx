import { useState } from 'react'
import { Box, Flex } from 'theme-ui'
import { useBreakpointIndex } from '@theme-ui/match-media'
//@ts-expect-error - carbonplan layouts types not available
import { SidebarAttachment } from '@carbonplan/layouts'
//@ts-expect-error - carbonplan components types not available
import { Expander } from '@carbonplan/components'
import { alpha } from '@theme-ui/color'
import { useStore } from '@/lib/store'
import EyeCheckbox from './eye-checkbox'

const sx = {
  label: {
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
        flexDirection: 'column',
        borderRadius: '10px',
        backgroundColor: alpha('background', 0.7),
        px: 2,
      }}
    >
      {expanded && (
        <Flex
          sx={{
            flexDirection: 'column',
            gap: 2,
            mt: 2,
            mb: 1,
          }}
        >
          <Flex sx={{ gap: 2 }} as='label' variant='description'>
            <EyeCheckbox
              checked={riskRaster}
              onChange={(e) => setRiskRaster(e.target.checked)}
            />
            <Box
              sx={{
                ...sx.label,
                color: riskRaster ? 'primary' : 'secondary',
              }}
            >
              Raw data
            </Box>
          </Flex>
          <Flex sx={{ gap: 2 }} as='label' variant='description'>
            <EyeCheckbox
              checked={satellite}
              onChange={(e) => setSatellite(e.target.checked)}
            />
            <Box
              sx={{
                ...sx.label,
                color: satellite ? 'primary' : 'secondary',
              }}
            >
              Satellite
            </Box>
          </Flex>
        </Flex>
      )}

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
        <Box variant='description'>Map layers</Box>
        <Expander
          id='expander'
          onClick={() => setExpanded(!expanded)}
          value={expanded}
          sx={{ stroke: 'primary', mt: '-1px', width: '10px', p: 0 }}
        />
      </Flex>
    </Flex>
  )
}

export default function MapLayers() {
  const index = useBreakpointIndex({ defaultIndex: 2 })

  if (index >= 2) {
    return (
      <SidebarAttachment
        expanded={true}
        side='left'
        width={4}
        sx={{ bottom: '8px' }}
      >
        <LayersSelector />
      </SidebarAttachment>
    )
  }

  return (
    <Box
      sx={{
        position: 'absolute',
        zIndex: 1,
        bottom: '140px',
        ml: 3,
        mb: 2,
      }}
    >
      <LayersSelector />
    </Box>
  )
}
