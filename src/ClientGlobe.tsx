import React from "react"
import type { Feature, FeatureCollection } from "@turf/helpers"
import type { PickInfo } from "@deck.gl/core/lib/deck"
// @ts-ignore
import { _GlobeView as GlobeView } from "@deck.gl/core"
import DeckGL from "@deck.gl/react"
import { GeoJsonLayer } from "@deck.gl/layers"

const getTooltip = ({ object }: PickInfo<Feature>) => {
  if (!object?.properties) return null

  return {
    text: object.properties.shapeName,
  }
}

export const ClientGlobe = ({
  data,
}: {
  data: FeatureCollection
}): JSX.Element => (
  <DeckGL
    views={[
      new GlobeView({
        resolution: 10,
      }),
    ]}
    layers={[
      new GeoJsonLayer({
        data,
        getFillColor: [160, 160, 180],
        getLineColor: [255, 255, 255],
        stroked: true,
        filled: true,
        wireframe: true,
        pickable: true,
      }),
    ]}
    initialViewState={{
      latitude: 55.751244,
      longitude: 37.618423,
      zoom: 0,
      minZoom: 0,
      maxZoom: 20,
    }}
    controller={true}
    // @ts-ignore
    getTooltip={getTooltip}
  />
)
