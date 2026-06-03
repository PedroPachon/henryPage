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
import { BodyPart, BodyZone, TattooDecal, TattooDecalDocument } from './body-marker.interface';
import {
  BodyMarker,
  BodyMarkerDocument,
  BodyPart,
  BodyPartOffset,
  BodyPartOffsets,
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
  @ViewChild('threeHost', { static: true }) private threeHost!: ElementRef<HTMLDivElement>;

  private readonly threeLoader = inject(ThreeLoaderService);
  private readonly decals = new Map<string, DecalRuntime>();
  private readonly bodyParts = new Map<BodyPart, BodyPartRuntime>();
  private readonly raycastMeshes: ThreeMesh[] = [];
  private readonly decalMeshes: ThreeMesh[] = [];
  private three?: ThreeNamespace;
  private scene?: ThreeScene;
  private camera?: ThreePerspectiveCamera;
  private renderer?: ThreeRenderer;
  private raycaster?: ThreeRaycaster;
  private pointer?: ThreeVector2;
  private modelGroup?: ThreeGroup;
  private pendingTexture?: ThreeTexture;
  private resizeObserver?: ResizeObserver;
  private animationFrameId = 0;
  private isDraggingModel = false;
  private dragStarted = false;
  private dragStart = { x: 0, y: 0 };
  private modelRotation = { x: 0, y: 0 };
  private cameraDistance = 5.2;

  readonly zones: BodyZone[] = [
    { id: 'head', label: 'Cabeza' },
    { id: 'torso', label: 'Torso' },
    { id: 'left-arm', label: 'Brazo izquierdo' },
    { id: 'right-arm', label: 'Brazo derecho' },
    { id: 'left-leg', label: 'Pierna izquierda' },
    { id: 'right-leg', label: 'Pierna derecha' },
  ];

  pendingImageUrl = '';
  selectedBodyPart: BodyPart | null = null;
  selectedDecalId: string | null = null;
  selectedDecalSize = 0.45;
  selectedDecalRotation = 0;
  selectedPartPose = 0;
  jsonValue = '';
  statusMessage = '';

  get selectedBodyPartLabel(): string {
    return this.zones.find((zone) => zone.id === this.selectedBodyPart)?.label ?? '';
  }

  partOffsetsByView: Record<BodyView, BodyPartOffsets> = {
    front: {},
    back: {},
  };

  get activeZones(): BodyZone[] {
    return this.zones[this.currentView];
  }

  ngAfterViewInit(): void {
    void this.initializeThree();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animationFrameId);
    this.resizeObserver?.disconnect();
    this.disposeDecals();
    this.raycastMeshes.forEach((mesh) => {
      mesh.geometry.dispose();
      mesh.material.dispose();
    });
    this.renderer?.dispose();
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if ((event.key === 'Delete' || event.key === 'Backspace') && this.selectedDecalId) {
      event.preventDefault();
      this.deleteSelectedDecal();
    }
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      this.statusMessage = 'Solo se admiten imágenes PNG, JPG o WebP.';
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      const result = reader.result;
      if (typeof result === 'string') {
        this.pendingImageUrl = result;
        this.loadPendingTexture(result);
        this.statusMessage =
          'Tattoo cargado. Haz click sobre el modelo 3D para aplicarlo como decal.';
      }
    });
    reader.readAsDataURL(file);
    input.value = '';
  }

  setSelectedDecalSize(size: number | string): void {
    const decal = this.selectedDecal;
    if (!decal || decal.locked) {
      return;
    }

    decal.size = this.round(Number(size));
    this.selectedDecalSize = decal.size;
    this.rebuildDecal(decal.id);
  }

  setSelectedDecalRotation(rotation: number | string): void {
    const decal = this.selectedDecal;
    if (!decal || decal.locked) {
      return;
    }

    decal.rotation = this.round(Number(rotation));
    this.selectedDecalRotation = decal.rotation;
    this.rebuildDecal(decal.id);
  }

  toggleSelectedDecalLock(): void {
    const decal = this.selectedDecal;
    if (!decal) {
      return;
    }

    const marker: BodyMarker = {
      id: this.createId(),
      imageUrl: this.pendingImageUrl,
      bodyPart,
      x: zone.center.x + this.bodyPartOffset(bodyPart).x,
      y: zone.center.y + this.bodyPartOffset(bodyPart).y,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      locked: false,
    };

    this.removeDecal(this.selectedDecalId);
    this.selectedDecalId = null;
    this.statusMessage = 'Decal eliminado.';
  }

  clearDecals(): void {
    this.disposeDecals();
    this.selectedDecalId = null;
    this.jsonValue = '';
    this.statusMessage = 'Todos los decals se han eliminado.';
  }

  setSelectedPartPose(value: number | string): void {
    if (!this.selectedBodyPart) {
      return;
    }

    const pose = Number(value);
    this.selectedPartPose = pose;
    this.applyPartPose(this.selectedBodyPart, pose);
  }

  exportMarkers(): void {
    this.syncCurrentMarkersFromNodes();
    this.jsonValue = JSON.stringify(
      {
        ...this.markersByView,
        partOffsets: this.partOffsetsByView,
      },
      null,
      2,
    );
    this.statusMessage = 'JSON exportado con todos los marcadores frontales y traseros.';
  }

  importDecals(): void {
    const parsed = this.parseImportedJson(this.jsonValue);
    if (!parsed) {
      return;
    }

    this.markersByView = {
      front: this.normalizeMarkers(parsed.front),
      back: this.normalizeMarkers(parsed.back),
    };
    this.partOffsetsByView = this.normalizePartOffsets(parsed.partOffsets);
    this.clearSelection();
    this.renderMarkersForCurrentView();
    this.statusMessage = 'JSON importado. Las imágenes se reconstruyeron en su posición original.';
  }

  selectedMarker(): BodyMarker | null {
    if (!this.selectedMarkerId) {
      return null;
    }

    return (
      this.markersByView[this.currentView].find((marker) => marker.id === this.selectedMarkerId) ??
      null
    );
  }

  selectedMarkerLabel(): string {
    const marker = this.selectedMarker();
    if (!marker) {
      return '';
    }

    return this.activeZones.find((zone) => zone.id === marker.bodyPart)?.label ?? '';
  }

  selectedMarkerLocked(): boolean {
    return this.selectedMarker()?.locked ?? false;
  }

  toggleSelectedMarkerLock(): void {
    const marker = this.selectedMarker();
    if (!marker) {
      return;
    }

    this.setMarkerLocked(marker.id, !marker.locked);
  }

  nudgeSelectedBodyPart(deltaX: number, deltaY: number): void {
    if (!this.selectedBodyPart) {
      this.statusMessage = 'Selecciona primero una zona corporal para moverla.';
      return;
    }

    this.nudgeBodyPart(this.selectedBodyPart, deltaX, deltaY);
  }

  resetSelectedBodyPart(): void {
    if (!this.selectedBodyPart) {
      this.statusMessage = 'Selecciona primero una zona corporal para restablecerla.';
      return;
    }

    this.nudgeBodyPart(
      this.selectedBodyPart,
      -this.bodyPartOffset(this.selectedBodyPart).x,
      -this.bodyPartOffset(this.selectedBodyPart).y,
    );
  }

  bodyPartTransform(bodyPart: BodyPart): string | null {
    const offset = this.bodyPartOffset(bodyPart);
    if (!offset.x && !offset.y) {
      return null;
    }

    return `translate(${offset.x} ${offset.y})`;
  }

  selectedBodyPartLabel(): string {
    if (!this.selectedBodyPart) {
      return '';
    }

    const deltaX = event.clientX - this.dragStart.x;
    const deltaY = event.clientY - this.dragStart.y;
    if (Math.hypot(deltaX, deltaY) < 4 && !this.dragStarted) {
      return;
    }

    this.dragStarted = true;
    this.modelRotation.y += deltaX * 0.008;
    this.modelRotation.x = this.clamp(this.modelRotation.x + deltaY * 0.006, -0.7, 0.7);
    this.modelGroup.rotation.set(this.modelRotation.x, this.modelRotation.y, 0);
    this.dragStart = { x: event.clientX, y: event.clientY };
  }

  onCanvasPointerUp(event: PointerEvent): void {
    this.renderer?.domElement.releasePointerCapture(event.pointerId);
    this.isDraggingModel = false;
    if (!this.dragStarted) {
      this.handleCanvasClick(event);
    }
  }

  onCanvasWheel(event: WheelEvent): void {
    event.preventDefault();
    this.cameraDistance = this.clamp(this.cameraDistance + event.deltaY * 0.004, 3.2, 7.5);
    this.updateCameraDistance();
  }

  private async initializeThree(): Promise<void> {
    try {
      this.three = await this.threeLoader.load();
    } catch {
      this.statusMessage = 'No se pudo cargar Three.js. Revisa la conexión e inténtalo de nuevo.';
      return;
    }

    this.scene = new this.three.Scene();
    this.scene.background = new this.three.Color('#f5f1ed');
    this.camera = new this.three.PerspectiveCamera(42, 1, 0.1, 100);
    this.camera.position.set(0, 1.15, this.cameraDistance);
    this.camera.lookAt(0, 0.9, 0);
    this.renderer = new this.three.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.threeHost.nativeElement.appendChild(this.renderer.domElement);
    this.raycaster = new this.three.Raycaster();
    this.pointer = new this.three.Vector2();

    this.addLights();
    this.createHumanModel();
    this.bindRendererEvents();
    this.resizeObserver = new ResizeObserver(() => this.resizeRenderer());
    this.resizeObserver.observe(this.threeHost.nativeElement);
    this.resizeRenderer();
    this.animate();
  }

  private bindRendererEvents(): void {
    if (!this.renderer) {
      return;
    }

    const canvas = this.renderer.domElement;
    canvas.addEventListener('pointerdown', (event) => this.onCanvasPointerDown(event));
    canvas.addEventListener('pointermove', (event) => this.onCanvasPointerMove(event));
    canvas.addEventListener('pointerup', (event) => this.onCanvasPointerUp(event));
    canvas.addEventListener('wheel', (event) => this.onCanvasWheel(event), { passive: false });
  }

  private addLights(): void {
    if (!this.three || !this.scene) {
      return;
    }

    const ambient = new this.three.AmbientLight(0xffffff, 0.72);
    const key = new this.three.DirectionalLight(0xffffff, 1.45);
    key.position.set(3, 4, 5);
    const fill = new this.three.DirectionalLight(0xd7c6b8, 0.75);
    fill.position.set(-4, 2, -3);
    this.scene.add(ambient);
    this.scene.add(key);
    this.scene.add(fill);
  }

  private createHumanModel(): void {
    if (!this.three || !this.scene) {
      return;
    }

    const material = new this.three.MeshStandardMaterial({
      color: 0xd8c9bd,
      roughness: 0.62,
      metalness: 0.03,
    });
    this.modelGroup = new this.three.Group();
    this.scene.add(this.modelGroup);

    this.addBodyPart('head', 'Cabeza', new this.three.SphereGeometry(0.34, 36, 24), material, {
      position: [0, 2.58, 0],
      scale: [0.92, 1.1, 0.9],
    });
    this.addBodyPart(
      'torso',
      'Torso',
      new this.three.CapsuleGeometry(0.54, 1.22, 18, 34),
      material,
      {
        position: [0, 1.38, 0],
        scale: [1.05, 1, 0.62],
      },
    );
    this.addBodyPart(
      'left-arm',
      'Brazo izquierdo',
      new this.three.CapsuleGeometry(0.16, 1.45, 14, 24),
      material,
      {
        position: [-0.74, 1.28, 0],
        rotation: [0, 0, -0.18],
      },
    );
    this.addBodyPart(
      'right-arm',
      'Brazo derecho',
      new this.three.CapsuleGeometry(0.16, 1.45, 14, 24),
      material,
      {
        position: [0.74, 1.28, 0],
        rotation: [0, 0, 0.18],
      },
    );
    this.addBodyPart(
      'left-leg',
      'Pierna izquierda',
      new this.three.CapsuleGeometry(0.2, 1.42, 14, 24),
      material,
      {
        position: [-0.25, -0.38, 0],
        rotation: [0, 0, 0.04],
      },
    );
    this.addBodyPart(
      'right-leg',
      'Pierna derecha',
      new this.three.CapsuleGeometry(0.2, 1.42, 14, 24),
      material,
      {
        position: [0.25, -0.38, 0],
        rotation: [0, 0, -0.04],
      },
    );
  }

  private addBodyPart(
    id: BodyPart,
    label: string,
    geometry: ThreeGeometry,
    material: ThreeMaterial,
    config: {
      position: [number, number, number];
      rotation?: [number, number, number];
      scale?: [number, number, number];
    },
  ): void {
    if (!this.three || !this.modelGroup) {
      return;
    }

    const mesh = new this.three.Mesh(geometry, material);
    mesh.position.set(...config.position);
    mesh.rotation.set(...(config.rotation ?? [0, 0, 0]));
    mesh.scale.set(...(config.scale ?? [1, 1, 1]));
    mesh.userData['bodyPart'] = id;
    mesh.userData['bodyPartLabel'] = label;
    this.modelGroup.add(mesh);
    this.raycastMeshes.push(mesh);
    this.bodyParts.set(id, {
      id,
      label,
      mesh,
      baseRotation: { x: mesh.rotation.x, y: mesh.rotation.y, z: mesh.rotation.z },
    });
  }

  private handleCanvasClick(event: PointerEvent): void {
    const decalHit = this.intersect(event, this.decalMeshes)[0];
    if (decalHit) {
      this.selectDecal(decalHit.object.userData['decalId'] as string);
      return;
    }

    const bodyHit = this.intersect(event, this.raycastMeshes)[0];
    if (!bodyHit) {
      this.selectedBodyPart = null;
      this.selectedDecalId = null;
      return;
    }

    const bodyPart = bodyHit.object.userData['bodyPart'] as BodyPart;
    this.selectedBodyPart = bodyPart;
    this.selectedPartPose = 0;
    if (this.pendingImageUrl && this.pendingTexture) {
      this.placeDecal(bodyHit, bodyPart);
      return;
    }

    this.statusMessage = `${this.bodyPartLabel(bodyPart)} seleccionada. Sube un tattoo para aplicarlo aquí.`;
  }

  private intersect(event: PointerEvent, objects: ThreeMesh[]): ThreeIntersection[] {
    if (!this.camera || !this.raycaster || !this.pointer || !this.renderer) {
      return [];
    }

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.pointer, this.camera);
    return this.raycaster.intersectObjects(objects, false);
  }

  private placeDecal(hit: ThreeIntersection, bodyPart: BodyPart): void {
    if (!this.three || !this.pendingTexture) {
      return;
    }

    const parent = hit.object as ThreeMesh;
    const worldNormal = this.worldNormalFromHit(hit);
    const parentQuaternion = parent.getWorldQuaternion(new this.three.Quaternion());
    const localNormal = worldNormal
      .clone()
      .applyQuaternion(parentQuaternion.clone().invert())
      .normalize();
    const localPosition = parent.worldToLocal(
      hit.point.clone().add(worldNormal.clone().multiplyScalar(0.012)),
    );
    const decal: TattooDecal = {
      id: this.createId(),
      imageUrl: this.pendingImageUrl,
      bodyPart,
      position: this.vectorToValue(localPosition),
      normal: this.vectorToValue(localNormal),
      size: this.selectedDecalSize,
      rotation: this.selectedDecalRotation,
      locked: false,
    };

    this.createDecalRuntime(decal, parent, this.createTexture(this.pendingImageUrl));
    this.selectDecal(decal.id);
    this.statusMessage = `${this.bodyPartLabel(bodyPart)}: tattoo aplicado. Ajusta tamaño/rotación y bloquéalo cuando esté listo.`;
  }

  private addDecalFromData(decal: TattooDecal): void {
    const parent = this.bodyParts.get(decal.bodyPart)?.mesh;
    if (!parent || !this.three) {
      return;
    }

    this.createDecalRuntime({ ...decal }, parent, this.createTexture(decal.imageUrl));
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
        draggable: !marker.locked,
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
    const mesh = new this.three.Mesh(geometry, material);
    mesh.position.set(decal.position.x, decal.position.y, decal.position.z);
    mesh.quaternion.copy(this.quaternionFromNormal(decal.normal, decal.rotation));
    mesh.renderOrder = 10;
    mesh.userData['decalId'] = decal.id;
    parent.add(mesh);
    this.decals.set(decal.id, { data: decal, mesh, material, geometry, texture, parent });
    this.decalMeshes.push(mesh);
  }

  private rebuildDecal(decalId: string): void {
    const runtime = this.decals.get(decalId);
    if (!runtime || !this.three) {
      return;
    }

    const marker = this.markersByView[this.currentView].find((item) => item.id === markerId);
    this.selectedMarkerId = markerId;
    this.selectedBodyPart = marker?.bodyPart ?? this.selectedBodyPart;
    this.transformer.nodes(marker?.locked ? [] : [node]);
    this.transformerLayer.batchDraw();
  }

  private removeDecal(decalId: string): void {
    const runtime = this.decals.get(decalId);
    if (!runtime) {
      return;
    }

    runtime.parent.remove(runtime.mesh);
    runtime.geometry.dispose();
    runtime.material.dispose();
    runtime.texture.dispose();
    this.decals.delete(decalId);
    const meshIndex = this.decalMeshes.indexOf(runtime.mesh);
    if (meshIndex >= 0) {
      this.decalMeshes.splice(meshIndex, 1);
    }
  }

  private setMarkerLocked(markerId: string, locked: boolean): void {
    this.markersByView[this.currentView] = this.markersByView[this.currentView].map((marker) =>
      marker.id === markerId ? { ...marker, locked } : marker,
    );

    const node = this.markerNodes.get(markerId);
    node?.draggable(!locked);
    this.transformer?.nodes(locked || !node ? [] : [node]);
    this.transformerLayer?.batchDraw();
    this.statusMessage = locked
      ? 'Imagen bloqueada. Ahora se moverá junto con su zona corporal.'
      : 'Imagen desbloqueada. Puedes arrastrarla, escalarla y girarla otra vez.';
  }

  private nudgeBodyPart(bodyPart: BodyPart, deltaX: number, deltaY: number): void {
    if (!deltaX && !deltaY) {
      return;
    }

    const currentOffset = this.bodyPartOffset(bodyPart);
    this.partOffsetsByView[this.currentView] = {
      ...this.partOffsetsByView[this.currentView],
      [bodyPart]: {
        x: this.round(currentOffset.x + deltaX),
        y: this.round(currentOffset.y + deltaY),
      },
    };

    this.markersByView[this.currentView] = this.markersByView[this.currentView].map((marker) => {
      if (marker.bodyPart !== bodyPart || !marker.locked) {
        return marker;
      }

      const node = this.markerNodes.get(marker.id);
      const x = this.round(marker.x + deltaX);
      const y = this.round(marker.y + deltaY);
      node?.x(x);
      node?.y(y);

      return { ...marker, x, y };
    });

    this.imageLayer?.batchDraw();
    this.statusMessage = 'Zona movida. Las imágenes bloqueadas a esa parte del cuerpo la siguen.';
  }

  private bodyPartOffset(bodyPart: BodyPart): BodyPartOffset {
    return this.partOffsetsByView[this.currentView][bodyPart] ?? { x: 0, y: 0 };
  }

  private updateMarkerFromNode(markerId: string, node: KonvaNode): void {
    this.markersByView[this.currentView] = this.markersByView[this.currentView].map((marker) => {
      if (marker.id !== markerId) {
        return marker;
      }

  private selectDecal(decalId: string): void {
    const decal = this.decals.get(decalId)?.data;
    if (!decal) {
      return;
    }

    this.selectedDecalId = decalId;
    this.selectedBodyPart = decal.bodyPart;
    this.selectedDecalSize = decal.size;
    this.selectedDecalRotation = decal.rotation;
    this.statusMessage = `Decal seleccionado en ${this.bodyPartLabel(decal.bodyPart)}.`;
  }

  private applyPartPose(bodyPart: BodyPart, pose: number): void {
    const runtime = this.bodyParts.get(bodyPart);
    if (!runtime) {
      return;
    }

    const radians = (pose * Math.PI) / 180;
    runtime.mesh.rotation.set(
      runtime.baseRotation.x,
      runtime.baseRotation.y,
      runtime.baseRotation.z,
    );
    if (bodyPart.includes('arm')) {
      runtime.mesh.rotation.z =
        runtime.baseRotation.z + (bodyPart === 'left-arm' ? -radians : radians);
    } else if (bodyPart.includes('leg')) {
      runtime.mesh.rotation.x = runtime.baseRotation.x + radians;
    } else {
      runtime.mesh.rotation.y = runtime.baseRotation.y + radians;
    }
  }

  private worldNormalFromHit(hit: ThreeIntersection): ThreeVector3 {
    const three = this.three as ThreeNamespace;
    if (!hit.face) {
      return new three.Vector3(0, 0, 1);
    }

    const normal = hit.face.normal.clone();
    normal.applyQuaternion(hit.object.getWorldQuaternion(new three.Quaternion())).normalize();
    return normal;
  }

  private quaternionFromNormal(
    normal: { x: number; y: number; z: number },
    rotationDegrees: number,
  ): ThreeQuaternion {
    const three = this.three as ThreeNamespace;
    const normalVector = new three.Vector3(normal.x, normal.y, normal.z).normalize();
    const quaternion = new three.Quaternion().setFromUnitVectors(
      new three.Vector3(0, 0, 1),
      normalVector,
    );
    const spin = new three.Quaternion().setFromAxisAngle(
      new three.Vector3(0, 0, 1),
      (rotationDegrees * Math.PI) / 180,
    );
    return quaternion.multiply(spin);
  }

  private loadPendingTexture(imageUrl: string): void {
    if (!this.three) {
      return;
    }

    this.pendingTexture?.dispose();
    this.pendingTexture = this.createTexture(imageUrl);
  }

  private createTexture(imageUrl: string): ThreeTexture {
    const three = this.three as ThreeNamespace;
    const texture = new three.TextureLoader().load(imageUrl, (loadedTexture) => {
      loadedTexture.colorSpace = three.SRGBColorSpace;
    });
    texture.colorSpace = three.SRGBColorSpace;
    return texture;
  }

  private resizeRenderer(): void {
    if (!this.renderer || !this.camera) {
      return;
    }

    const width = this.threeHost.nativeElement.clientWidth;
    const height = this.threeHost.nativeElement.clientHeight;
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  private updateCameraDistance(): void {
    if (!this.camera) {
      return;
    }

    this.camera.position.set(0, 1.15, this.cameraDistance);
    this.camera.lookAt(0, 0.9, 0);
  }

  private animate(): void {
    if (!this.renderer || !this.scene || !this.camera) {
      return;
    }

    this.renderer.render(this.scene, this.camera);
    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }

  private parseImportedJson(value: string): TattooDecalDocument | null {
    if (!value.trim()) {
      this.statusMessage = 'Pega un JSON exportado antes de importar.';
      return null;
    }

    try {
      const parsed = JSON.parse(value) as unknown;
      if (!this.isTattooDecalDocument(parsed)) {
        this.statusMessage = 'El JSON no cumple la estructura esperada para decals 3D.';
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

    return (
      this.isMarkerArray(value['front'], 'front') &&
      this.isMarkerArray(value['back'], 'back') &&
      this.isOptionalPartOffsets(value['partOffsets'])
    );
  }

  private isMarkerArray(value: unknown, view: BodyView): value is BodyMarker[] {
    if (!Array.isArray(value)) {
      return false;
    }

    const allowedParts = new Set(this.zones[view].map((zone) => zone.id));
    return value.every((marker) => this.isBodyMarker(marker, allowedParts));
  }

  private isTattooDecal(value: unknown): value is TattooDecal {
    if (!this.isRecord(value)) {
      return false;
    }

    return (
      typeof value['id'] === 'string' &&
      typeof value['imageUrl'] === 'string' &&
      (typeof value['locked'] === 'boolean' || typeof value['locked'] === 'undefined') &&
      allowedParts.has(value['bodyPart'] as BodyPart) &&
      this.isFiniteNumber(value['x']) &&
      this.isFiniteNumber(value['y']) &&
      this.isFiniteNumber(value['z'])
    );
  }

  private isOptionalPartOffsets(value: unknown): boolean {
    if (typeof value === 'undefined') {
      return true;
    }

    if (!this.isRecord(value)) {
      return false;
    }

    return (['front', 'back'] as BodyView[]).every((view) => {
      const offsetsForView = value[view];
      if (typeof offsetsForView === 'undefined') {
        return true;
      }

      if (!this.isRecord(offsetsForView)) {
        return false;
      }

      const allowedParts = new Set(this.zones[view].map((zone) => zone.id));
      return Object.entries(offsetsForView).every(
        ([bodyPart, offset]) =>
          allowedParts.has(bodyPart as BodyPart) &&
          this.isRecord(offset) &&
          this.isFiniteNumber(offset['x']) &&
          this.isFiniteNumber(offset['y']),
      );
    });
  }

  private normalizeMarkers(markers: BodyMarker[]): BodyMarker[] {
    return markers.map((marker) => ({
      ...marker,
      locked: marker.locked ?? false,
    }));
  }

  private normalizePartOffsets(
    value: BodyMarkerDocument['partOffsets'] | undefined,
  ): Record<BodyView, BodyPartOffsets> {
    const normalized: Record<BodyView, BodyPartOffsets> = { front: {}, back: {} };

    (['front', 'back'] as BodyView[]).forEach((view) => {
      this.zones[view].forEach((zone) => {
        const offset = value?.[view]?.[zone.id];
        if (!offset) {
          return;
        }

        normalized[view][zone.id] = {
          x: this.round(offset.x),
          y: this.round(offset.y),
        };
      });
    });

    return normalized;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private isFiniteNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
  }

  private vectorToValue(vector: ThreeVector3): { x: number; y: number; z: number } {
    return {
      x: this.round(vector.x),
      y: this.round(vector.y),
      z: this.round(vector.z),
    };
  }

  private bodyPartLabel(bodyPart: BodyPart): string {
    return this.zones.find((zone) => zone.id === bodyPart)?.label ?? bodyPart;
  }

  private createId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }

    return `decal-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  private round(value: number): number {
    return Number(value.toFixed(3));
  }
}
