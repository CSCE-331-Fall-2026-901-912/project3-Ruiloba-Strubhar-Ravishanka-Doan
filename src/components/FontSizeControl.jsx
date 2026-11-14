import React from "react";

const MIN_SCALE = 0.8;
const MAX_SCALE = 1.6;
const STEP = 0.1;

export default function FontSizeControl({ scale, onScaleChange }) {
  const decrease = () => onScaleChange(Math.max(MIN_SCALE, Math.round((scale - STEP) * 100) / 100));
  const increase = () => onScaleChange(Math.min(MAX_SCALE, Math.round((scale + STEP) * 100) / 100));
  const reset = () => onScaleChange(1);

  return (
    <div className="font-size-control notranslate" role="group" aria-label="Change font size">
      <button type="button" onClick={decrease} aria-label="Decrease font size">A-</button>
      <button type="button" onClick={reset} aria-label="Reset font size">A</button>
      <button type="button" onClick={increase} aria-label="Increase font size">A+</button>
    </div>
  );
}
