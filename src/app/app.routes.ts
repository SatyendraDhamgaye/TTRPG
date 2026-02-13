import { Routes } from '@angular/router';
import { CanvasShellComponent } from './canvas/canvas-shell/canvas-shell';
import { CharacterCreatorComponent } from './character/character-creator/character-creator.component';
import { CharacterViewerComponent } from './character/character-viewer/character-viewer.component';
import { HomeComponent } from './home/home';

// Central route table for top-level navigation.
export const routes: Routes = [
  // Landing page for campaign management.
  { path: '', component: HomeComponent },

  // Character tools.
  { path: 'character/create', component: CharacterCreatorComponent },
  { path: 'character/view', component: CharacterViewerComponent },
  { path: 'character/view/:id', component: CharacterViewerComponent },

  // Main VTT shell for a selected campaign.
  {
    path: 'canvas/:id',
    component: CanvasShellComponent,
    children: [
      { path: 'characters', component: CharacterViewerComponent },
      { path: 'create-character', component: CharacterCreatorComponent }
    ]
  },

  // Legacy alias kept for backward compatibility.
  { path: 'play/:id', redirectTo: 'canvas/:id' }
];