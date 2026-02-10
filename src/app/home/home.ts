import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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


  campaigns: any[] = [];   // ← initialize empty

  constructor(
    private store: CampaignStorageService,
    private router: Router
  ) {}

  ngOnInit() {
    this.campaigns = this.store.getAll();   // ← load here
    
  }

  create() {
    if (!this.name.trim()) return;

    const c = this.store.create(this.name, this.description);

    this.router.navigate(['/play', c.id]);
  }

  open(c: any) {
    this.store.markOpened(c.id);
    this.router.navigate(['/play', c.id]);
  }

  delete(c: any) {
    if (!confirm('Delete campaign?')) return;

    this.store.delete(c.id);
    this.campaigns = this.store.getAll();   // refresh list
  }
}
