import { EventName } from "@tauri-apps/api/event";

import { throwUnhandled } from "../util";
import { MockEventSystem } from '../MockEventSystem';

export class TauriPluginEventMockModule {
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  public static handle(action: string, args: any) {
    switch (action) {
      case 'listen':
        return this.listen(args);
      case 'unlisten':
        return this.unlisten(args);
      case 'emit':
        return this.emit(args);
      default:
        throw throwUnhandled(`[TauriPluginEventMockModule] (handle) Unimplemented action. (action='${action}') args: `, args);
    }
  }

  public static listen(args: { event: EventName, handler: number }): number {
    const { event, handler: handlerId } = args;
    console.log(`[TauriPluginEventMockModule] (listen) (event='${event}') (handlerId='${handlerId}')`);
    MockEventSystem.on(event, handlerId);
    return handlerId;
  }

  public static unlisten(args: { event: EventName, eventId: number }): void {
    const { event, eventId } = args;
    console.log(`[TauriPluginEventMockModule] (unlisten) (event='${event}') (eventId='${eventId}')`);
    MockEventSystem.off(event, eventId);
  }

  public static emit(args: { event: EventName, payload: any }): void {
    const { event, payload } = args;
    console.log(`[TauriPluginEventMockModule] (emit) (event='${event}') Payload: `, payload);
    MockEventSystem.emit(event, payload);
  }
}
