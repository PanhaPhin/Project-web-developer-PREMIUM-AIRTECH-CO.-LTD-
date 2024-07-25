import React from 'react'

import { multi, withDependencies } from '@wix/thunderbolt-ioc'
import {
	AppStructure,
	ComponentLibrariesSymbol,
	ILogger,
	INavigationManager,
	LoggerSymbol,
	NavigationManagerSymbol,
	SuspendedCompsAPI,
	SuspendedCompsSym,
	ViewerModel,
	ViewerModelSym,
} from '@wix/thunderbolt-symbols'
import type {
	ComponentsLoaderRegistry,
	ComponentsRegistry,
	ComponentLibraries,
	CompControllersRegistry,
	IComponentsRegistrar,
	ComponentModule,
	IWrapComponent,
	ComponentLoaderFunction,
} from './types'
import { IComponentsLoader } from './IComponentLoader'
import { createViewportObserver, getCompClassType, taskify } from '@wix/thunderbolt-commons'
import { ComponentsRegistrarSymbol, ComponentWrapperSymbol } from './symbols'

import { WithHydrateWrapperCSR } from './suspenseManagerClient'
import { WithHydrateWrapperSSR } from './suspenseManagerSSR'
import { isLazyLoadCompatible } from './helpers'

const isCsr = process.env.browser
type ComponentsLoaderFactory = (
	componentsLibraries: ComponentLibraries,
	componentsRegistrars: Array<IComponentsRegistrar>,
	logger: ILogger,
	viewerModel: ViewerModel,
	suspendedComps: SuspendedCompsAPI,
	componentWrapper: IWrapComponent,
	navigationManager: INavigationManager
) => IComponentsLoader

const isComponentModule = <T>(loader: any): loader is ComponentModule<T> => !!loader.component

