document.addEventListener("nav", () => {
  const steps = document.querySelectorAll(".step-container .step")
  const prevBtn = document.querySelector<HTMLButtonElement>("#prevBtn")
  const nextBtn = document.querySelector<HTMLButtonElement>("#nextBtn")
  const currentStepEl = document.querySelector<HTMLElement>("#currentStep")
  const totalStepsEl = document.querySelector<HTMLElement>("#totalSteps")

  if (!steps.length || !prevBtn || !nextBtn || !currentStepEl || !totalStepsEl) return

  let currentStep = 1
  const showStep = () => {
    steps.forEach((step, index) => step.classList.toggle("active", index === currentStep - 1))
    currentStepEl.textContent = String(currentStep)
    totalStepsEl.textContent = String(steps.length)
    prevBtn.disabled = currentStep === 1
    nextBtn.disabled = currentStep === steps.length
  }
  const showAnchorStep = (hash: string) => {
    if (!hash.startsWith("#") || hash.length === 1) return
    let id: string
    try {
      id = decodeURIComponent(hash.slice(1))
    } catch (error) {
      if (!(error instanceof URIError)) throw error
      console.warn("Invalid step anchor:", hash)
      return
    }
    const target = document.getElementById(id)
    const targetStep = target?.closest(".step-container .step")
    const index = Array.from(steps).findIndex((step) => step === targetStep)
    if (index !== -1) {
      currentStep = index + 1
      showStep()
      return target
    }
  }
  const onAnchorClick = (event: MouseEvent) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey
    )
      return
    if (!(event.target instanceof Element)) return
    const link = event.target.closest("a")
    if (!link || link.target || link.hasAttribute("download")) return
    const url = new URL(link.href, window.location.href)
    if (
      url.origin === window.location.origin &&
      url.pathname === window.location.pathname &&
      url.search === window.location.search
    ) {
      showAnchorStep(url.hash)
    }
  }
  const onHashChange = () => {
    showAnchorStep(window.location.hash)?.scrollIntoView()
  }
  const previous = () => {
    currentStep = Math.max(1, currentStep - 1)
    showStep()
    window.scrollTo({ top: 0, behavior: "smooth" })
  }
  const next = () => {
    currentStep = Math.min(steps.length, currentStep + 1)
    showStep()
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  prevBtn.addEventListener("click", previous)
  nextBtn.addEventListener("click", next)
  document.addEventListener("click", onAnchorClick)
  window.addEventListener("hashchange", onHashChange)
  window.addCleanup(() => {
    prevBtn.removeEventListener("click", previous)
    nextBtn.removeEventListener("click", next)
    document.removeEventListener("click", onAnchorClick)
    window.removeEventListener("hashchange", onHashChange)
  })
  showStep()
  showAnchorStep(window.location.hash)?.scrollIntoView()
})
