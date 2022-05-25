import type { RGBAColor } from "@deck.gl/core/utils/color"
import { _GlobeView } from "@deck.gl/core"

export const BLACK: RGBAColor = [0, 0, 0]
export const WHITE: RGBAColor = [255, 255, 255]

export const GLOBE_VIEW = [new _GlobeView({ resolution: 10 })]
