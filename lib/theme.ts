import { merge } from 'theme-ui'
// @ts-expect-error - CarbonPlan theme types not available
import baseTheme from '@carbonplan/theme'

const customVariants = {
  sectionHeading: {
    fontFamily: 'heading',
    letterSpacing: 'smallcaps',
    textTransform: 'uppercase' as const,
    fontSize: [2, 3, 3, 4],
    mb: 2,
    mt: 5,
  },

  label: {
    fontFamily: 'mono',
    fontSize: [2, 2, 2, 3],
    color: 'primary',
    textTransform: 'uppercase' as const,
    letterSpacing: 'smallcaps',
  },

  description: {
    fontFamily: 'body',
    letterSpacing: 'body',
    fontSize: [2, 2, 2, 3],
  },

  filter: {
    button: {
      mr: '10px',
      '&:last-child': {
        mr: 0,
      },
    },
  },

  srOnly: {
    position: 'absolute',
    left: '-10000px',
    width: '1px',
    height: '1px',
    overflow: 'hidden',
  },
}

const theme = merge(baseTheme, customVariants as Partial<typeof baseTheme>)

export default theme
