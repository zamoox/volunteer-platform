import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-map-controls',
  imports: [CommonModule],
  templateUrl: './map-controls.component.html',
  styleUrl: './map-controls.component.css',
})
export class MapControlsComponent {
  @Input() isHeatmapMode = false;
  @Output() modeChanged = new EventEmitter<boolean>();

  isCollapsed = false;

  setMode(heatMode: boolean): void {
    this.modeChanged.emit(heatMode);
  }

  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
  }
}