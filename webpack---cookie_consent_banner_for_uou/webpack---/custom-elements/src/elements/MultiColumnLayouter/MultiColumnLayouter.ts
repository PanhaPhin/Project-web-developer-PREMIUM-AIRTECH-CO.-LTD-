import fastdom from 'fastdom'
import { findMinHeight } from './utils'

class MultiColumnLayouter extends HTMLElement {
	private containerWidthObserver?: ResizeObserver
	private mutationObserver?: MutationObserver
	private isActiveObserver?: ResizeObserver
	private childResizeObserver?: ResizeObserver
	private containerWidth: number = 0
	private isActive: boolean = false
	private isDuringCalc: boolean = false

	private setContainerHeight(height: number) {
		this.style.setProperty('--flex-columns-height', `${height}px`)
	}
	private removeContainerHeight() {
		this.style.removeProperty('--flex-columns-height')
	}

	// TODO cache computed style to recalculate only when inactive -> active
	private getColumnCount(computedStyle: CSSStyleDeclaration): number {
		const val = computedStyle.getPropertyValue('--flex-column-count')
		return parseInt(val, 10)
	}

	private getRowGap(computedStyle: CSSStyleDeclaration): number {
		const val = computedStyle.getPropertyValue('row-gap')
		return parseInt(val || '0', 10)
	}

	private activate() {
		this.isActive = true
		this.attachObservers()
		this.recalcHeight()
	}

	private deactivate() {
		this.isActive = false
		this.detachHeightCalcObservers()
		this.removeContainerHeight()
	}

	private calcActive(): boolean {
		const cs = getComputedStyle(this)
		return cs.getPropertyValue('--container-layout-type') === 'multi-column-layout'
	}

	private attachObservers = () => {
		this.mutationObserver?.observe(this, { childList: true, subtree: true })
		this.containerWidthObserver?.observe(this)
		Array.from(this.children).forEach((child) => {
			this.handleItemAdded(child)
		})
	}

	private detachHeightCalcObservers = () => {
		this.mutationObserver?.disconnect()
		this.containerWidthObserver?.disconnect()
		this.childResizeObserver?.disconnect()
	}

	get itemsHeights(): Array<{ height: number }> {
		return Array.from(this.children).map((child) => {
			const computedStyle = getComputedStyle(child)
			let height = parseFloat(computedStyle.height || '0')
			height += parseFloat(computedStyle.marginTop || '0')
			height += parseFloat(computedStyle.marginBottom || '0')
			return { height }
		})
	}

	private recalcHeight = () => {
		if (!this.isActive) {
			return
		}
		fastdom.measure(() => {
			if (!this.isActive || this.isDuringCalc) {
				return
			}
			this.isDuringCalc = true

			const cs = getComputedStyle(this)
			const bestHeight = findMinHeight(this.itemsHeights, this.getRowGap(cs), this.getColumnCount(cs))
			this.isDuringCalc = false
			fastdom.mutate(() => {
				this.setContainerHeight(bestHeight)
				this.style.setProperty('visibility', null)
			})
		})
	}

	private setIsActive() {
		const shouldBeActive = this.calcActive()
		if (this.isActive !== shouldBeActive) {
			if (shouldBeActive) {
				this.activate()
			} else {
				this.deactivate()
			}
		}
	}

	connectedCallback() {
		this.cleanUp()
		this.createObservers()
		this.setIsActive()
		if (window.document.body) {
			this.isActiveObserver?.observe(window.document.body)
		}
	}

	cleanUp = () => {
		this.detachHeightCalcObservers()
		this.removeContainerHeight()
		this.isActiveObserver?.disconnect()
	}

	handleItemAdded = (node: Node) => {
		if (node instanceof window.HTMLElement) {
			this.childResizeObserver?.observe(node)
		}
	}
	handleItemRemoved = (node: Node) => {
		if (node instanceof window.HTMLElement) {
			this.childResizeObserver?.unobserve(node)
		}
	}

	createObservers = () => {
		this.containerWidthObserver = new ResizeObserver((entries) => {
			const container = entries[0]
			if (container.contentRect.width !== this.containerWidth) {
				if (this.containerWidth === 0) {
					this.containerWidth = container.contentRect.width
					return
				}
				this.containerWidth = container.contentRect.width
				this.recalcHeight()
			}
		})

		this.mutationObserver = new MutationObserver((entries) => {
			entries.forEach((mutation) => {
				Array.from(mutation.removedNodes).forEach(this.handleItemRemoved)
				Array.from(mutation.addedNodes).forEach(this.handleItemAdded)
			})
			this.recalcHeight()
		})

		this.childResizeObserver = new ResizeObserver(() => {
			this.recalcHeight()
		})

		this.isActiveObserver = new ResizeObserver(() => {
			this.setIsActive()
		})
	}
	disconnectedCallback() {
		this.cleanUp()
	}
}

export default MultiColumnLayouter
