import { Injectable } from '@angular/core';
import { Campaign } from './campaign';

@Injectable({ providedIn: 'root' })
export class CampaignStorageService {

  private KEY = 'vtt_campaigns';

  getAll(): Campaign[] {
    const raw = localStorage.getItem(this.KEY);
    return raw ? JSON.parse(raw) : [];
  }

  saveAll(list: Campaign[]) {
    localStorage.setItem(this.KEY, JSON.stringify(list));
  }

  private randomCover() {
    const n = Math.floor(Math.random() * 6) + 1;
    return `/covers/${n}.jpg`;
  }

  create(name: string, description: string): Campaign {
    const campaigns = this.getAll();

    const newCamp: Campaign = {
      id: 'camp-' + Math.random().toString(36).substring(2, 9),

      name,
      description,

      cover: this.randomCover(),

      createdAt: Date.now(),
      lastOpened: Date.now(),

      // legacy field (not used anymore but keep safe)
      tokens: [],

      // 👉 NEW board data
      board: {
        tokens: [],
        map: null,
        version: 1
      }
    };

    campaigns.push(newCamp);
    this.saveAll(campaigns);

    return newCamp;
  }

  update(camp: Campaign) {
    const campaigns = this.getAll();
    const i = campaigns.findIndex(c => c.id === camp.id);

    if (i !== -1) {
      campaigns[i] = camp;
      this.saveAll(campaigns);
    }
  }

  delete(id: string) {
    const filtered = this.getAll().filter(c => c.id !== id);
    this.saveAll(filtered);
  }

  markOpened(id: string) {
    const camps = this.getAll();
    const c = camps.find(x => x.id === id);

    if (c) {
      c.lastOpened = Date.now();
      this.saveAll(camps);
    }
  }

  // ================= NEW =================

  get(id: string): Campaign | undefined {
    return this.getAll().find(c => c.id === id);
  }

  updateBoard(id: string, data: any) {
    const camps = this.getAll();
    const camp = camps.find(c => c.id === id);

    if (!camp) return;

    camp.board = {
      ...(camp.board || {}),
      ...data
    };

    this.saveAll(camps);
  }
}
