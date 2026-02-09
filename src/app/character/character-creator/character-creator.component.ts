import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { CompendiumService } from '../../services/compendium.service';
import { RaceData, ClassData } from '../../services/compendium.service';
import { Character, AbilityScores } from '../../models/character.model';

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
  races: RaceData[] = [];
  classes: ClassData[] = [];
  selectedRace: RaceData | undefined;
  selectedClass: ClassData | undefined;
  currentStep: number = 0; // Track the current step

  constructor(private fb: FormBuilder, private compendiumService: CompendiumService) { }

  ngOnInit(): void {
    this.characterForm = this.fb.group({
      playerName: [null, Validators.required],
      characterName: [null, Validators.required],
      race: [null, Validators.required],
      characterClass: [null, Validators.required],
      strength: [8, [Validators.required, Validators.min(1), Validators.max(20)]],
      dexterity: [8, [Validators.required, Validators.min(1), Validators.max(20)]],
      constitution: [8, [Validators.required, Validators.min(1), Validators.max(20)]],
      intelligence: [8, [Validators.required, Validators.min(1), Validators.max(20)]],
      wisdom: [8, [Validators.required, Validators.min(1), Validators.max(20)]],
      charisma: [8, [Validators.required, Validators.min(1), Validators.max(20)]],
    });

    this.compendiumService.getRaces().subscribe(races => {
      this.races = races;
    });

    this.compendiumService.getClasses().subscribe(classes => {
      this.classes = classes;
    });

    this.characterForm.get('race')?.valueChanges.subscribe(raceName => {
      this.selectedRace = this.races.find(race => race.name === raceName);
    });

    this.characterForm.get('characterClass')?.valueChanges.subscribe(className => {
      this.selectedClass = this.classes.find(cls => cls.name === className);
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

  nextStep(): void {
    // Basic validation for current step before moving next
    switch (this.currentStep) {
      case 0: // Basic Info
        if (this.isPlayerNameInvalidAndTouched || this.isCharacterNameInvalidAndTouched) {
          this.playerNameControl_?.markAsTouched();
          this.characterNameControl_?.markAsTouched();
          return;
        }
        break;
      case 1: // Race Selection
        if (this.isRaceInvalidAndTouched) {
          this.raceControl_?.markAsTouched();
          return;
        }
        break;
      case 2: // Class Selection
        if (this.isCharacterClassInvalidAndTouched) {
          this.characterClassControl_?.markAsTouched();
          return;
        }
        break;
      case 3: // Ability Scores
        if (this.isStrengthInvalidAndTouched || this.isDexterityInvalidAndTouched ||
            this.isConstitutionInvalidAndTouched || this.isIntelligenceInvalidAndTouched ||
            this.isWisdomInvalidAndTouched || this.isCharismaInvalidAndTouched) {
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
  }

  previousStep(): void {
    this.currentStep--;
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

      const characters = JSON.parse(localStorage.getItem('characters') || '[]') as Character[];
      characters.push(newCharacter);
      localStorage.setItem('characters', JSON.stringify(characters));

      console.log('Character saved successfully!', newCharacter);
      alert('Character saved successfully!');
      this.characterForm.reset(); // Clear the form after saving
      this.currentStep = 0; // Reset to first step
      this.selectedRace = undefined;
      this.selectedClass = undefined;
    } else {
      console.log('Form is invalid. Please complete all required fields.');
      alert('Please complete all required fields and ensure ability scores are valid.');
      // Optionally, navigate to the first invalid step
    }
  }
}
