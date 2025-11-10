import { Box, Flex } from 'theme-ui'
//@ts-expect-error - carbonplan components types not available
import { Button, Table } from '@carbonplan/components'
//@ts-expect-error - carbonplan icons types not available
import { RotatingArrow } from '@carbonplan/icons'
import TooltipWrapper from '../tooltip'

const factors = [
  {
    name: 'Fire-resistant construction',
    impact: 'Lower',
    resources: [
      {
        label: 'Ignition-resistant homes',
        url: 'https://wildfirerisk.org/reduce-risk/ignition-resistant-homes/',
      },
      {
        label: 'Preparing homes',
        url: 'https://www.nfpa.org/education-and-research/wildfire/preparing-homes-for-wildfire',
      },
      {
        label: 'Exterior home protection',
        url: 'https://cpaw.headwaterseconomics.org/wp-content/uploads/2022/08/2022HE-OwnYourZoneHouse-R3_CPAW.pdf',
      },
    ],
  },
  {
    name: 'Community mitigation',
    impact: 'Lower',
    resources: [
      {
        label: 'Action policies',
        url: 'https://www.nfpa.org/education-and-research/policy-and-action/outthink-wildfire',
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
        url: 'https://wildfirerisk.org/reduce-risk/land-use-planning/',
      },
    ],
  },
  {
    name: 'Community emergency response',
    impact: 'Lower',
    resources: [
      {
        label: 'Evacuation readiness',
        url: 'https://wildfirerisk.org/reduce-risk/evacuation-readiness/',
      },
      {
        label: 'Wildfire response',
        url: 'https://wildfirerisk.org/reduce-risk/wildfire-response',
      },
    ],
  },
  {
    name: 'Fires in the last ~5 years',
    impact: 'Lower',
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
    name: 'Access limitations',
    impact: 'Higher',
    resources: [
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
    name: 'Value of resources at risk',
    impact: 'Higher',
    resources: [
      {
        label: 'Risk exposure',
        url: 'https://hazards.fema.gov/nri/exposure',
      },
      {
        label: 'Understand risk',
        url: 'https://wildfirerisk.org/understand-risk',
      },
    ],
  },
  {
    name: 'Ignition patterns',
    impact: 'Either',
    resources: [
      {
        label: 'Preventing ignitions',
        url: 'https://wildfirerisk.org/reduce-risk/prevent-ignitions/',
      },
      {
        label: 'Wildfire prevention',
        url: 'https://dnr.wa.gov/wildfire-resources/wildfire-prevention',
      },
      { label: 'Smokey Bear', url: 'https://smokeybear.com' },
    ],
  },
]

const OtherFactors = () => {
  const tableData = [
    ['Factor', 'Risk impact'],
    ...factors.map((factor) => {
      const factorCell =
        factor.resources.length > 0 ? (
          <Box>
            <TooltipWrapper
              tooltip={
                <Box>
                  <Flex
                    sx={{ mt: 2, flexWrap: 'wrap', columnGap: 3, rowGap: 2 }}
                  >
                    {factor.resources.map(({ label, url }) => (
                      <Button
                        key={url}
                        href={url}
                        size='xs'
                        target='_blank'
                        suffix={<RotatingArrow />}
                        sx={{
                          color: 'secondary',
                          '&:hover': {
                            color: 'primary',
                          },
                        }}
                      >
                        {label}
                      </Button>
                    ))}
                  </Flex>
                </Box>
              }
              sx={{ display: 'inline-flex', gap: 2 }}
            >
              {factor.name}
            </TooltipWrapper>
          </Box>
        ) : (
          <Box>{factor.name}</Box>
        )
      return [factorCell, factor.impact]
    }),
  ]

  return (
    <Box sx={{ mt: '52px' }}>
      <Box variant='sectionHeading'>Other factors</Box>
      <Box variant='description'>
        The risk described above does not account for a variety of factors that
        each may drive the actual risk of loss due to fire up or down.
      </Box>
      <Table
        columns={3}
        start={[1, 3]}
        width={[2, 1]}
        data={tableData}
        index={false}
        borderTop={false}
        sx={{
          mt: 3,
          '& tr': {
            py: 2,
          },
          '& tr:first-of-type': {
            py: 1,
          },
          '& tr:first-of-type td': {
            fontFamily: 'mono',
            letterSpacing: 'mono',
            textTransform: 'uppercase',
            color: 'secondary',
            fontSize: 1,
          },
          '& td': {
            fontFamily: 'body',
            letterSpacing: 'body',
            whiteSpace: 'nowrap',
          },
          '& td:last-of-type': {
            textAlign: 'right',
          },
        }}
      />
    </Box>
  )
}

export default OtherFactors
