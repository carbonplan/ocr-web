import { Box, Link } from 'theme-ui'
//@ts-expect-error - carbonplan components types not available
import { Table } from '@carbonplan/components'
import TooltipWrapper from '../tooltip'

const factors = [
  {
    name: 'Fire-resistant construction',
    impact: 'Lower',
    resources: [
      'https://wildfirerisk.org/reduce-risk/ignition-resistant-homes/',
      'https://www.nfpa.org/education-and-research/wildfire/preparing-homes-for-wildfire',
      'https://cpaw.headwaterseconomics.org/wp-content/uploads/2022/08/2022HE-OwnYourZoneHouse-R3_CPAW.pdf',
    ],
  },
  {
    name: 'Community mitigation',
    impact: 'Lower',
    resources: [
      'https://www.nfpa.org/education-and-research/policy-and-action/outthink-wildfire',
      'https://www.iafc.org/docs/default-source/pdf/wild_cwppleadrsguide.pdf',
      'https://fireadaptednetwork.org/resources/fac-assessment-tool/',
      'https://wildfirerisk.org/reduce-risk/land-use-planning/',
    ],
  },
  {
    name: 'Community emergency response',
    impact: 'Lower',
    resources: [
      'https://wildfirerisk.org/reduce-risk/evacuation-readiness/',
      'https://wildfirerisk.org/reduce-risk/wildfire-response',
    ],
  },
  {
    name: 'Fires in the last ~5 years',
    impact: 'Lower',
    resources: [
      'https://www.fs.usda.gov/managing-land/prescribed-fire',
      'https://cires.colorado.edu/news/fewer-forest-fires-burn-north-america-today-past-and-thats-bad-thing',
    ],
  },
  {
    name: 'Access limitations',
    impact: 'Higher',
    resources: [],
  },
  {
    name: 'Value of resources at risk',
    impact: 'Higher',
    resources: ['https://hazards.fema.gov/nri/expected-annual-loss'],
  },
  {
    name: 'Ignition patterns',
    impact: 'Either',
    resources: [
      'https://wildfirerisk.org/reduce-risk/prevent-ignitions/',
      'https://dnr.wa.gov/wildfire-resources/wildfire-prevention',
      'https://smokeybear.com',
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
                  Resources:{' '}
                  {factor.resources.map((url, index) => (
                    <Box key={url} as='span'>
                      <Link
                        href={url}
                        target='_blank'
                        sx={{
                          color: 'secondary',
                          textDecoration: 'none',
                          '&:hover': {
                            color: 'primary',
                          },
                        }}
                      >
                        [{index + 1}]{' '}
                      </Link>
                    </Box>
                  ))}
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
    <Box sx={{ mt: '20px' }}>
      <TooltipWrapper
        tooltip='The risk described above does not account for a variety of factors that
        each may drive the actual risk of loss due to fire up or down.'
        sx={{ justifyContent: 'flex-start', gap: 2, alignItems: 'baseline' }}
        buttonSx={{ position: 'relative', top: '1px' }}
        tooltipSx={{ mt: -1, mb: 3 }}
      >
        <Box variant='sectionHeading'>Other factors</Box>
      </TooltipWrapper>
      <Table
        columns={3}
        start={[1, 3]}
        width={[2, 1]}
        data={tableData}
        index={false}
        borderTop={false}
        sx={{
          mt: 2,
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
