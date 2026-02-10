import { Routes } from '@angular/router';
import { MapCanvasComponent } from './canvas/map-canvas/map-canvas';
import { HomeComponent } from './home/home';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'play/:id', component: MapCanvasComponent },
];
