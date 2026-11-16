import { strict as assert } from "node:assert"
import { test } from "node:test"
import { convertLittleEndian } from "./littleEndian"

test("converts hexadecimal bytes into little-endian words", () => {
  assert.equal(convertLittleEndian("12 34 56 78\nAB CD EF 00"), "78563412\n00EFCDAB")
  assert.equal(convertLittleEndian("0xA b 0X01"), "00010B0A")
})

test("rejects empty or invalid byte input", () => {
  assert.throws(() => convertLittleEndian(" \n"), /at least one/)
  assert.throws(() => convertLittleEndian("12 123"), /Invalid hexadecimal byte: 123/)
  assert.throws(() => convertLittleEndian("0xGG"), /Invalid hexadecimal byte: 0xGG/)
})
