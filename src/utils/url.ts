export const getUrlParam = (name) => {
    const reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)"); //构造一个含有目标参数的正则表达式对象
    const r = window.location.search.substring(1).match(reg);  //匹配目标参数
    if (r != null) return decodeURI(r[2]); return null; //返回参数值
}