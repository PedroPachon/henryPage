import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  BodyMarker,
  BodyMarkerDocument,
  BodyPart,
  BodyView,
  BodyZone,
} from './body-marker.interface';
import {
  KonvaImageNode,
  KonvaLayer,
  KonvaLoaderService,
  KonvaNamespace,
  KonvaNode,
  KonvaStage,
  KonvaTransformer,
} from './konva-loader.service';

@Component({
  selector: 'app-body-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './body-editor.component.html',
  styleUrl: './body-editor.component.scss',
})
export class BodyEditorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('stageContainer', { static: true })
  private stageContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('frame', { static: true }) private frame!: ElementRef<HTMLDivElement>;

  private readonly konvaLoader = inject(KonvaLoaderService);
  private readonly baseWidth = 360;
  private readonly baseHeight = 640;
  private readonly markerNodes = new Map<string, KonvaImageNode>();
  private readonly imageDisplaySize = 112;
  private konva?: KonvaNamespace;
  private stage?: KonvaStage;
  private imageLayer?: KonvaLayer;
  private transformerLayer?: KonvaLayer;
  private transformer?: KonvaTransformer;
  private resizeObserver?: ResizeObserver;

  readonly zones: Record<BodyView, BodyZone[]> = {
    front: [
      {
        id: 'neck',
        label: 'Cuello',
        path: 'M154 92 L206 92 L214 135 Q180 154 146 135 Z',
        center: { x: 180, y: 119 },
      },
      {
        id: 'chest',
        label: 'Pecho',
        path: 'M121 135 Q180 165 239 135 L224 246 Q180 266 136 246 Z',
        center: { x: 180, y: 196 },
      },
      {
        id: 'left-arm',
        label: 'Brazo izquierdo',
        path: 'M80 203 Q91 151 121 135 L127 219 L108 323 Q102 350 84 348 Q62 344 66 318 Z',
        center: { x: 98, y: 249 },
      },
      {
        id: 'right-arm',
        label: 'Brazo derecho',
        path: 'M239 135 Q249 151 255 202 L270 318 Q274 344 252 348 Q234 350 228 323 L209 219 L215 135 Z',
        center: { x: 262, y: 249 },
      },
      {
        id: 'left-leg',
        label: 'Pierna izquierda',
        path: 'M128 340 L168 340 L159 588 Q156 613 134 612 Q110 610 112 584 Z',
        center: { x: 143, y: 473 },
      },
      {
        id: 'right-leg',
        label: 'Pierna derecha',
        path: 'M168 340 L208 340 L224 584 Q226 610 202 612 Q180 613 177 588 Z',
        center: { x: 197, y: 473 },
      },
    ],
    back: [
      {
        id: 'neck',
        label: 'Cuello',
        path: 'M154 92 L206 92 L218 137 Q180 150 142 137 Z',
        center: { x: 180, y: 119 },
      },
      {
        id: 'back',
        label: 'Espalda',
        path: 'M118 137 Q180 168 218 137 L211 262 Q180 286 130 262 Z',
        center: { x: 180, y: 206 },
      },
      {
        id: 'left-arm',
        label: 'Brazo izquierdo',
        path: 'M80 205 Q89 151 118 137 L125 219 L109 323 Q103 350 84 348 Q62 344 66 318 Z',
        center: { x: 98, y: 249 },
      },
      {
        id: 'right-arm',
        label: 'Brazo derecho',
        path: 'M218 137 Q247 151 256 205 L270 318 Q274 344 252 348 Q233 350 227 323 L211 219 Z',
        center: { x: 262, y: 249 },
      },
      {
        id: 'left-leg',
        label: 'Pierna izquierda',
        path: 'M130 340 L168 340 L159 588 Q156 613 134 612 Q110 610 112 584 Z',
        center: { x: 143, y: 473 },
      },
      {
        id: 'right-leg',
        label: 'Pierna derecha',
        path: 'M168 340 L206 340 L224 584 Q226 610 202 612 Q180 613 177 588 Z',
        center: { x: 197, y: 473 },
      },
    ],
  };

  currentView: BodyView = 'front';
  pendingImageUrl = '';
  selectedBodyPart: BodyPart | null = null;
  hoveredBodyPart: BodyPart | null = null;
  selectedMarkerId: string | null = null;
  jsonValue = '';
  statusMessage = '';

  markersByView: BodyMarkerDocument = {
    front: [],
    back: [],
  };

  get activeZones(): BodyZone[] {
    return this.zones[this.currentView];
  }

  ngAfterViewInit(): void {
    void this.initializeKonva();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.stage?.destroy();
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if ((event.key === 'Delete' || event.key === 'Backspace') && this.selectedMarkerId) {
      event.preventDefault();
      this.deleteSelectedMarker();
    }
  }

  setView(view: BodyView): void {
    if (this.currentView === view) {
      return;
    }

    this.currentView = view;
    this.selectedBodyPart = null;
    this.hoveredBodyPart = null;
    this.clearSelection();
    this.renderMarkersForCurrentView();
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      this.statusMessage = 'Solo se admiten imágenes PNG o JPG.';
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      const result = reader.result;
      if (typeof result === 'string') {
        this.pendingImageUrl = result;
        this.statusMessage = 'Imagen cargada. Selecciona una zona corporal.';
      }
    });
    reader.readAsDataURL(file);
    input.value = '';
  }

  placePendingImage(bodyPart: BodyPart): void {
    this.selectedBodyPart = bodyPart;

    if (!this.pendingImageUrl) {
      this.statusMessage = 'Sube una imagen PNG o JPG antes de seleccionar la zona.';
      return;
    }

    const zone = this.activeZones.find((item) => item.id === bodyPart);
    if (!zone) {
      this.statusMessage = 'La zona seleccionada no está disponible en esta vista.';
      return;
    }

    const marker: BodyMarker = {
      id: this.createId(),
      imageUrl: this.pendingImageUrl,
      bodyPart,
      x: zone.center.x,
      y: zone.center.y,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
    };

    this.markersByView[this.currentView] = [...this.markersByView[this.currentView], marker];
    this.addMarkerNode(marker, true);
    this.statusMessage = `${zone.label}: imagen colocada. Puedes arrastrarla, escalarla o rotarla.`;
  }

  deleteSelectedMarker(): void {
    if (!this.selectedMarkerId) {
      return;
    }

    const markerId = this.selectedMarkerId;
    this.markersByView[this.currentView] = this.markersByView[this.currentView].filter(
      (marker) => marker.id !== markerId,
    );
    this.markerNodes.get(markerId)?.destroy();
    this.markerNodes.delete(markerId);
    this.clearSelection();
    this.imageLayer?.batchDraw();
    this.statusMessage = 'Imagen eliminada.';
  }

  exportMarkers(): void {
    this.syncCurrentMarkersFromNodes();
    this.jsonValue = JSON.stringify(this.markersByView, null, 2);
    this.statusMessage = 'JSON exportado con todos los marcadores frontales y traseros.';
  }

  importMarkers(): void {
    const parsed = this.parseImportedJson(this.jsonValue);
    if (!parsed) {
      return;
    }

    this.markersByView = parsed;
    this.clearSelection();
    this.renderMarkersForCurrentView();
    this.statusMessage = 'JSON importado. Las imágenes se reconstruyeron en su posición original.';
  }

  selectedBodyPartLabel(): string {
    if (!this.selectedBodyPart) {
      return '';
    }

    return this.activeZones.find((zone) => zone.id === this.selectedBodyPart)?.label ?? '';
  }

  private async initializeKonva(): Promise<void> {
    try {
      this.konva = await this.konvaLoader.load();
    } catch {
      this.statusMessage = 'No se pudo cargar Konva.js. Revisa la conexión e inténtalo de nuevo.';
      return;
    }

    this.stage = new this.konva.Stage({
      container: this.stageContainer.nativeElement,
      width: this.baseWidth,
      height: this.baseHeight,
    });
    this.imageLayer = new this.konva.Layer();
    this.transformerLayer = new this.konva.Layer();
    this.transformer = new this.konva.Transformer({
      rotateEnabled: true,
      enabledAnchors: [
        'top-left',
        'top-right',
        'bottom-left',
        'bottom-right',
        'middle-left',
        'middle-right',
        'top-center',
        'bottom-center',
      ],
      keepRatio: false,
    });

    this.transformerLayer.add(this.transformer);
    this.stage.add(this.imageLayer);
    this.stage.add(this.transformerLayer);
    this.stage.on('click tap', (event) => {
      if (event.target === (this.stage as unknown)) {
        this.clearSelection();
      }
    });

    this.resizeObserver = new ResizeObserver(() => this.resizeStage());
    this.resizeObserver.observe(this.frame.nativeElement);
    this.resizeStage();
  }

  private resizeStage(): void {
    if (!this.stage) {
      return;
    }

    const width = this.frame.nativeElement.clientWidth;
    const height = width * (this.baseHeight / this.baseWidth);
    const scale = width / this.baseWidth;
    this.stage.width(width);
    this.stage.height(height);
    this.stage.scale({ x: scale, y: scale });
    this.stage.draw();
  }

  private renderMarkersForCurrentView(): void {
    if (!this.imageLayer || !this.transformerLayer) {
      return;
    }

    this.markerNodes.clear();
    this.imageLayer.destroyChildren();
    this.markersByView[this.currentView].forEach((marker) => this.addMarkerNode(marker, false));
    this.imageLayer.batchDraw();
    this.transformerLayer.batchDraw();
  }

  private addMarkerNode(marker: BodyMarker, selectAfterLoad: boolean): void {
    if (!this.konva || !this.imageLayer) {
      return;
    }

    const imageElement = new Image();
    imageElement.addEventListener('load', () => {
      if (!this.konva || !this.imageLayer) {
        return;
      }

      const ratio = Math.min(
        this.imageDisplaySize / imageElement.naturalWidth,
        this.imageDisplaySize / imageElement.naturalHeight,
        1,
      );
      const width = imageElement.naturalWidth * ratio;
      const height = imageElement.naturalHeight * ratio;
      const node = new this.konva.Image({
        id: marker.id,
        image: imageElement,
        x: marker.x,
        y: marker.y,
        width,
        height,
        offsetX: width / 2,
        offsetY: height / 2,
        scaleX: marker.scaleX,
        scaleY: marker.scaleY,
        rotation: marker.rotation,
        draggable: true,
      });

      node.on('click tap', () => this.selectMarker(marker.id));
      node.on('dragend transformend', () => this.updateMarkerFromNode(marker.id, node));
      this.markerNodes.set(marker.id, node);
      this.imageLayer.add(node);
      this.imageLayer.batchDraw();

      if (selectAfterLoad) {
        this.selectMarker(marker.id);
      }
    });
    imageElement.src = marker.imageUrl;
  }

  private selectMarker(markerId: string): void {
    const node = this.markerNodes.get(markerId);
    if (!node || !this.transformer || !this.transformerLayer) {
      return;
    }

    this.selectedMarkerId = markerId;
    this.transformer.nodes([node]);
    this.transformerLayer.batchDraw();
  }

  private clearSelection(): void {
    this.selectedMarkerId = null;
    this.transformer?.nodes([]);
    this.transformerLayer?.batchDraw();
  }

  private updateMarkerFromNode(markerId: string, node: KonvaNode): void {
    this.markersByView[this.currentView] = this.markersByView[this.currentView].map((marker) => {
      if (marker.id !== markerId) {
        return marker;
      }

      return {
        ...marker,
        x: this.round(node.x()),
        y: this.round(node.y()),
        scaleX: this.round(node.scaleX()),
        scaleY: this.round(node.scaleY()),
        rotation: this.round(node.rotation()),
      };
    });
  }

  private syncCurrentMarkersFromNodes(): void {
    this.markersByView[this.currentView] = this.markersByView[this.currentView].map((marker) => {
      const node = this.markerNodes.get(marker.id);
      if (!node) {
        return marker;
      }

      return {
        ...marker,
        x: this.round(node.x()),
        y: this.round(node.y()),
        scaleX: this.round(node.scaleX()),
        scaleY: this.round(node.scaleY()),
        rotation: this.round(node.rotation()),
      };
    });
  }

  private parseImportedJson(value: string): BodyMarkerDocument | null {
    if (!value.trim()) {
      this.statusMessage = 'Pega un JSON exportado antes de importar.';
      return null;
    }

    try {
      const parsed = JSON.parse(value) as unknown;
      if (!this.isBodyMarkerDocument(parsed)) {
        this.statusMessage = 'El JSON no cumple la estructura esperada de marcadores.';
        return null;
      }
      return parsed;
    } catch {
      this.statusMessage = 'El JSON introducido no es válido.';
      return null;
    }
  }

  private isBodyMarkerDocument(value: unknown): value is BodyMarkerDocument {
    if (!this.isRecord(value)) {
      return false;
    }

    return this.isMarkerArray(value['front'], 'front') && this.isMarkerArray(value['back'], 'back');
  }

  private isMarkerArray(value: unknown, view: BodyView): value is BodyMarker[] {
    if (!Array.isArray(value)) {
      return false;
    }

    const allowedParts = new Set(this.zones[view].map((zone) => zone.id));
    return value.every((marker) => this.isBodyMarker(marker, allowedParts));
  }

  private isBodyMarker(value: unknown, allowedParts: Set<BodyPart>): value is BodyMarker {
    if (!this.isRecord(value)) {
      return false;
    }

    return (
      typeof value['id'] === 'string' &&
      typeof value['imageUrl'] === 'string' &&
      allowedParts.has(value['bodyPart'] as BodyPart) &&
      this.isFiniteNumber(value['x']) &&
      this.isFiniteNumber(value['y']) &&
      this.isFiniteNumber(value['scaleX']) &&
      this.isFiniteNumber(value['scaleY']) &&
      this.isFiniteNumber(value['rotation'])
    );
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private isFiniteNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
  }

  private createId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }

    return `marker-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  private round(value: number): number {
    return Number(value.toFixed(3));
  }
}
