import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'
import { ThemeUIStyleObject } from 'theme-ui'

// tucks under the sidebar's top padding before pinning
const BASE_TOP = -25
const BASE_Z = 10

type StickyContextValue = {
  heights: number[]
  setHeight: (index: number, height: number) => void
}

const StickyContext = createContext<StickyContextValue | null>(null)

export const StickyStack = ({ children }: { children: ReactNode }) => {
  const [heights, setHeights] = useState<number[]>([])
  const setHeight = useCallback((index: number, height: number) => {
    setHeights((prev) => {
      if ((prev[index] ?? 0) === height) return prev
      const next = [...prev]
      next[index] = height
      return next
    })
  }, [])
  const value = useMemo(() => ({ heights, setHeight }), [heights, setHeight])
  return (
    <StickyContext.Provider value={value}>{children}</StickyContext.Provider>
  )
}

// Sticky positioning for one block in the stack: each block pins below the
// measured blocks above it, so variable heights (extra filter rows, expanded
// tooltips) keep the offsets true. Outside a StickyStack the block gets the
// static fallbackTop, or no positioning when that is omitted.
export const useStickyBlock = (
  index: number,
  { fallbackTop = null }: { fallbackTop?: number | null } = {},
): { ref: (node: HTMLDivElement | null) => void; sx: ThemeUIStyleObject } => {
  const context = useContext(StickyContext)
  const observerRef = useRef<ResizeObserver | null>(null)
  const setHeight = context?.setHeight
  const ref = useCallback(
    (node: HTMLDivElement | null) => {
      observerRef.current?.disconnect()
      observerRef.current = null
      if (!setHeight) return
      if (!node) {
        setHeight(index, 0)
        return
      }
      const observer = new ResizeObserver(() =>
        setHeight(index, node.getBoundingClientRect().height),
      )
      observer.observe(node)
      observerRef.current = observer
      setHeight(index, node.getBoundingClientRect().height)
    },
    [index, setHeight],
  )

  const top = context
    ? BASE_TOP +
      context.heights.slice(0, index).reduce((sum, h) => sum + (h ?? 0), 0)
    : fallbackTop
  const sx: ThemeUIStyleObject =
    top === null ? {} : { position: 'sticky', top, zIndex: BASE_Z - index }
  return { ref, sx }
}
