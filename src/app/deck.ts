import { RGBAColor } from "@deck.gl/core/utils/color"
// @ts-ignore imp
import { _GlobeView as GlobeView } from "@deck.gl/core"

export const BLACK: RGBAColor = [0, 0, 0]
export const WHITE: RGBAColor = [255, 255, 255]

export const GLOBE_VIEW = [new GlobeView({ resolution: 10 })]
