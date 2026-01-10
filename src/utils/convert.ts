import type { RawData as RawData_un } from "@/interface/un/RawData.ts";
import type { RawData as RawData_ray } from "@/interface/ray/RawData.ts";
import type { RawData as RawData_other } from "@/interface/other/RawData.ts";
import type { Position, Item, Player, Map as GameMap, Box } from "@/interface/GameData.ts";
/**
 * 角色映射表
 */
const ROLE_NAME_MAP: Record<number, string> = {
    13: 'bt',12: 'zj', 11: 'yy', 10: 'wm', 5: 'mxw', 4: 'ln',
    3: 'myr', 2: 'sl', 9: 'wll', 1: 'g', 6: 'fy',
    8: 'wl', 7: 'hl',0: 'a'
} as const;

const ROLE_NAME_MAP_OFFICIAL: Record<number, string> = {
    2100654105: 'wl',
    2100654106: 'mxw',
    2100654107: 'fy',
    2100654108: 'll',
    2100654109: 'myr',
    2100654110: 'hl',
    2100654115: 'wll',
    2100654116: 'g',
    2100654117: 'sl',
    2100654118: 'wm',
    2100654119: 'zj',
    2100654120: 'yy',
    2100654121: 'bt',
} as const;

const ROLE_ALIAS_MAP: Record<string, string> = {
    'bt': '四眼仔','zj': '张姐', 'yy': '老登', 'wm': '神秘静步男', 'mxw': '麦晓鼠',
    'ln': '红温娜', 'myr': '牢大', 'sl': '教官', 'wll': '神秘堵桥男',
    'g': '女医', 'fy': '疯医', 'wl': '威风的龙', 'hl': '花来!', 'default': 'Boss', 'a': '机哥'
} as const;

const ROLE_NAME_MAP_CHINESE: Record<string, string> = {
    '露娜': 'ln',
    '疾风': 'zj',
    '牧羊人': 'myr',
    '佐亚': 'g',
    '威龙': 'wl',
    '红狼': 'hl',
    '无名': 'wm',
    '乌鲁鲁': 'wll',
    '骇爪': 'mxw',
    '深蓝': 'sl',
    '比特': 'bt',
    '银翼': 'yy',
    '蜂医': 'fy',
    '0': 'a',
} as const;

// Ray数据的全量状态存储
let rayFullState: {
    boxes: Map<string, Box>;
    items: Map<string, Item>;
    players: Map<string, Player>; // key: `${teamId}_${playerName}`
    bots: Map<string, Player>;    // key: `bot_${cx}_${cy}_${teamId}`
} | null = null;

/**
 * 重置Ray数据状态（用于游戏重新开始时）
 */
export function resetRayState(): void {
    rayFullState = null;
}

/**
 * 获取按队伍分组的玩家数据
 */
export function getPlayersByTeam(): Map<number, Player[]> {
    if (!rayFullState) return new Map();
    
    const teamMap = new Map<number, Player[]>();
    
    // 处理真实玩家
    rayFullState.players.forEach(player => {
        const teamId = player.teamId;
        if (!teamMap.has(teamId)) {
            teamMap.set(teamId, []);
        }
        teamMap.get(teamId)!.push(player);
    });
    
    // 处理人机（队伍ID为-1）
    const bots = Array.from(rayFullState.bots.values());
    if (bots.length > 0) {
        teamMap.set(-1, bots);
    }
    
    return teamMap;
}

/**
 * 调试函数：输出当前队伍分布情况
 */
export function debugTeamDistribution(): void {
    if (!rayFullState) {
        console.log('Ray状态未初始化');
        return;
    }
    
    const teamMap = getPlayersByTeam();
    console.log('=== 队伍分布调试信息 ===');
    console.log('总队伍数:', teamMap.size);
    
    teamMap.forEach((players, teamId) => {
        console.log(`队伍 ${teamId}:`, {
            玩家数: players.length,
            玩家列表: players.map(p => ({
                姓名: p.name,
                是否人机: p.isBot,
                是否作弊: p.isCheater,
                队伍ID: p.teamId
            }))
        });
    });
    
    // 检查原始存储的玩家数据
    console.log('原始玩家存储键值:', Array.from(rayFullState.players.keys()));
    console.log('原始人机存储键值:', Array.from(rayFullState.bots.keys()));
}

