import { convertLittleEndian } from "../../util/littleEndian"

document.addEventListener("nav", () => {
  const container = document.querySelector<HTMLElement>("#converter-container")
  if (!container) return

  const fileInput = container.querySelector<HTMLInputElement>("#file-input")
  const input = container.querySelector<HTMLTextAreaElement>("#input-text")
  const output = container.querySelector<HTMLTextAreaElement>("#output-text")
  const convertButton = container.querySelector<HTMLButtonElement>("#convert-btn")
  const downloadButton = container.querySelector<HTMLButtonElement>("#download-btn")
  const status = container.querySelector<HTMLElement>("#status-message")
  if (!fileInput || !input || !output || !convertButton || !downloadButton || !status) {
    console.error("Little-endian converter is missing required controls.")
    return
  }

  let inputVersion = 0
  const clearResult = () => {
    inputVersion++
    output.value = ""
    downloadButton.disabled = true
    status.textContent = ""
    status.style.display = "none"
  }
  const showError = (message: string) => {
    status.textContent = message
    status.style.display = "block"
  }
  const convert = () => {
    clearResult()
    try {
      output.value = convertLittleEndian(input.value)
      downloadButton.disabled = false
    } catch (error) {
      if (!(error instanceof RangeError)) throw error
      showError(error.message)
    }
  }
  const loadFile = async () => {
    clearResult()
    const file = fileInput.files?.[0]
    if (!file) return
    input.value = ""
    const version = inputVersion
    try {
      const text = await file.text()
      if (version === inputVersion) {
        clearResult()
        input.value = text
      }
    } catch (error) {
      console.error("Failed to read the selected file:", error)
      if (version === inputVersion) showError("Could not read the selected file.")
    }
  }
  const download = () => {
    const url = URL.createObjectURL(new Blob([output.value + "\n"], { type: "text/plain" }))
    const link = document.createElement("a")
    link.href = url
    link.download = "little-endian.txt"
    link.dataset.routerIgnore = ""
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.ctrlKey && event.key === "Enter") {
      event.preventDefault()
      convert()
    }
  }

  fileInput.addEventListener("change", loadFile)
  input.addEventListener("input", clearResult)
  input.addEventListener("keydown", onKeyDown)
  convertButton.addEventListener("click", convert)
  downloadButton.addEventListener("click", download)
  window.addCleanup(() => {
    inputVersion++
    fileInput.removeEventListener("change", loadFile)
    input.removeEventListener("input", clearResult)
    input.removeEventListener("keydown", onKeyDown)
    convertButton.removeEventListener("click", convert)
    downloadButton.removeEventListener("click", download)
  })
})
