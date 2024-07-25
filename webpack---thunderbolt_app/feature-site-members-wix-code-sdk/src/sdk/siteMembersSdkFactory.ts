import { ConsentPolicy } from '@wix/cookie-consent-policy-client'
import { createFedopsLogger, ConsentPolicyInteraction, createConsentPolicyLogger } from '@wix/thunderbolt-commons'
import { WixCodeApiFactoryArgs, ConsentPolicyChangedHandler } from '@wix/thunderbolt-symbols'
import {
	AUTH_RESULT_REASON,
	ISiteMembersApi,
	IStatus,
	MemberDetails,
	memberDetailsFromDTO,
	SiteMembersSiteConfig,
} from 'feature-site-members'
import type {
	SiteMembersSdkMethods,
	SiteMembersWixCodeSdkHandlers,
	SiteMembersWixCodeSdkWixCodeApi,
	LegacySiteMembersWixCodeSdkWixCodeApi,
	LoginHandler,
	RegistrationOptions,
	LegacyRegistrationResult,
	RegistrationResult,
	Fieldset,
	MemberRoleDTO,
	VeloMember,
} from '../types'
import { UserErrors, REGISTRATION_RESULT_STATUS_DISPLAY } from '../types'
import { getWithCaptchaChallengeHandler, mockMemberDetailsOnPreviewMode } from '../utils'
import { namespace, memberNamespace, name } from '../symbols'
import { User } from '../user/user'
import { apis, formatPlatformizedHttpError, handleErrors, onAuthHandler } from '../user/utils'
import { validateEmailUserParams } from './validations'
import { MembersSdk } from './members'
import { MembersLoginHandler } from '..'
import { createUser } from '../user/user.new'
import { memberDetailsToVeloMember } from './memberMapper'

