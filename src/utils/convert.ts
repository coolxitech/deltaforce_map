import type { RawData as RawData_un } from "@/interface/un/RawData.ts";
import type { RawData as RawData_ray } from "@/interface/ray/RawData.ts";
import type { Position, Item, Player, Map, Box } from "@/interface/GameData.ts";
/**
 * 角色映射表
 */
const ROLE_NAME_MAP: Record<number, string> = {
    13: 'bt',12: 'zj', 11: 'yy', 10: 'wm', 5: 'mxw', 4: 'ln',
    3: 'myr', 2: 'sl', 9: 'wll', 1: 'g', 6: 'fy',
    8: 'wl', 7: 'hl',0: 'default'
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

let prevState: {
    boxes: Box[];
    items: Item[];
    players: Player[];
} | null = null;

/**
 * 统一地图配置：名称 + 偏移量
 */
interface MapConfig {
    name: string;
    offset?: { x: number; y: number };
}

const MAP_CONFIG_TABLE: Record<number, MapConfig> = {
    0: { name: '', offset: { x: 0, y: 0 } },
    1: { name: 'daba', offset: { x: 357385, y: -769888 } },   // 零号大坝
    2: { name: 'cgxg', offset: { x: 400062, y: -641652 } },             // 长弓溪谷（暂无偏移）
    3: { name: 'bks',  offset: { x: 378673, y: -448841 } },  // 巴克什
    4: { name: 'htjd', offset: { x: 668720, y: -452754 } },  // 航天基地
    5: { name: 'cxjy', offset: { x: 53272,  y: -51971 } },    // 潮汐监狱
} as const;

// 默认配置（防止崩溃）
const DEFAULT_MAP_CONFIG: MapConfig = { name: '未知地图', offset: { x: 0, y: 0 } };

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
    map: Map;
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
    const map: Map = { name: mapName };

    // ========== Player ==========
    if (raw?.P2) {
        players = raw.P2.map(player => {
            const roleId = player.g ?? 0;
            const roleKey = ROLE_NAME_MAP[roleId] ?? `unknown_${roleId}`;
            const roleName = roleKey;
            const roleAlias = ROLE_ALIAS_MAP[roleKey] ?? '';

            return {
                name: player.h || '未知玩家',
                isBot: player.c === 1,
                isBoss: player.d === 1,
                isCheater: player.b === 1,
                role: roleId,
                roleName: player.c === 1 ? 'AI' : roleName,
                roleAlias: roleAlias,
                weapon: player.i || '未知武器',
                health: player.n ?? 100,
                helmet: player.j,
                armor: player.l,
                teamId: player.f,
                position: {
                    ...applyOffset({ x: player.p, y: player.q }, offset),
                    z: player.s,
                    angle: player.r,
                } as Position,
            };
        });
    }

    return { boxes, items, map, players };
}

