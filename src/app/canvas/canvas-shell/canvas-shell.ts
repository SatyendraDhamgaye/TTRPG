import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MapCanvasComponent } from '../map-canvas/map-canvas';
import { CanvasSidebarComponent } from '../canvas-sidebar/canvas-sidebar';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { CampaignStorageService } from '../../campaign-storage.service';

@Component({
  selector: 'app-canvas-shell',
  standalone: true,
  imports: [
    CommonModule,
    MapCanvasComponent,
    CanvasSidebarComponent,
  ],
  templateUrl: './canvas-shell.html',
  styleUrls: ['./canvas-shell.scss']
})
export class CanvasShellComponent {

  campaignId: string | null = null;
  campaignName = '';               // 👈 NEW

  @ViewChild('mapCanvas') mapCanvas!: MapCanvasComponent;


gridSize = 100;

onGridChange(e: any) {
  const value = +e.target.value;
  this.gridSize = value;

  if (this.mapCanvas) {
    this.mapCanvas.updateGridSize(value);
  }
}

sliderPercent = 33; // default for 100 if range 50–200

minGrid = 50;
maxGrid = 200;

startDrag(event: MouseEvent) {
  this.updateFromEvent(event);

  const move = (e: MouseEvent) => this.updateFromEvent(e);
  const stop = () => {
    window.removeEventListener('mousemove', move);
    window.removeEventListener('mouseup', stop);
  };

  window.addEventListener('mousemove', move);
  window.addEventListener('mouseup', stop);
}

updateFromEvent(event: MouseEvent) {
  const slider = (event.currentTarget || event.target) as HTMLElement;
  const rect = slider.getBoundingClientRect();

  const offsetY = rect.bottom - event.clientY;
  let percent = (offsetY / rect.height) * 100;

  percent = Math.max(0, Math.min(100, percent));

  this.sliderPercent = percent;

  const value =
    this.minGrid +
    (percent / 100) * (this.maxGrid - this.minGrid);

  this.gridSize = Math.round(value / 10) * 10;

  this.mapCanvas.updateGridSize(this.gridSize);
}


adjustGrid(amount: number) {
  let newSize = this.gridSize + amount;

  newSize = Math.max(50, Math.min(200, newSize));

  this.gridSize = newSize;
  this.mapCanvas.updateGridSize(newSize);
}

resetGrid() {
  this.gridSize = 100;
  this.mapCanvas.updateGridSize(100);
}


  constructor(
    private route: ActivatedRoute,
    private store: CampaignStorageService   // 👈 NEW
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.campaignId = id;

    if (id) {
      const camp = this.store.get(id);      // 👈 get full campaign
      this.campaignName = camp?.name || id; // fallback to id
    }

    console.log('Opened canvas for campaign:', id);
  }
}

