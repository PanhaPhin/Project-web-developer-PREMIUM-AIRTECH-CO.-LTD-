export const DynamicActionsApiSymbol = Symbol('DynamicActionsApi')
export type DynamicAction = {
	appDefinitionId: string
	isVisible?: boolean
	hasNotifications?: boolean
	color?: string
	iconSvgContent?: string
}

export interface IDynamicActionsApi {
	updateAction(action: DynamicAction, compId: string): void
	updateQABComponentProps(): void
	registerToDynamicActionActivated(appDefinitionId: string, callback: () => void): void
}
