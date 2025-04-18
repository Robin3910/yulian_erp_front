<template>
  <div
    :class="prefixCls"
    class="relative h-[100%] lt-md:px-10px lt-sm:px-10px lt-xl:px-10px lt-xl:px-10px"
  >
    <div class="relative mx-auto h-full flex">
      <div
        :class="`${prefixCls}__left flex-1 bg-gray-500 bg-opacity-20 relative p-30px lt-xl:hidden overflow-x-hidden overflow-y-auto`"
      >
        <!-- 左上角的 logo + 系统标题 -->
        <div class="relative flex items-center text-white">
          <img alt="" class="mr-10px h-48px w-48px" src="@/assets/imgs/logo.png" />
          <span class="text-20px font-bold">{{ underlineToHump(appStore.getTitle) }}</span>
        </div>
        <!-- 左边的背景图 + 欢迎语 -->
        <div class="h-[calc(100%-60px)] flex items-center justify-center">
          <TransitionGroup
            appear
            enter-active-class="animate__animated animate__bounceInLeft"
            tag="div"
            class="text-center"
          >
            <img key="1" alt="" class="w-350px mb-8 animate-float" src="@/assets/svgs/login-box-bg.svg" />
            <div key="2" class="text-3xl text-white font-bold mb-4">
              <span class="dynamic-text">{{ currentSlogan }}</span>
            </div>
            <div key="3" class="text-16px font-normal text-white/80 mb-8">
              智造定制 · 引领个性化产品新未来
            </div>
            <!-- 信任标识 -->
            <div key="4" class="flex justify-center items-center gap-6 mt-4">
              <div class="trust-badge flex items-center bg-white/10 rounded-full px-6 py-3">
                <i class="el-icon-box mr-2"></i>
                <span>多品类定制</span>
              </div>
              <div class="trust-badge flex items-center bg-white/10 rounded-full px-6 py-3">
                <i class="el-icon-shopping-cart-full mr-2"></i>
                <span>智能订单管理</span>
              </div>
            </div>
          </TransitionGroup>
        </div>
      </div>
      <div
        class="relative flex-1 p-30px lt-sm:p-10px overflow-x-hidden overflow-y-auto login-right-panel"
      >
        <!-- 右上角的主题、语言选择 -->
        <div
          class="flex items-center justify-between at-2xl:justify-end at-xl:justify-end header-actions"
          style="color: var(--el-text-color-primary);"
        >
          <div class="flex items-center at-2xl:hidden at-xl:hidden">
            <img alt="" class="mr-10px h-48px w-48px" src="@/assets/imgs/logo.png" />
            <span class="text-20px font-bold">{{ underlineToHump(appStore.getTitle) }}</span>
          </div>
          <div class="flex items-center justify-end space-x-10px h-48px">
            <ThemeSwitch />
            <LocaleDropdown />
          </div>
        </div>
        <!-- 右边的登录界面 -->
        <Transition appear enter-active-class="animate__animated animate__bounceInRight">
          <div class="login-container m-auto h-[calc(100%-60px)] w-[100%] flex items-center at-2xl:max-w-500px at-lg:max-w-500px at-md:max-w-500px at-xl:max-w-500px">
            <LoginForm class="m-auto h-auto p-30px lt-xl:(rounded-3xl) login-box" />
            <MobileForm class="m-auto h-auto p-30px lt-xl:(rounded-3xl) login-box" />
            <QrCodeForm class="m-auto h-auto p-30px lt-xl:(rounded-3xl) login-box" />
            <RegisterForm class="m-auto h-auto p-30px lt-xl:(rounded-3xl) login-box" />
            <SSOLoginVue class="m-auto h-auto p-30px lt-xl:(rounded-3xl) login-box" />
            <ForgetPasswordForm class="m-auto h-auto p-30px lt-xl:(rounded-3xl) login-box" />
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { underlineToHump } from '@/utils'

import { useDesign } from '@/hooks/web/useDesign'
import { useAppStore } from '@/store/modules/app'
import { ThemeSwitch } from '@/layout/components/ThemeSwitch'
import { LocaleDropdown } from '@/layout/components/LocaleDropdown'

