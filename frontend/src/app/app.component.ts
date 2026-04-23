import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VolunteerRequestService } from './services/volunter-request.service';
import { MapComponent } from './components/map/map.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, MapComponent],
    template: `
        <div style="font-family: sans-serif; padding: 20px;">
            <h1 style="color: #2c3e50; text-align: center;">🛡️ Волонтерська Платформа</h1>
            <hr>
            <app-map></app-map>
        </div>
    `
})
export class AppComponent implements OnInit {
  private requestService = inject(VolunteerRequestService);
  requests$ = this.requestService.getRequests();

  ngOnInit() {}
}