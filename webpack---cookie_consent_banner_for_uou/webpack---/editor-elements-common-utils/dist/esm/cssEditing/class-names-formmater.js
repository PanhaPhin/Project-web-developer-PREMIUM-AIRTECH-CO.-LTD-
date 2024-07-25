export const CSS_PREFIX = 'wixui-';
export const formatClassNames = (semanticClassName, ...customClassNames) => {
    const result = [];
    if (semanticClassName) {
        result.push(`${CSS_PREFIX}${semanticClassName}`);
    }
    customClassNames.forEach(className => {
        if (className) {
            // add each custom class with and without the prefix
            result.push(`${CSS_PREFIX}${className}`);
            result.push(className);
        }
    });
    return result.join(' ');
};
// remove when https://github.com/search?q=repo%3Awix-private%2Fthunderbolt%20customCssClasses&type=code has no usages
export const customCssClasses = (...classNames) => {
    // eslint-disable-next-line no-console
    console.warn('customCssClasses is deprecated, please use formatClassNames instead');
    const [semantic, ...rest] = classNames;
    return formatClassNames(semantic, ...rest);
};
//# sourceMappingURL=class-names-formmater.js.map