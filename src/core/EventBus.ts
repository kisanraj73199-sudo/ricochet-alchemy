type Listener = (...args: any[]) => void;

export class EventBus {
  private static listeners: Record<string, Listener[]> = {};

  public static on(event: string, fn: Listener): void {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }

  public static emit(event: string, ...args: any[]): void {
    (this.listeners[event] || []).forEach((fn) => fn(...args));
  }
}
