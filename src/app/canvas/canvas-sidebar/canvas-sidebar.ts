import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TokenService } from '../../services/token.service';
import { TokenData } from '../../models/token.model';
import { FormsModule } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';



@Component({
  selector: 'app-canvas-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './canvas-sidebar.html',
  styleUrls: ['./canvas-sidebar.scss']
})
export class CanvasSidebarComponent {

  name = '';
  image = '';
  search = '';

  size: TokenData['size'] = 'medium';

  tokens!: any;

  mode: 'tokens' | 'characters' | 'pdfs' | 'music' | 'settings' = 'tokens';

setMode(m: any) {
  this.mode = m;
}


  constructor(private tokenService: TokenService, private cdr: ChangeDetectorRef) {
    this.tokens = this.tokenService.tokens;
  }

onFile(e: any) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {

    // wrap in timeout → forces Angular update cycle
    setTimeout(() => {
      this.image = reader.result as string;

      // double ensure UI refresh
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    });
  };

  reader.readAsDataURL(file);
}

get filteredTokens() {
  const term = this.search.trim().toLowerCase();

  if (!term) return this.tokens();

  const words: string[] = term.split(' ').filter((w: string) => w);

  return this.tokens().filter((t: any) => {

    const name: string = t.name.toLowerCase();

    return words.every((w: string) =>
      name.split(' ').some((nw: string) => nw.startsWith(w))
    );

  });
}





create() {
  if (!this.image) {
    alert('Please select image first');
    return;
  }

  const token = {
    id: crypto.randomUUID(),
    name: this.name || 'Token',
    image: this.image,
    size: this.size
  };

  this.tokenService.add(token);

  // -------- RESET FORM --------

  this.name = '';
  this.size = 'medium';
  this.image = '';

  // reset file input element
  const fileInput =
    document.querySelector('input[type="file"]') as HTMLInputElement;

  if (fileInput) {
    fileInput.value = '';
  }

  this.cdr.detectChanges();
}



  delete(id: string) {
    this.tokenService.remove(id);
  }

  dragStart(e: DragEvent, token: TokenData) {
    e.dataTransfer?.setData('token', JSON.stringify(token));
  }
}

