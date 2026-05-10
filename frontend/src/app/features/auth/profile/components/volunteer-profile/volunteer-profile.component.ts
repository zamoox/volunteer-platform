import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-volunteer-profile',
  imports: [CommonModule],
  templateUrl: './volunteer-profile.component.html',
  styleUrl: './volunteer-profile.component.css',
})
export class VolunteerProfileComponent {
  activeHelps = [];
  item = {
    title: 'sdfds',
    orgName:'sdf',
  }
}
