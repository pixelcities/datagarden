import { useRef, useEffect, RefObject } from 'react'

export default function useEventListener<T extends HTMLElement = HTMLDivElement>(
  eventName: string,
  element: RefObject<T | null> | null,
  handler: (event: any) => void,
  options?: AddEventListenerOptions
) {
  const savedHandler = useRef<(event: any) => void>()

  useEffect(() => {
    const targetElement: T | Window = element?.current || window
    if (!(targetElement && targetElement.addEventListener)) {
      return
    }

    if (savedHandler.current !== handler) {
      savedHandler.current = handler
    }

    const eventListener = (event: any) => {
      // eslint-disable-next-line no-extra-boolean-cast
      if (!!savedHandler?.current) {
        savedHandler.current(event)
      }
    }

    targetElement.addEventListener(eventName, eventListener, options)

    return () => {
      targetElement.removeEventListener(eventName, eventListener)
    }
  }, [ eventName, element, handler, options ])
}

