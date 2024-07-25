import _ from 'lodash'
import type { IUnfinishedTasks, IViewerHandlers } from './types'

export const UnfinishedTasks = ({ viewerHandlers }: IViewerHandlers): IUnfinishedTasks => {
	const isThunderboltRenderer = process.env.PACKAGE_NAME === 'thunderbolt-renderer'

	return {
		add: (name) => {
			if (isThunderboltRenderer || process.env.browser) {
				return _.noop
			} else {
				const id = _.uniqueId()
				viewerHandlers.unfinishedTasks.add(id, name)

				return () => {
					viewerHandlers.unfinishedTasks.remove(id)
				}
			}
		},
	}
}
