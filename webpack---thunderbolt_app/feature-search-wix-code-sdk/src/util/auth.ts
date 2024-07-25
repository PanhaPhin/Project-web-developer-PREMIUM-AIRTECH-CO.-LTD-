import { SEARCH_APP_DEF_ID } from '../constants'
import { SessionServiceAPI } from '@wix/thunderbolt-symbols'

const APP_INSTALLATION_ERROR = new Error(
	'Site Search application must be installed from App Market in order to use wix-search API in Velo'
)

export const getInstance = (sessionService: SessionServiceAPI): string => {
	try {
		const token = sessionService.getInstance(SEARCH_APP_DEF_ID)

		if (!token) {
			throw APP_INSTALLATION_ERROR
		}

		return token
	} catch (e) {
		throw APP_INSTALLATION_ERROR
	}
}
