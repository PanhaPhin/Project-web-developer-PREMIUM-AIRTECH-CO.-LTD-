/**
 * Generates the getAccessToken function for
 * the application
 * @param functionId - the name of the function we will create
 * @returns string content for the helper script
 */
function createAccessTokenForModule(functionId: string): string {
  return `(function(getAccessToken){
    Object.defineProperty(globalThis, "${functionId}", {
      value: getAccessToken,
      enumerable: false,
      configurable: true,
      writable: true,
    });
  }(wixEmbedsAPI.getAccessTokenFunction()))`;
}
/**
 * This is a simple module that we generate
 * It expects a named export called `injectAccessTokenFunction`
 * It will try to run that function in order to inject it with the access token function
 * we build previously and the appId we found
 * @param urlSrc - a url to the source code or BLOB we built
 * @param getAccessTokenFunctionPointer - the name of the access token function we created on the global
 * @param appId - the appId for logging purposes
 * @returns string Script content
 */
function createModuleImport(
  urlSrc: string,
  getAccessTokenFunctionPointer: string,
  appId?: string,
): string {
  return `import { injectAccessTokenFunction } from "${urlSrc}";
  if(injectAccessTokenFunction){
    injectAccessTokenFunction(${getAccessTokenFunctionPointer}, "${appId}");
  } else {
    console.error("AppId ${appId} does not expose function correctly, error code: Client 404");
  }`;
}

const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const charArrayLength = characters.length;

// Generates a random function name
export function createFunctionName(): string {
  let funcName = '';
  for (let i = 0; i < 16; i++) {
    funcName += characters.charAt(Math.floor(Math.random() * charArrayLength));
  }
  return funcName;
}
/**
 * This function handles creating all the string content resources, callbacks
 * and identifiers needed for the flow, then proceeds to feed it back to the building code for it to run
 * @param moduleSrcUrl - the URL external URL or a url Blob link we created
 * @param appId - the AppId that belongs to this app, only for logging purposes
 * @returns configurations of scripts we need to build
 */
export function createModuleFlowConfiguration(
  moduleSrcUrl: string,
  appId?: string,
) {
  const functionId = createFunctionName();
  const scriptContent = createAccessTokenForModule(functionId);
  const moduleScriptContent = createModuleImport(
    moduleSrcUrl,
    functionId,
    appId,
  );
  // This function removes the global accessToken function we created for this script
  const removePointerCallback = () => {
    // @ts-expect-error
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete globalThis[id];
  };

  const helperScriptConfig = {
    tag: 'SCRIPT',
    content: scriptContent,
  };

  /**
   * Note this script is wired to remove itself from DOM immediately on load
   * This should not produce any side effects in terms of memory
   */
  const moduleScriptConfig = {
    node: {
      tag: 'SCRIPT',
      attributes: { type: 'module' },
      content: moduleScriptContent,
    },
    callbacks: {
      onload: function successLoad() {
        removePointerCallback();
        // @ts-expect-error
        this.parentNode.removeChild(this);
      },
      onerror: function errorLoad() {
        removePointerCallback();
        // @ts-expect-error
        this.parentNode.removeChild(this);
      },
    },
  };

  return {
    moduleScriptConfig,
    helperScriptConfig,
  };
}
