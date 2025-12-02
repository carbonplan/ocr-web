import { Box } from 'theme-ui'
//@ts-expect-error - carbonplan components types not available
import { Link, Table } from '@carbonplan/components'

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
      'Our estimates do not account for community-scale actions like wildfire protection plans and land-use planning. These actions can reduce the risk of wildfire entering a community.',
    resources: [
      {
        label: 'Firewise communities',
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
        label: 'Land-use planning',
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

const OtherFactors = () => {
  const tableData = [
    ['Factor'],
    ...FACTORS.map((factor) => {
      // const factorCell =
      //   factor.resources.length > 0 ? (
      //     <Box>
      //       <TooltipWrapper
      //         tooltip={
      //           <Box>
      //             <Flex
      //               sx={{ mt: 2, flexWrap: 'wrap', columnGap: 3, rowGap: 2 }}
      //             >
      //               {factor.resources.map(({ label, url }) => (
      //                 <Button
      //                   key={url}
      //                   href={url}
      //                   size='xs'
      //                   target='_blank'
      //                   suffix={<RotatingArrow />}
      //                   sx={{
      //                     color: 'secondary',
      //                     '&:hover': {
      //                       color: 'primary',
      //                     },
      //                   }}
      //                 >
      //                   {label}
      //                 </Button>
      //               ))}
      //             </Flex>
      //           </Box>
      //         }
      //         sx={{ display: 'inline-flex', gap: 2 }}
      //       >
      //         {factor.name}
      //       </TooltipWrapper>
      //     </Box>
      //   ) : (
      //     <Box>{factor.name}</Box>
      //   )
      return [factor.name]
    }),
  ]

  return (
    <Box sx={{ mt: '52px' }}>
      <Box as='h2' variant='sectionHeading'>
        Other factors
      </Box>
      <Box variant='description'>
        The risk described above does not account for several highly important
        factors, which could influence the actual fire risk of a given location.
        For more information on these factors, see our{' '}
        <Link href='/research/climate-risk-faq'>FAQ</Link>.
      </Box>
      <Table
        columns={3}
        start={[1]}
        width={[3]}
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
          // '& td:last-of-type': {
          //   textAlign: 'right',
          // },
        }}
      />
    </Box>
  )
}

export default OtherFactors
