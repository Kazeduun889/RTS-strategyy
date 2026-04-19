export enum PlayerType {
  HUMAN,
  AI,
  NEUTRAL
}

export enum UnitType {
  WORKER,
  SOLDIER,
  ARCHER,
  CAVALRY
}

export enum BuildingType {
  TOWN_HALL,
  BARRACKS,
  HOUSE,
  GOLD_MINE,
  LUMBER_MILL
}

export enum TileType {
  GRASS,
  FOREST,
  GOLD_DEPOSIT,
  WATER,
  MOUNTAIN
}

export interface Position {
  x: number;
  y: number;
}

export interface Resources {
  gold: number;
  wood: number;
}

export interface Unit {
  id: number;
  type: UnitType;
  player: PlayerType;
  position: Position;
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  speed: number;
  range: number;
  attackCooldown: number;
  targetId?: number;
  state: 'idle' | 'moving' | 'attacking' | 'gathering' | 'returning';
  gatherAmount?: number;
}

export interface Building {
  id: number;
  type: BuildingType;
  player: PlayerType;
  position: Position;
  health: number;
  maxHealth: number;
  size: [number, number];
  productionQueue: Array<{ unitType: UnitType; progress: number; time: number }>;
}

export interface Tile {
  type: TileType;
  position: Position;
}

export interface Player {
  id: PlayerType;
  resources: Resources;
  units: number[];
  buildings: number[];
  maxUnits: number;
}

export interface GameMap {
  width: number;
  height: number;
  tiles: Tile[][];
}

export interface GameState {
  map: GameMap;
  players: Map<PlayerType, Player>;
  units: Map<number, Unit>;
  buildings: Map<number, Building>;
  nextUnitId: number;
  nextBuildingId: number;
  selectedUnits: number[];
  selectedBuilding?: number;
  mousePosition: Position;
  cameraPosition: Position;
  gameTime: number;
  lastUpdate: number;
}

export const TILE_SIZE = 40;
export const MAP_WIDTH = 40;
export const MAP_HEIGHT = 30;