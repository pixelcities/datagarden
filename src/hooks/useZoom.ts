import { RefObject, useState } from 'react'
import useEventListener from './useEventListener'

const MIN_ZOOM = 0.5
const MAX_ZOOM = 3

const useZoom = (ref: RefObject<HTMLElement | null>) => {
  const [zoom, setZoom] = useState(1)

  const updateScale = (delta: number, interval: number) => {
    setZoom(currentScale => {
      if (delta > 0 && currentScale + interval < MAX_ZOOM) {
        return currentScale + interval
      } else if (delta > 0) {
        return MAX_ZOOM
      } else if (delta < 0 && currentScale - interval > MIN_ZOOM) {
        return currentScale - interval
      } else if (delta < 0) {
        return MIN_ZOOM
      } else {
        return currentScale
      }
    })
  }

  useEventListener('wheel',
    ref,
    (e: WheelEvent) => {
      e.preventDefault();
      updateScale(e.deltaY, 0.1)
    },
    { passive: false }
  )

  return zoom
}

export default useZoom
