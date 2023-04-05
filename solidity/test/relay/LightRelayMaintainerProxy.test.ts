/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/no-unused-expressions */

import { ethers, helpers, waffle } from "hardhat"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { expect } from "chai"
import { ContractTransaction } from "ethers"
import bridgeFixture from "../fixtures/bridge"
import type {
  LightRelayStub,
  LightRelayMaintainerProxy,
  ReimbursementPool,
} from "../../typechain"

import { concatenateHexStrings } from "../helpers/contract-test-helpers"

import headers from "./headersWithRetarget.json"
import reorgHeaders from "./headersReorgAndRetarget.json"
import longHeaders from "./longHeaders.json"

const { createSnapshot, restoreSnapshot } = helpers.snapshot

const genesisBlock = headers.oldPeriodStart
const genesisHeader = genesisBlock.hex
const genesisHeight = genesisBlock.height // 552384
const genesisEpoch = genesisHeight / 2016 // 274

const nextEpochStart = headers.chain[9]
const nextStartHeader = nextEpochStart.hex
const nextEpochHeight = nextEpochStart.height // 554400

const genesisDifficulty = 5646403851534
const nextDifficulty = 5106422924659

const proofLength = 4

const fixture = async () => {
  let deployer: SignerWithAddress
  let governance: SignerWithAddress
  let thirdParty: SignerWithAddress
  let reimbursementPool: ReimbursementPool

  // eslint-disable-next-line @typescript-eslint/no-extra-semi
  ;({ deployer, governance, thirdParty, reimbursementPool } =
    await waffle.loadFixture(bridgeFixture))

  const Relay = await ethers.getContractFactory("LightRelayStub")
  const relay = await Relay.connect(deployer).deploy()
  await relay.deployed()

  // TODO: Consider deploying `relayMaintainerProxy` via deployment scripts.
  const MaintainerProxy = await ethers.getContractFactory(
    "LightRelayMaintainerProxy"
  )
  const relayMaintainerProxy = await MaintainerProxy.connect(deployer).deploy(
    relay.address,
    reimbursementPool.address
  )
  await relayMaintainerProxy.deployed()

  await relay.connect(deployer).transferOwnership(governance.address)
  await relayMaintainerProxy
    .connect(deployer)
    .transferOwnership(governance.address)

  return {
    deployer,
    governance,
    thirdParty,
    relay,
    relayMaintainerProxy,
  }
}

describe("LightRelayMaintainerProxy", () => {
  let governance: SignerWithAddress
  let thirdParty: SignerWithAddress
  let relay: LightRelayStub
  let relayMaintainerProxy: LightRelayMaintainerProxy

  before(async () => {
    // eslint-disable-next-line @typescript-eslint/no-extra-semi
    ;({ governance, thirdParty, relay, relayMaintainerProxy } =
      await waffle.loadFixture(fixture))
  })

  describe("setRelayMaintainerStatus", () => {
    context("when ")
  })

  describe("updateLightRelay", () => {
    // TODO: Implement
  })

  describe("retarget", () => {
    const { chain } = headers
    const headerHex = chain.map((header) => header.hex)

    before(async () => {
      await createSnapshot()
    })

    after(async () => {
      await restoreSnapshot()
    })
  })
})
