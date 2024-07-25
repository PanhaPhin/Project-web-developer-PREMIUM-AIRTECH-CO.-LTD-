import { IComponentsRegistrar } from '@wix/thunderbolt-components-loader'
import { withDependencies } from '@wix/thunderbolt-ioc'

// TODO : Delete when 'specs.thunderbolt.ooiInComponentsRegistry' is merged
export const ooiComponentsRegistrar = withDependencies(
	[],
	(): IComponentsRegistrar => {
		return {
			getComponents() {
				return {
					tpaWidgetNative: () =>
						Promise.resolve({
							component: (props: any, ref?: any) => {
								// Support forwardRef, when 'specs.thunderbolt.ooi_lazy_load_components' is merged should use only 'props.ReactComponent.render'
								const ComponentFunction = props.ReactComponent.render ?? props.ReactComponent
								return ComponentFunction(props, ref)
							},
						}),
				}
			},
		}
	}
)
