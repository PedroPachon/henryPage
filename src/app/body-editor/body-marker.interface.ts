export type BodyView = 'front' | 'back';

export type BodyPart =
  | 'neck'
  | 'chest'
  | 'back'
  | 'left-arm'
  | 'right-arm'
  | 'left-leg'
  | 'right-leg';

export interface BodyMarker {
  id: string;
  imageUrl: string;
  bodyPart: BodyPart;
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
}

export interface BodyMarkerDocument {
  front: BodyMarker[];
  back: BodyMarker[];
}

export interface BodyZone {
  id: BodyPart;
  label: string;
  path: string;
  center: {
    x: number;
    y: number;
  };
}
