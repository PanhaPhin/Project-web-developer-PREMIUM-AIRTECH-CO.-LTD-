import _ from 'lodash'
import { IWixCodeNamespacesRegistry, InvokeNamespaceHandler } from '@wix/thunderbolt-symbols'
import { BOOTSTRAP_DATA, CLIENT_SDK, VIEWER_HANDLERS, WIX_CODE_NAMESPACES_REGISTRY } from './moduleNames'
import { IViewerHandlers } from '../types'
import { BootstrapData } from '../../types'

export type IClientSdk = {
	load: () => void
}

const ClientSdk = ({ viewerHandlers }: IViewerHandlers, wixCodeNamespacesRegistry: IWixCodeNamespacesRegistry, bootstrapData: BootstrapData): IClientSdk => {
	const deserializeArguments = (argsToDeserialize: Array<any>) => {
		return argsToDeserialize.map((serializedArg) => {
			if (serializedArg?.__client_sdk_type__ === 'function') {
				const functionId = serializedArg.id
				return (...wrappedFnArgs: Array<any>) => {
					return viewerHandlers.clientSdk.invokeProxyFunction(functionId, wrappedFnArgs)
				}
			}

			return serializedArg
		})
	}

	return {
		load: () => {
			const { isSSR } = bootstrapData.platformEnvData.window

			if (isSSR) {
				return
			}

			const invokeHandler: InvokeNamespaceHandler = ({ applicationId, namespace, method, args }) => {
				const namespaceApi = wixCodeNamespacesRegistry.get(namespace, applicationId)
				if (!namespaceApi) {
					throw new Error(`namespace ${namespace} is not registered for appDefinitionId ${applicationId}`)
				}

				const fn = _.get(namespaceApi, method)
				if (!fn) {
					throw new Error(`method ${method} is not registered in namespace ${namespace}`)
				}

				if (typeof fn === 'function') {
					const deserializedArgs = deserializeArguments(args)
					return fn(...deserializedArgs)
				}

				return fn
			}

			viewerHandlers.clientSdk.onPlatformReady(invokeHandler)
		},
	}
}

export default {
	factory: ClientSdk,
	deps: [VIEWER_HANDLERS, WIX_CODE_NAMESPACES_REGISTRY, BOOTSTRAP_DATA],
	name: CLIENT_SDK,
}
