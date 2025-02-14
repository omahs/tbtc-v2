import { Address, Bridge } from "../src/ethereum"
import {
  deployMockContract,
  MockContract,
} from "@ethereum-waffle/mock-contract"
import chai, { assert, expect } from "chai"
import { BigNumber, constants } from "ethers"
import { abi as BridgeABI } from "@keep-network/tbtc-v2/artifacts/Bridge.json"
import { abi as WalletRegistryABI } from "@keep-network/ecdsa/artifacts/WalletRegistry.json"
import { MockProvider } from "@ethereum-waffle/provider"
import { waffleChai } from "@ethereum-waffle/chai"
import { TransactionHash } from "../src/bitcoin"

chai.use(waffleChai)

describe("Ethereum", () => {
  describe("Bridge", () => {
    let walletRegistry: MockContract
    let bridgeContract: MockContract
    let bridgeHandle: Bridge

    beforeEach(async () => {
      const [signer] = new MockProvider().getWallets()

      walletRegistry = await deployMockContract(
        signer,
        `${JSON.stringify(WalletRegistryABI)}`
      )

      bridgeContract = await deployMockContract(
        signer,
        `${JSON.stringify(BridgeABI)}`
      )

      await bridgeContract.mock.contractReferences.returns(
        constants.AddressZero,
        constants.AddressZero,
        walletRegistry.address,
        constants.AddressZero
      )

      bridgeHandle = new Bridge({
        address: bridgeContract.address,
        signerOrProvider: signer,
      })
    })

    describe("pendingRedemptions", () => {
      beforeEach(async () => {
        // Set the mock to return a specific redemption data when called
        // with the redemption key (built as keccak256(keccak256(redeemerOutputScript) | walletPublicKeyHash))
        // that matches the wallet PKH and redeemer output script used during
        // the test call.
        await bridgeContract.mock.pendingRedemptions
          .withArgs(
            "0x4f5c364239f365622168b8fcb3f4556a8bbad22f5b5ae598757c4fe83b3a78d7"
          )
          .returns({
            redeemer: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
            requestedAmount: BigNumber.from(10000),
            treasuryFee: BigNumber.from(100),
            txMaxFee: BigNumber.from(50),
            requestedAt: BigNumber.from(1650623240),
          } as any)
      })

      it("should return the pending redemption", async () => {
        expect(
          await bridgeHandle.pendingRedemptions(
            "03989d253b17a6a0f41838b84ff0d20e8898f9d7b1a98f2564da4cc29dcf8581d9",
            "a9143ec459d0f3c29286ae5df5fcc421e2786024277e87"
          )
        ).to.be.eql({
          redeemer: Address.from("f39fd6e51aad88f6f4ce6ab8827279cfffb92266"),
          redeemerOutputScript:
            "a9143ec459d0f3c29286ae5df5fcc421e2786024277e87",
          requestedAmount: BigNumber.from(10000),
          treasuryFee: BigNumber.from(100),
          txMaxFee: BigNumber.from(50),
          requestedAt: 1650623240,
        })
      })
    })

    describe("timedOutRedemptions", () => {
      beforeEach(async () => {
        // Set the mock to return a specific redemption data when called
        // with the redemption key (built as keccak256(keccak256(redeemerOutputScript) | walletPublicKeyHash))
        // that matches the wallet PKH and redeemer output script used during
        // the test call.
        await bridgeContract.mock.timedOutRedemptions
          .withArgs(
            "0x4f5c364239f365622168b8fcb3f4556a8bbad22f5b5ae598757c4fe83b3a78d7"
          )
          .returns({
            redeemer: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
            requestedAmount: BigNumber.from(10000),
            treasuryFee: BigNumber.from(100),
            txMaxFee: BigNumber.from(50),
            requestedAt: BigNumber.from(1650623240),
          } as any)
      })

      it("should return the timed-out redemption", async () => {
        expect(
          await bridgeHandle.timedOutRedemptions(
            "03989d253b17a6a0f41838b84ff0d20e8898f9d7b1a98f2564da4cc29dcf8581d9",
            "a9143ec459d0f3c29286ae5df5fcc421e2786024277e87"
          )
        ).to.be.eql({
          redeemer: Address.from("f39fd6e51aad88f6f4ce6ab8827279cfffb92266"),
          redeemerOutputScript:
            "a9143ec459d0f3c29286ae5df5fcc421e2786024277e87",
          requestedAmount: BigNumber.from(10000),
          treasuryFee: BigNumber.from(100),
          txMaxFee: BigNumber.from(50),
          requestedAt: 1650623240,
        })
      })
    })

    describe("revealDeposit", () => {
      beforeEach(async () => {
        await bridgeContract.mock.revealDeposit.returns()

        await bridgeHandle.revealDeposit(
          // Just short byte strings for clarity.
          {
            version: "00000000",
            inputs: "11111111",
            outputs: "22222222",
            locktime: "33333333",
          },
          2,
          {
            depositor: Address.from("934b98637ca318a4d6e7ca6ffd1690b8e77df637"),
            walletPublicKeyHash: "8db50eb52063ea9d98b3eac91489a90f738986f6",
            refundPublicKeyHash: "28e081f285138ccbe389c1eb8985716230129f89",
            blindingFactor: "f9f0c90d00039523",
            refundLocktime: "60bcea61",
          },
          Address.from("82883a4c7a8dd73ef165deb402d432613615ced4")
        )
      })

      it("should reveal the deposit", async () => {
        assertContractCalledWith(bridgeContract, "revealDeposit", [
          {
            version: "0x00000000",
            inputVector: "0x11111111",
            outputVector: "0x22222222",
            locktime: "0x33333333",
          },
          {
            fundingOutputIndex: 2,
            blindingFactor: "0xf9f0c90d00039523",
            walletPubKeyHash: "0x8db50eb52063ea9d98b3eac91489a90f738986f6",
            refundPubKeyHash: "0x28e081f285138ccbe389c1eb8985716230129f89",
            refundLocktime: "0x60bcea61",
            vault: "0x82883a4c7a8dd73ef165deb402d432613615ced4",
          },
        ])
      })
    })

    describe("submitDepositSweepProof", () => {
      beforeEach(async () => {
        await bridgeContract.mock.submitDepositSweepProof.returns()

        await bridgeHandle.submitDepositSweepProof(
          {
            version: "00000000",
            inputs: "11111111",
            outputs: "22222222",
            locktime: "33333333",
          },
          {
            merkleProof: "44444444",
            txIndexInBlock: 5,
            bitcoinHeaders: "66666666",
          },
          {
            transactionHash: TransactionHash.from(
              "f8eaf242a55ea15e602f9f990e33f67f99dfbe25d1802bbde63cc1caabf99668"
            ),
            outputIndex: 8,
            value: BigNumber.from(9999),
          },
          Address.from("82883a4c7a8dd73ef165deb402d432613615ced4")
        )
      })

      it("should submit the deposit sweep proof", () => {
        assertContractCalledWith(bridgeContract, "submitDepositSweepProof", [
          {
            version: "0x00000000",
            inputVector: "0x11111111",
            outputVector: "0x22222222",
            locktime: "0x33333333",
          },
          {
            merkleProof: "0x44444444",
            txIndexInBlock: 5,
            bitcoinHeaders: "0x66666666",
          },
          {
            txHash:
              "0x6896f9abcac13ce6bd2b80d125bedf997ff6330e999f2f605ea15ea542f2eaf8",
            txOutputIndex: 8,
            txOutputValue: BigNumber.from(9999),
          },
          "0x82883a4c7a8dd73ef165deb402d432613615ced4",
        ])
      })
    })

    describe("txProofDifficultyFactor", () => {
      beforeEach(async () => {
        await bridgeContract.mock.txProofDifficultyFactor.returns(
          BigNumber.from(6)
        )
      })

      it("should return the tx proof difficulty factor", async () => {
        expect(await bridgeHandle.txProofDifficultyFactor()).to.be.equal(6)
      })
    })

    describe("requestRedemption", () => {
      beforeEach(async () => {
        await bridgeContract.mock.requestRedemption.returns()

        await bridgeHandle.requestRedemption(
          "03989d253b17a6a0f41838b84ff0d20e8898f9d7b1a98f2564da4cc29dcf8581d9",
          {
            transactionHash: TransactionHash.from(
              "f8eaf242a55ea15e602f9f990e33f67f99dfbe25d1802bbde63cc1caabf99668"
            ),
            outputIndex: 8,
            value: BigNumber.from(9999),
          },
          "a9143ec459d0f3c29286ae5df5fcc421e2786024277e87",
          BigNumber.from(10000)
        )
      })

      it("should request the redemption", async () => {
        assertContractCalledWith(bridgeContract, "requestRedemption", [
          "0x8db50eb52063ea9d98b3eac91489a90f738986f6",
          {
            txHash:
              "0x6896f9abcac13ce6bd2b80d125bedf997ff6330e999f2f605ea15ea542f2eaf8",
            txOutputIndex: 8,
            txOutputValue: BigNumber.from(9999),
          },
          "0x17a9143ec459d0f3c29286ae5df5fcc421e2786024277e87",
          BigNumber.from(10000),
        ])
      })
    })

    describe("submitRedemptionProof", () => {
      beforeEach(async () => {
        await bridgeContract.mock.submitRedemptionProof.returns()

        await bridgeHandle.submitRedemptionProof(
          {
            version: "00000000",
            inputs: "11111111",
            outputs: "22222222",
            locktime: "33333333",
          },
          {
            merkleProof: "44444444",
            txIndexInBlock: 5,
            bitcoinHeaders: "66666666",
          },
          {
            transactionHash: TransactionHash.from(
              "f8eaf242a55ea15e602f9f990e33f67f99dfbe25d1802bbde63cc1caabf99668"
            ),
            outputIndex: 8,
            value: BigNumber.from(9999),
          },
          "03989d253b17a6a0f41838b84ff0d20e8898f9d7b1a98f2564da4cc29dcf8581d9"
        )
      })

      it("should submit the redemption proof", () => {
        assertContractCalledWith(bridgeContract, "submitRedemptionProof", [
          {
            version: "0x00000000",
            inputVector: "0x11111111",
            outputVector: "0x22222222",
            locktime: "0x33333333",
          },
          {
            merkleProof: "0x44444444",
            txIndexInBlock: 5,
            bitcoinHeaders: "0x66666666",
          },
          {
            txHash:
              "0x6896f9abcac13ce6bd2b80d125bedf997ff6330e999f2f605ea15ea542f2eaf8",
            txOutputIndex: 8,
            txOutputValue: BigNumber.from(9999),
          },
          "0x8db50eb52063ea9d98b3eac91489a90f738986f6",
        ])
      })
    })

    describe("deposits", () => {
      context("when the revealed deposit has a vault set", () => {
        beforeEach(async () => {
          // Set the mock to return a specific revealed deposit when called
          // with the deposit key (built as keccak256(depositTxHash | depositOutputIndex)
          // that matches the deposit transaction hash and output index used during
          // the test call.
          await bridgeContract.mock.deposits
            .withArgs(
              "0x01151be714c10edde62a310bf0604c01134450416a0bf8a7bfd43cef90644f0f"
            )
            .returns({
              depositor: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
              amount: BigNumber.from(10000),
              vault: "0x014e1BFbe0f85F129749a8ae0fcB20175433741B",
              revealedAt: 1654774330,
              sweptAt: 1655033516,
              treasuryFee: BigNumber.from(200),
            } as any)
        })

        it("should return the revealed deposit", async () => {
          expect(
            await bridgeHandle.deposits(
              TransactionHash.from(
                "c1082c460527079a84e39ec6481666db72e5a22e473a78db03b996d26fd1dc83"
              ),
              0
            )
          ).to.be.eql({
            depositor: Address.from("f39fd6e51aad88f6f4ce6ab8827279cfffb92266"),
            amount: BigNumber.from(10000),
            vault: Address.from("014e1bfbe0f85f129749a8ae0fcb20175433741b"),
            revealedAt: 1654774330,
            sweptAt: 1655033516,
            treasuryFee: BigNumber.from(200),
          })
        })
      })

      context("when the revealed deposit has no vault set", () => {
        beforeEach(async () => {
          // Set the mock to return a specific revealed deposit when called
          // with the deposit key (built as keccak256(depositTxHash | depositOutputIndex)
          // that matches the deposit transaction hash and output index used during
          // the test call.
          await bridgeContract.mock.deposits
            .withArgs(
              "0x01151be714c10edde62a310bf0604c01134450416a0bf8a7bfd43cef90644f0f"
            )
            .returns({
              depositor: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
              amount: BigNumber.from(10000),
              vault: constants.AddressZero,
              revealedAt: 1654774330,
              sweptAt: 1655033516,
              treasuryFee: BigNumber.from(200),
            } as any)
        })

        it("should return the revealed deposit", async () => {
          expect(
            await bridgeHandle.deposits(
              TransactionHash.from(
                "c1082c460527079a84e39ec6481666db72e5a22e473a78db03b996d26fd1dc83"
              ),
              0
            )
          ).to.be.eql({
            depositor: Address.from("f39fd6e51aad88f6f4ce6ab8827279cfffb92266"),
            amount: BigNumber.from(10000),
            vault: undefined,
            revealedAt: 1654774330,
            sweptAt: 1655033516,
            treasuryFee: BigNumber.from(200),
          })
        })
      })
    })

    describe("activeWalletPublicKey", () => {
      context("when there is an active wallet", () => {
        beforeEach(async () => {
          await bridgeContract.mock.activeWalletPubKeyHash.returns(
            "0x8db50eb52063ea9d98b3eac91489a90f738986f6"
          )

          await bridgeContract.mock.wallets
            .withArgs("0x8db50eb52063ea9d98b3eac91489a90f738986f6")
            .returns({
              ecdsaWalletID:
                "0x9ff37567d973e4d884bc42d2d1a6cb1ff22676ab64f82c62b58e2b0ffd3fff71",
              mainUtxoHash: constants.HashZero,
              pendingRedemptionsValue: BigNumber.from(0),
              createdAt: 1654846075,
              movingFundsRequestedAt: 0,
              closingStartedAt: 0,
              pendingMovedFundsSweepRequestsCount: 0,
              state: 1,
              movingFundsTargetWalletsCommitmentHash: constants.HashZero,
            } as any)

          await walletRegistry.mock.getWalletPublicKey
            .withArgs(
              "0x9ff37567d973e4d884bc42d2d1a6cb1ff22676ab64f82c62b58e2b0ffd3fff71"
            )
            .returns(
              "0x989d253b17a6a0f41838b84ff0d20e8898f9d7b1a98f2564da4cc29dcf8581d9d218b65e7d91c752f7b22eaceb771a9af3a6f3d3f010a5d471a1aeef7d7713af" as any
            )
        })

        it("should return the active wallet's public key", async () => {
          expect(await bridgeHandle.activeWalletPublicKey()).to.be.equal(
            "03989d253b17a6a0f41838b84ff0d20e8898f9d7b1a98f2564da4cc29dcf8581d9"
          )
        })
      })

      context("when there is no active wallet", () => {
        beforeEach(async () => {
          await bridgeContract.mock.activeWalletPubKeyHash.returns(
            "0x0000000000000000000000000000000000000000"
          )
        })

        it("should return undefined", async () => {
          expect(await bridgeHandle.activeWalletPublicKey()).to.be.undefined
        })
      })
    })
  })

  // eslint-disable-next-line valid-jsdoc
  /**
   * Custom assertion used to check whether the given contract function was
   * called with correct parameters. This is a workaround for Waffle's
   * `calledOnContractWith` assertion bug described in the following issue:
   * https://github.com/TrueFiEng/Waffle/issues/468
   * @param contract Contract handle
   * @param functionName Name of the checked function
   * @param parameters Array of function's parameters
   */
  function assertContractCalledWith(
    contract: MockContract,
    functionName: string,
    parameters: any[]
  ) {
    const functionCallData = contract.interface.encodeFunctionData(
      functionName,
      parameters
    )

    assert(
      (contract.provider as unknown as MockProvider).callHistory.some(
        (call) =>
          call.address === contract.address && call.data === functionCallData
      ),
      "Expected contract function was not called"
    )
  }
})
