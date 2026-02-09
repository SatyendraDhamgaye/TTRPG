import { Routes } from '@angular/router';
import { MapCanvasComponent } from './canvas/map-canvas/map-canvas';
import { CharacterCreatorComponent } from './character/character-creator/character-creator.component';
import { CharacterViewerComponent } from './character/character-viewer/character-viewer.component';

export const routes: Routes = [
    { path: '', component: MapCanvasComponent, pathMatch: 'full' },
    { path: 'character/create', component: CharacterCreatorComponent },
    { path: 'character/view', component: CharacterViewerComponent },
    { path: 'character/view/:id', component: CharacterViewerComponent }, // Optional: View specific character by ID
];
