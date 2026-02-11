import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StageConfig } from 'konva/lib/Stage';
import Konva from 'konva';
import { ActivatedRoute } from '@angular/router';
import { CampaignStorageService } from '../../campaign-storage.service';
import { TokenService } from '../../services/token.service';
import { TokenData } from '../../models/token.model';

import {
  StageComponent,
  CoreShapeComponent,
} from 'ng2-konva';

@Component({
  selector: 'app-map-canvas',
  standalone: true,
  imports: [
    CommonModule,
    StageComponent,
    CoreShapeComponent,
  ],
  templateUrl: './map-canvas.html',
  styleUrls: ['./map-canvas.scss'],
})
export class MapCanvasComponent implements AfterViewInit {

  // ---------------- STAGE CONFIG ----------------

  configStage: StageConfig = {
    width: window.innerWidth,
    height: window.innerHeight,
    draggable: true,
  };

  gridSize = 100;

  // ---------------- KONVA REFERENCES ----------------

  stage!: Konva.Stage;

  mapLayer!: Konva.Layer;
  gridLayer!: Konva.Layer;
  highlightLayer!: Konva.Layer;
  tokenLayer!: Konva.Layer;

  transformer!: Konva.Transformer;

  selectedToken: Konva.Group | null = null;

  // ---------------- LIFECYCLE ----------------

  constructor(
    private route: ActivatedRoute,
    private store: CampaignStorageService,
    private tokenService: TokenService
  ) {}

  ngAfterViewInit() {
    this.initKonva();
    this.loadCampaignFromRoute();
  }

  // ---------------- INIT ----------------

  initKonva() {
    Konva.pixelRatio = window.devicePixelRatio || 1;

    this.stage = (window as any).Konva.stages[0];

    const layers = this.stage.getLayers();

    this.mapLayer = layers[0];
    this.gridLayer = layers[1];
    this.highlightLayer = layers[2];
    this.tokenLayer = layers[3];

    this.buildGrid();
    this.loadMap();
    this.spawnTestToken();

    // deselect on empty click
    this.stage.on('mousedown', (e: any) => {
      if (e.target === this.stage) {
        this.selectedToken = null;
        this.updateHighlight();
      }
    });

    window.addEventListener('resize', () => this.onResize());
  }

  loadCampaignFromRoute() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    const camps = this.store.getAll();
    const camp = camps.find(c => c.id === id);

    if (camp) {
      console.log('Loaded campaign', camp);
    }
  }

  // ---------------- GRID ----------------

  buildGrid() {
    const extent = 5000;

    for (let x = -extent; x <= extent; x += this.gridSize) {
      const line = new Konva.Line({
        points: [x, -extent, x, extent],
        stroke: '#888',
        strokeWidth: 1,
      });

      this.gridLayer.add(line);
    }

    for (let y = -extent; y <= extent; y += this.gridSize) {
      const line = new Konva.Line({
        points: [-extent, y, extent, y],
        stroke: '#888',
        strokeWidth: 1,
      });

      this.gridLayer.add(line);
    }

    this.gridLayer.draw();
  }

  // ---------------- MAP ----------------

  loadMap() {
    const img = new Image();
    img.src = '/maps/battleMap001.jpeg';

    img.onload = () => {
      const map = new Konva.Image({
        image: img,
        x: 0,
        y: 0,
        width: img.width,
        height: img.height,
        listening: false,
      });

      this.mapLayer.add(map);
      this.mapLayer.draw();
    };
  }

  // ---------------- IMAGE PREP ----------------

  prepareTokenImage(source: HTMLImageElement): HTMLImageElement {

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    const target = 256;

    canvas.width = target;
    canvas.height = target;

    ctx.imageSmoothingEnabled = true;

    // center crop to square
    const size = Math.min(source.width, source.height);
    const sx = (source.width - size) / 2;
    const sy = (source.height - size) / 2;

    ctx.drawImage(
      source,
      sx, sy, size, size,
      0, 0, target, target
    );

    const out = new Image();
    out.src = canvas.toDataURL();

    return out;
  }

  // ---------------- TOKEN CREATION ----------------

  spawnTestToken() {
    const img = new Image();
    img.src = '/tokens/hero.jpg';

    img.onload = () => {
      const sharp = this.prepareTokenImage(img);

      sharp.onload = () => {
        this.createToken(
          2 * this.gridSize + this.gridSize / 2,
          2 * this.gridSize + this.gridSize / 2,
          sharp
        );
      };
    };
    
  }

