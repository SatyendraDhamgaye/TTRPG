import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Character } from '../../models/character.model';
import { Router, RouterModule } from '@angular/router';
import { PersistenceService } from '../../services/persistence.service';

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

  constructor(
    private router: Router,
    private persistenceService: PersistenceService
  ) { }

  ngOnInit(): void {
    this.loadCharacters();
    this.restoreSelection();
  }

  loadCharacters(): void {
    this.characters = this.persistenceService.loadCharacters();
  }

  viewCharacter(id: string): void {
    this.selectedCharacter = this.characters.find(char => char.id === id);
    this.persistenceService.saveViewerSelectedCharacterId(this.selectedCharacter?.id ?? null);
  }

  private restoreSelection(): void {
    const selectedId = this.persistenceService.loadViewerSelectedCharacterId();
    if (!selectedId) {
      this.selectedCharacter = this.characters[0];
      this.persistenceService.saveViewerSelectedCharacterId(this.selectedCharacter?.id ?? null);
      return;
    }

    this.selectedCharacter = this.characters.find(char => char.id === selectedId) ?? this.characters[0];
    this.persistenceService.saveViewerSelectedCharacterId(this.selectedCharacter?.id ?? null);
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
      this.characters = this.persistenceService.deleteCharacter(id);

      if (this.selectedCharacter?.id === id) {
        this.selectedCharacter = this.characters[0];
      }

      this.persistenceService.saveViewerSelectedCharacterId(this.selectedCharacter?.id ?? null);
      alert('Character deleted successfully!');
    }
  }

  createNewCharacter(): void {
    this.router.navigate(['/character/create']);
  }
}
