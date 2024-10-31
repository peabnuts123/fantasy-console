import type { Window } from '@tauri-apps/api/window';
import type { ItemKind } from '@tauri-apps/api/menu/base';
import { type MenuItemOptions } from '@tauri-apps/api/menu';
import type { Channel } from '@tauri-apps/api/core';

import { throwUnhandled } from "../util";

export class TauriPluginMenuMockModule {
  public static handle(action: string, args: any) {
    switch (action) {
      case 'new':
        return this.new(args);
      case 'popup':
        return this.popup(args);
      default:
        throw throwUnhandled(`[TauriPluginMenuMockModule] (handle) Unimplemented action. (action='${action}') args: `, args);
    }
  }

  public static new({ kind, options, handler }: { kind: ItemKind, options: MenuItemOptions, handler: Channel }) {
    const rid = ~~(Math.random() * 1000);
    const id = `${kind}_${rid}`;
    return Promise.resolve([rid, id]);
  }

  public static popup({ }: { rid: number, kind: ItemKind, window: Window | null, at: {} | null }) {
    // @NOTE None of this is implemented at this time, it just no-ops
    return Promise.resolve();
  }
}