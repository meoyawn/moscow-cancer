// noinspection ES6UnusedImports
import * as DeckTypings from "@danmarshall/deckgl-typings"
import type { View } from "@deck.gl/core"

declare module "deck.gl" {
  export namespace DeckTypings {}
}

declare module "@deck.gl/core" {
  export class _GlobeView extends View {
    constructor(props: { resolution: number })
  }
}
