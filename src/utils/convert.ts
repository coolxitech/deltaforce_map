import type { RawData } from "@/interface/RawData";
import type { Position, Item, Player, Map, Box } from "@/interface/GameData";
/**
 * 角色映射表
 */
const ROLE_NAME_MAP: Record<number, string> = {
    13: 'bt',12: 'zj', 11: 'yy', 10: 'wm', 5: 'mxw', 4: 'ln',
    3: 'myr', 2: 'sl', 9: 'wll', 1: 'g', 6: 'fy',
    8: 'wl', 7: 'hl',0: 'default'
} as const;

const ROLE_ALIAS_MAP: Record<string, string> = {
    'bt': '四眼仔','zj': '张姐', 'yy': '老登', 'wm': '神秘静步男', 'mxw': '麦晓鼠',
    'ln': '红温娜', 'myr': '牢大', 'sl': '教官', 'wll': '神秘堵桥男',
    'g': '女医', 'fy': '疯医', 'wl': '威风的龙', 'hl': '花来!', 'default': 'Boss', 'a': '机哥'
} as const;

/**
 * 统一地图配置：名称 + 偏移量
 */
interface MapConfig {
    name: string;
    offset: { x: number; y: number };
}

const MAP_CONFIG_TABLE: Record<number, MapConfig> = {
    0: { name: '', offset: { x: 0, y: 0 } },
    1: { name: 'daba', offset: { x: 357385, y: -769888 } },   // 零号大坝
    2: { name: 'cgxg', offset: { x: 0, y: 0 } },             // 长弓溪谷（暂无偏移）
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
export function convert(raw: RawData, itemsInfo: any[]): {
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