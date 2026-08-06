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
    'Current estimates are based on tropical cyclones downscaled from the ERA5 reanalysis (1981-2019). Future estimates use the median of CHAZ simulations driven by six CMIP6 climate models under SSP3-7.0.',
  // v2 stores: ead is the rendered band; the same store carries the
  // damage/wind curves along return_period and the recurrence bands the
  // building query reads (see lib/chaz-query.ts)
  datasets: {
    current: {
      source: chazUrl('chaz_conus_v2_ERA5_points'),
      variable: 'ead',
    },
    future: {
      fut1: {
        source: chazUrl('chaz_conus_v2_ssp370_fut1_CRH_median_points'),
        variable: 'ead',
      },
      fut2: {
        source: chazUrl('chaz_conus_v2_ssp370_fut2_CRH_median_points'),
        variable: 'ead',
      },
    },
  },
  timePeriodLabels: {
    current: '1981-2019',
    future: {
      fut1: '2041-2060',
      fut2: '2081-2100',
    },
  },
  riskLayerLabel: 'Expected loss',
  mapLayers: [
    {
      id: 'wind_speed',
      label: 'Wind hazard',
      variable: 'wind_speed',
      unit: 'mph',
      // m/s -> mph
      unitScale: 2.23694,
      // Saffir-Simpson category edges (1-min sustained wind, mph)
      binBoundaries: [0, 39, 74, 96, 111, 130, 157],
      binLabels: [
        'Below tropical storm force',
        'Tropical storm',
        'Category 1 hurricane',
        'Category 2 hurricane',
        'Category 3 hurricane',
        'Category 4 hurricane',
        'Category 5 hurricane',
      ],
      description:
        'Peak 1-minute sustained wind speed expected from a storm of the selected rarity, binned by Saffir-Simpson category.',
      selectPrompt: 'Select a building to view its wind hazard.',
      selector: {
        dim: 'return_period',
        values: [10, 25, 50, 100, 250, 1000],
        defaultValue: 100,
        formatOption: (value) => `${value} yr`,
      },
      pointValue: (detail, selectorValue) => {
        const index =
          selectorValue === null
            ? -1
            : detail.returnPeriods.indexOf(selectorValue)
        return index >= 0 ? detail.windSpeed[index] : null
      },
    },
  ],
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
