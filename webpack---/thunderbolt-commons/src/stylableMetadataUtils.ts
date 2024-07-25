import { StylableEditor, PanelComponentsMetadata } from '@wix/stylable-panel-drivers'
import { extensions, inlineModulesContext } from '@wix/stylable-viewer-flatten'

// Add .metadata.json if it's not already the suffix of the url
export const addMetadataSuffixToUrl = (stylableMetaData: string) =>
	`${stylableMetaData.replace('.metadata.json', '')}.metadata.json`

export const mergeStylableComponentsMetadata = (metas: Array<PanelComponentsMetadata>): PanelComponentsMetadata =>
	mergeStylableMetadata('wix-ui-santa', metas)

function getEmptyMetadata(): PanelComponentsMetadata {
	return {
		version: '',
		name: '',
		fs: {},
		components: {},
		packages: {},
	}
}

function fixMetadata(metadata: PanelComponentsMetadata): PanelComponentsMetadata {
	return {
		...getEmptyMetadata(),
		...metadata,
	}
}

/**
 * Merges multiple stylable components metadata objects
 * @param rootPackage - key of the package as specified in meta.packages
 * @param metas - array of metadata objects to merge
 * @returns meta - merged object from all given metas
 */
const mergeStylableMetadata = (rootPackage: string, metas: Array<PanelComponentsMetadata>): PanelComponentsMetadata => {
	const output = getEmptyMetadata()

	// Aggregate data from all objects:
	let combinedIndex = ''

	metas
		.filter((meta) => !!meta)
		.map(fixMetadata)
		.forEach((meta) => {
			if (meta.packages[rootPackage]) {
				const indexPath = meta.packages[rootPackage] + '/index.st.css'
				if (meta.fs[indexPath]) {
					combinedIndex += meta.fs[indexPath].content
				}
			}

			output.version += meta.version + ','
			output.name += meta.name + ','
			output.fs = { ...output.fs, ...meta.fs }
			output.components = { ...output.components, ...meta.components }
			output.packages = { ...output.packages, ...meta.packages }
		})

	// Create combined index:
	const packagePath = '/combined-root'
	output.packages[rootPackage] = packagePath
	const packageIndexPath = `${packagePath}/index.st.css`
	output.fs[packageIndexPath] = {
		content: combinedIndex,
		metadata: { namespace: rootPackage + 'combined-index' },
	}

	return output
}

export const registerStylableExtensions = (stylableInstance: StylableEditor, staticMediaUrl: string) => {
	stylableInstance.registerExtensions(extensions) // register mixins, formatters, transformation plugins and getMinimalCss
	inlineModulesContext.setStaticMediaUrl(staticMediaUrl) // Set static media URL - for images
}
