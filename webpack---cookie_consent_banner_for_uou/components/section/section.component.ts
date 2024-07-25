import { BaseComponent, BaseComponentProps } from '../../types';
import { Section, Text, Toggle } from '../elements';
import { DataHook } from '../../constants/data-hooks';
import css from './section.scss';
import { generateId } from '../../utils/id-generator';

export interface Props extends BaseComponentProps {
  title: string;
  description: string;
  toggleEnabled: boolean;
  policyKeys: string[];
  toggleTooltip?: string;
  toggleChecked: boolean;
  onToggleChanged(policyKeys: string[]): void;
}

export class SectionComponent extends BaseComponent<Props, any> {
  onCheckedChanged = () => {
    const { policyKeys, onToggleChanged } = this.props;
    onToggleChanged(policyKeys);
  };
  render(): { element: HTMLElement } {
    const { toggleChecked, toggleEnabled, title, description, toggleTooltip } =
      this.props;
    const root = Section({
      className: css.section,
      dataHook: DataHook.sectionComponentRoot,
    });

    const titleId = generateId();
    const descriptionId = generateId();

    root.appendChild(
      Text({
        id: titleId,
        dataHook: DataHook.sectionComponentTitle,
        className: css.section_title,
        text: title,
        subtitle: true,
      }),
    );
    root.appendChild(
      Text({
        id: descriptionId,
        dataHook: DataHook.sectionComponentDescription,
        className: css.section_text,
        text: description,
      }),
    );
    root.appendChild(
      Toggle({
        className: css.toggle,
        tooltip: toggleTooltip,
        dataHook: DataHook.sectionComponentToggle,
        checked: toggleChecked,
        enabled: toggleEnabled,
        onCheckedChanged: this.onCheckedChanged,
        ariaDescribedBy: descriptionId,
        ariaLabelledBy: titleId,
      }),
    );

    return { element: root };
  }
}
