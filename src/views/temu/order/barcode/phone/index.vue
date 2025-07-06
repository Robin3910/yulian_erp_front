<template>
  <div class="mobile-barcode-reader">
    <!-- 顶部导航栏 -->
    <div class="nav-header">
      <span class="title">条码识别</span>
    </div>

    <!-- 上传区域 -->
    <div class="upload-section" v-if="!result && !searchResults.length">
      <div class="preview-container" v-if="imageUrl">
        <img :src="imageUrl" alt="条码图片" class="preview-image" />
        <div class="preview-actions">
          <el-button type="danger" plain @click="resetImage">重新选择</el-button>
        </div>
      </div>
      
      <div v-else class="upload-buttons">
        <el-button type="primary" size="large" @click="handleStartCamera">
          <el-icon class="icon"><Camera /></el-icon>
          拍照扫码
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

    <!-- 识别结果 -->
    <div v-if="result && !searchResults.length" class="result-section">
      <!-- 顶部操作栏 -->
      <div class="action-bar">
        <el-button type="primary" plain @click="resetResult">
          <el-icon><Back /></el-icon>
          重新识别
        </el-button>
        <span class="result-title">识别结果</span>
      </div>

      <!-- 结果展示 -->
      <div class="result-content">
        <div class="result-card">
          <div class="result-header">
            <el-icon class="result-icon"><SuccessFilled /></el-icon>
            <span class="result-text">识别成功</span>
          </div>
          <div class="barcode-result">
            <div class="barcode-label">条码内容：</div>
            <div class="barcode-value">{{ result }}</div>
          </div>
          <div class="result-actions">
            <el-button type="primary" @click="copyResult">
              <el-icon><CopyDocument /></el-icon>
              复制条码
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 搜索结果列表 -->
    <div v-if="searchResults.length" class="search-results">
      <!-- 顶部操作栏 -->
      <div class="action-bar">
        <el-button type="primary" plain @click="resetSearch">
          <el-icon><Back /></el-icon>
          重新识别
        </el-button>
        <span class="result-count">找到 {{ searchResults.length }} 个结果</span>
      </div>

      <!-- 结果列表 -->
      <div class="result-list">
        <div v-for="(order, index) in sortedResults" :key="index" class="result-item">
          <!-- 订单基本信息 -->
          <div class="order-header">
            <div class="order-top-center">
              <div v-if="order.dailySequence" class="shipping-sequence-card">
                物流序号: <span class="seq-num">{{ order.dailySequence }}</span>
                <span v-if="order.shippingTime" class="shipping-date">（{{ formatDate(order.shippingTime) }}）</span>
              </div>
              <div v-if="order.trackingNumber" class="tracking-number-card">
                物流单号: <span class="tracking-number-value">{{ order.trackingNumber }}</span>
              </div>
              <div class="custom-sku-card" v-if="order.customSku">
                定制SKU: <span class="custom-sku-num">{{ order.customSku }}</span>
              </div>
            </div>
            <div class="order-status-row">
              <el-tag :type="getOrderStatusType(order.orderStatus)" class="order-status-tag">
                {{ getOrderStatusText(order.orderStatus) }}
              </el-tag>
              <div class="shipping-info-btn-inline" v-if="order.trackingNumber">
                <el-button class="shipping-detail-btn" @click="handleViewShipping(order)">
                  <el-icon style="margin-right: 4px;"><Van /></el-icon>
                  查看物流详情
                </el-button>
              </div>
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
            <div class="detail-section card-block">
              <div class="section-title">重要信息</div>
              <div class="detail-item">
                <span class="label">店铺：</span>
                <span class="value">{{ order.shopName }} ({{ order.aliasName }})</span>
              </div>
              <div class="detail-item">
                <span class="label">订单号：</span>
                <span class="value">{{ order.orderNo }}</span>
              </div>
              <div class="detail-item" v-if="result">
                <span class="label">条码编号：</span>
                <span class="value">{{ result }}</span>
              </div>
              <div class="detail-item">
                <span class="label">SKU / SKC：</span>
                <span class="value">{{ order.sku }} / {{ order.skc }}</span>
              </div>
              <div class="detail-item">
                <span class="label">图片ID：</span>
                <span class="value">{{ order.productId }}</span>
              </div>
              <div class="detail-item">
                <span class="label">数量信息：</span>
                <span class="value">官网：{{ order.originalQuantity }} / 制作：{{ order.quantity }}</span>
              </div>
            </div>

            <div class="detail-section card-block">
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
              <div class="detail-section card-block">
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

    <!-- 错误提示 -->
    <div v-if="error && !result && !searchResults.length" class="error-section">
      <div class="error-card">
        <div class="error-header">
          <el-icon class="error-icon"><WarningFilled /></el-icon>
          <span class="error-text">识别失败</span>
        </div>
        <div class="error-message">{{ error }}</div>
        <div class="error-actions">
          <el-button type="primary" @click="resetResult">重新识别</el-button>
        </div>
      </div>
    </div>

    <!-- 物流详情抽屉 -->
    <ShippingDetailsDrawer
      v-if="shippingDrawerVisible && shippingData"
      v-model="shippingDrawerVisible"
      :shipping-data="shippingData"
    />

    <!-- 物流详情抽屉 -->
    <ShippingDetailsDrawer
      v-if="shippingDrawerVisible && shippingData"
      v-model="shippingDrawerVisible"
      :shipping-data="shippingData"
    />

    <!-- 相机组件 -->
    <BarcodeCameraView
      v-if="showCamera"
      @capture="handleCameraCapture"
      @close="showCamera = false"
    />

    <!-- 加载中 -->
    <el-loading 
      v-model="loading" 
      text="识别并查询中..."
      background="rgba(255, 255, 255, 0.9)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Camera, Picture, Back, SuccessFilled, WarningFilled, CopyDocument, Printer, LocationFilled, Van } from '@element-plus/icons-vue';
