import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  // Подія для відкриття форми на мапі
  @Output() createRequest = new EventEmitter<void>();

  goToHome() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onCreateClick() {
    this.createRequest.emit();
    // Можна також додати скрол до мапи, якщо юзер десь внизу
    document.getElementById('map')?.scrollIntoView({ behavior: 'smooth' });
  }
}
