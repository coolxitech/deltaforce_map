import { onMounted, onUnmounted } from 'vue';
export function useRem(): void {
    const setRem = () => {
        const docEl = document.documentElement
        const width = docEl.clientWidth
        if (!width) return

        // 1720 < width ? 100 * width / 1920 : 172000 / 1920
        const fontSize = width > 1720 ? (100 * width) / 1920 : 172000 / 1920
        docEl.style.fontSize = `${fontSize}px`
    }

    // 初始执行
    setRem()

    // 防抖延迟执行
    const timer = setTimeout(setRem, 300)

    const handleResize = () => setRem()

    // 监听事件
    onMounted(() => {
        window.addEventListener('load', setRem)
        window.addEventListener('orientationchange' in window ? 'orientationchange' : 'resize', handleResize)
        document.addEventListener('DOMContentLoaded', setRem)
    })

    onUnmounted(() => {
        clearTimeout(timer)
        window.removeEventListener('load', setRem)
        window.removeEventListener('orientationchange' in window ? 'orientationchange' : 'resize', handleResize)
        document.removeEventListener('DOMContentLoaded', setRem)
    })
}