import Quagga from 'quagga';
import { BrowserMultiFormatReader } from '@zxing/library';
import BarcodeCameraView from './components/BarcodeCameraView.vue';
import { searchByBarcode } from '@/api/temu/image-search';
import { OrderApi } from '@/api/temu/order';
import type { OrderResult, ShippingOrder } from '@/api/temu/order/types';
import printJS from 'print-js';
import ShippingDetailsDrawer from '../../image-search/phone/components/ShippingDetailsDrawer.vue';

const imageUrl = ref<string | null>(null);
const result = ref<string | null>(null);
const error = ref<string | null>(null);
const loading = ref(false);
const showCamera = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const searchResults = ref<OrderResult[]>([]);
const shippingDrawerVisible = ref(false);
const shippingData = ref<ShippingOrder | null>(null);
let fileRaw: File | null = null;

// 获取路由参数
const route = useRoute();

// 按物流序号排序的结果
const sortedResults = computed(() => {
  return [...searchResults.value].sort((a, b) => {
    // 优先按物流序号排序，如果没有则按订单号排序
    if (a.dailySequence && b.dailySequence) {
      return a.dailySequence - b.dailySequence;
    } else if (a.dailySequence) {
      return -1;
    } else if (b.dailySequence) {
      return 1;
    } else {
      return a.orderNo.localeCompare(b.orderNo);
    }
  });
})

// 开始相机拍照
const handleStartCamera = () => {
  resetImage();
  showCamera.value = true;
};

// 检查是否需要自动启动相机
const checkAutoStartCamera = () => {
  if (route.query.autoStart === 'true') {
    // 延迟一点时间确保页面完全加载
    setTimeout(() => {
      handleStartCamera();
    }, 500);
  }
};

// 处理相机拍照结果
const handleCameraCapture = async (file: File) => {
  showCamera.value = false;
  await processImageFile(file);
};

// 重置图片
const resetImage = () => {
  imageUrl.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
  fileRaw = null;
  result.value = null;
  error.value = null;
  searchResults.value = [];
};

