import ContainerComponent from '../components/Container/viewer/Container';
import BackgroundGroupComponent from '../components/PageGroup/BackgroundGroup/viewer/BackgroundGroup';
import PageGroupComponent from '../components/PageGroup/PageGroup/viewer/PageGroup';
import StylableButtonComponent from '../components/StylableButton/viewer/StylableButton';
import StylableButtonController from '../components/StylableButton/viewer/StylableButton.controller';
import VectorImageComponent from '../components/VectorImage/viewer/VectorImage';
import VectorImageController from '../components/VectorImage/viewer/VectorImage.controller';
import WRichTextComponent from '../components/WRichText/viewer/WRichText';
import AnchorComponent from '@wix/thunderbolt-elements/src/components/Anchor/viewer/Anchor';
import FooterContainer_TransparentScreenComponent from '@wix/thunderbolt-elements/src/components/FooterContainer/viewer/skinComps/BaseScreen/TransparentScreen.skin';
import HeaderContainer_TransparentScreenComponent from '@wix/thunderbolt-elements/src/components/HeaderContainer/viewer/skinComps/BaseScreen/TransparentScreen.skin';
import HeaderContainer_TransparentScreenController from '@wix/thunderbolt-elements/src/components/HeaderContainer/viewer/HeaderContainer.controller';
import LinkBar_ClassicComponent from '@wix/thunderbolt-elements/src/components/LinkBar/viewer/skinComps/Classic/Classic.skin';
import LinkBar_ClassicController from '@wix/thunderbolt-elements/src/components/LinkBar/viewer/LinkBar.controller';
import PagesContainerComponent from '@wix/thunderbolt-elements/src/components/PagesContainer/viewer/PagesContainer';
import MasterPageComponent from '@wix/thunderbolt-elements/src/thunderbolt-core-components/MasterPage/viewer/MasterPage';
import PinnedLayerComponent from '@wix/thunderbolt-elements/src/thunderbolt-core-components/PinnedLayer/viewer/PinnedLayer';


const Container = {
  component: ContainerComponent
};

const BackgroundGroup = {
  component: BackgroundGroupComponent
};

const PageGroup = {
  component: PageGroupComponent
};

const StylableButton = {
  component: StylableButtonComponent,
  controller: StylableButtonController
};

const VectorImage = {
  component: VectorImageComponent,
  controller: VectorImageController
};

const WRichText = {
  component: WRichTextComponent
};

const Anchor = {
  component: AnchorComponent
};

const FooterContainer_TransparentScreen = {
  component: FooterContainer_TransparentScreenComponent
};

const HeaderContainer_TransparentScreen = {
  component: HeaderContainer_TransparentScreenComponent,
  controller: HeaderContainer_TransparentScreenController
};

const LinkBar_Classic = {
  component: LinkBar_ClassicComponent,
  controller: LinkBar_ClassicController
};

const PagesContainer = {
  component: PagesContainerComponent
};

const MasterPage = {
  component: MasterPageComponent
};

const PinnedLayer = {
  component: PinnedLayerComponent
};


export const components = {
  ['Container']: Container,
  ['BackgroundGroup']: BackgroundGroup,
  ['PageGroup']: PageGroup,
  ['StylableButton']: StylableButton,
  ['VectorImage']: VectorImage,
  ['WRichText']: WRichText,
  ['Anchor']: Anchor,
  ['FooterContainer_TransparentScreen']: FooterContainer_TransparentScreen,
  ['HeaderContainer_TransparentScreen']: HeaderContainer_TransparentScreen,
  ['LinkBar_Classic']: LinkBar_Classic,
  ['PagesContainer']: PagesContainer,
  ['MasterPage']: MasterPage,
  ['PinnedLayer']: PinnedLayer
};

