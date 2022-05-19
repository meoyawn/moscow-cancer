import countries from "../countries.json"

import React, { Dispatch, useEffect, useMemo, useState } from "react"
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
type Mode = "male" | "female" | "diff"

interface Data {
  males: Lookup
  females: Lookup
}

const value = (
  { females, males }: Data,
  mode: Mode,
  c: CountryISOA3,
  year: Year
): number | undefined => {
  const f = females[c]?.[year]
  const m = males[c]?.[year]
  switch (mode) {
    case "diff":
      if (f && m) {
        return f - m
      }
      break

    case "male":
      return m

    case "female":
      return f
  }
}

const colorDomain = (data: Data, mode: Mode): [min: number, max: number] => {
  let min = Number.MAX_SAFE_INTEGER
  let max = Number.MIN_SAFE_INTEGER

  for (let c of Object.keys(data.males)) {
    const iso = c as CountryISOA3
    const years = data.males[iso]
    if (years) {
      for (let year of Object.keys(years)) {
        const d = value(data, mode, iso, Number(year) as Year)
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

const interpolateColor = (data: Data, mode: Mode) => {
  const minMax = scaleLinear()
    .domain(colorDomain(data, mode))
    .range(mode === "diff" ? [1, 0] : [0, 1])

  return (d: number) => interpolateRdYlGn(minMax(d))
}

const fetchData = async (): Promise<Data> => {
  const [males, females] = await Promise.all(
    [fetch("/life/males.csv"), fetch("/life/females.csv")].map(x =>
      x.then(x => x.text()).then(parse)
    )
  )

  return { males, females }
}

const float = (s: string) => (s ? Number(s.replace(",", ".")) : undefined)

const parse = (csv: string) => {
  const lines = csv.split("\n")
  const columnNames = lines[0].split(";").map(Number)

  const ret: Lookup = {}

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(";")
    const code = row[1] as CountryISOA3
    for (let j = 2; j < row.length; j++) {
      const year = columnNames[j] as Year
      const value = float(row[j])
      if (value) {
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

const fillColor = (data: Data, mode: Mode, year: Year) => {
  const diffToColor = interpolateColor(data, mode)

  return (feat: Feat): RGBAColor => {
    const d = value(data, mode, feat.properties.ISO_A3, year)
    if (d) {
      const { r, g, b } = rgb(diffToColor(d))
      return [r, g, b]
    } else {
      return [150, 150, 150]
    }
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

const LifeGlobe = ({
  year,
  data,
  mode,
}: {
  year: Year
  data: Data
  mode: Mode
}): JSX.Element => {
  const getFillColor = useMemo(
    () => fillColor(data, mode, year),
    [data, mode, year]
  )
  const getTooltip = useMemo(() => tooltip(data, year), [data, year])

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

const title = "Life Expectancy"
const startYear = 1960
const endYear = 2020

const radios: ReadonlyArray<{ id: Mode; title: string }> = [
  { id: "diff", title: "Female - Male" },
  { id: "male", title: "Male" },
  { id: "female", title: "Female" },
]

const Radio = ({ mode, setMode }: { mode: Mode; setMode: Dispatch<Mode> }) => (
  <fieldset
    className="pointer-events-auto mt-4"
    onChange={e => setMode((e.target as HTMLInputElement).id as Mode)}
  >
    <legend className="sr-only">Notification method</legend>
    <div className="space-y-4 sm:flex sm:items-center sm:space-y-0 sm:space-x-10">
      {radios.map(radio => (
        <div key={radio.id} className="flex items-center">
          <input
            id={radio.id}
            name="notification-method"
            type="radio"
            defaultChecked={mode === radio.id}
            className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label
            htmlFor={radio.id}
            className="ml-3 block text-sm font-medium text-gray-700"
          >
            {radio.title}
          </label>
        </div>
      ))}
    </div>
  </fieldset>
)

// noinspection JSUnusedGlobalSymbols
export default function Life(): JSX.Element {
  const [data, setData] = useState<Data | null>(null)
  const [mode, setMode] = useState(radios[0].id)
  const [year, setYear] = useState(endYear)

  useEffect(() => {
    void fetchData().then(setData)
  }, [])

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <SEO title={title} description="Life expectancy through space and time" />

      {data ? <LifeGlobe year={year as Year} data={data} mode={mode} /> : null}

      <div className="pointer-events-none absolute flex flex-col space-y-2 p-5">
        <h1 className="text-2xl">{title}</h1>

        <Radio mode={mode} setMode={setMode} />

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
