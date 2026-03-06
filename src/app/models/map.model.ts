export interface GameMap {
  id: string;
  name: string;
  image: string;
  imageId?: string;
  gridSize?: number;
  createdAt: number;
  campaignId: string;
}
