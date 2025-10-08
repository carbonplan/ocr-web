import React from 'react'
import {
  Badge,
  //@ts-expect-error - carbonplan components types not available
} from '@carbonplan/components'

const ValueBadge = ({
  value,
  color,
}: {
  value?: number | null
  color?: string
}) => (
  <Badge
    sx={{ fontSize: [1, 1, 1, 2], height: [21, 21, 21, 22], mb: '-5px', color }}
  >
    {typeof value === 'number' ? `${value.toFixed(2)}%` : <>&nbsp;%&nbsp;</>}
  </Badge>
)

export default ValueBadge
