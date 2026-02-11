import { Injectable, signal } from '@angular/core';
import { TokenData } from '../models/token.model';

@Injectable({
  providedIn: 'root'
})
export class TokenService {

  tokens = signal<TokenData[]>([]);

  add(token: TokenData) {
    this.tokens.update(t => [...t, token]);
  }

  remove(id: string) {
    this.tokens.update(t => t.filter(x => x.id !== id));
  }

  sizeToCells(size: string): number {
    switch(size) {
      case 'medium': return 1;
      case 'large': return 2;
      case 'huge': return 3;
      case 'gargantuan': return 4;
      default: return 1;
    }
  }
}