export const convert_ray = async (
    raw: RawData_ray,
    itemsInfo: any[],
    cheatTeamId: number,
    // 可选：外部传入上一帧状态（推荐），不传则内部维护
    previous?: { boxes: Box[]; items: Item[]; players: Player[] } | null
): Promise<{
    boxes: Box[];
    items: Item[];
    map: Map;
    players: Player[];
}> => {
    const isDelta = raw.type === 'delta';

    // 地图配置（保持你原来的顺序）
    const MAP_NAME: Record<number, string> = {
        0: '',
        1: 'bks',
        2: 'cgxg',
        3: 'htjd',
        4: 'daba',
        5: 'cxjy',
    };
    const map: Map = { name: MAP_NAME[raw.m ?? 0] ?? '未知地图' };

    // 使用上一帧状态（优先外部传入）
    const prev = previous ?? prevState;

    // 初始化最新状态容器（用 Map 方便增删）
    const boxesMap = new Map<string, Box>();      // key: `${cx},${cy}`
    const itemsMap = new Map<string, Item>();     // key: `${name}|${cx},${cy}|${grade}|${price}`
    const playersMap = new Map<string, Player>(); // key: name（真实玩家）或 `bot_${cx}_${cy}`

    // 第一帧或全量时：清空旧数据
    if (!isDelta || !prev) {
        // 全量或首次 → 从零开始
    } else {
        // 增量 → 先继承上一帧所有数据
        prev.boxes.forEach(b => boxesMap.set(`${b.position.x},${b.position.y}`, { ...b }));
        prev.items.forEach(i => itemsMap.set(`${i.name}|${i.position.x},${i.position.y}|${i.grade}|${i.price}`, { ...i }));
        prev.players.forEach(p => playersMap.set(p.isBot ? `bot_${p.position.x}_${p.position.y}` : p.name, { ...p }));
    }

    // ====================== 人机 (a) ======================
    if (raw.a) {
        // 增量更新时先清除所有旧人机（因为服务端不会发全量人机列表）
        if (isDelta && prev) {
            for (const [key, p] of playersMap.entries()) {
                if (p.isBot) playersMap.delete(key);
            }
        }

        const bots = Array.isArray(raw.a) ? raw.a : raw.a.u ?? [];
        const deletedBotKeys = Array.isArray(raw.a) ? [] : (raw.a.d ?? []).map((b: any) => `bot_${b.cx}_${b.cy}`);

        // 删除标记的
        deletedBotKeys.forEach(key => playersMap.delete(key));

        // 添加/更新
        bots.forEach((bot: any) => {
            if (bot.d === 0) return; // 已死亡或无效
            const player: Player = {
                name: 'AI人机',
                isBot: true,
                isBoss: bot.b,
                isCheater: false,
                role: 0,
                roleName: 'AI',
                roleAlias: '人机',
                weapon: '',
                health: bot.h ?? 100,
                helmet: 0,
                armor: 0,
                teamId: 0,
                position: {
                    x: bot.cx,
                    y: bot.cy,
                    z: bot.z ?? 0,
                },
            };
            playersMap.set(`bot_${bot.cx}_${bot.cy}`, player);
        });
    }

    // ====================== 盒子 (b) ======================
    if (raw.b) {
        const boxList = Array.isArray(raw.b) ? raw.b : raw.b.u ?? [];
        const deletedBoxKeys = Array.isArray(raw.b) ? [] : (raw.b.d ?? []).map((b: any) => `${b.cx ?? b.x},${b.cy ?? b.y}`);

        deletedBoxKeys.forEach(key => boxesMap.delete(key));

        boxList.forEach((box: any) => {
            const key = `${box.cx},${box.cy}`;
            boxesMap.set(key, {
                isBot: box.i === 0, // 根据实际协议，i=0 通常是人机盒子
                position: {
                    x: box.cx,
                    y: box.cy,
                    z: box.z ?? 0,
                },
            });
        });
    }

    // ====================== 物资 (i) ======================
    if (raw.i) {
        const itemList = Array.isArray(raw.i) ? raw.i : raw.i.u ?? [];
        const deletedItemKeys = Array.isArray(raw.i) ? [] : (raw.i.d ?? []).map((i: any) => `${i.n}|${i.cx},${i.cy}|${i.v}|${i.p}`);

        deletedItemKeys.forEach(key => itemsMap.delete(key));

        itemList.forEach((item: any) => {
            const info = itemsInfo.find(x => x.objectName === item.n);
            const finalItem: Item = {
                id: info?.objectID?.toString(),
                name: info?.objectName ?? item.n,
                price: info?.avgPrice ?? item.p ?? 0,
                grade: info?.grade ?? item.v ?? 0,
                position: {
                    x: item.cx,
                    y: item.cy,
                },
            };
            const key = `${finalItem.name}|${finalItem.position.x},${finalItem.position.y}|${finalItem.grade}|${finalItem.price}`;
            itemsMap.set(key, finalItem);
        });
    }

    // ====================== 真实玩家 (p) ======================
    if (raw.p) {
        const playerList = Array.isArray(raw.p) ? raw.p : raw.p.u ?? [];
        const deletedNames = Array.isArray(raw.p) ? [] : (raw.p.d ?? []).map((p: any) => p.n);

        deletedNames.forEach(name => playersMap.delete(name));

        playerList.filter((p: any) => p && p.n); // 防止空对象

        playerList.forEach((p: any) => {
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
                helmetDurability: p.hh,
                armor: p.bl ?? 0,
                armorDurability: p.bh,
                teamId: p.t ?? 0,
                position: {
                    x: p.cx,
                    y: p.cy,
                    z: p.z ?? 0,
                    angle: p.e,
                },
            };
            playersMap.set(p.n, player);
        });
    }

    // 转为数组
    const result = {
        boxes: Array.from(boxesMap.values()),
        items: Array.from(itemsMap.values()),
        map,
        players: Array.from(playersMap.values()),
    };

    // 保存状态供下一帧使用
    if (!previous) {
        prevState = {
            boxes: result.boxes.map(b => ({ ...b, position: { ...b.position } })),
            items: result.items.map(i => ({ ...i, position: { ...i.position } })),
            players: result.players.map(p => ({ ...p, position: { ...p.position } })),
        };
    }

    return result;
};