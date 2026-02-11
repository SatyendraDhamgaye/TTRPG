export interface Campaign {

  id: string;

  name: string;
  description: string;

  cover: string;

  createdAt: number;
  lastOpened: number;

  // legacy – can be removed later
  tokens: any[];

  // 👉 NEW BOARD STRUCTURE
  board?: {
    tokens: {
      x: number;
      y: number;
      cells: number;
    }[];

    map: string | null;

    version: number;
  };
}
