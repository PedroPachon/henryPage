import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

declare global {
  interface Window {
    THREE?: ThreeNamespace;
  }
}

export interface ThreeNamespace {
  AmbientLight: new (color: number, intensity?: number) => ThreeLight;
  Box3: new () => ThreeBox3;
  CanvasTexture: new (image: HTMLCanvasElement | HTMLImageElement) => ThreeTexture;
  CapsuleGeometry: new (
    radius: number,
    length: number,
    capSegments?: number,
    radialSegments?: number,
  ) => ThreeGeometry;
  Clock: new () => { getDelta(): number };
  Color: new (color: number | string) => ThreeColor;
  DirectionalLight: new (color: number, intensity?: number) => ThreeLight;
  DoubleSide: number;
  Euler: new (x?: number, y?: number, z?: number, order?: string) => ThreeEuler;
  Group: new () => ThreeGroup;
  Mesh: new (geometry: ThreeGeometry, material: ThreeMaterial) => ThreeMesh;
  MeshBasicMaterial: new (parameters: Record<string, unknown>) => ThreeMaterial;
  MeshStandardMaterial: new (parameters: Record<string, unknown>) => ThreeMaterial;
  PerspectiveCamera: new (
    fov: number,
    aspect: number,
    near: number,
    far: number,
  ) => ThreePerspectiveCamera;
  PlaneGeometry: new (width: number, height: number) => ThreeGeometry;
  Quaternion: new () => ThreeQuaternion;
  Raycaster: new () => ThreeRaycaster;
  Scene: new () => ThreeScene;
  SphereGeometry: new (
    radius: number,
    widthSegments?: number,
    heightSegments?: number,
  ) => ThreeGeometry;
  SRGBColorSpace: string;
  TextureLoader: new () => ThreeTextureLoader;
  Vector2: new (x?: number, y?: number) => ThreeVector2;
  Vector3: new (x?: number, y?: number, z?: number) => ThreeVector3;
  WebGLRenderer: new (parameters: Record<string, unknown>) => ThreeRenderer;
}

export interface ThreeObject3D {
  position: ThreeVector3;
  rotation: ThreeEuler;
  quaternion: ThreeQuaternion;
  scale: ThreeVector3;
  userData: Record<string, unknown>;
  add(object: ThreeObject3D): void;
  remove(object: ThreeObject3D): void;
  rotateX(radians: number): void;
  rotateY(radians: number): void;
  rotateZ(radians: number): void;
  getWorldPosition(target: ThreeVector3): ThreeVector3;
  worldToLocal(vector: ThreeVector3): ThreeVector3;
  getWorldQuaternion(target: ThreeQuaternion): ThreeQuaternion;
}

export interface ThreeScene extends ThreeObject3D {
  background: ThreeColor | null;
  clear(): void;
}

export interface ThreeGroup extends ThreeObject3D {}

export interface ThreeMesh extends ThreeObject3D {
  geometry: ThreeGeometry;
  material: ThreeMaterial;
  renderOrder: number;
}

export interface ThreePerspectiveCamera extends ThreeObject3D {
  aspect: number;
  lookAt(x: number, y: number, z: number): void;
  updateProjectionMatrix(): void;
}

export interface ThreeRenderer {
  domElement: HTMLCanvasElement;
  dispose(): void;
  render(scene: ThreeScene, camera: ThreePerspectiveCamera): void;
  setPixelRatio(value: number): void;
  setSize(width: number, height: number): void;
}

export interface ThreeRaycaster {
  setFromCamera(pointer: ThreeVector2, camera: ThreePerspectiveCamera): void;
  intersectObjects(objects: ThreeObject3D[], recursive?: boolean): ThreeIntersection[];
}

export interface ThreeIntersection {
  object: ThreeObject3D;
  point: ThreeVector3;
  face?: { normal: ThreeVector3 } | null;
}

export interface ThreeTextureLoader {
  load(url: string, onLoad?: (texture: ThreeTexture) => void): ThreeTexture;
}

export interface ThreeTexture {
  colorSpace?: string;
  dispose(): void;
}

export interface ThreeMaterial {
  color?: ThreeColor;
  dispose(): void;
}

export interface ThreeGeometry {
  dispose(): void;
}

export interface ThreeLight extends ThreeObject3D {}

export interface ThreeBox3 {
  setFromObject(object: ThreeObject3D): ThreeBox3;
  getCenter(target: ThreeVector3): ThreeVector3;
}

export interface ThreeColor {}

export interface ThreeVector2 {
  x: number;
  y: number;
  set(x: number, y: number): ThreeVector2;
}

export interface ThreeVector3 {
  x: number;
  y: number;
  z: number;
  add(vector: ThreeVector3): ThreeVector3;
  applyQuaternion(quaternion: ThreeQuaternion): ThreeVector3;
  clone(): ThreeVector3;
  copy(vector: ThreeVector3): ThreeVector3;
  multiplyScalar(value: number): ThreeVector3;
  normalize(): ThreeVector3;
  set(x: number, y: number, z: number): ThreeVector3;
  sub(vector: ThreeVector3): ThreeVector3;
}

export interface ThreeEuler {
  x: number;
  y: number;
  z: number;
  set(x: number, y: number, z: number, order?: string): void;
}

export interface ThreeQuaternion {
  clone(): ThreeQuaternion;
  copy(quaternion: ThreeQuaternion): ThreeQuaternion;
  invert(): ThreeQuaternion;
  multiply(quaternion: ThreeQuaternion): ThreeQuaternion;
  setFromAxisAngle(axis: ThreeVector3, angle: number): ThreeQuaternion;
  setFromUnitVectors(from: ThreeVector3, to: ThreeVector3): ThreeQuaternion;
}

@Injectable({ providedIn: 'root' })
export class ThreeLoaderService {
  private readonly document = inject(DOCUMENT);
  private readonly source = 'https://unpkg.com/three@0.150.1/build/three.min.js';
  private loadingPromise?: Promise<ThreeNamespace>;

  load(): Promise<ThreeNamespace> {
    if (window.THREE) {
      return Promise.resolve(window.THREE);
    }

    this.loadingPromise ??= new Promise<ThreeNamespace>((resolve, reject) => {
      const existingScript = this.document.querySelector<HTMLScriptElement>(
        'script[data-three-loader="true"]',
      );
      const script = existingScript ?? this.document.createElement('script');

      script.addEventListener(
        'load',
        () => {
          if (window.THREE) {
            resolve(window.THREE);
            return;
          }
          reject(new Error('Three.js se cargó, pero no está disponible en window.THREE.'));
        },
        { once: true },
      );

      script.addEventListener(
        'error',
        () => reject(new Error('No se pudo cargar Three.js desde el CDN.')),
        { once: true },
      );

      if (!existingScript) {
        script.src = this.source;
        script.async = true;
        script.defer = true;
        script.dataset['threeLoader'] = 'true';
        this.document.head.appendChild(script);
      }
    });

    return this.loadingPromise;
  }
}
