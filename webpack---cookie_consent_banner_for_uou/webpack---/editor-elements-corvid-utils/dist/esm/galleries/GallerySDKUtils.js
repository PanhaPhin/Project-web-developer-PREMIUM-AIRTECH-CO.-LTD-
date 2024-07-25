import {
    createMediaSrc,
    parseMediaSrc
} from '../media';
import {
    messages
} from '../messages';
import {
    reportError,
    reportWarning
} from '../reporters';
const isUndefined = (x) => typeof x === 'undefined';
const pickBy = (obj, predicate) => Object.entries(obj).reduce((acc, [k, v]) => {
    if (predicate(v, k)) {
        acc[k] = v;
    }
    return acc;
}, {});
const convertImagesToUserModel = (images, linkUtils) => {
    return images.map((image) => {
        const {
            type,
            title,
            width,
            height,
            uri,
            alt,
            description,
            link
        } = image;
        const mediaSrc = createMediaSrc({
            mediaId: uri,
            type: type.toLowerCase(),
            title,
            width,
            height,
        });
        const optionalValues = pickBy({
            description,
            alt,
            title,
            height,
            width,
            ...(link && {
                link: linkUtils.getLink(link),
                target: link.target
            }),
        }, value => !isUndefined(value));
        return {
            type: type.charAt(0).toUpperCase() + type.slice(1).toLowerCase(),
            src: mediaSrc.item || mediaSrc.error || '',
            ...optionalValues,
        };
    });
};
export const convertGalleryItemsToUserModel = (items, linkUtils) => {
    const images = items.map(item => {
        return {
            id: item.dataId,
            type: 'Image',
            title: item.title,
            width: item.image.width,
            height: item.image.height,
            uri: item.image.uri,
            alt: item.image.alt,
            description: item.description,
            link: item.link,
        };
    });
    return convertImagesToUserModel(images, linkUtils);
};
const getIdGenerator = (compId, dataId) => (index) => `${compId}_runtime_${dataId}items${index}`;
const convertImageOrReportError = (src, index, title, description, alt, imageLinkProps, idGenerator) => {
    src = src || '';
    const {
        height,
        width,
        error,
        mediaId = ''
    } = parseMediaSrc(src, 'image');
    if (error) {
        reportError(messages.invalidImageInGalleryWithIndex({
            wrongValue: src,
            index,
            propertyName: 'src',
        }));
    }
    const uri = mediaId;
    return {
        id: idGenerator(index),
        type: 'image',
        height,
        width,
        uri,
        ...(title && {
            title
        }),
        ...(description && {
            description
        }),
        ...(alt && {
            alt
        }),
        ...(imageLinkProps && { ...imageLinkProps
        }),
    };
};
const _convertToImagesPropsOrReport = (items, role, compId, dataId, resolveLink) => {
    const images = items.filter(image => !image.type || image.type.toLowerCase() === 'image');
    if (images.length !== items.length) {
        reportWarning(messages.noneImageInGallery(role));
    }
    const imagesModel = images
        .map((image, index) => {
            const {
                title,
                description,
                alt,
                link,
                src,
                target
            } = image;
            const linkTarget = target ? target : '_self';
            const imageLinkProps = link ? resolveLink(link, linkTarget) : null;
            return convertImageOrReportError(src, index, title, description, alt, imageLinkProps, getIdGenerator(compId, dataId));
        })
        .filter(x => x !== null);
    return imagesModel;
};
export const convertToGalleryItemsPropsOrReport = (items, role, compId, dataId, linkUtils, displayMode) => {
    const resolveLink = (link, target) => ({
        // TODO: Remove this force cast after types merge in TB
        link: linkUtils.getLinkProps(link, target),
    });
    const images = _convertToImagesPropsOrReport(items, role, compId, dataId, resolveLink);
    if (!images) {
        return null;
    }
    return images.map(image => {
        const imageProps = {
            displayMode,
            uri: image.uri,
            width: image.width,
            height: image.height,
            alt: image.alt,
            title: image.title,
        };
        return {
            dataId: image.id,
            title: image.title,
            description: image.description,
            image: imageProps,
            link: image.link,
        };
    });
};
export const createUnsupportedAPIReporter = (galleryType) => {
    return (api) => reportWarning(`'${api}' is not supported for an element of type: ${galleryType}.`);
};
//# sourceMappingURL=GallerySDKUtils.js.map