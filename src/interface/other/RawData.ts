/**
 * 原始数据结构
 */
export interface RawData {
    DeadBox: Array<{
        // 是否人机
        IsAi: boolean;
        // 坐标X
        LocationX: number;
        // 坐标Y
        LocationY: number;
    }>
    Item: Array<{
        // 物资ID
        IdName: string;
        // 物资名称
        ItemName: string;
        // 坐标X
        LocationX: number;
        // 坐标Y
        LocationY: number;
        // 物资等级
        Quality: number;
        Type: number;
        // 物资价值
        price: number;
    }>
    Player: Array<{
        AngleX: number;
        AngleY: number;
        ArmorHealth: number;
        ArmorLevel: number;
        HeadHealth: number;
        HeadLevel: number;
        Health: number;
        HeroName: string;
        IsAi: boolean;
        IsBoss: boolean;
        IsDown: boolean;
        IsTeam: boolean;
        Local: boolean;
        LocationX: number;
        LocationY: number;
        Name: string;
        TeamId: number;
        Type: number;
        WeaponName: string;
    }>
    // 地图名称
    map: string;
}