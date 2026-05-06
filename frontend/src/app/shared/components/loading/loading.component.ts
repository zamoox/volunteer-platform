import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../../core/services/loading.service';
import { SpinnerComponent } from '../spinner/spinner.component';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.css'],
})
export class LoadingComponent {
  // Робимо публічним, щоб мати доступ з HTML-шаблону
  public loadingService = inject(LoadingService);
}