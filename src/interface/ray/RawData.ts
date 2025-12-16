/**
 * 原始数据结构
 */
export interface RawData {
    a: Array<{ // 人机列表
        b: number; // 是否Boss
        cx: number; // 地图坐标X
        cy: number; // 地图坐标Y
        d: number; // 是否已死亡
        h: number; // 血量
        mh: number; // 血量上限
    }> | {
        d: Array<RawData['a']>; // 增量更新删除对象数组
        u: Array<RawData['a']>; // 增量更新对象数组
    }
    b: Array<{ // 盒子列表
        cx: number; // 地图坐标X
        cy: number; // 地图坐标Y
        i: number; // 玩家盒子
        o: number; // 是否已打开
        x: number; // 游戏内坐标X
        y: number; // 游戏内坐标Y
        z: number; // 游戏内坐标Z
    }> | {
        d?: Array<RawData['b']>; // 增量更新删除对象数组
        u?: Array<RawData['b']>; // 增量更新对象数组
    }
    i: Array<{ // 物资列表
        cx: number; // 地图坐标X
        cy: number; // 地图坐标Y
        n: string; // 物品名称
        p: number; // 价值
        v: number; // 等级
        x: number; // 游戏内坐标X
        y: number; // 游戏内坐标Y
        z: number; // 游戏内坐标Z
    }> | {
        d?: Array<RawData['i']>; // 增量更新删除对象数组
        u?: Array<RawData['i']>; // 增量更新对象数组
    };
    m: number; // 地图ID
    p: Array<{  // 玩家列表
        bgl?: number; // 背包等级
        bh?: number; // 护甲耐久
        bl?: number; // 护甲等级
        bmh: number; // 护甲耐久上限
        chl?: number; // 弹挂等级
        cx: number; // 地图坐标X
        cy: number; // 地图坐标Y
        d: number; //存活/倒地/死亡=2 人物状态
        e: number; // 视角角度
        f: number; // 是否死亡
        h: number; // 血量
        hh?: number; // 头盔耐久
        hl?: number; // 头盔等级
        hmh?: number; // 头盔耐久上限
        k: number; // 杀人数
        mh: number; // 血量上限
        n: string; // 玩家名称
        o: number; // 角色ID
        t: number; // 队伍ID
        w: string; // 武器名称
        x: number; // 游戏内坐标X
        y: number; // 游戏内坐标Y
        z: number; // 游戏内坐标Z
    }> | {
        d?: Array<RawData['p']>; // 增量更新删除对象数组
        u?: Array<RawData['p']>; // 增量更新对象数组
    };
    t?: number; // 挂狗队伍ID,只在第一次全量数据返回
    seq: number; // 消息序号,可以做回放
    type?: string; // 是否增量数据，type="delta"
}