import { Component } from '@angular/core';
import { HeroCanvasComponent } from '../../shared/components/hero-canvas/hero-canvas.component';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [RouterModule, HeroCanvasComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {}
