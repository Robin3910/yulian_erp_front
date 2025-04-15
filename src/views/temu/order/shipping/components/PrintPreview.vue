<template>
  <el-dialog
    v-model="visible"
    title="打印预览"
    width="80%"
    :before-close="handleClose"
    append-to-body
  >
    <div class="print-content">
      <!-- PDF预览 -->
      <iframe
        v-if="isPDF"
        :src="previewUrl"
        width="100%"
        height="500px"
        frameborder="0"
      ></iframe>
      <!-- 图片预览 -->
      <img
        v-else
        :src="previewUrl"
        style="max-width: 100%; max-height: 500px; object-fit: contain;"
      />
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handlePrint">
          打印
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps({
  url: {
    type: String,
    required: true
  }
})

const visible = ref(false)
const previewUrl = computed(() => {
  // 处理 @ 开头的URL
  return props.url?.startsWith('@') ? props.url.substring(1) : props.url
})

const isPDF = computed(() => previewUrl.value?.toLowerCase().endsWith('.pdf'))

const handleClose = () => {
  visible.value = false
}

const handlePrint = () => {
  // 创建一个新窗口来加载和打印内容
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const content = isPDF.value
    ? `<embed src="${previewUrl.value}" width="100%" height="100%">`
    : `<img src="${previewUrl.value}" style="max-width: 100%; max-height: 100%; object-fit: contain;">`

  printWindow.document.write(`
    <html>
      <head>
        <title>打印预览</title>
      </head>
      <body style="margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh;">
        ${content}
      </body>
    </html>
  `)

  // 等待图片或PDF加载完成后打印
  if (isPDF.value) {
    printWindow.document.querySelector('embed')?.addEventListener('load', () => {
      printWindow.print()
      printWindow.close()
    })
  } else {
    printWindow.document.querySelector('img')?.addEventListener('load', () => {
      printWindow.print()
      printWindow.close()
    })
  }
}

const show = () => {
  visible.value = true
}

defineExpose({
  show
})
</script>

<style scoped>
.print-content {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  background-color: #f5f5f5;
  padding: 20px;
}
</style> 