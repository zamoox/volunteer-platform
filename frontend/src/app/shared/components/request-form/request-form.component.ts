import {
  Component, Input, Output, EventEmitter,
  inject, OnChanges, SimpleChanges, OnInit,
  ChangeDetectorRef, OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { VolunteerRequestService, PhotonFeature, NominatimResult } from '../../../core/services/volunter-request.service';

export type RequestCategory = 'MEDICINE' | 'FOOD' | 'TRANSPORT' | 'SHELTER' | 'OTHER';

interface CategoryOption {
  value: RequestCategory;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-request-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './request-form.component.html',
  styleUrl: './request-form.component.css'
})
export class RequestFormComponent implements OnInit, OnChanges, OnDestroy {
  private requestService = inject(VolunteerRequestService);
  private cdr = inject(ChangeDetectorRef);
  private http = inject(HttpClient);
  private destroy$ = new Subject<void>();

  // Photon повертає PhotonFeature[], не NominatimResult[]
  suggestions: PhotonFeature[] = [];
  citySuggestions: string[] = [];
  isCitySearching = false;
  isSearching = false;
  isSubmitting = false;
  cityInputFocused = false;

  readonly popularCities = [
    'Київ', 'Харків', 'Одеса', 'Дніпро', 'Запоріжжя',
    'Львів', 'Кривий Ріг', 'Миколаїв', 'Вінниця', 'Херсон',
    'Полтава', 'Чернігів', 'Черкаси', 'Суми', 'Житомир',
    'Рівне', 'Івано-Франківськ', 'Кропивницький', 'Тернопіль',
    'Луцьк', 'Ужгород', 'Хмельницький', 'Чернівці',
  ];

  readonly categories: CategoryOption[] = [
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
    // ── Autocomplete вулиць через Photon ──────────────────────────────────
    this.requestForm.get('address')!.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap((street): import('rxjs').Observable<PhotonFeature[]> => {
        const city = this.requestForm.get('city')?.value ?? '';
        if (!street || street.length < 3) {
          this.suggestions = [];
          return of<PhotonFeature[]>([]);
        }
        this.isSearching = true;
        return this.requestService.searchAddress(street, city).pipe(
          catchError(() => of<PhotonFeature[]>([]))
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe((results: PhotonFeature[]) => {
      this.suggestions = results;
      this.isSearching = false;
      this.cdr.markForCheck();
    });

    // ── Autocomplete міст через Nominatim (featuretype=city) ──────────────
    this.requestForm.get('city')!.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((query): import('rxjs').Observable<NominatimResult[]> => {
        if (!query || query.length < 2) {
          this.citySuggestions = this.popularCities;
          return of<NominatimResult[]>([]);
        }
        const localMatches = this.popularCities.filter(c =>
          c.toLowerCase().startsWith(query.toLowerCase())
        );
        if (localMatches.length >= 3) {
          this.citySuggestions = localMatches;
          return of<NominatimResult[]>([]);
        }
        this.isCitySearching = true;
        const params = new HttpParams()
          .set('format', 'json')
          .set('q', query)
          .set('countrycodes', 'ua')
          .set('featuretype', 'city')
          .set('limit', '6')
          .set('accept-language', 'uk');
        return this.http
          .get<NominatimResult[]>('https://nominatim.openstreetmap.org/search', { params })
          .pipe(catchError(() => of<NominatimResult[]>([])));
      }),
      takeUntil(this.destroy$)
    ).subscribe((results: NominatimResult[]) => {
      if (results.length) {
        const names = results.map(r =>
          r.address?.city ?? r.address?.town ?? r.address?.village ?? r.display_name.split(',')[0]
        ).filter(Boolean) as string[];
        this.citySuggestions = [...new Set(names)];
      }
      this.isCitySearching = false;
      this.suggestions = [];
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

  // ── Photon: вибір підказки вулиці ──────────────────────────────────────
  selectSuggestion(f: PhotonFeature): void {
    const formatted = this.formatPhotonFeature(f);
    this.requestForm.patchValue({ address: formatted }, { emitEvent: false });
    // Photon повертає координати як [lon, lat]
    this.lng = f.geometry.coordinates[0];
    this.lat = f.geometry.coordinates[1];
    this.suggestions = [];
    this.cdr.markForCheck();
  }

  closeSuggestions(): void {
    setTimeout(() => { this.suggestions = []; }, 200);
  }

  // ── City dropdown ───────────────────────────────────────────────────────
  onCityFocus(): void {
    this.cityInputFocused = true;
    if (!this.requestForm.get('city')?.value) {
      this.citySuggestions = this.popularCities;
    }
    this.cdr.markForCheck();
  }

  onCityBlur(): void {
    setTimeout(() => {
      this.cityInputFocused = false;
      this.citySuggestions = [];
      this.cdr.markForCheck();
    }, 200);
  }

  selectCity(city: string): void {
    this.requestForm.patchValue({ city, address: '' }, { emitEvent: false });
    this.citySuggestions = [];
    this.cityInputFocused = false;
    this.suggestions = [];
    this.cdr.markForCheck();
  }

  // ── Submit ──────────────────────────────────────────────────────────────
  onSubmit(): void {
    if (this.requestForm.invalid) {
      this.requestForm.markAllAsTouched();
      return;
    }
    const { title, description, address } = this.requestForm.value;
    this.isSubmitting = true;
    this.requestService
      .createRequest(title!, description!, this.lat, this.lng, address!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => { this.isSubmitting = false; this.submitted.emit(); },
        error: (err) => {
          console.error(err);
          this.isSubmitting = false;
          alert('Не вдалося зберегти запит.');
        }
      });
  }

  onClose(): void { this.closed.emit(); }

  // ── Helpers ─────────────────────────────────────────────────────────────

  /**
   * Формує читабельний рядок адреси з Photon Feature.
   * Photon повертає структуровані поля: street, housenumber, city, district.
   */
  formatPhotonFeature(f: PhotonFeature): string {
    const p = f.properties;
    const parts: string[] = [];

    if (p.street)      parts.push(p.street);
    if (p.housenumber) parts.push(p.housenumber);
    if (p.city ?? p.district) parts.push((p.city ?? p.district)!);

    return parts.length ? parts.join(', ') : (p.name ?? '');
  }

  isFieldInvalid(field: string): boolean {
    const ctrl = this.requestForm.get(field);
    return !!(ctrl?.touched && ctrl?.invalid);
  }
}