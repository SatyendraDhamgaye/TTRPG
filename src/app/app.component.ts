import { Component } from '@angular/core';
import { MapCanvasComponent } from './canvas/map-canvas/map-canvas';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MapCanvasComponent],
  template: `<app-map-canvas></app-map-canvas>`,
})
export class AppComponent {}
