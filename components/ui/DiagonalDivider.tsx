import React from "react";

interface DiagonalDividerProps {
  fillColor?: string;
  height?: number;
  className?: string;
  isReversed?: boolean;
}

export function DiagonalDivider({
  fillColor = "#ffffff",
  height = 60,
  className = "",
  isReversed = false,
}: DiagonalDividerProps) {
  return (
    <div className={`relative w-full overflow-hidden z-20 ${className}`} style={{ height: `${height}px` }}>
      <svg
        className="absolute bottom-0 left-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {!isReversed ? (
          <polygon 
            fill={fillColor} 
            points="0,100 100,0 100,100"
          />
        ) : (
          <polygon 
            fill={fillColor} 
            points="0,0 100,100 0,100"
          />
        )}
      </svg>
    </div>
  );
} 