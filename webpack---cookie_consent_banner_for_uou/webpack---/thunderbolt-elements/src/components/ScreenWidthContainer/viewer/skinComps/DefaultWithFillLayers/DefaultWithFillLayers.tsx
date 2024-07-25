import * as React from 'react';
import classNames from 'clsx';
import WrapperElement from '../../WrapperElement';
import FillLayers from '../../../../FillLayers/viewer/FillLayers';
import { SkinScreenWidthContainerProps } from '../../../SkinScreenWidthContainer';
import { useScrollPosition } from '../../../../../providers/useScrollPosition';

import skinStyles from './styles/skins.scss';

const SCROLLED_Y = 2;
const DefaultWithFillLayers: React.FC<SkinScreenWidthContainerProps> = ({
  wrapperProps,
  fillLayers,
  children,
}) => {
  const [scrolled, setScrolled] = React.useState<boolean>(false);

  useScrollPosition(
    ({ currPos }) => {
      if (currPos.y * -1 >= SCROLLED_Y) {
        if (!scrolled) {
          setScrolled(true);
        }
      } else if (scrolled) {
        setScrolled(false);
      }
    },
    [scrolled],
  );

  return (
    <WrapperElement
      {...wrapperProps}
      skinClassName={skinStyles.DefaultWithFillLayers}
      skinStyles={skinStyles}
    >
      <div
        className={classNames(
          skinStyles.screenWidthBackground,
          scrolled && skinStyles.scrolled,
        )}
      >
        {fillLayers && (
          <FillLayers {...fillLayers} extraClass={skinStyles.fillLayers} />
        )}
        <div className={skinStyles.veloBackground} />
      </div>
      <div className={skinStyles.inlineContent}>{children}</div>
    </WrapperElement>
  );
};

export default DefaultWithFillLayers;
