import type { ViewerPlatformEssentials } from '@wix/fe-essentials-viewer-platform'
import type { PanoramaClient } from '@wix/fe-essentials-viewer-platform/panorama-client'
import { PanoramaExceptionType } from '@wix/fe-essentials-viewer-platform/panorama-client'
import type { Initializable } from '@wix/thunderbolt-symbols'
import type { IViewerHandlers } from '../types'
import type { BootstrapData } from '../../types'
import { BOOTSTRAP_DATA, PLATFORM_ESSENTIALS, PLATFORM_PANORAMA, VIEWER_HANDLERS } from './moduleNames'

let platformPanoramaClient: PanoramaClient

const PlatformPanorama = (bootstrapData: BootstrapData, platformEssentials: ViewerPlatformEssentials, { viewerHandlers }: IViewerHandlers): Initializable => {
	const {
		platformEnvData: {
			site: { experiments },
			bi: biData,
		},
	} = bootstrapData

	if (!platformPanoramaClient && experiments['specs.thunderbolt.PanoramaErrorMonitor']) {
		platformPanoramaClient = platformEssentials.createPanoramaClient({
			fullArtifactId: 'com.wixpress.html-client.wix-thunderbolt',
			artifactVersion: biData.viewerVersion,
			componentId: 'host',
			sentryDsn: 'https://605a7baede844d278b89dc95ae0a9123@sentry-next.wixpress.com/68',
		})

		viewerHandlers.panorama.onUnhandledError((e: Error) => {
			// Strip away all Proxy methods from the error object
			const error = new Error(e.message)
			error.stack = e.stack

			platformPanoramaClient.errorMonitor().reportError(error, {
				exceptionType: PanoramaExceptionType.UNHANDLED,
				environment: 'Viewer',
				errorName: e.constructor.name,
			})
		})

		viewerHandlers.panorama.onBreadcrumb((breadcrumb: any) => {
			platformPanoramaClient.errorMonitor().addBreadcrumb(breadcrumb)
		})
	}

	return {
		init() {},
	}
}

export default {
	factory: PlatformPanorama,
	deps: [BOOTSTRAP_DATA, PLATFORM_ESSENTIALS, VIEWER_HANDLERS],
	name: PLATFORM_PANORAMA,
}
