/**
 * 原始数据结构
 */
export interface RawData {
    D2: Array<{ a: boolean; b: number; c: number }>; // 死亡箱子
    I2: Array<{ b: string; c: string; d: number; e: number; f: number; g: number }>; // 物品
    M2: number; // 地图ID
    P2: Array<{
        a: number;
        b: number; // 是否挂狗队
        c: number; // 是否AI
        d: number; // 是否Boss
        e: number;
        f: number; // 队伍ID
        g: number; // 角色ID
        h: string; // 玩家名称
        i: string; // 武器名称
        j: number; // 护甲等级
        k: number;
        l: number; // 护甲等级
        m: number; // 血量
        n: number;
        p: number; // 坐标X
        q: number; // 坐标Y
        r: number; // 角度
        s: number; // Z轴高度
    }>;
}
