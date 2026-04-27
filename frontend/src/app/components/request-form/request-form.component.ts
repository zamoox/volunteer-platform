import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { VolunteerRequestService } from '../../services/volunter-request.service';

@Component({
  selector: 'app-request-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './request-form.component.html',
  styleUrl: './request-form.component.css'
})
export class RequestFormComponent {
  private requestService = inject(VolunteerRequestService);

  @Input() lat!: number;
  @Input() lng!: number;
  @Input() address: string = '';
  @Output() closed = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<void>();

  requestForm = new FormGroup({
    title: new FormControl('', [Validators.required, Validators.minLength(3)]),
    description: new FormControl('', [Validators.required])
  });

  onSubmit() {
    if (this.requestForm.valid) {
      const { title, description } = this.requestForm.value;
      
      this.requestService.createRequest(
        title!, 
        description!, 
        this.lat, 
        this.lng,
        this.address,
      ).subscribe({
        next: (result) => {
          console.log('Запит створено успішно!', result);
          // Сповіщаємо мапу, що все готово, щоб вона закрила форму і прибрала червоний маркер
          this.submitted.emit(); 
          alert('Запит опубліковано!');
        },
        error: (err) => {
          console.error('Помилка при створенні:', err);
          alert('Упс! Щось пішло не так при відправці.');
        }
      });
    }
  }

  onClose() {
    this.closed.emit();
  }

  
}