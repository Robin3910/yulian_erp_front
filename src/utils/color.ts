/**
 * 判断是否 十六进制颜色值.
 * 输入形式可为 #fff000 #f00
 *
 * @param   String  color   十六进制颜色值
 * @return  Boolean
 */
export const isHexColor = (color: string) => {
  const reg = /^#([0-9a-fA-F]{3}|[0-9a-fA-f]{6})$/
  return reg.test(color)
}

/**
 * RGB 颜色值转换为 十六进制颜色值.
 * r, g, 和 b 需要在 [0, 255] 范围内
 *
 * @return  String          类似#ff00ff
 * @param r
 * @param g
 * @param b
 */
export const rgbToHex = (r: number, g: number, b: number) => {
  // tslint:disable-next-line:no-bitwise
  const hex = ((r << 16) | (g << 8) | b).toString(16)
  return '#' + new Array(Math.abs(hex.length - 7)).join('0') + hex
}

/**
 * Transform a HEX color to its RGB representation
 * @param {string} hex The color to transform
 * @returns The RGB representation of the passed color
 */
export const hexToRGB = (hex: string, opacity?: number) => {
  let sHex = hex.toLowerCase()
  if (isHexColor(hex)) {
    if (sHex.length === 4) {
      let sColorNew = '#'
      for (let i = 1; i < 4; i += 1) {
        sColorNew += sHex.slice(i, i + 1).concat(sHex.slice(i, i + 1))
      }
      sHex = sColorNew
    }
    const sColorChange: number[] = []
    for (let i = 1; i < 7; i += 2) {
      sColorChange.push(parseInt('0x' + sHex.slice(i, i + 2)))
    }
    return opacity
      ? 'RGBA(' + sColorChange.join(',') + ',' + opacity + ')'
      : 'RGB(' + sColorChange.join(',') + ')'
  }
  return sHex
}

export const colorIsDark = (color: string) => {
  if (!isHexColor(color)) return
  const [r, g, b] = hexToRGB(color)
    .replace(/(?:\(|\)|rgb|RGB)*/g, '')
    .split(',')
    .map((item) => Number(item))
  return r * 0.299 + g * 0.578 + b * 0.114 < 192
}

/**
 * Darkens a HEX color given the passed percentage
 * @param {string} color The color to process
 * @param {number} amount The amount to change the color by
 * @returns {string} The HEX representation of the processed color
 */
export const darken = (color: string, amount: number) => {
  color = color.indexOf('#') >= 0 ? color.substring(1, color.length) : color
  amount = Math.trunc((255 * amount) / 100)
  return `#${subtractLight(color.substring(0, 2), amount)}${subtractLight(
    color.substring(2, 4),
    amount
  )}${subtractLight(color.substring(4, 6), amount)}`
}

/**
 * Lightens a 6 char HEX color according to the passed percentage
 * @param {string} color The color to change
 * @param {number} amount The amount to change the color by
 * @returns {string} The processed color represented as HEX
 */
export const lighten = (color: string, amount: number) => {
  color = color.indexOf('#') >= 0 ? color.substring(1, color.length) : color
  amount = Math.trunc((255 * amount) / 100)
  return `#${addLight(color.substring(0, 2), amount)}${addLight(
    color.substring(2, 4),
    amount
  )}${addLight(color.substring(4, 6), amount)}`
}

/* Suma el porcentaje indicado a un color (RR, GG o BB) hexadecimal para aclararlo */
/**
 * Sums the passed percentage to the R, G or B of a HEX color
 * @param {string} color The color to change
 * @param {number} amount The amount to change the color by
 * @returns {string} The processed part of the color
 */
const addLight = (color: string, amount: number) => {
  const cc = parseInt(color, 16) + amount
  const c = cc > 255 ? 255 : cc
  return c.toString(16).length > 1 ? c.toString(16) : `0${c.toString(16)}`
}

/**
 * Calculates luminance of an rgb color
 * @param {number} r red
 * @param {number} g green
 * @param {number} b blue
 */
