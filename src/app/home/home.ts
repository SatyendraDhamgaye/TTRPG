import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ChangeDetectorRef, NgZone } from '@angular/core';

import { Campaign } from '../campaign';
import { CampaignStorageService } from '../campaign-storage.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomeComponent implements OnInit {
  name = '';
  description = '';
  showCreate = false;

  // Campaign cards displayed on the home screen.
  campaigns: Campaign[] = [];

  constructor(
    private store: CampaignStorageService,
    private router: Router,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) { }

  // Load campaigns from IndexedDB on first render (migrated from localStorage).
  ngOnInit(): void {
    void this.store.getAll().then((campaigns) => {
      this.ngZone.run(() => {
        this.campaigns = campaigns;
        this.cdr.markForCheck();
      });
    });
  }

  // Create a new campaign and immediately open its canvas.
  async create(): Promise<void> {
    if (!this.name.trim()) {
      return;
    }

    const campaign = await this.store.create(this.name, this.description);
    this.router.navigate(['/canvas', campaign.id]);
  }

  // Open an existing campaign and update its last-opened timestamp.
  open(campaign: Campaign): void {
    void this.store.markOpened(campaign.id).then(() => {
      this.router.navigate(['/canvas', campaign.id]);
    });
  }

  // Delete a campaign and refresh the displayed list.
  delete(campaign: Campaign): void {
    if (!confirm('Delete campaign?')) {
      return;
    }

    void this.store.delete(campaign.id).then(async () => {
      const campaigns = await this.store.getAll();
      this.ngZone.run(() => {
        this.campaigns = campaigns;
        this.cdr.markForCheck();
      });
    });
  }
}
