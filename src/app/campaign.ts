import { TokenData } from './models/token.model';

export interface BoardTokenState {
  id: string;
  type: 'token' | 'monster';
  x: number;
  y: number;
  cells: number;
  data: TokenData | null;
}

export interface CampaignBoard {
  tokens: BoardTokenState[];
  map: string | null;
  version: number;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  cover: string;
  createdAt: number;
  lastOpened: number;

  // Legacy field preserved for older localStorage payloads.
  tokens: unknown[];

  // Current board state used by canvas rendering.
  board?: CampaignBoard;
}
