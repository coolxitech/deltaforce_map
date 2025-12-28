/**
 * 原始数据结构
 */
export interface RawData {
    // 死亡箱子
    D2: Array<{
        // 是否人机盒子
        a: boolean;
        // 坐标X
        b: number;
        // 坐标Y
        c: number;
    }>;
    // 物资列表
    I2: Array<{
        // 物品ID
        b: string;
        // 物品名称
        c: string;
        // 物品等级
        d: number;
        // 物品价格
        e: number;
        // 坐标X
        f: number;
        // 坐标Y
        g: number;
    }>;
    // 地图ID
    M2: number;
    // 玩家列表
    P2: Array<{
        a: number;
        // 是否挂狗队
        b: number;
        // 是否AI
        c: number;
        // 是否Boss
        d: number;
        e: number;
        // 队伍ID
        f: number;
        // 角色ID
        g: number;
        // 玩家名称
        h: string;
        // 武器名称
        i: string;
        // 头盔等级
        j: number;
        // 头盔耐久
        k: number;
        // 护甲等级
        l: number;
        // 护甲耐久
        m: number;
        // 血量
        n: number;
        o: number;
        // 坐标X
        p: number;
        // 坐标Y
        q: number;
        // 角度
        r: number;
        // Z轴高度
        s: number;
    }>;
}
