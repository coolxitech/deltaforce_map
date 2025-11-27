// src/types/leaflet.zoomslider.d.ts
import 'leaflet';
import { Control, Map } from 'leaflet';

// 方式1：扩展 Leaflet 核心，让 L.control.zoomslider() 有类型提示（推荐）
declare module 'leaflet' {
    namespace control {
        /** 老插件原始写法就是小写的 zoomslider */
        function zoomslider(options?: any): Control;
    }

    namespace Control {
        /** 给大写别名，也有人这样写 */
        const Zoomslider: {
            new (options?: any): Control;
        };
    }

    interface MapOptions {
        zoomsliderControl?: boolean; // 老插件支持这种自动添加方式（其实没啥用）
    }
}

// 方式2：让 import 'leaflet.zoomslider' 这行代码不报错
// （因为老插件是通过 script 标签引入并全局污染 L 的，没有导出任何内容）
declare module 'leaflet.zoomslider' {
    const Zoomslider: any;
    export default Zoomslider;
}

// 如果你还想用 import Zoomslider from 'leaflet.zoomslider' 的写法，也可以加这一行
declare module 'leaflet.zoomslider' {
    export function zoomslider(options?: any): Control;
}