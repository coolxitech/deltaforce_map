<template>
  <div class="denied-container">
    <div class="denied-card">
      <h1 class="title">访问被拒绝</h1>
      <p class="message">
        抱歉，本页面不允许在 App 内嵌浏览器（WebView）中访问。
      </p>
      <p class="tip">
        请使用标准浏览器（如 Chrome、Safari、Edge 等）打开本页面。
        此措施是为了防止网页内容被恶意利用换取利益。
      </p>
      <div class="icon">🚫</div>
    </div>
  </div>
</template>

<script setup lang="ts">

</script>

<style scoped>
.denied-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20px;
  box-sizing: border-box;
}

.denied-card {
  max-width: 500px;
  width: 100%;
  background: #ffffff;
  border-radius: 12px;
  padding: 40px 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.title {
  font-size: 28px;
  color: #d9534f;
  margin-bottom: 20px;
  font-weight: 600;
}

.message {
  font-size: 18px;
  color: #333;
  margin: 15px 0;
  line-height: 1.6;
}

.tip {
  font-size: 16px;
  color: #666;
  margin: 20px 0 30px;
  line-height: 1.6;
}

.icon {
  font-size: 80px;
  margin-top: 20px;
}
</style>