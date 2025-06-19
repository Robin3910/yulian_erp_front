<template>
  <div class="camera-view">
    <video
      ref="videoRef"
      class="camera-preview"
      autoplay
      playsinline
      muted
    ></video>
    
    <!-- 取景框 -->
    <div class="viewfinder">
      <div class="corner top-left"></div>
      <div class="corner top-right"></div>
      <div class="corner bottom-left"></div>
      <div class="corner bottom-right"></div>
    </div>

    <!-- 提示文本 -->
    <div class="hint-text">
      将物品放入取景框内
    </div>

    <!-- 控制按钮 -->
    <div class="control-buttons">
      <el-button type="danger" plain @click="handleClose">
        <el-icon><Close /></el-icon>
        关闭相机
      </el-button>
      <el-button type="primary" @click="handleManualCapture">
        <el-icon><Camera /></el-icon>
        手动拍照
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
const hasObject = ref(false) // 添加物体存在状态
let motionTimer: NodeJS.Timeout | null = null
let lastImageData: ImageData | null = null
let animationFrameId: number | null = null // 添加动画帧ID
const MOTION_THRESHOLD = 5 // 增加运动检测阈值，使其对细微移动不那么敏感
const OBJECT_THRESHOLD = 20 // 提高物体检测阈值
const STABLE_DELAY = 800 // 增加稳定延迟时间
const MIN_BRIGHTNESS = 0.15 // 保持最小亮度阈值不变
const MIN_EDGE_RATIO = 0.03 // 提高边缘比例要求
const STABLE_FRAMES_REQUIRED = 7 // 新增：需要连续稳定的帧数
const SCENE_CHANGE_THRESHOLD = 15 // 新增：场景变化检测阈值
const BACKGROUND_LEARNING_FRAMES = 30 // 新增：背景学习帧数
const MIN_COLOR_DIFF = 25 // 新增：最小颜色差异阈值
const MIN_TEXTURE_RATIO = 0.1 // 新增：最小纹理比例
const LIGHT_CHANGE_THRESHOLD = 20 // 新增：光线变化阈值

// 新增：用于跟踪连续稳定的帧数和场景状态
let stableFrameCount = 0
let lastStableTime = 0
let backgroundFrames: ImageData[] = [] // 存储背景帧
let isBackgroundLearned = false
let lastSceneChangeTime = 0
let lastAverageBrightness = 0 // 新增：记录上一帧的平均亮度

// 获取最佳相机配置
const getBestVideoConstraints = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    const videoDevices = devices.filter(device => device.kind === 'videoinput')
    
    // 检测设备性能
    const isHighEndDevice = () => {
      const memory = (navigator as any).deviceMemory
      const cores = navigator.hardwareConcurrency || 4
      return (memory && memory >= 4) || cores >= 6
    }
    
    // 根据设备性能选择合适的分辨率和帧率
    const getOptimalResolution = () => {
      if (isHighEndDevice()) {
        return {
          width: { min: 1280, ideal: 1920, max: 2560 },
          height: { min: 720, ideal: 1080, max: 1440 },
          frameRate: { min: 24, ideal: 30, max: 60 }
        }
      } else {
        return {
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 },
          frameRate: { min: 15, ideal: 24, max: 30 }
        }
      }
    }

    // 获取后置摄像头ID
    const backCamera = videoDevices.find(device => 
      device.label.toLowerCase().includes('back') || 
      device.label.toLowerCase().includes('rear')
    )

    return {
      video: {
        ...getOptimalResolution(),
        deviceId: backCamera ? { exact: backCamera.deviceId } : undefined,
        facingMode: backCamera ? undefined : 'environment',
        focusMode: ['continuous', 'auto'],
        exposureMode: ['continuous', 'auto'],
        whiteBalanceMode: ['continuous', 'auto']
      }
    }
  } catch (error) {
    console.error('获取相机配置失败:', error)
    return {
      video: {
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    }
  }
}

// 初始化相机
const initCamera = async () => {
  try {
    const constraints = await getBestVideoConstraints()
    stream.value = await navigator.mediaDevices.getUserMedia(constraints)

    if (videoRef.value) {
      videoRef.value.srcObject = stream.value
      
      // 等待视频加载完成后开始检测
      videoRef.value.onloadedmetadata = () => {
        if (canvasRef.value && videoRef.value) {
          canvasRef.value.width = videoRef.value.videoWidth
          canvasRef.value.height = videoRef.value.videoHeight
          startDetection()
        }
      }
    }
  } catch (error) {
    console.error('相机初始化失败:', error)
    ElMessage.error('无法访问相机，请确保已授予相机权限')
    emit('close')
  }
}

