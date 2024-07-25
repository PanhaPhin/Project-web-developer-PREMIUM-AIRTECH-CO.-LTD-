import { createIdentifier } from '@wix/thunderbolt-ioc'
import type { MegaStoreWithSubscriptions } from './stores/megaStore'
import type { Catharsis } from './types/catharsis.types'

export const CatharsisMegaStoreSymbol = createIdentifier<MegaStoreWithSubscriptions>(Symbol('CatharsisMegaStore'))
export const CatharsisSymbol = createIdentifier<Catharsis>(Symbol('CatharsisSymbol'))
export const ComponentsCssStringifierSymbol = Symbol('ComponentsCssStringifierSymbol')
