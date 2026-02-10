import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-canvas-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './canvas-sidebar.html',
  styleUrls: ['./canvas-sidebar.scss']
})
export class CanvasSidebarComponent {

  // later we will emit real tokens
  createTestToken() {
    console.log('Create token clicked');
  }

}
