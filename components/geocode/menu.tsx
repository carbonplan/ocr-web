import { forwardRef, useCallback, useEffect, useState } from 'react'
import { Box } from 'theme-ui'
//@ts-expect-error - carbonplan components types not available
import { Row, Column } from '@carbonplan/components'
import { useLocationStore } from '../../store/location'
import { Location, Suggestion } from '../../types/location'
import { formatAddress } from '@/lib/address-utils'
import { useDebounce } from '@/hooks/useDebounce'

interface Props {
  query: string
  focusInput: () => void
  isEditing: boolean
  setIsEditing: (isEditing: boolean) => void
}

type Ref = HTMLDivElement
const Menu = forwardRef<Ref, Props>(
  ({ focusInput, isEditing, query, setIsEditing }, ref) => {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([])
    const [selectedIndex, setSelectedIndex] = useState(-1)
    const setSelectedLocation = useLocationStore(
      (state) => state.setSelectedLocation,
    )
    const debouncedQuery = useDebounce(query, 300)

    const fetchSuggestions = async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setSuggestions([])
        return
      }

      try {
        const response = await fetch(
          `/api/geocode/autocomplete?q=${encodeURIComponent(searchQuery)}`,
        )
        const data = await response.json()
        setSuggestions(data.items)
      } catch (error) {
        console.error('Autocomplete error:', error)
      }
    }

    const closeMenu = useCallback(() => {
      setSuggestions([])
      setSelectedIndex(-1)
    }, [])

    useEffect(() => {
      if (!query) {
        closeMenu()
      }
    }, [query, closeMenu])

    useEffect(() => {
      setSuggestions([])
      fetchSuggestions(debouncedQuery)
    }, [debouncedQuery])

    const fetchLocationDetails = async (
      locationId: string,
    ): Promise<Location | null> => {
      try {
        const response = await fetch(`/api/geocode/lookup?id=${locationId}`)
        const data = await response.json()
        return data
      } catch (error) {
        console.error('Geocoding error:', error)
        return null
      }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (suggestions.length === 0) return

      e.preventDefault()
      switch (e.key) {
        case 'ArrowDown':
          setSelectedIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : prev,
          )
          break
        case 'ArrowUp':
          if (selectedIndex === 0) {
            focusInput()
          }
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev))
          break
        case 'Tab':
          if (e.shiftKey) {
            setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev))
          } else {
            setSelectedIndex((prev) =>
              prev < suggestions.length - 1 ? prev + 1 : prev,
            )
          }
          break
        case 'Enter':
          if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
            handleSuggestionClick(suggestions[selectedIndex])
          } else if (selectedIndex === -1) {
            handleSuggestionClick(suggestions[0])
          }
          break
        case 'Escape':
          closeMenu()
          break
      }
    }

    const handleFocus = () => {
      if (suggestions.length > 0) {
        setSelectedIndex(0)
      } else if (debouncedQuery) {
        fetchSuggestions(debouncedQuery).then(() => {
          setSelectedIndex(0)
        })
      }
    }

    const handleSuggestionClick = async (suggestion: Suggestion) => {
      closeMenu()
      setIsEditing(false)
      const location = await fetchLocationDetails(suggestion.id)
      if (location) {
        setSelectedLocation(location)
      }
    }

    return (
      <Box
        ref={ref}
        tabIndex={0}
        onFocus={handleFocus}
        onBlur={closeMenu}
        onKeyDown={handleKeyDown}
      >
        <Row
          columns={4}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            ml: '-12px',
            zIndex: 1000,
          }}
        >
          <Column start={2} width={3}>
            <Box
              sx={{
                fontFamily: 'mono',
                color: 'secondary',
                bg: 'hinted',
                overflowY: 'auto',
              }}
            >
              {isEditing &&
                suggestions.map((suggestion, index) => {
                  const { address } = suggestion
                  return (
                    <Box
                      key={suggestion.id}
                      onClick={() => handleSuggestionClick(suggestion)}
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        bg: index === selectedIndex ? 'muted' : 'transparent',
                        color:
                          index === selectedIndex ? 'primary' : 'secondary',
                        '&:hover': {
                          bg: 'muted',
                          color: 'primary',
                        },
                      }}
                    >
                      {formatAddress(address)}
                    </Box>
                  )
                })}
            </Box>
          </Column>
        </Row>
      </Box>
    )
  },
)

Menu.displayName = 'Menu'

export default Menu
