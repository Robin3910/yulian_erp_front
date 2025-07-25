<script lang="ts" setup>
import { ElMessage } from 'element-plus'
import { useClipboard, useCssVar } from '@vueuse/core'

import { CACHE_KEY, useCache } from '@/hooks/web/useCache'
import { useDesign } from '@/hooks/web/useDesign'

import { setCssVar, trim } from '@/utils'
import { colorIsDark, hexToRGB, lighten } from '@/utils/color'
import { useAppStore } from '@/store/modules/app'
import { ThemeSwitch } from '@/layout/components/ThemeSwitch'
import ColorRadioPicker from './components/ColorRadioPicker.vue'
import InterfaceDisplay from './components/InterfaceDisplay.vue'
import LayoutRadioPicker from './components/LayoutRadioPicker.vue'
import { useRouter } from 'vue-router'

defineOptions({ name: 'Setting' })

const { t } = useI18n()
const appStore = useAppStore()
const router = useRouter()
const { getPrefixCls } = useDesign()
const prefixCls = getPrefixCls('setting')
const layout = computed(() => appStore.getLayout)
const drawer = ref(false)

// 主题色相关
const systemTheme = ref(appStore.getTheme.elColorPrimary)

const setSystemTheme = (color: string) => {
  setCssVar('--el-color-primary', color)
  appStore.setTheme({ elColorPrimary: color })
  const leftMenuBgColor = useCssVar('--left-menu-bg-color', document.documentElement)
  setMenuTheme(trim(unref(leftMenuBgColor)))
}

// 头部主题相关
const headerTheme = ref(appStore.getTheme.topHeaderBgColor || '')

const setHeaderTheme = (color: string) => {
  const isDarkColor = colorIsDark(color)
  const textColor = isDarkColor ? '#fff' : 'inherit'
  const textHoverColor = isDarkColor ? lighten(color!, 6) : '#f6f6f6'
  const topToolBorderColor = isDarkColor ? color : '#eee'
  setCssVar('--top-header-bg-color', color)
  setCssVar('--top-header-text-color', textColor)
  setCssVar('--top-header-hover-color', textHoverColor)
  appStore.setTheme({
    topHeaderBgColor: color,
    topHeaderTextColor: textColor,
    topHeaderHoverColor: textHoverColor,
    topToolBorderColor
  })
  if (unref(layout) === 'top') {
    setMenuTheme(color)
  }
}

// 菜单主题相关
const menuTheme = ref(appStore.getTheme.leftMenuBgColor || '')

const setMenuTheme = (color: string) => {
  const primaryColor = useCssVar('--el-color-primary', document.documentElement)
  const isDarkColor = colorIsDark(color)
  const theme: Recordable = {
    // 左侧菜单边框颜色
    leftMenuBorderColor: isDarkColor ? 'inherit' : '#eee',
    // 左侧菜单背景颜色
    leftMenuBgColor: color,
    // 左侧菜单浅色背景颜色
    leftMenuBgLightColor: isDarkColor ? lighten(color!, 6) : color,
    // 左侧菜单选中背景颜色
    leftMenuBgActiveColor: isDarkColor
      ? 'var(--el-color-primary)'
      : hexToRGB(unref(primaryColor), 0.1),
    // 左侧菜单收起选中背景颜色
    leftMenuCollapseBgActiveColor: isDarkColor
      ? 'var(--el-color-primary)'
      : hexToRGB(unref(primaryColor), 0.1),
    // 左侧菜单字体颜色
    leftMenuTextColor: isDarkColor ? '#bfcbd9' : '#333',
    // 左侧菜单选中字体颜色
    leftMenuTextActiveColor: isDarkColor ? '#fff' : 'var(--el-color-primary)',
    // logo字体颜色
    logoTitleTextColor: isDarkColor ? '#fff' : 'inherit',
    // logo边框颜色
    logoBorderColor: isDarkColor ? color : '#eee'
  }
  appStore.setTheme(theme)
  appStore.setCssVarTheme()
}
if (layout.value === 'top' && !appStore.getIsDark) {
  headerTheme.value = '#fff'
  setHeaderTheme('#fff')
}

// 监听layout变化，重置一些主题色
watch(
  () => layout.value,
  (n) => {
    if (n === 'top' && !appStore.getIsDark) {
      headerTheme.value = '#fff'
      setHeaderTheme('#fff')
    } else {
      setMenuTheme(unref(menuTheme))
    }
  }
)

