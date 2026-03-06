export type TokenSize = 'medium' | 'large' | 'huge' | 'gargantuan';

export interface TokenData {
  id: string;
  name: string;
  image: string;
  imageId?: string;
  size: TokenSize;
  crop?: {
  offsetX: number;
  offsetY: number;
  zoom: number;
};

}