// 新增：计算区域的颜色差异和纹理特征
const calculateRegionFeatures = (data: Uint8ClampedArray, width: number, x: number, y: number, regionSize: number): { colorVariance: number, textureRatio: number } => {
  let rSum = 0, gSum = 0, bSum = 0
  let rSqSum = 0, gSqSum = 0, bSqSum = 0
  let edgeCount = 0
  let pixelCount = 0

  for (let dy = 0; dy < regionSize && (y + dy) < width; dy++) {
    for (let dx = 0; dx < regionSize && (x + dx) < width; dx++) {
      const i = ((y + dy) * width + (x + dx)) * 4
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]

      rSum += r
      gSum += g
      bSum += b
      rSqSum += r * r
      gSqSum += g * g
      bSqSum += b * b
      pixelCount++

      // 检测局部边缘
      if (dx < regionSize - 1 && dy < regionSize - 1) {
        const i2 = ((y + dy) * width + (x + dx + 1)) * 4
        const i3 = ((y + dy + 1) * width + (x + dx)) * 4
        
        const dx = Math.abs(data[i] - data[i2]) + 
                  Math.abs(data[i + 1] - data[i2 + 1]) + 
                  Math.abs(data[i + 2] - data[i2 + 2])
        const dy = Math.abs(data[i] - data[i3]) + 
                  Math.abs(data[i + 1] - data[i3 + 1]) + 
                  Math.abs(data[i + 2] - data[i3 + 2])
        
        if (Math.sqrt(dx * dx + dy * dy) > 30) {
          edgeCount++
        }
      }
    }
  }

  // 计算颜色方差
  const rMean = rSum / pixelCount
  const gMean = gSum / pixelCount
  const bMean = bSum / pixelCount
  const rVariance = (rSqSum / pixelCount) - (rMean * rMean)
  const gVariance = (gSqSum / pixelCount) - (gMean * gMean)
  const bVariance = (bSqSum / pixelCount) - (bMean * bMean)
  const colorVariance = (rVariance + gVariance + bVariance) / 3

  return {
    colorVariance,
    textureRatio: edgeCount / (regionSize * regionSize)
  }
}

