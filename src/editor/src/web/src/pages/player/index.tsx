import type { FunctionComponent } from "react";
import { useState } from "react";
import { open } from '@tauri-apps/plugin-dialog';
import { readFile } from '@tauri-apps/plugin-fs';
import Link from "next/link";
import { ArrowLeftEndOnRectangleIcon, FolderIcon } from '@heroicons/react/24/solid';

import Player from "@app/components/player";

interface Props { }

const PlayerPage: FunctionComponent<Props> = ({ }) => {
  const [cartridge, setCartridge] = useState<Uint8Array | undefined>(undefined);

  const loadCartridge = async (): Promise<void> => {
    const selected = await open({
      filters: [{
        name: 'PolyZone Cartridge',
        extensions: ['pzcart'],
      }],
    }) as string | null;
    if (selected === null) return;

    const bytes = await readFile(selected);
    setCartridge(bytes);
  };

  return <>
    {/* Header */}
    <header className="flex items-center w-full justify-between py-1 px-2">
      {/* Left */}
      <div className="flex grow basis-0">
        <Link href="/" className="button"><ArrowLeftEndOnRectangleIcon className="icon mr-1" /> Exit</Link>
      </div>
      {/* Middle */}
      <div className="flex grow basis-0 justify-center">
        <button onClick={loadCartridge} className="button"><FolderIcon className="icon mr-1" /> Open</button>
      </div>
      {/* Right */}
      <div className="flex grow basis-0">
      </div>
    </header>

    {cartridge !== undefined && (
      <Player cartridge={cartridge} />
    )}
  </>;
};

export default PlayerPage;
