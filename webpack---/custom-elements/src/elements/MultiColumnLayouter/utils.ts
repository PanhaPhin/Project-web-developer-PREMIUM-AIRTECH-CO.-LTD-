export const checkForFit = (heights: Array<number>, finalColHeight: number, numOfCols: number) => {
	let col = 1
	let colTotal = 0

	// eslint-disable-next-line @typescript-eslint/prefer-for-of
	for (let i = 0; i < heights.length; i++) {
		const currentItemHeight = heights[i]
		if (currentItemHeight > finalColHeight) {
			return false
		}
		colTotal += currentItemHeight
		if (colTotal > finalColHeight) {
			col++
			colTotal = currentItemHeight // start a new column filled with the currentItem

			if (col > numOfCols) {
				return false
			}
		}
	}

	return true
}

export const findMinHeight = (items: Array<{ height: number }>, rowGap: number, numOfCols: number) => {
	let maxItemHeight = -Infinity
	const heights = items.map((size) => {
		if (size.height + rowGap > maxItemHeight) {
			maxItemHeight = size.height + rowGap
		}
		return size.height + rowGap
	})
	let lower = maxItemHeight
	let higher = maxItemHeight * items.length
	let finalHeight = maxItemHeight
	while (lower < higher) {
		const middle = Math.floor((lower + higher) / 2)
		if (checkForFit(heights, middle, numOfCols)) {
			higher = middle
		} else {
			lower = middle + 1
		}
		finalHeight = lower
	}
	return finalHeight - rowGap
}
