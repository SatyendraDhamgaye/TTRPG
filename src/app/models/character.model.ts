export interface AbilityScores {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export interface Character {
  id: string;
  playerName: string;
  characterName: string;
  race: string; // Name of the race
  characterClass: string; // Name of the class
  level: number;
  abilityScores: AbilityScores;
  // Calculated ability modifiers could be a getter or derived
  proficiencyBonus: number;
  armorClass: number;
  hitPoints: number;
  maxHitPoints: number;
  speed: number;
  initiative: number;
  savingThrows: {
    strength: boolean;
    dexterity: boolean;
    constitution: boolean;
    intelligence: boolean;
    wisdom: boolean;
    charisma: boolean;
  };
  skills: {
    acrobatics: boolean;
    animalHandling: boolean;
    arcana: boolean;
    athletics: boolean;
    deception: boolean;
    history: boolean;
    insight: boolean;
    intimidation: boolean;
    investigation: boolean;
    medicine: boolean;
    nature: boolean;
    perception: boolean;
    performance: boolean;
    persuasion: boolean;
    religion: boolean;
    sleightOfHand: boolean;
    stealth: boolean;
    survival: boolean;
  };
  equipment: string[]; // List of equipment names
  spells: string[]; // List of spell names
  features: string[]; // List of racial/class features
  traits: string[]; // List of racial traits
  languages: string[]; // List of languages
  // Add more as needed, e.g., background, alignment, personality traits
}