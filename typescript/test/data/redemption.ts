import { BigNumber, BytesLike } from "ethers"
import {
  DecomposedRawTransaction,
  Proof,
  Transaction,
  RawTransaction,
  UnspentTransactionOutput,
  TransactionMerkleBranch,
  TransactionHash,
} from "../../src/bitcoin"
import { RedemptionRequest } from "../../src/redemption"
import { Address } from "../../src/ethereum"
import { Hex } from "../../src"

/**
 * Private key (testnet) of the wallet.
 */
export const walletPrivateKey =
  "cRk1zdau3jp2X3XsrRKDdviYLuC32fHfyU186wLBEbZWx4uQWW3v"

/**
 * Public key of the wallet in the compressed form corresponding to
 * walletPrivateKey.
 */
export const walletPublicKey =
  "03989d253b17a6a0f41838b84ff0d20e8898f9d7b1a98f2564da4cc29dcf8581d9"

/**
 * P2PKH address corresponding to walletPrivateKey.
 */
export const p2pkhWalletAddress = "mtSEUCE7G8om9zJttG9twtjoiSsUz7QnY9"

/**
 * P2WPKH address corresponding to walletPrivateKey.
 */
export const p2wpkhWalletAddress = "tb1q3k6sadfqv04fmx9naty3fzdfpaecnphkfm3cf3"

/**
 * Represents a set of data used for given sweep scenario.
 */
export interface RedemptionTestData {
  mainUtxo: UnspentTransactionOutput & RawTransaction
  pendingRedemptions: {
    redemptionKey: BytesLike
    pendingRedemption: RedemptionRequest
  }[]
  witness: boolean
  expectedRedemption: {
    transactionHash: TransactionHash
    transaction: RawTransaction
  }
}

/**
 * Test data that is based on a Bitcoin redemption transaction with a single
 * P2PKH redeemer address:
 * https://live.blockcypher.com/btc-testnet/tx/c437f1117db977682334b53a71fbe63a42aab42f6e0976c35b69977f86308c20/
 */
export const singleP2PKHRedemptionWithWitnessChange: RedemptionTestData = {
  mainUtxo: {
    transactionHash: TransactionHash.from(
      "523e4bfb71804e5ed3b76c8933d733339563e560311c1bf835934ee7aae5db20"
    ),
    outputIndex: 1,
    value: BigNumber.from(1481680),
    transactionHex:
      "0100000000010160d264b34e51e6567254bcaf4cc67e1e069483f4249dc50784eae68" +
      "2645fd11d0100000000ffffffff02d84000000000000022002086a303cdd2e2eab1d1" +
      "679f1a813835dc5a1b65321077cdccaf08f98cbf04ca96d09b1600000000001600148" +
      "db50eb52063ea9d98b3eac91489a90f738986f602483045022100ed5fa06ea5e9d4a9" +
      "f0cf0df86a2cd473f693e5bda3d808ba82b04ee26d72b73f0220648f4d7bb25be7819" +
      "22349d382cf0f32ffcbbf89c483776472c2d15644a48d67012103989d253b17a6a0f4" +
      "1838b84ff0d20e8898f9d7b1a98f2564da4cc29dcf8581d900000000",
  },
  pendingRedemptions: [
    {
      redemptionKey:
        "0xcb493004c645792101cfa4cc5da4c16aa3148065034371a6f1478b7df4b92d39",
      pendingRedemption: {
        redeemer: Address.from("82883a4c7a8dd73ef165deb402d432613615ced4"),
        // script for testnet P2PKH address mmTeMR8RKu6QzMGTG4ipA71uewm3EuJng5
        redeemerOutputScript:
          "76a9144130879211c54df460e484ddf9aac009cb38ee7488ac",
        requestedAmount: BigNumber.from(10000),
        treasuryFee: BigNumber.from(1000),
        txMaxFee: BigNumber.from(1600),
        requestedAt: 1650623240,
      },
    },
  ],
  witness: true,
  expectedRedemption: {
    transactionHash: TransactionHash.from(
      "c437f1117db977682334b53a71fbe63a42aab42f6e0976c35b69977f86308c20"
    ),
    transaction: {
      transactionHex:
        "0100000000010120dbe5aae74e9335f81b1c3160e563953333d733896cb7d35e4e80" +
        "71fb4b3e520100000000ffffffff02e81c0000000000001976a9144130879211c54d" +
        "f460e484ddf9aac009cb38ee7488aca8781600000000001600148db50eb52063ea9d" +
        "98b3eac91489a90f738986f602483045022100e1bcecbf3c6fc9a4ce2fc8029264d9" +
        "8a1bef4ff3d590816532097fbb93b7fdfb02206bca6c7af1db4c70d4d2c819eeb4c8" +
        "430a291f5fe874c73c8f44acdd06c25d33012103989d253b17a6a0f41838b84ff0d2" +
        "0e8898f9d7b1a98f2564da4cc29dcf8581d900000000",
    },
  },
}