// 修改：增强物体检测算法
const detectObject = (imageData: ImageData): boolean => {
  const { data, width, height } = imageData
  const centerWidth = Math.floor(width * 0.8)
  const centerHeight = Math.floor(height * 0.5)
  const startX = Math.floor((width - centerWidth) / 2)
  const startY = Math.floor((height - centerHeight) / 2)
  
  let totalBrightness = 0
  let significantRegions = 0
  const regionSize = 20 // 分析区域大小
  
  // 计算整体亮度变化
  for (let y = startY; y < startY + centerHeight; y++) {
    for (let x = startX; x < startX + centerWidth; x++) {
      const i = (y * width + x) * 4
      totalBrightness += (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255
    }
  }
  
  const avgBrightness = totalBrightness / (centerWidth * centerHeight)
  const brightnessChange = Math.abs(avgBrightness - lastAverageBrightness)
  lastAverageBrightness = avgBrightness
  
  // 如果只是整体亮度变化，可能是光线变化
  if (brightnessChange > LIGHT_CHANGE_THRESHOLD) {
    return false
  }
  
  // 分区域分析物体特征
  for (let y = startY; y < startY + centerHeight - regionSize; y += regionSize) {
    for (let x = startX; x < startX + centerWidth - regionSize; x += regionSize) {
      const { colorVariance, textureRatio } = calculateRegionFeatures(data, width, x, y, regionSize)
      
      // 同时考虑颜色差异和纹理特征
      if (colorVariance > MIN_COLOR_DIFF && textureRatio > MIN_TEXTURE_RATIO) {
        significantRegions++
      }
    }
  }
  
  const totalRegions = Math.floor((centerWidth / regionSize) * (centerHeight / regionSize))
  const significantRatio = significantRegions / totalRegions
  
  return significantRatio > 0.15 // 要求至少15%的区域有显著特征
}

// 修改：优化场景变化检测
const calculateSceneChange = (current: ImageData, background: ImageData): number => {
  const data1 = current.data
  const data2 = background.data
  let significantChanges = 0
  let totalRegions = 0
  
  // 计算中心区域的范围
  const centerWidth = Math.floor(current.width * 0.8)
  const centerHeight = Math.floor(current.height * 0.5)
  const startX = Math.floor((current.width - centerWidth) / 2)
  const startY = Math.floor((current.height - centerHeight) / 2)
  
  const regionSize = 20 // 分析区域大小
  
  // 分区域分析变化
  for (let y = startY; y < startY + centerHeight - regionSize; y += regionSize) {
    for (let x = startX; x < startX + centerWidth - regionSize; x += regionSize) {
      totalRegions++
      
      const currentFeatures = calculateRegionFeatures(data1, current.width, x, y, regionSize)
      const backgroundFeatures = calculateRegionFeatures(data2, background.width, x, y, regionSize)
      
      // 比较区域特征
      const colorDiff = Math.abs(currentFeatures.colorVariance - backgroundFeatures.colorVariance)
      const textureDiff = Math.abs(currentFeatures.textureRatio - backgroundFeatures.textureRatio)
      
      // 同时考虑颜色和纹理的变化
      if (colorDiff > MIN_COLOR_DIFF && textureDiff > MIN_TEXTURE_RATIO) {
        significantChanges++
      }
    }
  }
  
  // 返回显著变化区域的比例
  return (significantChanges * 100) / totalRegions
}

// 新增：更新背景模型
const updateBackgroundModel = (frame: ImageData) => {
  if (backgroundFrames.length >= BACKGROUND_LEARNING_FRAMES) {
    backgroundFrames.shift() // 移除最旧的帧
  }
  backgroundFrames.push(frame)
  
  if (backgroundFrames.length >= BACKGROUND_LEARNING_FRAMES) {
    isBackgroundLearned = true
  }
}

// 开始检测
const startDetection = () => {
  if (!videoRef.value || !canvasRef.value) return
  
  const ctx = canvasRef.value.getContext('2d', { 
    alpha: false,
    willReadFrequently: true
  })
  if (!ctx) return
  
  let lastFrameTime = performance.now()
  const targetFrameInterval = 1000 / 30
  
  const detect = () => {
    if (!videoRef.value || !canvasRef.value || !ctx) return
    
    const now = performance.now()
    const elapsed = now - lastFrameTime
    
    if (elapsed < targetFrameInterval) {
      animationFrameId = requestAnimationFrame(detect)
      return
    }
    
    lastFrameTime = now
    
    ctx.drawImage(videoRef.value, 0, 0)
    const currentImageData = ctx.getImageData(0, 0, canvasRef.value.width, canvasRef.value.height)
    
    // 更新背景模型
    if (!isBackgroundLearned || backgroundFrames.length < BACKGROUND_LEARNING_FRAMES) {
      updateBackgroundModel(currentImageData)
      lastImageData = currentImageData
      animationFrameId = requestAnimationFrame(detect)
      return
    }
    
    const objectPresent = detectObject(currentImageData)
    hasObject.value = objectPresent
    
    if (objectPresent) {
      if (lastImageData) {
        const movement = calculateMovement(currentImageData, lastImageData)
        
        if (movement < MOTION_THRESHOLD) {
          stableFrameCount++
          
          // 检查是否有显著的场景变化
          const avgBackground = backgroundFrames[Math.floor(backgroundFrames.length / 2)]
          const sceneChange = calculateSceneChange(currentImageData, avgBackground)
          
          // 只有当检测到显著场景变化，并且距离上次场景变化有足够间隔时才可能触发拍照
          if (sceneChange > SCENE_CHANGE_THRESHOLD && 
              (now - lastSceneChangeTime) > 2000 && // 确保场景变化间隔至少2秒
              stableFrameCount >= STABLE_FRAMES_REQUIRED && 
              !isProcessing.value && 
              !motionTimer &&
              (now - lastStableTime) > 1000) {
            
            motionTimer = setTimeout(() => {
              handleCapture()
              lastStableTime = now
              lastSceneChangeTime = now
              stableFrameCount = 0
            }, STABLE_DELAY)
          }
        } else {
          stableFrameCount = 0
          if (motionTimer) {
            clearTimeout(motionTimer)
            motionTimer = null
          }
        }
      }
    } else {
      stableFrameCount = 0
      if (motionTimer) {
        clearTimeout(motionTimer)
        motionTimer = null
      }
    }
    
    lastImageData = currentImageData
    animationFrameId = requestAnimationFrame(detect)
  }
  
  detect()
}

// 清理资源
const cleanup = () => {
  if (stream.value) {
    stream.value.getTracks().forEach(track => track.stop())
  }
  if (motionTimer) {
    clearTimeout(motionTimer)
    motionTimer = null
  }
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
  if (videoRef.value) {
    videoRef.value.srcObject = null
  }
  lastImageData = null
  isProcessing.value = false
  backgroundFrames = [] // 新增：清理背景帧
  isBackgroundLearned = false // 新增：重置背景学习状态
}

// 关闭相机
const handleClose = () => {
  cleanup()
  emit('close')
}

// 手动拍照
const handleManualCapture = async () => {
  if (isProcessing.value) return
  
  // 停止运动检测
  if (motionTimer) {
    clearTimeout(motionTimer)
    motionTimer = null
  }
  
  // 确保不在处理中
  isProcessing.value = false
  await handleCapture()
}

// 拍照处理
const handleCapture = async () => {
  if (!videoRef.value || !canvasRef.value) return
  isProcessing.value = true

  const video = videoRef.value
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  try {
    // 计算取景框的尺寸和位置
    const frameWidth = video.videoWidth * 0.8
    const frameHeight = video.videoHeight * 0.5
    const frameX = (video.videoWidth - frameWidth) / 2
    const frameY = (video.videoHeight - frameHeight) / 2

    // 设置canvas尺寸为取景框的大小
    canvas.width = frameWidth
    canvas.height = frameHeight
    
    // 只绘制取景框内的区域
    ctx.drawImage(
      video,
      frameX, frameY, frameWidth, frameHeight, // 源图像的裁剪区域
      0, 0, frameWidth, frameHeight // 目标canvas的绘制区域
    )

    // 将canvas内容转换为Blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => {
        resolve(b!)
      }, 'image/jpeg', 0.95) // 提高图片质量
    })

    // 创建File对象
    const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' })
    
    // 发送拍照结果
    emit('capture', file)
  } catch (error) {
    console.error('拍照失败:', error)
    ElMessage.error('拍照失败，请重试')
  } finally {
    isProcessing.value = false
  }
}

