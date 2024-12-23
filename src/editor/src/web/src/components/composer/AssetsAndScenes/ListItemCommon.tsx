import { ComponentType, createElement, ElementType, FunctionComponent, HTMLAttributes, LegacyRef, PropsWithChildren, ReactNode } from "react";
import { observer } from "mobx-react-lite";
import cn from 'classnames';


export interface ListItemCommonProps {
  label?: string;
  innerContent?: ReactNode;
  classNames?: string;
  onClick?: () => void;
  Icon?: ComponentType<React.HTMLAttributes<Element>>;
  innerRef?: LegacyRef<any>;
}

export const ListItemCommon: FunctionComponent<ListItemCommonProps> = observer(({ onClick, Icon, label, innerContent, classNames, innerRef }) => {
  // Prop defaults
  innerRef ??= () => { };
  classNames ??= "";

  // Computed state
  const isClickable = onClick !== undefined;

  return (
    /* Switch between div and button based on whether the element is clickable */
    createElement(isClickable ? 'button' : 'div', {
      className: cn("w-full my-2 flex flex-row items-center p-2 border select-none bg-white hover:bg-blue-100 group/listitem", classNames),
      tabIndex: 0,
      onClick,
      ref: innerRef,
    }, (
      <>
        {Icon !== undefined && (
          <Icon className="icon mr-2 shrink-0" />
        )}
        {label || innerContent}
      </>
    ))
  )
});