/**
 * Test data that is based on a Bitcoin redemption transaction with a single
 * P2WPKH redeemer address:
 * https://live.blockcypher.com/btc-testnet/tx/925e61dc31396e7f2cbcc8bc9b4009b4f24ba679257762df078b7e9b875ea110/
 */
export const singleP2WPKHRedemptionWithWitnessChange: RedemptionTestData = {
  mainUtxo: {
    transactionHash: TransactionHash.from(
      "c437f1117db977682334b53a71fbe63a42aab42f6e0976c35b69977f86308c20"
    ),
    outputIndex: 1,
    value: BigNumber.from(1472680),
    transactionHex:
      "0100000000010120dbe5aae74e9335f81b1c3160e563953333d733896cb7d35e4e807" +
      "1fb4b3e520100000000ffffffff02e81c0000000000001976a9144130879211c54df4" +
      "60e484ddf9aac009cb38ee7488aca8781600000000001600148db50eb52063ea9d98b" +
      "3eac91489a90f738986f602483045022100e1bcecbf3c6fc9a4ce2fc8029264d98a1b" +
      "ef4ff3d590816532097fbb93b7fdfb02206bca6c7af1db4c70d4d2c819eeb4c8430a2" +
      "91f5fe874c73c8f44acdd06c25d33012103989d253b17a6a0f41838b84ff0d20e8898" +
      "f9d7b1a98f2564da4cc29dcf8581d900000000",
  },
  pendingRedemptions: [
    {
      redemptionKey:
        "0x52a5e94b7f933cbc9565c61d43a83921a6b7bbf950156a2dfda7743a7cefffbf",
      pendingRedemption: {
        redeemer: Address.from("82883a4c7a8dd73ef165deb402d432613615ced4"),
        // script for testnet P2WPKH address tb1qgycg0ys3c4xlgc8ysnwln2kqp89n3mn5ts7z3l
        redeemerOutputScript: "00144130879211c54df460e484ddf9aac009cb38ee74",
        requestedAmount: BigNumber.from(15000),
        treasuryFee: BigNumber.from(1100),
        txMaxFee: BigNumber.from(1700),
        requestedAt: 1650623240,
      },
    },
  ],
  witness: true,
  expectedRedemption: {
    transactionHash: TransactionHash.from(
      "925e61dc31396e7f2cbcc8bc9b4009b4f24ba679257762df078b7e9b875ea110"
    ),
    transaction: {
      transactionHex:
        "01000000000101208c30867f97695bc376096e2fb4aa423ae6fb713ab534236877b9" +
        "7d11f137c40100000000ffffffff02a82f0000000000001600144130879211c54df4" +
        "60e484ddf9aac009cb38ee745c421600000000001600148db50eb52063ea9d98b3ea" +
        "c91489a90f738986f602483045022100ee8273dd93e85e8a0e0055498803335a370e" +
        "3d25c51ad2890f0b61294e884e8702204ebf3e04161b8172fbdf6070f7b1f22097f3" +
        "d87c0bd32bc53a786971776e7b45012103989d253b17a6a0f41838b84ff0d20e8898" +
        "f9d7b1a98f2564da4cc29dcf8581d900000000",
    },
  },
}

/**
 * Test data that is based on a Bitcoin redemption transaction with a single
 * P2SH redeemer address:
 * https://live.blockcypher.com/btc-testnet/tx/ef25c9c8f4df673def035c0c1880278c90030b3c94a56668109001a591c2c521/
 */
