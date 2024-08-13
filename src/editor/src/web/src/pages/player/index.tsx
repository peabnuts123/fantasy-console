import Player from "@app/components/player";
import Condition from "@app/components/util/condition";
import { FunctionComponent, useState } from "react";
import { open } from '@tauri-apps/api/dialog';
import { readBinaryFile } from '@tauri-apps/api/fs';
import Link from "next/link";



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
    <Link href="/">&lt; Back</Link>
    <button onClick={loadCartridge}>Open...</button>
    <Condition if={cartridge !== undefined}
      then={() => <Player cartridge={cartridge!} />}
     />
  </>
};

export default PlayerPage;
