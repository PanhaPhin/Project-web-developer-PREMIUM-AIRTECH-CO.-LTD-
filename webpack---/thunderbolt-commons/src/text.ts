export const unwrapVerticalText = (text: string): string => {
	return (
		text
			.replace(' data-vertical-text="true"', '')
			.replace('vertical-rl', 'inherit')
			.replace('mixed', 'inherit')
			// Replacing the first two occurrences precisely
			.replace('100%', 'auto')
			.replace('100%', 'auto')
	)
}

export const wrapVerticalText = (text: string): string => {
	return `<div data-vertical-text="true" style="writing-mode: vertical-rl; text-orientation: mixed; height: 100%">${text}</div>`
}

export const dataFixVerticalText = (text: string): string => {
	return text.replace(
		`height:100%; text-orientation:mixed; width:100%; writing-mode:vertical-rl`,
		`height:100%; text-orientation:mixed; writing-mode:vertical-rl`
	)
}

export const hasVerticalTextData = (text: string) =>
	text.indexOf('data-vertical-text="true"') !== -1 || text.indexOf('writing-mode: vertical-rl') !== -1