export const singleP2SHRedemptionWithWitnessChange: RedemptionTestData = {
  mainUtxo: {
    transactionHash: TransactionHash.from(
      "925e61dc31396e7f2cbcc8bc9b4009b4f24ba679257762df078b7e9b875ea110"
    ),
    outputIndex: 1,
    value: BigNumber.from(1458780),
    transactionHex:
      "01000000000101208c30867f97695bc376096e2fb4aa423ae6fb713ab534236877b9" +
      "7d11f137c40100000000ffffffff02a82f0000000000001600144130879211c54df4" +
      "60e484ddf9aac009cb38ee745c421600000000001600148db50eb52063ea9d98b3ea" +
      "c91489a90f738986f602483045022100ee8273dd93e85e8a0e0055498803335a370e" +
      "3d25c51ad2890f0b61294e884e8702204ebf3e04161b8172fbdf6070f7b1f22097f3" +
      "d87c0bd32bc53a786971776e7b45012103989d253b17a6a0f41838b84ff0d20e8898" +
      "f9d7b1a98f2564da4cc29dcf8581d900000000",
  },
  pendingRedemptions: [
    {
      redemptionKey:
        "0x4f5c364239f365622168b8fcb3f4556a8bbad22f5b5ae598757c4fe83b3a78d7",
      pendingRedemption: {
        redeemer: Address.from("82883a4c7a8dd73ef165deb402d432613615ced4"),
        // script for testnet P2SH address 2Mxy76sc1qAxiJ1fXMXDXqHvVcPLh6Lf12C
        redeemerOutputScript: "a9143ec459d0f3c29286ae5df5fcc421e2786024277e87",
        requestedAmount: BigNumber.from(13000),
        treasuryFee: BigNumber.from(800),
        txMaxFee: BigNumber.from(1700),
        requestedAt: 1650623240,
      },
    },
  ],
  witness: true,
  expectedRedemption: {
    transactionHash: TransactionHash.from(
      "ef25c9c8f4df673def035c0c1880278c90030b3c94a56668109001a591c2c521"
    ),
    transaction: {
      transactionHex:
        "0100000000010110a15e879b7e8b07df62772579a64bf2b409409bbcc8bc2c7f6e3" +
        "931dc615e920100000000ffffffff02042900000000000017a9143ec459d0f3c292" +
        "86ae5df5fcc421e2786024277e87b4121600000000001600148db50eb52063ea9d9" +
        "8b3eac91489a90f738986f6024830450221009740ad12d2e74c00ccb4741d533d2e" +
        "cd6902289144c4626508afb61eed790c97022006e67179e8e2a63dc4f1ab758867d" +
        "8bbfe0a2b67682be6dadfa8e07d3b7ba04d012103989d253b17a6a0f41838b84ff0" +
        "d20e8898f9d7b1a98f2564da4cc29dcf8581d900000000",
    },
  },
}

/**
 * Test data that is based on a Bitcoin redemption transaction with a single
 * P2SH redeemer address:
 * https://live.blockcypher.com/btc-testnet/tx/3d28bb5bf73379da51bc683f4d0ed31d7b024466c619d80ebd9378077d900be3/
 */
export const singleP2WSHRedemptionWithWitnessChange: RedemptionTestData = {
  mainUtxo: {
    transactionHash: TransactionHash.from(
      "ef25c9c8f4df673def035c0c1880278c90030b3c94a56668109001a591c2c521"
    ),
    outputIndex: 1,
    value: BigNumber.from(1446580),
    transactionHex:
      "0100000000010110a15e879b7e8b07df62772579a64bf2b409409bbcc8bc2c7f6e3" +
      "931dc615e920100000000ffffffff02042900000000000017a9143ec459d0f3c292" +
      "86ae5df5fcc421e2786024277e87b4121600000000001600148db50eb52063ea9d9" +
      "8b3eac91489a90f738986f6024830450221009740ad12d2e74c00ccb4741d533d2e" +
      "cd6902289144c4626508afb61eed790c97022006e67179e8e2a63dc4f1ab758867d" +
      "8bbfe0a2b67682be6dadfa8e07d3b7ba04d012103989d253b17a6a0f41838b84ff0" +
      "d20e8898f9d7b1a98f2564da4cc29dcf8581d900000000",
  },
  pendingRedemptions: [
    {
      redemptionKey:
        "0x2636de6d29da2c7e229a31f3a39b151e2dcd149b1cc2c4e28008f9ab1b02c112",
      pendingRedemption: {
        redeemer: Address.from("82883a4c7a8dd73ef165deb402d432613615ced4"),
        // script for testnet P2WSH address tb1qs63s8nwjut4tr5t8nudgzwp4m3dpkefjzpmumn90pruce0cye2tq2jkq0y
        redeemerOutputScript:
          "002086a303cdd2e2eab1d1679f1a813835dc5a1b65321077cdccaf08f98cbf04ca96",
        requestedAmount: BigNumber.from(18000),
        treasuryFee: BigNumber.from(1000),
        txMaxFee: BigNumber.from(1400),
        requestedAt: 1650623240,
      },
    },
  ],
  witness: true,
  expectedRedemption: {
    transactionHash: TransactionHash.from(
      "3d28bb5bf73379da51bc683f4d0ed31d7b024466c619d80ebd9378077d900be3"
    ),
    transaction: {
      transactionHex:
        "0100000000010121c5c291a50190106866a5943c0b03908c2780180c5c03ef3d67d" +
        "ff4c8c925ef0100000000ffffffff02f03c00000000000022002086a303cdd2e2ea" +
        "b1d1679f1a813835dc5a1b65321077cdccaf08f98cbf04ca964cd01500000000001" +
        "600148db50eb52063ea9d98b3eac91489a90f738986f602483045022100bef6177f" +
        "72f434248271cf5d18c1ce6add52dcf533ddda215240a858cb63cd070220016a68c" +
        "457f84f01108e1b001e8f81a9b073a3e08511265614318fa0d395ef4d012103989d" +
        "253b17a6a0f41838b84ff0d20e8898f9d7b1a98f2564da4cc29dcf8581d900000000",
    },
  },
}

