import { FC, SVGProps } from 'react'

import { Box, BoxProps, Input, InputProps, ThemeUIStyleObject } from 'theme-ui'

const sxCheckbox = {
  position: 'absolute',
  left: 0,
  stroke: 'secondary',
  strokeWidth: '1.25',
  width: '18px',
  cursor: 'pointer',
  transition: 'stroke 0.15s',
  'input:not(:checked) ~ &': {
    stroke: 'secondary',
  },
  '@media (hover: hover) and (pointer: fine)': {
    'input:hover ~ &': { stroke: 'primary' },
  },
  'input:focus ~ &': {
    bg: 'inherit',
  },
  'input:focus-visible ~ &': {
    outline: 'dashed 1px rgb(110, 110, 110, 0.625)',
    background: 'rgb(110, 110, 110, 0.625)',
  },
}

type SVGBoxProps = BoxProps & SVGProps<SVGSVGElement>
const SVGBox: FC<SVGBoxProps> = (props) => <Box as='svg' {...props} />

const EyeFilled = ({ sx }: { sx: ThemeUIStyleObject }) => {
  return (
    <SVGBox
      as='svg'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.5'
      sx={{ ...sxCheckbox, ...sx } as ThemeUIStyleObject}
    >
      <path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z'></path>
      <circle fill='currentColor' cx='12' cy='12' r='3'></circle>
    </SVGBox>
  )
}

const Eye = ({ sx }: { sx: ThemeUIStyleObject }) => {
  return (
    <SVGBox
      as='svg'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.5'
      sx={{ ...sxCheckbox, ...sx } as ThemeUIStyleObject}
    >
      <path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z'></path>
      <circle cx='12' cy='12' r='3'></circle>
    </SVGBox>
  )
}

const EyeCheckbox = (props: Partial<InputProps>) => {
  return (
    <Box sx={{ width: '18px', flexShrink: 0, position: 'relative' }}>
      <Input
        type='checkbox'
        {...props}
        sx={{
          position: 'absolute',
          opacity: 0,
          zIndex: -1,
          width: 1,
          height: 1,
          overflow: 'hidden',
        }}
      />
      <EyeFilled
        sx={{
          opacity: 0,
          'input:checked ~ &': {
            opacity: 1,
            stroke: 'primary',
          },
        }}
      />
      <Eye
        sx={{
          opacity: 1,
          'input:checked ~ &': {
            opacity: 0,
            stroke: 'primary',
          },
        }}
      />
    </Box>
  )
}

export default EyeCheckbox
