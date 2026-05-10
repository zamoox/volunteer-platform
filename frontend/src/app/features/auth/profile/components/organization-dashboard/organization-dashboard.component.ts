import { Component, inject } from '@angular/core';
import { VolunteerRequestService } from '../../../../../core/services/volunter-request.service';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
  selector: 'app-organization-dashboard',
  imports: [CommonModule, DatePipe],
  templateUrl: './organization-dashboard.component.html',
  styleUrl: './organization-dashboard.component.css',
})
export class OrganizationDashboardComponent {
  private requestService = inject(VolunteerRequestService);
    // В майбутньому це буде окремий компонент або секція
  myRequests: any[] = [];

  loadOrganizationRequests() {
    // Виклик вашого GraphQL query: getRequestsByAuthor(authorId: user.id)
    // this.requestService.getRequestsByAuthor(this.user.id).subscribe(res => {
    //   this.myRequests = res;
    // });
  }
}