/**
 * Test data that is based on a Bitcoin redemption transaction with multiple
 * redeemer addresses (P2PKH, P2WPKH, P2SH and P2WSH):
 * https://live.blockcypher.com/btc-testnet/tx/f70ff89fd2b6226183e4b8143cc5f0f457f05dd1dca0c6151ab66f4523d972b7/
 */
export const multipleRedemptionsWithWitnessChange: RedemptionTestData = {
  mainUtxo: {
    transactionHash: TransactionHash.from(
      "3d28bb5bf73379da51bc683f4d0ed31d7b024466c619d80ebd9378077d900be3"
    ),
    outputIndex: 1,
    value: BigNumber.from(1429580),
    transactionHex:
      "0100000000010121c5c291a50190106866a5943c0b03908c2780180c5c03ef3d67d" +
      "ff4c8c925ef0100000000ffffffff02f03c00000000000022002086a303cdd2e2ea" +
      "b1d1679f1a813835dc5a1b65321077cdccaf08f98cbf04ca964cd01500000000001" +
      "600148db50eb52063ea9d98b3eac91489a90f738986f602483045022100bef6177f" +
      "72f434248271cf5d18c1ce6add52dcf533ddda215240a858cb63cd070220016a68c" +
      "457f84f01108e1b001e8f81a9b073a3e08511265614318fa0d395ef4d012103989d" +
      "253b17a6a0f41838b84ff0d20e8898f9d7b1a98f2564da4cc29dcf8581d900000000",
  },
  pendingRedemptions: [
    {
      redemptionKey:
        "0xcb493004c645792101cfa4cc5da4c16aa3148065034371a6f1478b7df4b92d39",
      pendingRedemption: {
        redeemer: Address.from("82883a4c7a8dd73ef165deb402d432613615ced4"),
        // script for testnet P2PKH address mmTeMR8RKu6QzMGTG4ipA71uewm3EuJng5
        redeemerOutputScript:
          "76a9144130879211c54df460e484ddf9aac009cb38ee7488ac",
        requestedAmount: BigNumber.from(18000),
        treasuryFee: BigNumber.from(1000),
        txMaxFee: BigNumber.from(1100),
        requestedAt: 1650623240,
      },
    },
    {
      redemptionKey:
        "0x52a5e94b7f933cbc9565c61d43a83921a6b7bbf950156a2dfda7743a7cefffbf",
      pendingRedemption: {
        redeemer: Address.from("82883a4c7a8dd73ef165deb402d432613615ced4"),
        // script for testnet P2WPKH address tb1qgycg0ys3c4xlgc8ysnwln2kqp89n3mn5ts7z3l
        redeemerOutputScript: "00144130879211c54df460e484ddf9aac009cb38ee74",
        requestedAmount: BigNumber.from(13000),
        treasuryFee: BigNumber.from(800),
        txMaxFee: BigNumber.from(900),
        requestedAt: 1650623240,
      },
    },
    {
      redemptionKey:
        "0x4f5c364239f365622168b8fcb3f4556a8bbad22f5b5ae598757c4fe83b3a78d7",
      pendingRedemption: {
        redeemer: Address.from("82883a4c7a8dd73ef165deb402d432613615ced4"),
        // script for testnet P2SH address 2Mxy76sc1qAxiJ1fXMXDXqHvVcPLh6Lf12C
        redeemerOutputScript: "a9143ec459d0f3c29286ae5df5fcc421e2786024277e87",
        requestedAmount: BigNumber.from(12000),
        treasuryFee: BigNumber.from(1100),
        txMaxFee: BigNumber.from(1000),
        requestedAt: 1650623240,
      },
    },
    {
      redemptionKey:
        "0x2636de6d29da2c7e229a31f3a39b151e2dcd149b1cc2c4e28008f9ab1b02c112",
      pendingRedemption: {
        redeemer: Address.from("82883a4c7a8dd73ef165deb402d432613615ced4"),
        // script for testnet P2WSH address tb1qs63s8nwjut4tr5t8nudgzwp4m3dpkefjzpmumn90pruce0cye2tq2jkq0y
        redeemerOutputScript:
          "002086a303cdd2e2eab1d1679f1a813835dc5a1b65321077cdccaf08f98cbf04ca96",
        requestedAmount: BigNumber.from(15000),
        treasuryFee: BigNumber.from(700),
        txMaxFee: BigNumber.from(1400),
        requestedAt: 1650623240,
      },
    },
  ],
  witness: true,
  expectedRedemption: {
    transactionHash: TransactionHash.from(
      "f70ff89fd2b6226183e4b8143cc5f0f457f05dd1dca0c6151ab66f4523d972b7"
    ),
    transaction: {
      transactionHex:
        "01000000000101e30b907d077893bd0ed819c66644027b1dd30e4d3f68bc51da793" +
        "3f75bbb283d0100000000ffffffff051c3e0000000000001976a9144130879211c5" +
        "4df460e484ddf9aac009cb38ee7488ac242c0000000000001600144130879211c54" +
        "df460e484ddf9aac009cb38ee74ac2600000000000017a9143ec459d0f3c29286ae" +
        "5df5fcc421e2786024277e87643200000000000022002086a303cdd2e2eab1d1679" +
        "f1a813835dc5a1b65321077cdccaf08f98cbf04ca96ccfb1400000000001600148d" +
        "b50eb52063ea9d98b3eac91489a90f738986f602483045022100adc5b0cffc65444" +
        "cf16873eb57cb702414ee36ca907ad3cf57676abe83c0f80502204a206d9b55eeee" +
        "05d9647e95d15ed5143eaad6cc8c5bc2c1919b69addc18db29012103989d253b17a" +
        "6a0f41838b84ff0d20e8898f9d7b1a98f2564da4cc29dcf8581d900000000",
    },
  },
}

