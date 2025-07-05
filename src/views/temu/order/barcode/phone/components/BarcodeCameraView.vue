<template>
  <div class="barcode-camera-view">
    <video
      ref="videoRef"
      class="camera-preview"
      autoplay
      playsinline
      muted
    ></video>
    
    <!-- 条码定位框 -->
    <div class="barcode-viewfinder">
      <!-- 四个角的定位线 -->
      <div class="corner top-left">
        <div class="corner-line horizontal"></div>
        <div class="corner-line vertical"></div>
      </div>
      <div class="corner top-right">
        <div class="corner-line horizontal"></div>
        <div class="corner-line vertical"></div>
      </div>
      <div class="corner bottom-left">
        <div class="corner-line horizontal"></div>
        <div class="corner-line vertical"></div>
      </div>
      <div class="corner bottom-right">
        <div class="corner-line horizontal"></div>
        <div class="corner-line vertical"></div>
      </div>
      
      <!-- 扫描线动画 -->
      <div class="scan-line"></div>
      
      <!-- 扫描区域提示 -->
      <div class="scan-area-hint">
        <div class="hint-text">将条码放入框内</div>
        <div class="hint-subtext">自动识别条码</div>
      </div>
    </div>

    <!-- 控制按钮 -->
    <div class="control-buttons">
      <el-button type="danger" plain @click="handleClose" class="close-btn">
        <el-icon><Close /></el-icon>
        关闭
      </el-button>
      <el-button type="primary" @click="handleManualCapture" class="capture-btn">
        <el-icon><Camera /></el-icon>
        拍照
      </el-button>
    </div>

    <!-- 用于绘制拍照的canvas -->
    <canvas ref="canvasRef" style="display: none;"></canvas>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { Camera, Close } from '@element-plus/icons-vue'

const emit = defineEmits(['capture', 'close'])
const videoRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const stream = ref<MediaStream | null>(null)
const isProcessing = ref(false)

// 初始化相机
const initCamera = async () => {
  try {
    const constraints = {
      video: {
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 },
        focusMode: ['continuous', 'auto'],
        exposureMode: ['continuous', 'auto'],
        whiteBalanceMode: ['continuous', 'auto']
      }
    }
    
    stream.value = await navigator.mediaDevices.getUserMedia(constraints)

    if (videoRef.value) {
      videoRef.value.srcObject = stream.value
      
      // 等待视频加载完成后设置canvas
      videoRef.value.onloadedmetadata = () => {
        if (canvasRef.value && videoRef.value) {
          canvasRef.value.width = videoRef.value.videoWidth
          canvasRef.value.height = videoRef.value.videoHeight
        }
      }
    }
  } catch (error) {
    console.error('相机初始化失败:', error)
    ElMessage.error('无法访问相机，请确保已授予相机权限')
    emit('close')
  }
}

// 手动拍照
const handleManualCapture = async () => {
  if (isProcessing.value) return
  isProcessing.value = true
  
  try {
    if (canvasRef.value && videoRef.value) {
      const ctx = canvasRef.value.getContext('2d')
      if (ctx) {
        // 绘制当前视频帧到canvas
        ctx.drawImage(videoRef.value, 0, 0, canvasRef.value.width, canvasRef.value.height)
        
        // 将canvas转换为blob
        canvasRef.value.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'barcode.jpg', { type: 'image/jpeg' })
            emit('capture', file)
          }
        }, 'image/jpeg', 0.8)
      }
    }
  } catch (error) {
    console.error('拍照失败:', error)
    ElMessage.error('拍照失败，请重试')
  } finally {
    isProcessing.value = false
  }
}

// 关闭相机
const handleClose = () => {
  if (stream.value) {
    stream.value.getTracks().forEach(track => track.stop())
  }
  emit('close')
}

onMounted(() => {
  initCamera()
})

