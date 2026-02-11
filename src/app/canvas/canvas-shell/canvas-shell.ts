import { Component, OnInit } from '@angular/core';
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

