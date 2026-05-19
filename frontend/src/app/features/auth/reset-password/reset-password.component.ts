import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '@core/services/toast.service';
import { Apollo, gql } from 'apollo-angular';

const RESET_PASSWORD_MUTATION = gql`
  mutation ResetPassword($token: String!, $newPassword: String!) {
    resetPassword(token: $token, newPassword: $newPassword)
  }
`;

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reset-password.component.html'
})
export class ResetPasswordComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apollo = inject(Apollo);
  private toastService = inject(ToastService);

  token = '';
  isLoading = false;

  resetForm = new FormGroup({
    password: new FormControl('', [Validators.required, Validators.minLength(6)])
  });

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) {
      this.toastService.show('Помилка', 'Посилання недійсне', 'error');
      this.router.navigate(['/login']);
    }
  }

  onSubmit() {
    if (this.resetForm.invalid || !this.token) return;
    this.isLoading = true;

    this.apollo.mutate({
      mutation: RESET_PASSWORD_MUTATION,
      variables: {
        token: this.token,
        newPassword: this.resetForm.value.password
      }
    }).subscribe({
      next: () => {
        this.toastService.show('Успіх', 'Пароль успішно змінено!', 'success');
        this.router.navigate(['/login']);
      },
      error: () => {
        this.isLoading = false;
        this.toastService.show('Помилка', 'Термін дії посилання вичерпано', 'error');
      }
    });
  }
}