/**
 * Test data that is based on a Bitcoin redemption transaction with two redeemer
 * addresses and has no change:
 * https://live.blockcypher.com/btc-testnet/tx/afcdf8f91273b73abc40018873978c22bbb7c3d8d669ef2faffa0c4b0898c8eb/
 */
export const multipleRedemptionsWithoutChange: RedemptionTestData = {
  mainUtxo: {
    transactionHash: TransactionHash.from(
      "7dd38b48cb626580d317871c5b716eaf4a952ceb67ba3aa4ca76e3dc7cdcc65b"
    ),
    outputIndex: 1,
    value: BigNumber.from(10000),
    transactionHex:
      "02000000000101c17208c443a3d3d2223884ef11ac83dadb1a3abe4d3474694414c8d" +
      "cd3c697510100000000feffffff0224d38a5b0000000016001414c829f9d1770ebab9" +
      "8bd1acb39e428cffe7580310270000000000001600148db50eb52063ea9d98b3eac91" +
      "489a90f738986f60247304402205d71cd954aa20b9c04266999baa8b2e1f04b7ecf41" +
      "9d48775ec78b81c3dbf6d5022076eb8cfc0f2fbd6178fdec4039570a1404c76fca4b7" +
      "2f6a34706b9c9c801ff7b0121033483097979eaff12af144dde368235592893fc2cb7" +
      "477c3c4e34a0770f01f4e071832100",
  },
  pendingRedemptions: [
    {
      redemptionKey:
        "0xcb493004c645792101cfa4cc5da4c16aa3148065034371a6f1478b7df4b92d39",
      pendingRedemption: {
        redeemer: Address.from("82883a4c7a8dd73ef165deb402d432613615ced4"),
        // script for testnet P2PKH address mmTeMR8RKu6QzMGTG4ipA71uewm3EuJng5
        redeemerOutputScript:
          "76a9144130879211c54df460e484ddf9aac009cb38ee7488ac",
        requestedAmount: BigNumber.from(6000),
        treasuryFee: BigNumber.from(0),
        txMaxFee: BigNumber.from(800),
        requestedAt: 1650623240,
      },
    },
    {
      redemptionKey:
        "0xa690d9da3e64c337eb11344b94cf948ec2da333f0a985e09f1c120a326f6de87",
      pendingRedemption: {
        redeemer: Address.from("82883a4c7a8dd73ef165deb402d432613615ced4"),
        // script for testnet P2WPKH address tb1qf0ulldawp79s7knz9v254j5zjyn0demfx2d0xx
        redeemerOutputScript: "00144bf9ffb7ae0f8b0f5a622b154aca829126f6e769",
        requestedAmount: BigNumber.from(4000),
        treasuryFee: BigNumber.from(0),
        txMaxFee: BigNumber.from(900),
        requestedAt: 1650623240,
      },
    },
  ],
  witness: true,
  expectedRedemption: {
    transactionHash: TransactionHash.from(
      "afcdf8f91273b73abc40018873978c22bbb7c3d8d669ef2faffa0c4b0898c8eb"
    ),
    transaction: {
      transactionHex:
        "010000000001015bc6dc7cdce376caa43aba67eb2c954aaf6e715b1c8717d380656" +
        "2cb488bd37d0100000000ffffffff0250140000000000001976a9144130879211c5" +
        "4df460e484ddf9aac009cb38ee7488ac1c0c0000000000001600144bf9ffb7ae0f8" +
        "b0f5a622b154aca829126f6e76902473044022077174ae4d0a8e9d802f45b1a67cb" +
        "4079abbbc4f110919b2e6b67fc991326e0ca02206efb3d36a58f48d123e845fd868" +
        "593af27e905adecb261d0120ba5b05ccc96fd012103989d253b17a6a0f41838b84f" +
        "f0d20e8898f9d7b1a98f2564da4cc29dcf8581d900000000",
    },
  },
}

