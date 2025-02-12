import { useState } from "react";
import { useRouter } from "next/router";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { emit } from '@tauri-apps/api/event';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';

/* Constants */
const LocalStoragePrefix = `__polyzone__modal-data`;
const ModalEventPrefix = `__polyzone_modal`;

/**
 * Construct the key to be used for reading/writing to local storage
 * for a given dataId. Abstracted to a function for consistency.
 */
function localStorageKey(dataId: string): string {
  return `${LocalStoragePrefix}__${dataId}`;
}

enum ModalEvent {
  Result = 'result',
}
/**
 * Construct an event name to emit / listen to for a given well-known ModalEvent.
 * Abstracted to a function for consistency.
 */
function eventName(eventId: ModalEvent): string {
  return `${ModalEventPrefix}-${eventId}`;
}

export interface CreateModalOptions {
  /** Title of the modal window */
  title?: string;
  /** Whether the modal window should be in the center of the screen */
  center?: boolean;
  /** Callback fired after the modal window is successfully created */
  onCreated?: () => void;
}

/**
 * Open a page in a modal window, sending data to it after it opens. Modal window will NOT have access to the same state as the
 * main window, only the data that is sent to it. Modal views should be built in a way as to not reference the currently
 * loaded project, etc. You should send the modal exactly all of the data it needs.
 * @param modalUri The (relative) path of the modal to show. Should be a URL to a page that is expecting to be displayed as a modal. e.g. `/modal/asset-reference`
 * @param data Data to send to the modal window. This **must** be JSON serializable, **do not** send class instances as data as they will be deserialized to plain objects.
 * @param options Modal creation options.
 * @returns A promise that resolves when the modal window is closed. The promise will resolve to any data that is sent back from the modal instance.
 */
export function showModal<TData, TResult>(modalUri: string, data: TData, options: CreateModalOptions = {}): Promise<TResult> {
  // Random-enough ID in localStorage
  const modalDataId = new Date().valueOf().toString(16) + Number((Math.random() * 1e8).toFixed(0)).toString(16);
  // Serialize & store data in to local storage
  localStorage.setItem(localStorageKey(modalDataId), JSON.stringify(data));

  // Safely construct URL for modal, include `dataId` for modal data
  const webviewUrl = new URL('http://foo.bar' + modalUri);
  webviewUrl.searchParams.set(`dataId`, modalDataId);

  const webview = new WebviewWindow('assetModal', {
    url: webviewUrl.pathname + webviewUrl.search,
    center: options.center ?? true,
    // hiddenTitle: true,
    skipTaskbar: true,
    title: options.title ?? "",
  });

  return new Promise<TResult>((resolve, reject) => {
    webview.once(eventName(ModalEvent.Result), (e) => {
      resolve(e.payload as TResult);
    });

    webview.once('tauri://created', function () {
      if (options.onCreated !== undefined) {
        options.onCreated();
      }
    });
    webview.once('tauri://error', function (e) {
      reject(e);
    });
  });
}

/**
 * Hook for setting up the data and controls of a modal window. Reads and exposes data sent from the main window that
 * spawned the modal. Also exposes controls for the modal window itself.
 * @param initialData Default data to store in the state, before it gets read from the main window.
 * @returns Modal instance containing functions for controlling the modal window.
 */
export function useModal<TExpected>(initialData: TExpected): ModalInstance<TExpected> {
  const [modalData, setModalData] = useState<TExpected>(initialData);

  const Router = useRouter();
  const modalDataId = Router.query['dataId'];

  if (modalDataId !== undefined && !Array.isArray(modalDataId)) {
    const storageId = localStorageKey(modalDataId);
    const modalDataJson = localStorage.getItem(storageId);
    if (modalDataJson !== null) {
      localStorage.removeItem(storageId);

      const modalData = JSON.parse(modalDataJson) as TExpected;
      setModalData(modalData);
    }
  }

  const modal = new ModalInstance(modalData);
  return modal;
}

export class ModalInstance<TData> {
  /** Data sent from the main window */
  public data: TData;
  /** Current window instance - reference to Tauri window object */
  private currentWindow: WebviewWindow;

  public constructor(data: TData) {
    this.data = data;
    this.currentWindow = getCurrentWebviewWindow();
  }

  public async close<TResult>(result: TResult): Promise<void> {
    // Send result payload
    await emit(eventName(ModalEvent.Result), result);
    // Close modal
    await this.currentWindow.close();
  }
}
