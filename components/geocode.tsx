import { useState, useEffect, useRef } from 'react'
import { Box, Flex } from 'theme-ui'
//@ts-expect-error - carbonplan components types not available
import { Button, Input, Row, Column } from '@carbonplan/components'
//@ts-expect-error - carbonplan layouts types not available
import { SidebarDivider } from '@carbonplan/layouts'
//@ts-expect-error - carbonplan icons types not available
import { X } from '@carbonplan/icons'
import { useLocationStore } from '../store/location'
import { Address, Location, Suggestion } from '../types/location'
import { useDebounce } from '../hooks/useDebounce'

export const formatAddress = (address: Address) => {
  const parts = []
  if (address.houseNumber) parts.push(address.houseNumber)
  if (address.street) parts.push(address.street)
  const cityState = []
  if (address.city) cityState.push(address.city)
  if (address.state) cityState.push(address.state)
  if (cityState.length > 0) parts.push(cityState.join(', '))
  return parts.join(' ')
}

const Geocode = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const setSelectedLocation = useLocationStore(
    (state) => state.setSelectedLocation,
  )
  const selectedLocation = useLocationStore((state) => state.selectedLocation)
  const setSelectedBuilding = useLocationStore(
    (state) => state.setSelectedBuilding,
  )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setSuggestions([])
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
      setSelectedIndex(-1)
    } catch (error) {
      console.error('Autocomplete error:', error)
    }
  }

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
  }

  useEffect(() => {
    fetchSuggestions(debouncedSearchQuery)
    setSuggestions([])
  }, [debouncedSearchQuery])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev,
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev))
        break
      case 'Tab':
        e.preventDefault()
        if (e.shiftKey) {
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev))
        } else {
          setSelectedIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : prev,
          )
        }
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex])
        } else if (selectedIndex === -1) {
          handleSuggestionClick(suggestions[0])
        }
        break
      case 'Escape':
        e.preventDefault()
        setSelectedIndex(-1)
        setSuggestions([])
        break
    }
  }

  const handleSuggestionClick = async (suggestion: Suggestion) => {
    setSuggestions([])
    setSelectedIndex(-1)
    const location = await fetchLocationDetails(suggestion.id)
    if (location) {
      setSelectedLocation(location)
    }
  }

  const handleDeselect = () => {
    setSelectedLocation(null)
    setSelectedBuilding(null)
    setSearchQuery('')
    setSuggestions([])
    setSelectedIndex(-1)
  }

  return (
    <Box ref={wrapperRef} sx={{ position: 'relative', width: '100%' }}>
      <SidebarDivider sx={{ mb: 3 }} />
      <Row columns={4}>
        <Column start={1} width={1}>
          <Box variant='label'>Address</Box>
        </Column>
        <Column start={2} width={3}>
          <Flex sx={{ gap: 1 }}>
            {selectedLocation ? (
              <Box
                variant='field'
                title={formatAddress(selectedLocation.address)}
                sx={{
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  flex: 1,
                }}
              >
                {formatAddress(selectedLocation.address)}
              </Box>
            ) : (
              <Input
                value={searchQuery}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={'enter search term'}
                sx={{
                  mt: '2px',
                  flexGrow: 1,
                  fontFamily: 'mono',
                  fontSize: [2, 2, 2, 3],
                  color: 'primary',
                  border: 'none',
                  py: 0,
                  '&::placeholder': {
                    color: 'primary',
                  },
                  '&:focus::placeholder': {
                    color: 'secondary',
                  },
                }}
              />
            )}
            {(selectedLocation || searchQuery.length > 0) && (
              <Button size='xs' onClick={handleDeselect} inverted>
                <X
                  sx={{
                    width: [15, 15, 15, 20],
                    height: [15, 15, 15, 20],
                    mb: ['-4px', '-4px', '-4px', '-2px'],
                  }}
                />
              </Button>
            )}
          </Flex>
        </Column>
      </Row>

      <SidebarDivider sx={{ mt: 3 }} />

      {suggestions.length > 0 && (
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
              {suggestions.map((suggestion, index) => {
                const { address } = suggestion
                return (
                  <Box
                    key={suggestion.id}
                    onClick={() => handleSuggestionClick(suggestion)}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      bg: index === selectedIndex ? 'muted' : 'transparent',
                      '&:hover': {
                        bg: 'muted',
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
      )}
    </Box>
  )
}

export default Geocode
