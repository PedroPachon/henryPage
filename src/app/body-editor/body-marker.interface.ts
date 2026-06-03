export type BodyPart = 'head' | 'torso' | 'left-arm' | 'right-arm' | 'left-leg' | 'right-leg';

export interface BodyZone {
  id: BodyPart;
  label: string;
}

export interface TattooDecal {
  id: string;
  imageUrl: string;
  bodyPart: BodyPart;
  position: Vector3Value;
  normal: Vector3Value;
  size: number;
  rotation: number;
  locked: boolean;
}

export interface TattooDecalDocument {
  decals: TattooDecal[];
}

export interface Vector3Value {
  x: number;
  y: number;
  z: number;
}
