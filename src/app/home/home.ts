import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { Campaign } from '../campaign';
import { CampaignStorageService } from '../campaign-storage.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.html'
})
export class HomeComponent implements OnInit {
  name = '';
  description = '';
  showCreate = false;

  // Campaign cards displayed on the home screen.
  campaigns: Campaign[] = [];

  constructor(
    private store: CampaignStorageService,
    private router: Router
  ) { }

  // Load campaigns from localStorage on first render.
  ngOnInit(): void {
    this.campaigns = this.store.getAll();
  }

  // Create a new campaign and immediately open its canvas.
  create(): void {
    if (!this.name.trim()) {
      return;
    }

    const campaign = this.store.create(this.name, this.description);
    this.router.navigate(['/canvas', campaign.id]);
  }

  // Open an existing campaign and update its last-opened timestamp.
  open(campaign: Campaign): void {
    this.store.markOpened(campaign.id);
    this.router.navigate(['/canvas', campaign.id]);
  }

  // Delete a campaign and refresh the displayed list.
  delete(campaign: Campaign): void {
    if (!confirm('Delete campaign?')) {
      return;
    }

    this.store.delete(campaign.id);
    this.campaigns = this.store.getAll();
  }
}
