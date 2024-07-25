import { WixCodeApiFactoryArgs, IPlatformUtils, PlatformEnvData } from '@wix/thunderbolt-symbols'
import { CORVID_APP_DEF_ID } from './constants'

export class Environment {
	constructor(
		private registry: WixCodeApiFactoryArgs['wixCodeNamespacesRegistry'],
		private platformUtils: IPlatformUtils,
		private platformEnvData: PlatformEnvData
	) {}

	isSSR() {
		return this.registry.get('window').rendering.env === 'backend'
	}

	isPreview() {
		return this.registry.get('window').viewMode.toLowerCase() === 'preview'
	}

	getInstance() {
		// TODO - use site namespace once app permission enforcement is ready - WBL-7905
		return this.platformEnvData.site.experiments['specs.thunderbolt.wixRealtimeGetAppTokenFromPlatformUtils']
			? (this.platformUtils.sessionService.getInstance(CORVID_APP_DEF_ID) as string)
			: (this.registry.get('site').getAppToken(CORVID_APP_DEF_ID) as string)
	}

	getSiteRevision() {
		return this.registry.get('site').revision
	}

	onLogin(cb: any) {
		return this.registry.get('user').onLogin(cb)
	}
}
