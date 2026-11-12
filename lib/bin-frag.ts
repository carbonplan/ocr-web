export type BinFragOptions = {
  // bins are classes, so zero is a class rather than no data
  categorical?: boolean
  // store values outside this range are no data
  validRange?: [number, number]
  // color along the ramp between the first and last boundary rather than in bins
  continuous?: boolean
  colormapLength?: number
}

// Fragment shader body that bins a variable by boundaries in display units and
// paints the bin's colormap swatch, matching the buildings layer's colormap[i+1]
// convention for bin i.
export const buildBinFrag = (
  boundaries: number[],
  variable: string,
  unitScale: number,
  {
    categorical = false,
    validRange,
    continuous = false,
    colormapLength = 0,
  }: BinFragOptions = {},
): string => {
  const valueExpression =
    unitScale === 1 ? variable : `${variable} * ${unitScale.toFixed(6)}`

  const outOfRange = validRange
    ? ` || ${variable} < ${validRange[0].toFixed(6)} || ${variable} > ${validRange[1].toFixed(6)}`
    : ''

  if (continuous) {
    const [lo, hi] = [boundaries[0], boundaries[boundaries.length - 1]]
    const n = colormapLength
    return `
      float value = ${valueExpression};
      if (isnan(value)${outOfRange}) {
        discard;
      }
      float t = clamp((value - ${lo.toFixed(6)}) / ${(hi - lo).toFixed(6)}, 0.0, 1.0);
      // skip the leading no-data swatch and land on sample centers
      float coord = (1.5 + t * ${(n - 2).toFixed(1)}) / ${n.toFixed(1)};
      vec4 c = texture(colormap, vec2(coord, 0.5));
      fragColor = vec4(c.rgb * opacity, opacity);
    `
  }

  const binConditions = boundaries
    .slice(0, -1)
    .map((_, i) => {
      const condition = i === 0 ? 'if' : 'else if'
      return `
      ${condition} (value < ${boundaries[i + 1].toFixed(6)}) {
        binIndex = ${i}.0;
      }`
    })
    .join('')

  const lastBinIndex = boundaries.length - 1

  return `
      float value = ${valueExpression};
      if (isnan(value)${categorical ? '' : ' || value == 0.0'}${outOfRange}) {
        discard;
      }
      float binIndex = 0.0;
      ${binConditions} else {
        binIndex = ${lastBinIndex}.0;
      }
      float rescaled = (binIndex + 1.5) / ${boundaries.length + 1}.0;
      vec4 c = texture(colormap, vec2(clamp(rescaled, 0.0, 1.0), 0.5));
      fragColor = vec4(c.rgb * opacity, opacity);
    `
}
