const NUM_ITERATIONS = 2
const LOG_LEVEL = 3

const DUST_THRESHOLD = 1
const EXPECTED_NEW_DEPOSITS = 30
const EXPECTED_NEW_OPERATORS = 10
const EXPECTED_NEW_WITHDRAWS = 25
const HEARTBEAT = 70
const OPERATOR_COUNT = 2000
const OPERATOR_QUIT_CHANCE = 0.005
const WALLET_MAX_AGE = 30 * 6 // days
const WALLET_MAX_BTC = 200
const WALLET_SIZE = 100

function log(logLevel, message) {
  if (logLevel >= LOG_LEVEL) {
    console.log(message)
  }
}

function factorial(x) {
  if (x == 0) {
    return 1
  }
  return x * factorial(x - 1)
}

// calculates the probability mass function at k of a poisson random variable
// with an expected value of lambda. See
// https://en.wikipedia.org/wiki/Poisson_distribution
function poisson(k, lambda) {
  const exponentialPower = Math.pow(2.718281828, -lambda)
  const landaPowerK = Math.pow(lambda, k)
  const numerator = exponentialPower * landaPowerK
  const denominator = factorial(k)
  return numerator / denominator
}

// Generates a random integer from [0, length). The number of different
// integers that could be generated is equal to `length`. For example,
// randomInt(3) picks 0, 1, or 2.
function randomInt(length) {
  return Math.floor(Math.random() * length)
}

// Generates a random, shuffled subset of `array` of length `size`. For
// example, getRandomSample([1,2,3,4], 2) might return [3,1] or [3,4].
// Inspired by https://stackoverflow.com/a/37835673/2144609
function getRandomSample(array, size) {
  let length = array.length
  let start = randomInt(length)
  let swaps = []
  let i = size
  let temp

  while (i--) {
    let index = (start + i) % length,
      rindex = randomInt(length)
    temp = array[rindex]
    array[rindex] = array[index]
    array[index] = temp
    swaps.push({ from: index, to: rindex })
  }

  const end = start + size
  let sample = array.slice(start, end)

  if (end > length) {
    sample = sample.concat(array.slice(0, end - length))
  }

  i = size
  while (i--) {
    const pop = swaps.pop()
    temp = array[pop.from]
    array[pop.from] = array[pop.to]
    array[pop.to] = temp
  }

  return sample
}

function poissonNumberGenerator(lambda) {
  let cumulativeDistributionFunction = {}
  const epsilon = 0.0001
  let total = 0
  for (let i = 0; total + epsilon <= 1; i++) {
    total += poisson(i, lambda)
    cumulativeDistributionFunction[i] = total
  }

  return () => {
    const rng = Math.random()
    let i = 0
    while (true) {
      if (
        cumulativeDistributionFunction[i] >= rng ||
        cumulativeDistributionFunction[i] == undefined
      ) {
        return i
      }
      i++
    }
  }
}

// The poisson probability mass function isn't useful on its own - we need a
// way to convert Math.random() into poisson random numbers. The way we do this
// is by generating a cumulative distribution function:
// https://en.wikipedia.org/wiki/Cumulative_distribution_function and then
// finding the first random variable whose place in the cumulative distribution
// function is at least Math.random(). Note: this trick works for any
// distribution! To save us some time calculating the cumulative distribution
// function over and over we cache it ahead of time. Since the poisson can
// generate infinitely high numbers we call it quits after we approach within
// `epsilon` of 1.
function poissonNumberGenerator(lambda) {
  let cumulativeDistributionFunction = {}
  const epsilon = 0.0001
  let total = 0
  for (let i = 0; total + epsilon <= 1; i++) {
    total += poisson(i, lambda)
    cumulativeDistributionFunction[i] = total
  }

  return () => {
    const rng = Math.random()
    let i = 0
    while (true) {
      if (
        cumulativeDistributionFunction[i] >= rng ||
        cumulativeDistributionFunction[i] == undefined
      ) {
        return i
      }
      i++
    }
  }
}

const newOperatorCount = poissonNumberGenerator(EXPECTED_NEW_OPERATORS)
const randomNewDeposit = poissonNumberGenerator(EXPECTED_NEW_DEPOSITS)
const randomNewWithdraw = poissonNumberGenerator(EXPECTED_NEW_WITHDRAWS)

// Close all wallets that are older than `WALLET_MAX_AGE`
function closeOldWallets(day) {
  const wallets = Object.keys(walletBalances)
  wallets.forEach((wallet) => {
    if (day >= wallet * 7 + WALLET_MAX_AGE) {
      closeWallet(wallet, "too old")
    }
  })
}

// Kick off all of the subroutines that happen on a new day
function newDay(day) {
  log(1, "Day " + day)
  log(1, "There are " + Object.keys(liveOperators).length + " live operators")
  log(
    1,
    "There are " + Object.keys(stakingOperators).length + " staking operators"
  )
  closeOldWallets(day)
  registerNewOperators()
  beginUnstakingOperators(day)
  unstakeOperators(day)
  createNewWalletEvent(day)
  dailyDeposit()
  dailyWithdraw()
}

