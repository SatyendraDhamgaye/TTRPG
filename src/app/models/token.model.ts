export type TokenSize = 'medium' | 'large' | 'huge' | 'gargantuan';

export interface TokenData {
  id: string;
  name: string;
  image: string;
  size: TokenSize;
}
