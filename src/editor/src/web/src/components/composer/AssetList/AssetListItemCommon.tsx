import { ComponentType, FunctionComponent, LegacyRef } from "react";
import { AssetDbVirtualNodeBase } from "@fantasy-console/runtime/src/cartridge";
import { observer } from "mobx-react-lite";
import cn from 'classnames';

export interface AssetListItemCommonProps {
  asset: AssetDbVirtualNodeBase;
  classNames: string;
  onClick?: () => void;
  Icon: ComponentType<React.HTMLAttributes<Element>>;
  innerRef?: LegacyRef<any>;
}

export const AssetListItemCommon: FunctionComponent<AssetListItemCommonProps> = observer(({ onClick, Icon, asset, classNames, innerRef }) => {
  // Prop defaults
  onClick ??= () => { };
  innerRef ??= () => { };

  return (
    /* @TODO switch element between div and button when clickable */
    <div
      role="button"
      tabIndex={0}
      className={cn("my-2 flex flex-row items-center p-2 border select-none bg-white hover:bg-blue-100", classNames)}
      onClick={onClick}
      ref={innerRef}
    >
      <Icon className="icon" />
      <span className="ml-2">{asset.name}</span>
    </div>
  )
});
