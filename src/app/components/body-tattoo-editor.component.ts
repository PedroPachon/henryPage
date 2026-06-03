import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';

type BodyPartId =
  | 'head'
  | 'chest'
  | 'abdomen'
  | 'leftArm'
  | 'rightArm'
  | 'leftForearm'
  | 'rightForearm'
  | 'leftThigh'
  | 'rightThigh'
  | 'leftCalf'
  | 'rightCalf';

type BodyPartKind = 'sphere' | 'torso' | 'limb';

interface BodyPart {
  id: BodyPartId;
  label: string;
  kind: BodyPartKind;
  hint: string;
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  rotation: number;
  depth: number;
  poseAxis: 'x' | 'y' | 'z';
}

interface TattooDecal {
  id: string;
  partId: BodyPartId;
  imageUrl: string;
  fileName: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
  locked: boolean;
}

interface ExportedTattooScene {
  version: 1;
  camera: { x: number; y: number; zoom: number };
  selectedPartId: BodyPartId;
  partPose: Record<BodyPartId, number>;
  tattoos: TattooDecal[];
}

const BODY_PARTS: BodyPart[] = [
  {
    id: 'head',
    label: 'Cabeza',
    kind: 'sphere',
    hint: 'Diseños pequeños cerca de cuello o sien.',
    x: 0,
    y: -220,
    z: 20,
    width: 86,
    height: 104,
    rotation: 0,
    depth: 72,
    poseAxis: 'y',
  },
  {
    id: 'chest',
    label: 'Pecho',
    kind: 'torso',
    hint: 'Ideal para piezas frontales o sternum.',
    x: 0,
    y: -98,
    z: 0,
    width: 178,
    height: 188,
    rotation: 0,
    depth: 78,
    poseAxis: 'y',
  },
  {
    id: 'abdomen',
    label: 'Abdomen',
    kind: 'torso',
    hint: 'Zona amplia con curvatura suave.',
    x: 0,
    y: 56,
    z: -4,
    width: 148,
    height: 164,
    rotation: 0,
    depth: 70,
    poseAxis: 'y',
  },
  {
    id: 'leftArm',
    label: 'Brazo izq.',
    kind: 'limb',
    hint: 'Sleeves y composiciones verticales.',
    x: -136,
    y: -92,
    z: -2,
    width: 54,
    height: 176,
    rotation: -12,
    depth: 42,
    poseAxis: 'z',
  },
  {
    id: 'rightArm',
    label: 'Brazo der.',
    kind: 'limb',
    hint: 'Sleeves y composiciones verticales.',
    x: 136,
    y: -92,
    z: -2,
    width: 54,
    height: 176,
    rotation: 12,
    depth: 42,
    poseAxis: 'z',
  },
  {
    id: 'leftForearm',
    label: 'Antebrazo izq.',
    kind: 'limb',
    hint: 'Muy visible y fácil de revisar en giro.',
    x: -158,
    y: 66,
    z: 4,
    width: 46,
    height: 162,
    rotation: -6,
    depth: 38,
    poseAxis: 'z',
  },
  {
    id: 'rightForearm',
    label: 'Antebrazo der.',
    kind: 'limb',
    hint: 'Muy visible y fácil de revisar en giro.',
    x: 158,
    y: 66,
    z: 4,
    width: 46,
    height: 162,
    rotation: 6,
    depth: 38,
    poseAxis: 'z',
  },
  {
    id: 'leftThigh',
    label: 'Muslo izq.',
    kind: 'limb',
    hint: 'Buen soporte para piezas medianas.',
    x: -48,
    y: 212,
    z: -2,
    width: 60,
    height: 188,
    rotation: 3,
    depth: 46,
    poseAxis: 'x',
  },
  {
    id: 'rightThigh',
    label: 'Muslo der.',
    kind: 'limb',
    hint: 'Buen soporte para piezas medianas.',
    x: 48,
    y: 212,
    z: -2,
    width: 60,
    height: 188,
    rotation: -3,
    depth: 46,
    poseAxis: 'x',
  },
  {
    id: 'leftCalf',
    label: 'Pantorrilla izq.',
    kind: 'limb',
    hint: 'Revisa el wrap girando la cámara.',
    x: -50,
    y: 398,
    z: 0,
    width: 48,
    height: 174,
    rotation: 0,
    depth: 38,
    poseAxis: 'x',
  },
  {
    id: 'rightCalf',
    label: 'Pantorrilla der.',
    kind: 'limb',
    hint: 'Revisa el wrap girando la cámara.',
    x: 50,
    y: 398,
    z: 0,
    width: 48,
    height: 174,
    rotation: 0,
    depth: 38,
    poseAxis: 'x',
  },
];

