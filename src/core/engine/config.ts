import dotenv from 'dotenv'
import { ethers } from 'ethers'

import { logger } from '@/lib/logger'

// * Load dotenv config here so that when a user imports the library
//   they automatically have access to process.env based on their .env.
dotenv.config()

// * Resource to acquire public RPC node URLs to use as default:
//   - https://chainlist.org/
const DEFAULT_RPC = {
	// ! Mainnet
	1: {
		default: 'wss://ethereum.publicnode.com'
	},
	// ! Optimism
	10: {
		default: 'wss://optimism.publicnode.com'
	},
	// ! Polygon
	137: {
		default: 'wss://polygon-bor.publicnode.com'
	},
	// ! Base
	8453: {
		default: 'wss://base.publicnode.com'
	},
	// ! Arbitrum
	42161: {
		default: 'wss://arbitrum-one.publicnode.com'
	}
} as const

const DEFAULT_NETWORK: keyof typeof DEFAULT_RPC = 1

export function defineConfig({
	chainId,
	references,
	providers = DEFAULT_RPC
}: Partial<{
	chainId: keyof typeof DEFAULT_RPC
	references: {
		etherscan: (address: string) => string
		contracts: Record<string, `0x${string}`>
	}
	// * Allow independent instances to provide their own providers.
	providers: Record<string, Record<string, `wss://${string}`>>
}> = {}) {
	if (providers === DEFAULT_RPC)
		logger.warn(
			'! Using default RPC providers. This is not recommended in production.'
		)

	return {
		// ! Wrap every RPC url in a WebSocketProvider.
		providers: Object.fromEntries(
			Object.entries(providers).map(([key, value]) => [
				key,
				Object.fromEntries(
					Object.entries(value).map(([key, value]) => [
						key,
						new ethers.providers.WebSocketProvider(
							chainId
								? providers[chainId].default
								: providers[DEFAULT_NETWORK].default
						)
					])
				)
			])
		),
		references
	} as const
}
