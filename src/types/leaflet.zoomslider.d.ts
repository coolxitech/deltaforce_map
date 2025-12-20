import 'leaflet';
import { Control, Map } from 'leaflet';

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

declare module 'leaflet.zoomslider' {
    const Zoomslider: any;
    export default Zoomslider;
}


declare module 'leaflet.zoomslider' {
    export function zoomslider(options?: any): Control;
}