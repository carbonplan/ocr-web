import { Box } from 'theme-ui'
//@ts-expect-error - carbonplan components types not available
import { Link, Table } from '@carbonplan/components'

const FACTORS = [
  'Building attributes like fire-resistant construction and defensible space',
  'Building-to-building spread',
  'Changes in vegetation, including wildfires, after 2020',
  'Community mitigation planning',
  'Community emergency planning',
  'Changes to ignition patterns',
]

const OtherFactors = () => {
  const tableData = [
    ['Factor'],
    ...FACTORS.map((factor) => {
      return [factor]
    }),
  ]

  return (
    <Box>
      <Box variant='description'>
        The risk described above does not account for several important factors,
        including those below, which could influence the actual wildfire risk of
        a given location. For more information on these factors, see our{' '}
        <Link href='https://carbonplan.org/research/climate-risk-faq'>FAQ</Link>
        .
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
            fontSize: [1, 1, 1, 2],
          },
          '& td': {
            fontFamily: 'body',
            letterSpacing: 'body',
          },
        }}
      />
    </Box>
  )
}

export default OtherFactors