// Each operator has an independent `OPERATOR_QUIT_CHANCE` of unstaking each
// time `beginUnstakingOperators` is called, which is each day. Each time an
// operator unstakes we record their unstaking completion data as well as check
// for whether or not that causes heartbeat failures in any of the wallets they
// are participating in.
function beginUnstakingOperators(day) {
  const currentStakingOperators = Object.keys(stakingOperators)
  let unstakingOperatorsToday = []
  currentStakingOperators.forEach((operator) => {
    if (Math.random() < OPERATOR_QUIT_CHANCE) {
      delete stakingOperators[operator]
      if (operator in operatorToWallets) {
        const wallets = Object.keys(operatorToWallets[operator])
        wallets.forEach((wallet) => {
          let walletStakers = walletStakingOperators[wallet]
          delete walletStakers[operator]
          walletStakingOperators[wallet] = walletStakers
          if (Object.keys(walletStakingOperators[wallet]).length < HEARTBEAT) {
            closeWallet(wallet, "failed heartbeat")
          }
        })
      }
      unstakingOperatorsToday.push(operator)
    }
  })
  unstakingOperators[day + 60] = unstakingOperatorsToday
}

// Fully unstake the operators that began unstaking 60 days ago via `beginUnstakingOperators`
function unstakeOperators(day) {
  const unstakingOperatorsToday = unstakingOperators[day]
  if (!!unstakingOperatorsToday) {
    unstakingOperatorsToday.forEach((operator) => {
      delete liveOperators[operator]
    })
    delete unstakingOperators[day]
  }
}

// Add a poisson random amount of new operators to the network
function registerNewOperators() {
  const newOperators = newOperatorCount()
  for (let j = 0; j < newOperators; j++) {
    liveOperators[operatorIndex] = true
    stakingOperators[operatorIndex] = true
    operatorIndex++
  }
}

// Create a new wallet every 7 days
function createNewWalletEvent(day) {
  if (day % 7 == 0) {
    newWallet()
  }
}

// Shuffle the staking operators and select 100 to form the signing group.
function newWallet() {
  walletBalances[walletIndex] = 0
  const operators = getRandomSample(Object.keys(stakingOperators), WALLET_SIZE)
  walletLiveOperators[walletIndex] = {}
  walletStakingOperators[walletIndex] = {}
  operators.forEach((operator) => {
    walletLiveOperators[walletIndex][operator] = true
    walletStakingOperators[walletIndex][operator] = true
    let wallets = operatorToWallets[operator] || {}
    wallets[walletIndex] = true
    operatorToWallets[operator] = wallets
  })
  log(1, "creating new wallet index: " + walletIndex)

  walletIndex++
}

// An implementation of wallet closure that transfers to a random live wallet.
function randomTransferWithoutCap(walletIndex) {
  let liveWallets = []
  for (let i = 0; i < walletIndex; i++) {
    if (
      walletBalances[i] > DUST_THRESHOLD &&
      Object.keys(walletStakingOperators[i]).length >= HEARTBEAT &&
      i != walletIndex
    ) {
      liveWallets.push(i)
    }
  }
  const randomIndex = Math.floor(Math.random() * liveWallets.length)
  const randomWallet = liveWallets[randomIndex]
  log(
    1,
    "Transferring " +
      walletBalances[walletIndex] +
      " btc from Wallet#" +
      walletIndex +
      " to Wallet#" +
      randomIndex
  )
  walletBalances[randomWallet] += walletBalances[walletIndex]
  if (walletBalances[randomWallet] > biggestWalletBalance) {
    biggestWalletBalance = walletBalances[randomWallet]
  }
  numberOfTransfers++
}

// An implementation of wallet closure that transfers to random live wallet(s)
// sending out batches of `WALLET_MAX_BTC` before picking a new wallet. If we
// run out of wallets we start over.
function randomTransfer(walletIndex) {
  let liveWallets = []
  for (let i = 0; i < walletIndex; i++) {
    if (
      walletBalances[i] > DUST_THRESHOLD &&
      Object.keys(walletStakingOperators[i]).length >= HEARTBEAT &&
      i != walletIndex
    ) {
      liveWallets.push(i)
    }
  }
  const transferCount = Math.ceil(walletBalances[walletIndex] / WALLET_MAX_BTC)
  const randomIndexes = getRandomSample(liveWallets, transferCount)
  let remaining = walletBalances[walletIndex]
  randomIndexes.forEach((randomIndex) => {
    let transferAmount = 0
    if (remaining > WALLET_MAX_BTC) {
      transferAmount = WALLET_MAX_BTC
    } else {
      transferAmount = remaining
    }
    remaining -= transferAmount
    const randomWallet = liveWallets[randomIndex]
    log(
      1,
      "Transferring " +
        transferAmount +
        " btc from Wallet#" +
        walletIndex +
        " to Wallet#" +
        randomIndex
    )
    walletBalances[randomWallet] += transferAmount
    if (walletBalances[randomWallet] > biggestWalletBalance) {
      biggestWalletBalance = walletBalances[randomWallet]
    }
    numberOfTransfers++
  })
}

