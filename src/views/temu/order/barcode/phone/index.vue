<template>
  <div class="mobile-barcode-reader">
    <!-- 顶部导航栏 -->
    <div class="nav-header">
      <span class="title">条码识别</span>
    </div>

    <!-- 上传区域 -->
    <div class="upload-section" v-if="!result">
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
    <div v-else class="result-section">
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

    <!-- 错误提示 -->
    <div v-if="error && !result" class="error-section">
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

    <!-- 相机组件 -->
    <BarcodeCameraView
      v-if="showCamera"
      @capture="handleCameraCapture"
      @close="showCamera = false"
    />

    <!-- 加载中 -->
    <el-loading 
      v-model="loading" 
      text="识别中..."
      background="rgba(255, 255, 255, 0.9)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Camera, Picture, Back, SuccessFilled, WarningFilled, CopyDocument } from '@element-plus/icons-vue';
import Quagga from 'quagga';
import { BrowserMultiFormatReader } from '@zxing/library';
import BarcodeCameraView from './components/BarcodeCameraView.vue';

const imageUrl = ref<string | null>(null);
const result = ref<string | null>(null);
const error = ref<string | null>(null);
const loading = ref(false);
const showCamera = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
let fileRaw: File | null = null;

// 开始相机拍照
const handleStartCamera = () => {
  resetImage();
  showCamera.value = true;
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
};

// 重置结果
const resetResult = () => {
  result.value = null;
  error.value = null;
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
          align-items: center;
          margin-bottom: 20px;

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
          .el-button {
            width: 100%;
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
</style>


