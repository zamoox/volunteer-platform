import { Component, EventEmitter, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalService } from '@core/services/modal.service';
import { ModalComponent } from '@shared/components/modal/modal.component';

@Component({
  selector: 'app-reason-modal',
  imports: [ModalComponent, FormsModule],
  templateUrl: './reason-modal.component.html',
  styleUrl: './reason-modal.component.css',
})
export class ReasonModalComponent {
  @HostListener('document:keydown.escape')
  onKeydownHandler() {
    this.cancel();
  }

  title = 'Причина дії';
  reason = '';
  
  // Сервіс модалки поверне нам цей результат
  confirmAction = new EventEmitter<string>();

  constructor(private modalService: ModalService) {}

  confirm() { this.confirmAction.emit(this.reason); }
  cancel() { this.modalService.close(); }
}
