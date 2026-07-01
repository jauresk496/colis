import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { NotificationService } from '../../services';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  username = signal('admin');
  password = signal('');
  error = signal<string | null>(null);
  loading = signal(false);

  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private notifications = inject(NotificationService);

  submit() {
    this.error.set(null);
    this.loading.set(true);

    this.auth.login(this.username().trim(), this.password()).subscribe({
      next: () => {
        this.notifications.success('Connexion réussie');
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/admin';
        this.router.navigateByUrl(returnUrl);
      },
      error: () => {
        this.error.set('Identifiants invalides');
        this.notifications.error('Identifiants invalides');
        this.loading.set(false);
      }
    });
  }
}
