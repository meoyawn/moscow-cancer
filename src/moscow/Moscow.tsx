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

const getText = (p: GeoProps) => `${name(p)}\n${years[iso(p)]}`

const getTooltip = ({ object }: PickInfo<Feat>): Tooltip =>
  object?.properties ? { text: getText(object?.properties) } : null

const polygonsStroke: PathLayerProps<Feature<LineString>> = {
  getColor: [255, 255, 255],
  getWidth: 1000,
  widthMinPixels: 0.1,
}

const moscowYear = years["RU-MOW"][0]
const nowYear = new Date().getFullYear()
const moscowFromNow = nowYear - moscowYear

const toRGB = (c: HSLColor): RGBAColor => {
  const { r, g, b } = c.rgb()
  return [r, g, b]
}

const getFillColor = ({ properties }: Feat): RGBAColor => {
  const arr = years[iso(properties)]
  if (arr?.length === 2) {
    return toRGB(hsl(138, 0.75, 1 - (arr[1] - arr[0]) / moscowFromNow))
  }
  if (arr?.length === 1) {
    return toRGB(hsl(0, 0.75, (arr[0] - moscowYear) / moscowFromNow))
  }
  return [0, 0, 0, 0]
}

const data = (
  [...russia.features, ...countries.features] as ReadonlyArray<Feat>
).filter((f) => iso(f.properties) in years)

export const Moscow = (): JSX.Element => (
  <DeckGL
    views={[new GlobeView({ resolution: 10 })]}
    layers={[
      new GeoJsonLayer<Feat>({
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
        data,
        getPosition: (f) =>
          turfCentroid(f.geometry as any).geometry.coordinates as any,
        getText: (f) => getText(f.properties),
        sizeUnits: "meters",
        getSize: 17_000,
        getTextAnchor: "middle",
        getAlignmentBaseline: "center",
        parameters: { depthTest: false },
        fontFamily: "sans-serif",
      }),
    ]}
    initialViewState={{
      latitude: 55.751244,
      longitude: 37.618423,
      zoom: 2,
      minZoom: 0,
      maxZoom: 20,
    }}
    controller={true}
    // @ts-ignore
    getTooltip={getTooltip}
  />
)
