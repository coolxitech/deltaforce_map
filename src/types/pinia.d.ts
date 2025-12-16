import 'pinia'
import type { Persistence } from 'pinia-plugin-persistedstate'
declare module "pinia" {
    export interface DefineStoreOptionsBase {
        persist?: boolean | Persistence;
    }
}
