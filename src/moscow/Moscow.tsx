// @ts-ignore
import { _GlobeView as GlobeView, COORDINATE_SYSTEM } from "@deck.gl/core"

import React from "react"
import { hsl, HSLColor } from "d3-color"
import type { PickInfo } from "@deck.gl/core/lib/deck"
import DeckGL from "@deck.gl/react"
import { GeoJsonLayer, TextLayer } from "@deck.gl/layers"
import type { PathLayerProps } from "@deck.gl/layers/path-layer/path-layer"
import type { RGBAColor } from "@deck.gl/core/utils/color"
import type { Feature, Geometry, LineString } from "@turf/helpers"
import turfCentroid from "@turf/centroid"

import russia from "./russia.json"
import years from "./years.json"
import countries from "./countries.json"
import states from "./states.json"

type RegionISO = keyof typeof years

type GeoProps =
  | {
      ISO_A2: RegionISO
      ADMIN: string
    }
  | {
      shapeISO: RegionISO
      shapeName: string
    }

type Feat = Feature<Geometry, GeoProps>

type Tooltip =
  | null
  | string
  | {
      text?: string
      html?: string
      className?: string
      style?: {}
    }

const name = (p: GeoProps) => ("ISO_A2" in p ? p.ADMIN : p.shapeName)
const iso = (p: GeoProps) => ("ISO_A2" in p ? p.ISO_A2 : p.shapeISO)

const getText = (p: GeoProps) =>
  iso(p) in years ? `${name(p)}\n${years[iso(p)]}` : name(p)

const getTooltip = ({ object }: PickInfo<Feat>): Tooltip =>
  object?.properties ? { text: getText(object?.properties) } : null

const BLACK: RGBAColor = [0, 0, 0]
const WHITE: RGBAColor = [255, 255, 255]

const polygonsStroke: PathLayerProps<Feature<LineString>> = {
  getColor: WHITE,
  getWidth: 1000,
  widthMinPixels: 0.1,
}

const moscowYear = years["RU-MOS"][0]
const nowYear = new Date().getFullYear()
const moscowFromNow = nowYear - moscowYear

const toRGB = (c: HSLColor): RGBAColor => {
  const { r, g, b } = c.rgb()
  return [r, g, b]
}

const hslColor = ({ properties }: Feat): HSLColor => {
  const arr = years[iso(properties)]
  if (arr?.length === 2) {
    return hsl(142, 0.76, 1 - (arr[1] - arr[0]) / moscowFromNow)
  }
  if (arr?.length === 1) {
    return hsl(0, 0.72, (arr[0] - moscowYear) / moscowFromNow)
  }
  return hsl("white")
}

const contrastColor = (feat: Feat): RGBAColor =>
  hslColor(feat).l > 0.5 ? BLACK : WHITE

const getFillColor = (feat: Feat): RGBAColor => toRGB(hslColor(feat))

const data = (
  [...russia.features, ...countries.features, ...states.features] as Feat[]
).filter((f) => iso(f.properties) in years)

const Moscow = (): JSX.Element => (
  <DeckGL
    views={[new GlobeView({ resolution: 10 })]}
    layers={[
      new GeoJsonLayer<Feat>({
        id: "regions",
        data,
        filled: true,
        pickable: true,
        stroked: true,
        getFillColor,
        _subLayerProps: {
          "polygons-stroke": polygonsStroke,
        },
      }),
      new TextLayer<Feat>({
        id: "text",
        data,
        sizeUnits: "meters",
        getSize: 17_000,
        getTextAnchor: "middle",
        getAlignmentBaseline: "center",
        parameters: { depthTest: false },
        fontFamily: "sans-serif",
        getPosition: (f) =>
          turfCentroid(f.geometry as any).geometry.coordinates as any,
        getText: (f) => getText(f.properties),
        getColor: contrastColor,
      }),
    ]}
    initialViewState={{
      latitude: 55.751244,
      longitude: 37.618423,
      zoom: 3,
      minZoom: 0,
      maxZoom: 20,
    }}
    controller={true}
    // @ts-ignore
    getTooltip={getTooltip}
    parameters={{ cull: true }}
  />
)

const legend: ReadonlyArray<{ className: string; text: string }> = [
  { className: "bg-black", text: "Moscow" },
  { className: "bg-red-600", text: "Conquered" },
  { className: "bg-green-600", text: "Liberated" },
]

export const Legended = (): JSX.Element => (
  <div className="h-screen w-full">
    <Moscow />
    <div className="pointer-events-none absolute flex flex-col space-y-2 p-5">
      <h1 className="text-2xl">Territories of Muscovy by year of conquest</h1>

      {legend.map(({ className, text }) => (
        <div key={text} className="flex items-center space-x-1">
          <div className={`h-5 w-5 ${className}`}></div>
          <p>{text}</p>
        </div>
      ))}
    </div>
  </div>
)
