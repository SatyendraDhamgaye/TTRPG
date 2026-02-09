import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { CompendiumService } from '../../services/compendium.service';
import { RaceData, ClassData } from '../../services/compendium.service';
import { Character, AbilityScores } from '../../models/character.model';
import { PersistenceService } from '../../services/persistence.service';

@Component({
  selector: 'app-character-creator',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './character-creator.component.html',
  styleUrls: ['./character-creator.component.scss']
})
export class CharacterCreatorComponent implements OnInit {
  characterForm!: FormGroup;
  readonly abilities: Array<keyof AbilityScores> = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
  readonly standardArray: number[] = [15, 14, 13, 12, 10, 8];
  races: RaceData[] = [];
  classes: ClassData[] = [];
  selectedRace: RaceData | undefined;
  selectedClass: ClassData | undefined;
  currentStep: number = 0; // Track the current step
  abilityMethodError: string = '';
  private readonly maxStep = 3;

  constructor(
    private fb: FormBuilder,
    private compendiumService: CompendiumService,
    private persistenceService: PersistenceService
  ) { }

  ngOnInit(): void {
    this.characterForm = this.fb.group({
      playerName: [null, Validators.required],
      characterName: [null, Validators.required],
      ruleset: ['2014', Validators.required],
      race: [null, Validators.required],
      characterClass: [null, Validators.required],
      abilityGenerationMethod: ['standardArray', Validators.required],
      strength: [8, [Validators.required, Validators.min(1), Validators.max(20)]],
      dexterity: [8, [Validators.required, Validators.min(1), Validators.max(20)]],
      constitution: [8, [Validators.required, Validators.min(1), Validators.max(20)]],
      intelligence: [8, [Validators.required, Validators.min(1), Validators.max(20)]],
      wisdom: [8, [Validators.required, Validators.min(1), Validators.max(20)]],
      charisma: [8, [Validators.required, Validators.min(1), Validators.max(20)]],
    });

    this.applyStandardArrayPreset();
    this.restoreDraft();

    this.compendiumService.getRaces().subscribe(races => {
      this.races = races;
      this.syncSelectedRaceFromForm();
    });

    this.compendiumService.getClasses().subscribe(classes => {
      this.classes = classes;
      this.syncSelectedClassFromForm();
    });

    this.characterForm.get('race')?.valueChanges.subscribe(raceName => {
      this.selectedRace = this.races.find(race => race.name === raceName);
    });

    this.characterForm.get('characterClass')?.valueChanges.subscribe(className => {
      this.selectedClass = this.classes.find(cls => cls.name === className);
    });

    this.characterForm.get('abilityGenerationMethod')?.valueChanges.subscribe(() => {
      this.abilityMethodError = '';
    });

    this.characterForm.valueChanges.subscribe(() => {
      this.saveDraft();
    });
  }

  // Helper getters for form validation states
  get isPlayerNameInvalidAndTouched(): boolean { return !!(this.characterForm.get('playerName')?.invalid && this.characterForm.get('playerName')?.touched); }
  get isCharacterNameInvalidAndTouched(): boolean { return !!(this.characterForm.get('characterName')?.invalid && this.characterForm.get('characterName')?.touched); }
  get isRaceInvalidAndTouched(): boolean { return !!(this.characterForm.get('race')?.invalid && this.characterForm.get('race')?.touched); }
  get isCharacterClassInvalidAndTouched(): boolean { return !!(this.characterForm.get('characterClass')?.invalid && this.characterForm.get('characterClass')?.touched); }

  get isStrengthInvalidAndTouched(): boolean { return !!(this.characterForm.get('strength')?.invalid && this.characterForm.get('strength')?.touched); }
  get isDexterityInvalidAndTouched(): boolean { return !!(this.characterForm.get('dexterity')?.invalid && this.characterForm.get('dexterity')?.touched); }
  get isConstitutionInvalidAndTouched(): boolean { return !!(this.characterForm.get('constitution')?.invalid && this.characterForm.get('constitution')?.touched); }
  get isIntelligenceInvalidAndTouched(): boolean { return !!(this.characterForm.get('intelligence')?.invalid && this.characterForm.get('intelligence')?.touched); }
  get isWisdomInvalidAndTouched(): boolean { return !!(this.characterForm.get('wisdom')?.invalid && this.characterForm.get('wisdom')?.touched); }
  get isCharismaInvalidAndTouched(): boolean { return !!(this.characterForm.get('charisma')?.invalid && this.characterForm.get('charisma')?.touched); }

