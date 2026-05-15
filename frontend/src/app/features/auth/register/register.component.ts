import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@core/services/toast.service';
import { GeoSearchService } from '@features/geo/services/geo-search.service';
import { regions } from '@features/geo/constants/regions.constant';
import { debounceTime, distinctUntilChanged, of, switchMap, tap } from 'rxjs';
import { formatUkrainianPhoneNumber } from '@core/utils/phone.util';
import { PhoneMaskDirective } from '@core/directives/phone-mask.directive';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, PhoneMaskDirective],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit  {
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private geoService = inject(GeoSearchService)

  public regions = regions;
  public citySuggestions: string[] = [];
  public isSearchingCity = false;

  registerForm = new FormGroup({
    userType: new FormControl('individual', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    name: new FormControl('', [Validators.required, Validators.minLength(2)]),
    phone: new FormControl('', [Validators.required, Validators.pattern(/^\+380 \d{2} \d{3} \d{2} \d{2}$/)]),
    region: new FormControl('', [Validators.required]),
    city: new FormControl('', [Validators.required]),
  });

  isLoading = false;

  ngOnInit() {
    this.setupCityAutocomplete();

    this.registerForm.get('region')?.valueChanges.subscribe(() => {
      this.registerForm.get('city')?.setValue('', { emitEvent: false });
      this.citySuggestions = [];
    });
  }

    private setupCityAutocomplete() {
      this.registerForm.get('city')?.valueChanges.pipe(
        debounceTime(400),
        distinctUntilChanged(),
        tap(value => {
          if (value && value.length >= 2) this.isSearchingCity = true;
        }),
        switchMap(value => {
          if (!value || value.length < 2) {
            this.isSearchingCity = false;
            return of([]);
          }

          // Отримуємо назву вибраної області
          const selectedRegion = this.registerForm.get('region')?.value;
          
          // Формуємо запит: "Київ, Київська область" або просто "Київ"
          const fullQuery = selectedRegion ? `${value}, ${selectedRegion} область` : value;
          
          return this.geoService.searchCityLabels(fullQuery);
        })
      ).subscribe(suggestions => {
        this.citySuggestions = suggestions;
        this.isSearchingCity = false;
      });
    }

    public selectCity(city: string) {
      this.registerForm.patchValue({ city: city });
      this.citySuggestions = []; // Ховаємо дропдаун після вибору
    }

      // Ховаємо дропдаун, якщо користувач клікнув десь інде.
      // setTimeout потрібен, щоб клік по місту встиг спрацювати ДО того, як дропдаун зникне
      public hideCitySuggestions() {
        setTimeout(() => this.citySuggestions = [], 200);
      }

      formatPhone(event: Event): void {
      const input = event.target as HTMLInputElement;
      
      // Викликаємо нашу чисту функцію
      const formatted = formatUkrainianPhoneNumber(input.value);

      this.registerForm.patchValue(
        { phone: formatted },
        { emitEvent: false }
      );
    }

    onRegister() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.toastService.warning('Увага', "Заповніть всі обов'язкові поля");
      return;
    }

    this.isLoading = true;

    this.authService.register(this.registerForm.value).subscribe({
      next: (data) => {

        console.log('=== REGISTER NEXT ===', data);
        console.log('role:', data?.user?.role);
        this.toastService.success('Успіх!', 'Реєстрація пройшла успішно!');
        
        const role = (data?.user?.role ?? '');
        
        const routes: Record<string, string> = {
          volunteer:    '/map',
          organization: '/organization/setup',
          admin:        '/admin',
        };

        console.log(routes[role]);

        this.router.navigate([routes[role] ?? '/']);
      },
      error: (err) => {
        this.isLoading = false;
        const msg = err.graphQLErrors?.[0]?.message ?? err.message ?? '';
        if (msg.includes('вже існує') || msg.includes('already exists')) {
          this.toastService.error('Помилка', 'Користувач з таким Email вже існує');
        } else {
          this.toastService.error('Помилка', 'Перевірте дані та спробуйте ще раз');
        }
      }
    });
  } 



  

  isInvalid(controlName: string): boolean {
    const control = this.registerForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  // Новий метод для генерації тексту помилки
  getErrorMessage(controlName: string): string {
    const control = this.registerForm.get(controlName);
    if (!control || !control.errors) return '';

    if (control.errors['required']) return "Обов'язкове поле";
    if (control.errors['minlength']) return `Мінімум ${control.errors['minlength'].requiredLength} символів`;
    if (control.errors['email']) return "Введіть коректний email";
    
    return "Помилка валідації";
  }

  get currentUserType() {
    return this.registerForm.get('userType')?.value;
  }

  get dynamicInputClasses() {
    return {
      // Класи для Волонтера (світла тема)
      'bg-slate-50 border-slate-100 text-slate-900 focus:bg-white focus:border-slate-950': 
        this.currentUserType === 'individual',
        
      // Класи для Організації (темна тема)
      'bg-slate-800/50 text-white border-white/10 focus:bg-slate-800 focus:border-white/30': 
        this.currentUserType === 'organization'
    };
  }
}