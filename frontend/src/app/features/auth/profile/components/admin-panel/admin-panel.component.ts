import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-panel',
  imports: [CommonModule],
  templateUrl: './admin-panel.component.html',
  styleUrl: './admin-panel.component.css',
})
export class AdminPanelComponent {
  allUsers = [];
  
  user = {
    email: 'example@mail.com',
    role: 'admin',
    isEmailVerified: false,
  }
}
