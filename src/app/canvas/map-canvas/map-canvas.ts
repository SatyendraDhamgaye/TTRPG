import { Component, AfterViewInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StageConfig } from 'konva/lib/Stage';
import Konva from 'konva';

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
export class MapCanvasComponent implements AfterViewInit, OnChanges {

  // 👇 campaign now comes from shell (not router)
  @Input() campaignId: string | null = null;

  configStage: StageConfig = {
    width: window.innerWidth,
    height: window.innerHeight,
    draggable: true,
  };

  private tokensLoaded = false;

  gridSize = 100;

  mapWidth = 0;
  mapHeight = 0;


  stage!: Konva.Stage;

  mapLayer!: Konva.Layer;
  gridLayer!: Konva.Layer;
  highlightLayer!: Konva.Layer;
  tokenLayer!: Konva.Layer;

  transformer!: Konva.Transformer;
  selectedToken: Konva.Group | null = null;

  constructor(
    private store: CampaignStorageService,
    private tokenService: TokenService
  ) { }

  // ================= LIFECYCLE =================

  ngAfterViewInit() {

    // wait until ng2-konva actually registers stage
    setTimeout(() => {
      this.initKonva();

      if (this.campaignId) {
        this.tokenService.setCampaign(this.campaignId);
        this.loadPlacedTokens();
      }
    }, 200);
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      this.onKeyDown(e);
    });

  }

  onKeyDown(event: KeyboardEvent) {

    if (event.key !== 'Delete') return;

    const active = document.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
      return;
    }

    if (!this.selectedToken) return;

    // remove transformer first
    if (this.transformer) {
      this.transformer.destroy();
    }

    // remove token
    this.selectedToken.destroy();
    this.selectedToken = null;

    this.tokenLayer.draw();

    this.savePlacedTokens();
  }





  ngOnChanges(changes: SimpleChanges) {

    if (!changes['campaignId'] || !this.campaignId) return;

    this.tokensLoaded = false;
    this.tokenService.setCampaign(this.campaignId);

    // 👉 only load if konva already ready
    if (this.tokenLayer) {
      this.loadPlacedTokens();
    } else {
      // wait until initKonva finishes
      setTimeout(() => this.loadPlacedTokens(), 250);
    }
  }


  // ================= INIT =================

  initKonva() {
    if (!(window as any).Konva?.stages?.length) {
      console.warn('Konva stage not ready yet');
      return;
    }
    Konva.pixelRatio = window.devicePixelRatio || 1;

    this.stage = (window as any).Konva.stages[0];
    // dark background like Roll20
    this.stage.container().style.backgroundColor = '#13151c';



    const layers = this.stage.getLayers();

    this.mapLayer = layers[0];
    this.gridLayer = layers[1];
    this.highlightLayer = layers[2];
    this.tokenLayer = layers[3];

    this.buildGrid();
    this.loadMap();

    this.stage.on('mousedown', (e: any) => {
      if (e.target === this.stage) {
        this.selectedToken = null;
        this.updateHighlight();
      }
    });

    window.addEventListener('resize', () => this.onResize());
  }

  updateGridSize(newSize: number) {
    this.gridSize = newSize;

    this.buildGrid();

    // re-snap all tokens to new grid
    this.tokenLayer.getChildren().forEach((g: any) => {
      this.snapGroup(g);
    });

    this.tokenLayer.draw();
  }


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


  // ================= LOAD / SAVE =================

  loadPlacedTokens() {


    if (this.tokensLoaded) {
      console.log('Tokens already loaded. Skipping.');
      return;
    }

    if (!this.tokenLayer) return;
    if (!this.campaignId) return;

    this.tokensLoaded = true;

    // ---- SAFETY ----
    if (!this.tokenLayer) {
      console.log('Token layer not ready yet');
      return;
    }

    if (!this.campaignId) return;

    const camp = this.store.get(this.campaignId);

    console.log('Loading campaign →', camp);

    if (!camp?.board?.tokens) {
      console.log('No tokens stored for campaign');
      return;
    }

    // clear old tokens
    this.tokenLayer.destroyChildren();

    // get token library from sidebar service
    const library = this.tokenService.tokens();

    console.log('Token library →', library);
    console.log('Placed tokens →', camp.board.tokens);

    camp.board.tokens.forEach((t: any) => {

  const img = new Image();

  if (t.type === 'monster' && t.data) {
    img.src = t.data.image;
  } else {
    const meta = library.find((x: any) => x.id === t.id);
    img.src = meta?.image || '/tokens/default.png';
  }

  img.onload = () => {

    const sharp = this.prepareTokenImage(img);

    sharp.onload = () => {

      const group = this.createToken(
        t.x,
        t.y,
        sharp,
        t.id
      );

      group.scale({
        x: t.cells,
        y: t.cells
      });

      (group as any).attrs.entityType = t.type;
      (group as any).attrs.entityData = t.data;
    };
  };
});

  }



  savePlacedTokens() {
    if (!this.campaignId) return;

    const placed: any[] = [];

    this.tokenLayer.getChildren().forEach((g: any) => {
      const scale = g.scaleX();
      const cells = Math.round(scale);

      placed.push({
        id: (g as any).attrs.tokenId,
        type: (g as any).attrs.entityType || 'token',
        x: g.x(),
        y: g.y(),
        cells,
        data: (g as any).attrs.entityData || null
      });

    });

    this.store.updateBoard(this.campaignId, {
      tokens: placed
    });
  }

  // ================= GRID =================

  buildGrid() {

    if (!this.mapWidth || !this.mapHeight) return;

    this.gridLayer.destroyChildren();

    // vertical lines
    for (let x = 0; x <= this.mapWidth; x += this.gridSize) {
      const line = new Konva.Line({
        points: [x, 0, x, this.mapHeight],
        stroke: '#888',
        strokeWidth: 1,
      });

      this.gridLayer.add(line);
    }

    // horizontal lines
    for (let y = 0; y <= this.mapHeight; y += this.gridSize) {
      const line = new Konva.Line({
        points: [0, y, this.mapWidth, y],
        stroke: '#888',
        strokeWidth: 1,
      });

      this.gridLayer.add(line);
    }

    this.gridLayer.draw();
  }


  // ================= MAP =================

  loadMap() {
    const img = new Image();
    img.src = '/maps/battleMap001.jpeg';

    img.onload = () => {

      this.mapWidth = img.width;
      this.mapHeight = img.height;

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

      // rebuild grid AFTER map loads
      this.buildGrid();
    };
  }


  // ================= IMAGE PREP =================

  prepareTokenImage(source: HTMLImageElement): HTMLImageElement {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    const target = 256;

    canvas.width = target;
    canvas.height = target;

    ctx.imageSmoothingEnabled = true;

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

  // ================= TOKEN CREATION =================

  createToken(x: number, y: number, img: HTMLImageElement, tokenId?: string) {

    const size = this.gridSize;

    const group = new Konva.Group({
      x,
      y,
      draggable: true,
    });

    (group as any).attrs.tokenId = tokenId;

    const image = new Konva.Image({
      image: img,
      x: -size / 2,
      y: -size / 2,
      width: size,
      height: size,
      imageSmoothingEnabled: false,
      perfectDrawEnabled: true,
    });

    group.add(image);

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
      this.savePlacedTokens();
    });

    group.on('transformend', () => {

      const rawScale = group.scaleX();
      const snappedCells = Math.max(1, Math.min(4, Math.round(rawScale)));

      group.scale({
        x: snappedCells,
        y: snappedCells
      });

      this.snapGroup(group);
      this.savePlacedTokens();
    });


    this.tokenLayer.add(group);
    this.tokenLayer.draw();

    return group;
  }

  // ================= SELECTION =================

  selectToken(group: Konva.Group) {
    this.selectedToken = group;
    this.attachTransformer(group);

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
      enabledAnchors: [
        'top-left',
        'top-right',
        'bottom-left',
        'bottom-right'
      ],
      rotateEnabled: false,
      keepRatio: true,
      ignoreStroke: true,
      borderStroke: '#4a90e2',
      anchorFill: '#4a90e2',
      anchorSize: 8,
    });

    this.tokenLayer.add(this.transformer);
    this.transformer.moveToTop();
    this.tokenLayer.draw();
  }

  // ================= POSITION =================

  snapGroup(group: Konva.Group) {
    const pos = group.position();

    const scale = group.scaleX();
    const cells = Math.round(scale);

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

  updateHighlight() { }

  // ================= ZOOM =================

  onResize() {
    this.stage.width(window.innerWidth);
    this.stage.height(window.innerHeight);
    this.stage.draw();
  }

  // ================= DRAG DROP =================

  allowDrop(e: DragEvent) {
    e.preventDefault();
  }

  onDrop(e: DragEvent) {
    e.preventDefault();

    const data = e.dataTransfer?.getData('token');
    if (!data) return;

    const token: TokenData = JSON.parse(data);

    // find real image from token library
    const lib = this.tokenService.tokens();
    const meta = lib.find(x => x.id === token.id);

    const img = new Image();
    img.src = meta?.image || token.image;

    img.onload = () => {

      const sharp = this.prepareTokenImage(img);

      sharp.onload = () => {

        // convert mouse position to world coordinates
        const pointer = this.stage.getPointerPosition();
        if (!pointer) return;

        const pos = this.stage.getRelativePointerPosition();
        if (!pos) return;


        // determine cell size (1–4 etc)
        const cells = this.tokenService.sizeToCells(token.size);

        // create token at world position
        const group = this.createToken(
          pos.x,
          pos.y,
          sharp,
          token.id
        );
        (group as any).attrs.entityType = 'monster';
(group as any).attrs.entityData = token; // store full monster data


        // apply integer scale directly (no float math)
        group.scale({
          x: cells,
          y: cells
        });

        // snap after scaling
        this.snapGroup(group);

        this.tokenLayer.draw();
        this.savePlacedTokens();
      };
    };
  }

}
