import _ from 'lodash'
import { Experiments } from '@wix/thunderbolt-symbols/dist'

function getResources() {
	try {
		function getServiceName(item: any) {
			try {
				if (!item) {
					return null
				}
				if (item.name.includes('static.parastorage.com')) {
					return item.name.split('/')[4]
				}
				return item.name.split('/')[2]
			} catch (e) {
				return null
			}
		}
		const scripts = performance
			.getEntries()
			.filter((i) => i.entryType === 'resource')
			.filter((i: any) => i.initiatorType === 'script')

		const res = scripts
			.map((s: any) => Object.assign(s, { service: getServiceName(s) }))
			.map(({ service, decodedBodySize, name, transferSize }) => ({
				service,
				decodedBodySize,
				name,
				transferSize,
			}))

		const groups = _(res)
			.groupBy('service')
			.mapValues((items) => _.sumBy(items, 'decodedBodySize'))
			.value()
		return groups
	} catch (e) {
		return null
	}
}
export function addScriptGroupsBiFields(experiments: Experiments) {
	try {
		const groupsScriptResources = performance
			.getEntries()
			.filter(
				(entry: any) => entry.entryType === 'resource' && entry.name.includes('.js') && entry.decodedBodySize
			)

		const countScripts = groupsScriptResources.length.toString()
		const verifyTransferSize = () =>
			groupsScriptResources.length > 0 &&
			groupsScriptResources.every((resource: any) => _.isNumber(resource.decodedBodySize))

		const totalScriptsSize = verifyTransferSize()
			? groupsScriptResources
					.map((resource: any) => resource.decodedBodySize)
					.reduce((acc, current) => acc + current, 0)
					.toString()
			: null

		const longTasksPerformanceApi = window.longTasksPerformanceApi || []
		const getLongTasksEvents = () =>
			longTasksPerformanceApi.map((event) => ({
				startTime: Math.round(event.startTime),
				duration: Math.round(event.duration),
			}))
		const verifyLongTasksEvents = () =>
			window && window.longTasksPerformanceApi && window.longTasksPerformanceApi.length > 0

		const verifyResources = () =>
			window && window.performance && experiments['specs.thunderbolt.send_script_resources_to_bi']

		const longTasks = verifyLongTasksEvents() ? getLongTasksEvents() : null

		const resources = verifyResources() ? getResources() : null

		return {
			countScripts,
			...(resources ? { resources: JSON.stringify(resources) } : {}),
			...(totalScriptsSize && totalScriptsSize > 0 ? { totalScriptsSize } : {}),
			...(longTasks
				? { longTasksItems: JSON.stringify(longTasks), longTasksNumber: longTasks.length.toString() }
				: {}),
		}
	} catch (e) {
		console.error(e)
		return {
			countScripts: '',
			totalScriptsSize: '',
			longTasksItems: '',
			resources: '',
		}
	}
}
