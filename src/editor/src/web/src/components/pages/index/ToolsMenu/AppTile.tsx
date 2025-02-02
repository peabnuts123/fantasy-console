import { type FunctionComponent, type HTMLAttributes, type PropsWithChildren, createElement, JSX } from "react";
import Link from 'next/link';
import cn from 'classnames';

export interface AppTileProps {
  /* === Mutually exclusive === */
  content?: JSX.Element;
  /* |||||||||||||||||||||||||| */
  label?: string;
  description?: string;
  /* ========================== */

  /* === Mutually exclusive === */
  href?: string;
  /* |||||||||||||||||||||||||| */
  onClick?: () => void;
  /* ========================== */

  className?: string;
}
export const AppTile: FunctionComponent<AppTileProps> = ({ content, label, description, href, onClick, className }: AppTileProps) => {
  const isDisabled = !href && !onClick;

  // Display "disabled" state if `href` is not provided
  let Tile: FunctionComponent<PropsWithChildren<HTMLAttributes<never>>>;
  if (!isDisabled) {
    // Active button
    Tile = function ActiveAppTile(props) {
      const className = cn(props.className, "bg-white border-white hover:bg-blue-200 hover:border-blue-300 focus:bg-blue-200 focus:border-blue-300");
      if (href) {
        return createElement(Link, {
          ...props,
          href,
          className,
        }, props.children);
      } else {
        return createElement("button", {
          ...props,
          onClick,
          className,
        }, props.children);
      }
    };
  } else {
    // Disabled button
    Tile = function DisabledAppTile(props) {
      return (
        <div {...props} className={cn(props.className, "bg-slate-400 border-slate-500 cursor-not-allowed")}>
          {props.children}
        </div>
      );
    }
  }

  // Common styles between both buttons
  return (
    <Tile className={cn(`flex text-center justify-center items-center p-5 no-underline
      text-black min-h-32 select-none sm:max-w-[200px] border-4 [border-style:outset]`,
      // Inactive styles
      `[&:not(:active)]:retro-shadow [&:not(:active)]:mb-1 [&:not(:active)]:mr-1`,
      // Active styles
      `active:[border-style:inset] active:mt-1 active:ml-1`,
      className
    )}>
      <div className="flex flex-col">
        {content ? (
          content
        ) : (
          <>
            <div className="font-bold">{label}</div>
            <p>{description}</p>
          </>
        )}
      </div>
    </Tile>
  );
};
