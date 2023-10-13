import { RefObject, useRef, useState, useMemo } from 'react'
import useEventListener from './useEventListener'

const BUFFER = 10
const STRAY = 2


/*
 * Track mouse movement for the given (form) element
 *
 * The hook will return true as soon as the mouse moves just slightly, in order
 * to prevent bots from filling in the form. In case a bot does use mouse actions,
 * the hook will attempt to detect the mouse jumping between input centroids.
 */
const useMovement = (ref: RefObject<HTMLElement | null>) => {
  const [valid, setValid] = useState(false)
  const [lastHit, setLastHit] = useState<number | undefined>()
  const totalRef = useRef(0)
  const badRef = useRef(0)
  const historyRef = useRef<number[][]>([])

  const centers = useMemo(() => {
    let arr = []

    if (ref.current) {
      for (const input of ref.current.getElementsByTagName("input")) {
        const rect = input.getBoundingClientRect()

        const x = rect.x + (rect.right - rect.left) / 2
        const y = rect.y + (rect.bottom - rect.top) / 2

        arr.push([x, y])
      }
    }

    return arr
  }, [ ref ])

  const recordPath = (x: number, y: number) => {
    totalRef.current++

    if (lastHit !== undefined) {
      historyRef.current.push([x, y])
    }

    for (let i = 0; i < centers.length; i++) {
      if (x > centers[i][0] - BUFFER && x < centers[i][0] + BUFFER && y > centers[i][1] - BUFFER && y < centers[i][1] + BUFFER) {
        if (lastHit !== undefined && lastHit !== i) {
          let badPath = true

          for (const pt of historyRef.current) {
            if (getDistFromPath(centers[lastHit], centers[i], pt) > STRAY) {
              badPath = false
            }
          }

          if (badPath) {
            badRef.current += historyRef.current.length
          }

          historyRef.current = []
        }
        setLastHit(i)
      }
    }

    setValid(totalRef.current > 10 && badRef.current / totalRef.current < 0.5)
  }

  useEventListener('mousemove',
    ref,
    (e: MouseEvent) => {
      e.preventDefault()
      recordPath(e.clientX, e.clientY)
    },
    { passive: false }
  )

  return valid
}


const dist = (p1: number[], p2: number[]) => {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  return Math.sqrt(dx * dx + dy * dy)
}


// http://www.faqs.org/faqs/graphics/algorithms-faq/ (Subject 1.02: How do I find the distance from a point to a line?)
const getDistFromPath = (a: number[], b: number[], c: number[]) => {
  const r = ((c[0] - a[0]) * (b[0] - a[0]) + (c[1] - a[1]) * (b[1] - a[1])) / ((b[0] - a[0]) * (b[0] - a[0]) + (b[1] - a[1]) * (b[1] - a[1]))

  if (r < 0.0) {
    return dist(c, a)
  } else if (r >= 1.0) {
    return dist(c, b)
  }

  const px = a[0] + r * (b[0] - a[0]);
  const py = a[1] + r * (b[1] - a[1]);

  return dist(c, [px, py])
}


export default useMovement