  // Helper getters to access form controls for marking as touched
  private get playerNameControl_(): AbstractControl | null { return this.characterForm.get('playerName'); }
  private get characterNameControl_(): AbstractControl | null { return this.characterForm.get('characterName'); }
  private get raceControl_(): AbstractControl | null { return this.characterForm.get('race'); }
  private get characterClassControl_(): AbstractControl | null { return this.characterForm.get('characterClass'); }
  private get strengthControl_(): AbstractControl | null { return this.characterForm.get('strength'); }
  private get dexterityControl_(): AbstractControl | null { return this.characterForm.get('dexterity'); }
  private get constitutionControl_(): AbstractControl | null { return this.characterForm.get('constitution'); }
  private get intelligenceControl_(): AbstractControl | null { return this.characterForm.get('intelligence'); }
  private get wisdomControl_(): AbstractControl | null { return this.characterForm.get('wisdom'); }
  private get charismaControl_(): AbstractControl | null { return this.characterForm.get('charisma'); }

  generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  getAbilityIncreases(race: RaceData): { key: string; value: number }[] {
    return Object.entries(race.abilityScoreIncrease).map(([key, value]) => ({ key, value: value as number }));
  }

  getProficiencies(classData: ClassData): string[] {
    const profs: string[] = [];
    if (classData.proficiencies.armor.length > 0) profs.push(`Armor: ${classData.proficiencies.armor.join(', ')}`);
    if (classData.proficiencies.weapons.length > 0) profs.push(`Weapons: ${classData.proficiencies.weapons.join(', ')}`);
    if (classData.proficiencies.tools.length > 0) profs.push(`Tools: ${classData.proficiencies.tools.join(', ')}`);
    if (classData.proficiencies.savingThrows.length > 0) profs.push(`Saving Throws: ${classData.proficiencies.savingThrows.join(', ')}`);
    return profs;
  }

  getAbilityModifier(score: number | null): string {
    if (score === null) return '';
    const modifier = Math.floor((score - 10) / 2);
    return modifier >= 0 ? `+${modifier}` : `${modifier}`;
  }

  get rulesetLabel(): string {
    return this.characterForm.get('ruleset')?.value === '2024' ? 'D&D 5e (2024)' : 'D&D 5e (2014)';
  }

  get abilityGenerationMethod(): 'standardArray' | 'pointBuy' | 'manual' {
    return this.characterForm.get('abilityGenerationMethod')?.value;
  }

  get pointBuyBudget(): number {
    // 2014 and 2024 both use 27-point buy by default.
    return 27;
  }

  get pointBuySpent(): number {
    return this.abilities.reduce((sum, ability) => {
      const score = Number(this.characterForm.get(ability)?.value ?? 8);
      return sum + this.getPointBuyCost(score);
    }, 0);
  }

  get pointBuyRemaining(): number {
    return this.pointBuyBudget - this.pointBuySpent;
  }

  getPointBuyCost(score: number): number {
    const costMap: Record<number, number> = {
      8: 0,
      9: 1,
      10: 2,
      11: 3,
      12: 4,
      13: 5,
      14: 7,
      15: 9,
    };
    return costMap[score] ?? 999;
  }

  getAbilityMin(): number {
    return this.abilityGenerationMethod === 'pointBuy' ? 8 : 1;
  }

  getAbilityMax(): number {
    return this.abilityGenerationMethod === 'pointBuy' ? 15 : 20;
  }

  applyStandardArrayPreset(): void {
    this.abilities.forEach((ability, index) => {
      this.characterForm.get(ability)?.setValue(this.standardArray[index]);
    });
    this.characterForm.get('abilityGenerationMethod')?.setValue('standardArray');
  }

  private syncSelectedRaceFromForm(): void {
    const raceName = this.characterForm.get('race')?.value;
    this.selectedRace = this.races.find((race) => race.name === raceName);
  }

  private syncSelectedClassFromForm(): void {
    const className = this.characterForm.get('characterClass')?.value;
    this.selectedClass = this.classes.find((cls) => cls.name === className);
  }

  private saveDraft(): void {
    this.persistenceService.saveCreatorDraft({
      currentStep: this.currentStep,
      formValue: this.characterForm.getRawValue()
    });
  }

  private restoreDraft(): void {
    const draft = this.persistenceService.loadCreatorDraft();
    if (!draft) {
      return;
    }

    this.characterForm.patchValue(draft.formValue);
    this.currentStep = Math.max(0, Math.min(this.maxStep, draft.currentStep));
  }

  private isAbilityStepInvalid(): boolean {
    this.abilityMethodError = '';

    const values = this.abilities.map((ability) => Number(this.characterForm.get(ability)?.value));
    if (values.some((v) => Number.isNaN(v))) {
      this.abilityMethodError = 'All ability scores must be numbers.';
      return true;
    }

    switch (this.abilityGenerationMethod) {
      case 'standardArray': {
        const sortedInput = [...values].sort((a, b) => b - a);
        const sortedStandard = [...this.standardArray].sort((a, b) => b - a);
        const valid = JSON.stringify(sortedInput) === JSON.stringify(sortedStandard);
        if (!valid) {
          this.abilityMethodError = 'Standard Array requires exactly: 15, 14, 13, 12, 10, 8 (each used once).';
        }
        return !valid;
      }
      case 'pointBuy': {
        const outOfRange = values.some((v) => v < 8 || v > 15);
        if (outOfRange) {
          this.abilityMethodError = 'Point Buy scores must stay between 8 and 15 before bonuses.';
          return true;
        }
        if (this.pointBuySpent > this.pointBuyBudget) {
          this.abilityMethodError = `Point Buy exceeds budget: spent ${this.pointBuySpent}/${this.pointBuyBudget}.`;
          return true;
        }
        return false;
      }
      default:
        return values.some((v) => v < 1 || v > 20);
    }
  }

