export const toASCII = (str: string) => {
  let chars = str.split("")

  for (let i = 0; i < chars.length; i++) {
    const chr = chars[i].codePointAt(0)
    if (chr && chr > 128) {
      chars[i] = '?'
    }
  }

  return chars.join("")
}

export const toModNumber = (str: string, mod: number) => {
  const total = str
    .split("")
    .reduce((acc, x) => acc + x.codePointAt(0)!, 0)

  return total % mod
}

export const toColor = (str: string | undefined) => {
  // See: styles/_globals.sass
  const nrMagicColors = 20

  if (!str) {
    return 1
  }

  return toModNumber(str, nrMagicColors) + 1
}
