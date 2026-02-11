interface Monster {
  name: string;
  size: 'M'|'L'|'H'|'G';
  type: string;
  ac: number;
  hp: number;
  speed: any;
  abilities: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  actions: any[];
}
