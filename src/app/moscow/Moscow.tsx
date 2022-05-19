import React, { useState } from "react"
import { hsl, HSLColor } from "d3-color"
import type { PickInfo } from "@deck.gl/core/lib/deck"
import DeckGL from "@deck.gl/react"
import { GeoJsonLayer, TextLayer } from "@deck.gl/layers"
import type { PathLayerProps } from "@deck.gl/layers/path-layer/path-layer"
import type { RGBAColor } from "@deck.gl/core/utils/color"
import type { Feature, Geometry, LineString } from "@turf/helpers"
import turfCentroid from "@turf/centroid"

import { SEO } from "../../SEO"
import { Tooltip } from "../../lib/deck"
import { ofType } from "../../lib/typescript"
import { BLACK, GLOBE_VIEW, WHITE } from "../deck"

import russia from "./russia.json"
import years from "./years.json"
import countries from "../../countries.json"
import states from "./states.json"
import { YearSlider } from "../YearSlider"

type RegionISOA2 = keyof typeof years

type GeoProps =
  | {
      ISO_A2: RegionISOA2
      ADMIN: string
    }
  | {
      shapeISO: RegionISOA2
      shapeName: string
    }

type Feat = Feature<Geometry, GeoProps>

const name = (p: GeoProps) => ("ISO_A2" in p ? p.ADMIN : p.shapeName)
const iso = (p: GeoProps) => ("ISO_A2" in p ? p.ISO_A2 : p.shapeISO)

const getText = ({ properties }: Feat) => {
  const [from, to] = years[iso(properties)]
  return `${name(properties)}\n${from}-${to ?? ""}`
}

const getTooltip = ({ object }: PickInfo<Feat>): Tooltip =>
  object?.properties ? { text: getText(object) } : null

const startYear = years["RU-MOS"][0]
const endYear = new Date().getFullYear()

const toRGB = (c: HSLColor): RGBAColor => {
  const { r, g, b } = c.rgb()
  return [r, g, b]
}

const GREEN_HUE = 142
const RED_HUE = 0

const hslColor = ({ properties }: Feat, year: number): HSLColor => {
  const arr = years[iso(properties)]

  const yearsFromStart = year - startYear

  if (arr?.length === 2 && arr[1] < year) {
    return hsl(GREEN_HUE, 0.76, 1 - (arr[1] - arr[0]) / yearsFromStart)
  }

  return hsl(RED_HUE, 0.72, (arr[0] - startYear) / yearsFromStart)
}

const contrastColor =
  (year: number) =>
  (feat: Feat): RGBAColor =>
    hslColor(feat, year).l > 0.5 ? BLACK : WHITE

const fillColor =
  (year: number) =>
  (feat: Feat): RGBAColor =>
    toRGB(hslColor(feat, year))

const initialData = (
  [...russia.features, ...countries.features, ...states.features] as Feat[]
).filter((f) => iso(f.properties) in years)

const MoscowGlobe = ({ year }: { year: number }): JSX.Element => {
  const data = initialData.filter((x) => years[iso(x.properties)][0] <= year)
  const getFillColor = fillColor(year)
  const getColor = contrastColor(year)
  return (
    <DeckGL
      views={GLOBE_VIEW}
      layers={[
        new GeoJsonLayer<Feat>({
          id: "regions",
          data,
          filled: true,
          pickable: true,
          stroked: true,
          getFillColor,
          _subLayerProps: {
            "polygons-stroke": ofType<PathLayerProps<Feature<LineString>>>({
              getColor: WHITE,
              getWidth: 1000,
              widthMinPixels: 0.1,
            }),
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
          getText,
          getColor,
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
}

const legend: ReadonlyArray<{ className: string; text: string }> = [
  { className: "bg-black", text: "Moscow" },
  { className: "bg-red-600", text: "Conquered" },
  { className: "bg-green-600", text: "Liberated" },
]

const Legend = () => (
  <>
    {legend.map(({ className, text }) => (
      <div key={text} className="flex items-center space-x-1">
        <div className={`h-5 w-5 ${className}`}></div>
        <p>{text}</p>
      </div>
    ))}
  </>
)

export const Legendary = (): JSX.Element => {
  const [year, setYear] = useState(endYear)

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <SEO title="Moscow cancer by the year of metastasis" />

      <MoscowGlobe year={year} />

      <div className="pointer-events-none absolute flex flex-col space-y-2 p-5">
        <h1 className=" text-2xl">
          Territories of Muscovy by year of conquest
        </h1>

        <YearSlider
          value={year}
          setValue={setYear}
          min={startYear}
          max={endYear}
        />

        {/*<Legend />*/}
      </div>
    </div>
  )
}
