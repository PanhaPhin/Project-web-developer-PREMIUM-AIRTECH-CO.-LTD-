import { CatharsisArgs } from '@wix/thunderbolt-catharsis'
import { named, createIdentifier } from '@wix/thunderbolt-ioc'
import { CatharsisConstants } from './constants'
import { CatharsisFeature } from './feature'
import { SingleTransaction, CompNodesProvider, DataNodes } from './types'

export const CatharsisFeatureSymbol = createIdentifier<CatharsisFeature<any, any, any, any>>(Symbol('CatharsisFeature'))
export const ConstantSymbol = createIdentifier<CatharsisConstants>(Symbol('Constant'))
export const MaterializerFactorySymbol = createIdentifier<NonNullable<CatharsisArgs['materializerFactory']>>(
	Symbol('MaterializerFactory')
)
export const OnInvalidationSymbol = createIdentifier<CatharsisArgs['onInvalidation']>(Symbol('OnInvalidation'))
export const CatharsisStructureStoreSymbol = createIdentifier<NonNullable<CatharsisArgs['structureStore']>>(
	Symbol('CatharsisStructureStore')
)
export const CompNodeProviderSymbol = createIdentifier<CompNodesProvider>(Symbol('CompNodeProvider'))
export const DataNodeProviderSymbol = createIdentifier<DataNodes>(Symbol('CompNodeProvider'))
export const CatharsisSingleTransactionSymbol = createIdentifier<SingleTransaction>(
	Symbol('CatharsisSingleTransaction')
)

export const appConstant = <TName extends keyof CatharsisConstants>(name: TName) => named(ConstantSymbol, name)
