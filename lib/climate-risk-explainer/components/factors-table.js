import { Flex } from 'theme-ui'
import { Button, Figure, Table } from '@carbonplan/components'
import { RotatingArrow } from '@carbonplan/icons'

const FACTORS = [
  {
    name: 'Fire-resistant construction and maintenance',
    explanation:
      'Interventions like metal roofs, clean gutters, resistant siding, and defensible space can dramatically reduce the risk of home ignition. We do not account for any of these attributes.',
    resources: [
      {
        label: 'Home hardening',
        url: 'https://readyforwildfire.org/prepare-for-wildfire/hardening-your-home',
      },
      {
        label: 'Home ignition zone',
        url: 'https://www.nfpa.org/education-and-research/wildfire/preparing-homes-for-wildfire',
      },
      {
        label: 'Exterior home protection',
        url: 'https://cpaw.headwaterseconomics.org/wp-content/uploads/2022/08/2022HE-OwnYourZoneHouse-R3_CPAW.pdf',
      },
    ],
  },
  {
    name: 'Recent fires',
    explanation:
      'Our estimates are based on a combination of vegetation maps from ~2021 and ~2023. Fires in the interim would have removed fuel and reduced our BP and cRPS values, thereby decreasing the final risk estimate. In these cases our risk estimates are likely anomalously high-biased. Similarly, prescribed fire is an effective technique for reducing fire risk.',
    resources: [
      {
        label: 'Prescribed fire',
        url: 'https://www.fs.usda.gov/managing-land/prescribed-fire',
      },
      {
        label: 'Wildfires',
        url: 'https://cires.colorado.edu/news/fewer-forest-fires-burn-north-america-today-past-and-thats-bad-thing',
      },
    ],
  },
  {
    name: 'Community mitigation planning',
    explanation:
      'Our estimates do not account for community-scale actions like wildfire protection plans and land use planning. These actions can reduce the risk of wildfire entering a community.',
    resources: [
      {
        label: 'Firewise Communties',
        url: 'https://www.nfpa.org/education-and-research/wildfire/firewise-usa',
      },
      {
        label: 'Community wildfire protection plan',
        url: 'https://www.iafc.org/docs/default-source/pdf/wild_cwppleadrsguide.pdf',
      },
      {
        label: 'Fire adapted communities tool',
        url: 'https://fireadaptednetwork.org/resources/fac-assessment-tool/',
      },
      {
        label: 'Land use planning',
        url: 'https://wildfirerisk.org/reduce-risk/land-use-planning',
      },
    ],
  },
  {
    name: 'Community emergency planning',
    explanation:
      'Community-level emergency planning can support the development of strong evacuation plans and ensure adequate access, which could reduce wildfire risk.',
    resources: [
      {
        label: 'Evacuation readiness',
        url: 'https://www.nist.gov/publications/wui-fire-evacuation-and-sheltering-considerations-assessment-planning-and-execution-0',
      },
      {
        label: 'Fire apparatus access roads',
        url: 'https://www.nfpa.org/news-blogs-and-articles/blogs/2021/01/08/fire-apparatus-access-roads',
      },
      {
        label: 'Wildfire risk to roads',
        url: 'https://www.climatecentral.org/climate-matters/wildfire-risk-to-homes',
      },
    ],
  },
  {
    name: 'Ignition patterns',
    explanation:
      'Our model is based on simulations which used a fixed map of ignition probabilities. Changes in ignition patterns could either increase or decrease the estimated risk in a given location.',
    resources: [
      {
        label: 'Preventing ignitions',
        url: 'https://wildfirerisk.org/reduce-risk/prevent-ignitions',
      },
      {
        label: 'Wildfire prevention',
        url: 'https://dnr.wa.gov/wildfire-resources/wildfire-prevention',
      },
    ],
  },
]
const FactorsTable = () => {
  return (
    <Figure>
      <Table
        columns={6}
        start={[1, 3, 1]}
        width={[2, 4, 6]}
        data={[
          ...FACTORS.map(({ name, explanation, resources }) => [
            name,
            explanation,
            <Flex
              key='links'
              sx={{ mt: 3, columnGap: 4, rowGap: 1, flexWrap: 'wrap' }}
            >
              {resources.map(({ label, url }) => (
                <Button
                  key={url}
                  inverted
                  href={url}
                  suffix={<RotatingArrow />}
                  size='xs'
                >
                  {label}
                </Button>
              ))}
            </Flex>,
          ]),
        ]}
      />
    </Figure>
  )
}

export default FactorsTable
