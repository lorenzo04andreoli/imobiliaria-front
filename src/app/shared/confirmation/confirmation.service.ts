import { Injectable, signal } from '@angular/core';

export interface ConfirmationOptions {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  image?: string;
}

@Injectable({ providedIn: 'root' })
export class ConfirmationService {
  readonly options = signal<ConfirmationOptions | null>(null);
  private resolve: ((confirmed: boolean) => void) | null = null;

  ask(options: ConfirmationOptions): Promise<boolean> {
    // A second action must not replace the decision already on screen.
    if (this.resolve) return Promise.resolve(false);
    return new Promise((resolve) => {
      this.resolve = resolve;
      this.options.set(options);
    });
  }

  answer(confirmed: boolean): void {
    const resolve = this.resolve;
    this.resolve = null;
    this.options.set(null);
    resolve?.(confirmed);
  }
}
