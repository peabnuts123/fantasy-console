import { EventCallback, EventName } from "@tauri-apps/api/event";

interface MockEventSystemMessage {
  event: string;
  payload: any;
  windowLabel: string;
}
type StoredHandler = (args: MockEventSystemMessage) => void;

export class MockEventSystem {
  // State
  private static channel: BroadcastChannel = (() => {
    const channel = new BroadcastChannel('tauri_mock_events');
    channel.addEventListener('message', this.onMessage.bind(this));
    return channel;
  })();

  private static subscriptions: Record<string, number[]> = {};

  public static on<T>(event: EventName, handlerId: number) {
    if (this.subscriptions[event] === undefined) {
      this.subscriptions[event] = [];
    }
    this.subscriptions[event].push(handlerId);
  }

  public static off<T>(event: EventName, handlerId: number) {
    if (this.subscriptions[event] === undefined) {
      return;
    }
    const index = this.subscriptions[event].indexOf(handlerId);
    if (index >= 0) {
      this.subscriptions[event].splice(index, 1);
    }
  }

  public static emit(event: string, payload: any) {
    this.channel.postMessage(JSON.stringify({
      event,
      payload,
      windowLabel: MockEventSystem.windowLabel,
    } satisfies MockEventSystemMessage));
  }

  private static resolveHandlerId(handlerId: number): StoredHandler {
    // @NOTE Resolve handler ID => handler from window prop
    // @TODO Is there a proper way to actually fetch this?
    const handler = (window as any)[`_${handlerId}`] as EventCallback<any>;
    if (handler === undefined) return () => { };

    return (data) => {
      handler({
        ...data,
        id: handlerId,
      })
    }
  }

  private static onMessage(e: MessageEvent) {
    const { event, payload, windowLabel } = JSON.parse(e.data) as MockEventSystemMessage;

    if (this.subscriptions[event] === undefined) {
      return;
    }

    this.subscriptions[event]
      .map((handlerId) => this.resolveHandlerId(handlerId))
      .forEach((handler) => handler({
        event,
        payload,
        windowLabel,
      }));
  }

  public static get windowLabel(): string {
    // @NOTE @ASSUMPTION: Only `main` will have empty window.name
    return window.name || 'main';
  }
}
