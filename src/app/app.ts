import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/services/auth.service';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  templateUrl: './app.html',
})
export class App {
  readonly authService = inject(AuthService);

  constructor() {
    // Start restoration without blocking application rendering
    this.authService.restoreSession().subscribe();
  }
}
