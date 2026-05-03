import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapComponent } from './features/map/map.component';
import { HeaderComponent, FooterComponent } from './shared/components';
import { RouterModule } from '@angular/router';
import { ToastComponent } from './shared/components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent, ToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  
  constructor() {}

  ngOnInit() {}

}