// An implementation of wallet closure that transfers to the active wallet.
function transferToActive(walletIndex) {
  log(
    1,
    "Transferring " +
      walletBalances[walletIndex] +
      " btc from Wallet#" +
      walletIndex +
      " to Wallet#" +
      (walletIndex - 1)
  )
  walletBalances[walletIndex - 1] += walletBalances[walletIndex]
  if (walletBalances[walletIndex - 1] > biggestWalletBalance) {
    biggestWalletBalance = walletBalances[walletIndex - 1]
  }
  numberOfTransfers++
}

const transfer = randomTransfer

function closeWallet(walletIndex, reason) {
  if (walletIndex < walletIndex - 1 && walletIndex in walletBalances) {
    log(1, "Closing Wallet#" + walletIndex + " for reason: " + reason)
    if (walletBalances[walletIndex] > 0) {
      transfer(walletIndex)
    }
    Object.keys(walletStakingOperators[walletIndex]).forEach((operator) => {
      let wallets = operatorToWallets[operator]
      delete wallets[walletIndex]
      operatorToWallets[operator] = wallets
    })
    delete walletStakingOperators[walletIndex]
    delete walletLiveOperators[walletIndex]
    delete walletBalances[walletIndex]
  }
}

// Withdraws a poisson random amount of bitcoin (capped by the amount we have
// remaining) starting from the oldest wallet. Might end up closing multiple
// wallets to fulfill the withdraw.
function dailyWithdraw() {
  let remaining = randomNewWithdraw()
  if (remaining > btcInSystem) {
    log(
      1,
      "Tried to withdraw " +
        remaining +
        " btc but the system only had " +
        btcInSystem +
        " so withdrawing that instead"
    )
    remaining = btcInSystem
  }
  let wallet = 0
  while (remaining > 0) {
    if (walletBalances[wallet] > 0) {
      if (walletBalances[wallet] > remaining) {
        withdraw(wallet, remaining)
        remaining = 0
      } else {
        remaining -= walletBalances[wallet]
        withdraw(wallet, walletBalances[wallet])
      }
    }
    wallet++
  }
}

function dailyDeposit() {
  const amount = randomNewDeposit()
  log(1, "Depositing " + amount + " btc into Wallet#" + (walletIndex - 1))
  walletBalances[walletIndex - 1] += amount
  if (walletBalances[walletIndex - 1] > biggestWalletBalance) {
    biggestWalletBalance = walletBalances[walletIndex - 1]
  }
  btcInSystem += amount
}

function withdraw(walletIndex, amount) {
  const remainingBalance = walletBalances[walletIndex] - amount
  log(
    1,
    "Withdrawing " +
      amount +
      " btc from Wallet#" +
      walletIndex +
      ". Remaining balance: " +
      remainingBalance
  )
  walletBalances[walletIndex] -= amount
  btcInSystem -= amount
  if (remainingBalance <= DUST_THRESHOLD) {
    closeWallet(walletIndex, "below dust")
  }
}

// Used to track how different protocol decisions impact wallet risk
let biggestWalletBalance = 0
let btcInSystem = 0
let lastWalletCreationDay = -7
// Cache of {operatorId => bool}. Used query which operators are still live
// with O(1).
let liveOperators = {}
// used to track how different protocol decisions impact operating overhead
// costs
let numberOfTransfers = 0
// Used to assign each operator a unique ID
let operatorIndex = 0
// Cache of {operatorId => {walletId => bool}}. Used to query which wallets are
// associated to a particular operator.
let operatorToWallets = {}
// Cache of {operatorId => bool}. Used to query which operators are still
// staking with O(1).
let stakingOperators = {}
// Used to track how different protocol decisions impact wallet risk across
// multiple simulation iterations.
let totalBiggestWalletBalance = 0
// Cache of {day => [operatorId]}. Used to query which operators are unstaking
// on a particular day.
let unstakingOperators = {}
// Cache of {walletId => int}. Used to query a wallet balance.
let walletBalances = {}
// Used to assign each wallet a unique ID
let walletIndex = 0
// Cache of {walletId => {operatorId => bool}}. Used to query the live
// operators on a particular wallet.
let walletLiveOperators = {}
// Cache of {walletId => {operatorId => bool}}. Used to query the staking
// operators on a particular wallet.
let walletStakingOperators = {}

for (let iteration = 0; iteration < NUM_ITERATIONS; iteration++) {
  biggestWalletBalance = 0
  btcInSystem = 0
  lastWalletCreationDay = -7
  liveOperators = {}
  operatorIndex = 0
  operatorToWallets = {}
  stakingOperators = {}
  unstakingOperators = {}
  walletBalances = {}
  walletIndex = 0
  walletLiveOperators = {}
  walletStakingOperators = {}

  for (let i = 0; i < OPERATOR_COUNT; i++) {
    liveOperators[i] = true
    stakingOperators[i] = true
    operatorIndex++
  }

  for (let i = 0; i < 365 * 2; i++) {
    newDay(i)
  }
  totalBiggestWalletBalance += biggestWalletBalance
}
log(3, "biggestWalletBalance: " + totalBiggestWalletBalance / NUM_ITERATIONS)
