import { get, Theme } from 'theme-ui'
import { ExpressionSpecification } from 'maplibre-gl'
import { FireProperties } from '@/types/location'

// MAX is the latest complete mapping year; recent years lag ~1-2 yrs (extended
// assessments need next-season imagery), so they're excluded. Bump when MTBS
// catches up.
export const FIRE_MIN_YEAR = 1984
export const FIRE_MAX_YEAR = 2024

// Recency is baked into an opaque fill color (red composited over the background
// at these alphas) so overlapping old burns can't accumulate alpha and look recent.
const FILL_ALPHA_MIN = 0.12
const FILL_ALPHA_MAX = 0.6
const LINE_OPACITY_MIN = 0.35
const LINE_OPACITY_MAX = 1

// Null-safe year (a few fires lack an ignition date).
const yearInput: ExpressionSpecification = [
  'to-number',
  ['coalesce', ['get', 'year'], FIRE_MIN_YEAR],
] as ExpressionSpecification

// Higher sort-key draws on top, so recent fires sit above older overlaps.
export const fireYearSortKey: ExpressionSpecification = yearInput

// At/after the cutoff and at/before the latest complete year.
const inYearWindow = (startYear: number): ExpressionSpecification =>
  [
    'all',
    ['>=', yearInput, startYear],
    ['<=', yearInput, FIRE_MAX_YEAR],
  ] as ExpressionSpecification

// Opaque within the window, hidden outside (recency is in the color, not opacity).
export const fireFillOpacityExpression = (
  startYear: number,
): ExpressionSpecification =>
  ['case', inYearWindow(startYear), 1, 0] as ExpressionSpecification

// Selected fire(s) within the window, fully opaque.
export const fireHighlightOpacityExpression = (
  startYear: number,
): ExpressionSpecification =>
  [
    'case',
    [
      'all',
      ['boolean', ['feature-state', 'selected'], false],
      ['>=', yearInput, startYear],
      ['<=', yearInput, FIRE_MAX_YEAR],
    ],
    1,
    0,
  ] as ExpressionSpecification

// Outline opacity: recency ramp within the window.
export const fireLineOpacityExpression = (
  startYear: number,
): ExpressionSpecification =>
  [
    'case',
    inYearWindow(startYear),
    [
      'interpolate',
      ['linear'],
      yearInput,
      FIRE_MIN_YEAR,
      LINE_OPACITY_MIN,
      FIRE_MAX_YEAR,
      LINE_OPACITY_MAX,
    ],
    0,
  ] as ExpressionSpecification

// Recency opacity for the sidebar swatch (matches the outline ramp).
export const fireOpacityForYear = (year: number): number => {
  const y = Math.max(FIRE_MIN_YEAR, Math.min(FIRE_MAX_YEAR, year))
  const t = (y - FIRE_MIN_YEAR) / (FIRE_MAX_YEAR - FIRE_MIN_YEAR)
  return LINE_OPACITY_MIN + (LINE_OPACITY_MAX - LINE_OPACITY_MIN) * t
}

const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '')
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h
  const n = parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

// Composite red over the theme background -> an opaque color.
const redOverBackground = (theme: Theme, alpha: number): string => {
  const [r, g, b] = hexToRgb(get(theme, 'rawColors.red'))
  const [br, bg, bb] = hexToRgb(get(theme, 'rawColors.background'))
  const blend = (fg: number, base: number) =>
    Math.round(fg * alpha + base * (1 - alpha))
  return `rgb(${blend(r, br)}, ${blend(g, bg)}, ${blend(b, bb)})`
}

// Opaque recency color ramp: faint (old) -> bold (recent).
export const fireFillColorExpression = (
  theme: Theme,
): ExpressionSpecification =>
  [
    'interpolate',
    ['linear'],
    yearInput,
    FIRE_MIN_YEAR,
    redOverBackground(theme, FILL_ALPHA_MIN),
    FIRE_MAX_YEAR,
    redOverBackground(theme, FILL_ALPHA_MAX),
  ] as ExpressionSpecification

// Same ramp as a Colorbar colormap ("r, g, b" strings) for the sidebar legend.
export const fireRecencyColormap = (theme: Theme, steps = 16): string[] => {
  const [fR, fG, fB] = hexToRgb(get(theme, 'rawColors.red'))
  const [bR, bG, bB] = hexToRgb(get(theme, 'rawColors.background'))
  return Array.from({ length: steps }, (_, i) => {
    const alpha =
      FILL_ALPHA_MIN + (FILL_ALPHA_MAX - FILL_ALPHA_MIN) * (i / (steps - 1))
    const blend = (fg: number, base: number) =>
      Math.round(fg * alpha + base * (1 - alpha))
    return `${blend(fR, bR)}, ${blend(fG, bG)}, ${blend(fB, bB)}`
  })
}

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

// Month + day only; the year is shown separately in the card header.
export const formatIgnitionMonthDay = (igDate?: string): string => {
  if (!igDate) return '—'
  const [, m, d] = igDate.split('-')
  const monthIndex = parseInt(m, 10) - 1
  if (Number.isNaN(monthIndex) || !MONTHS[monthIndex]) return igDate
  return `${MONTHS[monthIndex]} ${parseInt(d, 10)}`
}

export const formatAcres = (acres?: number): string => {
  if (acres == null || Number.isNaN(acres)) return '—'
  return `${Math.round(acres).toLocaleString('en-US')} acres`
}

// MTBS names are uppercase ("HELLS HOLLOW").
export const formatFireName = (name?: string): string => {
  if (!name || !name.trim()) return 'Unnamed fire'
  return name.replace(
    /\w\S*/g,
    (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
  )
}

export const sortFiresByRecency = (fires: FireProperties[]): FireProperties[] =>
  [...fires].sort((a, b) => b.year - a.year)