/**
 * Test data that is based on a Bitcoin redemption transaction with one
 * redeemer address and P2PKH change:
 * https://live.blockcypher.com/btc-testnet/tx/0fec22d0fecd6607a0429210d04e9465681507d514f3edf0f07def96eda0f89d/
 */
export const singleP2SHRedemptionWithNonWitnessChange: RedemptionTestData = {
  mainUtxo: {
    transactionHash: TransactionHash.from(
      "f70ff89fd2b6226183e4b8143cc5f0f457f05dd1dca0c6151ab66f4523d972b7"
    ),
    outputIndex: 4,
    value: BigNumber.from(1375180),
    transactionHex:
      "01000000000101e30b907d077893bd0ed819c66644027b1dd30e4d3f68bc51da7933f" +
      "75bbb283d0100000000ffffffff051c3e0000000000001976a9144130879211c54df4" +
      "60e484ddf9aac009cb38ee7488ac242c0000000000001600144130879211c54df460e" +
      "484ddf9aac009cb38ee74ac2600000000000017a9143ec459d0f3c29286ae5df5fcc4" +
      "21e2786024277e87643200000000000022002086a303cdd2e2eab1d1679f1a813835d" +
      "c5a1b65321077cdccaf08f98cbf04ca96ccfb1400000000001600148db50eb52063ea" +
      "9d98b3eac91489a90f738986f602483045022100adc5b0cffc65444cf16873eb57cb7" +
      "02414ee36ca907ad3cf57676abe83c0f80502204a206d9b55eeee05d9647e95d15ed5" +
      "143eaad6cc8c5bc2c1919b69addc18db29012103989d253b17a6a0f41838b84ff0d20" +
      "e8898f9d7b1a98f2564da4cc29dcf8581d900000000",
  },
  pendingRedemptions: [
    {
      redemptionKey:
        "0x4f5c364239f365622168b8fcb3f4556a8bbad22f5b5ae598757c4fe83b3a78d7",
      pendingRedemption: {
        redeemer: Address.from("82883a4c7a8dd73ef165deb402d432613615ced4"),
        // script for testnet P2SH address 2Mxy76sc1qAxiJ1fXMXDXqHvVcPLh6Lf12C
        redeemerOutputScript: "a9143ec459d0f3c29286ae5df5fcc421e2786024277e87",
        requestedAmount: BigNumber.from(12000),
        treasuryFee: BigNumber.from(1000),
        txMaxFee: BigNumber.from(1200),
        requestedAt: 1650623240,
      },
    },
  ],
  witness: false, // False will result in a P2PKH output
  expectedRedemption: {
    transactionHash: TransactionHash.from(
      "0fec22d0fecd6607a0429210d04e9465681507d514f3edf0f07def96eda0f89d"
    ),
    transaction: {
      transactionHex:
        "01000000000101b772d923456fb61a15c6a0dcd15df057f4f0c53c14b8e4836122b" +
        "6d29ff80ff70400000000ffffffff02482600000000000017a9143ec459d0f3c292" +
        "86ae5df5fcc421e2786024277e87d4d01400000000001976a9148db50eb52063ea9" +
        "d98b3eac91489a90f738986f688ac02473044022007fe551170700fa35bda9362d3" +
        "c9d340a674e1ae3300b266c5c10a283aa703b9022067910d6bfe4c62b14bd2f3244" +
        "47d65bddf732db3d3074e40910d51964c072e6d012103989d253b17a6a0f41838b8" +
        "4ff0d20e8898f9d7b1a98f2564da4cc29dcf8581d900000000",
    },
  },
}

/**
 * Represents data for tests of assembling redemption proofs.
 */
export interface RedemptionProofTestData {
  bitcoinChainData: {
    transaction: Transaction
    rawTransaction: RawTransaction
    accumulatedTxConfirmations: number
    latestBlockHeight: number
    headersChain: string
    transactionMerkleBranch: TransactionMerkleBranch
  }
  expectedRedemptionProof: {
    redemptionTx: DecomposedRawTransaction
    redemptionProof: Proof
    mainUtxo: UnspentTransactionOutput
    walletPublicKey: string
  }
}

/**
 * Test data that is based on a Bitcoin testnet transaction with multiple redemption outputs
 * https://live.blockcypher.com/btc-testnet/tx/f70ff89fd2b6226183e4b8143cc5f0f457f05dd1dca0c6151ab66f4523d972b7/
 */
