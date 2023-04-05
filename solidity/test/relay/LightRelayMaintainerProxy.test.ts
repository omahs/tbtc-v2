/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/no-unused-expressions */

import { ethers, deployments, helpers, waffle } from "hardhat"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { expect } from "chai"
import { ContractTransaction } from "ethers"
import bridgeFixture from "../fixtures/bridge"
import type {
  LightRelayStub,
  LightRelay,
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
  await deployments.fixture()

  const { deployer, governance } = await helpers.signers.getNamedSigners()
  const [thirdParty, maintainer] = await helpers.signers.getUnnamedSigners()

  const reimbursementPool: ReimbursementPool =
    await helpers.contracts.getContract("ReimbursementPool")

  const lightRelayMaintainerProxy: LightRelayMaintainerProxy =
    await helpers.contracts.getContract("LightRelayMaintainerProxy")

  const lightRelay: LightRelay = await helpers.contracts.getContract(
    "LightRelay"
  )

  // Deploy another light relay to be able to test relay update
  const LightRelay = await ethers.getContractFactory("LightRelay")
  const anotherLightRelay = await LightRelay.deploy()
  await anotherLightRelay.deployed()

  return {
    deployer,
    governance,
    maintainer,
    thirdParty,
    reimbursementPool,
    lightRelayMaintainerProxy,
    lightRelay,
    anotherLightRelay,
  }
}

describe("LightRelayMaintainerProxy", () => {
  let deployer: SignerWithAddress
  let governance: SignerWithAddress
  let maintainer: SignerWithAddress
  let thirdParty: SignerWithAddress
  let reimbursementPool: ReimbursementPool
  let lightRelayMaintainerProxy: LightRelayMaintainerProxy
  let lightRelay: LightRelay
  let anotherLightRelay: LightRelay

  before(async () => {
    // eslint-disable-next-line @typescript-eslint/no-extra-semi
    ;({
      deployer,
      governance,
      maintainer,
      thirdParty,
      reimbursementPool,
      lightRelayMaintainerProxy,
      lightRelay,
      anotherLightRelay,
    } = await waffle.loadFixture(fixture))
  })

  describe("authorize", () => {
    context("When called by non-owner", () => {
      it("should revert", async () => {
        await expect(
          lightRelayMaintainerProxy
            .connect(thirdParty)
            .authorize(maintainer.address)
        ).to.be.revertedWith("Ownable: caller is not the owner")
      })
    })

    context("When called by the owner", () => {
      let tx: ContractTransaction

      before(async () => {
        await createSnapshot()

        tx = await lightRelayMaintainerProxy
          .connect(deployer)
          .authorize(maintainer.address)
      })

      after(async () => {
        await restoreSnapshot()
      })

      it("should authorize the address", async () => {
        expect(await lightRelayMaintainerProxy.isAuthorized(maintainer.address))
          .to.be.true
      })

      it("should emit the MaintainerAuthorized event", async () => {
        await expect(tx)
          .to.emit(lightRelayMaintainerProxy, "MaintainerAuthorized")
          .withArgs(maintainer.address)
      })
    })
  })

  describe("deauthorize", () => {
    context("When called by non-owner", () => {
      it("should revert", async () => {
        await expect(
          lightRelayMaintainerProxy
            .connect(thirdParty)
            .deauthorize(maintainer.address)
        ).to.be.revertedWith("Ownable: caller is not the owner")
      })
    })

    context("When called by the owner", () => {
      let tx: ContractTransaction

      before(async () => {
        await createSnapshot()

        // Authorize the maintainer first
        await lightRelayMaintainerProxy
          .connect(deployer)
          .authorize(maintainer.address)

        tx = await lightRelayMaintainerProxy
          .connect(deployer)
          .deauthorize(maintainer.address)
      })

      after(async () => {
        await restoreSnapshot()
      })

      it("should deauthorize the address", async () => {
        expect(await lightRelayMaintainerProxy.isAuthorized(maintainer.address))
          .to.be.false
      })

      it("should emit the MaintainerDeauthorized event", async () => {
        await expect(tx)
          .to.emit(lightRelayMaintainerProxy, "MaintainerDeauthorized")
          .withArgs(maintainer.address)
      })
    })
  })

  describe("updateLightRelay", () => {
    context("When called by non-owner", () => {
      it("should revert", async () => {
        await expect(
          lightRelayMaintainerProxy
            .connect(thirdParty)
            .updateLightRelay(anotherLightRelay.address)
        ).to.be.revertedWith("Ownable: caller is not the owner")
      })
    })

    context("When called by the owner", () => {
      let tx: ContractTransaction

      before(async () => {
        await createSnapshot()

        tx = await lightRelayMaintainerProxy
          .connect(deployer)
          .updateLightRelay(anotherLightRelay.address)
      })

      after(async () => {
        await restoreSnapshot()
      })

      it("should update the light relay address", async () => {
        expect(await lightRelayMaintainerProxy.lightRelay()).to.be.equal(
          anotherLightRelay.address
        )
      })

      it("should emit the LightRelayUpdated event", async () => {
        await expect(tx)
          .to.emit(lightRelayMaintainerProxy, "LightRelayUpdated")
          .withArgs(anotherLightRelay.address)
      })
    })
  })

  describe("retarget", () => {
    // TODO: implement
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
