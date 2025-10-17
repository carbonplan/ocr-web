import { Box, Flex } from 'theme-ui'
import { useBreakpointIndex } from '@theme-ui/match-media'
//@ts-expect-error - carbonplan layouts types not available
import { SidebarAttachment } from '@carbonplan/layouts'
//@ts-expect-error - carbonplan components types not available
import { Button, Expander, Toggle } from '@carbonplan/components'
import { useStore } from '@/lib/store'
import { useState } from 'react'

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
        gap: 2,
      }}
    >
      {expanded && (
        <Flex sx={{ flexDirection: 'column', gap: 2 }}>
          <Flex sx={{ gap: 2 }}>
            <Toggle
              value={riskRaster}
              onClick={() => setRiskRaster(!riskRaster)}
            />
            <Box variant='description' sx={{ mt: '1px' }}>
              Raw data
            </Box>
          </Flex>
          <Flex sx={{ gap: 2 }}>
            <Toggle
              value={satellite}
              onClick={() => setSatellite(!satellite)}
            />
            <Box variant='description' sx={{ mt: '1px' }}>
              Satellite
            </Box>
          </Flex>
        </Flex>
      )}

      <Button
        size='xs'
        onClick={() => setExpanded(!expanded)}
        suffix={
          <Expander
            id='expander'
            value={expanded}
            sx={{ mt: '-6px', width: '10px', p: 0 }}
          />
        }
        sx={{
          variant: 'description',
          '&:hover svg': { stroke: 'primary', fill: 'primary' },
        }}
        inverted
      >
        Map layers
      </Button>
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
        sx={{ bottom: '12px' }}
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
