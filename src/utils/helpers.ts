import { useMemo } from 'react'
import { User, Schema } from 'types'

export {
  altAsSvg
} from './_helpers'

export const toHex = (byteArray: Uint8Array): string => {
  return Array.from(byteArray, (byte) => (byte < 16 ? '0' : '') + (byte).toString(16)).join('')
}

export const fromHex = (hex: string): Uint8Array => {
  return new Uint8Array(hex.match(/.{2}/g)!.map(x => parseInt(x, 16)))
}

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

export const isAuthorized = (user: User | undefined, schema: Schema): boolean => {
  return !!schema.shares.find(s => s.principal === user?.id)
}

export const getColumnIds = (user: User | undefined, schema: Schema): string[] => {
  return schema.columns.filter(column => {
    return !!column.shares.find(s => s.principal === user?.id)
  }).map(x => x.id)
}

export const toRelativeTime = (datetime: string | undefined): string | undefined => {
  if (datetime) {
    const rtf = new Intl.RelativeTimeFormat("en", {
      localeMatcher: "best fit",
      numeric: "auto",
      style: "long"
    })

    const minutes = (Date.now() - Date.parse(datetime.split("Z").length > 1 ? datetime : datetime + "Z")) / 1000 / 60
    if (minutes < 60) {
      return rtf.format(Math.round(-minutes), "minutes")
    }

    const hours = minutes / 60
    if (hours < 24) {
      return rtf.format(Math.round(-hours), "hours")
    }

    const days = hours / 24
    if (days < 28) {
      return rtf.format(Math.round(-days), "days")
    }

    if (days < 335) {
      const months = -(days / (365 / 12))
      return rtf.format(Math.abs(months) < 1 ? Math.sign(months) : Math.round(months), "months")
    }

    const years = -(days / 365)
    return rtf.format(Math.abs(years) < 1 ? Math.sign(years) : Math.round(years), "years")
  }
}

export const saveState = (state: any[]): string => {
  return JSON.stringify(state.map(x => JSON.stringify(x)))
}

export const loadState = (state: string, setters: any[]): void => {
  JSON.parse(state).forEach((x: any, i: number) => setters[i](JSON.parse(x)))
}

export const useConst = (x: any) => useMemo(() => x, [x])

