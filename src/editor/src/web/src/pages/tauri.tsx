import { FunctionComponent } from "react";
import { open } from '@tauri-apps/api/dialog';
import { readTextFile, BaseDirectory } from '@tauri-apps/api/fs';
import * as path from '@tauri-apps/api/path';
import * as Jsonc from 'jsonc-parser';

import { TauriFileSystem } from "@lib/filesystem/TauriFileSystem";


interface Props { }

const Tauri: FunctionComponent<Props> = ({ }) => {
  const onClickOpen = async () => {
    const selected = await open({
      filters: [{
        name: 'Image',
        extensions: ['png', 'jpeg', 'pzproj']
      }]
    }) as string | null;
    if (selected === null) return;

    // Read the text file in the `$APPCONFIG/app.conf` path
    const projectJson = await readTextFile(selected);
    const projectDefinition = Jsonc.parse(projectJson);

    console.log(`projectDefinition: `, projectDefinition);

    const fileSystem = new TauriFileSystem(await path.resolve(selected, '..'));
    console.log(`fileSystem`, fileSystem);

    console.log(`models/burgerCheese.obj: `, fileSystem.getUrlForPath(`models/burgerCheese.obj`));
    console.log(`foo/bar.jpeg: `, fileSystem.getUrlForPath(`foo/bar.jpeg`));

    const mtlFile = await fileSystem.readFile(`models/burgerCheese.mtl`);
    console.log(`mtlFile: `, mtlFile.textContent);
  }

  return (
    <>
      <h1>I am the tauri component</h1>
      <button onClick={onClickOpen}>Open File</button>
    </>
  );
};

export default Tauri;
