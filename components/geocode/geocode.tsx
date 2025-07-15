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

  const handleDeselect = () => {
    setSelectedLocation(null)
    setSelectedBuilding(null)
    setSearchQuery('')
  }

  return (
    <Box sx={{ width: '100%', position: 'sticky', top: -25 }}>
      <Box
        ref={wrapperRef}
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
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    menuRef.current?.focus()
                  }
                }}
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
                    color: 'primary',
                  },
                }}
              />
              {(selectedLocation || searchQuery.length > 0) && (
                <Button size='xs' onClick={handleDeselect} inverted>
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

        <Menu
          query={searchQuery}
          focusInput={() => inputRef.current?.focus()}
          ref={menuRef}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
        />
      </Box>
    </Box>
  )
}

export default Geocode
