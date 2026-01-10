import { useState, useRef, useEffect } from 'react'
import { Box, Flex } from 'theme-ui'
import { mix } from '@theme-ui/color'
import { MapSourceDataEvent } from 'maplibre-gl'
//@ts-expect-error - carbonplan components types not available
import { Button, Input, Row, Column } from '@carbonplan/components'
//@ts-expect-error - carbonplan layouts types not available
import { SidebarDivider } from '@carbonplan/layouts'
//@ts-expect-error - carbonplan icons types not available
import { X } from '@carbonplan/icons'
import { useStore } from '../../lib/store'
import { formatAddress } from '@/lib/address-utils'
import { useBuildingUtils } from '@/hooks/useBuildingUtils'
import { LAYERS } from '@/lib/config'
import { Suggestion } from '../../types/location'
import { useDebounce } from '@/hooks/useDebounce'
import Menu from './menu'

const Geocode = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [selectedIndex, setSelectedIndex] = useState<number>(-1)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [suggestionsQuery, setSuggestionsQuery] = useState('')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const debouncedQuery = useDebounce(searchQuery, 300)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const listboxId = 'address-suggestions'
  const errorId = 'search-error'

  const setSelectedLocation = useStore((state) => state.setSelectedLocation)
  const selectedLocation = useStore((state) => state.selectedLocation)
  const map = useStore((state) => state.map)
  const clearSelections = useStore((state) => state.clearSelections)
  const reverseGeocodeLoading = useStore((state) => state.reverseGeocodeLoading)

  const { highlightBuildingAtLocation } = useBuildingUtils()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsEditing(false)
        menuRef.current?.blur()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (selectedLocation) {
      setSearchQuery(
        formatAddress(selectedLocation.address, { abbreviate: true }),
      )
    } else {
      setSearchQuery('')
    }
  }, [selectedLocation])

  useEffect(() => {
    if (!isEditing) {
      setSuggestions([])
      setSuggestionsQuery('')
      setSelectedIndex(-1)
      setErrorMessage('')
    }
  }, [isEditing])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([])
      setSuggestionsQuery('')
      setErrorMessage('')
    }
  }, [searchQuery])

  useEffect(() => {
    if (reverseGeocodeLoading) {
      // show loading placeholder
      setSearchQuery('')
    }
  }, [reverseGeocodeLoading])

  useEffect(() => {
    if (debouncedQuery.trim() && searchQuery.trim() && isEditing) {
      abortControllerRef.current?.abort()
      const controller = new AbortController()
      abortControllerRef.current = controller
      fetchSuggestions(debouncedQuery, controller.signal)
    }

    return () => {
      abortControllerRef.current?.abort()
    }
  }, [debouncedQuery, searchQuery, isEditing])

  const fetchSuggestions = async (
    query: string,
    signal: AbortSignal,
  ): Promise<Suggestion[]> => {
    try {
      const response = await fetch(
        `/api/geocode/autocomplete?q=${encodeURIComponent(query)}`,
        { signal },
      )
      const data = await response.json()
      const results = data.items || []
      setSuggestions(results)
      setSuggestionsQuery(query)

      if (results.length === 0) {
        setErrorMessage('No results found')
      } else {
        setErrorMessage('')
      }
      return results
    } catch (error) {
      // Ignore aborted requests
      if (error instanceof DOMException && error.name === 'AbortError') {
        return []
      }
      console.error('Autocomplete error:', error)
      setErrorMessage('Error searching for location')
      setSuggestions([])
      return []
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (suggestions.length > 0) {
          setSelectedIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : prev,
          )
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        if (selectedIndex > 0) {
          setSelectedIndex((prev) => prev - 1)
        } else if (selectedIndex === 0) {
          setSelectedIndex(-1)
        }
        break
      case 'Tab':
        setIsEditing(false)
        setSelectedIndex(-1)
        break
      case 'Escape':
        e.preventDefault()
        setIsEditing(false)
        setSelectedIndex(-1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedIndex])
        } else {
          handleEnterKeyPress()
        }
        break
      default:
        setIsEditing(true)
        setSelectedIndex(-1)
    }
  }

  const handleSuggestionSelect = async (suggestion: Suggestion) => {
    try {
      clearSelections()
      const locationResponse = await fetch(
        `/api/geocode/lookup?id=${suggestion.id}`,
      )
      const location = await locationResponse.json()

      if (map && location) {
        map.easeTo({
          center: [location.position.lng, location.position.lat],
          zoom: location.address.houseNumber ? 16 : 12,
        })

        // Highlight building after map movement completes
        if (location.address.houseNumber) {
          const handleMoveEnd = () => {
            if (map.isSourceLoaded(LAYERS.buildings.sourceId)) {
              const success = highlightBuildingAtLocation(
                location.position.lng,
                location.position.lat,
                { easeTo: false, fetchAddress: false },
              )
              if (success) setSelectedLocation(location)
            } else {
              const handleSourceData = (e: MapSourceDataEvent) => {
                if (
                  e.sourceId === LAYERS.buildings.sourceId &&
                  e.isSourceLoaded
                ) {
                  map.off('sourcedata', handleSourceData)
                  const success = highlightBuildingAtLocation(
                    location.position.lng,
                    location.position.lat,
                    { easeTo: false, fetchAddress: false },
                  )
                  if (success) setSelectedLocation(location)
                }
              }
              map.on('sourcedata', handleSourceData)
            }
          }
          map.once('moveend', handleMoveEnd)
        }
      }

      setIsEditing(false)
      setSelectedIndex(-1)
      setSearchQuery('')
      inputRef.current?.blur()
    } catch (error) {
      console.error('Suggestion selection error:', error)
    }
  }

  const handleEnterKeyPress = async () => {
    if (!searchQuery.trim()) return

    if (suggestions.length > 0 && suggestionsQuery === searchQuery) {
      handleSuggestionSelect(suggestions[0])
      return
    }

    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    const results = await fetchSuggestions(searchQuery, controller.signal)
    if (results.length > 0) {
      handleSuggestionSelect(results[0])
    }
  }

  const handleDeselect = () => {
    clearSelections()
    setSearchQuery('')
    setSelectedIndex(-1)
  }

  return (
    <Box
      ref={wrapperRef}
      sx={{ width: '100%', position: 'sticky', top: -25, zIndex: 10 }}
    >
      <Box
        onClick={() => inputRef.current?.focus()}
        sx={{
          background: 'background',
          cursor: 'pointer',
          transition: 'background-color 0.15s',
          zIndex: 2,
          px: [4, 5, 5, 6],
          mx: [-4, -5, -5, -6],
          '&:hover': {
            background: mix('muted', 'background', 0.25),
          },
          '&:hover #close': {
            color: 'primary',
          },
          '&:hover input::placeholder': {
            color: 'primary',
          },
        }}
      >
        <SidebarDivider sx={{ mb: 3 }} />
        <Row columns={[6, 8, 4, 4]}>
          <Column start={[1]} width={1}>
            <Box variant='label'>Address</Box>
          </Column>
          <Column start={[3, 2, 2, 2]} width={[4, 7, 3, 3]}>
            <Flex>
              <Input
                ref={inputRef}
                id={'address-search'}
                role='combobox'
                aria-expanded={isEditing && suggestions.length > 0}
                aria-haspopup='listbox'
                aria-controls={listboxId}
                aria-activedescendant={
                  selectedIndex >= 0 ? `suggestion-${selectedIndex}` : undefined
                }
                aria-describedby={errorMessage ? errorId : undefined}
                aria-label='Search for an address'
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearchQuery(e.target.value)
                }
                onKeyDown={handleKeyDown}
                onFocus={() => setIsEditing(true)}
                placeholder={
                  reverseGeocodeLoading ? 'loading...' : 'enter search term'
                }
                sx={{
                  mt: '1px',
                  flexGrow: 1,
                  fontFamily: 'mono',
                  fontSize: [2, 2, 2, 3],
                  color: 'primary',
                  border: 'none',
                  py: 0,
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  flex: 1,
                  '&::placeholder': {
                    transition: 'color 0.15s',
                  },
                }}
              />
              {(selectedLocation || searchQuery.length > 0) && (
                <Button
                  size='xs'
                  onClick={handleDeselect}
                  inverted
                  aria-label='Clear address'
                  sx={{ mr: ['-10px', '-12px', '-14px', '-17px'] }}
                >
                  <X
                    id='close'
                    sx={{
                      transition: 'color 0.2s',
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

        <SidebarDivider sx={{ my: 3, mb: 0 }} />
      </Box>
      {isEditing && (
        <Menu
          suggestions={suggestions}
          selectedIndex={selectedIndex}
          errorMessage={errorMessage}
          onSelectSuggestion={handleSuggestionSelect}
          listboxId={listboxId}
          errorId={errorId}
          ref={menuRef}
        />
      )}
    </Box>
  )
}

export default Geocode
