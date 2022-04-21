import React from "react"
import { FeatureCollection } from "@turf/helpers"

import { ClientGlobe } from "../ClientGlobe"
import russia from "../russia.json"

// noinspection JSUnusedGlobalSymbols
export default function Index() {
  return <ClientGlobe data={russia as FeatureCollection} />
}
