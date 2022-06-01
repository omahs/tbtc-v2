import { BigNumber, Contract, utils } from "ethers"
import type { UnspentTransactionOutput } from "@keep-network/tbtc-v2.ts/dist/bitcoin"
import type { Deposit } from "@keep-network/tbtc-v2.ts/dist/deposit"
import crypto from "crypto"
import TBTC from "@keep-network/tbtc-v2.ts"
import { SystemTestsContext } from "./context"

/**
 * Default refund public key used for deposits. Their corresponding private key:
 * 7c246a5d2fcf476fd6f805cb8174b1cf441b13ea414e5560ca2bdc963aeb7d0c
 */
export const DEFAULT_REFUND_PUBLIC_KEY =
  "03989d253b17a6a0f41838b84ff0d20e8898f9d7b1a98f2564da4cc29dcf8581d9"

/**
 * Generates a deposit object based on the given parameters.
 * @param depositorAddress Ethereum address of the depositor.
 * @param amount Amount of the deposit in satoshi.
 * @param walletPublicKey Compressed ECDSA public key of the target wallet.
 * @param refundPublicKey Compressed ECDSA public key that can be used for
 *        refund. Optional parameter, default value is used if not set
 *        @see {DEFAULT_REFUND_PUBLIC_KEY}.
 * @returns Deposit object.
 */
export function generateDeposit(
  depositorAddress: string,
  amount: BigNumber,
  walletPublicKey: string,
  refundPublicKey?: string
): Deposit {
  const blindingFactor = crypto.randomBytes(8).toString("hex")

  const resolvedRefundPublicKey = refundPublicKey
    ? refundPublicKey
    : DEFAULT_REFUND_PUBLIC_KEY

  const refundLocktime = TBTC.computeDepositRefundLocktime(
    Math.floor(Date.now() / 1000)
  )

  return {
    // TODO: The tbtc-v2.ts library should expose the EthereumIdentifier
    //       class that will handle that conversion.
    depositor: {
      identifierHex: depositorAddress.substring(2).toLowerCase(),
    },
    amount: amount,
    blindingFactor: blindingFactor,
    walletPublicKey: walletPublicKey,
    refundPublicKey: resolvedRefundPublicKey,
    refundLocktime: refundLocktime,
  }
}

/**
 * Checks whether the given deposit was actually revealed to the bridge.
 * @param systemTestsContext System tests context.
 * @param depositUtxo The UTXO produced by the deposit Bitcoin transaction.
 * @returns True, if the deposit was revealed. False otherwise.
 */
export async function isDepositRevealed(
  systemTestsContext: SystemTestsContext,
  depositUtxo: UnspentTransactionOutput
) {
  // TODO: The tbtc-v2 library should expose a method to check that in a
  //       seamless way. The current implementation of this function is
  //       just a workaround and the tbtc-v2 library implementation should
  //       be preferred once it is ready.

  const bridgeDeploymentInfo =
    systemTestsContext.contractsDeploymentInfo.contracts["Bridge"]

  const bridge = new Contract(
    bridgeDeploymentInfo.address,
    bridgeDeploymentInfo.abi,
    systemTestsContext.maintainer
  )

  const transactionHashLE = Buffer.from(depositUtxo.transactionHash, "hex")
    .reverse()
    .toString("hex")

  const depositKey = utils.solidityKeccak256(
    ["bytes32", "uint32"],
    [`0x${transactionHashLE}`, depositUtxo.outputIndex]
  )

  const deposit = await bridge.deposits(depositKey)

  return deposit.revealedAt > 0
}
