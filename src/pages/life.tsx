import React, { useState } from "react"
import DeckGL from "@deck.gl/react"
import { GeoJsonLayer, PathLayerProps } from "@deck.gl/layers"
import type { Feature, LineString, Geometry } from "@turf/helpers"

import { ofType } from "../lib/typescript"
import { GLOBE_VIEW, WHITE } from "../app/deck"

import countries from "../countries.json"
import { SEO } from "../SEO"
import { YearSlider } from "../app/YearSlider"

type CountryISOA3 = string & { readonly __tag__: unique symbol }
type Year = number & { readonly __tag__: unique symbol }

interface Data {
  males: Record<CountryISOA3, Record<Year, number>>
  females: Record<CountryISOA3, Record<Year, number>>
}

const diff = ({ females, males }: Data, c: CountryISOA3, year: Year): number =>
  females[c][year] - males[c][year]

interface GeoProps {
  ISO_A3: CountryISOA3
  ADMIN: string
}

type Feat = Feature<Geometry, GeoProps>

const data = async () => {
  fetch("/life/females.csv")
  fetch("/life/males.csv")
}

const LifeGlobe = ({ year }: { year: number }): JSX.Element => (
  <DeckGL
    views={GLOBE_VIEW}
    layers={[
      new GeoJsonLayer<Feat>({
        id: "regions",
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

const title = "Territories of Muscovy by year of conquest"
const startYear = 1960
const endYear = 2021

// noinspection JSUnusedGlobalSymbols
export default function Life(): JSX.Element {
  const [year, setYear] = useState(endYear)

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <SEO title={title} />

      <LifeGlobe year={year} />

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
