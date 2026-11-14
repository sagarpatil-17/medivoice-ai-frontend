
import { AfterViewInit, Component, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from '../../../../core/auth/services/auth.service';
import { environment } from '../../../../../environments/environment';

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleIdentityClient {
  initialize(options: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
  }): void;

  renderButton(
    element: HTMLElement,
    options: {
      theme: string;
      size: string;
      width: number;
      text: string;
      shape: string;
    },
  ): void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: GoogleIdentityClient;
      };
    };
  }
}

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
})
export class Login implements AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  @ViewChild('googleButton')
  googleButton!: ElementRef<HTMLDivElement>;

  readonly googleLoading = signal(false);

  readonly loading = signal(false);
  readonly showPassword = signal(false);
  readonly errorMessage = signal('');

  readonly currentYear = new Date().getFullYear();

  readonly loginForm = this.fb.nonNullable.group({
    email: [
      '',
      [
        Validators.required,
        Validators.email,
        Validators.maxLength(254),
      ],
    ],
    password: [
      '',
      [
        Validators.required,
        Validators.maxLength(72),
      ],
    ],
  });

  get email() {
    return this.loginForm.controls.email;
  }

  get password() {
    return this.loginForm.controls.password;
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(value => !value);
  }

  submit(): void {
    this.errorMessage.set('');

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    if (this.loading()) return;

    this.loading.set(true);

    this.authService.login(this.loginForm.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        void this.router.navigateByUrl('/');
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);

        if (error.status === 401) {
          this.errorMessage.set('Invalid email or password.');
        } else if (error.status === 0) {
          this.errorMessage.set(
            'Unable to connect to the server. Please try again.',
          );
        } else {
          this.errorMessage.set(
            error.error?.message ?? 'Something went wrong. Please try again.',
          );
        }
      },
    });
  }

  ngAfterViewInit(): void {
    const script = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]',
    );

    if (window.google?.accounts?.id) {
      this.renderGoogleButton();
      return;
    }

    script?.addEventListener(
      'load',
      () => this.renderGoogleButton(),
      { once: true },
    );

    script?.addEventListener(
      'error',
      () => this.errorMessage.set(
        'Unable to load Google Sign-In. Please try again.',
      ),
      { once: true },
    );
  }

  private renderGoogleButton(): void {
    const google = window.google?.accounts.id;

    if (!google || !this.googleButton) {
      this.errorMessage.set('Google Sign-In is unavailable.');
      return;
    }

    google.initialize({
      client_id: environment.googleClientId,
      callback: (response) => {
        this.handleGoogleLogin(response.credential);
      },
    });

    google.renderButton(this.googleButton.nativeElement, {
      theme: 'outline',
      size: 'large',
      width: 360,
      text: 'continue_with',
      shape: 'rectangular',
    });
  }

  private handleGoogleLogin(credential: string): void {
    if (this.loading() || this.googleLoading()) return;

    this.errorMessage.set('');
    this.googleLoading.set(true);

    this.authService.googleLogin(credential).subscribe({
      next: () => {
        this.googleLoading.set(false);
        void this.router.navigateByUrl('/');
      },
      error: (error: HttpErrorResponse) => {
        this.googleLoading.set(false);

        if (error.status === 401 || error.status === 403) {
          this.errorMessage.set(
            error.error?.message ??
            'Your Google account is not authorized for MediVoice AI.',
          );
        } else if (error.status === 0) {
          this.errorMessage.set(
            'Unable to connect to the server. Please try again.',
          );
        } else {
          this.errorMessage.set(
            error.error?.message ?? 'Google login failed. Please try again.',
          );
        }
      },
    });
  }

}
