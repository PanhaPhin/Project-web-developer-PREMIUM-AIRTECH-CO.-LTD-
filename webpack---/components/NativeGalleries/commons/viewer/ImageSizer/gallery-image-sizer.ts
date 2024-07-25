import fastdom from 'fastdom';
import { isSafari } from '@wix/editor-elements-common-utils';

const customElementName = 'gallery-image-sizer';

function refreshElement(node: HTMLElement) {
  node.style.setProperty('transform', 'translateZ(0)');

  requestAnimationFrame(() => {
    node.style.removeProperty('transform');
  });
}

const getFillToFitSize = (
  width: number,
  height: number,
  originalImageWidth: number,
  originalImageHeight: number,
): {
  width: number;
  height: number;
} => {
  const aspectRatio = originalImageWidth / originalImageHeight;
  const newWidth = Math.round(height * aspectRatio);

  if (newWidth <= width) {
    return {
      width: newWidth,
      height,
    };
  }

  const newHeight = Math.round(width / aspectRatio);
  return {
    width,
    height: newHeight,
  };
};

const registerGalleryImagerSizer = () => {
  if (
    typeof window !== 'undefined' &&
    window.customElements &&
    !window.customElements.get(customElementName)
  ) {
    class ImageSizer extends HTMLElement {
      private sizeObserver: ResizeObserver;

      constructor() {
        super();
        this.sizeObserver = new ResizeObserver(entries =>
          this.onResize(entries),
        );
      }

      disconnectedCallback() {
        this.sizeObserver.disconnect();
      }

      connectedCallback() {
        this.sizeObserver.observe(this);
      }

      private onResize(entries: Readonly<Array<ResizeObserverEntry>>): void {
        const width = entries[0].contentRect.width;
        const height = entries[0].contentRect.height;
        this.resizeImage(width, height);
      }

      private resizeImage(
        containerWidth: number,
        containerHeight: number,
      ): void {
        const imageElement = this.children[0] as HTMLElement;
        if (imageElement) {
          const imageWidth = parseInt(this.dataset.imageWidth!, 10);
          const imageHeight = parseInt(this.dataset.imageHeight!, 10);

          const newImageSize = getFillToFitSize(
            containerWidth,
            containerHeight,
            imageWidth,
            imageHeight,
          );

          fastdom.mutate(() => {
            this.style.visibility = 'inherit';
            imageElement.style.width = `${newImageSize.width}px`;
            imageElement.style.height = `${newImageSize.height}px`;

            /**
             * in the Safari browser we need to trigger a redraw of an image element after resizing
             * in order to render the full image and get rid of flickering
             * https://jira.wixpress.com/browse/ECL-1271
             */
            if (isSafari()) {
              refreshElement(imageElement);
            }
          });
        }
      }
    }

    window.customElements.define(customElementName, ImageSizer);
  }
};

export default registerGalleryImagerSizer;
