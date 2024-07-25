interface ScreenSizeMeasures {
	screenResulotion: {
		width: number
		height: number
	}
	screenAvailableResulotion: {
		width: number
		height: number
	}
	windowResulotion: {
		width: number
		height: number
	}
	windowOuterResulotions: {
		width: number
		height: number
	}
}

export let screenSizeMeasures: ScreenSizeMeasures

if (process.env.browser) {
	screenSizeMeasures = {
		screenResulotion: {
			width: window.screen.width,
			height: window.screen.height,
		},
		screenAvailableResulotion: {
			width: window.screen.availWidth,
			height: window.screen.availHeight,
		},
		windowResulotion: {
			width: window.innerWidth,
			height: window.innerHeight,
		},
		windowOuterResulotions: {
			width: window.outerWidth,
			height: window.outerHeight,
		},
	}
}
