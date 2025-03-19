declare module '@carbonplan/layouts' {
  import { ReactNode } from 'react'

  interface SidebarProps {
    expanded?: boolean
    side?: 'left' | 'right'
    width?: number
    children?: ReactNode
  }

  export const Sidebar: React.FC<SidebarProps>
}

declare module '@carbonplan/icons' {
  import { FC } from 'react'

  export const RotatingArrow: FC
}

declare module '@carbonplan/components' {
  import { ReactNode } from 'react'

  interface HeaderProps {
    sx?: Record<string, any>
    children?: ReactNode
  }

  export const Header: React.FC<HeaderProps>
  export const Badge: React.FC<{
    sx?: Record<string, any>
    children?: ReactNode
  }>
  export const Button: React.FC<{
    prefix?: ReactNode
    suffix?: ReactNode
    children?: ReactNode
    sx?: Record<string, any>
  }>
}
