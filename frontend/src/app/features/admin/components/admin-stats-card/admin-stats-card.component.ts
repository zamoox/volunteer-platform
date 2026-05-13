import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-admin-stats-card',
  imports: [CommonModule],
  templateUrl: './admin-stats-card.component.html',
  styleUrl: './admin-stats-card.component.css',
})
export class AdminStatsCardComponent {
  @Input() label: string = '';
  @Input() value: number | null | undefined = 0;
  @Input() variant: 'light' | 'dark' = 'light';
  @Input() labelClass: string = 'text-slate-400';
}
