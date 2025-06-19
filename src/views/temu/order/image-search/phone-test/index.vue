<template>
  <div class="mobile-image-search">
    <!-- 顶部导航栏 -->
    <div class="nav-header">
      <span class="title">图片搜索</span>
    </div>

    <!-- 上传区域 -->
    <div class="upload-section" v-if="!searchResults.length">
      <div class="preview-container" v-if="imageUrl">
        <img :src="imageUrl" alt="预览图片" class="preview-image" />
        <div class="preview-actions">
          <el-button type="danger" plain @click="resetImage">重新选择</el-button>
        </div>
      </div>
      
      <div v-else class="upload-buttons">
        <el-button type="primary" size="large" @click="handleStartCamera">
          <el-icon class="icon"><Camera /></el-icon>
          拍照搜索
        </el-button>
        <el-button type="info" size="large" @click="openGallery">
          <el-icon class="icon"><Picture /></el-icon>
          从相册选择
        </el-button>
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          style="display: none"
          @change="handleFileSelect"
        />
      </div>

      <div class="upload-hint">
        支持 png、jpg、jpeg、bmp、gif 格式，最大 4MB
      </div>
    </div>

    <!-- 搜索结果列表 -->
    <div v-else class="search-results">
      <!-- 顶部操作栏 -->
      <div class="action-bar">
        <el-button type="primary" plain @click="resetSearch">
          <el-icon><Back /></el-icon>
          重新搜索
        </el-button>
        <span class="result-count">找到 {{ searchResults.length }} 个结果</span>
      </div>

      <!-- 结果列表 -->
      <div class="result-list">
        <div v-for="(order, index) in sortedResults" :key="index" class="result-item">
          <!-- 订单基本信息 -->
          <div class="order-header">
            <div class="similarity-score">
              <el-tag type="success" size="large">相似度: {{ (order.score * 100).toFixed(2) }}%</el-tag>
            </div>
            <div class="shop-info">{{ order.shopName }} ({{ order.aliasName }})</div>
            <div class="order-no">订单号: {{ order.orderNo }}</div>
            <div class="order-status">
              <el-tag :type="getOrderStatusType(order.orderStatus)">
                {{ getOrderStatusText(order.orderStatus) }}
              </el-tag>
            </div>
            <div class="shipping-info" v-if="order.trackingNumber">
              <el-button type="primary" link @click="handleViewShipping(order)">
                查看物流详情
              </el-button>
            </div>
          </div>

          <!-- 图片展示 -->
          <div class="image-section">
            <el-scrollbar>
              <div class="image-list">
                <template v-if="order.customImageUrls">
                  <div
                    v-for="(item, imgIndex) in order.customImageUrls.split(',')"
                    :key="imgIndex"
                    class="image-item"
                  >
                    <el-image
                      :src="item"
                      :preview-src-list="[item]"
                      fit="cover"
                      loading="lazy"
                      :initial-index="0"
                    />
                  </div>
                </template>
                <div v-if="order.effectiveImgUrl" class="image-item">
                  <el-image
                    :src="order.effectiveImgUrl"
                    :preview-src-list="[order.effectiveImgUrl]"
                    fit="cover"
                    loading="lazy"
                    :initial-index="0"
                  />
                </div>
              </div>
            </el-scrollbar>
          </div>

          <!-- 订单详细信息 -->
          <div class="order-details">
            <div class="detail-section">
              <div class="section-title">重要信息</div>
              <div class="detail-item">
                <span class="label">图片ID：</span>
                <span class="value">{{ order.productId }}</span>
              </div>
              <div class="detail-item">
                <span class="label">SKU / SKC：</span>
                <span class="value">{{ order.sku }} / {{ order.skc }}</span>
              </div>
              <div class="detail-item highlight">
                <span class="label">定制SKU：</span>
                <span class="value">{{ order.customSku }}</span>
              </div>
              <div class="detail-item">
                <span class="label">数量信息：</span>
                <span class="value">
                  官网：{{ order.originalQuantity }} / 制作：{{ order.quantity }}
                </span>
              </div>
            </div>

            <div class="detail-section">
              <div class="section-title">商品信息</div>
              <div class="detail-item">
                <span class="label">标题：</span>
                <span class="value">{{ order.productTitle }}</span>
              </div>
              <div class="detail-item">
                <span class="label">属性：</span>
                <span class="value">{{ order.productProperties }}</span>
              </div>
            </div>

            <template v-if="order.customTextList">
              <div class="detail-section">
                <div class="section-title">定制信息</div>
                <div class="detail-item">
                  <span class="label">定制文字：</span>
                  <span class="value">{{ order.customTextList }}</span>
                </div>
              </div>
            </template>

            <!-- 打印按钮 -->
            <div class="print-action">
              <el-button 
                type="primary" 
                :disabled="!order.complianceGoodsMergedUrl"
                @click="handlePrint(order.complianceGoodsMergedUrl)"
              >
                <el-icon><Printer /></el-icon>
                打印条码+合规单
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 物流详情抽屉 -->
    <ShippingDetailsDrawer
      v-model="shippingDrawerVisible"
      :shipping-data="shippingData"
    />

    <!-- 相机组件 -->
    <CameraView
      v-if="showCamera"
      @capture="handleCameraCapture"
      @close="showCamera = false"
    />

    <!-- 加载中 -->
    <el-loading 
      v-model="loading" 
      text="搜索中..."
      background="rgba(255, 255, 255, 0.9)"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Camera, Picture, Back, Printer } from '@element-plus/icons-vue'
