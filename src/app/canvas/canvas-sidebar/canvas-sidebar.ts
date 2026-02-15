import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TokenService } from '../../services/token.service';
import { TokenData } from '../../models/token.model';
import { MonsterService } from '../../services/monster.service';
import { MonsterData } from '../../models/monster.model';
import { SpellService } from '../../services/spell.service';
import { Spell } from '../../models/spell.model';

type SidebarMode =
  | 'map'
  | 'tokens'
  | 'characters'
  | 'monsters'
  | 'spells'
  | 'music'
  | 'settings';

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
  spellSearch = '';


  // Reactive token collection for currently selected campaign.
  readonly tokens: () => TokenData[];

  constructor(
    private tokenService: TokenService,
    private monsterService: MonsterService,
  private spellService: SpellService
  ) {
    this.tokens = this.tokenService.tokens;
  }

  // Switch sidebar module and lazily load monster data when needed.
setMode(mode: SidebarMode): void {
  this.mode = mode;

  if (mode === 'monsters') {
    this.monsterService.load();
  }

  if (mode === 'spells') {
    this.spellService.load();
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

get filteredSpells(): Spell[] {
  const term = this.spellSearch.trim().toLowerCase();
  const spells = this.spellService.spells();

  let result = spells;

  // Apply search if present
  if (term) {
    result = spells.filter(spell =>
      spell.name.toLowerCase().includes(term)
    );
  }

  // Sort by level first, then name
  return [...result].sort((a, b) => {
    if (a.level !== b.level) {
      return a.level - b.level;
    }

    return a.name.localeCompare(b.name);
  });
}


private schoolMap: Record<string, string> = {
  A: 'Abjuration',
  C: 'Conjuration',
  D: 'Divination',
  E: 'Enchantment',
  V: 'Evocation',
  I: 'Illusion',
  N: 'Necromancy',
  T: 'Transmutation'
};

getSchoolName(code?: string): string {
  if (!code) return 'Unknown';
  return this.schoolMap[code] ?? code;
}

getSchoolIcon(code?: string): string {
  const icons: Record<string, string> = {
    A: '🛡', // Abjuration
    C: '🔮', // Conjuration
    D: '👁', // Divination
    E: '💫', // Enchantment
    V: '🔥', // Evocation
    I: '🎭', // Illusion
    N: '☠', // Necromancy
    T: '⚗'  // Transmutation
  };

  return code ? icons[code] ?? '✨' : '✨';
}

getSchoolClass(code?: string): string {
  const map: Record<string, string> = {
    A: 'school-abjuration',
    C: 'school-conjuration',
    D: 'school-divination',
    E: 'school-enchantment',
    V: 'school-evocation',
    I: 'school-illusion',
    N: 'school-necromancy',
    T: 'school-transmutation'
  };

  return code ? map[code] ?? '' : '';
}

expandedSpell: string | null = null;

toggleSpell(spellName: string): void {
  this.expandedSpell =
    this.expandedSpell === spellName ? null : spellName;
}

formatEntry(entry: any): string {
  if (!entry) return '';

  if (typeof entry === 'string') {
    return this.parseTags(entry);
  }

  if (entry.entries && Array.isArray(entry.entries)) {
    return entry.entries
      .map((e: any) => this.formatEntry(e))
      .join('<br><br>');
  }

  return '';
}


private parseTags(text: string): string {
  if (!text) return '';

  // {@spell fireball}
  text = text.replace(/\{@spell ([^}|]+)(?:\|[^}]+)?}/g, '$1');

// {@skill Investigation}
text = text.replace(
  /\{@skill ([^}]+)}/g,
  '<span class="spell-skill">$1</span>'
);


  // {@dice 2d6}
  text = text.replace(/\{@dice ([^}]+)}/g, '$1');

  // {@i text}
  text = text.replace(/\{@i ([^}]+)}/g, '$1');

  // {@b text}
  text = text.replace(/\{@b ([^}]+)}/g, '$1');

  // Catch-all fallback for unknown tags
  text = text.replace(/\{@[^}]+ ([^}]+)}/g, '$1');

  return text;
}

getCastingTime(spell: any): string {
  if (!spell.time?.length) return '';
  return spell.time.map((t: any) => `${t.number} ${t.unit}`).join(', ');
}

getRange(spell: any): string {
  if (!spell.range) return '';
  return spell.range.distance
    ? `${spell.range.distance.amount || ''} ${spell.range.distance.type}`
    : spell.range.type;
}

getDuration(spell: any): string {
  if (!spell.duration?.length) return '';
  const d = spell.duration[0];

  if (d.type === 'timed') {
    return `${d.duration.amount} ${d.duration.type}`;
  }

  return d.type;
}

getComponents(spell: any): string {
  if (!spell.components) return '';

  const parts = [];

  if (spell.components.v) parts.push('V');
  if (spell.components.s) parts.push('S');
  if (spell.components.m) {
    if (typeof spell.components.m === 'string') {
      parts.push(`M (${spell.components.m})`);
    } else {
      parts.push('M');
    }
  }

  return parts.join(', ');
}

getClasses(spell: any): string {
  if (!spell.classes?.fromClassList) return '';
  return spell.classes.fromClassList
    .map((c: any) => c.name)
    .join(', ');
}

isConcentration(spell: any): boolean {
  return spell.duration?.some((d: any) => d.concentration);
}

isRitual(spell: any): boolean {
  return spell.meta?.ritual === true;
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
