export const isInCurrentDomain = (clearString: string): boolean => {
	if (
		clearString.startsWith('//') && // Test that it's a valid domain first, to put it into the HTTP validation rule
		/(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]/g.test(
			`${location.protocol}:${clearString}`
		)
	) {
		clearString = `${location.protocol}${clearString}`
	}
	if (clearString.startsWith('http')) {
		// Test if it is the same hostname
		return new URL(clearString).hostname === location.hostname
	}
	return true
}

export const makeStringClear = (str: string) => {
	// need to remove
	return typeof str === 'string' ? decodeURIComponent(str).toLowerCase().trimStart() : str
}

// Define the named function for defining strict properties
const defineStrictProperty = (key: string, value: any, obj: any, enumerable: boolean) => {
	if (typeof value === 'object' && typeof value.get === 'function' && typeof value.set === 'function') {
		Object.defineProperty(obj || globalThis, key, {
			get: value.get,
			set: value.set,
			configurable: false,
			enumerable: enumerable || false,
		})
	} else {
		Object.defineProperty(obj || globalThis, key, {
			value,
			writable: false,
			configurable: false,
			enumerable: enumerable || false,
		})
	}
}

export const initOverridingGlobals = (module: any = globalThis) => {
	// Defining the script property functionality
	Object.defineProperty(module, 'defineStrictProperty', {
		value: defineStrictProperty,
		writable: false,
		enumerable: false,
		configurable: false,
	})
}
