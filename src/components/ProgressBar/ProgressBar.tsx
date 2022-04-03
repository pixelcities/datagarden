import React, { FC, useState, useEffect } from 'react'

interface ProgressBarProps {
  duration: number,
  progress?: number,
  resolve?: () => void
}

/*
 * Load a ProgressBar for the given duration
 *
 * Optional params:
 *   `progress`:  A float indicating the current real progress. This will act as a guard and slow
 *                down the progress bar if it is outracing the caller.
 *   `resolve`:   Function to call when the progress bar has smoothly reached 100%.
 */
const ProgressBar: FC<ProgressBarProps> = (props) => {
  const { duration, progress, resolve } = props
  const step = Math.min(duration / 100, 100)

  const [value, setValue] = useState(0)

  useEffect(() => {
    let timeoutID = 0;

    if (value < duration) {
      timeoutID = window.setTimeout(() => {
        if (progress && value > (duration * progress)) {
          setValue(value + step * .1)
        } else {
          setValue(value + step)
        }
      }, step)
    } else if (resolve) {
      resolve();
    }

    return () => window.clearTimeout(timeoutID);
  }, [ duration, progress, resolve, step, value ])

  return (
    <div className="container" style={{height: "100vh"}} >
      <div className="div is-vcentered mx-8" >
        <progress className="progress is-primary" value={value} max={duration} />
      </div>
    </div>
  )
}

export default ProgressBar