@Component({
  selector: 'app-body-tattoo-editor',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section id="tattoo-editor" class="tattoo-editor reveal">
      <div class="editor-copy">
        <div class="section-label">3D tattoo editor</div>
        <h2>Prueba un decal sobre un cuerpo 3D interactivo</h2>
        <p>
          Sube una imagen, selecciona una zona del cuerpo y ajústala como si fuera un stencil:
          tamaño, rotación, bloqueo y pose de la parte seleccionada. El tatuaje queda anclado a su
          zona para acompañar cualquier movimiento.
        </p>
      </div>

      <div class="editor-shell">
        <aside class="tool-panel" aria-label="Controles del editor 3D">
          <label class="upload-card">
            <span>Subir tattoo</span>
            <strong>{{ uploadedFileName() || 'PNG, JPG o WebP' }}</strong>
            <input type="file" accept="image/*" (change)="onImageSelected($event)" />
          </label>

          @if (uploadedPreview()) {
            <div class="preview-card">
              <span>Preview</span>
              <img [src]="uploadedPreview()" alt="Preview del tatuaje subido" />
            </div>
          }

          <div class="control-group">
            <span class="eyebrow">Parte seleccionada</span>
            <strong>{{ selectedPart().label }}</strong>
            <p>{{ selectedPart().hint }}</p>
          </div>

          <div class="button-grid body-grid">
            @for (part of bodyParts; track part.id) {
              <button
                type="button"
                [class.active]="part.id === selectedPartId()"
                (click)="selectPart(part.id)"
              >
                {{ part.label }}
              </button>
            }
          </div>

          <div class="control-group">
            <label for="cameraY">Girar modelo</label>
            <input
              id="cameraY"
              type="range"
              min="-55"
              max="55"
              [value]="cameraY()"
              (input)="setNumericSignal(cameraY.set, $event)"
            />
          </div>

          <div class="control-group two-controls">
            <label for="cameraX">Inclinación</label>
            <input
              id="cameraX"
              type="range"
              min="-18"
              max="22"
              [value]="cameraX()"
              (input)="setNumericSignal(cameraX.set, $event)"
            />
            <label for="zoom">Zoom</label>
            <input
              id="zoom"
              type="range"
              min="0.78"
              max="1.25"
              step="0.01"
              [value]="zoom()"
              (input)="setNumericSignal(zoom.set, $event)"
            />
          </div>

          <div class="control-group">
            <label for="pose">Posar parte seleccionada</label>
            <input
              id="pose"
              type="range"
              min="-35"
              max="35"
              [value]="selectedPose()"
              (input)="setSelectedPose($event)"
            />
          </div>

          <div class="control-group tattoo-controls" [class.disabled]="!activeTattoo()">
            <span class="eyebrow">Decal activo</span>
            @if (activeTattoo(); as tattoo) {
              <strong>{{ tattoo.fileName }}</strong>
              <label for="tattooSize">Tamaño</label>
              <input
                id="tattooSize"
                type="range"
                min="32"
                max="180"
                [value]="tattoo.size"
                [disabled]="tattoo.locked"
                (input)="updateActiveTattoo('size', $event)"
              />
              <label for="tattooRotation">Rotación</label>
              <input
                id="tattooRotation"
                type="range"
                min="-180"
                max="180"
                [value]="tattoo.rotation"
                [disabled]="tattoo.locked"
                (input)="updateActiveTattoo('rotation', $event)"
              />
              <div class="button-grid">
                <button type="button" (click)="toggleActiveTattooLock()">
                  {{ tattoo.locked ? 'Desbloquear' : 'Bloquear' }}
                </button>
                <button type="button" class="danger" (click)="deleteActiveTattoo()">
                  Eliminar
                </button>
              </div>
            } @else {
              <p>Haz click en el cuerpo para colocar una imagen subida.</p>
            }
          </div>

          <div class="button-grid utility-grid">
            <button type="button" (click)="clearTattoos()">Limpiar</button>
            <button type="button" (click)="exportScene()">Exportar</button>
            <label class="import-button">
              Importar
              <input type="file" accept="application/json" (change)="importScene($event)" />
            </label>
          </div>
        </aside>

        <div
          class="viewport"
          (pointerdown)="startCameraDrag($event)"
          (pointermove)="dragCamera($event)"
          (pointerup)="endCameraDrag()"
          (pointerleave)="endCameraDrag()"
        >
          <div class="stage-help">
            Click sobre una zona para seleccionarla. Con imagen subida, el click coloca el decal.
          </div>
          <div class="scene" [style.transform]="sceneTransform()">
            <div class="floor"></div>
            <div class="body-rig">
              @for (part of bodyParts; track part.id) {
                <button
                  type="button"
                  class="body-part"
                  [class.selected]="part.id === selectedPartId()"
                  [class]="
                    'body-part ' + part.kind + (part.id === selectedPartId() ? ' selected' : '')
                  "
                  [style.width.px]="part.width"
                  [style.height.px]="part.height"
                  [style.--depth.px]="part.depth"
                  [style.transform]="partTransform(part)"
                  (click)="handlePartClick(part.id, $event)"
                  [attr.aria-label]="'Seleccionar ' + part.label"
                >
                  <span class="surface-highlight"></span>
                  <span class="part-label">{{ part.label }}</span>
                  @for (tattoo of tattoosForPart(part.id); track tattoo.id) {
                    <button
                      type="button"
                      class="tattoo-decal"
                      [class.locked]="tattoo.locked"
                      [class.active]="tattoo.id === activeTattooId()"
                      [style.left.%]="tattoo.x"
                      [style.top.%]="tattoo.y"
                      [style.width.px]="tattoo.size"
                      [style.height.px]="tattoo.size"
                      [style.transform]="tattooTransform(tattoo)"
                      (click)="selectTattoo(tattoo.id, $event)"
                      [attr.aria-label]="'Editar tattoo ' + tattoo.fileName"
                    >
                      <img [src]="tattoo.imageUrl" alt="" />
                      @if (tattoo.locked) {
                        <span class="lock-badge">LOCK</span>
                      }
                    </button>
                  }
                </button>
              }
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .tattoo-editor {
        background: #0b0b0b;
        color: var(--white);
        padding: 120px 48px;
        overflow: hidden;
      }

      .editor-copy {
        display: grid;
        grid-template-columns: minmax(220px, 0.8fr) minmax(280px, 1.2fr);
        gap: 48px;
        align-items: end;
        margin-bottom: 48px;
      }

      .editor-copy .section-label {
        color: #777;
        margin-bottom: 0;
      }

      .editor-copy h2 {
        font-family: var(--serif);
        font-size: clamp(44px, 7vw, 92px);
        font-weight: 300;
        line-height: 0.92;
        letter-spacing: -0.06em;
      }

      .editor-copy p {
        color: #9b9b9b;
        font-size: 14px;
        line-height: 1.85;
        letter-spacing: 0.06em;
        max-width: 720px;
      }

      .editor-shell {
        display: grid;
        grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
        min-height: 760px;
        border: 1px solid #242424;
        background: #111;
      }

      .tool-panel {
        border-right: 1px solid #242424;
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 18px;
        max-height: 760px;
        overflow: auto;
      }

      .upload-card,
      .preview-card,
      .control-group {
        border: 1px solid #282828;
        background: #0d0d0d;
        padding: 18px;
      }

      .upload-card,
      .import-button {
        cursor: pointer;
      }

      .upload-card span,
      .preview-card span,
      .eyebrow,
      label {
        display: block;
        color: #777;
        font-size: 10px;
        letter-spacing: 0.32em;
        margin-bottom: 10px;
        text-transform: uppercase;
      }

      .upload-card strong,
      .control-group strong {
        display: block;
        font-family: var(--serif);
        font-size: 24px;
        font-weight: 300;
        line-height: 1.1;
      }

      .upload-card input,
      .import-button input {
        position: absolute;
        inline-size: 1px;
        block-size: 1px;
        opacity: 0;
        pointer-events: none;
      }

      .preview-card img {
        width: 100%;
        max-height: 120px;
        object-fit: contain;
        filter: grayscale(1) contrast(1.15);
      }

      .control-group p {
        color: #777;
        font-size: 13px;
        line-height: 1.6;
        margin-top: 10px;
      }

      input[type='range'] {
        width: 100%;
        accent-color: #fff;
      }

      .two-controls {
        display: grid;
        gap: 8px;
      }

      .button-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
      }

      .body-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      button,
      .import-button {
        border: 1px solid #303030;
        background: #151515;
        color: #f4f4f4;
        font-family: var(--sans);
        font-size: 11px;
        letter-spacing: 0.16em;
        padding: 11px 10px;
        text-align: center;
        text-transform: uppercase;
      }

      button.active,
      button:hover,
      .import-button:hover {
        border-color: #f4f4f4;
        background: #f4f4f4;
        color: #0a0a0a;
      }

      button:disabled {
        cursor: not-allowed;
        opacity: 0.35;
      }

      .danger {
        border-color: #4a2424;
        color: #f0b4b4;
      }

      .utility-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .tattoo-controls.disabled {
        opacity: 0.72;
      }

      .viewport {
        position: relative;
        min-height: 760px;
        overflow: hidden;
        cursor: grab;
        perspective: 1100px;
        background:
          radial-gradient(circle at 50% 30%, rgb(255 255 255 / 0.12), transparent 34%),
          linear-gradient(135deg, #171717, #070707 65%);
        touch-action: none;
      }

      .viewport:active {
        cursor: grabbing;
      }

      .stage-help {
        position: absolute;
        top: 22px;
        right: 22px;
        z-index: 5;
        max-width: 300px;
        color: #777;
        font-size: 11px;
        letter-spacing: 0.18em;
        line-height: 1.6;
        text-align: right;
        text-transform: uppercase;
      }

      .scene {
        position: absolute;
        inset: 0;
        transform-style: preserve-3d;
        transition: transform 180ms ease-out;
      }

      .floor {
        position: absolute;
        left: 50%;
        top: 75%;
        width: 620px;
        height: 620px;
        border: 1px solid rgb(255 255 255 / 0.08);
        background-image:
          linear-gradient(rgb(255 255 255 / 0.06) 1px, transparent 1px),
          linear-gradient(90deg, rgb(255 255 255 / 0.06) 1px, transparent 1px);
        background-size: 44px 44px;
        border-radius: 50%;
        transform: translate(-50%, -50%) rotateX(78deg) translateZ(-150px);
      }

      .body-rig {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 1px;
        height: 1px;
        transform-style: preserve-3d;
      }

      .body-part {
        position: absolute;
        left: 0;
        top: 0;
        padding: 0;
        border: 1px solid rgb(255 255 255 / 0.08);
        color: inherit;
        transform-style: preserve-3d;
        transform-origin: 50% 12%;
        overflow: visible;
        transition:
          filter 180ms ease,
          border-color 180ms ease,
          box-shadow 180ms ease;
      }

      .body-part::before,
      .body-part::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        pointer-events: none;
      }

      .body-part::before {
        background:
          radial-gradient(circle at 32% 22%, rgb(255 255 255 / 0.42), transparent 24%),
          linear-gradient(90deg, rgb(255 255 255 / 0.18), transparent 42%, rgb(0 0 0 / 0.28));
        transform: translateZ(calc(var(--depth) * 0.32));
      }

      .body-part::after {
        background: linear-gradient(90deg, rgb(0 0 0 / 0.25), rgb(255 255 255 / 0.07));
        transform: translateZ(calc(var(--depth) * -0.32));
      }

      .body-part.selected {
        border-color: #fff;
        box-shadow:
          0 0 0 1px #fff,
          0 0 44px rgb(255 255 255 / 0.18);
        filter: brightness(1.08);
      }

      .sphere {
        border-radius: 48% 48% 44% 44%;
        background: #c7b39f;
      }

      .torso {
        border-radius: 44% 44% 38% 38% / 28% 28% 58% 58%;
        background: #bfa58f;
      }

      .limb {
        border-radius: 999px;
        background: #b99f88;
      }

      .surface-highlight {
        position: absolute;
        inset: 10%;
        border-radius: inherit;
        background: radial-gradient(circle at 28% 18%, rgb(255 255 255 / 0.22), transparent 32%);
        transform: translateZ(calc(var(--depth) * 0.36));
        pointer-events: none;
      }

      .part-label {
        position: absolute;
        left: 50%;
        bottom: 10px;
        z-index: 2;
        color: rgb(0 0 0 / 0.5);
        font-size: 9px;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        transform: translateX(-50%) translateZ(calc(var(--depth) * 0.44));
        pointer-events: none;
        white-space: nowrap;
      }

      .tattoo-decal {
        position: absolute;
        z-index: 3;
        display: grid;
        place-items: center;
        padding: 0;
        border: 1px dashed rgb(255 255 255 / 0.46);
        background: transparent;
        transform-origin: 50% 50%;
        transform-style: preserve-3d;
        translate: -50% -50%;
        mix-blend-mode: multiply;
      }

      .tattoo-decal img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        filter: grayscale(1) contrast(1.18) opacity(0.88);
        pointer-events: none;
      }

      .tattoo-decal.active {
        border-style: solid;
        border-color: #111;
        box-shadow: 0 0 0 2px #fff;
      }

      .tattoo-decal.locked {
        border-style: solid;
        border-color: rgb(0 0 0 / 0.5);
      }

      .lock-badge {
        position: absolute;
        right: -2px;
        bottom: -18px;
        background: #0a0a0a;
        color: #fff;
        font-size: 8px;
        letter-spacing: 0.16em;
        padding: 3px 5px;
      }

      @media (max-width: 980px) {
        .tattoo-editor {
          padding: 88px 24px;
        }

        .editor-copy,
        .editor-shell {
          grid-template-columns: 1fr;
        }

        .tool-panel {
          border-right: 0;
          border-bottom: 1px solid #242424;
          max-height: none;
        }
      }

      @media (max-width: 640px) {
        .viewport {
          min-height: 620px;
        }

        .editor-shell {
          min-height: 620px;
        }

        .stage-help {
          left: 18px;
          right: 18px;
          text-align: left;
        }
      }
    `,
  ],
})
export class BodyTattooEditorComponent {
  readonly bodyParts = BODY_PARTS;

  readonly selectedPartId = signal<BodyPartId>('chest');
  readonly activeTattooId = signal<string | null>(null);
  readonly uploadedPreview = signal<string | null>(null);
  readonly uploadedFileName = signal<string | null>(null);
  readonly tattoos = signal<TattooDecal[]>([]);
  readonly cameraX = signal(-4);
  readonly cameraY = signal(18);
  readonly zoom = signal(0.94);
  readonly partPose = signal<Record<BodyPartId, number>>(this.createInitialPose());

  private dragStart: { x: number; y: number; cameraX: number; cameraY: number } | null = null;

  readonly selectedPart = computed(() => this.findPart(this.selectedPartId()));
  readonly activeTattoo = computed(() => {
    const activeId = this.activeTattooId();
    return this.tattoos().find((tattoo) => tattoo.id === activeId) ?? null;
  });
  readonly selectedPose = computed(() => this.partPose()[this.selectedPartId()]);
  readonly sceneTransform = computed(
    () =>
      `translateZ(0) scale(${this.zoom()}) rotateX(${this.cameraX()}deg) rotateY(${this.cameraY()}deg)`,
  );

  selectPart(partId: BodyPartId): void {
    this.selectedPartId.set(partId);
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      const result = reader.result;

      if (typeof result !== 'string') {
        return;
      }

      this.uploadedPreview.set(result);
      this.uploadedFileName.set(file.name);
    });
    reader.readAsDataURL(file);
  }

  handlePartClick(partId: BodyPartId, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedPartId.set(partId);

    const uploadedImage = this.uploadedPreview();
    if (!uploadedImage) {
      return;
    }

    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const x = this.clamp(((event.clientX - rect.left) / rect.width) * 100, 12, 88);
    const y = this.clamp(((event.clientY - rect.top) / rect.height) * 100, 12, 88);
    const tattoo: TattooDecal = {
      id: `tattoo-${Date.now()}-${Math.round(Math.random() * 1000)}`,
      partId,
      imageUrl: uploadedImage,
      fileName: this.uploadedFileName() ?? 'tattoo image',
      x,
      y,
      size: 84,
      rotation: 0,
      locked: false,
    };

    this.tattoos.update((tattoos) => [...tattoos, tattoo]);
    this.activeTattooId.set(tattoo.id);
  }

  selectTattoo(tattooId: string, event: MouseEvent): void {
    event.stopPropagation();
    const tattoo = this.tattoos().find((item) => item.id === tattooId);

    if (!tattoo) {
      return;
    }

    this.selectedPartId.set(tattoo.partId);
    this.activeTattooId.set(tattooId);
  }

  updateActiveTattoo(property: 'rotation' | 'size', event: Event): void {
    const tattoo = this.activeTattoo();
    if (!tattoo || tattoo.locked) {
      return;
    }

    const value = Number((event.target as HTMLInputElement).value);
    this.tattoos.update((tattoos) =>
      tattoos.map((item) => (item.id === tattoo.id ? { ...item, [property]: value } : item)),
    );
  }

  toggleActiveTattooLock(): void {
    const tattoo = this.activeTattoo();
    if (!tattoo) {
      return;
    }

    this.tattoos.update((tattoos) =>
      tattoos.map((item) => (item.id === tattoo.id ? { ...item, locked: !item.locked } : item)),
    );
  }

  deleteActiveTattoo(): void {
    const activeId = this.activeTattooId();
    if (!activeId) {
      return;
    }

    this.tattoos.update((tattoos) => tattoos.filter((tattoo) => tattoo.id !== activeId));
    this.activeTattooId.set(null);
  }

  clearTattoos(): void {
    this.tattoos.set([]);
    this.activeTattooId.set(null);
  }

  exportScene(): void {
    const scene: ExportedTattooScene = {
      version: 1,
      camera: { x: this.cameraX(), y: this.cameraY(), zoom: this.zoom() },
      selectedPartId: this.selectedPartId(),
      partPose: this.partPose(),
      tattoos: this.tattoos(),
    };
    const blob = new Blob([JSON.stringify(scene, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'henry-tatts-3d-scene.json';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  importScene(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      const result = reader.result;

      if (typeof result !== 'string') {
        return;
      }

      const parsed = JSON.parse(result) as Partial<ExportedTattooScene>;
      if (parsed.version !== 1 || !parsed.camera || !parsed.partPose || !parsed.tattoos) {
        return;
      }

      this.cameraX.set(parsed.camera.x);
      this.cameraY.set(parsed.camera.y);
      this.zoom.set(parsed.camera.zoom);
      this.selectedPartId.set(parsed.selectedPartId ?? 'chest');
      this.partPose.set({ ...this.createInitialPose(), ...parsed.partPose });
      this.tattoos.set(parsed.tattoos);
      this.activeTattooId.set(parsed.tattoos.at(-1)?.id ?? null);
    });
    reader.readAsText(file);
  }

  setNumericSignal(setter: (value: number) => void, event: Event): void {
    setter(Number((event.target as HTMLInputElement).value));
  }

  setSelectedPose(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    const partId = this.selectedPartId();
    this.partPose.update((pose) => ({ ...pose, [partId]: value }));
  }

  startCameraDrag(event: PointerEvent): void {
    if (event.button !== 0) {
      return;
    }

    this.dragStart = {
      x: event.clientX,
      y: event.clientY,
      cameraX: this.cameraX(),
      cameraY: this.cameraY(),
    };
  }

  dragCamera(event: PointerEvent): void {
    if (!this.dragStart) {
      return;
    }

    const deltaX = event.clientX - this.dragStart.x;
    const deltaY = event.clientY - this.dragStart.y;
    this.cameraY.set(this.clamp(this.dragStart.cameraY + deltaX * 0.24, -60, 60));
    this.cameraX.set(this.clamp(this.dragStart.cameraX - deltaY * 0.18, -24, 24));
  }

  endCameraDrag(): void {
    this.dragStart = null;
  }

  tattoosForPart(partId: BodyPartId): TattooDecal[] {
    return this.tattoos().filter((tattoo) => tattoo.partId === partId);
  }

  partTransform(part: BodyPart): string {
    const pose = this.partPose()[part.id];
    const poseTransform = this.poseTransform(part, pose);
    return `translate3d(${part.x - part.width / 2}px, ${part.y - part.height / 2}px, ${part.z}px) rotateZ(${part.rotation}deg) ${poseTransform}`;
  }

  tattooTransform(tattoo: TattooDecal): string {
    return `translateZ(34px) rotateZ(${tattoo.rotation}deg)`;
  }

  private poseTransform(part: BodyPart, pose: number): string {
    if (part.poseAxis === 'x') {
      return `rotateX(${pose}deg)`;
    }

    if (part.poseAxis === 'y') {
      return `rotateY(${pose}deg)`;
    }

    return `rotateZ(${pose}deg)`;
  }

  private createInitialPose(): Record<BodyPartId, number> {
    return BODY_PARTS.reduce(
      (pose, part) => ({ ...pose, [part.id]: 0 }),
      {} as Record<BodyPartId, number>,
    );
  }

  private findPart(partId: BodyPartId): BodyPart {
    return BODY_PARTS.find((part) => part.id === partId) ?? BODY_PARTS[1];
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }
}
