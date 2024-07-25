import React, { ComponentType, useContext } from 'react'
import type { RendererProps } from '../types'
import { extendStoreWithSubscribe } from './extendStoreWithSubscribe'
import Context from './AppContext'
import StructureComponent from './StructureComponent'
import type { Structure } from '@wix/thunderbolt-becky-types'
import { AppStructure, PropsMap } from '@wix/thunderbolt-symbols'
import { getStore } from 'feature-stores'

interface RemoteStructureRendererProps {
	id: string
	structure: Structure
	compProps: Record<string, any>
	rootCompId: string
}

const RemoteStructureRenderer: ComponentType<RemoteStructureRendererProps> = (props) => {
	const { id, structure, compProps, rootCompId } = props

	const context = useContext(Context) as RendererProps
	const structureStore = extendStoreWithSubscribe(
		getStore<AppStructure>(),
		context.batchingStrategy,
		context.layoutDoneService
	)
	structureStore.update(structure)

	const propsStore = extendStoreWithSubscribe(
		getStore<PropsMap>(),
		context.batchingStrategy,
		context.layoutDoneService
	)
	propsStore.update(compProps) // TODO run inner elements mappers somehow

	const scopedContextValue = {
		...context,
		structure: structureStore,
		props: propsStore,
	} as RendererProps

	return (
		<Context.Provider value={scopedContextValue}>
			<div id={id}>
				<StructureComponent
					id={rootCompId}
					scopeData={{
						scope: [],
						repeaterItemsIndexes: [],
					}}
				/>
			</div>
		</Context.Provider>
	)
}

export default RemoteStructureRenderer
