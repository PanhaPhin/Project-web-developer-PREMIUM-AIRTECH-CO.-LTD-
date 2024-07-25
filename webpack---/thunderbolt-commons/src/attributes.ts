export function getDataAttributes(record: Record<string, any>) {
	return Object.entries(record).reduce<Record<string, any>>((acc, [key, value]) => {
		if (key.startsWith('data-')) {
			acc[key] = value
		}

		return acc
	}, {})
}