/**
 * 统一地图配置：名称 + 偏移量
 */
interface MapConfig {
    name: string;
    offset?: { x: number; y: number };
}

const MAP_CONFIG_TABLE: Record<number, MapConfig> = {
    0: { name: '', offset: { x: 0, y: 0 } },
    1: { name: 'daba', offset: { x: 357385, y: -769888 } }, // 零号大坝
    2: { name: 'cgxg', offset: { x: 400062, y: -641652 } }, // 长弓溪谷
    3: { name: 'bks',  offset: { x: 378673, y: -448841 } }, // 巴克什
    4: { name: 'htjd', offset: { x: 668720, y: -452754 } }, // 航天基地
    5: { name: 'cxjy', offset: { x: 53272,  y: -51971 } }, // 潮汐监狱
} as const;

// 默认配置（防止崩溃）
const DEFAULT_MAP_CONFIG: MapConfig = { name: '未知地图', offset: { x: 0, y: 0 } };
const NAME_TO_MAP_CONFIG = new Map<string, MapConfig>();
Object.values(MAP_CONFIG_TABLE).forEach(config => {
    if (config.name) {  // 排除空 name
        NAME_TO_MAP_CONFIG.set(config.name.toLowerCase(), config);
    }
});

// 核心函数：输入地图名（缩写），返回 MapConfig 或 undefined
function getMapConfig(mapName: string): MapConfig | undefined {
    return NAME_TO_MAP_CONFIG.get(mapName.trim().toLowerCase());
}
/**
 * 应用坐标偏移
 */
function applyOffset(pos: { x: number; y: number }, offset: { x: number; y: number }): Position {
    return {
        x: pos.x + offset.x,
        y: pos.y + offset.y,
    };
}

/**
 * 主转换函数
 */
export function convert_un(raw: RawData_un, itemsInfo: any[]): {
    boxes: Box[];
    items: Item[];
    map: GameMap;
    players: Player[];
} {
    const mapId = raw?.M2;
    const mapConfig = MAP_CONFIG_TABLE[mapId] ?? DEFAULT_MAP_CONFIG;
    const { name: mapName, offset } = mapConfig;

    let boxes: Box[] = [];
    let items: Item[] = [];
    let players: Player[] = [];
    // ========== Box ==========
    if (raw?.D2) {
        boxes = raw?.D2.map(d => ({
            isBot: d.a,
            position: applyOffset({ x: d.b, y: d.c }, offset),
        }));
    }


    // ========== Item ==========
    if (raw?.I2) {
        items = raw?.I2.map(item => {
            let itemInfo = itemsInfo.find(i => String(i.objectID) === item.b);

            if (!itemInfo) {
                return {
                    id: item.b,
                    price: item.e,
                    name: item.c,
                    grade: item.d,
                    position: applyOffset({ x: item.f, y: item.g }, offset),
                };
            } else {
                return {
                    id: item.b,
                    price: itemInfo?.avgPrice,
                    name: itemInfo.objectName,
                    grade: itemInfo?.grade,
                    position: applyOffset({ x: item.f, y: item.g }, offset),
                }
            }

        });
    }

    // ========== Map ==========
    const map: GameMap = { name: mapName };

    // ========== Player ==========
    if (raw?.P2) {
        players = raw.P2.map(player => {
            const roleId = player.g ?? 0;
            const roleKey = ROLE_NAME_MAP[roleId] ?? `unknown_${roleId}`;
            let roleName = roleKey;
            let roleAlias = ROLE_ALIAS_MAP[roleKey] ?? '';
            if (player.c === 1) {
                if (player.d === 1) {
                    roleName = 'Boss';
                    if (player.h === '德***兰') {
                        roleAlias = '德穆兰';
                    }
                    if (player.h === '赛***德') {
                        roleAlias = '赛伊德';
                    }
                    if (player.h === '雷***斯') {
                        roleAlias = '雷斯';
                    }
                    if (player.h === '渡***鸦') {
                        roleAlias = '渡鸦';
                    }
                    if (player.h === '典***长') {
                        roleAlias = '格赫罗斯';
                    }
                } else {
                    roleName = 'AI';
                    roleAlias = ROLE_ALIAS_MAP[roleKey] ?? '';
                }
            }

            const cheater = raw?.P2.find(cheatPlayer => cheatPlayer.e === 1);
            const cheaterStoryHeight = cheater?.s;
            return {
                name: player.h || '未知玩家',
                isBot: player.c === 1 || player.d === 1,
                isBoss: player.d === 1,
                isCheater: player.b === 1,
                cheaterOwner: player.e === 1,
                role: roleId,
                roleName: roleName,
                roleAlias: roleAlias,
                weapon: player.i || '未知武器',
                health: player.n ?? 100,
                helmet: player.j,
                helmetDurability: player.k,
                armor: player.l,
                armorDurability: player.m,
                teamId: player.f,
                position: {
                    ...applyOffset({ x: player.p, y: player.q }, offset),
                    z: Math.round(player.s / 100 - cheaterStoryHeight / 100),
                    angle: player.r,
                } as Position,
            };
        });
    }

    return { boxes, items, map, players };
}

