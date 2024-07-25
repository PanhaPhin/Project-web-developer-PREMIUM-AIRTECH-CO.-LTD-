import { Experiments } from '@wix/thunderbolt-symbols'

export function stringifyExperiments(beckyExperiments: Experiments): string {
	return Object.keys(beckyExperiments)
		.reduce<Array<string>>((acc, key) => {
			const experimentValue = beckyExperiments[key]
			const experimentName = key.replace(/^specs.thunderbolt/, '')
			experimentValue.toString() === 'true'
				? acc.push(experimentName)
				: acc.push(`${experimentName}:${experimentValue}`)
			return acc
		}, [])
		.sort()
		.join(',')
}
