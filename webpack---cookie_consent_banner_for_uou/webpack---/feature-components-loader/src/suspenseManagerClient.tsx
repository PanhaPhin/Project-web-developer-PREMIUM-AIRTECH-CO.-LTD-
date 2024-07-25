import { createPromise, isForwardRef } from '@wix/thunderbolt-commons'
import React, { Suspense, useEffect, useMemo } from 'react'
import type { WithDeferredHydrateOptionsCSR, WithDeferredHydrateWrapper } from './types'

export const EmptyDiv = () => <div />

function wrapPromise(promise: Promise<any>) {
	let status = 'pending'
	let response: any

	const suspender = promise.then(
		(res: any) => {
			status = 'success'
			response = res
		},
		(err: any) => {
			status = 'error'
			response = err
		}
	)

	const read = () => {
		switch (status) {
			case 'pending':
				throw suspender
			case 'error':
				throw response
			default:
				return response
		}
	}

	return { read, status }
}

function SuspenseInnerDeferred(props: any) {
	const ReactComponent = props.api.read()
	if (props.debugRendering) {
		console.log(`rendering { compId: ${props.id}}`)
	}
	return props.children(ReactComponent)
}
// called once per comp type when the component is loaded to the store
export const WithHydrateWrapperCSR: WithDeferredHydrateWrapper<WithDeferredHydrateOptionsCSR> = ({
	deferredComponentLoaderFactory,
	debugRendering,
	setIsWaitingSuspense,
}) => {
	// called for each render
	const ViewportHydrator = (props: any, ref: any) => {
		const suspender = useMemo(() => {
			const { promise, resolver } = createPromise<React.ComponentType<any>>()
			const api = wrapPromise(promise)
			return { api, resolver }
		}, [])

		useEffect(() => {
			setIsWaitingSuspense(props.id, true)
			const { componentPromise, onUnmount } = deferredComponentLoaderFactory!(props.id)
			componentPromise.then((...args) => {
				setIsWaitingSuspense(props.id, false)
				suspender.resolver(...args)
			})
			return () => onUnmount && onUnmount()
		}, [props.id, suspender, suspender.resolver])

		return (
			<Suspense fallback={EmptyDiv()}>
				<SuspenseInnerDeferred api={suspender.api} debugRendering={debugRendering} id={props.id}>
					{(Comp: React.ComponentType<any>) => <Comp {...props} ref={isForwardRef(Comp) ? ref : null} />}
				</SuspenseInnerDeferred>
			</Suspense>
		)
	}

	return React.forwardRef(ViewportHydrator)
}
