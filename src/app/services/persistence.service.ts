import { Injectable } from '@angular/core';
import { Character } from '../models/character.model';
import { IndexedDbStorageService } from './indexeddb-storage.service';

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

  constructor(private readonly dbStorage: IndexedDbStorageService) {}

  async loadCharacters(): Promise<Character[]> {
    const v2 = await this.parseJson<CharactersStoreV2>(this.charactersV2Key);
    if (v2?.version === 2 && Array.isArray(v2.characters)) {
      return v2.characters;
    }

    const legacy = await this.parseJson<Character[]>(this.legacyCharactersKey);
    if (Array.isArray(legacy)) {
      await this.saveCharacters(legacy);
      await this.dbStorage.remove(this.legacyCharactersKey);
      return legacy;
    }

    return [];
  }

  async saveCharacters(characters: Character[]): Promise<void> {
    const payload: CharactersStoreV2 = {
      version: 2,
      updatedAt: new Date().toISOString(),
      characters,
      rulesetsSupported: ['2014', '2024']
    };
    await this.dbStorage.set(this.charactersV2Key, payload);
  }

  async appendCharacter(character: Character): Promise<void> {
    const current = await this.loadCharacters();
    current.push(character);
    await this.saveCharacters(current);
  }

  async deleteCharacter(id: string): Promise<Character[]> {
    const updated = (await this.loadCharacters()).filter((char) => char.id !== id);
    await this.saveCharacters(updated);
    return updated;
  }

  async saveCreatorDraft(draft: Omit<CreatorDraftV1, 'version' | 'savedAt'>): Promise<void> {
    const payload: CreatorDraftV1 = {
      version: 1,
      currentStep: draft.currentStep,
      formValue: draft.formValue,
      savedAt: new Date().toISOString()
    };
    await this.dbStorage.set(this.creatorDraftKey, payload);
  }

  async loadCreatorDraft(): Promise<CreatorDraftV1 | null> {
    const draft = await this.parseJson<CreatorDraftV1>(this.creatorDraftKey);
    if (!draft || draft.version !== 1 || typeof draft.currentStep !== 'number') {
      return null;
    }
    return draft;
  }

  async clearCreatorDraft(): Promise<void> {
    await this.dbStorage.remove(this.creatorDraftKey);
  }

  async saveViewerSelectedCharacterId(selectedCharacterId: string | null): Promise<void> {
    const payload: ViewerUiStateV1 = {
      version: 1,
      selectedCharacterId
    };
    await this.dbStorage.set(this.viewerUiStateKey, payload);
  }

  async loadViewerSelectedCharacterId(): Promise<string | null> {
    const state = await this.parseJson<ViewerUiStateV1>(this.viewerUiStateKey);
    if (!state || state.version !== 1) {
      return null;
    }
    return state.selectedCharacterId;
  }

  private async parseJson<T>(key: string): Promise<T | null> {
    // First time: migrate localStorage content to IndexedDB so future reads use IDB.
    const migrated = await this.dbStorage.migrateJsonFromLocalStorage<T>(key);
    if (migrated !== null) {
      return migrated;
    }

    const stored = await this.dbStorage.get<T>(key);
    return stored ?? null;
  }
}