// 重置结果
const resetResult = () => {
  result.value = null;
  error.value = null;
  searchResults.value = [];
};

// 重置搜索
const resetSearch = () => {
  searchResults.value = [];
  resetImage();
};

// 打开相册
const openGallery = () => {
  resetImage();
  if (fileInput.value) {
    fileInput.value.click();
  }
};

// 处理文件选择
const handleFileSelect = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;

  const file = input.files[0];
  await processImageFile(file);
};

// 处理图片文件
const processImageFile = async (file: File) => {
  // 验证文件类型
  const isValidType = ['image/png', 'image/jpeg', 'image/bmp', 'image/gif'].includes(file.type);
  if (!isValidType) {
    ElMessage.error('只支持 PNG、JPG、JPEG、BMP、GIF 格式的图片！');
    return;
  }

  // 显示预览图
  imageUrl.value = URL.createObjectURL(file);
  fileRaw = file;
  await decodeBarcode();
};

// 复制结果
const copyResult = async () => {
  if (result.value) {
    try {
      await navigator.clipboard.writeText(result.value);
      ElMessage.success('条码已复制到剪贴板');
    } catch (err) {
      ElMessage.error('复制失败');
    }
  }
};

// 根据条码查询订单
const searchOrderByBarcode = async () => {
  if (!result.value) {
    ElMessage.warning('请先识别条码');
    return;
  }

  try {
    const response = await searchByBarcode(result.value);
    searchResults.value = response;
    
    if (searchResults.value.length === 0) {
      ElMessage.warning('未找到相关订单');
    } else {
      ElMessage.success(`找到 ${searchResults.value.length} 个相关订单`);
    }
  } catch (error) {
    ElMessage.error('查询订单失败，请重试');
    console.error('Barcode search error:', error);
  } finally {
    loading.value = false;
  }
};

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

async function decodeBarcode() {
  if (!fileRaw) return;
  result.value = null;
  error.value = null;
  loading.value = true;
  
  try {
    const reader = new FileReader();
    reader.onload = function(e) {
      Quagga.decodeSingle({
        src: e.target?.result as string,
        numOfWorkers: 0,
        inputStream: {
          size: 800
        },
        decoder: {
          readers: ['ean_reader', 'code_128_reader', 'upc_reader', 'code_39_reader']
        }
      }, function(res) {
        if (res && res.codeResult) {
          result.value = res.codeResult.code;
          loading.value = false;
          // 识别成功后自动查询订单
          searchOrderByBarcode();
        } else {
          console.log('Quagga 未识别到条码，也没有定位框，尝试用ZXing识别整张图片');
          zxingDecode(imageUrl.value!, false);
        }
      });
    };
    reader.readAsDataURL(fileRaw);
  } catch (e: any) {
    error.value = '识别失败，请确认图片为有效条码。';
    loading.value = false;
  }
}

async function zxingDecode(imageDataUrl: string, isZoomed = false, scale = 1.2, tryCount = 0) {
  const codeReader = new BrowserMultiFormatReader();
  try {
    const resultZXing = await codeReader.decodeFromImageUrl(imageDataUrl);
    result.value = resultZXing.getText();
    error.value = null;
    loading.value = false;
    // 识别成功后自动查询订单
    searchOrderByBarcode();
  } catch (e) {
    if (!isZoomed) {
      console.log('ZXing 也无法识别该条码，开始进行放大图片识别...');
      const zoomedDataUrl = await zoomImage(imageDataUrl, scale);
      await zxingDecode(zoomedDataUrl, true, scale, 1);
    } else if (tryCount < 10 && scale < 2.0) {
      const nextScale = scale + 0.2;
      console.log(`放大重试，当前 scale: ${nextScale.toFixed(1)}`);
      const zoomedDataUrl = await zoomImage(imageDataUrl, nextScale);
      await zxingDecode(zoomedDataUrl, true, nextScale, tryCount + 1);
    } else {
      error.value = 'ZXing 也无法识别该条码。';
      loading.value = false;
    }
  }
}

