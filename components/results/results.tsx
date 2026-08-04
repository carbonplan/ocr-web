import { Box, Flex } from 'theme-ui'
//@ts-expect-error - carbonplan components types not available
import { Link } from '@carbonplan/components'

import { useStore } from '@/lib/store'
import RiskScore from './risk-score'
import PlaceholderSection from './placeholder-section'
import { RESULT_SECTIONS } from './registry'

const getCurrentYear = () => new Date().getFullYear()

const Results = () => {
  const results = useStore((state) => state.riskConfig.results)

  return (
    <>
      <RiskScore />
      {results.map(({ key, placeholder }) => {
        const { component: Section, title } = RESULT_SECTIONS[key]
        return placeholder ? (
          <PlaceholderSection key={key} title={title} copy={placeholder} />
        ) : (
          <Section key={key} />
        )
      })}

      <Flex
        sx={{
          mt: 5,
          color: 'secondary',
          fontSize: [1, 1, 1, 2],
          fontFamily: 'mono',
          letterSpacing: 'mono',
          justifyContent: 'space-between',
          flexDirection: ['column', 'row', 'row', 'row'],
        }}
      >
        <Flex
          sx={{
            gap: ['10px', '10px', '10px', '12px'],
          }}
        >
          <Box>(c) {getCurrentYear()}</Box>
          <Box>CARBONPLAN</Box>
        </Flex>
        <Flex
          sx={{
            gap: ['10px', '10px', '10px', '12px'],
            textTransform: 'uppercase',
          }}
        >
          <Link
            href='https://carbonplan.org/terms'
            sx={{
              textDecoration: 'none',
              color: 'secondary',
              '&:hover': { color: 'primary' },
            }}
          >
            Terms
          </Link>{' '}
          /
          <Link
            href='https://carbonplan.org/privacy'
            sx={{
              textDecoration: 'none',
              color: 'secondary',
              '&:hover': { color: 'primary' },
            }}
          >
            Privacy
          </Link>
        </Flex>
      </Flex>
    </>
  )
}

export default Results