// 拷贝
const copyConfig = async () => {
  const { copy, copied, isSupported } = useClipboard({
    source: `
      // 面包屑
      breadcrumb: ${appStore.getBreadcrumb},
      // 面包屑图标
      breadcrumbIcon: ${appStore.getBreadcrumbIcon},
      // 折叠图标
      hamburger: ${appStore.getHamburger},
      // 全屏图标
      screenfull: ${appStore.getScreenfull},
      // 尺寸图标
      size: ${appStore.getSize},
      // 多语言图标
      locale: ${appStore.getLocale},
      // 消息图标
      message: ${appStore.getMessage},
      // 标签页
      tagsView: ${appStore.getTagsView},
      // 标签页
      tagsViewImmerse: ${appStore.getTagsViewImmerse},
      // 标签页图标
      tagsViewIcon: ${appStore.getTagsViewIcon},
      // logo
      logo: ${appStore.getLogo},
      // 菜单手风琴
      uniqueOpened: ${appStore.getUniqueOpened},
      // 固定header
      fixedHeader: ${appStore.getFixedHeader},
      // 页脚
      footer: ${appStore.getFooter},
      // 灰色模式
      greyMode: ${appStore.getGreyMode},
      // layout布局
      layout: '${appStore.getLayout}',
      // 暗黑模式
      isDark: ${appStore.getIsDark},
      // 组件尺寸
      currentSize: '${appStore.getCurrentSize}',
      // 主题相关
      theme: {
        // 主题色
        elColorPrimary: '${appStore.getTheme.elColorPrimary}',
        // 左侧菜单边框颜色
        leftMenuBorderColor: '${appStore.getTheme.leftMenuBorderColor}',
        // 左侧菜单背景颜色
        leftMenuBgColor: '${appStore.getTheme.leftMenuBgColor}',
        // 左侧菜单浅色背景颜色
        leftMenuBgLightColor: '${appStore.getTheme.leftMenuBgLightColor}',
        // 左侧菜单选中背景颜色
        leftMenuBgActiveColor: '${appStore.getTheme.leftMenuBgActiveColor}',
        // 左侧菜单收起选中背景颜色
        leftMenuCollapseBgActiveColor: '${appStore.getTheme.leftMenuCollapseBgActiveColor}',
        // 左侧菜单字体颜色
        leftMenuTextColor: '${appStore.getTheme.leftMenuTextColor}',
        // 左侧菜单选中字体颜色
        leftMenuTextActiveColor: '${appStore.getTheme.leftMenuTextActiveColor}',
        // logo字体颜色
        logoTitleTextColor: '${appStore.getTheme.logoTitleTextColor}',
        // logo边框颜色
        logoBorderColor: '${appStore.getTheme.logoBorderColor}',
        // 头部背景颜色
        topHeaderBgColor: '${appStore.getTheme.topHeaderBgColor}',
        // 头部字体颜色
        topHeaderTextColor: '${appStore.getTheme.topHeaderTextColor}',
        // 头部悬停颜色
        topHeaderHoverColor: '${appStore.getTheme.topHeaderHoverColor}',
        // 头部边框颜色
        topToolBorderColor: '${appStore.getTheme.topToolBorderColor}'
      }
    `
  })
  if (!isSupported) {
    ElMessage.error(t('setting.copyFailed'))
  } else {
    await copy()
    if (unref(copied)) {
      ElMessage.success(t('setting.copySuccess'))
    }
  }
}

// 清空缓存
const clear = () => {
  const { wsCache } = useCache()
  wsCache.delete(CACHE_KEY.LAYOUT)
  wsCache.delete(CACHE_KEY.THEME)
  wsCache.delete(CACHE_KEY.IS_DARK)
  wsCache.delete(CACHE_KEY.USER)
  wsCache.delete(CACHE_KEY.ROLE_ROUTERS)
  window.location.reload()
}

// 跳转到条码识别页面
const goToBarcodeScan = () => {
  const currentRoute = router.currentRoute.value
  const targetPath = '/temu/admin/barcode/phone'
  
  // 如果当前已经在条码识别页面，则直接触发相机启动
  if (currentRoute.path === targetPath) {
    // 触发全局事件来启动相机
    window.dispatchEvent(new CustomEvent('handleStartCamera'))
  } else {
    // 如果不在条码识别页面，则跳转过
    router.push(`${targetPath}?autoStart=true`)
  }
}