export async function SiteMembersSdkFactory({
	featureConfig,
	handlers,
	appEssentials,
	platformEnvData,
	platformUtils,
	wixCodeNamespacesRegistry,
	onPageWillUnmount,
}: WixCodeApiFactoryArgs<SiteMembersSiteConfig, never, SiteMembersWixCodeSdkHandlers>): Promise<{
	[memberNamespace]?: SiteMembersWixCodeSdkWixCodeApi
	[namespace]: LegacySiteMembersWixCodeSdkWixCodeApi
}> {
	const { locationManager, sessionService, biUtils, essentials, consentPolicyManager } = platformUtils
	const { httpClient } = appEssentials
	const { smToken, smcollectionId, isEditMode, isPreviewMode } = featureConfig
	const {
		login,
		applySessionToken,
		promptForgotPassword,
		promptLogin,
		register,
		registerToUserLogin,
		unRegisterToUserLogin,
		registerToMemberLogout,
		unRegisterToMemberLogout,
		logout,
		getMemberDetails,
		sendSetPasswordEmail,
		sendForgotPasswordMail,
		changePassword,
		getVisitorId,
	}: SiteMembersSdkMethods = handlers[name]
	const isLiveSite = !isEditMode

	const {
		window: { isSSR },
		location: { externalBaseUrl: baseUrl, metaSiteId },
		site: { experiments },
		bi,
	} = platformEnvData

	const membersSdk = new MembersSdk(sessionService, httpClient, isPreviewMode)

	const getMemberDetailsUrl = new URL(
		`/_api/wix-sm-webapp-proxy/member/${smToken}?collectionId=${smcollectionId}&metaSiteId=${metaSiteId}`,
		locationManager.getLocation().href
	).href

	const getMemberDetailsForSSR: () => Promise<MemberDetails | null> = () =>
		sessionService.getSmToken()
			? self
					.fetch(getMemberDetailsUrl, {
						headers: {
							'x-wix-client-artifact-id': 'thunderbolt',
						},
					})
					.then((r) => r.json())
					.then((r) => (r.errorCode ? null : memberDetailsFromDTO(r.payload)))
			: Promise.resolve(null)

	const _getMemberDetails = isSSR ? getMemberDetailsForSSR : getMemberDetails
	const refs = { getMemberDetails: _getMemberDetails, isLiveSite }

	const memberDetails = isEditMode
		? mockMemberDetailsOnPreviewMode(sessionService)
		: await _getMemberDetails().catch(() => null)
	const currentUser = createUser(
		{ ...memberDetails, uid: memberDetails?.id, svSession: sessionService.getUserSession() },
		memberDetails ? REGISTRATION_RESULT_STATUS_DISPLAY[memberDetails.status as IStatus] : undefined,
		baseUrl,
		refs,
		experiments,
		sessionService,
		sessionService.getWixCodeInstance()
	)
	const onLogin: Record<string, Array<LoginHandler | MembersLoginHandler>> = { users: [], members: [] }
	// I know it's silly to have a dictionary with a one key but I prefer consistency with onLogin structure
	const onLogout: Record<string, Array<() => void>> = { members: [] }

	const sendUserEmailApi = apis.sendUserEmailApi(baseUrl)
	const fedopsLogger = createFedopsLogger({
		appName: 'site-members-wix-code-sdk',
		biLoggerFactory: biUtils.createBiLoggerFactoryForFedops(),
		phasesConfig: 'SEND_START_AND_FINISH',
		customParams: {
			viewerName: 'thunderbolt',
		},
		factory: essentials.createFedopsLogger,
		experiments: essentials.experiments.all(),
		monitoringData: {
			metaSiteId,
			dc: bi.dc,
			isHeadless: bi.isjp, // name is weird because legacy
			isCached: bi.isCached,
			rolloutData: bi.rolloutData,
		},
	})

	const { executeAndLog, executeAndLogAsync } = createConsentPolicyLogger(fedopsLogger)

	const _login: ISiteMembersApi['login'] = async (email, password, options) => {
		const withCaptchaChallengeHandler = getWithCaptchaChallengeHandler(wixCodeNamespacesRegistry)
		if (options?.recaptchaToken) {
			return login(email, password, options)
		} else {
			return withCaptchaChallengeHandler((recaptchaToken) =>
				login(email, password, { ...(options || {}), recaptchaToken })
			)
		}
	}
	const _emailUser: LegacySiteMembersWixCodeSdkWixCodeApi['emailUser'] = async (emailId, toUser, options) => {
		fedopsLogger.interactionStarted('email-user')
		let processedOptions
		try {
			processedOptions = validateEmailUserParams(emailId, toUser, options).processedOptions
		} catch (err) {
			fedopsLogger.interactionEnded('email-user')
			throw err
		}
		const params = { emailId, memberId: toUser, options: processedOptions }
		const response = await fetch(sendUserEmailApi, {
			method: 'POST',
			headers: { authorization: sessionService.getWixCodeInstance() || '' },
			body: JSON.stringify(params),
		})
		if (!response.ok) {
			throw new Error(await response.text())
		}
		fedopsLogger.interactionEnded('email-user')
	}
	type IPromptLogin = (
		isMembersApi: boolean
	) =>
		| LegacySiteMembersWixCodeSdkWixCodeApi['promptLogin']
		| SiteMembersWixCodeSdkWixCodeApi['authentication']['promptLogin']
	const _promptLogin: IPromptLogin = (isMembersApi: boolean) => async (
		options
	): Promise<VeloMember | User | undefined> => {
		if (isSSR) {
			return new Promise(() => {})
		}
		const member = await promptLogin(options)
		// We can count on currentUser being updated because login is guaranteed not to
		// resolve before all onLogin callbacks (including the one that updates currentMember)
		// have resolved.
		//
		// TODO: The above was suppose to be true but we have a bug there and it's summer so
		// I have no time to figure it out so I made a patch to a production bug and initiate a new instance.
		// We better off fixing it as this initialization is basically redundant.
		if (!isMembersApi) {
			legacyApi.currentUser = createUser(
				{ ...member, uid: member?.id, svSession: sessionService.getUserSession() },
				member ? REGISTRATION_RESULT_STATUS_DISPLAY[member.status as IStatus] : undefined,
				baseUrl,
				refs,
				experiments,
				sessionService,
				sessionService.getWixCodeInstance()
			)
			return legacyApi.currentUser
		}
		return {
			...getMember({ fieldsets: ['FULL'] }),
			revision: member?.revision,
		}
	}
	type IRegister = (
		isMembersApi: boolean
	) =>
		| LegacySiteMembersWixCodeSdkWixCodeApi['register']
		| SiteMembersWixCodeSdkWixCodeApi['authentication']['register']
	const _register: IRegister = (isMembersApi: boolean) => async (
		email: string,
		password: string,
		options: RegistrationOptions = {}
	) => {
		const withCaptchaChallengeHandler = getWithCaptchaChallengeHandler(wixCodeNamespacesRegistry)
		try {
			const data = options?.recaptchaToken
				? await register(email, password, options)
				: await withCaptchaChallengeHandler((recaptchaToken) =>
						register(email, password, { ...(options || {}), recaptchaToken })
				  )
			const response = {
				status: data.status,
				...(data.approvalToken ? { approvalToken: data.approvalToken } : {}),
			}
			if (isMembersApi) {
				const member = {
					...(await getMember({ fieldsets: ['FULL'] })),
					revision: data.user?.revision,
				}
				return {
					...response,
					member,
				} as RegistrationResult
			}
			const user = createUser(
				{
					uid: data.user?.id,
					svSession: sessionService.getUserSession(),
					...data.user,
				},
				REGISTRATION_RESULT_STATUS_DISPLAY[data.status],
				baseUrl,
				refs,
				experiments,
				sessionService,
				sessionService.getWixCodeInstance()
			)
			return {
				...response,
				user,
			} as LegacyRegistrationResult
		} catch (error) {
			// TODO: We should definitely return a platformized error response but we need
			// to consider how to keep support backwards compatibility
			if (error.message) {
				console.error(error.message)
				return Promise.reject(error.message)
			}
			if (error === AUTH_RESULT_REASON.CANCELED) {
				return Promise.reject(error)
			}
			return Promise.reject(error?.details?.applicationError?.code)
		}
	}

	const getMember = async (
		{ fieldsets }: { fieldsets?: Array<Fieldset> } = { fieldsets: ['FULL'] }
	): Promise<VeloMember | undefined> => {
		return membersSdk.getMyMember(fieldsets)
	}

	const makeProfilePublic = async (): Promise<VeloMember | undefined> => {
		return membersSdk.joinCommunity()
	}

	const makeProfilePrivate = async (): Promise<VeloMember | undefined> => {
		return membersSdk.leaveCommunity()
	}

	const getRoles = () => {
		if (!sessionService.getSmToken()) {
			return Promise.reject(UserErrors.NO_LOGGED_IN)
		}
		return fetch(apis.currentUserRolesUrl(baseUrl), {
			headers: { authorization: sessionService.getWixCodeInstance() || '' },
		})
			.then(handleErrors)
			.then((res: { groups: Array<MemberRoleDTO> }) =>
				res.groups.map(({ id: _id, createdDate: _createdDate, ...rest }) => {
					return { _id, _createdDate, ...rest }
				})
			)
			.catch((error: any) => Promise.reject(formatPlatformizedHttpError(error)))
	}

	const legacyApi: LegacySiteMembersWixCodeSdkWixCodeApi = {
		currentUser,
		login: (...args) => _login(...args).then(() => {}),
		applySessionToken,
		emailUser: _emailUser,
		promptForgotPassword,
		promptLogin: _promptLogin(false),
		register: _register(false),
		onLogin(handler: LoginHandler) {
			onLogin.users = [...onLogin.users, handler]
		},
		logout,
		getCurrentConsentPolicy() {
			return executeAndLog(consentPolicyManager.getDetails, ConsentPolicyInteraction.GET_CURRENT_CONSENT_POLICY)
		},
		_getConsentPolicyHeader() {
			return consentPolicyManager.getHeader()
		},
		setConsentPolicy(policy: ConsentPolicy) {
			return executeAndLogAsync(
				() => consentPolicyManager.setPolicy(policy),
				ConsentPolicyInteraction.SET_CONSENT_POLICY
			)
		},
		resetConsentPolicy() {
			return executeAndLogAsync(consentPolicyManager.resetPolicy, ConsentPolicyInteraction.RESET_CONSENT_POLICY)
		},
		onConsentPolicyChanged(handler: ConsentPolicyChangedHandler) {
			return executeAndLog(
				() => consentPolicyManager.onChanged(handler),
				ConsentPolicyInteraction.ON_CONSENT_POLICY_CHANGED
			)
		},
		supportsPopupAutoClose: true,
	}

	const api: SiteMembersWixCodeSdkWixCodeApi = {
		currentMember: {
			getMember,
			makeProfilePublic,
			makeProfilePrivate,
			getRoles,
		},
		authentication: {
			loggedIn() {
				return !!sessionService.getSmToken()
			},
			login: (...args) => _login(...args).then((loginResult) => memberDetailsToVeloMember(loginResult.member)),
			applySessionToken,
			promptForgotPassword,
			promptLogin: _promptLogin(true) as SiteMembersWixCodeSdkWixCodeApi['authentication']['promptLogin'],
			register: _register(true) as SiteMembersWixCodeSdkWixCodeApi['authentication']['register'],
			onLogin(handler: MembersLoginHandler) {
				onLogin.members = [...onLogin.members, handler]
			},
			onLogout(handler: () => void) {
				onLogout.members = [...onLogout.members, handler]
			},
			logout,
			sendSetPasswordEmail,
			sendForgotPasswordMail,
			changePassword,
			getVisitorId,
		},
		supportsPopupAutoClose: true,
	}

	if (process.env.browser && isLiveSite) {
		registerToUserLogin(async (newMemberDetails) => {
			legacyApi.currentUser = createUser(
				{ ...newMemberDetails, uid: newMemberDetails?.id, svSession: sessionService.getUserSession() },
				newMemberDetails ? REGISTRATION_RESULT_STATUS_DISPLAY[newMemberDetails.status] : undefined,
				baseUrl,
				refs,
				experiments,
				sessionService,
				sessionService.getWixCodeInstance()
			)

			return Promise.all([
				...onLogin.users.map(onAuthHandler(legacyApi.currentUser)),
				...onLogin.members.map(onAuthHandler(api.currentMember)),
			])
		})
			.then((callbackId) => onPageWillUnmount(() => unRegisterToUserLogin(callbackId)))
			.catch((e) => {
				throw new Error(`Failed to register to user login: ${e}`)
			})

		registerToMemberLogout(() => Promise.all(onLogout.members.map(onAuthHandler())))
			.then((callbackId) => onPageWillUnmount(() => unRegisterToMemberLogout(callbackId)))
			.catch((e) => {
				throw new Error(`Failed to register to member logout: ${e}`)
			})
	}

	return {
		[namespace]: legacyApi,
		[memberNamespace]: api,
	}
}
