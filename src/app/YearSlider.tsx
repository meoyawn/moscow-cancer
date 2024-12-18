import React, { type Dispatch, type JSX } from "react"

export const YearSlider = ({
  value,
  setValue,
  min,
  max,
}: {
  value: number
  setValue: Dispatch<number>
  min: number
  max: number
}): JSX.Element => (
  <div className="flex flex-col">
    <input
      className="pointer-events-auto h-11"
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={e => setValue(e.target.valueAsNumber)}
    />

    <div className="flex flex-row justify-between">
      <span className="text-lg font-bold">{value}</span>
      <span>{max}</span>
    </div>
  </div>
)
