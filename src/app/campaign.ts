export interface Campaign {
  id: string;
  name: string;
  description: string;

  cover: string;        // NEW

  createdAt: number;
  lastOpened: number;

  tokens: any[];
  map?: string;
}
