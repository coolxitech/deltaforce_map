// utils/antiWebView.ts
import { useVisitorData } from '@fingerprintjs/fingerprintjs-pro-vue-v3';
import { computed } from 'vue';

interface FingerprintData {
    visitorId: string;
    browserName?: string;
    os?: string;
}

export interface WebViewCheckResult {
    isWebView: boolean;
    visitorId: string;
}

export function useWebViewDetector() {
    const { data, isLoading, error, getData } = useVisitorData({
        extendedResult: true,
    });

    const checkResult = computed((): WebViewCheckResult => {
        const result = data.value as unknown as FingerprintData;

        if (!result) return { isWebView: false, visitorId: '' };

        // 精准匹配你提供的： "Chrome Mobile WebView"
        const bName = result.browserName || '';
        const isWebView = bName.toLocaleLowerCase().includes('webview');

        return {
            isWebView,
            visitorId: result.visitorId || '',
        };
    });

    return {
        checkResult,
        data,
        isLoading,
        error,
        refresh: (options?: any) => getData(options),
    };
}