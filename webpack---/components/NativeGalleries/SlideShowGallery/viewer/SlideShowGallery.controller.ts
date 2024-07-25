import { withCompController } from '@wix/editor-elements-integrations';
import type {
  ISlideShowGalleryControllerProps,
  ISlideShowGalleryMapperProps,
  ISlideShowGalleryProps,
} from '../SlideShowGallery.types';

export default withCompController<
  ISlideShowGalleryMapperProps,
  ISlideShowGalleryControllerProps,
  ISlideShowGalleryProps
>(({ mapperProps, controllerUtils }) => {
  return {
    ...mapperProps,
    setCurrentIndex: (itemIndex: number) => {
      controllerUtils.updateProps({
        currentIndex: itemIndex,
      });
    },
    setAutoPlay: (autoPlay: boolean) => {
      controllerUtils.updateProps({
        autoPlay,
      });
    },
  };
});
