import { optional, withDependencies } from '@wix/thunderbolt-ioc'
import {
	IAppDidMountHandler,
	IStructureAPI,
	StructureAPI,
	LoggerSymbol,
	ILogger,
	TpaIFrame,
	CurrentRouteInfoSymbol,
	TpaPopupSymbol,
	ITpaPopup,
	TpaContextPicker,
	DynamicFeatureLoader,
	IPageFeatureLoader,
	ExperimentsSymbol,
	Experiments,
} from '@wix/thunderbolt-symbols'
import { parseMessage } from '@wix/thunderbolt-commons'
import type { ITpaContextMapping, ITpaHandlersManager, PageInfo } from './types'
import { IPageProvider, LogicalReflectorSymbol } from 'feature-pages'
import { TpaContextMappingSymbol, TpaHandlersManagerSymbol } from './symbols'
import { WindowMessageRegistrarSymbol, IWindowMessageRegistrar } from 'feature-window-message-registrar'
import { TbDebugSymbol, DebugApis } from 'feature-debug'
import { editorOnlyHandlers, isTpaMessage } from './tpaMessageUtilis'
import { LightboxUtilsSymbol, ILightboxUtils } from 'feature-lightbox'
import type { ICurrentRouteInfo } from 'feature-router'

/**
 * This object's purpose is to comb through incoming window messages and assign TPA messages to the TpaHandler
 * instance in the correct IOC container (e.g the container that has the message sending component).
 */
export const TpaMessageContextPicker = withDependencies(
	[
		WindowMessageRegistrarSymbol,
		LogicalReflectorSymbol,
		TpaContextMappingSymbol,
		StructureAPI,
		CurrentRouteInfoSymbol,
		DynamicFeatureLoader,
		ExperimentsSymbol,
		optional(LightboxUtilsSymbol),
		optional(LoggerSymbol),
		optional(TbDebugSymbol),
	],
	(
		windowMessageRegistrar: IWindowMessageRegistrar,
		pageProvider: IPageProvider,
		tpaContextMapping: ITpaContextMapping,
		structureApi: IStructureAPI,
		currentRouteInfo: ICurrentRouteInfo,
		dynamicFeatureLoader: IPageFeatureLoader,
		experiments: Experiments,
		lightboxUtils?: ILightboxUtils,
		logger?: ILogger,
		debugApi?: DebugApis
	): IAppDidMountHandler & TpaContextPicker => {
		const getHandlersManagerForPage = async ({ contextId, pageId }: PageInfo): Promise<ITpaHandlersManager> => {
			if (experiments['specs.thunderbolt.dynamicLoadTpaFeature']) {
				const handlesManager = await dynamicFeatureLoader.loadFeature<ITpaHandlersManager>(
					'tpa',
					TpaHandlersManagerSymbol,
					{ pageId, contextId }
				)
				return handlesManager
			} else {
				const pageRef = await pageProvider(contextId, pageId)
				return (await pageRef.getAllImplementersOnPageOfAsync<ITpaHandlersManager>(TpaHandlersManagerSymbol))[0]
			}
		}

		// TpaIncomingMessage
		const getMessageSourceContainerId = ({ compId }: { compId: string }) => {
			if (!compId) {
				return
			}

			// getTpaComponentPageInfo() for persistent popups and chat in responsive
			// getContextIdOfCompId() to seek compId in structure if compId does not belong to tpa/ooi widget (i.e any random iframe with the js-sdk installed, e.g tpa galleries)
			const pageInfo = tpaContextMapping.getTpaComponentPageInfo(compId)
			if (!pageInfo || !pageInfo.contextId) {
				const contextId = structureApi.getContextIdOfCompId(compId)
				if (contextId) {
					return { contextId, pageId: contextId }
				}
			}
			return pageInfo
		}

		const getIsPersistentPopup = async (pageInfo: PageInfo | undefined, compId: string) => {
			if (pageInfo) {
				let popupApi: ITpaPopup
				if (experiments['specs.thunderbolt.dynamicLoadTpaFeature']) {
					popupApi = await dynamicFeatureLoader.loadFeature<ITpaPopup>('tpa', TpaPopupSymbol, {
						pageId: pageInfo.pageId,
						contextId: pageInfo.contextId,
					})
				} else {
					const pageRef = await pageProvider(pageInfo!.contextId, pageInfo!.pageId)
					popupApi = pageRef.getAllImplementersOnPageOf<ITpaPopup>(TpaPopupSymbol)[0]
				}
				if (!popupApi) {
					logger?.captureError(new Error('feature tpa not loaded'), {
						tags: {
							feature: 'tpa',
							isDynamicLoaded: experiments['specs.thunderbolt.dynamicLoadTpaFeature'],
						},
						extra: {
							pageInfo,
							compId,
						},
					})
				}
				return popupApi?.getOpenedPopups()?.[compId]?.isPersistent
			}
			return false
		}

		return {
			getMessageSourceContainerId,
			appDidMount() {
				windowMessageRegistrar.addWindowMessageHandler({
					canHandleEvent(event: MessageEventInit) {
						return !!(event.source && isTpaMessage(parseMessage(event)))
					},
					async handleEvent(event: MessageEventInit) {
						const originalMessage = parseMessage(event)
						const { type, callId } = originalMessage
						const compIdFromTemplate = tpaContextMapping.getTpaComponentIdFromTemplate(
							originalMessage.compId
						)
						const compId = compIdFromTemplate ?? originalMessage.compId
						const message = { ...originalMessage, compId }

						if (editorOnlyHandlers.includes(type)) {
							return
						}

						const pageInfo = getMessageSourceContainerId(message)
						const contextId = pageInfo && pageInfo.contextId ? pageInfo.contextId : null

						const origin = event.origin!
						if (debugApi) {
							debugApi.tpa.addMessage({ message, compId, contextId, origin })
						}

						const currentContext = currentRouteInfo.getCurrentRouteInfo()?.contextId
						const currentLightboxId = lightboxUtils?.getCurrentLightboxId()
						const isPersistentPopup = await getIsPersistentPopup(pageInfo, compId)

						if (
							!contextId ||
							(contextId !== 'masterPage' &&
								!isPersistentPopup &&
								contextId !== currentContext &&
								contextId !== currentLightboxId)
						) {
							console.error('TPA handler message caller does not belong to any page', {
								type,
								callId,
								compId,
							})
							return
						}

						const pageHandlersManager = await getHandlersManagerForPage(pageInfo!)

						pageHandlersManager
							.handleMessage({ source: event.source as TpaIFrame, origin, message })
							.catch((e) => {
								console.error('HandleTpaMessageError', type, contextId, compId, e)
								logger?.captureError(e, {
									tags: { feature: 'tpa', handlerName: type },
									extra: {
										handlerName: type,
										compId,
									},
								})
							})
					},
				})
			},
		}
	}
)
