import { FunctionComponent, useEffect, useState } from "react";
import { once as listenOnce, emit } from '@tauri-apps/api/event';
import type { WebviewWindow } from '@tauri-apps/api/window';

interface Props { }

// @TODO @DEBUG REMOVE
// console.log(`(Subscribing to 'init')`);
listenOnce('init', (e) => {
  console.log(`[Placeholder] (init) Got payload: `, e);
});

const Placeholder: FunctionComponent<Props> = ({ }) => {
  const [currentWindow, setCurrentWindow] = useState<WebviewWindow | undefined>(undefined);
  // const currentWindow = getCurrent();

  useEffect(() => {
    // @TODO Bloody hell next.js!!!
    if (typeof window !== 'undefined')
      void (async () => {
        const { getCurrent } = await import('@tauri-apps/api/window');
        setCurrentWindow(getCurrent());
      })();
  }, []);

  const onClickCreate = async () => {
    console.log(`Create`);
    await emit('result', {
      success: true,
      message: "Created YEAH",
    });

    await currentWindow?.close();
  };

  const onClickCancel = () => {
    console.log(`Cancel`);
    void currentWindow!.close()
      .then(() => {
        console.log(`Closing window...`);
      })
      .catch((e) => {
        console.error(`Failed to close window! `, e);
      });
  };

  return (
    <div className="h-full flex flex-col justify-between">
      <h1>I am the placeholder modal 👍</h1>
      <div className="flex flex-row justify-end">
        <button className="button" onClick={onClickCreate}>Create</button>
        <button className="button" onClick={onClickCancel}>Cancel</button>
      </div>
    </div>
  );
};

export default Placeholder;
