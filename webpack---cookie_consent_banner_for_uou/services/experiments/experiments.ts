export const experiments = {
  enabled(specName: string) {
    return (
      window?.wixTagManager?.getConfig()?.experiments?.[specName] === 'true'
    );
  },
};
