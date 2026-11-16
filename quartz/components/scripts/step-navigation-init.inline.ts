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
  window.addCleanup(() => {
    prevBtn.removeEventListener("click", previous)
    nextBtn.removeEventListener("click", next)
  })
  showStep()
})
