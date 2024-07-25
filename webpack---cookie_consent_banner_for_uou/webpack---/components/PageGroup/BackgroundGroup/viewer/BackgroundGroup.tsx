import type { ReactNode } from 'react';
import React from 'react';
import { getDataAttributes } from '@wix/editor-elements-common-utils';
import type { IBackgroundGroupProps } from '../BackgroundGroup.types';
import GroupContent from '../../commons/viewer/GroupContent';
import { TRANSITION_GROUP_ID } from '../../commons/constants';

const GroupContentMemo = React.memo(GroupContent, (__, nextProps) => {
  return (
    !(nextProps.children()! as Array<ReactNode>).length ||
    nextProps.transitionEnabled === false
  );
});

const BackgroundGroup: React.FC<IBackgroundGroupProps> = props => {
  const { id, children, className, ...restProps } = props;
  return (
    <div id={id} className={className} {...getDataAttributes(props)}>
      <GroupContentMemo id={`${id}_${TRANSITION_GROUP_ID}`} {...restProps}>
        {children}
      </GroupContentMemo>
    </div>
  );
};

export default BackgroundGroup;
