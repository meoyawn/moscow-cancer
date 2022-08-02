import React from "react"
import { Feature, Geometry, LineString } from "@turf/helpers"
import { PickInfo } from "@deck.gl/core/lib/deck"
import { PathLayerProps } from "@deck.gl/layers/path-layer/path-layer"
import { RGBAColor } from "@deck.gl/core/utils/color"
import { scaleLinear } from "d3-scale"
import { interpolateYlGn } from "d3-scale-chromatic"
import { GeoJsonLayer } from "@deck.gl/layers"
import DeckGL from "@deck.gl/react"

import countries from "../countries.json"
import days from "../app/travel/days.json"

import { GLOBE_VIEW, WHITE } from "../app/deck"
import { ofType } from "../lib/typescript"
import { SEO } from "../SEO"
import { toRGBA } from "./life"
import { Tooltip } from "../lib/deck"

type CountryISOA2 = string & { readonly iso2: unique symbol }
type Days = number & { readonly days: unique symbol }

interface GeoProps {
  ISO_A2: CountryISOA2
  ADMIN: string
}

type Feat = Feature<Geometry, GeoProps>

type TheDays = Readonly<Record<CountryISOA2, Days>>

const theDays: Readonly<Record<CountryISOA2, Days>> = days

const colorInterpolator = (d: TheDays) => {
  const maxDays = scaleLinear()
    .domain([0, Math.max(...Object.values(d))])
    .range([0, 1])

  return (d: Days) => interpolateYlGn(maxDays(d))
}

const fillColor = (td: TheDays) => {
  const i = colorInterpolator(td)

  return (feat: Feat) => {
    const days = td[feat.properties.ISO_A2]
    if (days) {
      return toRGBA(i(days ?? 0))
    } else {
      return [180, 180, 180] as RGBAColor
    }
  }
}

const getTooltip = ({ object }: PickInfo<Feat>): Tooltip => {
  if (!object?.properties) return null

  const { ADMIN, ISO_A2 } = object.properties
  const days = theDays[ISO_A2] ?? 0
  return { text: `${ADMIN}\n${days} days` }
}

// noinspection JSUnusedGlobalSymbols
export default function Travel(): JSX.Element {
  return (
    <div>
      <SEO title="Travel days" />

      <DeckGL
        views={GLOBE_VIEW}
        layers={[
          new GeoJsonLayer<Feat>({
            id: "features",
            data: countries.features as unknown as Feat[],
            filled: true,
            pickable: true,
            stroked: true,
            getFillColor: fillColor(theDays),
            _subLayerProps: {
              "polygons-stroke": ofType<PathLayerProps<Feature<LineString>>>({
                getColor: WHITE,
                getWidth: 1000,
                widthMinPixels: 0.1,
              }),
            },
            updateTriggers: { fillColor, days, getTooltip },
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
    </div>
  )
}
