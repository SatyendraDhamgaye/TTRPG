import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { effect } from '@angular/core';

import { MapCanvasComponent } from '../map-canvas/map-canvas';
import { CanvasSidebarComponent } from '../canvas-sidebar/canvas-sidebar';
import { ActivatedRoute } from '@angular/router';
import { CampaignStorageService } from '../../campaign-storage.service';
import { MapService } from '../../services/map.service';

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
  // Active campaign id from route.
  campaignId: string | null = null;
  // Display name shown in the shell overlay.
  campaignName = '';
  // Shared grid size controlled from settings sidebar.
  gridSize = 100;


  constructor(
    private route: ActivatedRoute,
    private store: CampaignStorageService,
    private mapService: MapService
  ) {
    effect(() => {
      const activeMap = this.mapService.activeMap();
      this.gridSize = activeMap?.gridSize ?? 100;
    });
  }

  // Resolve campaign context on shell load.
  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.campaignId = id;

    if (id) {
      const camp = this.store.get(id);
      this.campaignName = camp?.name || id;
    }
  }

  onGridSizeChange(size: number): void {
    this.gridSize = size;
    this.mapService.setActiveMapGridSize(size);
  }
}




