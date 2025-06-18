<template>
  <div class="image-search-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>图片搜索</span>
        </div>
      </template>
      
      <el-upload
        class="upload-demo"
        :auto-upload="false"
        :show-file-list="false"
        accept=".png,.jpg,.jpeg,.bmp,.gif"
        :on-change="handleFileChange"
      >
        <template #trigger>
          <el-button type="primary">选择图片</el-button>
        </template>
        <div class="upload-hint">
          支持 png、jpg、jpeg、bmp、gif 格式，最大 4MB
        </div>
      </el-upload>

      <!-- 预览图片 -->
      <div v-if="imageUrl" class="preview-image">
        <img :src="imageUrl" alt="预览图片" />
      </div>
    </el-card>

    <!-- 搜索结果抽屉 -->
    <SearchResultDrawer
      v-model="drawerVisible"
      :search-results="searchResults"
      @view-shipping="handleViewShipping"
    />

    <!-- 物流详情抽屉 -->
    <ShippingDetailsDrawer
      v-model="shippingDrawerVisible"
      :shipping-data="shippingData"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { UploadFile, UploadRawFile } from 'element-plus'
import { searchByImage } from '@/api/temu/image-search'
import SearchResultDrawer from './components/SearchResultDrawer.vue'
import ShippingDetailsDrawer from './components/ShippingDetailsDrawer.vue'
import { OrderApi } from '@/api/temu/order'
import type { OrderResult, ShippingOrder } from '@/api/temu/order/types'

const imageUrl = ref<string>('')
const searchResults = ref<OrderResult[]>([])
const drawerVisible = ref(false)
const shippingDrawerVisible = ref(false)
const shippingData = ref<ShippingOrder | null>(null)

const handleFileChange = async (uploadFile: UploadFile) => {
  if (!uploadFile.raw) {
    return false
  }

  // 验证文件类型
  const isValidType = ['image/png', 'image/jpeg', 'image/bmp', 'image/gif'].includes(uploadFile.raw.type)
  if (!isValidType) {
    ElMessage.error('只支持 PNG、JPG、JPEG、BMP、GIF 格式的图片！')
    return false
  }

  try {
    let file = uploadFile.raw
    // 如果文件大于200KB，进行压缩
    if (file.size / 1024 / 1024 > 0.2) {
      const originalSize = (file.size / 1024 / 1024).toFixed(2)
      console.log(`原始文件大小: ${originalSize}MB`)
      ElMessage.info('图片较大，正在压缩...')
      const compressedFile = await compressImage(file)
      const compressedSize = (compressedFile.size / 1024 / 1024).toFixed(2)
      console.log(`压缩后文件大小: ${compressedSize}MB`)
      ElMessage.success(`压缩完成：${originalSize}MB -> ${compressedSize}MB`)
      // 创建新的UploadFile对象
      file = Object.assign(compressedFile, { uid: uploadFile.uid })
    }

    // 显示预览图
    imageUrl.value = URL.createObjectURL(file)
    
    // 调用搜索接口
    const response = await searchByImage(file)
    searchResults.value = response
    
    if (searchResults.value.length === 0) {
      ElMessage.warning('未找到相似商品')
    } else {
      drawerVisible.value = true
    }
  } catch (error) {
    ElMessage.error('搜索失败，请重试')
    console.error('Image search error:', error)
  }
}

// 图片压缩函数
async function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new window.Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      
      // 计算压缩后的尺寸，保持宽高比
      let { width, height } = img
      // 降低最大尺寸限制
      const maxWidth = 1280
      const maxHeight = 1280
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width = width * ratio
        height = height * ratio
        console.log(`图片尺寸调整: ${img.width}x${img.height} -> ${width}x${height}`)
      }
      
      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)
      
      // 根据原始文件大小动态设置初始压缩质量
      const originalSizeMB = file.size / 1024 / 1024
      let quality = originalSizeMB > 5 ? 0.5 : 0.6
      
      const compress = (currentQuality: number) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) return
            const currentSizeMB = blob.size / 1024 / 1024
            console.log(`当前压缩质量: ${currentQuality}, 大小: ${currentSizeMB.toFixed(2)}MB`)
            
            // 如果文件仍然大于200KB且质量还可以继续降低，则继续压缩
            if (currentSizeMB > 0.2 && currentQuality > 0.1) {
              console.log(`文件仍然过大，继续压缩，质量降低至: ${(currentQuality - 0.1).toFixed(1)}`)
              compress(currentQuality - 0.1)
            } else {
              console.log(`压缩完成，最终大小: ${currentSizeMB.toFixed(2)}MB，质量: ${currentQuality.toFixed(1)}`)
              resolve(new File([blob], file.name, { type: 'image/jpeg' }))
              URL.revokeObjectURL(url)
            }
          },
          'image/jpeg',
          currentQuality
        )
      }
      
      // 开始压缩
      compress(quality)
    }
    img.src = url
  })
}

const handleViewShipping = async (row: any) => {
  try {
    // 调用接口获取物流详情
    const response = await OrderApi.getShippingOrderPage({
      trackingNumber: row.trackingNumber,
      pageNo: 1,
      pageSize: 10
    })
    
    if (response.list && response.list.length > 0) {
      // 直接使用完整的物流订单数据
      shippingData.value = response.list[0]
      shippingDrawerVisible.value = true
    }
  } catch (error) {
    console.error('获取物流详情失败:', error)
    ElMessage.error('获取物流详情失败')
  }
}
</script>

<style lang="scss" scoped>
.image-search-container {
  padding: 24px;

  .box-card {
    margin-bottom: 24px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .upload-hint {
    color: #909399;
    margin-top: 8px;
    font-size: 14px;
  }

  .preview-image {
    margin-top: 16px;
    
    img {
      max-width: 200px;
      max-height: 200px;
      object-fit: contain;
    }
  }
}
</style>
