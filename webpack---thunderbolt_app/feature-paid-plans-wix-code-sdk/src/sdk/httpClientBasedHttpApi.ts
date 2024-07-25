import { API_BASE_PATH } from './constants'
import { PaidPlansError } from './paidPlansError'
import type { IHttpClient, IHttpError } from '@wix/http-client'
import { HttpApiInterface } from './httpApiInterface'

const isHttpError = (payload: any): payload is IHttpError => {
	return !!payload?.isWixHttpError
}

export class HttpClientBasedHttpApi implements HttpApiInterface {
	constructor(private httpClient: IHttpClient) {}

	get(url: string) {
		return this.sendRequest(url, 'get')
	}

	post(url: string, body: object) {
		return this.sendRequest(url, 'post', body)
	}

	private async sendRequest(url: string, method: 'get' | 'post', body?: object): Promise<any> {
		try {
			const requestOptions = {
				headers: {
					'X-Wix-Client-Artifact-Id': 'feature-paid-plans-wix-code-sdk',
				},
			}
			const requestUrl = `${API_BASE_PATH}${url}`
			const response =
				method === 'post'
					? await this.httpClient.post(requestUrl, body, requestOptions)
					: await this.httpClient.get(requestUrl, requestOptions)
			return response.data
		} catch (e) {
			if (isHttpError(e)) {
				if (e.response?.status && e.response?.data.message) {
					throw new PaidPlansError(e.response.status, e.response?.data.message)
				} else {
					throw new PaidPlansError(e.response?.status ?? 418, e.message)
				}
			} else {
				throw new PaidPlansError(e.status ?? 418, e.message)
			}
		}
	}
}
