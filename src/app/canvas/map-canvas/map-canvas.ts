import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StageConfig } from 'konva/lib/Stage';
import { LineConfig } from 'konva/lib/shapes/Line';
import { ImageConfig } from 'konva/lib/shapes/Image';
import { CircleConfig } from 'konva/lib/shapes/Circle';



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

export class MapCanvasComponent {

  configStage: StageConfig = {
    width: window.innerWidth,
    height: window.innerHeight,
    draggable: true,
  };

  gridSize = 50;
  gridOriginX = 0;
gridOriginY = 0;

  scale = 1;
  readonly minScale = 0.5;
  readonly maxScale = 2.5;
  readonly scaleBy = 1.1;
  mapImageConfig?: ImageConfig;
  private mapImageElement?: HTMLImageElement;


  imageTokens: TokenConfig[] = [];

  selectedTokenIndex: number | null = null;

  onTokenClick(index: number): void {
    console.log('[TOKEN CLICK]', index);
    this.selectedTokenIndex = index;
  }

  get selectedToken() {
    return this.selectedTokenIndex !== null
      ? this.imageTokens[this.selectedTokenIndex]
      : null;
  }




get selectedCellX(): number {
  if (this.selectedTokenIndex === null) return 0;

  const stage = (window as any).Konva?.stages?.[0];
  if (!stage) return 0;

  const token = this.imageTokens[this.selectedTokenIndex];
  const node = stage.findOne((n: any) => n.attrs.id === token.id);
  if (!node) return 0;

  const grid = this.gridSize;
  const scale = stage.scaleX();
  const stagePos = stage.position();

  const worldX = (node.x() - stagePos.x) / scale;

  return Math.floor((worldX - grid / 2) / grid) * grid;
}

get selectedCellY(): number {
  if (this.selectedTokenIndex === null) return 0;

  const stage = (window as any).Konva?.stages?.[0];
  if (!stage) return 0;

  const token = this.imageTokens[this.selectedTokenIndex];
  const node = stage.findOne((n: any) => n.attrs.id === token.id);
  if (!node) return 0;

  const grid = this.gridSize;
  const scale = stage.scaleY();
  const stagePos = stage.position();

  const worldY = (node.y() - stagePos.y) / scale;

  return Math.floor((worldY - grid / 2) / grid) * grid;
}








forceHighlight() {
  this.selectedTokenIndex = this.selectedTokenIndex;
}










  gridLines: LineConfig[] = [];

  constructor() {
    this.buildGrid();
    this.loadMapImage('/maps/bmapTemp.jpg');
    this.addImageToken('/tokens/hero.jpg', 2, 2);

  }


  private buildGrid(): void {
    const GRID_EXTENT = 5000; // big enough for zooming & panning
    const lines: LineConfig[] = [];

    // vertical lines
    for (let x = -GRID_EXTENT; x <= GRID_EXTENT; x += this.gridSize) {
      lines.push({
        points: [x, -GRID_EXTENT, x, GRID_EXTENT],
        stroke: '#888',
        strokeWidth: 1,
        listening: false,
      });
    }

    // horizontal lines
    for (let y = -GRID_EXTENT; y <= GRID_EXTENT; y += this.gridSize) {
      lines.push({
        points: [-GRID_EXTENT, y, GRID_EXTENT, y],
        stroke: '#888',
        strokeWidth: 1,
        listening: false,
      });
    }

    this.gridLines = lines;
  }




  onWheel(event: WheelEvent): void {
    event.preventDefault();

    // Get the Konva stage (first one on the page)
    const stage = (window as any).Konva?.stages?.[0];
    if (!stage) return;

    const oldScale = stage.scaleX();
    const scaleBy = 1.1;

    const newScale =
      event.deltaY < 0
        ? oldScale * scaleBy
        : oldScale / scaleBy;

    const clampedScale = Math.max(0.5, Math.min(2.5, newScale));

    stage.scale({ x: clampedScale, y: clampedScale });
    stage.batchDraw();
  }


  loadMapImage(src: string): void {
    const img = new Image();
    img.src = src;

    img.onload = () => {
      this.mapImageElement = img;

      this.mapImageConfig = {
        image: img,
        x: 0,
        y: 0,
        width: img.width,
        height: img.height,
        listening: false, // map should not block interactions
      };
    };
  }

  private centerMapOnStage(img: HTMLImageElement): { x: number; y: number } {
    const stageWidth = this.configStage.width!;
    const stageHeight = this.configStage.height!;

    return {
      x: (stageWidth - img.width) / 2,
      y: (stageHeight - img.height) / 2,
    };
  }

  onTokenDragStart(index: number): void {
    console.log(
      '[DRAG START]',
      'index =', index,
      'token =', this.imageTokens[index]
    );

    this.selectedTokenIndex = index;
  }









onTokenDragEnd(event: any): void {
  this.imageTokens = [...this.imageTokens];
}


















  addImageToken(src: string, gridX: number, gridY: number): void {
    const img = new Image();
    img.src = src;

    img.onload = () => {
      const size = this.gridSize;

      // create token FIRST so closures work
const token: TokenConfig = {
  id: 'token-' + Math.random().toString(36).substring(2, 9),

  image: img,

  x: gridX * size + size / 2,
  y: gridY * size + size / 2,

  width: size,
  height: size,

  offsetX: size / 2,
  offsetY: size / 2,

  draggable: true,
  listening: true,

  name: 'token',
};



      // 🔑 SNAP + STATE SYNC IN ONE PLACE
token.dragBoundFunc = (pos: { x: number; y: number }) => {
  const stage = (window as any).Konva?.stages?.[0];
  if (!stage) return pos;

  const scale = stage.scaleX();
  const stagePos = stage.position();
  const grid = this.gridSize;

  // 🔹 convert screen → world
  const worldX = (pos.x - stagePos.x) / scale;
  const worldY = (pos.y - stagePos.y) / scale;

  // 🔹 snap in WORLD space
const snappedWorldX =
  Math.floor((worldX - this.gridOriginX) / grid) * grid +
  grid / 2 +
  this.gridOriginX;

const snappedWorldY =
  Math.floor((worldY - this.gridOriginY) / grid) * grid +
  grid / 2 +
  this.gridOriginY;



  // convert back to screen only for Konva render
  return {
    x: snappedWorldX * scale + stagePos.x,
    y: snappedWorldY * scale + stagePos.y,
  };
};


      this.imageTokens.push(token);
    };
  }






  selectToken(index: number): void {
    this.selectedTokenIndex = index;
  }

  onStageClick(event: any): void {
    const clickedOnStage =
      event?.target === event?.target?.getStage?.();

    if (clickedOnStage) {
      this.selectedTokenIndex = null;
    }
  }


  clearSelection(): void {
    this.selectedTokenIndex = null;
  }

  getLiveTokenPosition(token: any) {
  const stage = (window as any).Konva?.stages?.[0];
  if (!stage) return { x: token.x, y: token.y };

  const node = stage.findOne((n: any) => n.attrs.image === token.image);
  if (!node) return { x: token.x, y: token.y };

  const scale = stage.scaleX();
  const stagePos = stage.position();

  const worldX = (node.x() - stagePos.x) / scale;
  const worldY = (node.y() - stagePos.y) / scale;

  return { x: worldX, y: worldY };
}




}

interface TokenConfig extends ImageConfig {
  id: string;
}
