import { Experiments, SessionServiceAPI, METASITE_APP_DEF_ID } from '@wix/thunderbolt-symbols'
import { REGISTRATION_RESULT_STATUS_DISPLAY, UserRoles, UserErrors } from '../types'
import {
	apis,
	formatPlatformizedHttpError,
	getCurrentMember,
	getUserPlans,
	handleErrors,
	serializeMemberRoles,
} from './utils'
import { MemberDetails, ISiteMembersApi } from 'feature-site-members'
import { User } from './user'

interface IRefs {
	getMemberDetails: ISiteMembersApi['getMemberDetails']
	isLiveSite: boolean
}
export interface Member extends MemberDetails {
	uid: string
	svSession: string
}

let baseUrlSingleton = ''
let _refs: IRefs

export const createUser = (
	memberData: Partial<Member>,
	status: REGISTRATION_RESULT_STATUS_DISPLAY | undefined,
	baseUrl: string,
	refs: IRefs,
	experiments: Experiments,
	sessionService: SessionServiceAPI,
	_authorization?: string
): User => {
	_refs = refs
	baseUrlSingleton = baseUrl
	let _role: UserRoles
	let _id: string | undefined
	let _contactId: string | undefined
	let _loggedIn: boolean = false

	if (memberData.uid && status === REGISTRATION_RESULT_STATUS_DISPLAY.PENDING) {
		_id = memberData.uid
		_role = UserRoles.VISITOR
	} else if (memberData.uid) {
		_id = memberData.uid
		_loggedIn = true
		_contactId = memberData.contactId
		_role = memberData.role === 'OWNER' ? UserRoles.ADMIN : UserRoles.MEMBER
	} else {
		_id = memberData.svSession
		_role = UserRoles.VISITOR
	}
	const _getCurrentMember = getCurrentMember(experiments)
	const getEmail = () => {
		if (!_loggedIn) {
			return Promise.reject(UserErrors.NO_LOGGED_IN)
		}
		return _getCurrentMember({
			authorization: sessionService.getInstance(METASITE_APP_DEF_ID),
			baseUrl: baseUrlSingleton,
			..._refs,
		}).then(({ member }: any) =>
			member ? member.loginEmail || member.email : Promise.reject(UserErrors.NO_LOGGED_IN)
		)
	}
	const getPricingPlans = () => {
		if (!_loggedIn) {
			return Promise.reject(UserErrors.NO_LOGGED_IN)
		}
		return getUserPlans(
			_id,
			sessionService.getInstance(METASITE_APP_DEF_ID),
			baseUrlSingleton
		).catch((error: any) => Promise.reject(formatPlatformizedHttpError(error)))
	}
	const getSlug = () => {
		if (!_loggedIn) {
			return Promise.reject(UserErrors.NO_LOGGED_IN)
		}

		return _getCurrentMember({
			authorization: sessionService.getInstance(METASITE_APP_DEF_ID),
			baseUrl: baseUrlSingleton,
			..._refs,
		}).then(({ member }: any) => {
			return member ? member.slug || member?.profile.slug : Promise.reject(UserErrors.NO_LOGGED_IN)
		})
	}
	const getRoles = () => {
		if (!_loggedIn) {
			return Promise.reject(UserErrors.NO_LOGGED_IN)
		}
		return fetch(apis.currentUserRolesUrl(baseUrlSingleton), {
			headers: { authorization: sessionService.getInstance(METASITE_APP_DEF_ID) },
		})
			.then(handleErrors)
			.then(serializeMemberRoles)
			.catch((error: any) => Promise.reject(formatPlatformizedHttpError(error)))
	}

	return {
		id: _id,
		loggedIn: _loggedIn,
		contactId: _contactId,
		role: _role,
		getEmail,
		getPricingPlans,
		getSlug,
		getRoles,
	} as User
}
