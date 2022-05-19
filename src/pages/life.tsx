import countries from "../countries.json"

import React, { useEffect, useState } from "react"
import DeckGL from "@deck.gl/react"
import { GeoJsonLayer, PathLayerProps } from "@deck.gl/layers"
import type { PickInfo } from "@deck.gl/core/lib/deck"
import type { Feature, Geometry, LineString } from "@turf/helpers"
import { scaleLinear } from "d3-scale"
import type { RGBAColor } from "@deck.gl/core"
import { interpolateRdYlGn } from "d3-scale-chromatic"
import { rgb } from "d3-color"

import { ofType } from "../lib/typescript"
import { GLOBE_VIEW, WHITE } from "../app/deck"
import { SEO } from "../SEO"
import { YearSlider } from "../app/YearSlider"
import type { Tooltip } from "../lib/deck"

type CountryISOA3 = string & { readonly __tag__: unique symbol }
type Year = number & { readonly __tag__: unique symbol }

type Lookup = Partial<Record<CountryISOA3, Partial<Record<Year, number>>>>

interface Data {
  males: Lookup
  females: Lookup
  diffToColor: (d: number) => string
}

const diff = (
  males: Lookup,
  females: Lookup,
  c: CountryISOA3,
  year: Year
): number | undefined => {
  const f = females[c]?.[year]
  const m = males[c]?.[year]
  if (f && m) {
    return f - m
  }
}

const colorDomain = (
  males: Lookup,
  females: Lookup
): [min: number, max: number] => {
  let min = Number.MAX_SAFE_INTEGER
  let max = Number.MIN_SAFE_INTEGER

  for (let c of Object.keys(males)) {
    const iso = c as CountryISOA3
    const years = males[iso]
    if (years) {
      for (let year of Object.keys(years)) {
        const d = diff(males, females, iso, Number(year) as Year)
        if (d) {
          min = Math.min(min, d)
          max = Math.max(max, d)
        }
      }
    }
  }

  return [min, max]
}

interface GeoProps {
  ISO_A3: CountryISOA3
  ADMIN: string
}

type Feat = Feature<Geometry, GeoProps>

const fetchData = async (): Promise<Data> => {
  const [males, females] = await Promise.all(
    [fetch("/life/males.csv"), fetch("/life/females.csv")].map(x =>
      x.then(x => x.text()).then(parse)
    )
  )

  const minMax = scaleLinear().domain(colorDomain(males, females)).range([1, 0])
  const diffToColor = (d: number) => interpolateRdYlGn(minMax(d))

  return { males, females, diffToColor }
}

const float = (s: string) => (s ? Number(s.replace(",", ".")) : undefined)

const parse = (csv: string) => {
  const lines = csv.split("\n")
  const columnNames = lines[0].split(";").map(Number)

  let max = Number.MIN_SAFE_INTEGER
  let min = Number.MAX_SAFE_INTEGER

  const ret: Lookup = {}

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(";")
    const code = row[1] as CountryISOA3
    for (let j = 2; j < row.length; j++) {
      const year = columnNames[j] as Year
      const value = float(row[j])
      if (value) {
        max = Math.max(max, value)
        min = Math.min(min, value)

        if (!ret[code]) ret[code] = {}
        const x = ret[code]
        if (x) {
          x[year] = value
        }
      }
    }
  }

  return ret
}

const fillColor =
  ({ diffToColor, females, males }: Data, year: Year) =>
  (feat: Feat): RGBAColor => {
    const d = diff(males, females, feat.properties.ISO_A3, year)
    if (d) {
      const { r, g, b } = rgb(diffToColor(d))
      return [r, g, b]
    } else {
      return [150, 150, 150]
    }
  }

const tooltip =
  ({ females, males }: Data, year: Year) =>
  ({ object }: PickInfo<Feat>): Tooltip => {
    if (!object?.properties) return null

    const { ADMIN, ISO_A3 } = object.properties
    const m = males[ISO_A3]?.[year]
    const f = females[ISO_A3]?.[year]
    return { text: `${ADMIN}\nmale ${m}\nfemale ${f}` }
  }

const LifeGlobe = ({ year, data }: { year: Year; data: Data }): JSX.Element => {
  const getFillColor = fillColor(data, year)
  const getTooltip = tooltip(data, year)

  return (
    <DeckGL
      views={GLOBE_VIEW}
      layers={[
        new GeoJsonLayer<Feat>({
          id: "features",
          data: countries.features as unknown as Feat[],
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
          updateTriggers: { getFillColor },
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

const title = "Territories of Muscovy by year of conquest"
const startYear = 1960
const endYear = 2020

// noinspection JSUnusedGlobalSymbols
export default function Life(): JSX.Element {
  const [year, setYear] = useState(endYear)
  const [data, setData] = useState<Data | null>(null)

  useEffect(() => {
    void fetchData().then(setData)
  }, [])

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <SEO title={title} />

      {data ? <LifeGlobe year={year as Year} data={data} /> : null}

      <div className="pointer-events-none absolute flex flex-col space-y-2 p-5">
        <h1 className="text-2xl">{title}</h1>

        <YearSlider
          value={year}
          setValue={setYear}
          min={startYear}
          max={endYear}
        />
      </div>
    </div>
  )
}