import { searchByImage } from '@/api/temu/image-search'
import printJS from 'print-js'
import ShippingDetailsDrawer from './components/ShippingDetailsDrawer.vue'
import CameraView from './components/CameraView.vue'
import { OrderApi } from '@/api/temu/order'
import type { OrderResult, ShippingOrder } from '@/api/temu/order/types'

interface OrderResult {
  orderNo: string
  productTitle: string
  orderStatus: number
  sku: string
  skc: string
  customSku: string
  quantity: number
  productProperties: string
  customImageUrls: string
  customTextList: string | null
  productImgUrl: string
  effectiveImgUrl: string
  originalQuantity: number
  productId: string
  score: number
  shopName: string
  aliasName: string
  complianceGoodsMergedUrl: string
  trackingNumber?: string
}

const fileInput = ref<HTMLInputElement | null>(null)
const imageUrl = ref<string>('')
const searchResults = ref<OrderResult[]>([])
const loading = ref(false)
const selectedFile = ref<File | null>(null)
const shippingDrawerVisible = ref(false)
const shippingData = ref<ShippingOrder | null>(null)
const showCamera = ref(false)

// 开始相机拍照
const handleStartCamera = () => {
  resetImage() // 重置之前的搜索结果
  showCamera.value = true
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

// 按相似度排序的结果
const sortedResults = computed(() => {
  return [...searchResults.value].sort((a, b) => b.score - a.score)
})

// 处理相机拍照结果
const handleCameraCapture = async (file: File) => {
  showCamera.value = false
  await processImageFile(file)
}

// 重置图片
const resetImage = () => {
  imageUrl.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  selectedFile.value = null
  searchResults.value = []
}

// 重置搜索
const resetSearch = () => {
  searchResults.value = []
  resetImage()
}

// 打开相册
const openGallery = () => {
  resetImage() // 重置之前的搜索结果
  if (fileInput.value) {
    fileInput.value.click()
  }
}

// 处理文件选择
const handleFileSelect = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return

  const file = input.files[0]
  await processImageFile(file)
}

// 处理图片文件
const processImageFile = async (file: File) => {
  // 验证文件类型
  const isValidType = ['image/png', 'image/jpeg', 'image/bmp', 'image/gif'].includes(file.type)
  if (!isValidType) {
    ElMessage.error('只支持 PNG、JPG、JPEG、BMP、GIF 格式的图片！')
    return
  }

  let processedFile = file
  // 如果文件大于200KB，进行压缩
  if (file.size / 1024 / 1024 > 0.2) {
    const originalSize = (file.size / 1024 / 1024).toFixed(2)
    console.log(`原始文件大小: ${originalSize}MB`)
    ElMessage.info('图片较大，正在压缩...')
    processedFile = await compressImage(file)
    const compressedSize = (processedFile.size / 1024 / 1024).toFixed(2)
    console.log(`压缩后文件大小: ${compressedSize}MB`)
    ElMessage.success(`压缩完成：${originalSize}MB -> ${compressedSize}MB`)
  }

  // 显示预览图
  imageUrl.value = URL.createObjectURL(processedFile)
  selectedFile.value = processedFile
  await handleSearch()
}

// 开始搜索
const handleSearch = async () => {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择图片')
    return
  }

  loading.value = true
  try {
    const response = await searchByImage(selectedFile.value)
    searchResults.value = response
    
    if (searchResults.value.length === 0) {
      ElMessage.warning('未找到相似商品')
    }
  } catch (error) {
    ElMessage.error('搜索失败，请重试')
    console.error('Image search error:', error)
  } finally {
    loading.value = false
  }
}

