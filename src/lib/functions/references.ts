import { default as fse } from 'fs-extra'

import { defineConfig } from '@/core/engine/config'
import { useEtherscan } from '@/lib/hooks/useEtherscan'
import { logger } from '@/lib/logger'

const generateStaticReferences: (props: {
	key: string
	name: string
	abi: string
}) => void = ({ key, name, abi }) => {
	const protocolGeneration = `
    // Autogenerated file for @${key}. Do not edit.
    export const ${name.replace(' ', '_').toUpperCase()}_NAME = '${name}'
    export const ${name.replace(' ', '_').toUpperCase()}_ABI = ${abi}`

	if (!fse.existsSync(`./src/references/${key}`))
		fse.mkdirSync(`./src/references/${key}`, {
			recursive: true
		})

	fse.writeFileSync(`./src/references/${key}/index.ts`, protocolGeneration)
}

const generateDynamicReferences: (props: {
	name: string
	source: string
}) => Promise<void> = async ({ name, source }) => {
	// * Remove the double curly braces from the source code.
	// ! I am not sure why this is happening, but it is solved now.
	source = source.replace('{{', '{')
	source = source.replace('}}', '}')

	const contractSources = JSON.parse(source).sources as {
		[key: string]: { content: string }
	}

	Object.entries(contractSources).forEach(([sourceKey, value]) => {
		const directory = `./src/references/${name}/${sourceKey
			.replace('./', '')
			.split('/')
			.slice(0, -1)
			.join('/')}`

		const filename = sourceKey.replace('./', '').split('/').slice(-1)[0]

		fse.mkdirSync(directory, {
			recursive: true
		})

		fse.writeFileSync(`${directory}/${filename}`, value.content)
	})
}

export const generateReferences = async <
	T extends ReturnType<typeof defineConfig>['references']
>(
	references: T
) => {
	if (references === undefined) {
		logger.warn('No references defined.')
		return
	}

	Object.entries(references.contracts).forEach(async ([key, value]) => {
		const { abi, name, source } = await useEtherscan(
			references.etherscan,
			value
		)

		generateStaticReferences({ key, name, abi })
		generateDynamicReferences({ name, source })
	})

	logger.success(
		`References generated for ${
			Object.keys(references.contracts).length
		} contracts.`
	)

	process.exit()
}
