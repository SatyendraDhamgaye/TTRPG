import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Character } from '../../models/character.model';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-character-viewer',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './character-viewer.component.html',
  styleUrls: ['./character-viewer.component.scss']
})
export class CharacterViewerComponent implements OnInit {
  characters: Character[] = [];
  selectedCharacter: Character | undefined;

  constructor(private router: Router) { }

  ngOnInit(): void {
    this.loadCharacters();
  }

  loadCharacters(): void {
    const charactersJson = localStorage.getItem('characters');
    if (charactersJson) {
      this.characters = JSON.parse(charactersJson) as Character[];
    }
  }

  viewCharacter(id: string): void {
    this.selectedCharacter = this.characters.find(char => char.id === id);
  }

  getAbilityModifier(score: number): string {
    const modifier = Math.floor((score - 10) / 2);
    return modifier >= 0 ? `+${modifier}` : `${modifier}`;
  }

  editCharacter(id: string): void {
    // Implement edit logic, maybe navigate to character creator with character data
    console.log('Edit character:', id);
  }

  deleteCharacter(id: string): void {
    if (confirm('Are you sure you want to delete this character?')) {
      this.characters = this.characters.filter(char => char.id !== id);
      localStorage.setItem('characters', JSON.stringify(this.characters));
      this.selectedCharacter = undefined; // Clear selection if deleted
      alert('Character deleted successfully!');
    }
  }

  createNewCharacter(): void {
    this.router.navigate(['/character/create']);
  }
}
