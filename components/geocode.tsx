import { useState, useEffect, useRef } from 'react'
import { Box, Flex } from 'theme-ui'
//@ts-ignore
import { Button, Input } from '@carbonplan/components'
import { useLocationStore } from '../store/location'
import { Address, Location, Suggestion } from '../types/location'
import { useDebounce } from '../hooks/useDebounce'
//@ts-ignore
import { RotatingArrow } from '@carbonplan/icons'

const formatAddress = (address: Address) => {
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setSuggestions([])
        setSelectedIndex(-1)
        setSearchQuery('')
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
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setSelectedIndex(-1)
        break
    }
  }

  const handleSuggestionClick = async (suggestion: Suggestion) => {
    setSuggestions([])
    setSelectedIndex(-1)
    setSearchQuery(formatAddress(suggestion.address))
    const location = await fetchLocationDetails(suggestion.id)
    if (location) {
      setSelectedLocation(location)
      setSuggestions([])
    }
  }

  return (
    <Box ref={wrapperRef} sx={{ position: 'relative', width: '100%' }}>
      <Flex sx={{ gap: 2 }}>
        <Input
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={'Search for a place'}
          sx={{
            flex: 1,
          }}
        />
        <Button size='sm' suffix={<RotatingArrow />}>
          Search
        </Button>
      </Flex>
      {suggestions.length > 0 && (
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            bg: 'background',
            border: '1px solid',
            borderColor: 'muted',
            mt: 1,
            zIndex: 1,
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
      )}
    </Box>
  )
}

export default Geocode