async function zoomImage(imageDataUrl: string, scale = 2): Promise<string> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = function() {
      const fullWidth = img.width * scale;
      const fullHeight = img.height * scale;
      const cropX = fullWidth * 0.1;
      const cropY = fullHeight * 0.1;
      const cropWidth = fullWidth * 0.8;
      const cropHeight = fullHeight * 0.8;
      const canvas = document.createElement('canvas');
      canvas.width = cropWidth;
      canvas.height = cropHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(
        img,
        cropX / scale,
        cropY / scale,
        img.width * 0.8,
        img.height * 0.8,
        0,
        0,
        cropWidth,
        cropHeight
      );
      resolve(canvas.toDataURL());
    };
    img.src = imageDataUrl;
  });
}

function formatDate(ts: number) {
  if (!ts) return '';
  const date = new Date(ts);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${mm}-${dd}`;
}

// 页面加载时检查是否需要自动启动相机
onMounted(() => {
  checkAutoStartCamera();
  
  // 监听全局事件，用于从其他组件触发相机启动
  window.addEventListener('startBarcodeCamera', () => {
    handleStartCamera();
  });
});

// 组件卸载时清理事件监听器
onBeforeUnmount(() => {
  window.removeEventListener('startBarcodeCamera', () => {
    handleStartCamera();
  });
});
</script>

<style lang="scss" scoped>
.mobile-barcode-reader {
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

  .result-section {
    padding: 64px 20px 20px;
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

      .result-title {
        font-size: 16px;
        font-weight: 600;
        color: #303133;
      }
    }

    .result-content {
      padding-top: 60px;

      .result-card {
        background-color: #fff;
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);

        .result-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 16px 0 8px 0;
          border-bottom: 1px solid #ebeef5;

          .result-icon {
            font-size: 24px;
            color: #67c23a;
            margin-right: 8px;
          }

          .result-text {
            font-size: 18px;
            font-weight: 600;
            color: #67c23a;
          }
        }

        .barcode-result {
          margin-bottom: 24px;

          .barcode-label {
            font-size: 14px;
            color: #909399;
            margin-bottom: 8px;
          }

          .barcode-value {
            font-size: 20px;
            font-weight: 600;
            color: #303133;
            word-break: break-all;
            padding: 12px;
            background-color: #f5f7fa;
            border-radius: 8px;
            border: 1px solid #e4e7ed;
          }
        }

        .result-actions {
          display: flex;
          justify-content: center;

          .el-button {
            width: 200px;
            height: 44px;
            border-radius: 22px;
            font-size: 16px;

            .el-icon {
              margin-right: 8px;
            }
          }
        }
      }
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
        background: #fff;
        border-radius: 14px;
        box-shadow: 0 2px 12px rgba(0,0,0,0.04);
        margin-bottom: 18px;
        padding: 0 0 16px 0;

        .order-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 18px 0 10px 0;
          border-bottom: 1px solid #ebeef5;
          background: #fff;

          .order-top-center {
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            margin-bottom: 10px;

            .shipping-sequence-card {
              background: #fdf6ec;
              color: #e6a23c;
              font-size: 20px;
              font-weight: bold;
              border-radius: 8px;
              padding: 6px 24px;
              margin-bottom: 2px;
              box-shadow: 0 2px 8px rgba(230,162,60,0.08);
              .seq-num {
                font-size: 24px;
                font-weight: 900;
                margin-left: 4px;
              }
              .shipping-date {
                font-size: 16px;
                color: #bfa76a;
                font-weight: 500;
                margin-left: 8px;
              }
            }
            .tracking-number-card {
              background: #f0f9ff;
              color: #409eff;
              font-size: 16px;
              font-weight: 600;
              border-radius: 8px;
              padding: 4px 18px;
              margin-bottom: 2px;
              .tracking-number-value {
                font-size: 18px;
                font-weight: bold;
                margin-left: 4px;
              }
            }
            .custom-sku-card {
              background: #f0f9eb;
              color: #67c23a;
              font-size: 18px;
              font-weight: bold;
              border-radius: 8px;
              padding: 4px 18px;
              margin-bottom: 2px;
              .custom-sku-num {
                font-size: 20px;
                font-weight: 900;
                margin-left: 4px;
              }
            }
          }

          .order-status-row {
            width: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 12px;
            margin: 8px 0 0 0;
            .order-status-tag {
              font-size: 16px;
              font-weight: bold;
              padding: 6px 22px;
              border-radius: 20px;
              background: linear-gradient(90deg, #f0f9ff 60%, #e0f7fa 100%);
              color: #409eff;
              border: none;
              box-shadow: 0 2px 8px rgba(64,158,255,0.08);
              letter-spacing: 1px;
            }
            .shipping-info-btn-inline {
              display: flex;
              align-items: center;
              .shipping-detail-btn {
                background: linear-gradient(90deg, #409eff 60%, #66b1ff 100%);
                color: #fff;
                font-size: 16px;
                font-weight: 600;
                border: none;
                border-radius: 22px;
                padding: 0 20px;
                height: 40px;
                box-shadow: 0 2px 8px rgba(64,158,255,0.10);
                display: flex;
                align-items: center;
                transition: background 0.2s, box-shadow 0.2s;
                .el-icon {
                  font-size: 18px;
                }
                &:hover, &:active {
                  background: linear-gradient(90deg, #337ecc 60%, #409eff 100%);
                  box-shadow: 0 4px 16px rgba(64,158,255,0.18);
                  color: #fff;
                }
              }
            }
          }
        }

        .image-section {
          display: flex;
          justify-content: center;
          padding: 16px 0;
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
              border-radius: 8px;
              overflow: hidden;
              border: 1px solid #e4e7ed;

              .el-image {
                width: 100%;
                height: 100%;
              }
            }
          }
        }

        .order-details {
          padding: 16px;

          .detail-section {
            margin-bottom: 16px;

            .section-title {
              font-size: 14px;
              font-weight: 600;
              color: #303133;
              margin-bottom: 8px;
            }

            .detail-item {
              display: flex;
              align-items: flex-start;
              margin-bottom: 8px;

              .label {
                font-size: 14px;
                color: #909399;
                margin-right: 8px;
                flex-shrink: 0;
                min-width: 80px;
              }

              .value {
                font-size: 14px;
                color: #303133;
                flex: 1;
                word-break: break-all;
              }

              &.highlight {
                .value {
                  color: #e6a23c;
                  font-weight: 600;
                }
              }
            }
          }

          .print-action {
            display: flex;
            justify-content: center;
            margin-top: 16px;
          }
        }
      }
    }
  }

  .error-section {
    padding: 64px 20px 20px;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;

    .error-card {
      background-color: #fff;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
      width: 100%;
      max-width: 300px;

      .error-header {
        display: flex;
        align-items: center;
        margin-bottom: 16px;

        .error-icon {
          font-size: 24px;
          color: #f56c6c;
          margin-right: 8px;
        }

        .error-text {
          font-size: 18px;
          font-weight: 600;
          color: #f56c6c;
        }
      }

      .error-message {
        font-size: 14px;
        color: #606266;
        margin-bottom: 20px;
        line-height: 1.5;
      }

      .error-actions {
        .el-button {
          width: 100%;
          height: 44px;
          border-radius: 22px;
          font-size: 16px;
        }
      }
    }
  }
}

.card-block {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  margin-bottom: 18px;
  padding: 18px 14px 10px 14px;
  .section-title {
    font-size: 16px;
    font-weight: 700;
    color: #409eff;
    margin-bottom: 12px;
    letter-spacing: 1px;
  }
  .detail-item {
    display: flex;
    align-items: flex-start;
    margin-bottom: 8px;
    .label {
      font-size: 14px;
      color: #909399;
      min-width: 80px;
      font-weight: 500;
    }
    .value {
      font-size: 14px;
      color: #303133;
      flex: 1;
      word-break: break-all;
    }
  }
}
</style>


