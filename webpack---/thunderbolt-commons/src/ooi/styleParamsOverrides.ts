import {
	overrideServiceListStyleParams,
	BOOKINGS_APP_DEF_ID,
	SERVICE_LIST_PAGE_ID,
	SERVICE_LIST_WIDGET_ID,
} from '@wix/bookings-style-params-overrides'

type WidgetIdWithStyleInSettings = typeof SERVICE_LIST_PAGE_ID | typeof SERVICE_LIST_WIDGET_ID

export const overrideStyleParams = ({
	styleParams,
	widgetId,
	appSettings,
	tpaData,
	isResponsive,
	anywhereThemeOverride,
}: {
	styleParams: any
	widgetId: WidgetIdWithStyleInSettings
	appSettings: Record<string, any> | undefined
	tpaData: any
	isResponsive: boolean
	anywhereThemeOverride?: string
}) => {
	const overrideStyleParamsForWidget = getOverrideStyleParamsFnForWidget(widgetId)
	styleParams = overrideStyleParamsForWidget({
		appSettings,
		isResponsive,
		tpaData,
		styleParams,
		anywhereThemeOverride,
	})
	return styleParams
}

const widgetsWithStyleParamsOverrides = {
	[SERVICE_LIST_PAGE_ID]: {
		appDefinitionId: BOOKINGS_APP_DEF_ID,
		overrideStyleParamsFn: overrideServiceListStyleParams,
	},
	[SERVICE_LIST_WIDGET_ID]: {
		appDefinitionId: BOOKINGS_APP_DEF_ID,
		overrideStyleParamsFn: overrideServiceListStyleParams,
	},
}

export const shouldOverrideStyleParams = (widgetId: string): widgetId is WidgetIdWithStyleInSettings => {
	return widgetId in widgetsWithStyleParamsOverrides
}

export const getAppDefIdForWidget = (widgetId: WidgetIdWithStyleInSettings) => {
	return widgetsWithStyleParamsOverrides[widgetId].appDefinitionId
}

const getOverrideStyleParamsFnForWidget = (widgetId: WidgetIdWithStyleInSettings) => {
	return widgetsWithStyleParamsOverrides[widgetId].overrideStyleParamsFn
}
