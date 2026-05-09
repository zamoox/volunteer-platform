import { Component, Input, Output, EventEmitter, inject, OnChanges, SimpleChanges, OnInit, ChangeDetectorRef, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Subject, Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil, catchError, map } from 'rxjs/operators';
import { VolunteerRequestService } from '../../../core/services/volunter-request.service';
import { GeoService, PhotonFeature, NominatimResult } from '../../../core/services/geo.service';

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

  suggestions: PhotonFeature[] = [];
  citySuggestions: string[] = [];
  isCitySearching = false;
  isSearching = false;
  isSubmitting = false;
  cityInputFocused = false;

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
    // 1. Пошук ВУЛИЦЬ (Photon)
    this.requestForm.get('address')!.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap((street): Observable<PhotonFeature[]> => {
        const city = this.requestForm.get('city')?.value ?? '';
        if (!street || street.length < 3) {
          this.suggestions = [];
          return of([]);
        }
        this.isSearching = true;
        return this.geoService.searchStreet(street, city); // Виклик сервісу
      }),
      takeUntil(this.destroy$)
    ).subscribe(results => {
      this.suggestions = results;
      this.isSearching = false;
      this.cdr.markForCheck();
    });

    // 2. Пошук МІСТ (Nominatim через GeoService)
    this.requestForm.get('city')!.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((query): Observable<string[]> => {
        if (!query || query.length < 2) {
          this.citySuggestions = this.popularCities;
          return of([]);
        }
        const localMatches = this.popularCities.filter(c => c.toLowerCase().startsWith(query.toLowerCase()));
        if (localMatches.length >= 3) {
          this.citySuggestions = localMatches;
          return of([]);
        }
        this.isCitySearching = true;
        return this.geoService.searchCity(query).pipe(
          map((results: any[]) => results.map(r => 
            r.address?.city ?? r.address?.town ?? r.address?.village ?? r.display_name.split(',')[0]
          ).filter(Boolean) as string[])
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe(names => {
      if (names.length) this.citySuggestions = [...new Set(names)];
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

  selectSuggestion(f: PhotonFeature): void {
    const formatted = this.formatPhotonFeature(f);
    this.requestForm.patchValue({ address: formatted }, { emitEvent: false });
    this.lng = f.geometry.coordinates[0];
    this.lat = f.geometry.coordinates[1];
    this.suggestions = [];
    this.cdr.markForCheck();
  }

  formatPhotonFeature(f: PhotonFeature): string {
    const p = f.properties;
    const parts = [];
    if (p.street) parts.push(p.street);
    if (p.housenumber) parts.push(p.housenumber);
    if (p.city || p.district) parts.push(p.city || p.district);
    return parts.length ? parts.join(', ') : (p.name || '');
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
    if (!this.requestForm.get('city')?.value) this.citySuggestions = this.popularCities;
    this.cdr.markForCheck();
  }

  onCityBlur(): void {
    setTimeout(() => { this.cityInputFocused = false; this.cdr.markForCheck(); }, 200);
  }

  closeSuggestions(): void {
    setTimeout(() => { this.suggestions = []; this.cdr.markForCheck(); }, 200);
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
    this.requestService.createRequest(val.title!, val.description!, this.lat, this.lng, val.address!, val.category!)
      .subscribe({
        next: () => { this.isSubmitting = false; this.submitted.emit(); },
        error: () => { this.isSubmitting = false; alert('Помилка збереження'); }
      });
  }

  onClose(): void { this.closed.emit(); }
}