import React, { useRef, useEffect } from 'react';

interface Offset {
  x: number;
  y: number;
}

interface CanvasProps {
  width: number;
  height: number;
  offset: Offset;
}

const Canvas = ({ width, height, offset}: CanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);


  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);

        //context.beginPath();
        //context.moveTo(100+1-offset.x, 300-offset.y);
        //context.lineTo(500+1-offset.x, 300-offset.y);
        //context.stroke();
        //context.closePath();
      }
    }
  },[height, offset]);

  return <canvas ref={canvasRef} height={height} width={width} />;
};

Canvas.defaultProps = {
  width: window.innerWidth,
  height: window.innerHeight
};

export default Canvas;
