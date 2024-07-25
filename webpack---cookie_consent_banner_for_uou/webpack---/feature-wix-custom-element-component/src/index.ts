import type { ContainerModuleLoader } from '@wix/thunderbolt-ioc'
import { LifeCycle } from '@wix/thunderbolt-symbols'
import { WixCustomElementComponent } from './wixCustomElementComponent'
import { WixCustomElementComponentAPI } from './wixCustomElementComponentAPI'
import { WixCustomElementComponentAPISymbol } from './symbols'

export const site: ContainerModuleLoader = (bind) => {
	bind(WixCustomElementComponentAPISymbol).to(WixCustomElementComponentAPI)
}

export const page: ContainerModuleLoader = (bind) => {
	bind(LifeCycle.PageWillMountHandler).to(WixCustomElementComponent)
}

export { WixCustomElementComponentEditorAPISymbol } from './symbols'

export type { WixCustomElementComponentEditorFeatureAPI } from './types'