import { LoginForm, MobileForm, QrCodeForm, RegisterForm, SSOLoginVue, ForgetPasswordForm } from './components'
import { ref, onMounted, onUnmounted } from 'vue'

defineOptions({ name: 'Login' })

const { t } = useI18n()
const appStore = useAppStore()
const { getPrefixCls } = useDesign()
const prefixCls = getPrefixCls('login')
// 动态标语列表
const slogans = [
  '一站式定制管理 | 智能订单处理',
  '多店铺运营 | 高效生产协同',
  '个性化定制 | 智能化管理'
]
const currentSlogan = ref(slogans[0])
let sloganInterval: ReturnType<typeof setInterval>

// 循环切换标语
const startSloganRotation = () => {
  let index = 0
  sloganInterval = setInterval(() => {
    index = (index + 1) % slogans.length
    currentSlogan.value = slogans[index]
  }, 3000)
}

onMounted(() => {
  startSloganRotation()
})

onUnmounted(() => {
  if (sloganInterval) {
    clearInterval(sloganInterval)
  }
})
</script>

<style lang="scss" scoped>
$prefix-cls: #{$namespace}-login;

.#{$prefix-cls} {
  overflow: auto;

  &__left {
    &::before {
      position: absolute;
      top: 0;
      left: 0;
      z-index: -1;
      width: 100%;
      height: 100%;
      background-image: url('@/assets/svgs/login-bg.svg');
      background-position: center;
      background-repeat: no-repeat;
      content: '';
    }
  }
}

.dynamic-text {
  display: inline-block;
  background: linear-gradient(90deg, rgba(255,255,255,0.9), rgba(255,255,255,1));
  -webkit-background-clip: text;
  color: transparent;
  position: relative;
}

.trust-badge {
  transition: all 0.3s ease;
  backdrop-filter: blur(8px);
  
  i {
    font-size: 18px;
  }
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.animate-float {
  animation: float 6s ease-in-out infinite;
}

.login-right-panel {
  position: relative;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 30% 30%, rgba(var(--el-color-primary-rgb), 0.03), transparent 30%),
      radial-gradient(circle at 70% 70%, rgba(var(--el-color-primary-rgb), 0.03), transparent 30%);
    pointer-events: none;
  }
}

.login-box {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  border-radius: 16px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(var(--el-color-primary-rgb), 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
  }

  :deep(.el-input__wrapper) {
    background-color: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(var(--el-color-primary-rgb), 0.1);
    transition: all 0.3s ease;
    
    &:hover, &.is-focus {
      border-color: var(--el-color-primary);
      background-color: rgba(255, 255, 255, 0.95);
      box-shadow: 0 0 0 1px var(--el-color-primary-light-8);
    }
  }

  :deep(.el-button--primary) {
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
    
    &:hover {
      transform: scale(1.02);
      box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);
    }
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(120deg, 
        rgba(255,255,255,0) 0%,
        rgba(255,255,255,0.2) 50%,
        rgba(255,255,255,0) 100%);
      transform: translateX(-100%);
      transition: transform 0.6s;
    }
    
    &:hover::before {
      transform: translateX(100%);
    }
  }
}

// 暗色模式适配
.dark {
  .login-right-panel {
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.9));
  }

  .login-box {
    background: rgba(0, 0, 0, 0.6);
    border-color: rgba(255, 255, 255, 0.08);

    :deep(.el-input__wrapper) {
      background-color: rgba(0, 0, 0, 0.3);
      border-color: rgba(255, 255, 255, 0.1);
      
      &:hover, &.is-focus {
        background-color: rgba(0, 0, 0, 0.4);
        border-color: var(--el-color-primary);
      }
    }
  }
}

// 移动端适配
@media screen and (max-width: 768px) {
  .login-container {
    width: 90% !important;
  }
  
  .login-box {
    padding: 20px !important;
  }
}
</style>

<style lang="scss">
.dark .login-form {
  .el-divider__text {
    background-color: var(--login-bg-color);
  }

  .el-card {
    background-color: var(--login-bg-color);
  }
}
</style>
