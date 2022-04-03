import { Attribute } from 'types'

export const columnPadding = (columns: Attribute[] | undefined) => {
  const padLength = 26 - (columns?.length ?? 0)

  if (padLength > 0) {
    const padItems = Array(padLength).fill(0).map((_, i) => {return {"Header": "", "accessor": i.toString()}})
    return [...columns ?? [], ...padItems]
  }

  return columns
}

export const scrollbarWidth = () => {
  const scrollDiv = document.createElement('div')
  scrollDiv.setAttribute('style', 'width: 100px; height: 100px; overflow: scroll; position:absolute; top:-9999px;')
  document.body.appendChild(scrollDiv)
  const scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth
  document.body.removeChild(scrollDiv)
  return scrollbarWidth
}

