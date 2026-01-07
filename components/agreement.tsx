import { Box, Button, Flex } from 'theme-ui'
//@ts-expect-error - carbonplan components types not available
import { Link } from '@carbonplan/components'

const Agreement = ({ onClick }: { onClick: () => void }) => {
  return (
    <Flex
      sx={{
        flexDirection: 'column',
        alignItems: ['flex-end', 'flex-end', 'center', 'center'],
        gap: [4, 5, 5, 6],
      }}
    >
      <Box>
        By viewing Open Climate Risk, you agree to CarbonPlan’s 
        <Link href='https://carbonplan.org/terms'>Terms of Use</Link>
         and 
        <Link href='https://carbonplan.org/privacy'>Privacy Policy</Link>.
      </Box>
      <Button
        onClick={onClick}
        sx={{
          cursor: 'pointer',
          width: 'fit-content',
          backgroundColor: 'hinted',
          fontFamily: 'mono',
          letterSpacing: 'mono',
          textTransform: 'uppercase',
          lineHeight: 1.2,
          minHeight: '24px',
          borderRadius: '12px',
          px: 2,
          py: 0,
          gap: 1,
          fontSize: [0, 0, 1, 1],
          border: `1px solid`,
          borderColor: 'secondary',
          transition: 'all 0.2s',
          '&:hover': {
            color: 'secondary',
          },
        }}
      >
        Accept
      </Button>
    </Flex>
  )
}

export default Agreement
