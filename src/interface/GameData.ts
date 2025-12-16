/**
 * 物资
 * @param id 物资id
 * @param name 物资名称
 * @param position 物资位置
 * @param grade 物资等级
 * @param price 物资价值
 */
export interface Item {
    id?: string;
    name: string;
    position: Position;
    grade: number,
    price: number;
}

/**
 * 物资处理器（每个坐标独立，不合并）
 */
export class ItemHandler {
    // 使用 Map，键 = 所有字段拼接（除 id）
    private items = new Map<string, Item>();

    /** 生成唯一键（name + position + grade + price） */
    private makeKey(item: Omit<Item, 'id'>): string {
        return `${item.name}|${item.position.x},${item.position.y}|${item.grade}|${item.price}`;
    }

    /** 添加物资（坐标不同 → 新物品） */
    add(item: Omit<Item, 'id'> & { id?: string }): void {
        const key = this.makeKey(item);
        this.items.set(key, {
            ...item,
            id: item.id ?? '', // 保留 id 字段（可为空）
        });
    }

    /** 删除物资（精确匹配所有字段） */
    remove(item: Omit<Item, 'id'>): boolean {
        const key = this.makeKey(item);
        return this.items.delete(key);
    }

    /** 查询单个物资（精确匹配） */
    get(item: Omit<Item, 'id'>): Item | null {
        const key = this.makeKey(item);
        const found = this.items.get(key);
        return found ? {...found} : null;
    }

    /** 获取所有物资（返回副本） */
    list(): Item[] {
        return Array.from(this.items.values(), item => ({...item}));
    }

    /** 模糊查找（支持条件查询） */
    find(predicate: (item: Item) => boolean): Item[] {
        return this.list().filter(predicate);
    }

    /** 按坐标查找（常用） */
    findByPosition(x: number, y: number): Item | null {
        return this.find(item => item.position.x === x && item.position.y === y)[0] ?? null;
    }

    /** 按名称查找所有 */
    findByName(name: string): Item[] {
        return this.find(item => item.name === name);
    }

    /** 清空 */
    clear(): void {
        this.items.clear();
    }

    /** 总数 */
    get size(): number {
        return this.items.size;
    }
}
/**
 * 地图信息
 * @param name 地图名称
 */
export interface Map {
    name: string;
}
/**
 * 玩家信息
 * @param {string|number} id 玩家id
 * @param {string} name 玩家名称
 * @param {boolean} isBot 是否人机
 * @param {boolean} isBoss 是否BOSS
 * @param {boolean} isCheater 是否在作弊者队伍
 * @param {number} role 角色ID
 * @param {string} roleName 角色名称
 * @param {string} roleAlias 角色别名
 * @param {string} weapon 武器名称
 * @param {number} health 玩家生命值
 * @param {number} helmet 玩家头盔等级
 * @param {number} armor 玩家护甲等级
 * @param {number} [helmetDurability] 玩家头盔耐久度
 * @param {number} [armorDurability] 玩家护甲耐久度
 * @param {number} teamId 队伍id
 * @param {Position} position 玩家位置
 */
export interface Player {
    id?: string | number;
    name: string;
    isBot: boolean;
    isBoss: boolean
    isCheater: boolean;
    role: number;
    roleName: string;
    roleAlias: string;
    weapon: string;
    health: number;
    helmet?: number;
    armor?: number;
    helmetDurability?: number;
    armorDurability?: number;
    teamId: number;
    position: Position;
}

export class PlayerHandler {
    private players = new Map<string, Player>();     // key: name
    private cheatTeam = new Map<string, Player>();   // key: name

    /** 添加或更新玩家 */
    add(player: Player): void {
        const key = player.name;
        const existing = this.players.get(key);

        if (!existing) {
            this.players.set(key, { ...player });
        } else {
            Object.assign(existing, player);
        }

        // === 作弊者同步逻辑 ===
        if (player.isCheater) {
            if (!this.cheatTeam.has(key)) {
                this.cheatTeam.set(key, this.players.get(key)!);
            } else {
                Object.assign(this.cheatTeam.get(key)!, player);
            }
        } else {
            this.cheatTeam.delete(key);
        }
    }

    /** 删除玩家 */
    remove(player: Player | string): void {
        const key = typeof player === 'string' ? player : player.name;
        this.players.delete(key);
        this.cheatTeam.delete(key);
    }

    /** 查询单个 */
    get(name: string): Player | null {
        return this.players.get(name) ?? null;
    }

    /** 获取全部玩家（副本） */
    list(): Player[] {
        return Array.from(this.players.values());
    }

    /** 获取作弊者列表（副本） */
    listCheaters(): Player[] {
        return Array.from(this.cheatTeam.values());
    }

    /** 清空 */
    clear(): void {
        this.players.clear();
        this.cheatTeam.clear();
    }

    /** 查找机器人 */
    findBots(): Player[] {
        return this.list().filter(p => p.isBot);
    }

    /** 按队伍查找 */
    findByTeam(teamId: number): Player[] {
        return this.list().filter(p => p.teamId === teamId);
    }

    /** 按角色别名查找 */
    findByRoleAlias(alias: string): Player[] {
        return this.list().filter(p => p.roleAlias === alias);
    }

    /** 按武器查找 */
    findByWeapon(weapon: string): Player[] {
        return this.list().filter(p => p.weapon === weapon);
    }
}

/**
 * 死亡盒子
 * @param isBot 是否人机盒子 a
 * @param position 位置 b,c
 */
export interface Box {
    isBot?: boolean,
    position: Position,
}

/** 死亡盒子处理器 */
export class BoxHandler {
    private boxes = new Map<string, Box>();

    /** 生成唯一键：isBot|position.x,y */
    private makeKey(box: Box): string {
        return `${box.isBot ? 1 : 0}|${box.position.x},${box.position.y}`;
    }

    /** 添加箱子 */
    add(box: Box): void {
        const key = this.makeKey(box);
        this.boxes.set(key, { ...box }); // 深拷贝防止外部修改
    }

    /** 删除箱子 */
    remove(box: Box): boolean {
        return this.boxes.delete(this.makeKey(box));
    }

    /** 查询单个（精确匹配） */
    get(box: Box): Box | null {
        return this.boxes.get(this.makeKey(box)) ?? null;
    }

    /** 获取全部（副本） */
    list(): Box[] {
        return Array.from(this.boxes.values());
    }

    /** 清空 */
    clear(): void {
        this.boxes.clear();
    }

    /** 按坐标查找 */
    findByPosition(x: number, y: number): Box | null {
        const key = `0|${x},${y}`;
        const keyBot = `1|${x},${y}`;
        return this.boxes.get(key) ?? this.boxes.get(keyBot) ?? null;
    }

    /** 查找所有人机盒子 */
    findBotBoxes(): Box[] {
        return this.list().filter(b => b.isBot);
    }

    /** 查找所有玩家盒子 */
    findPlayerBoxes(): Box[] {
        return this.list().filter(b => !b.isBot);
    }
}

export interface Position {
    x: number;
    y: number;
    z?: number;
    angle?: number;
}