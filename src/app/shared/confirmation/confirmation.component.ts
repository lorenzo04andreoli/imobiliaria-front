import {
  Component,
  ElementRef,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import { LucideX } from '@lucide/angular';
import { ConfirmationService } from './confirmation.service';

@Component({
  selector: 'app-confirmation',
  imports: [LucideX],
  template: `
    <dialog
      #dialog
      aria-labelledby="confirmation-title"
      aria-describedby="confirmation-message"
      (cancel)="$event.preventDefault(); confirmation.answer(false)"
      (click)="onBackdrop($event)"
    >
      <div class="content">
        <button
          class="close"
          type="button"
          aria-label="Fechar confirmação"
          title="Fechar confirmação"
          (click)="confirmation.answer(false)"
        >
          <svg lucideX aria-hidden="true"></svg>
        </button>
        @if (confirmation.options()?.image; as image) {
          <img class="preview" [src]="image" alt="Foto selecionada" />
        }
        <h2 id="confirmation-title">{{ confirmation.options()?.title }}</h2>
        <p id="confirmation-message">{{ confirmation.options()?.message }}</p>
        <div class="actions">
          <button
            #cancel
            autofocus
            type="button"
            class="secondary"
            (click)="confirmation.answer(false)"
          >
            {{ confirmation.options()?.cancelLabel || 'Agora não' }}
          </button>
          <button
            type="button"
            class="primary"
            (click)="confirmation.answer(true)"
          >
            {{ confirmation.options()?.confirmLabel }}
          </button>
        </div>
      </div>
    </dialog>
  `,
  styles: `
    dialog {
      width: min(440px, calc(100% - 32px));
      max-height: calc(100dvh - 32px);
      margin: auto;
      padding: 0;
      border: 1px solid var(--color-line);
      border-radius: 8px;
      background: #fff;
      color: var(--color-text);
      box-shadow: 0 16px 60px rgb(0 0 0 / 20%);
      overscroll-behavior: contain;
    }
    dialog::backdrop {
      background: rgb(0 0 0 / 38%);
    }
    .content {
      position: relative;
      padding: 56px 24px 24px;
    }
    h2 {
      margin: 0 0 12px;
      font-size: 1.3rem;
      line-height: 1.35;
      overflow-wrap: anywhere;
    }
    p {
      margin: 0;
      color: var(--color-muted);
      font-size: 1rem;
      line-height: 1.6;
      overflow-wrap: anywhere;
    }
    .preview {
      display: block;
      width: 100%;
      height: 148px;
      object-fit: contain;
      border-radius: 6px;
      background: var(--color-panel-soft);
      margin-bottom: 20px;
    }
    .actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 24px;
    }
    button {
      min-height: 48px;
      padding: 12px;
      border-radius: 6px;
      font: inherit;
      font-weight: 600;
      cursor: pointer;
      touch-action: manipulation;
    }
    button:hover {
      transform: none;
    }
    .primary {
      border: 1px solid var(--color-primary);
      background: var(--color-primary);
      color: #fff;
    }
    .secondary {
      border: 1px solid var(--color-line);
      background: #fff;
      color: var(--color-primary-dark);
    }
    .close {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 44px;
      min-height: 44px;
      display: grid;
      place-items: center;
      padding: 10px;
      border: 0;
      background: transparent;
      color: var(--color-muted);
    }
    svg {
      width: 20px;
      height: 20px;
    }
    @media (min-width: 480px) {
      .actions {
        flex-direction: row;
      }
      .actions button {
        flex: 1;
      }
    }
  `,
})
export class ConfirmationComponent {
  readonly confirmation = inject(ConfirmationService);
  private readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');
  private readonly cancel = viewChild<ElementRef<HTMLButtonElement>>('cancel');

  constructor() {
    effect(() => {
      const dialog = this.dialog()?.nativeElement;
      if (!dialog) return;
      if (this.confirmation.options()) {
        if (!dialog.open) dialog.showModal();
        this.cancel()?.nativeElement.focus();
      } else if (dialog.open) {
        dialog.close();
      }
    });
  }

  onBackdrop(event: MouseEvent): void {
    const dialog = this.dialog()?.nativeElement;
    if (event.target !== dialog || !dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    ) {
      this.confirmation.answer(false);
    }
  }
}
