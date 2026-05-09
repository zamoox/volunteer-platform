import { Component, Input, Output, EventEmitter, inject, OnChanges, SimpleChanges, OnInit, ChangeDetectorRef, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Subject, Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil, catchError, map } from 'rxjs/operators';
import { VolunteerRequestService } from '../../../core/services/volunter-request.service';
import { GeoService, NominatimSearchResult } from '../../../features/geo/services/geo.service';

export type RequestCategory = 'MEDICINE' | 'FOOD' | 'TRANSPORT' | 'SHELTER' | 'OTHER';

@Component({
  selector: 'app-request-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './request-form.component.html',
  styleUrl: './request-form.component.css'
})
export class RequestFormComponent implements OnInit, OnChanges, OnDestroy {
  private requestService = inject(VolunteerRequestService);
  private geoService = inject(GeoService); // Додано
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  suggestions: NominatimSearchResult[] = [];
  citySuggestions: string[] = [];
  isCitySearching = false;
  isSearching = false;
  isSubmitting = false;
  cityInputFocused = false;
  addressInputFocused = false;

  readonly popularCities = ['Київ', 'Харків', 'Одеса', 'Дніпро', 'Запоріжжя', 'Львів', 'Вінниця', 'Полтава', 'Чернігів', 'Черкаси'];

  readonly categories = [
    { value: 'MEDICINE', label: 'Медицина',  icon: '💊' },
    { value: 'FOOD',     label: 'Продукти',  icon: '🥫' },
    { value: 'TRANSPORT',label: 'Транспорт', icon: '🚗' },
    { value: 'SHELTER',  label: 'Притулок',  icon: '🏠' },
    { value: 'OTHER',    label: 'Інше',      icon: '📋' },
  ];

  @Input() lat!: number;
  @Input() lng!: number;
  @Input() address: string = '';

  @Output() closed = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<void>();

  requestForm = new FormGroup({
    title:       new FormControl('', [Validators.required, Validators.minLength(5)]),
    category:    new FormControl<RequestCategory>('MEDICINE', [Validators.required]),
    description: new FormControl('', [Validators.required, Validators.minLength(10)]),
    city:        new FormControl('Київ', [Validators.required]),
    address:     new FormControl('', [Validators.required]),
  });

  ngOnInit(): void {
    // 1. Пошук АДРЕСИ (Nominatim)
    this.requestForm.get('address')!.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap((street): Observable<readonly NominatimSearchResult[]> => {
        const city = this.requestForm.get('city')?.value ?? '';
        if (!street || street.length < 3) {
          this.suggestions = [];
          return of([]);
        }
        this.isSearching = true;
        return this.geoService.searchStreet(street, city);
      }),
      takeUntil(this.destroy$)
    ).subscribe(results => {
      this.suggestions = [...results];
      this.isSearching = false;
      this.cdr.markForCheck();
    });

    // 2. Пошук МІСТ (Nominatim)
    this.requestForm.get('city')!.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((query): Observable<string[]> => {
        const clean = (query ?? '').trim();
        if (clean.length < 2) {
          // When user hasn't typed yet, keep popular cities (shown on focus)
          if (this.cityInputFocused) this.citySuggestions = this.popularCities;
          else this.citySuggestions = [];
          return of([]);
        }
        this.isCitySearching = true;
        return this.geoService.searchCity(clean).pipe(
          map((results: readonly NominatimSearchResult[]) => results.map(r => {
            const display = (r.display_name ?? '').trim();
            return r.address?.city ?? r.address?.town ?? r.address?.village ?? (display ? display.split(',')[0] : '');
          }).filter(Boolean) as string[])
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe(names => {
      if (names.length) this.citySuggestions = [...new Set(names)];
      else this.citySuggestions = [];
      this.isCitySearching = false;
      this.cdr.markForCheck();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['address']?.currentValue) {
      this.requestForm.patchValue({ address: changes['address'].currentValue }, { emitEvent: false });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  selectSuggestion(r: NominatimSearchResult): void {
    const formatted = this.formatNominatimDisplay(r);
    this.requestForm.patchValue({ address: formatted }, { emitEvent: false });
    const lat = Number(r.lat);
    const lng = Number(r.lon);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      this.lat = lat;
      this.lng = lng;
    }
    this.suggestions = [];
    this.cdr.markForCheck();
  }

  formatNominatimDisplay(r: NominatimSearchResult): string {
    // Nominatim already returns a localized display_name; keep it short-ish for dropdown
    return r.display_name || '';
  }

  // --- Інші методи (selectCity, onCityFocus, onSubmit і т.д.) залишаються без змін ---
  selectCity(city: string): void {
    this.requestForm.patchValue({ city, address: '' }, { emitEvent: false });
    this.citySuggestions = [];
    this.cityInputFocused = false;
    this.cdr.markForCheck();
  }

  onCityFocus(): void {
    this.cityInputFocused = true;
    // Show popular cities immediately on focus
    this.citySuggestions = this.popularCities;
    this.cdr.markForCheck();
  }

  onCityBlur(): void {
    setTimeout(() => { this.cityInputFocused = false; this.cdr.markForCheck(); }, 200);
  }

  closeSuggestions(): void {
    setTimeout(() => { this.suggestions = []; this.cdr.markForCheck(); }, 200);
  }

  onAddressFocus(): void {
    this.addressInputFocused = true;
    this.cdr.markForCheck();
  }

  onAddressBlur(): void {
    setTimeout(() => {
      this.addressInputFocused = false;
      this.suggestions = [];
      this.cdr.markForCheck();
    }, 200);
  }

  isFieldInvalid(field: string): boolean {
    const ctrl = this.requestForm.get(field);
    return !!(ctrl?.touched && ctrl?.invalid);
  }

  onSubmit(): void {
    if (this.requestForm.invalid) {
      this.requestForm.markAllAsTouched();
      return;
    }
    this.isSubmitting = true;
    const val = this.requestForm.value;

    this.requestService.createRequest(
      val.title!, 
      val.description!, 
      this.lat, 
      this.lng, 
      `${val.city}, ${val.address}`, // Об'єднуємо місто та адресу для бази
      val.category!
    )
    .pipe(takeUntil(this.destroy$)) // Додаємо безпеку
    .subscribe({
      next: () => { 
        this.isSubmitting = false; 
        this.submitted.emit(); // Подія для MapComponent, щоб прибрати пін і оновити список
        this.onClose(); // Закриваємо модалку
      },
      error: (err) => { 
        this.isSubmitting = false; 
        console.error(err);
      }
    });
  }

  onClose(): void { this.closed.emit(); }
}