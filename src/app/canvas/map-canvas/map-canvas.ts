import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StageConfig } from 'konva/lib/Stage';
import Konva from 'konva';
import { ActivatedRoute } from '@angular/router';
import { CampaignStorageService } from '../../campaign-storage.service';


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
})
export class MapCanvasComponent implements AfterViewInit {

  configStage: StageConfig = {
    width: window.innerWidth,
    height: window.innerHeight,
    draggable: true,
  };

  gridSize = 50;

  stage!: Konva.Stage;
  mapLayer!: Konva.Layer;
  gridLayer!: Konva.Layer;
  highlightLayer!: Konva.Layer;
  tokenLayer!: Konva.Layer;

  selectedToken: Konva.Image | null = null;

  ngAfterViewInit() {
    this.initKonva();

    const id = this.route.snapshot.paramMap.get('id');

if (id) {
  const camps = this.store.getAll();
  const camp = camps.find(c => c.id === id);

  if (camp) {
    console.log('Loaded campaign', camp);

    // later we will load:
    // camp.tokens
    // camp.map
  }
}

  }

  
  constructor(
  private route: ActivatedRoute,
  private store: CampaignStorageService
) {}


  // =====================================================
  // INITIALIZATION
  // =====================================================

  initKonva() {
    this.stage = (window as any).Konva.stages[0];

    const layers = this.stage.getLayers();

    this.mapLayer = layers[0];
    this.gridLayer = layers[1];
    this.highlightLayer = layers[2];
    this.tokenLayer = layers[3];

    this.buildGrid();
    this.loadMap();
    this.addToken();

    window.addEventListener('resize', () => this.onResize());
  }

  // =====================================================
  // GRID
  // =====================================================

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

  // =====================================================
  // MAP
  // =====================================================

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

  // =====================================================
  // TOKENS
  // =====================================================

  addToken() {
    const img = new Image();
    img.src = '/tokens/hero.jpg';

    img.onload = () => {
      const token = new Konva.Image({
        image: img,

        x: 2 * this.gridSize + this.gridSize / 2,
        y: 2 * this.gridSize + this.gridSize / 2,

        width: this.gridSize,
        height: this.gridSize,

        offsetX: this.gridSize / 2,
        offsetY: this.gridSize / 2,

        draggable: true,
      });

      token.on('click', () => {
        this.selectedToken = token;
        this.drawHighlight();
      });

      token.on('dragmove', () => {
        this.snapToken(token);
        this.drawHighlight();
      });

      this.tokenLayer.add(token);
      this.tokenLayer.draw();
    };
  }

  snapToken(token: Konva.Image) {
    const pos = token.position();

    const snappedX =
      Math.floor(pos.x / this.gridSize) * this.gridSize +
      this.gridSize / 2;

    const snappedY =
      Math.floor(pos.y / this.gridSize) * this.gridSize +
      this.gridSize / 2;

    token.position({ x: snappedX, y: snappedY });
  }

  // =====================================================
  // HIGHLIGHT
  // =====================================================

  drawHighlight() {
    this.highlightLayer.destroyChildren();

    if (!this.selectedToken) return;

    const pos = this.selectedToken.position();

    const rect = new Konva.Rect({
      x: pos.x - this.gridSize / 2,
      y: pos.y - this.gridSize / 2,
      width: this.gridSize,
      height: this.gridSize,
      stroke: 'gold',
      strokeWidth: 4,
      dash: [6, 4],
    });

    this.highlightLayer.add(rect);
    this.highlightLayer.draw();
  }

  // =====================================================
  // ZOOM
  // =====================================================

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
}
