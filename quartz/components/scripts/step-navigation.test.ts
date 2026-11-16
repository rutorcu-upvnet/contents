import { strict as assert } from "node:assert"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import { runInNewContext } from "node:vm"
import { transformSync } from "esbuild"

class EventTargetStub {
  listeners = new Map<string, Set<(event: unknown) => void>>()

  addEventListener(type: string, listener: (event: unknown) => void) {
    const listeners = this.listeners.get(type) ?? new Set()
    listeners.add(listener)
    this.listeners.set(type, listeners)
  }

  removeEventListener(type: string, listener: (event: unknown) => void) {
    this.listeners.get(type)?.delete(listener)
  }

  dispatch(type: string, event?: unknown) {
    this.listeners.get(type)?.forEach((listener) => listener(event))
  }
}

class ElementStub {
  active = false
  target = ""
  href = ""
  parentStep: ElementStub | null = null
  classList = {
    toggle: (_name: string, enabled: boolean) => {
      this.active = enabled
    },
  }

  closest(selector: string) {
    return selector === "a" ? this : this.parentStep
  }

  hasAttribute() {
    return false
  }

  scrollIntoView() {}
}

function setup(hash: string) {
  const steps = [new ElementStub(), new ElementStub(), new ElementStub()]
  const target = new ElementStub()
  target.parentStep = steps[2]
  const prev = new EventTargetStub()
  const next = new EventTargetStub()
  const current = { textContent: "" }
  const total = { textContent: "" }
  const elements: Record<string, unknown> = {
    "#prevBtn": prev,
    "#nextBtn": next,
    "#currentStep": current,
    "#totalSteps": total,
  }
  const document = new EventTargetStub()
  Object.assign(document, {
    querySelectorAll: () => steps,
    querySelector: (selector: string) => elements[selector],
    getElementById: (id: string) => (id === "exercise-3" ? target : null),
  })
  const window = new EventTargetStub()
  const cleanup: (() => void)[] = []
  Object.assign(window, {
    location: new URL(`https://example.test/course/page${hash}`),
    addCleanup: (fn: () => void) => cleanup.push(fn),
    scrollTo: () => {},
  })
  const source = readFileSync(new URL("./step-navigation-init.inline.ts", import.meta.url), "utf8")
  const script = transformSync(source, { loader: "ts" }).code
  runInNewContext(script, { document, window, Element: ElementStub, URL, URIError, console })
  document.dispatch("nav")
  return { document, window, steps, current, total, next, cleanup }
}

test("opens the step containing the initial anchor", () => {
  const { current, total, steps, next } = setup("#exercise-3")
  assert.equal(current.textContent, "3")
  assert.equal(total.textContent, "3")
  assert.equal(steps[2].active, true)
  next.dispatch("click")
  assert.equal(current.textContent, "3")
})

test("opens a same-page anchor and removes listeners on navigation", () => {
  const { document, current, cleanup } = setup("")
  const link = new ElementStub()
  link.href = "https://example.test/course/page#exercise-3"
  document.dispatch("click", { target: link, button: 0 })
  assert.equal(current.textContent, "3")
  cleanup.forEach((fn) => fn())
  assert.equal(document.listeners.get("click")?.size, 0)
})
