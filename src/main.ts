import { 
  PlayerType, UnitType, BuildingType, TileType, Position, Resources,
  GameState, GameMap, Tile, Unit, Building, Player,
  TILE_SIZE, MAP_WIDTH, MAP_HEIGHT
} from './types';
import { Renderer } from './renderer';

class RTSGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private renderer: Renderer;
  private state: GameState;
  private keys: Set<string> = new Set();
  private isDragging: boolean = false;
  private dragStart: Position = { x: 0, y: 0 };
  private dragEnd: Position = { x: 0, y: 0 };
  private isPlacingBuilding: BuildingType | null = null;

  constructor() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.renderer = new Renderer(this.ctx);
    this.state = this.initGame();
    this.setupEventListeners();
    this.updateUI();
    this.gameLoop();
  }

  private initGame(): GameState {
    const map = this.generateMap();
    const players = new Map<PlayerType, Player>();
    const units = new Map<number, Unit>();
    const buildings = new Map<number, Building>();

    players.set(PlayerType.HUMAN, {
      id: PlayerType.HUMAN,
      resources: { gold: 500, wood: 500 },
      units: [],
      buildings: [],
      maxUnits: 20
    });

    players.set(PlayerType.AI, {
      id: PlayerType.AI,
      resources: { gold: 500, wood: 500 },
      units: [],
      buildings: [],
      maxUnits: 20
    });

    const townHall = this.createBuilding(BuildingType.TOWN_HALL, PlayerType.HUMAN, { x: 5, y: 5 });
    buildings.set(townHall.id, townHall);
    players.get(PlayerType.HUMAN)!.buildings.push(townHall.id);

    const aiTownHall = this.createBuilding(BuildingType.TOWN_HALL, PlayerType.AI, { x: MAP_WIDTH - 8, y: MAP_HEIGHT - 8 });
    buildings.set(aiTownHall.id, aiTownHall);
    players.get(PlayerType.AI)!.buildings.push(aiTownHall.id);

    for (let i = 0; i < 3; i++) {
      const worker = this.createUnit(UnitType.WORKER, PlayerType.HUMAN, { x: 7 + i, y: 7 });
      units.set(worker.id, worker);
      players.get(PlayerType.HUMAN)!.units.push(worker.id);
    }

    for (let i = 0; i < 3; i++) {
      const worker = this.createUnit(UnitType.WORKER, PlayerType.AI, { x: MAP_WIDTH - 9 + i, y: MAP_HEIGHT - 7 });
      units.set(worker.id, worker);
      players.get(PlayerType.AI)!.units.push(worker.id);
    }

    return {
      map,
      players,
      units,
      buildings,
      nextUnitId: 1,
      nextBuildingId: 1,
      selectedUnits: [],
      mousePosition: { x: 0, y: 0 },
      cameraPosition: { x: 0, y: 0 },
      gameTime: 0,
      lastUpdate: performance.now()
    };
  }

  private generateMap(): GameMap {
    const tiles: Tile[][] = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
      tiles[y] = [];
      for (let x = 0; x < MAP_WIDTH; x++) {
        let type = TileType.GRASS;
        if (Math.random() < 0.15) type = TileType.FOREST;
        else if (Math.random() < 0.03) type = TileType.GOLD_DEPOSIT;
        else if (Math.random() < 0.02) type = TileType.WATER;
        else if (Math.random() < 0.02) type = TileType.MOUNTAIN;
        tiles[y][x] = { type, position: { x, y } };
      }
    }
    for (let y = 3; y < 8; y++) {
      for (let x = 3; x < 8; x++) tiles[y][x].type = TileType.GRASS;
    }
    for (let y = MAP_HEIGHT - 8; y < MAP_HEIGHT - 3; y++) {
      for (let x = MAP_WIDTH - 8; x < MAP_WIDTH - 3; x++) tiles[y][x].type = TileType.GRASS;
    }
    return { width: MAP_WIDTH, height: MAP_HEIGHT, tiles };
  }

  private createUnit(type: UnitType, player: PlayerType, position: Position): Unit {
    const stats = this.getUnitStats(type);
    return {
      id: this.state.nextUnitId++,
      type,
      player,
      position,
      health: stats.health,
      maxHealth: stats.health,
      attack: stats.attack,
      defense: stats.defense,
      speed: stats.speed,
      range: stats.range,
      attackCooldown: 0,
      state: 'idle'
    };
  }

  private createBuilding(type: BuildingType, player: PlayerType, position: Position): Building {
    const stats = this.getBuildingStats(type);
    return {
      id: this.state.nextBuildingId++,
      type,
      player,
      position,
      health: stats.health,
      maxHealth: stats.health,
      size: stats.size,
      productionQueue: []
    };
  }

  private getUnitStats(type: UnitType) {
    const stats: Record<UnitType, { health: number; attack: number; defense: number; speed: number; range: number }> = {
      [UnitType.WORKER]: { health: 50, attack: 3, defense: 1, speed: 1.5, range: 1 },
      [UnitType.SOLDIER]: { health: 100, attack: 10, defense: 5, speed: 2, range: 1 },
      [UnitType.ARCHER]: { health: 70, attack: 8, defense: 2, speed: 2, range: 4 },
      [UnitType.CAVALRY]: { health: 120, attack: 12, defense: 4, speed: 3, range: 1 }
    };
    return stats[type];
  }

  private getBuildingStats(type: BuildingType) {
    const stats: Record<BuildingType, { health: number; size: [number, number] }> = {
      [BuildingType.TOWN_HALL]: { health: 500, size: [3, 3] },
      [BuildingType.BARRACKS]: { health: 300, size: [3, 2] },
      [BuildingType.HOUSE]: { health: 150, size: [2, 2] },
      [BuildingType.GOLD_MINE]: { health: 100, size: [2, 2] },
      [BuildingType.LUMBER_MILL]: { health: 100, size: [2, 2] }
    };
    return stats[type];
  }

  private setupEventListeners() {
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('wheel', (e) => this.onWheel(e));
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('keydown', (e) => this.keys.add(e.key));
    window.addEventListener('keyup', (e) => this.keys.delete(e.key));
  }

  private onMouseDown(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const screenPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const worldPos = this.screenToWorld(screenPos);

    if (this.isPlacingBuilding) {
      this.placeBuilding(worldPos);
      return;
    }

    if (e.button === 0) {
      this.isDragging = true;
      this.dragStart = worldPos;
      this.dragEnd = worldPos;
    } else if (e.button === 2) {
      for (const unitId of this.state.selectedUnits) {
        const unit = this.state.units.get(unitId);
        if (unit) {
          this.issueAttackCommand(unit, worldPos);
        }
      }
    }
  }

  private onMouseUp(e: MouseEvent) {
    if (e.button === 0 && this.isDragging) {
      this.isDragging = false;
      const minX = Math.min(this.dragStart.x, this.dragEnd.x);
      const maxX = Math.max(this.dragStart.x, this.dragEnd.x);
      const minY = Math.min(this.dragStart.y, this.dragEnd.y);
      const maxY = Math.max(this.dragStart.y, this.dragEnd.y);

      if (maxX - minX < 1 && maxY - minY < 1) {
        const clickedUnit = this.getUnitAtPosition(this.dragStart);
        if (clickedUnit && clickedUnit.player === PlayerType.HUMAN) {
          this.state.selectedUnits = [clickedUnit.id];
        } else {
          this.state.selectedUnits = [];
        }
      } else {
        const playerUnits = this.state.players.get(PlayerType.HUMAN)!.units
          .map(id => this.state.units.get(id)!)
          .filter(u => u && u.position.x >= minX && u.position.x <= maxX && u.position.y >= minY && u.position.y <= maxY);
        this.state.selectedUnits = playerUnits.map(u => u.id);
      }
      this.updateUI();
    }
  }

  private onMouseMove(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const screenPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    this.state.mousePosition = this.screenToWorld(screenPos);

    if (this.isDragging) {
      this.dragEnd = this.state.mousePosition;
    }
  }

  private onWheel(e: WheelEvent) {
    e.preventDefault();
  }

  private screenToWorld(screenPos: Position): Position {
    return {
      x: screenPos.x / TILE_SIZE + this.state.cameraPosition.x,
      y: screenPos.y / TILE_SIZE + this.state.cameraPosition.y
    };
  }

  private worldToScreen(worldPos: Position): Position {
    return {
      x: (worldPos.x - this.state.cameraPosition.x) * TILE_SIZE,
      y: (worldPos.y - this.state.cameraPosition.y) * TILE_SIZE
    };
  }

  private getUnitAtPosition(pos: Position): Unit | undefined {
    for (const [, unit] of this.state.units) {
      if (Math.abs(unit.position.x - pos.x) < 1 && Math.abs(unit.position.y - pos.y) < 1) {
        return unit;
      }
    }
    return undefined;
  }

  private placeBuilding(pos: Position) {
    if (!this.isPlacingBuilding) return;
    const player = this.state.players.get(PlayerType.HUMAN)!;
    const cost = { gold: 200, wood: 100 };
    if (player.resources.gold < cost.gold || player.resources.wood < cost.wood) return;

    const building = this.createBuilding(this.isPlacingBuilding, PlayerType.HUMAN, pos);
    this.state.buildings.set(building.id, building);
    player.buildings.push(building.id);
    player.resources.gold -= cost.gold;
    player.resources.wood -= cost.wood;
    this.isPlacingBuilding = null;
    this.updateUI();
  }

  private issueAttackCommand(unit: Unit, target: Position) {
    const enemies = Array.from(this.state.units.values())
      .filter(u => u.player !== unit.player && this.distance(u.position, target) < 5);
    if (enemies.length > 0) {
      const nearest = enemies.reduce((a, b) => 
        this.distance(a.position, unit.position) < this.distance(b.position, unit.position) ? a : b
      );
      unit.targetId = nearest.id;
      unit.state = 'attacking';
    }
  }

  private distance(a: Position, b: Position): number {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }

  private update(deltaTime: number) {
    this.state.gameTime += deltaTime;

    for (const [, player] of this.state.players) {
      player.units = player.units.filter(id => this.state.units.has(id));
      player.buildings = player.buildings.filter(id => this.state.buildings.has(id));
    }

    this.updateUnits(deltaTime);
    this.updateAI(deltaTime);
    this.updateProduction(deltaTime);
    this.updateCamera();
  }

  private updateUnits(deltaTime: number) {
    for (const [, unit] of this.state.units) {
      if (unit.state === 'attacking' && unit.targetId) {
        const target = this.state.units.get(unit.targetId);
        if (!target || target.health <= 0) {
          unit.state = 'idle';
          unit.targetId = undefined;
          continue;
        }
        const dist = this.distance(unit.position, target.position);
        if (dist <= unit.range) {
          if (unit.attackCooldown <= 0) {
            target.health -= Math.max(1, unit.attack - target.defense);
            unit.attackCooldown = 1;
          }
        } else {
          const dx = target.position.x - unit.position.x;
          const dy = target.position.y - unit.position.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          unit.position.x += (dx / len) * unit.speed * deltaTime;
          unit.position.y += (dy / len) * unit.speed * deltaTime;
        }
      }
      unit.attackCooldown = Math.max(0, unit.attackCooldown - deltaTime);
    }
  }

  private updateAI(deltaTime: number) {
    const aiPlayer = this.state.players.get(PlayerType.AI)!;
    const humanPlayer = this.state.players.get(PlayerType.HUMAN)!;

    if (this.state.gameTime > 5 && Math.random() < 0.01 * deltaTime) {
      const humanUnits = humanPlayer.units.map(id => this.state.units.get(id)!).filter(u => u && u.health > 0);
      if (humanUnits.length > 0 && aiPlayer.units.length < 10) {
        const attackUnit = humanUnits[Math.floor(Math.random() * humanUnits.length)];
        const aiUnit = aiPlayer.units.map(id => this.state.units.get(id)!).find(u => u && u.state === 'idle');
        if (aiUnit) {
          aiUnit.targetId = attackUnit.id;
          aiUnit.state = 'attacking';
        }
      }
    }

    if (aiPlayer.resources.gold >= 200 && aiPlayer.buildings.length < 3 && Math.random() < 0.005) {
      const pos = { 
        x: MAP_WIDTH - 5 + Math.random() * 3, 
        y: MAP_HEIGHT - 5 + Math.random() * 3 
      };
      const building = this.createBuilding(BuildingType.BARRACKS, PlayerType.AI, pos);
      this.state.buildings.set(building.id, building);
      aiPlayer.buildings.push(building.id);
      aiPlayer.resources.gold -= 200;
    }
  }

  private updateProduction(deltaTime: number) {
    for (const [, building] of this.state.buildings) {
      if (building.productionQueue.length > 0) {
        const production = building.productionQueue[0];
        production.progress += deltaTime;
        if (production.progress >= production.time) {
          this.spawnUnit(production.unitType, building.player, building.position);
          building.productionQueue.shift();
        }
      }
    }
  }

  private spawnUnit(type: UnitType, player: PlayerType, pos: Position) {
    const playerData = this.state.players.get(player)!;
    if (playerData.units.length >= playerData.maxUnits) return;

    const unit = this.createUnit(type, player, { x: pos.x + 1, y: pos.y + 1 });
    this.state.units.set(unit.id, unit);
    playerData.units.push(unit.id);
  }

  private updateCamera() {
    const speed = 10;
    if (this.keys.has('w') || this.keys.has('W')) this.state.cameraPosition.y -= speed * 0.016;
    if (this.keys.has('s') || this.keys.has('S')) this.state.cameraPosition.y += speed * 0.016;
    if (this.keys.has('a') || this.keys.has('A')) this.state.cameraPosition.x -= speed * 0.016;
    if (this.keys.has('d') || this.keys.has('D')) this.state.cameraPosition.x += speed * 0.016;

    this.state.cameraPosition.x = Math.max(0, Math.min(MAP_WIDTH - this.canvas.width / TILE_SIZE, this.state.cameraPosition.x));
    this.state.cameraPosition.y = Math.max(0, Math.min(MAP_HEIGHT - this.canvas.height / TILE_SIZE, this.state.cameraPosition.y));
  }

  private updateUI() {
    const player = this.state.players.get(PlayerType.HUMAN)!;
    document.getElementById('gold')!.textContent = String(player.resources.gold);
    document.getElementById('wood')!.textContent = String(player.resources.wood);
    document.getElementById('units')!.textContent = String(player.units.length);
    document.getElementById('max-units')!.textContent = String(player.maxUnits);

    const infoEl = document.getElementById('selection-info')!;
    if (this.state.selectedUnits.length === 1) {
      const unit = this.state.units.get(this.state.selectedUnits[0])!;
      infoEl.textContent = `${UnitType[unit.type]} HP: ${unit.health}/${unit.maxHealth}`;
    } else if (this.state.selectedUnits.length > 1) {
      infoEl.textContent = `Выбрано: ${this.state.selectedUnits.length} юнитов`;
    } else {
      infoEl.textContent = 'Ничего не выбрано';
    }
  }

  private render() {
    this.ctx.fillStyle = '#1A202C';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const startX = Math.floor(this.state.cameraPosition.x);
    const startY = Math.floor(this.state.cameraPosition.y);
    const endX = Math.min(startX + Math.ceil(this.canvas.width / TILE_SIZE) + 1, MAP_WIDTH);
    const endY = Math.min(startY + Math.ceil(this.canvas.height / TILE_SIZE) + 1, MAP_HEIGHT);

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const tile = this.state.map.tiles[y][x];
        const screen = this.worldToScreen({ x, y });
        this.renderer.renderTile(screen, tile);
      }
    }

    for (const [, building] of this.state.buildings) {
      const screen = this.worldToScreen(building.position);
      if (this.isInView(screen)) {
        this.renderer.renderBuilding(screen, building);
      }
    }

    for (const [, unit] of this.state.units) {
      const screen = this.worldToScreen(unit.position);
      if (this.isInView(screen)) {
        const selected = this.state.selectedUnits.includes(unit.id);
        this.renderer.renderUnit(screen, unit, selected);
      }
    }

    if (this.isDragging) {
      const start = this.worldToScreen(this.dragStart);
      const end = this.worldToScreen(this.dragEnd);
      this.renderer.renderSelectionBox(start, end);
    }
  }

  private isInView(screen: Position): boolean {
    return screen.x > -TILE_SIZE * 2 && screen.x < this.canvas.width + TILE_SIZE * 2 &&
           screen.y > -TILE_SIZE * 2 && screen.y < this.canvas.height + TILE_SIZE * 2;
  }

  private gameLoop() {
    const now = performance.now();
    const deltaTime = (now - this.state.lastUpdate) / 1000;
    this.state.lastUpdate = now;

    this.update(deltaTime);
    this.render();

    requestAnimationFrame(() => this.gameLoop());
  }

  public setPlacingBuilding(type: BuildingType | null) {
    this.isPlacingBuilding = type;
  }

  public addActionButton(label: string, cost: Resources, callback: () => void) {
    const actions = document.getElementById('actions')!;
    const btn = document.createElement('button');
    btn.className = 'action-btn';
    btn.textContent = `${label} (💰${cost.gold}/🪵${cost.wood})`;
    btn.onclick = callback;
    actions.appendChild(btn);
  }

  // Public API for UI actions
  public getState(): GameState {
    return this.state;
  }

  public tryCreateUnit(type: UnitType, pos?: Position): void {
    const costs: Record<UnitType, { gold: number; wood: number }> = {
      [UnitType.WORKER]: { gold: 50, wood: 0 },
      [UnitType.SOLDIER]: { gold: 100, wood: 0 },
      [UnitType.ARCHER]: { gold: 60, wood: 20 },
      [UnitType.CAVALRY]: { gold: 120, wood: 30 }
    };
    const cost = costs[type];
    const human = this.state.players.get(PlayerType.HUMAN)!;
    if (human.resources.gold >= cost.gold && human.resources.wood >= cost.wood) {
      const p = pos ?? { x: 7, y: 7 };
      const unit = this.createUnit(type, PlayerType.HUMAN, p);
      this.state.units.set(unit.id, unit);
      human.units.push(unit.id);
      human.resources.gold -= cost.gold;
      human.resources.wood -= cost.wood;
      this.updateUI();
    }
  }

  public tryPlaceBuilding(type: BuildingType, pos?: Position): void {
    const cost = { gold: 200, wood: 100 };
    const human = this.state.players.get(PlayerType.HUMAN)!;
    const p = pos ?? { x: 5, y: 5 };
    if (human.resources.gold >= cost.gold && human.resources.wood >= cost.wood) {
      const building = this.createBuilding(type, PlayerType.HUMAN, p);
      this.state.buildings.set(building.id, building);
      human.buildings.push(building.id);
      human.resources.gold -= cost.gold;
      human.resources.wood -= cost.wood;
      this.updateUI();
    }
  }
}

const game = new RTSGame();

game.addActionButton('Рабочий', { gold: 50, wood: 0 }, () => {
  game.tryCreateUnit(UnitType.WORKER, { x: 7, y: 7 });
});

game.addActionButton('Солдат', { gold: 100, wood: 0 }, () => {
  game.tryCreateUnit(UnitType.SOLDIER);
});

game.addActionButton('Дом', { gold: 50, wood: 100 }, () => {
  game.tryPlaceBuilding(BuildingType.HOUSE);
});

game.addActionButton('Казарма', { gold: 200, wood: 100 }, () => {
  game.tryPlaceBuilding(BuildingType.BARRACKS);
});

(window as any).game = game;
