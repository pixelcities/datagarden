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

