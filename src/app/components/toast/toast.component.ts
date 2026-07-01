import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (n of notifications(); track n.id) {
        <div class="toast toast-{{ n.type }}" (click)="dismiss(n.id)">
          <span class="toast-icon">{{ icon(n.type) }}</span>
          <span class="toast-message">{{ n.message }}</span>
          <button class="toast-close" (click)="dismiss(n.id); $event.stopPropagation()">&times;</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 400px;
    }

    .toast {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 18px;
      border-radius: 10px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      cursor: pointer;
      animation: slideIn 0.3s ease-out;
      color: white;
      font-size: 14px;
      font-family: Arial, sans-serif;
    }

    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    .toast-success { background: linear-gradient(135deg, #22c55e, #16a34a); }
    .toast-error { background: linear-gradient(135deg, #ef4444, #dc2626); }
    .toast-info { background: linear-gradient(135deg, #3b82f6, #2563eb); }
    .toast-warning { background: linear-gradient(135deg, #eab308, #ca8a04); }

    .toast-icon { font-size: 18px; flex-shrink: 0; }
    .toast-message { flex: 1; line-height: 1.4; }
    .toast-close {
      background: none;
      border: none;
      color: white;
      font-size: 20px;
      cursor: pointer;
      padding: 0;
      line-height: 1;
      opacity: 0.8;
    }
    .toast-close:hover { opacity: 1; }
  `]
})
export class ToastComponent {
  private notificationService = inject(NotificationService);
  notifications = this.notificationService.notifications;

  dismiss(id: number) {
    this.notificationService.dismiss(id);
  }

  icon(type: string): string {
    const icons: Record<string, string> = {
      success: '\u2713',
      error: '\u2717',
      info: '\u2139',
      warning: '\u26A0'
    };
    return icons[type] ?? '';
  }
}
