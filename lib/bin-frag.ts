// Fragment shader body that bins a variable by boundaries in display units and
// paints the bin's colormap swatch, matching the buildings layer's colormap[i+1]
// convention for bin i.
export const buildBinFrag = (
  boundaries: number[],
  variable: string,
  unitScale: number,
): string => {
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
  const valueExpression =
    unitScale === 1 ? variable : `${variable} * ${unitScale.toFixed(6)}`

  return `
      float value = ${valueExpression};
      if (isnan(value) || value == 0.0) {
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
