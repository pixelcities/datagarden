import React, { FC, useRef, useEffect, useState } from 'react';

import './Section.sass';

interface SectionProps {
  backdrop?: boolean
}

const Section: FC<SectionProps> = (props) => {
  const targetRef = useRef<HTMLDivElement | null>(null)
  const [height, setDimensions] = useState(0);

  useEffect(() => {
    if (targetRef.current) {
      setDimensions(targetRef.current.offsetHeight)
    }
  }, []);

  return (
    <section ref={targetRef} className="section-fullheight" style={ props.backdrop && height > window.innerHeight ? { marginBottom: 85 } : {}}>
      {props.children}
    </section>
  )
}

Section.defaultProps = {
  backdrop: false
}

export default Section;
