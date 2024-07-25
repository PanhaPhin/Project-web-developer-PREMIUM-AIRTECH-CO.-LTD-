import { eventNames, publishEvent } from './events';
import { createTagCallBack, runCallback } from '../utils/callbackUtils';
import { buildNode } from '../dom-manipulation/nodeBuilder';
import { parseEmbedData } from '../dom-manipulation/domContentParser';
import {
  NodeToRender,
  Position,
  SiteEmbededTag,
  PageInfo,
  SiteTag,
  boolString,
} from '../types';
import { addLoadedTag, addLoadErrorTag, setLoading } from './stateCache';
import { filterTagsByPageID, getSiteTagsFromSiteEmbed } from './tags';
import { SHOULD_RENDER_TAGS_PER_PAGE_SPEC } from '../consts/consts';
import { isExperimentOpen } from '../utils/experiments';

/**
 *  Iterate through the embeds collection and apply them to the DOM
 *  Keep a reference to any nodes that need to be reapplied for removal
 *  Keep a reference to any embeds that should be reapplied to re-apply them
 * @param tags - tags list from tag-manager-server.
 * @param pageInfo - represent that page information to load the tags list on .
 * @param experiments - map of experiments for A/B testing and gradually releases.
 */
function applySiteEmbeds(
  tags: SiteEmbededTag[],
  pageInfo: PageInfo,
  experiments: Record<string, boolString>,
) {
  const tagsWithoutEmbeddedNodes: SiteEmbededTag[] = tags.filter(
    (tag) => !tag.embeddedNodes,
  );
  const shouldRenderTagsPerPage: boolean = isExperimentOpen(
    experiments,
    SHOULD_RENDER_TAGS_PER_PAGE_SPEC,
  );
  const tagsToEmbed: SiteEmbededTag[] = shouldRenderTagsPerPage
    ? filterTagsByPageID(tagsWithoutEmbeddedNodes, pageInfo)
    : tagsWithoutEmbeddedNodes;

  const loadingTags: SiteTag[] = getSiteTagsFromSiteEmbed(tagsToEmbed);
  setLoading(loadingTags);
  publishEvent(eventNames.TAGS_LOADING, window as any, loadingTags);

  tagsToEmbed.forEach((siteEmbed: SiteEmbededTag) => {
    /**
     * Pre create this so that we know immediately which tag owns each nodes
     * and we can perfrom referncing logic synchronously
     * while this is "uglier" from a purisitic point of view
     * it's less complex for the general flow
     */
    const appId = siteEmbed.tag.appInfo?.id;
    siteEmbed.embeddedNodes = siteEmbed.embeddedNodes || [];
    const tag = siteEmbed.tag;
    const nodesToEmbed = parseEmbedData(tag.content);
    const embedLocation =
      tag.position && tag.position !== Position.HEAD
        ? document.body
        : document.head;

    const onload = createTagCallBack(
      eventNames.TAG_LOADED,
      tag.name,
      tag,
      addLoadedTag,
    );
    const onerror = createTagCallBack(
      eventNames.TAG_LOAD_ERROR,
      tag.name,
      tag,
      addLoadErrorTag,
    );

    createSiteEmbed(
      nodesToEmbed,
      {
        onload,
        onerror,
      },
      embedLocation,
      tag.position === Position.BODY_START,
      siteEmbed.embeddedNodes,
      appId,
    );
  });
}

/**
 *
 * @param renderingInput - an Array of DOM Nodes to render
 * @param callbacks - { onloaded, onerror } - methods to notify when load has been completed for all nodes or failed for some
 * @param parentNode - the node to embed in
 * @param before - if to embed in the beginning of the body
 */
function createSiteEmbed(
  renderingInput: NodeToRender[],
  callbacks: {
    onload?: Function;
    onerror?: Function;
  },
  parentNode: HTMLElement,
  before: boolean,
  embeddedNodes: any[],
  appId?: string,
) {
  let counters = 0;

  const onload = () => {
    counters = counters - 1;
    if (counters >= 0) {
      runCallback(callbacks.onload, {});
    }
  };
  const onerror = () => {
    counters = counters - 1;
    if (counters >= 0) {
      runCallback(callbacks.onerror, { error: true });
    }
  };
  const firstChild = parentNode.firstChild; // captured so all nodes are inserted before it
  renderingInput.forEach((node: NodeToRender) => {
    if (node.tag === 'SCRIPT') {
      counters = counters + 1;
    }
    const resultNode: HTMLElement | Node = buildNode(
      node,
      { onload, onerror },
      appId,
    );
    // It's important that we do this before adding them to the DOM
    // since we will refernce them later to resolve things
    embeddedNodes.push(resultNode);
    if (before) {
      parentNode.insertBefore(resultNode, firstChild);
    } else {
      parentNode.appendChild(resultNode);
    }
  });

  if (counters === 0) {
    runCallback(callbacks.onload, {}, true);
  }
}

export { applySiteEmbeds };
