import { Routes } from '@angular/router';
import { MapCanvasComponent } from './canvas/map-canvas/map-canvas';
import { CharacterCreatorComponent } from './character/character-creator/character-creator.component';
import { CharacterViewerComponent } from './character/character-viewer/character-viewer.component';
import { HomeComponent } from './home/home';
import { CanvasShellComponent } from './canvas/canvas-shell/canvas-shell';



export const routes: Routes = [

  // HOME
  { path: '', component: HomeComponent },

  // CHARACTER (standalone pages)
  { path: 'character/create', component: CharacterCreatorComponent },
  { path: 'character/view', component: CharacterViewerComponent },
  { path: 'character/view/:id', component: CharacterViewerComponent },

  // VTT CANVAS LAYOUT
{
  path: 'canvas/:id',
  component: CanvasShellComponent,
  children: [

    { path: 'characters', component: CharacterViewerComponent },
    { path: 'create-character', component: CharacterCreatorComponent }

  ]
}
,

  { path: 'play/:id', redirectTo: 'canvas/:id' },

];