export const convert_ray = (
    raw: RawData_ray,
    itemsInfo: any[],
    cheatTeamId: number
): {
    boxes: Box[];
    items: Item[];
    map: GameMap;
    players: Player[];
} => {
    const isDelta = raw.type === 'delta';

    // 地图配置
    const MAP_NAME: Record<number, string> = {
        0: '',
        1: 'bks',
        2: 'cgxg',
        3: 'htjd',
        4: 'daba',
        5: 'cxjy',
    };
    const map: GameMap = { name: MAP_NAME[raw.m ?? 0] ?? '未知地图' };

    // 初始化全量状态（如果是第一次或者不是增量数据）
    if (!isDelta || !rayFullState) {
        rayFullState = {
            boxes: new Map(),
            items: new Map(),
            players: new Map(),
            bots: new Map(),
        };
    }

    // ====================== 处理人机 (a) ======================
    if (raw.a) {
        if (Array.isArray(raw.a)) {
            // 全量数据：清空后重新添加
            rayFullState.bots.clear();
            raw.a.forEach((bot, index) => {
                if (bot.d !== 0) { // 只添加存活的人机
                    // 人机使用坐标和索引作为唯一标识，队伍ID设为-1表示中立
                    const botKey = `bot_${bot.cx}_${bot.cy}_${index}`;
                    const player: Player = {
                        name: `AI人机_${index}`, // 给每个人机一个唯一名称
                        isBot: true,
                        isBoss: bot.b === 1,
                        isCheater: false,
                        role: 0,
                        roleName: 'AI',
                        roleAlias: '人机',
                        weapon: '',
                        health: bot.h ?? 100,
                        helmet: 0,
                        helmetDurability: 0,
                        armor: 0,
                        armorDurability: 0,
                        teamId: -1, // 人机使用-1作为队伍ID
                        position: {
                            x: bot.cx,
                            y: bot.cy,
                            z: 0,
                        },
                    };
                    rayFullState.bots.set(botKey, player);
                }
            });
        } else {
            // 增量数据：人机采用销毁重建策略，简单可靠
            rayFullState.bots.clear();
            
            // 处理更新的人机数据
            if (raw.a.u) {
                raw.a.u.forEach((bot, index) => {
                    if (bot.d !== 0) { // 只添加存活的人机
                        const botKey = `bot_${bot.cx}_${bot.cy}_${index}`;
                        const player: Player = {
                            name: `AI人机_${index}`,
                            isBot: true,
                            isBoss: bot.b === 1,
                            isCheater: false,
                            role: 0,
                            roleName: 'AI',
                            roleAlias: '人机',
                            weapon: '',
                            health: bot.h ?? 100,
                            helmet: 0,
                            helmetDurability: 0,
                            armor: 0,
                            armorDurability: 0,
                            teamId: -1,
                            position: {
                                x: bot.cx,
                                y: bot.cy,
                                z: 0,
                            },
                        };
                        rayFullState.bots.set(botKey, player);
                    }
                });
            }
            
            // 注意：删除操作(raw.a.d)不需要单独处理，因为我们已经清空重建了
        }
    }

    // ====================== 处理盒子 (b) ======================
    if (raw.b) {
        if (Array.isArray(raw.b)) {
            // 全量数据：清空后重新添加
            rayFullState.boxes.clear();
            raw.b.forEach((box) => {
                const boxKey = `${box.cx},${box.cy}`;
                const boxData: Box = {
                    isBot: box.i === 0,
                    position: {
                        x: box.cx,
                        y: box.cy,
                        z: box.z ?? 0,
                    },
                };
                rayFullState.boxes.set(boxKey, boxData);
            });
        } else {
            // 增量数据：处理删除和更新
            if (raw.b.d) {
                raw.b.d.forEach((box) => {
                    const boxKey = `${box.cx},${box.cy}`;
                    rayFullState!.boxes.delete(boxKey);
                });
            }
            if (raw.b.u) {
                raw.b.u.forEach((box) => {
                    const boxKey = `${box.cx},${box.cy}`;
                    const boxData: Box = {
                        isBot: box.i === 0,
                        position: {
                            x: box.cx,
                            y: box.cy,
                            z: box.z ?? 0,
                        },
                    };
                    rayFullState!.boxes.set(boxKey, boxData);
                });
            }
        }
    }

    // ====================== 处理物资 (i) ======================
    if (raw.i) {
        if (Array.isArray(raw.i)) {
            // 全量数据：清空后重新添加
            rayFullState.items.clear();
            raw.i.forEach((item) => {
                const info = itemsInfo.find(x => x.objectName === item.n);
                const finalItem: Item = {
                    id: info?.objectID?.toString() ?? item.n,
                    name: info?.objectName ?? item.n,
                    price: info?.avgPrice ?? item.p ?? 0,
                    grade: info?.grade ?? item.v ?? 0,
                    position: {
                        x: item.cx,
                        y: item.cy,
                    },
                };
                const itemKey = `${finalItem.name}|${finalItem.position.x},${finalItem.position.y}|${finalItem.grade}|${finalItem.price}`;
                rayFullState.items.set(itemKey, finalItem);
            });
        } else {
            // 增量数据：处理删除和更新
            if (raw.i.d) {
                raw.i.d.forEach((item) => {
                    const info = itemsInfo.find(x => x.objectName === item.n);
                    const name = info?.objectName ?? item.n;
                    const grade = info?.grade ?? item.v ?? 0;
                    const price = info?.avgPrice ?? item.p ?? 0;
                    const itemKey = `${name}|${item.cx},${item.cy}|${grade}|${price}`;
                    rayFullState!.items.delete(itemKey);
                });
            }
            if (raw.i.u) {
                raw.i.u.forEach((item) => {
                    const info = itemsInfo.find(x => x.objectName === item.n);
                    const finalItem: Item = {
                        id: info?.objectID?.toString() ?? item.n,
                        name: info?.objectName ?? item.n,
                        price: info?.avgPrice ?? item.p ?? 0,
                        grade: info?.grade ?? item.v ?? 0,
                        position: {
                            x: item.cx,
                            y: item.cy,
                        },
                    };
                    const itemKey = `${finalItem.name}|${finalItem.position.x},${finalItem.position.y}|${finalItem.grade}|${finalItem.price}`;
                    rayFullState!.items.set(itemKey, finalItem);
                });
            }
        }
    }

    // ====================== 处理真实玩家 (p) ======================
    if (raw.p) {
        if (Array.isArray(raw.p)) {
            // 全量数据：清空后重新添加
            rayFullState.players.clear();
            raw.p.forEach((p) => {
                // 只添加存活的玩家 (d=0存活, d=1倒地, d=2死亡, f=0存活, f=1死亡)
                if (p.d !== 2 && p.f !== 1) {
                    const roleKey = ROLE_NAME_MAP_OFFICIAL[p.o] ?? 'default';
                    const player: Player = {
                        name: p.n || '未知玩家',
                        isBot: false,
                        isBoss: false,
                        isCheater: cheatTeamId === p.t,
                        role: p.o,
                        roleName: roleKey,
                        roleAlias: ROLE_ALIAS_MAP[roleKey] ?? '',
                        weapon: p.w || '未知武器',
                        health: p.h ?? 100,
                        helmet: p.hl ?? 0,
                        helmetDurability: p.hh ?? 0,
                        armor: p.bl ?? 0,
                        armorDurability: p.bh ?? 0,
                        teamId: p.t, // 全量数据中队伍ID是必需的，不使用默认值
                        position: {
                            x: p.cx,
                            y: p.cy,
                            z: p.z ?? 0,
                            angle: p.e,
                        },
                    };
                    // 使用队伍ID和玩家名称组合作为唯一标识
                    const playerKey = `${p.t}_${p.n}`;
                    rayFullState.players.set(playerKey, player);
                }
            });
        } else {
            // 增量数据：处理删除和更新
            if (raw.p.d) {
                raw.p.d.forEach((p) => {
                    // 在所有队伍中查找并删除该玩家
                    for (const [key, existingPlayer] of rayFullState!.players.entries()) {
                        if (existingPlayer.name === p.n) {
                            rayFullState!.players.delete(key);
                            break;
                        }
                    }
                });
            }
            if (raw.p.u) {
                raw.p.u.forEach((p) => {
                    // 检查玩家是否死亡，如果死亡则删除
                    if (p.d === 2 || p.f === 1) {
                        // 需要在所有可能的队伍中查找并删除该玩家
                        for (const [key, existingPlayer] of rayFullState!.players.entries()) {
                            if (existingPlayer.name === p.n) {
                                rayFullState!.players.delete(key);
                                break;
                            }
                        }
                        return; // 死亡玩家处理完毕，跳过后续更新逻辑
                    }

                    // 查找现有玩家进行增量更新
                    let existingPlayer: Player | null = null;
                    let oldPlayerKey: string | null = null;
                    
                    // 在所有队伍中查找该玩家
                    for (const [key, player] of rayFullState!.players.entries()) {
                        if (player.name === p.n) {
                            existingPlayer = player;
                            oldPlayerKey = key;
                            break;
                        }
                    }
                    
                    if (existingPlayer && oldPlayerKey) {
                        // 增量更新现有玩家，只更新增量数据中提供的属性
                        const updatedPlayer: Player = {
                            ...existingPlayer, // 保留原有属性
                            // 只更新增量数据中明确提供的属性（非undefined）
                            ...(p.bgl !== undefined && { /* 背包等级暂未在Player接口中定义 */ }),
                            ...(p.bh !== undefined && { armorDurability: p.bh }),
                            ...(p.bl !== undefined && { armor: p.bl }),
                            ...(p.bmh !== undefined && { /* 护甲耐久上限暂未在Player接口中定义 */ }),
                            ...(p.chl !== undefined && { /* 弹挂等级暂未在Player接口中定义 */ }),
                            ...(p.h !== undefined && { health: p.h }),
                            ...(p.hh !== undefined && { helmetDurability: p.hh }),
                            ...(p.hl !== undefined && { helmet: p.hl }),
                            ...(p.hmh !== undefined && { /* 头盔耐久上限暂未在Player接口中定义 */ }),
                            ...(p.k !== undefined && { /* 杀人数暂未在Player接口中定义 */ }),
                            ...(p.w !== undefined && { weapon: p.w }),
                            // 角色信息更新
                            ...(p.o !== undefined && { 
                                role: p.o,
                                roleName: ROLE_NAME_MAP_OFFICIAL[p.o] ?? existingPlayer.roleName,
                                roleAlias: ROLE_ALIAS_MAP[ROLE_NAME_MAP_OFFICIAL[p.o] ?? 'default'] ?? existingPlayer.roleAlias
                            }),
                            // 位置信息更新（只更新提供的坐标）
                            position: {
                                ...existingPlayer.position,
                                ...(p.cx !== undefined && { x: p.cx }),
                                ...(p.cy !== undefined && { y: p.cy }),
                                ...(p.x !== undefined && { /* 游戏内坐标X，如需要可添加到Position接口 */ }),
                                ...(p.y !== undefined && { /* 游戏内坐标Y，如需要可添加到Position接口 */ }),
                                ...(p.z !== undefined && { z: p.z }),
                                ...(p.e !== undefined && { angle: p.e }),
                            }
                        };
                        
                        // 保持原有的playerKey，因为队伍ID和玩家名称不会在增量数据中改变
                        rayFullState!.players.set(oldPlayerKey, updatedPlayer);
                    } else {
                        // 增量数据中不应该出现新玩家
                        // 这种情况说明数据可能有问题，记录警告但不处理
                        console.warn(`增量更新中发现未知玩家: ${p.n}，增量数据不应包含新玩家，跳过处理`);
                    }
                });
            }
        }
    }

    // 合并所有玩家（真实玩家 + 人机）
    const allPlayers: Player[] = [
        ...Array.from(rayFullState!.players.values()),
        ...Array.from(rayFullState!.bots.values())
    ];

    // 返回当前全量状态
    return {
        boxes: Array.from(rayFullState!.boxes.values()),
        items: Array.from(rayFullState!.items.values()),
        map,
        players: allPlayers,
    };
};