// 跳转到图像识别页面
const goToImgcodeScan = () => {
  const currentRoute = router.currentRoute.value
  const targetPath = '/temu/admin/image/search/phone'
  // 如果当前已经在条码识别页面，则直接触发相机启动
  if (currentRoute.path === targetPath) {
    // 触发全局事件来启动相机
    window.dispatchEvent(new CustomEvent('handleStartCamera'))
  } else {
    // 如果不在条码识别页面，则跳转过去
    router.push(`${targetPath}?autoStart=true`)
  }
}
</script>

<template>
  <div
    :class="prefixCls"
    class="fixed right-0 top-[45%] h-40px w-40px cursor-pointer bg-[var(--el-color-primary)] text-center leading-40px"
    @click="drawer = true"
  >
    <Icon color="#fff" icon="ep:setting" />
  </div>

  <!-- 条码识别按钮 -->
  <div
    class="fixed right-0 top-[calc(45%+60px)] h-40px w-40px cursor-pointer bg-[#67c23a] text-center leading-40px"
    @click="goToBarcodeScan"
  >
    <Icon color="#fff" icon="ep:camera" />
  </div>

  <div
    class="fixed right-0 top-[calc(45%+120px)] h-40px w-40px cursor-pointer bg-[#f5d742] text-center leading-40px "
    @click="goToImgcodeScan"
  >
    <Icon color="#fff" icon="ep:picture" />
  </div>

  <ElDrawer v-model="drawer" :z-index="4000" direction="rtl" size="350px">
    <template #header>
      <span class="text-16px font-700">{{ t('setting.projectSetting') }}</span>
    </template>

    <div class="text-center">
      <!-- 主题 -->
      <ElDivider>{{ t('setting.theme') }}</ElDivider>
      <ThemeSwitch />

      <!-- 布局 -->
      <ElDivider>{{ t('setting.layout') }}</ElDivider>
      <LayoutRadioPicker />

      <!-- 系统主题 -->
      <ElDivider>{{ t('setting.systemTheme') }}</ElDivider>
      <ColorRadioPicker
        v-model="systemTheme"
        :schema="[
          '#409eff',
          '#009688',
          '#536dfe',
          '#ff5c93',
          '#ee4f12',
          '#0096c7',
          '#9c27b0',
          '#ff9800'
        ]"
        @change="setSystemTheme"
      />

      <!-- 头部主题 -->
      <ElDivider>{{ t('setting.headerTheme') }}</ElDivider>
      <ColorRadioPicker
        v-model="headerTheme"
        :schema="[
          '#151515',
          '#fff',
          '#5172dc',
          '#e74c3c',
          '#24292e',
          '#394664',
          '#009688',
          '#383f45'
        ]"
        @change="setHeaderTheme"
      />

      <!-- 菜单主题 -->
      <template v-if="layout !== 'top'">
        <ElDivider>{{ t('setting.menuTheme') }}</ElDivider>
        <ColorRadioPicker
          v-model="menuTheme"
          :schema="[
            '#fff',
            '#001529',
            '#212121',
            '#273352',
            '#191b24',
            '#383f45',
            '#001628',
            '#344058'
          ]"
          @change="setMenuTheme"
        />
      </template>
    </div>

    <!-- 界面显示 -->
    <ElDivider>{{ t('setting.interfaceDisplay') }}</ElDivider>
    <InterfaceDisplay />

    <ElDivider />
    <div>
      <ElButton class="w-full" type="primary" @click="copyConfig">{{ t('setting.copy') }}</ElButton>
    </div>
    <div class="mt-5px">
      <ElButton class="w-full" type="danger" @click="clear">
        {{ t('setting.clearAndReset') }}
      </ElButton>
    </div>
  </ElDrawer>
</template>

<style lang="scss" scoped>
$prefix-cls: #{$namespace}-setting;

.#{$prefix-cls} {
  border-radius: 6px 0 0 6px;
  z-index: 1200;/*修正没有z-index会被表格层覆盖,值不要超过4000*/
}

// 条码识别按钮样式
.fixed.right-0.top-\[calc\(45\%\+60px\)\] {
  border-radius: 6px 0 0 6px;
  z-index: 1200;
}
.fixed.right-0.top-\[calc\(45\%\+120px\)\] {
  border-radius: 6px 0 0 6px;
  z-index: 1200;
}
</style>
