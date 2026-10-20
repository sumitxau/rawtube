import React from "react";

interface LoaderProps {
  className?: string;
  size?: number; // size in px, defaults to 140
  text?: string;
}

export function Loader({ className = "", size = 140, text }: LoaderProps) {
  return (
    <div className={`rt-loader ${className}`}>
      <div
        className="rt-loader-wrapper"
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        <div className="rt-loader-circle" />
        {text && <span className="relative z-10 text-xs font-medium text-white">{text}</span>}
      </div>
    </div>
  );
}