export const convert_other = (raw: RawData_other, itemsInfo: any[]): {
    boxes: Box[];
    items: Item[];
    map: GameMap;
    players: Player[];
} => {
    const mapConfig = getMapConfig(raw?.map.replace('map_', '')) ?? DEFAULT_MAP_CONFIG;
    const { name: mapName, offset } = mapConfig;

    let boxes: Box[] = [];
    let items: Item[] = [];
    let players: Player[] = [];
    // ========== Box ==========
    if(raw?.DeadBox) {
        boxes = raw.DeadBox.map(box => ({
            isBot: box.IsAi,
            position: {
                x: box.LocationX + offset.x,
                y: box.LocationY + offset.y,
            },
        }));
    }
    // ========== Item ==========
    if(raw?.Item) {
        items = raw.Item.map(item => {
            let itemInfo = itemsInfo.find((i: any) => String(i.objectID) === item.IdName);
            if (!itemInfo) {
                return {
                    id: item.IdName,
                    price: item.price,
                    name: item.ItemName,
                    grade: item.Quality,
                    position: applyOffset({ x: item.LocationX, y: item.LocationY }, offset),
                };
            } else {
                return {
                    id: item.IdName,
                    price: itemInfo.avgPrice,
                    name: itemInfo.objectName,
                    grade: itemInfo.grade,
                    position: applyOffset({ x: item.LocationX, y: item.LocationY }, offset),
                };
            }
        });
    }
    // ========== Map ==========
    const map: GameMap = { name: mapName };
    // ========== Player ==========
    if(raw?.Player) {
        players = raw.Player.map(player => {
            const roleId = ROLE_NAME_MAP_CHINESE[player.HeroName];
            const roleKey = ROLE_NAME_MAP_CHINESE[player.HeroName] ?? `unknown_${roleId}`;
            if (roleKey === 'unknown_' + roleId) {
                console.log(player.HeroName)
            }

            let roleName = roleKey;
            let roleAlias = ROLE_ALIAS_MAP[roleKey] ?? '';
            if (player.IsAi) {
                if (player.IsBoss) {
                    roleName = 'Boss';
                    roleAlias = player.Name;
                } else {
                    roleName = 'AI';
                    roleAlias = ROLE_ALIAS_MAP[roleKey] ?? '';
                }
            }
            return {
                name: player.Name,
                isBot: player.IsAi,
                isBoss: player.IsBoss,
                isCheater: player.IsTeam,
                roleName: roleName,
                roleAlias: roleAlias,
                weapon: player.WeaponName,
                health: player.Health,
                helmet: player.HeadLevel,
                helmetDurability: player.ArmorHealth,
                armor: player.ArmorLevel,
                armorDurability: player.HeadHealth,
                teamId: player.TeamId,
                position: {
                    ...applyOffset({ x: player.LocationX, y: player.LocationY}, offset),
                    angle: player.AngleX
                } as Position,
            };
        });
    }

    return { boxes, items, map, players };
};