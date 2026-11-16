export function convertLittleEndian(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) throw new RangeError("Enter at least one hexadecimal byte.")

  const bytes = trimmed.split(/\s+/).map((token) => {
    if (!/^(?:0x)?[0-9a-f]{1,2}$/i.test(token)) {
      throw new RangeError(`Invalid hexadecimal byte: ${token}`)
    }
    return token.replace(/^0x/i, "").padStart(2, "0").toUpperCase()
  })

  const words: string[] = []
  for (let i = 0; i < bytes.length; i += 4) {
    const word = bytes.slice(i, i + 4)
    while (word.length < 4) word.push("00")
    words.push(word.reverse().join(""))
  }
  return words.join("\n")
}