  nextStep(): void {
    // Basic validation for current step before moving next
    switch (this.currentStep) {
      case 0: // Basic Info
        if (this.playerNameControl_?.invalid || this.characterNameControl_?.invalid) {
          this.playerNameControl_?.markAsTouched();
          this.characterNameControl_?.markAsTouched();
          return;
        }
        break;
      case 1: // Race Selection
        if (this.raceControl_?.invalid) {
          this.raceControl_?.markAsTouched();
          return;
        }
        break;
      case 2: // Class Selection
        if (this.characterClassControl_?.invalid) {
          this.characterClassControl_?.markAsTouched();
          return;
        }
        break;
      case 3: // Ability Scores
        if (this.isAbilityStepInvalid()) {
          this.strengthControl_?.markAsTouched();
          this.dexterityControl_?.markAsTouched();
          this.constitutionControl_?.markAsTouched();
          this.intelligenceControl_?.markAsTouched();
          this.wisdomControl_?.markAsTouched();
          this.charismaControl_?.markAsTouched();
          return;
        }
        break;
    }
    this.currentStep++;
    this.saveDraft();
  }

  previousStep(): void {
    this.currentStep--;
    this.saveDraft();
  }

  saveCharacter(): void {
    if (this.characterForm.valid) {
      const formValue = this.characterForm.value;

      const abilityScores: AbilityScores = {
        strength: formValue.strength,
        dexterity: formValue.dexterity,
        constitution: formValue.constitution,
        intelligence: formValue.intelligence,
        wisdom: formValue.wisdom,
        charisma: formValue.charisma,
      };

      const newCharacter: Character = {
        id: this.generateId(),
        playerName: formValue.playerName,
        characterName: formValue.characterName,
        ruleset: formValue.ruleset,
        abilityGenerationMethod: formValue.abilityGenerationMethod,
        race: formValue.race,
        characterClass: formValue.characterClass,
        level: 1, // Default to level 1 for now
        abilityScores: abilityScores,
        proficiencyBonus: 2, // Default to +2 for level 1
        armorClass: 10, // Placeholder, will be calculated later
        hitPoints: 10, // Placeholder, will be calculated later based on class hit die + Con modifier
        maxHitPoints: 10, // Placeholder
        speed: this.selectedRace?.speed || 30, // Default or from selected race
        initiative: this.getAbilityModifier(abilityScores.dexterity) ? parseInt(this.getAbilityModifier(abilityScores.dexterity)) : 0, // Dex modifier
        savingThrows: {
          strength: this.selectedClass?.proficiencies.savingThrows.includes('Strength') || false,
          dexterity: this.selectedClass?.proficiencies.savingThrows.includes('Dexterity') || false,
          constitution: this.selectedClass?.proficiencies.savingThrows.includes('Constitution') || false,
          intelligence: this.selectedClass?.proficiencies.savingThrows.includes('Intelligence') || false,
          wisdom: this.selectedClass?.proficiencies.savingThrows.includes('Wisdom') || false,
          charisma: this.selectedClass?.proficiencies.savingThrows.includes('Charisma') || false,
        },
        skills: { // All false by default, to be updated later with proficiency choices
          acrobatics: false, animalHandling: false, arcana: false, athletics: false, deception: false, history: false,
          insight: false, intimidation: false, investigation: false, medicine: false, nature: false, perception: false,
          performance: false, persuasion: false, religion: false, sleightOfHand: false, stealth: false, survival: false,
        },
        equipment: this.selectedClass?.startingEquipment || [],
        spells: [], // To be implemented
        features: this.selectedClass?.name ? [`${this.selectedClass.name} Features`] : [], // Placeholder
        traits: this.selectedRace?.traits.map(t => t.name) || [],
        languages: this.selectedRace?.languages || [],
      };

      this.persistenceService.appendCharacter(newCharacter);

      console.log('Character saved successfully!', newCharacter);
      alert('Character saved successfully!');
      this.characterForm.reset();
      this.characterForm.patchValue({
        ruleset: '2014',
        abilityGenerationMethod: 'standardArray'
      });
      this.applyStandardArrayPreset();
      this.currentStep = 0; // Reset to first step
      this.selectedRace = undefined;
      this.selectedClass = undefined;
      this.abilityMethodError = '';
      this.persistenceService.clearCreatorDraft();
    } else {
      console.log('Form is invalid. Please complete all required fields.');
      alert('Please complete all required fields and ensure ability scores are valid.');
      // Optionally, navigate to the first invalid step
      this.saveDraft();
    }
  }
}
