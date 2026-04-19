import { Unit, Building, Tile, PlayerType, UnitType, BuildingType, TileType, Position, TILE_SIZE } from './types';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private cachedSprites: Map<string, HTMLCanvasElement> = new Map();

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    this.preRenderSprites();
  }

  private preRenderSprites() {
    this.cachedSprites.clear();
    
    const unitTypes: UnitType[] = [UnitType.WORKER, UnitType.SOLDIER, UnitType.ARCHER, UnitType.CAVALRY];
    for (const unitType of unitTypes) {
      const canvas = document.createElement('canvas');
      canvas.width = TILE_SIZE;
      canvas.height = TILE_SIZE;
      const spriteCtx = canvas.getContext('2d')!;
      this.drawUnitSprite(spriteCtx, unitType, PlayerType.HUMAN);
      this.cachedSprites.set(`unit_${unitType}`, canvas);
    }

    const buildingTypes: BuildingType[] = [BuildingType.TOWN_HALL, BuildingType.BARRACKS, BuildingType.HOUSE, BuildingType.GOLD_MINE, BuildingType.LUMBER_MILL];
    for (const buildingType of buildingTypes) {
      const canvas = document.createElement('canvas');
      canvas.width = TILE_SIZE * 2;
      canvas.height = TILE_SIZE * 2;
      const spriteCtx = canvas.getContext('2d')!;
      this.drawBuildingSprite(spriteCtx, buildingType);
      this.cachedSprites.set(`building_${buildingType}`, canvas);
    }

    const tileTypes: TileType[] = [TileType.GRASS, TileType.FOREST, TileType.GOLD_DEPOSIT, TileType.WATER, TileType.MOUNTAIN];
    for (const tileType of tileTypes) {
      const canvas = document.createElement('canvas');
      canvas.width = TILE_SIZE;
      canvas.height = TILE_SIZE;
      const spriteCtx = canvas.getContext('2d')!;
      this.drawTileSprite(spriteCtx, tileType);
      this.cachedSprites.set(`tile_${tileType}`, canvas);
    }
  }

  private drawTileSprite(ctx: CanvasRenderingContext2D, type: TileType) {
    const colors: Record<TileType, { base: string; detail: string }> = {
      [TileType.GRASS]: { base: '#276749', detail: '#38A169' },
      [TileType.FOREST]: { base: '#1D4E3C', detail: '#38A169' },
      [TileType.GOLD_DEPOSIT]: { base: '#744210', detail: '#F6E05E' },
      [TileType.WATER]: { base: '#2C5282', detail: '#4299E1' },
      [TileType.MOUNTAIN]: { base: '#4A5568', detail: '#718096' }
    };
    
    const c = colors[type];
    ctx.fillStyle = c.base;
    ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

    if (type === TileType.FOREST) {
      this.drawTree(ctx, 10, 25, 8);
      this.drawTree(ctx, 30, 20, 12);
    } else if (type === TileType.GOLD_DEPOSIT) {
      ctx.fillStyle = c.detail;
      ctx.beginPath();
      ctx.arc(20, 20, 8, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === TileType.WATER) {
      ctx.strokeStyle = c.detail;
      ctx.lineWidth = 2;
      for (let y = 5; y < TILE_SIZE; y += 10) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(10, y - 3, 20, y + 3, TILE_SIZE, y);
        ctx.stroke();
      }
    } else if (type === TileType.MOUNTAIN) {
      ctx.fillStyle = c.detail;
      ctx.beginPath();
      ctx.moveTo(5, 40);
      ctx.lineTo(15, 10);
      ctx.lineTo(25, 40);
      ctx.moveTo(20, 40);
      ctx.lineTo(35, 5);
      ctx.lineTo(50, 40);
      ctx.fill();
    }
  }

  private drawTree(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
    ctx.fillStyle = '#1D4E3C';
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size * 0.7, y);
    ctx.lineTo(x - size * 0.7, y);
    ctx.fill();
    ctx.fillStyle = '#38A169';
    ctx.beginPath();
    ctx.moveTo(x, y - size - 5);
    ctx.lineTo(x + size * 0.8, y - size * 0.3);
    ctx.lineTo(x - size * 0.8, y - size * 0.3);
    ctx.fill();
  }

  private drawUnitSprite(ctx: CanvasRenderingContext2D, type: UnitType, player: PlayerType) {
    const playerColors: Record<PlayerType, string> = {
      [PlayerType.HUMAN]: '#4A9FFF',
      [PlayerType.AI]: '#FF4A4A',
      [PlayerType.NEUTRAL]: '#AAAAAA'
    };

    ctx.fillStyle = '#00000033';
    ctx.beginPath();
    ctx.ellipse(20, 38, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    const y = 22;
    ctx.fillStyle = playerColors[player];
    ctx.beginPath();
    ctx.arc(20, y, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(16, y - 5, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1A202C';
    ctx.beginPath();
    ctx.arc(16, y - 5, 1.5, 0, Math.PI * 2);
    ctx.fill();

    if (type === UnitType.WORKER) {
      ctx.strokeStyle = '#5D4610';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(28, y);
      ctx.lineTo(35, y + 8);
      ctx.stroke();
    } else if (type === UnitType.SOLDIER) {
      ctx.strokeStyle = '#C53030';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(28, y - 8);
      ctx.lineTo(35, y + 5);
      ctx.stroke();
    } else if (type === UnitType.ARCHER) {
      ctx.strokeStyle = '#744210';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(32, y, 8, -Math.PI * 0.7, Math.PI * 0.7);
      ctx.stroke();
    } else if (type === UnitType.CAVALRY) {
      ctx.fillStyle = '#D69E2E';
      ctx.beginPath();
      ctx.arc(22, y + 2, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawBuildingSprite(ctx: CanvasRenderingContext2D, type: BuildingType) {
    const [w, h] = [80, 80];

    if (type === BuildingType.TOWN_HALL) {
      ctx.fillStyle = '#2D3748';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#4A5568';
      ctx.fillRect(5, 0, 15, h - 30);
      ctx.fillRect(60, 0, 15, h - 30);
      const grad = ctx.createLinearGradient(25, 10, 25, 70);
      grad.addColorStop(0, '#9F7AEA');
      grad.addColorStop(1, '#6B46C1');
      ctx.fillStyle = grad;
      ctx.fillRect(25, 10, 30, h - 40);
    } else if (type === BuildingType.BARRACKS) {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#C53030');
      grad.addColorStop(1, '#9B2C2C');
      ctx.fillStyle = grad;
      ctx.fillRect(5, 20, w - 10, h - 25);
      ctx.fillStyle = '#742A2A';
      ctx.beginPath();
      ctx.moveTo(0, 25);
      ctx.lineTo(w / 2, 0);
      ctx.lineTo(w, 25);
      ctx.fill();
    } else if (type === BuildingType.HOUSE) {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#DD6B20');
      grad.addColorStop(1, '#9C4221');
      ctx.fillStyle = grad;
      ctx.fillRect(8, 25, w - 16, h - 30);
      ctx.fillStyle = '#C05621';
      ctx.beginPath();
      ctx.moveTo(3, 28);
      ctx.lineTo(w / 2, 0);
      ctx.lineTo(w - 3, 28);
      ctx.fill();
    } else if (type === BuildingType.GOLD_MINE) {
      const grad = ctx.createRadialGradient(40, 40, 10, 40, 40, 40);
      grad.addColorStop(0, '#F6E05E');
      grad.addColorStop(1, '#744210');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(40, 40, 35, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === BuildingType.LUMBER_MILL) {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#38A169');
      grad.addColorStop(1, '#276749');
      ctx.fillStyle = grad;
      ctx.fillRect(5, 20, w - 10, h - 25);
      ctx.fillStyle = '#276749';
      ctx.beginPath();
      ctx.moveTo(0, 25);
      ctx.lineTo(w / 2, 0);
      ctx.lineTo(w, 25);
      ctx.fill();
    }
  }

  public renderTile(screenPos: Position, tile: Tile) {
    const key = `tile_${tile.type}`;
    const sprite = this.cachedSprites.get(key);
    if (sprite) {
      this.ctx.drawImage(sprite, screenPos.x, screenPos.y);
    }
  }

  public renderUnit(screenPos: Position, unit: Unit, selected: boolean) {
    const key = `unit_${unit.type}`;
    const sprite = this.cachedSprites.get(key);
    if (sprite) {
      this.ctx.drawImage(sprite, screenPos.x, screenPos.y);
    }

    const healthPercent = unit.health / unit.maxHealth;
    const barY = screenPos.y - 8;
    this.ctx.fillStyle = '#1A202C';
    this.ctx.fillRect(screenPos.x + 2, barY, TILE_SIZE - 4, 5);
    
    const healthColor = healthPercent > 0.6 ? '#48BB78' : healthPercent > 0.3 ? '#ECC94B' : '#F56565';
    this.ctx.fillStyle = healthColor;
    this.ctx.fillRect(screenPos.x + 2, barY, (TILE_SIZE - 4) * healthPercent, 5);

    if (selected) {
      this.ctx.strokeStyle = '#68D391';
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([4, 2]);
      this.ctx.beginPath();
      this.ctx.arc(screenPos.x + TILE_SIZE / 2, screenPos.y + TILE_SIZE / 2, 18, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    }
  }

  public renderBuilding(screenPos: Position, building: Building) {
    const key = `building_${building.type}`;
    const sprite = this.cachedSprites.get(key);
    if (sprite) {
      this.ctx.drawImage(sprite, screenPos.x, screenPos.y);
    }

    const healthPercent = building.health / building.maxHealth;
    const barY = screenPos.y - 10;
    this.ctx.fillStyle = '#1A202C';
    this.ctx.fillRect(screenPos.x + 5, barY, TILE_SIZE * 2 - 10, 6);
    
    const healthColor = healthPercent > 0.6 ? '#48BB78' : healthPercent > 0.3 ? '#ECC94B' : '#F56565';
    this.ctx.fillStyle = healthColor;
    this.ctx.fillRect(screenPos.x + 5, barY, (TILE_SIZE * 2 - 10) * healthPercent, 6);
  }

  public renderSelectionBox(start: Position, end: Position) {
    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);
    const w = Math.abs(end.x - start.x);
    const h = Math.abs(end.y - start.y);

    this.ctx.strokeStyle = '#68D391';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 3]);
    this.ctx.strokeRect(x, y, w, h);
    this.ctx.setLineDash([]);
    this.ctx.fillStyle = '#68D39133';
    this.ctx.fillRect(x, y, w, h);
  }

  public renderMinimap(state: { map: { tiles: Tile[][] }; buildings: Map<number, Building>; units: Map<number, Unit> }, width: number, height: number) {
    const scale = width / 40;
    
    this.ctx.fillStyle = '#1A202C';
    this.ctx.fillRect(0, 0, width, height);

    const tileColors: Record<TileType, string> = {
      [TileType.GRASS]: '#276749',
      [TileType.FOREST]: '#1D4E3C',
      [TileType.GOLD_DEPOSIT]: '#D69E2E',
      [TileType.WATER]: '#2C5282',
      [TileType.MOUNTAIN]: '#4A5568'
    };

    for (let y = 0; y < 30; y++) {
      for (let x = 0; x < 40; x++) {
        const tile = state.map.tiles[y][x];
        this.ctx.fillStyle = tileColors[tile.type];
        this.ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }

    for (const [, building] of state.buildings) {
      const color = building.player === PlayerType.HUMAN ? '#4A9FFF' : '#FF4A4A';
      this.ctx.fillStyle = color;
      this.ctx.fillRect(building.position.x * scale - 2, building.position.y * scale - 2, 4, 4);
    }

    for (const [, unit] of state.units) {
      const color = unit.player === PlayerType.HUMAN ? '#4A9FFF' : '#FF4A4A';
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(unit.position.x * scale, unit.position.y * scale, 1.5, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
}