import { Injectable } from '@angular/core';
import { Character } from '../models/character.model';

interface CharactersStoreV2 {
  version: 2;
  updatedAt: string;
  characters: Character[];
  rulesetsSupported: Array<'2014' | '2024'>;
}

export interface CreatorDraftV1 {
  version: 1;
  currentStep: number;
  formValue: Record<string, unknown>;
  savedAt: string;
}

interface ViewerUiStateV1 {
  version: 1;
  selectedCharacterId: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class PersistenceService {
  private readonly charactersV2Key = 'ttrpg.characters.v2';
  private readonly legacyCharactersKey = 'characters';
  private readonly creatorDraftKey = 'ttrpg.creator.draft.v1';
  private readonly viewerUiStateKey = 'ttrpg.viewer.ui.v1';

  loadCharacters(): Character[] {
    const v2 = this.parseJson<CharactersStoreV2>(this.charactersV2Key);
    if (v2?.version === 2 && Array.isArray(v2.characters)) {
      return v2.characters;
    }

    const legacy = this.parseJson<Character[]>(this.legacyCharactersKey);
    if (Array.isArray(legacy)) {
      this.saveCharacters(legacy);
      localStorage.removeItem(this.legacyCharactersKey);
      return legacy;
    }

    return [];
  }

  saveCharacters(characters: Character[]): void {
    const payload: CharactersStoreV2 = {
      version: 2,
      updatedAt: new Date().toISOString(),
      characters,
      rulesetsSupported: ['2014', '2024']
    };
    localStorage.setItem(this.charactersV2Key, JSON.stringify(payload));
  }

  appendCharacter(character: Character): void {
    const current = this.loadCharacters();
    current.push(character);
    this.saveCharacters(current);
  }

  deleteCharacter(id: string): Character[] {
    const updated = this.loadCharacters().filter((char) => char.id !== id);
    this.saveCharacters(updated);
    return updated;
  }

  saveCreatorDraft(draft: Omit<CreatorDraftV1, 'version' | 'savedAt'>): void {
    const payload: CreatorDraftV1 = {
      version: 1,
      currentStep: draft.currentStep,
      formValue: draft.formValue,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(this.creatorDraftKey, JSON.stringify(payload));
  }

  loadCreatorDraft(): CreatorDraftV1 | null {
    const draft = this.parseJson<CreatorDraftV1>(this.creatorDraftKey);
    if (!draft || draft.version !== 1 || typeof draft.currentStep !== 'number') {
      return null;
    }
    return draft;
  }

  clearCreatorDraft(): void {
    localStorage.removeItem(this.creatorDraftKey);
  }

  saveViewerSelectedCharacterId(selectedCharacterId: string | null): void {
    const payload: ViewerUiStateV1 = {
      version: 1,
      selectedCharacterId
    };
    localStorage.setItem(this.viewerUiStateKey, JSON.stringify(payload));
  }

  loadViewerSelectedCharacterId(): string | null {
    const state = this.parseJson<ViewerUiStateV1>(this.viewerUiStateKey);
    if (!state || state.version !== 1) {
      return null;
    }
    return state.selectedCharacterId;
  }

  private parseJson<T>(key: string): T | null {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }
}
