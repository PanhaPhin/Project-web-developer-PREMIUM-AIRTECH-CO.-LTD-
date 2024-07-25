import { ComponentEntry } from '../../core/common-types'

const entry: ComponentEntry = {
	componentType: 'BuilderPathsContainer',
	loadComponent: () => import('./BuilderPathsContainer' /* webpackChunkName: "BuilderPathsContainer" */),
}

export default entry
