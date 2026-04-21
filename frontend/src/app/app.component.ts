import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VolunteerRequestService } from './services/volunter-request.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h1>Список запитів допомоги</h1>
    <ul>
      <li *ngFor="let req of requests$ | async">
        <strong>{{ req.title }}</strong> - {{ req.location.address }}
      </li>
    </ul>
  `
})
export class AppComponent implements OnInit {
  private requestService = inject(VolunteerRequestService);
  requests$ = this.requestService.getRequests();

  ngOnInit() {}
}