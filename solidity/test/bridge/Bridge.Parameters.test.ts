import { helpers, waffle } from "hardhat"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { expect } from "chai"
import { ContractTransaction } from "ethers"
import type { Bridge, BridgeStub } from "../../typechain"
import { constants } from "../fixtures"
import bridgeFixture from "./bridge-fixture"

const { createSnapshot, restoreSnapshot } = helpers.snapshot
const fixture = async () => bridgeFixture()

describe("Bridge - Parameters", () => {
  let governance: SignerWithAddress
  let thirdParty: SignerWithAddress
  let bridge: Bridge & BridgeStub

  before(async () => {
    // eslint-disable-next-line @typescript-eslint/no-extra-semi
    ;({ governance, thirdParty, bridge } = await waffle.loadFixture(fixture))
  })

  describe("updateDepositParameters", () => {
    context("when caller is the contract owner", () => {
      context("when all new parameter values are correct", () => {
        const newDepositDustThreshold = constants.depositDustThreshold * 2
        const newDepositTreasuryFeeDivisor =
          constants.depositTreasuryFeeDivisor * 2
        const newDepositTxMaxFee = constants.depositTxMaxFee * 3

        let tx: ContractTransaction

        before(async () => {
          await createSnapshot()

          tx = await bridge
            .connect(governance)
            .updateDepositParameters(
              newDepositDustThreshold,
              newDepositTreasuryFeeDivisor,
              newDepositTxMaxFee
            )
        })

        after(async () => {
          await restoreSnapshot()
        })

        it("should set correct values", async () => {
          const params = await bridge.depositParameters()

          expect(params.depositDustThreshold).to.be.equal(
            newDepositDustThreshold
          )
          expect(params.depositTreasuryFeeDivisor).to.be.equal(
            newDepositTreasuryFeeDivisor
          )
          expect(params.depositTxMaxFee).to.be.equal(newDepositTxMaxFee)
        })

        it("should emit DepositParametersUpdated event", async () => {
          await expect(tx)
            .to.emit(bridge, "DepositParametersUpdated")
            .withArgs(
              newDepositDustThreshold,
              newDepositTreasuryFeeDivisor,
              newDepositTxMaxFee
            )
        })
      })

      context("when new deposit dust threshold is zero", () => {
        it("should revert", async () => {
          await expect(
            bridge
              .connect(governance)
              .updateDepositParameters(
                0,
                constants.depositTreasuryFeeDivisor,
                constants.depositTxMaxFee
              )
          ).to.be.revertedWith(
            "Deposit dust threshold must be greater than zero"
          )
        })
      })

      context("when new deposit treasury fee divisor is zero", () => {
        it("should revert", async () => {
          await expect(
            bridge
              .connect(governance)
              .updateDepositParameters(
                constants.depositDustThreshold,
                0,
                constants.depositTxMaxFee
              )
          ).to.be.revertedWith(
            "Deposit treasury fee divisor must be greater than zero"
          )
        })
      })
    })

    context("when caller is not the contract owner", () => {
      it("should revert", async () => {
        await expect(
          bridge
            .connect(thirdParty)
            .updateDepositParameters(
              constants.depositDustThreshold,
              constants.depositTreasuryFeeDivisor,
              constants.depositTxMaxFee
            )
        ).to.be.revertedWith("Ownable: caller is not the owner")
      })
    })
  })

  describe("updateRedemptionParameters", () => {
    context("when caller is the contract owner", () => {
      context("when all new parameter values are correct", () => {
        const newRedemptionDustThreshold = constants.redemptionDustThreshold * 2
        const newRedemptionTreasuryFeeDivisor =
          constants.redemptionTreasuryFeeDivisor / 2
        const newRedemptionTxMaxFee = constants.redemptionTxMaxFee * 3
        const newRedemptionTimeout = constants.redemptionTimeout * 4

        let tx: ContractTransaction

        before(async () => {
          await createSnapshot()

          tx = await bridge
            .connect(governance)
            .updateRedemptionParameters(
              newRedemptionDustThreshold,
              newRedemptionTreasuryFeeDivisor,
              newRedemptionTxMaxFee,
              newRedemptionTimeout
            )
        })

        after(async () => {
          await restoreSnapshot()
        })

        it("should set correct values", async () => {
          const params = await bridge.redemptionParameters()

          expect(params.redemptionDustThreshold).to.be.equal(
            newRedemptionDustThreshold
          )
          expect(params.redemptionTreasuryFeeDivisor).to.be.equal(
            newRedemptionTreasuryFeeDivisor
          )
          expect(params.redemptionTxMaxFee).to.be.equal(newRedemptionTxMaxFee)
          expect(params.redemptionTimeout).to.be.equal(newRedemptionTimeout)
        })

        it("should emit RedemptionParametersUpdated event", async () => {
          await expect(tx)
            .to.emit(bridge, "RedemptionParametersUpdated")
            .withArgs(
              newRedemptionDustThreshold,
              newRedemptionTreasuryFeeDivisor,
              newRedemptionTxMaxFee,
              newRedemptionTimeout
            )
        })
      })

      context("when new redemption treasury fee divisor is zero", () => {
        it("should revert", async () => {
          await expect(
            bridge
              .connect(governance)
              .updateRedemptionParameters(
                constants.redemptionDustThreshold,
                0,
                constants.redemptionTxMaxFee,
                constants.redemptionTimeout
              )
          ).to.be.revertedWith(
            "Redemption treasury fee divisor must be greater than zero"
          )
        })
      })

      context("when new redemption timeout is zero", () => {
        it("should revert", async () => {
          await expect(
            bridge
              .connect(governance)
              .updateRedemptionParameters(
                constants.redemptionDustThreshold,
                constants.redemptionTreasuryFeeDivisor,
                constants.redemptionTxMaxFee,
                0
              )
          ).to.be.revertedWith("Redemption timeout must be greater than zero")
        })
      })
    })

    context("when caller is not the contract owner", () => {
      it("should revert", async () => {
        await expect(
          bridge
            .connect(thirdParty)
            .updateRedemptionParameters(
              constants.redemptionDustThreshold,
              constants.redemptionTreasuryFeeDivisor,
              constants.redemptionTxMaxFee,
              constants.redemptionTimeout
            )
        ).to.be.revertedWith("Ownable: caller is not the owner")
      })
    })
  })

  describe("updateMovingFundsParameters", () => {
    context("when caller is the contract owner", () => {
      context("when all new parameter values are correct", () => {
        const newMovingFundsTxMaxTotalFee =
          constants.movingFundsTxMaxTotalFee / 2
        const newMovingFundsTimeout = constants.movingFundsTimeout * 2

        let tx: ContractTransaction

        before(async () => {
          await createSnapshot()

          tx = await bridge
            .connect(governance)
            .updateMovingFundsParameters(
              newMovingFundsTxMaxTotalFee,
              newMovingFundsTimeout
            )
        })

        after(async () => {
          await restoreSnapshot()
        })

        it("should set correct values", async () => {
          const params = await bridge.movingFundsParameters()

          expect(params.movingFundsTxMaxTotalFee).to.be.equal(
            newMovingFundsTxMaxTotalFee
          )
          expect(params.movingFundsTimeout).to.be.equal(newMovingFundsTimeout)
        })

        it("should emit MovingFundsParametersUpdated event", async () => {
          await expect(tx)
            .to.emit(bridge, "MovingFundsParametersUpdated")
            .withArgs(newMovingFundsTxMaxTotalFee, newMovingFundsTimeout)
        })
      })

      context("when new moving funds timeout is zero", () => {
        it("should revert", async () => {
          await expect(
            bridge
              .connect(governance)
              .updateMovingFundsParameters(
                constants.movingFundsTxMaxTotalFee,
                0
              )
          ).to.be.revertedWith("Moving funds timeout must be greater than zero")
        })
      })
    })

    context("when caller is not the contract owner", () => {
      it("should revert", async () => {
        await expect(
          bridge
            .connect(thirdParty)
            .updateMovingFundsParameters(
              constants.movingFundsTxMaxTotalFee,
              constants.movingFundsTimeout
            )
        ).to.be.revertedWith("Ownable: caller is not the owner")
      })
    })
  })

  describe("updateWalletParameters", () => {
    context("when caller is the contract owner", () => {
      context("when all new parameter values are correct", () => {
        const newWalletCreationPeriod = constants.walletCreationPeriod * 2
        const newWalletMinBtcBalance = constants.walletMinBtcBalance.add(1000)
        const newWalletMaxBtcBalance = constants.walletMaxBtcBalance.add(2000)
        const newWalletMaxAge = constants.walletMaxAge * 2
        const newWalletMaxBtcTransfer = constants.walletMaxBtcTransfer.add(1000)

        let tx: ContractTransaction

        before(async () => {
          await createSnapshot()

          tx = await bridge
            .connect(governance)
            .updateWalletParameters(
              newWalletCreationPeriod,
              newWalletMinBtcBalance,
              newWalletMaxBtcBalance,
              newWalletMaxAge,
              newWalletMaxBtcTransfer
            )
        })

        after(async () => {
          await restoreSnapshot()
        })

        it("should set correct values", async () => {
          const params = await bridge.walletParameters()

          expect(params.walletCreationPeriod).to.be.equal(
            newWalletCreationPeriod
          )
          expect(params.walletMinBtcBalance).to.be.equal(newWalletMinBtcBalance)
          expect(params.walletMaxBtcBalance).to.be.equal(newWalletMaxBtcBalance)
          expect(params.walletMaxAge).to.be.equal(newWalletMaxAge)
          expect(params.walletMaxBtcTransfer).to.be.equal(
            newWalletMaxBtcTransfer
          )
        })

        it("should emit WalletParametersUpdated event", async () => {
          await expect(tx)
            .to.emit(bridge, "WalletParametersUpdated")
            .withArgs(
              newWalletCreationPeriod,
              newWalletMinBtcBalance,
              newWalletMaxBtcBalance,
              newWalletMaxAge,
              newWalletMaxBtcTransfer
            )
        })
      })

      context("when new minimum BTC balance is zero", () => {
        it("should revert", async () => {
          await expect(
            bridge
              .connect(governance)
              .updateWalletParameters(
                constants.walletCreationPeriod,
                0,
                constants.walletMaxBtcBalance,
                constants.walletMaxAge,
                constants.walletMaxBtcTransfer
              )
          ).to.be.revertedWith(
            "Wallet minimum BTC balance must be greater than zero"
          )
        })
      })

      context(
        "when new maximum BTC balance is not greater than the minimum",
        () => {
          it("should revert", async () => {
            await expect(
              bridge
                .connect(governance)
                .updateWalletParameters(
                  constants.walletCreationPeriod,
                  constants.walletMinBtcBalance,
                  constants.walletMinBtcBalance,
                  constants.walletMaxAge,
                  constants.walletMaxBtcTransfer
                )
            ).to.be.revertedWith(
              "Wallet maximum BTC balance must be greater than the minimum"
            )
          })
        }
      )

      context("when new maximum BTC transfer is zero", () => {
        it("should revert", async () => {
          await expect(
            bridge
              .connect(governance)
              .updateWalletParameters(
                constants.walletCreationPeriod,
                constants.walletMinBtcBalance,
                constants.walletMaxBtcBalance,
                constants.walletMaxAge,
                0
              )
          ).to.be.revertedWith(
            "Wallet maximum BTC transfer must be greater than zero"
          )
        })
      })
    })

    context("when caller is not the contract owner", () => {
      it("should revert", async () => {
        await expect(
          bridge
            .connect(thirdParty)
            .updateWalletParameters(
              constants.walletCreationPeriod,
              constants.walletMinBtcBalance,
              constants.walletMaxBtcBalance,
              constants.walletMaxAge,
              constants.walletMaxBtcTransfer
            )
        ).to.be.revertedWith("Ownable: caller is not the owner")
      })
    })
  })

  describe("updateFraudParameters", () => {
    context("when caller is the contract owner", () => {
      context("when all new parameter values are correct", () => {
        const newFraudSlashingAmount = constants.fraudSlashingAmount.mul(2)
        const newFraudNotifierRewardMultiplier =
          constants.fraudNotifierRewardMultiplier / 4
        const newFraudChallengeDefeatTimeout =
          constants.fraudChallengeDefeatTimeout * 3
        const newFraudChallengeDepositAmount =
          constants.fraudChallengeDepositAmount.mul(4)

        let tx: ContractTransaction

        before(async () => {
          await createSnapshot()

          tx = await bridge
            .connect(governance)
            .updateFraudParameters(
              newFraudSlashingAmount,
              newFraudNotifierRewardMultiplier,
              newFraudChallengeDefeatTimeout,
              newFraudChallengeDepositAmount
            )
        })

        after(async () => {
          await restoreSnapshot()
        })

        it("should set correct values", async () => {
          const params = await bridge.fraudParameters()

          expect(params.fraudSlashingAmount).to.be.equal(newFraudSlashingAmount)
          expect(params.fraudNotifierRewardMultiplier).to.be.equal(
            newFraudNotifierRewardMultiplier
          )
          expect(params.fraudChallengeDefeatTimeout).to.be.equal(
            newFraudChallengeDefeatTimeout
          )
          expect(params.fraudChallengeDepositAmount).to.be.equal(
            newFraudChallengeDepositAmount
          )
        })

        it("should emit FraudParametersUpdated event", async () => {
          await expect(tx)
            .to.emit(bridge, "FraudParametersUpdated")
            .withArgs(
              newFraudSlashingAmount,
              newFraudNotifierRewardMultiplier,
              newFraudChallengeDefeatTimeout,
              newFraudChallengeDepositAmount
            )
        })
      })

      context(
        "when new fraud notifier reward multiplier is greater than 100",
        () => {
          it("should revert", async () => {
            await expect(
              bridge
                .connect(governance)
                .updateFraudParameters(
                  constants.fraudSlashingAmount,
                  101,
                  constants.fraudChallengeDefeatTimeout,
                  constants.fraudChallengeDepositAmount
                )
            ).to.be.revertedWith(
              "Fraud notifier reward multiplier must be in the range [0, 100]"
            )
          })
        }
      )

      context("when new fraud challenge defeat timeout is zero", () => {
        it("should revert", async () => {
          await expect(
            bridge
              .connect(governance)
              .updateFraudParameters(
                constants.fraudSlashingAmount,
                constants.fraudNotifierRewardMultiplier,
                0,
                constants.fraudChallengeDepositAmount
              )
          ).to.be.revertedWith(
            "Fraud challenge defeat timeout must be greater than zero"
          )
        })
      })
    })

    context("when caller is not the contract owner", () => {
      it("should revert", async () => {
        await expect(
          bridge
            .connect(thirdParty)
            .updateFraudParameters(
              constants.fraudSlashingAmount,
              constants.fraudNotifierRewardMultiplier,
              constants.fraudChallengeDefeatTimeout,
              constants.fraudChallengeDepositAmount
            )
        ).to.be.revertedWith("Ownable: caller is not the owner")
      })
    })
  })
})
