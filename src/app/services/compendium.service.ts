import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, shareReplay } from 'rxjs';

export interface RaceData {
  name: string;
  description: string;
  abilityScoreIncrease: { [key: string]: number };
  size: string;
  speed: number;
  proficiencies: string[];
  traits: Array<{ name: string; description: string }>;
  languages: string[];
}

export interface ClassData {
  name: string;
  description: string;
  hitDie: number;
  proficiencies: {
    armor: string[];
    weapons: string[];
    tools: string[];
    savingThrows: string[];
  };
  startingEquipment: string[];
  // Add more class-specific properties as needed
}

// Define interfaces for other compendium data (SpellData, ItemData, MonsterData) as needed

@Injectable({
  providedIn: 'root'
})
export class CompendiumService {

  private raceCache$: Observable<RaceData[]> | null = null;
  private classCache$: Observable<ClassData[]> | null = null;
  // Add caches for other data types as they are implemented

  constructor(private http: HttpClient) { }

  private readonly fallbackRaces: RaceData[] = [
    {
      name: 'Human',
      description: 'A versatile and ambitious people, humans are the most common race in many worlds.',
      abilityScoreIncrease: {
        strength: 1,
        dexterity: 1,
        constitution: 1,
        intelligence: 1,
        wisdom: 1,
        charisma: 1
      },
      size: 'Medium',
      speed: 30,
      proficiencies: [],
      traits: [
        {
          name: 'Extra Language',
          description: 'You can speak, read, and write one extra language of your choice.'
        }
      ],
      languages: ['Common']
    }
  ];

  private readonly fallbackClasses: ClassData[] = [
    {
      name: 'Fighter',
      description: 'A master of martial combat, skilled with a variety of weapons and armor.',
      hitDie: 10,
      proficiencies: {
        armor: ['Light armor', 'Medium armor', 'Heavy armor', 'Shields'],
        weapons: ['Simple weapons', 'Martial weapons'],
        tools: [],
        savingThrows: ['Strength', 'Constitution']
      },
      startingEquipment: [
        '(a) Chain mail or (b) leather armor, longbow, and 20 arrows',
        '(a) a martial weapon and a shield or (b) two martial weapons',
        '(a) a light crossbow and 20 bolts or (b) two handaxes',
        "(a) a dungeoneer\'s pack or (b) an explorer\'s pack"
      ]
    }
  ];

  getRaces(): Observable<RaceData[]> {
    if (!this.raceCache$) {
      this.raceCache$ = this.http.get<RaceData>('/compendium/races/human.json').pipe(
        map((humanRace) => [humanRace]),
        catchError(() => of(this.fallbackRaces)),
        shareReplay(1)
      );
    }
    return this.raceCache$;
  }

  getClasses(): Observable<ClassData[]> {
    if (!this.classCache$) {
      this.classCache$ = this.http.get<ClassData[]>('/compendium/classes/index.json').pipe(
        catchError(() => of(this.fallbackClasses)),
        shareReplay(1)
      );
    }
    return this.classCache$;
  }

  // Add methods for getSpells(), etc.
}