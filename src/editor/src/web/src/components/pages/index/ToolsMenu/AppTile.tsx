import { type FunctionComponent, type HTMLAttributes, type PropsWithChildren } from "react";
import Link from 'next/link';
import cn from 'classnames';

export interface AppTileProps {
  href?: string;
  label: string;
  description?: string;
}
export const AppTile: FunctionComponent<AppTileProps> = ({ href, label, description }: AppTileProps) => {
  let Tile: FunctionComponent<PropsWithChildren<HTMLAttributes<never>>>;

  // Display "disabled" state if `href` is not provided
  if (href) {
    // Active button
    Tile = function ActiveAppTile(props) {
      return (
        <Link href={href} {...props} className={cn(props.className, "hover:bg-blue-200 hover:border-blue-300 focus:bg-blue-200 [border:4px_outset_white]")}>
          {props.children}
        </Link>
      );
    };
  } else {
    // Disabled button
    Tile = function DisabledAppTile(props) {
      return (
        <div {...props} className={cn(props.className, "!bg-slate-400 cursor-not-allowed [border:4px_outset_gray]")}>
          {props.children}
        </div>
      );
    }
  }

  // Common styles between both buttons
  return (
    <Tile className={cn(`flex text-center justify-center items-center p-5 bg-white no-underline
      text-black min-h-32 select-none sm:max-w-[200px]`,
      // Inactive styles
      `[&:not(:active)]:retro-shadow [&:not(:active)]:mb-1 [&:not(:active)]:mr-1`,
      // Active styles
      `active:[border-style:inset] active:mt-1 active:ml-1`
    )}>
      <div className="flex flex-col">
        <div className="font-bold ">{label}</div>
        <p>{description}</p>
      </div>
    </Tile>
  );
};
