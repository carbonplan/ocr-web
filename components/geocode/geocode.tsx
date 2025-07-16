import { useState, useRef, useEffect } from 'react'
import { Box, Flex } from 'theme-ui'
import { mix } from '@theme-ui/color'
//@ts-expect-error - carbonplan components types not available
import { Button, Input, Row, Column } from '@carbonplan/components'
//@ts-expect-error - carbonplan layouts types not available
import { SidebarDivider } from '@carbonplan/layouts'
//@ts-expect-error - carbonplan icons types not available
import { X } from '@carbonplan/icons'
import { useLocationStore } from '../../store/location'
import { formatAddress } from '@/lib/address-utils'
import Menu from './menu'

const Geocode = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
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
        setIsEditing(false)
        menuRef.current?.blur()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (selectedLocation) {
      setSearchQuery(formatAddress(selectedLocation.address))
    }
  }, [selectedLocation])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        menuRef.current?.focus()
        break
      case 'ArrowUp':
        break
      case 'Tab':
        break
      case 'Escape':
        e.preventDefault()
        setIsEditing(false)
        menuRef.current?.blur()
        break
      case 'Enter':
        e.preventDefault()
        handleEnterKeyPress()
        break
      default:
        setIsEditing(true)
    }
  }

  const handleEnterKeyPress = async () => {
    if (!searchQuery.trim()) return
    try {
      const response = await fetch(
        `/api/geocode/autocomplete?q=${encodeURIComponent(searchQuery)}`,
      )
      const data = await response.json()
      if (data.items && data.items.length > 0) {
        const locationResponse = await fetch(
          `/api/geocode/lookup?id=${data.items[0].id}`,
        )
        const location = await locationResponse.json()
        setSelectedLocation(location)
        setIsEditing(false)
        setSearchQuery('')
        inputRef.current?.blur()
      }
    } catch (error) {
      console.error('Enter key geocoding error:', error)
    }
  }

  const handleDeselect = () => {
    setSelectedLocation(null)
    setSelectedBuilding(null)
    setSearchQuery('')
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
          zIndex: 1,
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
        <Row columns={4}>
          <Column start={1} width={1}>
            <Box variant='label'>Address</Box>
          </Column>
          <Column start={2} width={3}>
            <Flex sx={{ gap: 1 }}>
              <Input
                ref={inputRef}
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearchQuery(e.target.value)
                }
                onKeyDown={handleKeyDown}
                onFocus={() => setIsEditing(true)}
                placeholder={'enter search term'}
                sx={{
                  mt: '2px',
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

        <SidebarDivider sx={{ mt: 3 }} />
      </Box>
      <Menu
        query={searchQuery}
        focusInput={() => inputRef.current?.focus()}
        ref={menuRef}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
      />
    </Box>
  )
}

export default Geocode
