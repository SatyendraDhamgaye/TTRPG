import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TokenService } from '../../services/token.service';
import { TokenData } from '../../models/token.model';
import { FormsModule } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';

import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-canvas-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,

    // for navigation
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './canvas-sidebar.html',
  styleUrls: ['./canvas-sidebar.scss']
})
export class CanvasSidebarComponent {

  // receive from shell
  @Input() campaignId: string | null = null;

  name = '';
  image = '';
  search = '';

  size: TokenData['size'] = 'medium';

  // signal from service
tokens: any;

mode: 'map' | 'tokens' | 'characters' | 'pdfs' | 'music' | 'settings' = 'map';

  constructor(
    private tokenService: TokenService,
    private cdr: ChangeDetectorRef
  ) {
      this.tokens = this.tokenService.tokens;
  }

  setMode(m: any) {
    this.mode = m;
  }

  onFile(e: any) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      setTimeout(() => {
        this.image = reader.result as string;
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      });
    };

    reader.readAsDataURL(file);
  }

  get filteredTokens() {
    const term = this.search.trim().toLowerCase();

    if (!term) return this.tokens();

    const words: string[] = term.split(' ').filter((w: string) => w);

    return this.tokens().filter((t: any) => {

      const name: string = t.name.toLowerCase();

      return words.every((w: string) =>
        name.split(' ').some((nw: string) => nw.startsWith(w))
      );

    });
  }

  create() {
    if (!this.image) {
      alert('Please select image first');
      return;
    }

    const token = {
      id: crypto.randomUUID(),
      name: this.name || 'Token',
      image: this.image,
      size: this.size,

      // important fix
      campaignId: this.campaignId ?? undefined
    };

    this.tokenService.add(token);

    this.name = '';
    this.size = 'medium';
    this.image = '';

    const fileInput =
      document.querySelector('input[type="file"]') as HTMLInputElement;

    if (fileInput) {
      fileInput.value = '';
    }

    this.cdr.detectChanges();
  }

  delete(id: string) {
    this.tokenService.remove(id);
  }

  dragStart(e: DragEvent, token: TokenData) {
    e.dataTransfer?.setData('token', JSON.stringify(token));
  }
}
