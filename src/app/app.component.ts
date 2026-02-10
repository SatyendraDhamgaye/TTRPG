import { Component } from '@angular/core';
import { CanvasShellComponent } from './canvas/canvas-shell/canvas-shell';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CanvasShellComponent],
  template: `<app-canvas-shell></app-canvas-shell>`,
})
export class AppComponent {}
