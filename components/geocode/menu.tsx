import { forwardRef } from 'react'
import { Box } from 'theme-ui'
//@ts-expect-error - carbonplan components types not available
import { Row, Column } from '@carbonplan/components'
//@ts-expect-error - carbonplan layouts types not available
import { SidebarDivider } from '@carbonplan/layouts'
import { Suggestion } from '../../types/location'
import { formatAddress } from '@/lib/address-utils'

interface Props {
  suggestions: Suggestion[]
  selectedIndex: number
  errorMessage: string
  onSelectSuggestion: (suggestion: Suggestion) => void
}

type Ref = HTMLDivElement
const Menu = forwardRef<Ref, Props>(
  ({ suggestions, selectedIndex, errorMessage, onSelectSuggestion }, ref) => {
    return (
      <Box ref={ref}>
        {(suggestions.length > 0 || errorMessage) && (
          <Row
            columns={4}
            sx={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              mx: [-4, -5, -5, -6],
              px: [4, 5, 5, 6],
              fontFamily: 'mono',
              color: 'secondary',
              background: 'hinted',
              overflowY: 'auto',
            }}
          >
            <Column start={1} width={4}>
              {suggestions.map((suggestion, index) => (
                <Box
                  key={suggestion.id}
                  role='option'
                  aria-selected={index === selectedIndex}
                  aria-label={formatAddress(suggestion.address)}
                  onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                    e.stopPropagation()
                    onSelectSuggestion(suggestion)
                  }}
                  sx={{
                    py: 3,
                    mx: [-4, -5, -5, -6],
                    px: [4, 5, 5, 6],
                    cursor: 'pointer',
                    bg: index === selectedIndex ? 'muted' : 'transparent',
                    color: index === selectedIndex ? 'primary' : 'secondary',
                    '&:hover': {
                      bg: 'muted',
                      color: 'primary',
                    },
                  }}
                >
                  {formatAddress(suggestion.address)}
                </Box>
              ))}

              {errorMessage && (
                <Box
                  aria-live='polite'
                  role='status'
                  sx={{
                    py: 3,
                    mx: [-4, -5, -5, -6],
                    px: [4, 5, 5, 6],
                    color: 'secondary',
                    cursor: 'default',
                  }}
                >
                  {errorMessage}
                </Box>
              )}

              <SidebarDivider sx={{ my: 0 }} />
            </Column>
          </Row>
        )}
      </Box>
    )
  },
)

Menu.displayName = 'Menu'

export default Menu
