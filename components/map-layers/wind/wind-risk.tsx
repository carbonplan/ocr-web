import { Box } from 'theme-ui'

const WindRisk = () => {
  return (
    <Box>
      The risk score is a categorical classification of expected annual loss:
      the average share of a building’s value expected to be lost each year to
      tropical cyclone damage.
      <Box sx={{ mt: 3 }}>
        Values describe ~9 km grid cells, so nearby buildings share them.
      </Box>
    </Box>
  )
}

export default WindRisk
