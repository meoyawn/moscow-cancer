import days from "./days.json"
import { test } from "vitest"

test("total", () => {
  // sum
  console.log(Object.values(days).reduce((a, b) => a + b, 0))
})
