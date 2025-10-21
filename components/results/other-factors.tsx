import { Box } from 'theme-ui'
//@ts-expect-error - carbonplan components types not available
import { Table } from '@carbonplan/components'

const OtherFactors = () => {
  return (
    <Box sx={{ mt: '52px' }}>
      <Box variant='sectionHeading'>Other factors</Box>
      The risk described above does not account for a variety of factors that
      each may drive the actual risk of loss due to fire up or down.
      <Table
        columns={3}
        start={[1, 3]}
        width={[2, 1]}
        data={[
          ['Factor', 'Risk impact'],
          ['Building retrofit', 'Lower'],
          ['Community emergency response', 'Lower'],
          ['Previous fire', 'Lower'],
          ['Access limitations', 'Higher'],
        ]}
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
