import React from 'react'
import {
  Badge,
  //@ts-expect-error - carbonplan components types not available
} from '@carbonplan/components'

const ValueBadge = ({
  value,
  color,
  unit = '%',
}: {
  value?: string | number | null
  color?: string
  unit?: string
}) => {
  let formattedValue
  if (typeof value === 'number') {
    formattedValue = value.toFixed(2)
  } else if (typeof value === 'string') {
    formattedValue = value
  }
  return (
    <Badge
      sx={{
        fontSize: [1, 1, 1, 2],
        height: [21, 21, 21, 22],
        mb: '-5px',
        color,
      }}
    >
      {value == null ? (
        <>&nbsp;&nbsp;{unit}&nbsp;&nbsp;</>
      ) : (
        `${formattedValue}${unit === '%' ? '%' : ''}`
      )}
    </Badge>
  )
}

export default ValueBadge
