import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TokenService } from '../../services/token.service';
import { TokenData } from '../../models/token.model';
import { MonsterService } from '../../services/monster.service';
import { MonsterData } from '../../models/monster.model';

type SidebarMode = 'map' | 'tokens' | 'characters' | 'monsters' | 'music' | 'settings';

@Component({
  selector: 'app-canvas-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './canvas-sidebar.html',
  styleUrls: ['./canvas-sidebar.scss']
})
export class CanvasSidebarComponent {
  // Campaign scope is provided by the shell component.
  @Input() campaignId: string | null = null;

  name = '';
  image = '';
  search = '';
  monsterSearch = '';
  size: TokenData['size'] = 'medium';
  mode: SidebarMode = 'map';

  // Reactive token collection for currently selected campaign.
  readonly tokens: () => TokenData[];

  constructor(
    private tokenService: TokenService,
    private monsterService: MonsterService
  ) {
    this.tokens = this.tokenService.tokens;
  }

  // Switch sidebar module and lazily load monster data when needed.
  setMode(mode: SidebarMode): void {
    this.mode = mode;

    if (mode === 'monsters') {
      this.monsterService.load();
    }
  }

  // Monster list filtered by search term.
  get filteredMonsters(): MonsterData[] {
    const term = this.monsterSearch.trim().toLowerCase();
    const monsters = this.monsterService.monsters();

    if (!term) {
      return monsters;
    }

    return monsters.filter((monster) => monster.name.toLowerCase().includes(term));
  }

  // Convert monster size categories to token scaling categories.
  private convertSize(size: string): TokenData['size'] {
    switch (size) {
    case 'tiny':
    case 'small':
    case 'medium':
      return 'medium';
    case 'large':
      return 'large';
    case 'huge':
      return 'huge';
    case 'gargantuan':
      return 'gargantuan';
    default:
      return 'medium';
  }
  }

  // Begin drag operation for a compendium monster token.
  dragMonster(event: DragEvent, monster: MonsterData): void {
    const token = {
      id: crypto.randomUUID(),
      name: monster.name,
      image: monster.image,
      size: this.convertSize(monster.size),
      campaignId: this.campaignId ?? undefined
    };

    event.dataTransfer?.setData('token', JSON.stringify(token));
  }

  // Load local file as a data URL for custom token creation.
  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.image = (reader.result as string) || '';
    };
    reader.readAsDataURL(file);
  }

  // Token list filtered by prefix matching against each search word.
  get filteredTokens(): TokenData[] {
    const term = this.search.trim().toLowerCase();

    if (!term) {
      return this.tokens();
    }

    const words: string[] = term.split(' ').filter((w: string) => w);

    return this.tokens().filter((token) => {
      const name = token.name.toLowerCase();
      return words.every((w: string) =>
        name.split(' ').some((nw: string) => nw.startsWith(w))
      );
    });
  }

  // Create a campaign-scoped custom token entry.
  create(): void {
    if (!this.image) {
      alert('Please select image first');
      return;
    }

    const token = {
      id: crypto.randomUUID(),
      name: this.name || 'Token',
      image: this.image,
      size: this.size,
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
  }

  // Loading state for monster dataset fetch and image validation.
  get loadingMonsters(): boolean {
    return this.monsterService.loading();
  }

  // Remove a custom token from current campaign library.
  delete(id: string): void {
    this.tokenService.remove(id);
  }

  // Begin drag operation for an existing token.
  dragStart(event: DragEvent, token: TokenData): void {
    event.dataTransfer?.setData('token', JSON.stringify(token));
  }
}
