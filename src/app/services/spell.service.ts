import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Spell } from '../models/spell.model';

@Injectable({ providedIn: 'root' })
export class SpellService {

  private _spells = signal<Spell[]>([]);
  private _loading = signal(false);
  private _loaded = false;

  constructor(private http: HttpClient) {}

  // Public readonly accessors
  spells = this._spells.asReadonly();
  loading = this._loading.asReadonly();

load(): void {
  if (this._loaded) return;

  this._loading.set(true);

  this.http.get<any>('compendium/spells/spells-all.json')
    .subscribe({
      next: (data) => {

        const spells: Spell[] = data.spell ?? [];

        // 🔥 Sort once here
        spells.sort((a, b) => {
          if (a.level !== b.level) {
            return a.level - b.level;
          }
          return a.name.localeCompare(b.name);
        });

        this._spells.set(spells);

        this._loaded = true;
        this._loading.set(false);
      },
      error: () => {
        this._loading.set(false);
      }
    });
}

}
