import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MapCanvasComponent } from '../map-canvas/map-canvas';
import { CanvasSidebarComponent } from '../canvas-sidebar/canvas-sidebar';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-canvas-shell',
  standalone: true,
  imports: [
    CommonModule,
    MapCanvasComponent,
    CanvasSidebarComponent
  ],
  templateUrl: './canvas-shell.html',
  styleUrls: ['./canvas-shell.scss']
})
export class CanvasShellComponent {

  constructor(private route: ActivatedRoute) {}

ngOnInit() {
  const id = this.route.snapshot.paramMap.get('id');
  console.log('Opened canvas for campaign:', id);
}


}