// 计算两帧之间的差异
const calculateMovement = (current: ImageData, last: ImageData): number => {
  const data1 = current.data
  const data2 = last.data
  let diff = 0
  const sampleSize = 300 // 增加采样点数量，进一步提高精确度
  
  // 计算中心区域的范围（取景框内的区域）
  const centerWidth = Math.floor(current.width * 0.8) // 增加取景框宽度占比
  const centerHeight = Math.floor(current.height * 0.5) // 增加取景框高度占比
  const startX = Math.floor((current.width - centerWidth) / 2)
  const startY = Math.floor((current.height - centerHeight) / 2)
  
  // 只对取景框内的区域进行运动检测，增加采样密度
  for (let y = startY; y < startY + centerHeight; y += 3) {
    for (let x = startX; x < startX + centerWidth; x += 3) {
      const i = (y * current.width + x) * 4
      // 计算RGB通道的差异，增加权重
      diff += Math.abs(data1[i] - data2[i]) * 1.2 // R通道增加权重
      diff += Math.abs(data1[i + 1] - data2[i + 1]) * 1.0 // G通道
      diff += Math.abs(data1[i + 2] - data2[i + 2]) * 0.8 // B通道权重降低
    }
  }

  // 归一化差异值
  return diff / (centerWidth * centerHeight * 3)
}

onMounted(() => {
  initCamera()
})

onBeforeUnmount(() => {
  cleanup()
})
</script>

<style lang="scss" scoped>
.camera-view {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #000;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;

  .camera-preview {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .viewfinder {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 80%;
    height: 50%;
    border: 2px solid rgba(255, 255, 255, 0.8);
    border-radius: 12px;

    .corner {
      position: absolute;
      width: 20px;
      height: 20px;
      border: 2px solid #fff;

      &.top-left {
        top: -2px;
        left: -2px;
        border-right: none;
        border-bottom: none;
        border-top-left-radius: 12px;
      }

      &.top-right {
        top: -2px;
        right: -2px;
        border-left: none;
        border-bottom: none;
        border-top-right-radius: 12px;
      }

      &.bottom-left {
        bottom: -2px;
        left: -2px;
        border-right: none;
        border-top: none;
        border-bottom-left-radius: 12px;
      }

      &.bottom-right {
        bottom: -2px;
        right: -2px;
        border-left: none;
        border-top: none;
        border-bottom-right-radius: 12px;
      }
    }
  }

  .hint-text {
    position: absolute;
    top: 25%;
    left: 50%;
    transform: translateX(-50%);
    color: #fff;
    font-size: 16px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    background-color: rgba(0, 0, 0, 0.5);
    padding: 8px 16px;
    border-radius: 20px;
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

    .el-button {
      flex: 1;
      max-width: 160px;
      height: 44px;
      border-radius: 22px;
      font-size: 16px;

      .el-icon {
        margin-right: 4px;
        font-size: 20px;
      }
    }
  }
}
</style>