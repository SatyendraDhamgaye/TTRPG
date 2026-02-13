import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MapCanvasComponent } from '../map-canvas/map-canvas';
import { CanvasSidebarComponent } from '../canvas-sidebar/canvas-sidebar';
import { ActivatedRoute } from '@angular/router';
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
  // Active campaign id from route.
  campaignId: string | null = null;
  // Display name shown in the shell overlay.
  campaignName = '';


  constructor(
    private route: ActivatedRoute,
    private store: CampaignStorageService
  ) {}

  // Resolve campaign context on shell load.
  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.campaignId = id;

    if (id) {
      const camp = this.store.get(id);
      this.campaignName = camp?.name || id;
    }
  }
}


