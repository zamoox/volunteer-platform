import { Component, EventEmitter, Output } from '@angular/core';
import { UiEventsService } from '../../services/ui-events.service';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  // Подія для відкриття форми на мапі
  @Output() createRequest = new EventEmitter<void>();

  constructor(
    private uiEventsService: UiEventsService
  ){}

  goToHome() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onCreateRequestClick() {
    console.log('Кнопка в хедері натиснута!');
    this.uiEventsService.emitOpenCreateRequest();
  }
}
