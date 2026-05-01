import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapComponent } from './features/map/map.component';
import { HeaderComponent, FooterComponent } from './shared/components';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, MapComponent, HeaderComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  
  constructor() {}

  ngOnInit() {}

}