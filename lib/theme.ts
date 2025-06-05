import { merge } from 'theme-ui'
// @ts-expect-error - CarbonPlan theme types not available
import baseTheme from '@carbonplan/theme'

const customTextVariants = {
  sectionHeading: {
    fontFamily: 'heading',
    letterSpacing: 'smallcaps',
    textTransform: 'uppercase' as const,
    fontSize: [3, 3, 3, 4],
  },

  label: {
    fontFamily: 'mono',
    fontSize: [2, 2, 2, 3],
    color: 'secondary',
    textTransform: 'uppercase' as const,
    letterSpacing: 'smallcaps',
  },

  field: {
    fontFamily: 'mono',
    fontSize: [2, 2, 2, 3],
    color: 'primary',
  },
}

const theme = merge(baseTheme, customTextVariants as Partial<typeof baseTheme>)

export default theme
