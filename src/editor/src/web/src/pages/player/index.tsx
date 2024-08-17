import Player from "@app/components/player";
import Condition from "@app/components/util/condition";
import { FunctionComponent, useState } from "react";
import { open } from '@tauri-apps/api/dialog';
import { readBinaryFile } from '@tauri-apps/api/fs';
import Link from "next/link";
import { ArrowLeftEndOnRectangleIcon, FolderIcon } from '@heroicons/react/24/solid'

interface Props { }

const PlayerPage: FunctionComponent<Props> = ({ }) => {
  const [cartridge, setCartridge] = useState<Uint8Array | undefined>(undefined);

  const loadCartridge = async () => {
    const selected = await open({
      filters: [{
        name: 'PolyZone Cartridge',
        extensions: ['pzcart']
      }]
    }) as string | null;
    if (selected === null) return;

    const bytes = await readBinaryFile(selected);
    setCartridge(bytes);
  };

  return <>
    {/* Header */}
    <header className="flex items-center w-full justify-between py-1 px-2">
      {/* Left */}
      <div className="flex grow basis-0">
        <Link href="/" className="button"><ArrowLeftEndOnRectangleIcon /> Exit</Link>
      </div>
      {/* Middle */}
      <div className="flex grow basis-0 justify-center">
        <button onClick={loadCartridge} className="button"><FolderIcon /> Open</button>
      </div>
      {/* Right */}
      <div className="flex grow basis-0">
      </div>
    </header>
    <Condition if={cartridge !== undefined}
      then={() => <Player cartridge={cartridge!} />}
    />
  </>
};

export default PlayerPage;
