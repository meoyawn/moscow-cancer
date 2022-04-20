import React from "react"
import dynamic from "next/dynamic"

import russia from "../russia.json"
import { FeatureCollection } from "@turf/helpers"

const ClientGlobe = dynamic(() => import("../ClientGlobe"), { ssr: false })

// noinspection JSUnusedGlobalSymbols
export default function Index() {
  return <ClientGlobe fc={russia as FeatureCollection} />
}
