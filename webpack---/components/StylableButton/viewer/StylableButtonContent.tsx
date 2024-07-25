import { formatClassNames } from '@wix/editor-elements-common-utils';
import type { ReactNode } from 'react';
import React from 'react';
import { TestIds } from '../constants';
import type { StylableButtonSemanticClassNames } from '../StylableButton.types';
import { classes, st } from './StylableButton.component.st.css';

/**
 * This component should be deleted after migrating from stylable to UDP
 */
const ButtonContent: React.FC<{
  icon?: ReactNode;
  label?: string;
  override?: boolean;
  semanticClassNames: StylableButtonSemanticClassNames;
}> = props => {
  const { label, icon, override, semanticClassNames } = props;
  return (
    <div className={classes.container}>
      {label && (
        <span
          className={st(
            classes.label,
            formatClassNames(semanticClassNames.buttonLabel),
          )}
          data-testid={TestIds.buttonLabel}
        >
          {label}
        </span>
      )}
      {icon && (
        <span
          className={st(
            classes.icon,
            { override: !!override },
            formatClassNames(semanticClassNames.buttonIcon),
          )}
          aria-hidden="true"
          data-testid={TestIds.buttonIcon}
        >
          {icon}
        </span>
      )}
    </div>
  );
};
export default ButtonContent;
