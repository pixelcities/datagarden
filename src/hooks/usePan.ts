import { useCallback, useRef, RefObject, useState } from 'react'
import useEventListener from './useEventListener'

import { Coords } from 'types'

const ORIGIN: {x: number, y: number} = Object.freeze({x: 0, y: 0})

const usePan = (ref: RefObject<HTMLElement | null>, zoom: number): Coords => {
  const [offset, setOffset] = useState<Coords>(ORIGIN)
  const prevPointRef = useRef(ORIGIN)

  const onPan = useCallback((e: MouseEvent) => {
    const prevPoint = prevPointRef.current
    const point = {x: e.pageX, y: e.pageY}
    prevPointRef.current = point

    setOffset(offset => {
      const delta = {
        x: (prevPoint.x - point.x) / zoom,
        y: (prevPoint.y - point.y) / zoom
      }
      return {
        x: offset.x + delta.x,
        y: offset.y + delta.y
      }
    })
  }, [ zoom ])


  const onRelease = useCallback(() => {
    document.removeEventListener('mousemove', onPan)
    document.removeEventListener('mouseup', onRelease)
  }, [onPan])

  const onPress = useCallback(
    (e: React.MouseEvent) => {
      document.addEventListener('mousemove', onPan)
      document.addEventListener('mouseup', onRelease)
      prevPointRef.current = {x: e.pageX, y: e.pageY}
    },
    [onPan, onRelease]
  )

  useEventListener('mousedown', ref, onPress)

  return offset
}

export default usePan
