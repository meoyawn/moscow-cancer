import React from "react"
import type { Feature, FeatureCollection } from "@turf/helpers"
import Globe from "react-globe.gl"

export default function ClientGlobe({
  fc,
}: {
  fc: FeatureCollection
}): JSX.Element {
  return (
    <Globe
      // globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
      backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
      polygonsData={fc.features}
      polygonLabel={(f) => (f as Feature).properties?.shapeName ?? "lbl"}
      polygonStrokeColor={() => "#000"}
    />
  )
}
