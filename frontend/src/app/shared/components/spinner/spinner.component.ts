import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spinner',
  imports: [CommonModule],
  templateUrl: './spinner.component.html',
  styleUrl: './spinner.component.css',
})
export class SpinnerComponent {
  // 'inline' - для кнопок, 'fullscreen' - для перекриття всього екрану
  @Input() mode: 'inline' | 'fullscreen' = 'inline';
  
  // 'sm', 'md', 'lg' - для різних розмірів
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  get sizeClasses() {
    return {
      'h-4 w-4': this.size === 'sm',
      'h-8 w-8': this.size === 'md',
      'h-12 w-12': this.size === 'lg',
    };
  }
}