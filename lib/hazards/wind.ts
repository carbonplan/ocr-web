import { HazardConfig } from './types'

const CHAZ_BASE =
  process.env.NEXT_PUBLIC_WIND_ZARR_BASE ??
  'https://carbonplan-ocr.s3.amazonaws.com/ocr-explore/CHAZ/processed'

const chazUrl = (id: string) => `${CHAZ_BASE}/${id}`

const wind: HazardConfig = {
  id: 'wind',
  label: 'Wind',
  accentColor: 'teal',
  description:
    'Wind risk represents the expected annual loss from tropical cyclone damage, derived from the CHAZ model.',
  colormap: 'teals',
  // same score bins as fire (percent per year)
  binBoundaries: [0, 0.01, 0.02, 0.035, 0.06, 0.1, 0.2, 0.5, 1, 3],
  // ead is stored as a fraction per year; display units are percent
  unitScale: 100,
  buildingsMode: 'query',
  axisLabel: 'Expected annual loss',
  selectPrompt: 'Select a building to view its wind risk.',
  climateTooltip:
    'Current estimates are based on tropical cyclones downscaled from the ERA5 reanalysis (1995-2014). Future estimates use the median of CHAZ simulations driven by six CMIP6 climate models under SSP3-7.0.',
  datasets: {
    current: {
      source: chazUrl('chaz_damage_fraction_conus_ERA5_points'),
      variable: 'ead',
    },
    future: {
      fut1: {
        source: chazUrl(
          'chaz_damage_fraction_conus_ssp370_fut1_CRH_median_points',
        ),
        variable: 'ead',
      },
      fut2: {
        source: chazUrl(
          'chaz_damage_fraction_conus_ssp370_fut2_CRH_median_points',
        ),
        variable: 'ead',
      },
    },
  },
  timePeriodLabels: {
    current: '1995-2014',
    future: {
      fut1: '2041-2060',
      fut2: '2081-2100',
    },
  },
  results: [
    { key: 'windDetail' },
    {
      key: 'regionalRisk',
      placeholder: 'Regional wind statistics are in production.',
    },
    { key: 'windAbout' },
  ],
}

export default wind
