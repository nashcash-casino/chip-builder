import gen from 'random-seed'
import chunk from 'lodash.chunk'
import prompt from 'prompt'
import { writeFileSync } from 'fs'
import { keccak256 } from 'js-sha3'
import stringify from 'csv-stringify/lib/sync'

const DIGITS = '0123456789'
const ALPHABET = 'abcdefghijkmnopqrstuvwxyz' // remove "l" for readability
const PASSWORD_LENGTH = 16
const CHARACTER_SET = DIGITS + ALPHABET

const NUM_CHIPS = 500
const FILENAME = 'chip-data.csv'

const createSecurePasswordFactory = (randLib, characterSet = CHARACTER_SET) => (
  passwordLength = PASSWORD_LENGTH
) => {
  const charArray = []

  for (let i = 0; i < passwordLength; i++) {
    const charIndex = randLib(characterSet.length)
    const char = characterSet[charIndex]
    charArray.push(char)
  }

  return charArray.join('')
}

const padId = id => {
  if (id < 10) return '00' + id
  if (id < 100) return '0' + id
  if (id < 1000) return id
  else throw new Error('id is too large!')
}

const chunkPassword = password => {
  const charArray = password.split('')
  const chunkedCharArrays = chunk(charArray, 4)
  const chunksArray = chunkedCharArrays.map(chunkChars => chunkChars.join(''))
  const chunkedPassword = chunksArray.join(' ')
  return chunkedPassword
}

const run = (err, { seed, numChips, fileName }) => {
  if (err) process.exit(1)

  const chips = []
  const randLib = gen(seed)
  const createPassword = createSecurePasswordFactory(randLib)

  for (let id = 0; id < numChips; id++) {
    const chip = {}
    chip.id = id
    chip.paddedId = padId(id)
    chip.password = createPassword()
    chip.chunkedPassword = chunkPassword(chip.password)
    chip.hash = keccak256(chip.password)
    chip.hashWithHexPrefix = '0x' + chip.hash
    chips.push(chip)
  }

  randLib.done()

  const csvString = stringify(chips, {
    header: true,
    columns: [
      'id',
      'paddedId',
      'password',
      'chunkedPassword',
      'hash',
      'hashWithHexPrefix'
    ]
  })

  writeFileSync(fileName, csvString)
  process.exit(0)
}

prompt.start()
prompt.get(
  [
    {
      name: 'seed',
      type: 'string',
      description: 'Enter the deterministic seed for generating chip passwords',
      required: true
    },
    {
      name: 'numChips',
      type: 'number',
      description: 'Enter the number of chips you wish to create passwords for',
      default: NUM_CHIPS
    },
    {
      name: 'fileName',
      type: 'string',
      description: 'Enter the desired fileName for your chip data',
      default: FILENAME
    }
  ],
  run
)
