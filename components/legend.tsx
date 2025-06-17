//@ts-expect-error - carbonplan components types not available
import { Colorbar } from '@carbonplan/components'
import { useLocationStore } from '../store/location'
//@ts-expect-error - carbonplan colormaps types not available
import { useThemedColormap } from '@carbonplan/colormaps'

const Legend = () => {
  const currentRiskConfig = useLocationStore((state) => state.currentRiskConfig)
  const currentColorLimits = useLocationStore(
    (state) => state.currentColorLimits,
  )
  const setCurrentColorLimits = useLocationStore(
    (state) => state.setCurrentColorLimits,
  )
  const colormap = useThemedColormap(currentRiskConfig.colormap, {
    count: currentColorLimits.type === 'discrete' ? 5 : 256,
  })

  const handleClimChange = (
    clim: (prev: [number, number]) => [number, number],
  ) => {
    const newBounds = clim(currentColorLimits.bounds)
    if (newBounds[0] >= newBounds[1] || newBounds[1] > 100) {
      return
    }
    setCurrentColorLimits({
      type: currentColorLimits.type,
      bounds: newBounds,
    })
  }

  return (
    <Colorbar
      colormap={colormap}
      clim={currentColorLimits.bounds}
      discrete={currentColorLimits.type === 'discrete'}
      horizontal
      units={'%'}
      width={'100%'}
      setClim={handleClimChange}
      sx={{ mt: 2 }}
    />
  )
}
export default Legend