export const redemptionProof: RedemptionProofTestData = {
  bitcoinChainData: {
    transaction: {
      transactionHash: TransactionHash.from(
        "f70ff89fd2b6226183e4b8143cc5f0f457f05dd1dca0c6151ab66f4523d972b7"
      ),
      inputs: [
        {
          transactionHash: TransactionHash.from(
            "3d28bb5bf73379da51bc683f4d0ed31d7b024466c619d80ebd9378077d900be3"
          ),
          outputIndex: 1,
          scriptSig: Hex.from(""),
        },
      ],
      outputs: [
        {
          outputIndex: 0,
          value: BigNumber.from(15900),
          scriptPubKey: Hex.from(
            "76a9144130879211c54df460e484ddf9aac009cb38ee7488ac"
          ),
        },
        {
          outputIndex: 1,
          value: BigNumber.from(11300),
          scriptPubKey: Hex.from(
            "00144130879211c54df460e484ddf9aac009cb38ee74"
          ),
        },
        {
          outputIndex: 2,
          value: BigNumber.from(9900),
          scriptPubKey: Hex.from(
            "a9143ec459d0f3c29286ae5df5fcc421e2786024277e87"
          ),
        },
        {
          outputIndex: 3,
          value: BigNumber.from(12900),
          scriptPubKey: Hex.from(
            "002086a303cdd2e2eab1d1679f1a813835dc5a1b65321077cdccaf08f98cbf04ca96"
          ),
        },
        {
          outputIndex: 4,
          value: BigNumber.from(1375180),
          scriptPubKey: Hex.from(
            "00148db50eb52063ea9d98b3eac91489a90f738986f6"
          ),
        },
      ],
    },
    accumulatedTxConfirmations: 50,
    rawTransaction: {
      transactionHex:
        "01000000000101e30b907d077893bd0ed819c66644027b1dd30e4d3f68bc51da7933" +
        "f75bbb283d0100000000ffffffff051c3e0000000000001976a9144130879211c54d" +
        "f460e484ddf9aac009cb38ee7488ac242c0000000000001600144130879211c54df4" +
        "60e484ddf9aac009cb38ee74ac2600000000000017a9143ec459d0f3c29286ae5df5" +
        "fcc421e2786024277e87643200000000000022002086a303cdd2e2eab1d1679f1a81" +
        "3835dc5a1b65321077cdccaf08f98cbf04ca96ccfb1400000000001600148db50eb5" +
        "2063ea9d98b3eac91489a90f738986f602483045022100adc5b0cffc65444cf16873" +
        "eb57cb702414ee36ca907ad3cf57676abe83c0f80502204a206d9b55eeee05d9647e" +
        "95d15ed5143eaad6cc8c5bc2c1919b69addc18db29012103989d253b17a6a0f41838" +
        "b84ff0d20e8898f9d7b1a98f2564da4cc29dcf8581d900000000",
    },
    latestBlockHeight: 2226015,
    headersChain:
      "04e000203d93e4b82b59ccaae5aff315b9319248c1119f8f848e421516000000000000" +
      "00f28145109cd15498a2c4264dcda1c3d40d1ab1117f6365cc345e5bab9eb8e5a2f990" +
      "5e62341f5c19adebd9480000c020a33f8505bae0c529af29b00741e2828e4b4ef2cf4d" +
      "a2af790d00000000000000f1dad96fa7c65ae0b2582268ebf6e47b1af887ae9b5af064" +
      "ff87b361259f9bb212915e62341f5c19913d8a790000002074ac47fe867411f520786b" +
      "bb056d33cc5e412799355f22541600000000000000e428a225d38073c8e8584cf162b4" +
      "cdc17eaf766f2fc1beae23f0ebac8b29964ec4955e62ffff001d5ec11e770000a020bc" +
      "1e329ea2658a4e0dfe27cb80e2f9712d78e02c5428eb86db93c7e3000000006381e8dd" +
      "f3245ddd74afb580b6d1e508273673d14b3620c098bde4c50bdbf65de1975e62341f5c" +
      "195a29773400006020e7fc1afb505baced47a255d8a14cb7162b6f94d6aea6a89f4300" +
      "000000000000ad26d482c0f48d0aeb1e1d9a8189df9f8dae693203c117a777c6c15522" +
      "2da759ef975e62341f5c19595dff820000802004bdf8678a1fd09fd50987f884793410" +
      "62e7f2ad11098bd00800000000000000add66b467729d264031adec83bc06e30781153" +
      "0b98f49b095bd4c1fee2472e841d995e62341f5c19945d657200004020f8228183708c" +
      "5f703e673f381ecee895a8642eed9f700b9c2b00000000000000465ec2f30447552a4a" +
      "30ee63964aaebcb040649269eab449fb51823d58835a4aed9a5e62341f5c192fd94baa",
    transactionMerkleBranch: {
      blockHeight: 2196313,
      merkle: [
        "2e89760feb82c022f9b6757c0a758f8fea953ffce9051cbe5a7cc20e0603c940",
        "ad1cae6d060b5dac5d7ff1a933680f15dac822f52316c89e95363856b8a742ae",
        "acf6ecc3da4654362678ac2bf0abf82aba1f2071e143718df2b079124e88fec7",
        "65ea59172f35ee6db6e4194227bea23daedbda8299bea94710f21c97f3e9cc17",
        "8c5b4ce089d0c450bf6125e7d342114246802bf4c9638d222aa9fcbe8e06024e",
      ],
      position: 4,
    },
  },
  expectedRedemptionProof: {
    redemptionTx: {
      version: "01000000",
      inputs:
        "01e30b907d077893bd0ed819c66644027b1dd30e4d3f68bc51da7933f75bbb283d0" +
        "100000000ffffffff",
      outputs:
        "051c3e0000000000001976a9144130879211c54df460e484ddf9aac009cb38ee748" +
        "8ac242c0000000000001600144130879211c54df460e484ddf9aac009cb38ee74ac" +
        "2600000000000017a9143ec459d0f3c29286ae5df5fcc421e2786024277e8764320" +
        "0000000000022002086a303cdd2e2eab1d1679f1a813835dc5a1b65321077cdccaf" +
        "08f98cbf04ca96ccfb1400000000001600148db50eb52063ea9d98b3eac91489a90" +
        "f738986f6",
      locktime: "00000000",
    },
    redemptionProof: {
      merkleProof:
        "40c903060ec27c5abe1c05e9fc3f95ea8f8f750a7c75b6f922c082eb0f76892eae4" +
        "2a7b8563836959ec81623f522c8da150f6833a9f17f5dac5d0b066dae1cadc7fe88" +
        "4e1279b0f28d7143e171201fba2af8abf02bac7826365446dac3ecf6ac17cce9f39" +
        "71cf21047a9be9982dadbae3da2be274219e4b66dee352f1759ea654e02068ebefc" +
        "a92a228d63c9f42b8046421142d3e72561bf50c4d089e04c5b8c",
      txIndexInBlock: 4,
      bitcoinHeaders:
        "04e000203d93e4b82b59ccaae5aff315b9319248c1119f8f848e421516000000000" +
        "00000f28145109cd15498a2c4264dcda1c3d40d1ab1117f6365cc345e5bab9eb8e5" +
        "a2f9905e62341f5c19adebd9480000c020a33f8505bae0c529af29b00741e2828e4" +
        "b4ef2cf4da2af790d00000000000000f1dad96fa7c65ae0b2582268ebf6e47b1af8" +
        "87ae9b5af064ff87b361259f9bb212915e62341f5c19913d8a790000002074ac47f" +
        "e867411f520786bbb056d33cc5e412799355f22541600000000000000e428a225d3" +
        "8073c8e8584cf162b4cdc17eaf766f2fc1beae23f0ebac8b29964ec4955e62ffff0" +
        "01d5ec11e770000a020bc1e329ea2658a4e0dfe27cb80e2f9712d78e02c5428eb86" +
        "db93c7e3000000006381e8ddf3245ddd74afb580b6d1e508273673d14b3620c098b" +
        "de4c50bdbf65de1975e62341f5c195a29773400006020e7fc1afb505baced47a255" +
        "d8a14cb7162b6f94d6aea6a89f4300000000000000ad26d482c0f48d0aeb1e1d9a8" +
        "189df9f8dae693203c117a777c6c155222da759ef975e62341f5c19595dff820000" +
        "802004bdf8678a1fd09fd50987f88479341062e7f2ad11098bd0080000000000000" +
        "0add66b467729d264031adec83bc06e307811530b98f49b095bd4c1fee2472e841d" +
        "995e62341f5c19945d657200004020f8228183708c5f703e673f381ecee895a8642" +
        "eed9f700b9c2b00000000000000465ec2f30447552a4a30ee63964aaebcb0406492" +
        "69eab449fb51823d58835a4aed9a5e62341f5c192fd94baa",
    },
    mainUtxo: {
      transactionHash: TransactionHash.from(
        "3d28bb5bf73379da51bc683f4d0ed31d7b024466c619d80ebd9378077d900be3"
      ),
      outputIndex: 1,
      value: BigNumber.from(1429580),
    },
    walletPublicKey:
      "03989d253b17a6a0f41838b84ff0d20e8898f9d7b1a98f2564da4cc29dcf8581d9",
  },
}