onBeforeUnmount(() => {
  if (stream.value) {
    stream.value.getTracks().forEach(track => track.stop())
  }
})
</script>

<style lang="scss" scoped>
.barcode-camera-view {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: #000;
  z-index: 9999;
  display: flex;
  flex-direction: column;

  .camera-preview {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .barcode-viewfinder {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 280px;
    height: 200px;
    z-index: 10;

    .corner {
      position: absolute;
      width: 30px;
      height: 30px;

      .corner-line {
        position: absolute;
        background-color: #00ff00;
        box-shadow: 0 0 8px rgba(0, 255, 0, 0.8);
      }

      .horizontal {
        width: 30px;
        height: 3px;
        top: 0;
        left: 0;
      }

      .vertical {
        width: 3px;
        height: 30px;
        top: 0;
        left: 0;
      }

      &.top-left {
        top: 0;
        left: 0;
      }

      &.top-right {
        top: 0;
        right: 0;
        .horizontal {
          right: 0;
        }
        .vertical {
          right: 0;
        }
      }

      &.bottom-left {
        bottom: 0;
        left: 0;
        .horizontal {
          bottom: 0;
        }
        .vertical {
          bottom: 0;
        }
      }

      &.bottom-right {
        bottom: 0;
        right: 0;
        .horizontal {
          bottom: 0;
          right: 0;
        }
        .vertical {
          bottom: 0;
          right: 0;
        }
      }
    }

    .scan-line {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 2px;
      background: linear-gradient(90deg, transparent, #00ff00, transparent);
      box-shadow: 0 0 8px rgba(0, 255, 0, 0.8);
      animation: scanAnimation 2s ease-in-out infinite;
    }

    .scan-area-hint {
      position: absolute;
      bottom: -60px;
      left: 50%;
      transform: translateX(-50%);
      text-align: center;
      color: #fff;
      text-shadow: 0 0 8px rgba(0, 0, 0, 0.8);

      .hint-text {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 4px;
      }

      .hint-subtext {
        font-size: 12px;
        opacity: 0.8;
      }
    }
  }

  .control-buttons {
    position: absolute;
    bottom: 40px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    gap: 20px;
    padding: 0 20px;
    z-index: 10;

    .el-button {
      min-width: 100px;
      height: 44px;
      border-radius: 22px;
      font-size: 16px;

      .el-icon {
        margin-right: 4px;
      }
    }

    .close-btn {
      background-color: rgba(255, 255, 255, 0.2);
      border-color: rgba(255, 255, 255, 0.3);
      color: #fff;

      &:hover {
        background-color: rgba(255, 255, 255, 0.3);
        border-color: rgba(255, 255, 255, 0.4);
      }
    }

    .capture-btn {
      background-color: #00ff00;
      border-color: #00ff00;
      color: #000;
      box-shadow: 0 0 16px rgba(0, 255, 0, 0.6);

      &:hover {
        background-color: #00dd00;
        border-color: #00dd00;
        box-shadow: 0 0 20px rgba(0, 255, 0, 0.8);
      }
    }
  }
}

@keyframes scanAnimation {
  0% {
    top: 0;
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    top: 100%;
    opacity: 0;
  }
}

// 添加呼吸灯效果
.corner {
  animation: cornerBreath 2s ease-in-out infinite;
}

@keyframes cornerBreath {
  0%, 100% {
    opacity: 0.8;
  }
  50% {
    opacity: 1;
  }
}

// 响应式设计
@media (max-width: 480px) {
  .barcode-viewfinder {
    width: 240px;
    height: 160px;

    .scan-area-hint {
      bottom: -50px;

      .hint-text {
        font-size: 14px;
      }

      .hint-subtext {
        font-size: 11px;
      }
    }
  }

  .control-buttons {
    bottom: 30px;
    gap: 16px;

    .el-button {
      min-width: 80px;
      height: 40px;
      font-size: 14px;
    }
  }
}
</style> 