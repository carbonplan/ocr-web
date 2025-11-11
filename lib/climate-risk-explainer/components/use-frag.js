import { BIN_BOUNDARIES } from './use-colormap'

const discard = `
  if (rps == nullValue || rps == clim.x ) {
    discard;
    return;
  }
`

const useFrag = () => {
  const binConditions = BIN_BOUNDARIES.slice(0, -1)
    .map((_, i) => {
      const condition = i === 0 ? 'if' : 'else if'
      return `
      ${condition} (rps < ${BIN_BOUNDARIES[i + 1].toFixed(6)}) {
        binIndex = ${i}.0;
      }`
    })
    .join('')

  const lastBinIndex = BIN_BOUNDARIES.length - 1

  return `
      float rps = value.x;
      ${discard}
      float binIndex = 0.0;
      ${binConditions} else {
        binIndex = ${lastBinIndex}.0;
      }
      float rescaled = binIndex / ${BIN_BOUNDARIES.length}.0; 
      vec4 c = texture2D(lut, vec2(rescaled, 1.0));
      gl_FragColor = vec4(c.x, c.y, c.z, 1.0);

    `
}

export default useFrag
