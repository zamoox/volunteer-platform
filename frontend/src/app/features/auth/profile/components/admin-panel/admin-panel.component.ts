import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-panel',
  imports: [CommonModule],
  templateUrl: './admin-panel.component.html',
  styleUrl: './admin-panel.component.css',
})
export class AdminPanelComponent {
  dummyUsers = [
    { id: '123e4567-e89b-12d3-a456-426614174000', email: 'admin@platform.com', role: 'admin', isEmailVerified: true },
    { id: '223e4567-e89b-12d3-a456-426614174001', email: 'help_kharkiv@fond.ua', role: 'organization', isEmailVerified: false },
    { id: '323e4567-e89b-12d3-a456-426614174002', email: 'vlad_volunteer@gmail.com', role: 'volunteer', isEmailVerified: true },
    { id: '423e4567-e89b-12d3-a456-426614174003', email: 'kyiv_unity@org.ua', role: 'organization', isEmailVerified: true },
    { id: '523e4567-e89b-12d3-a456-426614174004', email: 'mariia_v@ukr.net', role: 'volunteer', isEmailVerified: false },
  ];
}
