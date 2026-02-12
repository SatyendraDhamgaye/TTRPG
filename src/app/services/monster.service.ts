import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MonsterData } from '../models/monster.model';
import { forkJoin } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MonsterService {

  private _monsters = signal<MonsterData[]>([]);
  monsters = this._monsters.asReadonly();

  private loaded = false;

  constructor(private http: HttpClient) {}
  private _loading = signal(false);
loading = this._loading.asReadonly();


load() {

  if (this.loaded) return;

  this._loading.set(true);

  this.http
    .get<any[]>('compendium/monsters/merged-all-monsters.json')
    .subscribe(data => {

      const monsters = data.map((m: any) => ({
        id: String(
          m.slug || m.name.toLowerCase().replace(/\s+/g, '-')
        ),
        name: m.name,
        size: m.size?.toLowerCase() || 'medium',
        type: m.type,
        ac: m.armor_class ?? 10,
        hp: m.hit_points ?? 1,
        speed: m.speed ?? '',
        cr: m.challenge_rating ?? '0',
        image: this.getImagePath(m.name)
      }));

      this.filterByExistingImages(monsters);
    });
}


private filterByExistingImages(monsters: MonsterData[]) {

  if (monsters.length === 0) {
    this._monsters.set([]);
    this.loaded = true;
    return;
  }

  const valid: MonsterData[] = [];
  let loadedCount = 0;

  const checkDone = () => {
    loadedCount++;
    if (loadedCount === monsters.length) {
      this._monsters.set(valid);
      this._loading.set(false);
      this.loaded = true;
    }
  };

  monsters.forEach(monster => {

    const img = new Image();
    img.src = monster.image;

    img.onload = () => {
      valid.push(monster);
      checkDone();
    };

    img.onerror = () => {
      checkDone();
    };
  });
}




private getImagePath(name: string): string {

  const slug = name
    .toLowerCase()
    .normalize("NFD")                  // remove accents
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/'/g, "")                 // remove apostrophes
    .replace(/\s+/g, "-")              // spaces → hyphen
    .replace(/[^a-z0-9-]/g, "")        // remove special chars
    .replace(/-+/g, "-")               // collapse double hyphens
    .trim();

  return `compendium/monsters/images/${slug}.png`;
}

}
