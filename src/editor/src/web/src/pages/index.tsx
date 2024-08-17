import { FunctionComponent, HTMLAttributes, PropsWithChildren } from "react";
import Link from 'next/link';

const IndexPage: FunctionComponent = () => {
  return (
    <div className="p-3 h-full bg-gradient-to-b from-[blue] to-black text-white">
      <h1 className="text-h1 italic mb-3 font-serif text-retro-shadow">Fantasy Console</h1>
      <h2 className="text-h2 italic mb-3 font-serif text-retro-shadow">Tools</h2>
      <div className="grid sm:grid-cols-3 md:grid-cols-4 gap-3 py-3">
        <AppTile href="/composer" label="Composer" description="Create, edit and arrange objects and scenes. Test your game." />
        <AppTile href="/player" label="Player" description="Play game cartridges." />
        <AppTile label="Soon&trade;" />
        <AppTile label="Soon&trade;" />
        <AppTile label="Soon&trade;" />
        <AppTile label="Soon&trade;" />
      </div>
    </div>
  );
}

interface AppTileProps {
  href?: string;
  label: string;
  description?: string;
}
const AppTile: FunctionComponent<AppTileProps> = ({ href, label, description }: AppTileProps) => {
  let Tile: FunctionComponent<PropsWithChildren<HTMLAttributes<never>>>;

  // Display "disabled" state if `href` is not provided
  if (href) {
    // Active button
    Tile = function ActiveAppTile(props) {
      return (
        <Link href={href} {...props} className={(props.className || "") + " hover:bg-blue-200 hover:border-blue-300 focus:bg-blue-200 [border:4px_outset_white]"}>
          {props.children}
        </Link>
      );
    };
  } else {
    // Disabled button
    Tile = function DisabledAppTile(props) {
      return (
        <div {...props} className={(props.className || "") + " !bg-slate-400 cursor-not-allowed [border:4px_outset_gray]"}>
          {props.children}
        </div>
      );
    }
  }

  // Common styles between both buttons
  return (
    <Tile className="flex text-center justify-center items-center p-5 bg-white no-underline
      text-black min-h-32 select-none
      //_Inactive_styles
      [&:not(:active)]:retro-shadow [&:not(:active)]:mb-1 [&:not(:active)]:mr-1
      //_Active_styles
      active:[border-style:inset] active:mt-1 active:ml-1
    ">
      <div className="flex flex-col">
        <div className="font-bold ">{label}</div>
        <p>{description}</p>
      </div>
    </Tile>
  );
};

export default IndexPage;