const luminanace = (r: number, g: number, b: number) => {
  const a = [r, g, b].map((v) => {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722
}

/**
 * Calculates contrast between two rgb colors
 * @param {string} rgb1 rgb color 1
 * @param {string} rgb2 rgb color 2
 */
const contrast = (rgb1: string[], rgb2: number[]) => {
  return (
    (luminanace(~~rgb1[0], ~~rgb1[1], ~~rgb1[2]) + 0.05) /
    (luminanace(rgb2[0], rgb2[1], rgb2[2]) + 0.05)
  )
}

/**
 * Determines what the best text color is (black or white) based con the contrast with the background
 * @param hexColor - Last selected color by the user
 */
export const calculateBestTextColor = (hexColor: string) => {
  const rgbColor = hexToRGB(hexColor.substring(1))
  const contrastWithBlack = contrast(rgbColor.split(','), [0, 0, 0])

  return contrastWithBlack >= 12 ? '#000000' : '#FFFFFF'
}

/**
 * Subtracts the indicated percentage to the R, G or B of a HEX color
 * @param {string} color The color to change
 * @param {number} amount The amount to change the color by
 * @returns {string} The processed part of the color
 */
const subtractLight = (color: string, amount: number) => {
  const cc = parseInt(color, 16) - amount
  const c = cc < 0 ? 0 : cc
  return c.toString(16).length > 1 ? c.toString(16) : `0${c.toString(16)}`
}

// 预设颜色
export const PREDEFINE_COLORS = [
  '#ff4500',
  '#ff8c00',
  '#ffd700',
  '#90ee90',
  '#00ced1',
  '#1e90ff',
  '#c71585',
  '#409EFF',
  '#909399',
  '#C0C4CC',
  '#b7390b',
  '#ff7800',
  '#fad400',
  '#5b8c5f',
  '#00babd',
  '#1f73c3',
  '#711f57'
]
// 参考https://coolors.co/palettes/trending 生成颜色搭配组合
export const COLOR_ARRAYS = [
  [
    '#ff4500', '#1e90ff', '#ff00ff', '#00ff00', '#00bfa0',
    '#ff6347', '#00ffff', '#50e990', '#ffca3a', '#6a4c93'
  ],
  [
    '#008080', '#ff0000', '#5b8c5f', '#ff8c00', '#1f73c3',
    '#40e0d0', '#dc143c', '#00ced1', '#fad400', '#711f57'
  ],
  [
    '#8a2be2', '#ff1493', '#00ff7f', '#f9c74f', '#20b2aa',
    '#90be6d', '#ff7f50', '#4b0082', '#d2691e', '#0bb4ff'
  ],
  [
    '#e60049', '#00babd', '#adff2f', '#ff595e', '#c71585',
    '#43aa8b', '#da70d6', '#ff7800', '#800000', '#1982c4'
  ],
  [
    '#0000ff', '#9b19f5', '#a020f0', '#ff8a00', '#32cd32',
    '#5f9ea0', '#f94144', '#ee82ee', '#b7390b', '#6495ed'
  ],
  [
    '#44ff00', '#db7093', '#cd5c5c', '#00fa9a', '#ffa300',
    '#2e8b57', '#ba55d3', '#f8961e', '#e6d800', '#457b9d'
  ],
  [
    '#9400d3', '#00c2ff', '#ff69b4', '#a8dadc', '#ef476f',
    '#808000', '#f3722c', '#118ab2', '#ffd700', '#7b68ee'
  ],
  [
    '#dc0ab4', '#577590', '#6a5acd', '#06d6a0', '#800080',
    '#e63946', '#ffa07a', '#409eff', '#9500ff', '#f038ff'
  ],
  [
    '#ffd166', '#ffff00', '#00bfff', '#f4a460', '#daa520',
    '#ff0000', '#1e90ff', '#00ff00', '#ff00ff', '#ff4500'
  ],
  [
    '#00ffff', '#ff8c00', '#c71585', '#dc143c', '#00ced1',
    '#fad400', '#ff1493', '#5b8c5f', '#711f57', '#00babd'
  ],
  [
    '#ff7f50', '#adff2f', '#8a2be2', '#1f73c3', '#00ff7f',
    '#4b0082', '#ff6347', '#20b2aa', '#d2691e', '#0bb4ff'
  ],
  [
    '#e60049', '#90ee90', '#f9c74f', '#ff595e', '#da70d6',
    '#43aa8b', '#ff7800', '#90be6d', '#800000', '#1982c4'
  ],
  [
    '#0000ff', '#a020f0', '#ff8a00', '#ee82ee', '#32cd32',
    '#5f9ea0', '#b7390b', '#f94144', '#9b19f5', '#6495ed'
  ],
  [
    '#44ff00', '#cd5c5c', '#ffa300', '#db7093', '#00fa9a',
    '#2e8b57', '#e6d800', '#f8961e', '#ba55d3', '#457b9d'
  ],
  [
    '#9400d3', '#ff69b4', '#ef476f', '#00c2ff', '#a8dadc',
    '#808000', '#118ab2', '#f3722c', '#ffd700', '#7b68ee'
  ],
  [
    '#dc0ab4', '#06d6a0', '#800080', '#577590', '#6a5acd',
    '#e63946', '#409eff', '#ffa07a', '#9500ff', '#f038ff'
  ],
  [
    '#ffd166', '#00bfff', '#daa520', '#ffff00', '#f4a460',
    '#ff4500', '#00ff00', '#ff00ff', '#1e90ff', '#ff0000'
  ],
  [
    '#00ffff', '#c71585', '#fad400', '#ff8c00', '#dc143c',
    '#711f57', '#5b8c5f', '#ff1493', '#00ced1', '#00babd'
  ],
  [
    '#ff7f50', '#8a2be2', '#00ff7f', '#adff2f', '#1f73c3',
    '#d2691e', '#20b2aa', '#ff6347', '#4b0082', '#0bb4ff'
  ],
  [
    '#e60049', '#f9c74f', '#da70d6', '#90ee90', '#ff595e',
    '#800000', '#90be6d', '#ff7800', '#43aa8b', '#1982c4'
  ],
  [
    '#0000ff', '#ff8a00', '#32cd32', '#a020f0', '#ee82ee',
    '#6495ed', '#9b19f5', '#f94144', '#b7390b', '#5f9ea0'
  ],
  [
    '#44ff00', '#ffa300', '#00fa9a', '#cd5c5c', '#db7093',
    '#457b9d', '#ba55d3', '#f8961e', '#e6d800', '#2e8b57'
  ],
  [
    '#9400d3', '#ef476f', '#a8dadc', '#ff69b4', '#00c2ff',
    '#7b68ee', '#f3722c', '#ffd700', '#118ab2', '#808000'
  ],
  [
    '#dc0ab4', '#800080', '#6a5acd', '#06d6a0', '#577590',
    '#f038ff', '#9500ff', '#ffa07a', '#409eff', '#e63946'
  ],
  [
    '#00bfff', '#f4a460', '#ffd166', '#daa520', '#ffff00',
    '#ff0000', '#ff00ff', '#00ff00', '#ff4500', '#1e90ff'
  ],
  [
    '#00ffff', '#fad400', '#dc143c', '#c71585', '#ff8c00',
    '#00babd', '#00ced1', '#ff1493', '#5b8c5f', '#711f57'
  ],
  [
    '#ff7f50', '#00ff7f', '#1f73c3', '#adff2f', '#8a2be2',
    '#0bb4ff', '#4b0082', '#ff6347', '#20b2aa', '#d2691e'
  ],
  [
    '#e60049', '#da70d6', '#1982c4', '#90ee90', '#ff595e',
    '#43aa8b', '#ff7800', '#90be6d', '#800000', '#f9c74f'
  ],
  [
    '#0000ff', '#32cd32', '#ee82ee', '#a020f0', '#ff8a00',
    '#5f9ea0', '#b7390b', '#f94144', '#9b19f5', '#6495ed'
  ],
  [
    '#44ff00', '#00fa9a', '#db7093', '#cd5c5c', '#ffa300',
    '#2e8b57', '#e6d800', '#f8961e', '#ba55d3', '#457b9d'
  ]
]