// 获取订单状态类型
const getOrderStatusType = (status: number): 'success' | 'warning' | 'info' | 'primary' | 'danger' => {
  switch (status) {
    case 0: return 'info'     // 待下单
    case 1: return 'primary'  // 已下单待送产
    case 2: return 'warning'  // 已送产待生产
    case 3: return 'primary'  // 已生产待发货
    case 4: return 'success'  // 已发货
    default: return 'info'
  }
}

// 获取订单状态文本
const getOrderStatusText = (status: number): string => {
  switch (status) {
    case 0: return '待下单'
    case 1: return '已下单待送产'
    case 2: return '已送产待生产'
    case 3: return '已生产待发货'
    case 4: return '已发货'
    default: return '未知状态'
  }
}

// 打印功能
const handlePrint = async (url: string) => {
  if (!url) {
    ElMessage.error('打印失败：未找到打印文件')
    return
  }

  try {
    const printUrl = url.startsWith('@') ? url.substring(1) : url
    const isPDF = printUrl.toLowerCase().endsWith('.pdf')

    if (isPDF) {
      printJS({
        printable: printUrl,
        type: 'pdf',
        showModal: true
      })
    } else {
      printJS({
        printable: printUrl,
        type: 'image',
        showModal: true
      })
    }
  } catch (error) {
    console.error('打印错误:', error)
    ElMessage.error('打印失败：' + (error instanceof Error ? error.message : '未知错误'))
  }
}

// 查看物流详情
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
.mobile-image-search {
  min-height: 100vh;
  background-color: #f5f7fa;
  
  .nav-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 44px;
    background-color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
    z-index: 100;

    .title {
      font-size: 17px;
      font-weight: 600;
      color: #303133;
    }
  }

  .upload-section {
    padding: 64px 20px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: calc(100vh - 64px);

    .preview-container {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;

      .preview-image {
        width: 100%;
        max-width: 300px;
        height: auto;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .preview-actions {
        display: flex;
        gap: 12px;
      }
    }

    .upload-buttons {
      display: flex;
      flex-direction: column;
      gap: 16px;
      width: 100%;
      max-width: 300px;

      .el-button {
        width: 100%;
        height: 48px;
        border-radius: 24px;
        font-size: 16px;

        .icon {
          font-size: 20px;
          margin-right: 8px;
        }
      }
    }

    .upload-hint {
      margin-top: 16px;
      color: #909399;
      font-size: 14px;
      text-align: center;
    }
  }

  .search-results {
    padding: 10px 10px 10px;
    min-height: 100vh;

    .action-bar {
      position: fixed;
      top: 44px;
      left: 0;
      right: 0;
      padding: 10px;
      background-color: #fff;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
      z-index: 99;

      .result-count {
        font-size: 14px;
        color: #606266;
      }
    }

    .result-list {
      padding-top: 0px;

      .result-item {
        background-color: #fff;
        border-radius: 12px;
        margin-bottom: 16px;
        overflow: hidden;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);

        .order-header {
          padding: 16px;
          border-bottom: 1px solid #ebeef5;

          .similarity-score {
            margin-bottom: 12px;
          }

          .shop-info {
            font-size: 16px;
            font-weight: 600;
            color: #303133;
            margin-bottom: 8px;
          }

          .order-no {
            font-size: 14px;
            color: #606266;
            margin-bottom: 8px;
          }
        }

        .image-section {
          padding: 16px;
          border-bottom: 1px solid #ebeef5;

          .image-list {
            display: flex;
            gap: 12px;
            overflow-x: auto;
            padding-bottom: 8px;
            -webkit-overflow-scrolling: touch;

            &::-webkit-scrollbar {
              display: none;
            }

            .image-item {
              flex: 0 0 auto;
              width: 200px;
              height: 200px;

              :deep(.el-image) {
                width: 100%;
                height: 100%;
                border-radius: 8px;
                overflow: hidden;
              }
            }
          }
        }

        .order-details {
          padding: 16px;

          .detail-section {
            margin-bottom: 20px;

            .section-title {
              font-size: 15px;
              font-weight: 600;
              color: #303133;
              margin-bottom: 12px;
              padding-left: 8px;
              border-left: 3px solid var(--el-color-primary);
            }

            .detail-item {
              margin-bottom: 8px;
              font-size: 14px;

              .label {
                color: #909399;
                margin-right: 8px;
              }

              .value {
                color: #303133;
              }

              &.highlight .value {
                color: var(--el-color-primary);
                font-size: 20px;
                font-weight: 600;
              }
            }
          }

          .print-action {
            margin-top: 20px;

            .el-button {
              width: 100%;
              justify-content: center;
              height: 44px;
              border-radius: 22px;

              .el-icon {
                margin-right: 8px;
              }
            }
          }
        }
      }
    }
  }

  .shipping-info {
    margin-top: 12px;
    text-align: right;
  }
}
</style> 