createToken(x: number, y: number, img: HTMLImageElement) {

  const size = this.gridSize;

  const group = new Konva.Group({
    x,
    y,
    draggable: true,
  });

  // --------------------------------------------------
  // PLAIN SQUARE IMAGE TOKEN
  // --------------------------------------------------

  const image = new Konva.Image({
    
    image: img,

    x: -size / 2,
    y: -size / 2,
    width: size,
    height: size,

    // keep it sharp
    imageSmoothingEnabled: false,
    perfectDrawEnabled: true,
    
  });

  group.add(image);

  // --------------------------------------------------
  // EVENTS
  // --------------------------------------------------

  group.on('click', () => this.selectToken(group));

  group.on('dragstart', () => {
    this.selectToken(group);

    if (this.transformer) {
      this.transformer.visible(false);
    }
  });

  group.on('dragmove', () => {
    this.snapGroup(group);
  });

  group.on('dragend', () => {
    if (this.transformer) {
      this.transformer.visible(true);
    }
  });

  this.tokenLayer.add(group);
  this.tokenLayer.draw();

  return group;
}




  // ---------------- SELECTION & RESIZE ----------------

selectToken(group: Konva.Group) {
  this.selectedToken = group;
  this.attachTransformer(group);

  // ensure transformer is visible when selecting
  if (this.transformer) {
    this.transformer.visible(true);
    this.transformer.forceUpdate();
  }
}


 attachTransformer(group: Konva.Group) {

  if (this.transformer) {
    this.transformer.destroy();
  }

  this.transformer = new Konva.Transformer({
    nodes: [group],

    // only corner resize like Roll20
    enabledAnchors: [
      'top-left',
      'top-right',
      'bottom-left',
      'bottom-right'
    ],

    rotateEnabled: false,
    keepRatio: true,

    // important for clean hitbox
    ignoreStroke: true,
    borderStroke: '#4a90e2',
    anchorFill: '#4a90e2',
    anchorSize: 8,

    boundBoxFunc: (oldBox, newBox) => {

      // keep perfect square
      const size = Math.max(newBox.width, newBox.height);

      return {
        x: newBox.x,
        y: newBox.y,
        width: size,
        height: size,
        rotation: 0
      };
    }
  });

  // ---- SNAP RESIZE TO GRID ----
this.transformer.on('transformend', () => {

  // get screen size
  const box = group.getClientRect();

  // ---- CRITICAL FIX ----
  const stageScale = this.stage.scaleX();

  // convert back to world/grid pixels
  const current = box.width / stageScale;

  // convert to grid cells
  const cells = Math.round(current / this.gridSize);

  // clamp to D&D sizes
  const clamped = Math.min(4, Math.max(1, cells));

  const target = clamped * this.gridSize;

  const newScale = target / this.gridSize;

  group.scale({ x: newScale, y: newScale });

  this.snapGroup(group);
});


this.tokenLayer.add(this.transformer);
this.transformer.moveToTop();
this.tokenLayer.draw();

}


  // ---------------- POSITION ----------------

snapGroup(group: Konva.Group) {

  const pos = group.position();

  const stageScale = this.stage.scaleX();

  const scale = group.scaleX();
  const cells = Math.round(scale);

  // offset so large tokens center properly
  const offset = (cells - 1) * this.gridSize / 2;

  const snappedX =
    Math.floor((pos.x - offset) / this.gridSize) * this.gridSize +
    this.gridSize / 2 + offset;

  const snappedY =
    Math.floor((pos.y - offset) / this.gridSize) * this.gridSize +
    this.gridSize / 2 + offset;

  group.position({
    x: snappedX,
    y: snappedY
  });
}


  // ---------------- HIGHLIGHT ----------------

updateHighlight() {
  // no-op for now – transformer handles selection UI
}


  // ---------------- ZOOM ----------------

  onWheel(event: WheelEvent) {
    event.preventDefault();

    const oldScale = this.stage.scaleX();
    const scaleBy = 1.1;

    const newScale =
      event.deltaY < 0
        ? oldScale * scaleBy
        : oldScale / scaleBy;

    const clamped = Math.max(0.5, Math.min(2.5, newScale));

    this.stage.scale({ x: clamped, y: clamped });
    this.stage.draw();
  }

  onResize() {
    this.stage.width(window.innerWidth);
    this.stage.height(window.innerHeight);
    this.stage.draw();
  }

  allowDrop(e: DragEvent) {
  e.preventDefault();
}

onDrop(e: DragEvent) {
  e.preventDefault();

  const data = e.dataTransfer?.getData('token');
  if (!data) return;

  const token: TokenData = JSON.parse(data);

  const img = new Image();
  img.src = token.image;

  img.onload = () => {

    const sharp = this.prepareTokenImage(img);

    sharp.onload = () => {

      const cells =
        this.tokenService.sizeToCells(token.size);

      const size = cells * this.gridSize;

      const group = this.createToken(
        this.stage.getPointerPosition()!.x,
        this.stage.getPointerPosition()!.y,
        sharp
      );

      // force correct scale
      const scale = size / this.gridSize;
      group.scale({ x: scale, y: scale });

      this.snapGroup(group);
    };
  };
}


}
