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
import type { UploadFile } from 'element-plus'
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

  // 验证文件大小（4MB = 4 * 1024 * 1024 bytes）
  const isLessThan4M = uploadFile.raw.size / 1024 / 1024 < 4
  if (!isLessThan4M) {
    ElMessage.error('图片必须小于 4MB！')
    return false
  }

  try {
    // 显示预览图
    imageUrl.value = URL.createObjectURL(uploadFile.raw)
    
    // 调用搜索接口
    const response = await searchByImage(uploadFile.raw)
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
