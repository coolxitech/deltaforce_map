import { useVisitorData } from '@fingerprintjs/fingerprintjs-pro-vue-v3';
import { computed } from 'vue';

// 1. 定义一个完整的接口，包含所有你需要用到的字段
interface FingerprintData {
    visitorId: string;
    requestId: string;
    // Smart Signals 字段
    androidWebView?: {
        result: boolean;
    };
    appleWebView?: {
        result: boolean;
    };
    // 如果需要其他字段，可以继续添加
    browserName?: string;
    confidence?: { score: number };
}

export interface WebViewCheckResult {
    isWebView: boolean;
    type: 'Android' | 'iOS' | 'None';
    visitorId: string;
}

export function useWebViewDetector() {
    const { data, isLoading, error, getData } = useVisitorData({
        extendedResult: true,
    });

    const checkResult = computed((): WebViewCheckResult => {
        const result = data.value as unknown as FingerprintData;

        if (!result || !result.visitorId) {
            return { isWebView: false, type: 'None', visitorId: '' };
        }

        const isAndroid = !!result.androidWebView?.result;
        const isIOS = !!result.appleWebView?.result;

        return {
            isWebView: isAndroid || isIOS,
            type: isAndroid ? 'Android' : (isIOS ? 'iOS' : 'None'),
            visitorId: result.visitorId,
        };
    });

    return {
        checkResult,
        isLoading,
        error,
        data,
        refresh: (options?: { ignoreCache?: boolean }) => getData(options),
    };
}