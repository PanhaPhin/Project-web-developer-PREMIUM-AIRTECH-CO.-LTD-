import { runCallback } from '../utils/callbackUtils';
import { NodeToRender } from '../types';
import { createModuleFlowConfiguration } from '../utils/moduleJsTemplates';

function buildNode(
  nodeInfo: NodeToRender,
  callbacks: {
    onload?: Function;
    onerror?: Function;
  },
  appId?: string,
): HTMLElement | Node {
  let node: HTMLElement | Node;
  if (nodeInfo.nodeType === Node.TEXT_NODE) {
    node = document.createTextNode(nodeInfo.content);
  } else if (nodeInfo.nodeType === Node.COMMENT_NODE) {
    node = document.createComment(nodeInfo.content);
  } else {
    node = document.createElement(nodeInfo.tag);
    if (nodeInfo && nodeInfo.attributes instanceof NamedNodeMap) {
      Array.prototype.forEach.call(nodeInfo.attributes, (attr: any) => {
        setAttribute(node, attr.name, attr.value);
      });
    } else if (typeof nodeInfo.attributes === 'object') {
      Object.keys(nodeInfo.attributes).forEach((key: string) => {
        if (typeof nodeInfo.attributes[key] !== void 0) {
          setAttribute(node, key, nodeInfo.attributes[key]);
        }
      });
    }
    if (nodeInfo.tag === 'SCRIPT') {
      node = handleScriptTagFlow(node, nodeInfo.content, callbacks, appId);
    } else if (nodeInfo.children && nodeInfo.children.length > 0) {
      nodeInfo.children.forEach((childNode) => {
        const renderedChild = buildNode(childNode, callbacks, appId);
        node.appendChild(renderedChild);
      });
    }
  }
  return node;
}

function handleScriptTagFlow(
  script: HTMLScriptElement | any,
  content: string = '',
  callbacks: {
    onload?: Function;
    onerror?: Function;
  },
  appId?: string,
): HTMLElement | Node {
  if (
    appId &&
    script.getAttribute('type') === 'module' &&
    script.getAttribute('accesstoken') === 'true'
  ) {
    let moduleImportUrl: string = script.src;
    if (!moduleImportUrl && content) {
      moduleImportUrl = createUrlBlob(content);
    }
    // Cleanup any references to the script we won't be using
    script = null;

    // Build configuration for the scripts we are creating
    const { helperScriptConfig, moduleScriptConfig } =
      createModuleFlowConfiguration(moduleImportUrl, appId);
    /**
     * When the helper script Node has loaded, it
     * creates the module script Node that consumes the function it built
     * and adds it to the DOM
     */
    const onAccessTokenScriptLoad = () => {
      const acccessTokenModuleScriptTag = buildNode(
        moduleScriptConfig.node,
        moduleScriptConfig.callbacks,
        appId,
      );
      document.head.appendChild(acccessTokenModuleScriptTag);
    };
    /**
     * Here we create the helper script Node and it is added to the list
     * of nodes owned by the appId
     */
    const accessTokenScriptTag = buildNode(
      helperScriptConfig,
      {
        onload: onAccessTokenScriptLoad,
        onerror: callbacks?.onerror,
      },
      appId,
    );
    return accessTokenScriptTag;
  } else {
    addScriptCallbacksAndContent(script, content, callbacks);
  }
  return script;
}

function addScriptCallbacksAndContent(
  script: HTMLScriptElement | any,
  content: string = '',
  callbacks: {
    onload?: Function;
    onerror?: Function;
  },
) {
  const hasContent = content && !!content.trim();
  if (hasContent) {
    script.src = createUrlBlob(content);
  }
  script.addEventListener(
    'load',
    function () {
      runCallback(callbacks && callbacks.onload, null);
    },
    false,
  );
  script.addEventListener(
    'error',
    function () {
      runCallback(callbacks && callbacks.onerror, null);
    },
    false,
  );
}

function setAttribute(
  node: HTMLElement | HTMLScriptElement | any,
  key: string,
  value: any,
) {
  node.setAttribute(key, value);
}

function createUrlBlob(content: string) {
  const blob = new Blob([content], {
    type: 'text/javascript;charset=utf-8',
  });
  return URL.createObjectURL(blob);
}

export { buildNode };
