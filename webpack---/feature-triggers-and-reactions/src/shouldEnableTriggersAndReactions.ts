import { withDependencies } from '@wix/thunderbolt-ioc'
import { BrowserWindowSymbol } from '@wix/thunderbolt-symbols'
import { isSSR } from '@wix/thunderbolt-commons'
import { IShouldEnableTriggersAndReactions } from './types'

export const ShouldEnableTriggersAndReactions = withDependencies(
	[BrowserWindowSymbol],
	(browserWindow): IShouldEnableTriggersAndReactions => {
		return {
			shouldEnableTriggersAndReactions: !isSSR(browserWindow),
		}
	}
)
