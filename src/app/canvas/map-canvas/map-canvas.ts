import { AfterViewInit, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import Konva from 'konva';
import { StageConfig } from 'konva/lib/Stage';
import { CoreShapeComponent, StageComponent } from 'ng2-konva';

import { CampaignStorageService } from '../../campaign-storage.service';
import { TokenData } from '../../models/token.model';
import { TokenService } from '../../services/token.service';

interface PlacedEntity {
  id: string;
  type: 'token' | 'monster';
  x: number;
  y: number;
  cells: number;
  data: TokenData | null;
}

@Component({
  selector: 'app-map-canvas',
  standalone: true,
  imports: [CommonModule, StageComponent, CoreShapeComponent],
  templateUrl: './map-canvas.html',
  styleUrls: ['./map-canvas.scss']
})
export class MapCanvasComponent implements AfterViewInit, OnChanges {
  // Campaign id is provided by the shell route wrapper.
  @Input() campaignId: string | null = null;

  configStage: StageConfig = {
    width: window.innerWidth,
    height: window.innerHeight,
    draggable: true
  };

  gridSize = 100;
  mapWidth = 0;
  mapHeight = 0;

  private tokensLoaded = false;
  private readonly maxTokenCells = 4;

  private stage!: Konva.Stage;
  private mapLayer!: Konva.Layer;
  private gridLayer!: Konva.Layer;
  private tokenLayer!: Konva.Layer;
  private highlightLayer!: Konva.Layer;

  private transformer: Konva.Transformer | null = null;
  private selectedToken: Konva.Group | null = null;

  constructor(
    private readonly store: CampaignStorageService,
    private readonly tokenService: TokenService
  ) {}

  // Initialize Konva and campaign context after the view is rendered.
  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initKonva();

      if (this.campaignId) {
        this.tokenService.setCampaign(this.campaignId);
        this.loadPlacedTokens();
      }
    }, 200);

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('resize', this.onResize);
  }

  // React to campaign switches and reload board tokens.
  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['campaignId'] || !this.campaignId) {
      return;
    }

    this.tokensLoaded = false;
    this.tokenService.setCampaign(this.campaignId);

    if (this.tokenLayer) {
      this.loadPlacedTokens();
    } else {
      setTimeout(() => this.loadPlacedTokens(), 250);
    }
  }

  // Keyboard handler for deleting selected token.
  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Delete') {
      return;
    }

    const active = document.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
      return;
    }

    if (!this.selectedToken) {
      return;
    }

    this.transformer?.destroy();
    this.transformer = null;
    this.selectedToken.destroy();
    this.selectedToken = null;

    this.tokenLayer.draw();
    this.savePlacedTokens();
  };

  // Window resize handler to keep stage viewport in sync.
  private onResize = (): void => {
    if (!this.stage) {
      return;
    }

    this.stage.width(window.innerWidth);
    this.stage.height(window.innerHeight);
    this.stage.draw();
  };

  // Build references for layers and wire stage events.
  private initKonva(): void {
    const globalKonva = (window as any).Konva;
    if (!globalKonva?.stages?.length) {
      console.warn('Konva stage is not ready yet.');
      return;
    }

    Konva.pixelRatio = window.devicePixelRatio || 1;
    this.stage = globalKonva.stages[0];
    this.stage.container().style.backgroundColor = '#13151c';

    const layers = this.stage.getLayers();
    this.mapLayer = layers[0];
    this.gridLayer = layers[1];
    this.highlightLayer = layers[2];
    this.tokenLayer = layers[3];

    this.buildGrid();
    this.loadMap();

    this.stage.on('mousedown', (event: Konva.KonvaEventObject<MouseEvent>) => {
      if (event.target === this.stage) {
        this.selectedToken = null;
        this.updateHighlight();
      }
    });
  }

  // Update grid size and re-snap existing tokens.
  updateGridSize(newSize: number): void {
    this.gridSize = newSize;
    this.buildGrid();

    this.tokenLayer?.getChildren().forEach((node) => {
      if (node instanceof Konva.Group) {
        this.snapGroup(node);
      }
    });

    this.tokenLayer?.draw();
  }

  // Mouse wheel zoom with clamped min and max scale.
  onWheel(event: WheelEvent): void {
    event.preventDefault();

    const oldScale = this.stage.scaleX();
    const scaleBy = 1.1;
    const nextScale = event.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const clamped = Math.max(0.5, Math.min(2.5, nextScale));

    this.stage.scale({ x: clamped, y: clamped });
    this.stage.draw();
  }

  // Load placed token instances for the active campaign.
  private loadPlacedTokens(): void {
    if (this.tokensLoaded || !this.tokenLayer || !this.campaignId) {
      return;
    }

    const campaign = this.store.get(this.campaignId);
    if (!campaign?.board?.tokens) {
      this.tokensLoaded = true;
      return;
    }

    this.tokensLoaded = true;
    this.tokenLayer.destroyChildren();

    const library = this.tokenService.tokens();
    campaign.board.tokens.forEach((token: any) => {
      const image = new Image();

      if (token.type === 'monster' && token.data?.image) {
        image.src = token.data.image;
      } else {
        const meta = library.find((item) => item.id === token.id);
        image.src = meta?.image || '/tokens/default.png';
      }

      image.onload = () => {
        const prepared = this.prepareTokenImage(image);
        prepared.onload = () => {
          const group = this.createToken(token.x, token.y, prepared, token.id);
          group.scale({ x: token.cells, y: token.cells });
          (group as any).attrs.entityType = token.type;
          (group as any).attrs.entityData = token.data;
        };
      };
    });
  }

  // Persist placed token instances to campaign board state.
  private savePlacedTokens(): void {
    if (!this.campaignId) {
      return;
    }

    const placed: PlacedEntity[] = [];

    this.tokenLayer.getChildren().forEach((node) => {
      if (!(node instanceof Konva.Group)) {
        return;
      }

      const cells = Math.round(node.scaleX());
      placed.push({
        id: (node as any).attrs.tokenId,
        type: (node as any).attrs.entityType || 'token',
        x: node.x(),
        y: node.y(),
        cells,
        data: (node as any).attrs.entityData || null
      });
    });

    this.store.updateBoard(this.campaignId, { tokens: placed });
  }

  // Build grid lines based on loaded map dimensions.
  private buildGrid(): void {
    if (!this.mapWidth || !this.mapHeight || !this.gridLayer) {
      return;
    }

    this.gridLayer.destroyChildren();

    for (let x = 0; x <= this.mapWidth; x += this.gridSize) {
      this.gridLayer.add(
        new Konva.Line({
          points: [x, 0, x, this.mapHeight],
          stroke: '#888',
          strokeWidth: 1
        })
      );
    }

    for (let y = 0; y <= this.mapHeight; y += this.gridSize) {
      this.gridLayer.add(
        new Konva.Line({
          points: [0, y, this.mapWidth, y],
          stroke: '#888',
          strokeWidth: 1
        })
      );
    }

    this.gridLayer.draw();
  }

  // Load and render current map image.
  private loadMap(): void {
    const image = new Image();
    image.src = '/maps/battleMap001.jpeg';

    image.onload = () => {
      this.mapWidth = image.width;
      this.mapHeight = image.height;

      this.mapLayer.add(
        new Konva.Image({
          image,
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
          listening: false
        })
      );

      this.mapLayer.draw();
      this.buildGrid();
    };
  }

  // Normalize token image into a centered square texture.
  private prepareTokenImage(source: HTMLImageElement): HTMLImageElement {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const target = 256;

    canvas.width = target;
    canvas.height = target;

    if (!context) {
      return source;
    }

    context.imageSmoothingEnabled = true;

    const size = Math.min(source.width, source.height);
    const sx = (source.width - size) / 2;
    const sy = (source.height - size) / 2;
    context.drawImage(source, sx, sy, size, size, 0, 0, target, target);

    const output = new Image();
    output.src = canvas.toDataURL();
    return output;
  }

  // Create interactive token group and attach all token behavior.
  private createToken(x: number, y: number, image: HTMLImageElement, tokenId?: string): Konva.Group {
    const size = this.gridSize;

    const group = new Konva.Group({ x, y, draggable: true });
    (group as any).attrs.tokenId = tokenId;

    group.add(
      new Konva.Image({
        image,
        x: -size / 2,
        y: -size / 2,
        width: size,
        height: size,
        imageSmoothingEnabled: false,
        perfectDrawEnabled: true
      })
    );

    group.on('click', () => this.selectToken(group));

    group.on('dragstart', () => {
      this.selectToken(group);
      this.transformer?.visible(false);
    });

    group.on('dragmove', () => this.snapGroup(group));

    group.on('dragend', () => {
      this.transformer?.visible(true);
      this.savePlacedTokens();
    });

    group.on('transformend', () => {
      const snappedCells = Math.max(1, Math.min(this.maxTokenCells, Math.round(group.scaleX())));
      group.scale({ x: snappedCells, y: snappedCells });
      this.snapGroup(group);
      this.savePlacedTokens();
    });

    this.tokenLayer.add(group);
    this.tokenLayer.draw();
    return group;
  }

  // Select token and show transformer controls.
  private selectToken(group: Konva.Group): void {
    this.selectedToken = group;
    this.attachTransformer(group);
    this.transformer?.visible(true);
    this.transformer?.forceUpdate();
  }

  // Attach transformer handles to a single token group.
  private attachTransformer(group: Konva.Group): void {
    this.transformer?.destroy();

    this.transformer = new Konva.Transformer({
      nodes: [group],
      enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
      rotateEnabled: false,
      keepRatio: true,
      ignoreStroke: true,
      borderStroke: '#4a90e2',
      anchorFill: '#4a90e2',
      anchorSize: 8
    });

    this.tokenLayer.add(this.transformer);
    this.transformer.moveToTop();
    this.tokenLayer.draw();
  }

  // Snap token center based on current grid and token size.
  private snapGroup(group: Konva.Group): void {
    const pos = group.position();
    const cells = Math.round(group.scaleX());
    const offset = ((cells - 1) * this.gridSize) / 2;

    const snappedX =
      Math.floor((pos.x - offset) / this.gridSize) * this.gridSize + this.gridSize / 2 + offset;
    const snappedY =
      Math.floor((pos.y - offset) / this.gridSize) * this.gridSize + this.gridSize / 2 + offset;

    group.position({ x: snappedX, y: snappedY });
  }

  // Placeholder for future tile/range highlight overlays.
  private updateHighlight(): void {
    if (!this.highlightLayer) {
      return;
    }
  }

  // Allow external drag source to drop token payloads.
  allowDrop(event: DragEvent): void {
    event.preventDefault();
  }

  // Create token entity from sidebar drag payload.
  onDrop(event: DragEvent): void {
    event.preventDefault();

    const data = event.dataTransfer?.getData('token');
    if (!data) {
      return;
    }

    const token: TokenData = JSON.parse(data);
    const library = this.tokenService.tokens();
    const meta = library.find((item) => item.id === token.id);

    const image = new Image();
    image.src = meta?.image || token.image;

    image.onload = () => {
      const prepared = this.prepareTokenImage(image);

      prepared.onload = () => {
        const position = this.stage.getRelativePointerPosition();
        if (!position) {
          return;
        }

        const cells = this.tokenService.sizeToCells(token.size);
        const group = this.createToken(position.x, position.y, prepared, token.id);

        (group as any).attrs.entityType = 'monster';
        (group as any).attrs.entityData = token;

        group.scale({ x: cells, y: cells });
        this.snapGroup(group);

        this.tokenLayer.draw();
        this.savePlacedTokens();
      };
    };
  }
}