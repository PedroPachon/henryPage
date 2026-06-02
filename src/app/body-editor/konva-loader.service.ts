import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

declare global {
  interface Window {
    Konva?: KonvaNamespace;
  }
}

export interface KonvaNamespace {
  Stage: new (config: Record<string, unknown>) => KonvaStage;
  Layer: new (config?: Record<string, unknown>) => KonvaLayer;
  Image: new (config: Record<string, unknown>) => KonvaImageNode;
  Transformer: new (config: Record<string, unknown>) => KonvaTransformer;
}

export interface KonvaStage {
  width(value?: number): number;
  height(value?: number): number;
  scale(value: { x: number; y: number }): void;
  add(layer: KonvaLayer): void;
  on(eventName: string, handler: (event: KonvaEvent) => void): void;
  container(): HTMLElement;
  destroy(): void;
  draw(): void;
}

export interface KonvaLayer {
  add(node: KonvaNode): void;
  draw(): void;
  batchDraw(): void;
  destroyChildren(): void;
}

export interface KonvaNode {
  id(value?: string): string;
  x(value?: number): number;
  y(value?: number): number;
  scaleX(value?: number): number;
  scaleY(value?: number): number;
  rotation(value?: number): number;
  draggable(value?: boolean): void;
  on(eventName: string, handler: (event: KonvaEvent) => void): void;
  destroy(): void;
}

export interface KonvaImageNode extends KonvaNode {
  width(value?: number): number;
  height(value?: number): number;
}

export interface KonvaTransformer extends KonvaNode {
  nodes(nodes: KonvaNode[]): void;
  rotateEnabled(value: boolean): void;
  enabledAnchors(anchors: string[]): void;
}

export interface KonvaEvent {
  target: KonvaNode;
}

@Injectable({ providedIn: 'root' })
export class KonvaLoaderService {
  private readonly document = inject(DOCUMENT);
  private readonly source = 'https://unpkg.com/konva@10.0.12/konva.min.js';
  private loadingPromise?: Promise<KonvaNamespace>;

  load(): Promise<KonvaNamespace> {
    if (window.Konva) {
      return Promise.resolve(window.Konva);
    }

    this.loadingPromise ??= new Promise<KonvaNamespace>((resolve, reject) => {
      const existingScript = this.document.querySelector<HTMLScriptElement>(
        'script[data-konva-loader="true"]',
      );
      const script = existingScript ?? this.document.createElement('script');

      script.addEventListener(
        'load',
        () => {
          if (window.Konva) {
            resolve(window.Konva);
            return;
          }
          reject(new Error('Konva.js se cargó, pero no está disponible en window.Konva.'));
        },
        { once: true },
      );

      script.addEventListener(
        'error',
        () => {
          reject(new Error('No se pudo cargar Konva.js desde el CDN.'));
        },
        { once: true },
      );

      if (!existingScript) {
        script.src = this.source;
        script.async = true;
        script.defer = true;
        script.dataset['konvaLoader'] = 'true';
        this.document.head.appendChild(script);
      }
    });

    return this.loadingPromise;
  }
}
