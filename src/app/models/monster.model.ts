export interface MonsterData {
  id: string;
  name: string;
  image: string;
  size: 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan';
  type: string;
  ac: number;
  hp: number;
  speed: string;
  cr: string;
}
