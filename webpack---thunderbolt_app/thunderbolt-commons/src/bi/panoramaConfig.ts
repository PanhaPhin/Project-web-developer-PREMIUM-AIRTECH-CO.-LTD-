import { GlobalConfig, createGlobalConfig } from '@wix/fe-essentials-viewer-platform/panorama-client'

export class PanoramaConfig {
	private static instance: PanoramaConfig
	private config: GlobalConfig

	private constructor() {
		this.config = createGlobalConfig()
	}

	public static getInstance(): PanoramaConfig {
		if (!PanoramaConfig.instance) {
			PanoramaConfig.instance = new PanoramaConfig()
		}
		return PanoramaConfig.instance
	}

	public getConfig() {
		return this.config
	}
}

export const getPanoramaGlobalConfig = () => {
	return PanoramaConfig.getInstance().getConfig()
}
