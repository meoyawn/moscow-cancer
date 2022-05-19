export type Tooltip =
  | null
  | string
  | {
      text?: string
      html?: string
      className?: string
      style?: {}
    }