const componentsLoaderFactory: ComponentsLoaderFactory = (
	componentsLibraries,
	componentsRegistrars,
	logger,
	viewerModel,
	suspendedComps,
	componentWrapper,
	navigationManager
) => {
	const lazyManifestsResolvers: Array<() => Promise<void>> = []
	const componentsLoaderRegistry: ComponentsLoaderRegistry = {}
	const componentsRegistry: ComponentsRegistry = {}
	const compControllersRegistry: CompControllersRegistry = {}
	const downloadOnViewportWhiteList: Record<string, boolean> = {}
	const shouldUseRegisterComponentApi = viewerModel.experiments['specs.thunderbolt.ooiInComponentsRegistry']
	const debugRendering = viewerModel.requestUrl.includes('debugRendering=true')
	const shouldWaitForReact = !viewerModel.experiments['specs.thunderbolt.reactScriptsBeforeApp']
	// const shouldSuspenseContainers = !viewerModel.react18HydrationBlackListWidgets?.length

	if (viewerModel.experiments['specs.thunderbolt.viewport_hydration_extended_react_18']) {
		Object.assign(downloadOnViewportWhiteList, {
			TPAWidget: true,
		})

		// TODO - Uncomment this when applying React.lazy on inner components
		// if (shouldSuspenseContainers) {
		// 	Object.assign(downloadOnViewportWhiteList, {
		// 		Section: true,
		// 		AppWidget: true,
		// 		ClassicSection: true,
		// 	})
		// }
	}

	const getComponentLoader = async (compType: string) => {
		const loader = componentsLoaderRegistry[compType]

		if (!loader && lazyManifestsResolvers.length) {
			await Promise.all(lazyManifestsResolvers.map((resolver) => resolver()))
			return componentsLoaderRegistry[compType]
		}

		return loader
	}

	const loadComponentModule = async (compType: string, useRegistry = true) => {
		if (useRegistry && componentsRegistry[compType]) {
			return componentsRegistry[compType]
		}
		const loader = await getComponentLoader(compType)
		shouldWaitForReact && isCsr && (await window.externalsRegistry.react.loaded) // components require React within their code so they have to be evaluated once React is defined.
		const module = await taskify(() => loader())
		const { wrapComponent } = componentWrapper
		if (isComponentModule(module)) {
			module.component.displayName = compType
			if (module.controller) {
				compControllersRegistry[compType] = module.controller
			}
			return wrapComponent(module.component)
		}
		return wrapComponent(module.default)
	}

	const createSuspenseComponentCSR = (compType: string) => {
		const deferredComponentLoaderFactory = (compId: string) => {
			if (navigationManager.isDuringNavigation() && !navigationManager.isFirstNavigation()) {
				return {
					componentPromise: Promise.resolve(loadComponentModule(compType, false)),
					onUnmount: () => {},
				}
			}
			const { promise: viewportObserverPromise, cleaner: viewportObserverCleaner } = createViewportObserver(
				compId
			)
			return {
				componentPromise: viewportObserverPromise
					.then(() => loadComponentModule(compType, false))
					.then((module) => {
						if (!componentsRegistry[compType]) {
							componentsRegistry[compType] = module
						}
						return module
					}),
				onUnmount: viewportObserverCleaner,
			}
		}
		const comp = WithHydrateWrapperCSR({
			deferredComponentLoaderFactory,
			setIsWaitingSuspense: suspendedComps.setIsWaitingSuspense,
			debugRendering,
		})

		return comp
	}

	const createSuspenseComponentSSR = (compType: string) => {
		return WithHydrateWrapperSSR({
			Comp: componentsRegistry[compType],
		})
	}

	const createSuspenseComponent = isCsr ? createSuspenseComponentCSR : createSuspenseComponentSSR

	const registerComponent = async (compType: string, componentLoader?: ComponentLoaderFunction<any>) => {
		if (componentsRegistry[compType]) {
			return
		}
		if (componentLoader) {
			componentsLoaderRegistry[compType] = componentLoader
		}
		const loader = await getComponentLoader(compType)

		if (!loader) {
			return
		}
		// components require React within their code so they have to be evaluated once React is defined.
		shouldWaitForReact && isCsr && (await window.externalsRegistry.react.loaded)
		componentsRegistry[compType] = await loadComponentModule(compType)
	}

	const shouldSuspenseComponent = (compType: string) =>
		isLazyLoadCompatible(viewerModel) && downloadOnViewportWhiteList[compType]

	// TODO: delete when 'specs.thunderbolt.ooiInComponentsRegistry' is merged
	const loadComponent = async (compType: string) => {
		if (componentsRegistry[compType]) {
			return
		}

		const loader = await getComponentLoader(compType)

		if (!loader) {
			return
		}

		shouldWaitForReact && isCsr && (await window.externalsRegistry.react.loaded) // components require React within their code so they have to be evaluated once React is defined.
		const module = await taskify(() => loader())
		const wrapComponent = componentWrapper?.wrapComponent || (React.memo as IWrapComponent['wrapComponent'])

		if (isComponentModule(module)) {
			module.component.displayName = compType
			componentsRegistry[compType] = wrapComponent(module.component)
			if (module.controller) {
				compControllersRegistry[compType] = module.controller
			}
		} else {
			componentsRegistry[compType] = wrapComponent(module.default)
		}
	}

	const getRequiredComps = (structure: AppStructure) => {
		const allCompClassTypes = Object.entries(structure).map(([_, { componentType, uiType }]) =>
			getCompClassType(componentType, uiType)
		)
		if (allCompClassTypes.includes('RefComponent')) {
			allCompClassTypes.push('BuilderPathsContainer')
		}
		const uniqueCompTypes = [...new Set(allCompClassTypes)]
		return uniqueCompTypes
	}

	const registerLibraries = taskify(async () => {
		const assignComponents = (components: Record<string, any>) => {
			Object.assign(componentsLoaderRegistry, components)
		}

		logger.phaseStarted('componentsLibraries')
		const libs = [...componentsRegistrars, ...(await componentsLibraries)]
		logger.phaseEnded('componentsLibraries')

		logger.phaseStarted('componentLoaders')
		libs.forEach(({ getAllComponentsLoaders, getComponents }) => {
			assignComponents(getComponents())

			if (getAllComponentsLoaders) {
				lazyManifestsResolvers.push(async () => {
					assignComponents(await getAllComponentsLoaders())
				})
			}
		})
		logger.phaseEnded('componentLoaders')
	})

	return {
		getComponentsMap: () => componentsRegistry,
		getCompControllersMap: () => compControllersRegistry,
		loadComponents: async (structure) => {
			await registerLibraries

			const requiredComps = getRequiredComps(structure)
			return Promise.all(
				requiredComps.map((compType) =>
					shouldUseRegisterComponentApi ? registerComponent(compType) : loadComponent(compType)
				)
			)
		},
		loadAllComponents: async () => {
			await registerLibraries

			const requiredComps = Object.keys(componentsLoaderRegistry)
			return Promise.all(
				requiredComps.map((compType) =>
					shouldUseRegisterComponentApi ? registerComponent(compType) : loadComponent(compType)
				)
			)
		},
		loadComponent: async (componentType: string, uiType?: string) => {
			await registerLibraries
			const compType = getCompClassType(componentType, uiType)
			if (shouldSuspenseComponent(compType)) {
				return registerComponent(compType)
			}
			return loadComponent(compType)
		},
		registerSuspendedComponent: (compType: string, loader: ComponentLoaderFunction<any>, { uiType } = {}) => {
			const componentType = getCompClassType(compType, uiType)
			downloadOnViewportWhiteList[componentType] = true
			if (!isCsr) {
				return registerComponent(componentType, loader)
			}
			componentsLoaderRegistry[componentType] = loader
		},
		registerComponent: (compType: string, loader: ComponentLoaderFunction<any>, { uiType } = {}) =>
			registerComponent(getCompClassType(compType, uiType), loader),
		getComponentToRender: (compType: string) => {
			if (componentsRegistry[compType] && !navigationManager.isFirstNavigation()) {
				return componentsRegistry[compType]
			}
			return shouldSuspenseComponent(compType) ? createSuspenseComponent(compType) : componentsRegistry[compType]
		},
	}
}

export const ComponentsLoader = withDependencies(
	[
		ComponentLibrariesSymbol,
		multi(ComponentsRegistrarSymbol),
		LoggerSymbol,
		ViewerModelSym,
		SuspendedCompsSym,
		ComponentWrapperSymbol,
		NavigationManagerSymbol,
	] as const,
	componentsLoaderFactory
)
