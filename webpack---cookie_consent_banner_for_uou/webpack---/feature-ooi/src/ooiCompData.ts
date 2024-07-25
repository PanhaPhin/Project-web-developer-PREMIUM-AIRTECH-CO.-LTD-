import { withDependencies } from '@wix/thunderbolt-ioc'
import {
	OOIWidgetConfig,
	IPropsStore,
	Props,
	ExperimentsSymbol,
	Experiments,
	ViewerModelSym,
	ViewerModel,
	IAppDidMountHandler,
} from '@wix/thunderbolt-symbols'
import type { IOOICompData } from 'feature-ooi-tpa-shared-config'
import { isLazyLoadCompatible } from '@wix/thunderbolt-components-loader'

const DYNAMIC_HYDRATION_EXPERIMENTS = [
	'specs.thunderbolt.ooi_lazy_load_components',
	'specs.thunderbolt.viewport_hydration_extended_react_18',
]

export const ooiCompData = withDependencies(
	[Props, ExperimentsSymbol, ViewerModelSym],
	(
		propsStore: IPropsStore,
		experiments: Experiments,
		viewerModel: ViewerModel
	): IOOICompData & IAppDidMountHandler => {
		let _ooiComponents: { [compId: string]: OOIWidgetConfig } = {}
		return {
			// TODO - delete 'appDidMount' implementation once we fix ooi appLoaded reports in yoshi template
			async appDidMount() {
				if (
					!isLazyLoadCompatible(viewerModel) ||
					DYNAMIC_HYDRATION_EXPERIMENTS.every((exp) => !experiments[exp])
				) {
					return
				}
				Object.keys(_ooiComponents).forEach((ooiCompId) => {
					const props = propsStore.get(ooiCompId)
					const onAppLoaded = props.onAppLoaded || props._onAppLoaded
					if (!props.shouldReportAppLoadStarted && onAppLoaded && props.host) {
						props.host.registerToComponentDidLayout?.(onAppLoaded)
					}
				})
			},
			getCompDataByCompId(compId: string) {
				return {
					widgetId: _ooiComponents?.[compId]?.widgetId,
					appDefinitionId: _ooiComponents?.[compId]?.appDefinitionId,
				}
			},
			updateOoiComponents(ooiComponents: { [compId: string]: OOIWidgetConfig }) {
				_ooiComponents = { ..._ooiComponents, ...ooiComponents }
			},
		}
	}
)
