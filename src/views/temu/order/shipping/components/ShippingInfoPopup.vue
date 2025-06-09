<template v-if="dialogVisible">
  <el-drawer
    v-model="dialogVisible"
    title="物流单详情"
    direction="rtl"
    size="80%"
    :before-close="handleClose"
  >
    <div class="shipping-info-container">
      <!-- 物流单基本信息 -->
      <div class="package-info-panel">
        <div class="panel-header">
          <h3>包裹信息</h3>
        </div>
        <div class="panel-content">
          <div class="info-item">
            <span class="label">物流单号</span>
            <span class="value">{{ formData.orders[0]?.trackingNumber || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="label">店铺名称</span>
            <span class="value">{{ formData.orders[0]?.shopName || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="label">创建时间</span>
            <span class="value">{{ formData.orders[0]?.createTime ? formatDate(formData.orders[0].createTime, 'YYYY-MM-DD HH:mm:ss') : '-' }}</span>
          </div>
          <div class="info-item">
            <span class="label">包裹数量</span>
            <span class="value" style="font-weight: bold; color: #409EFF;font-size: 23px;">{{ getTotalPackageCount() }}个</span>
          </div>
          <div class="info-item">
            <span class="label">产品总数</span>
            <span class="value" style="font-weight: bold; color: #67C23A; font-size: 23px;">{{ getTotalProductCount() }}件</span>
          </div>
          <div class="info-item">
            <el-button  plain @click="handlePrintAll">
              打印全部
            </el-button>
            <el-button  plain @click="handlePrint(formData.orders[0].expressOutsideImageUrl)">
              打印加急单
            </el-button>
            
            <el-button  plain @click="handlerPrintBatchExpress">
              打印物流面单
            </el-button>
            <el-button  plain @click="handlerPrintBatchMerged">
              批量打印条码+合规单
            </el-button>
          </div>
        </div>
      </div>

      <!-- 物流单基本信息 -->
      <!-- <div class="info-section">
        <div class="section-header">
          <div class="tracking-info">
            <span class="label">物流单号：</span>
            <span class="value">{{ formData.orders[0]?.trackingNumber || '-' }}</span>
          </div>
          <div class="shop-info">
            <span class="label">店铺名称：</span>
            <span class="value">{{ formData.orders[0]?.shopName || '-' }}</span>
          </div>
          <div class="create-time">
            <span class="label">创建时间：</span>
            <span class="value">{{ formData.orders[0]?.createTime ? formatDate(formData.orders[0].createTime, 'YYYY-MM-DD HH:mm:ss') : '-' }}</span>
          </div>
        </div>
      </div> -->

      <!-- 订单列表 -->
      <div class="order-list">
        <div v-for="(order, index) in formData.orders" :key="index" class="order-item">
          <!-- 订单头部 -->
          <div class="order-header">
            
            <div class="order-basic-info">
              <div class="order-number">
                <span class="label">订单号：</span>
                <span class="value">{{ order.orderNo }}</span>
              </div>
              <div class="order-status">
                <el-tag :type="getOrderStatusType(order.orderStatus)">
                  {{ getOrderStatusText(order.orderStatus) }}
                </el-tag>
              </div>
              <div class="package-tag-wrapper">
                  <div class="tag-label"></div>
                  <el-tag type="info" class="package-tag">分包{{ getPackageTag(order) }}</el-tag>
                  </div>
            </div>
          </div>

          <!-- 订单内容 -->
          <div class="order-content">
            <div class="content-wrapper">
              <!-- 左侧信息 -->
              <div class="info-section">
                <!-- 重要信息 -->
                <div class="important-info">
                  <div class="info-item sku-info">
                    <span class="label">SKU：</span>
                    <span class="value">{{ order.sku || '-' }}</span>
                    <span class="label">SKC：</span>
                    <span class="value">{{ order.skc || '-' }}</span>
                  </div>
                  <div class="info-item custom-sku">
                    <span class="label">定制SKU：</span>
                    <span class="value" style="font-size: 30px;font-weight: bold; color: var(--el-color-primary);">{{ order.customSku || '-' }}</span>
                  </div>
                  <div class="info-item quantity-info">
                    <div class="quantity-group">
                      <span class="label">官网数量：</span>
                      <span class="value">{{ order.originalQuantity || '-' }}</span>
                    </div>
                    <div class="quantity-group">
                      <span class="label">制作数量：</span>
                      <span class="value">{{ order.quantity || '-' }}</span>
                    </div>
                  </div>
                </div>

                <!-- 商品信息 -->
                <div class="product-info">
                  <div class="info-item">
                    <span class="label">标题：</span>
                    <span class="value">{{ order.productTitle || '-' }}</span>
                  </div>
                  <div class="info-item properties">
                    <span class="label">属性：</span>
                    <span class="value">{{ order.productProperties || '-' }}</span>
                  </div>
                </div>

                <!-- 定制信息 -->
                <div class="custom-info" v-if="order.customTextList">
                  <div class="info-item">
                    <span class="label">定制文字：</span>
                    <span class="value">{{ order.customTextList }}</span>
                  </div>
                </div>
                <!-- <div class="package-tag-wrapper">
                  <div class="tag-label">分包</div>
                  <el-tag type="info" class="package-tag">{{ getPackageTag(order) }}</el-tag>
                </div> -->
                <!-- 打印按钮组 -->
                <div class="print-buttons">
                  
                  <el-button plain @click="handlePrint(order.complianceGoodsMergedUrl)">
                    <el-icon><Printer /></el-icon>
                    打印条码+合规单
                  </el-button>
                </div>
              </div>

              <!-- 右侧图片 -->
              <div class="image-section">
                <!-- 定制图片 -->
                <div class="image-group" v-if="order.customImageUrls">
                  <!-- <div class="image-title">定制图片</div> -->
                  <div
                    v-for="(item, index) in order.customImageUrls.split(',')"
                    :key="index"
                    class="image-item"
                    >
                    <el-image
                      :hide-on-click-modal="true"
                      :preview-teleported="true"
                      :src="item"
                      :preview-src-list="[item]"
                      style="width: 300px; height: 300px"
                      fit="cover"
                      loading="lazy"
                      :initial-index="0"
                      :preview="false"
                    />
                  </div>
                  <el-image
                    :hide-on-click-modal="true"
                    :preview-teleported="true"
                    :src="order.effectiveImgUrl"
                    :preview-src-list="[order.effectiveImgUrl]"
                    style="width: 300px; height: 300px"
                    fit="cover"
                    loading="lazy"
                    :initial-index="0"
                    :preview="false"
                  />
                </div>

                <!-- 合成预览图 -->
                <!-- <div class="image-group" v-if="order.effectiveImgUrl">
                  <div class="image-title">合成预览图</div>
                  <el-image
                    :src="order.effectiveImgUrl"
                    :preview-src-list="[order.effectiveImgUrl]"
                    fit="cover"
                    style="width: 300px; height: 300px"
                  />
                </div> -->
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick } from 'vue'
import { formatDate } from '@/utils/formatTime'
import { Printer, Document } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import printJS from 'print-js'
import { PDFDocument } from 'pdf-lib'

const emit = defineEmits(['confirm'])
defineOptions({
  name: 'ShippingInfoPopup'
})

const dialogVisible = ref(false)
const formData = reactive({
  orderId: '',
  remark: '',
  orders: [] as any
})

// 包裹标签映射
const packageTagMap = new Map<string, string>()

const setVisible = (visible: boolean) => {
  dialogVisible.value = visible
  // 当对话框显示时，重置滚动条位置
  if (visible) {
    nextTick(() => {
      const container = document.querySelector('.shipping-info-container')
      if (container) {
        container.scrollTop = 0
      }
    })
  }
}

defineExpose({
  formData,
  setVisible
})

const handleClose = () => {
  dialogVisible.value = false
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
const getOrderStatusText = (status: number) => {
  switch (status) {
    case 0: return '待下单'
    case 1: return '已下单待送产'
    case 2: return '已送产待生产'
    case 3: return '已生产待发货'
    case 4: return '已发货'
    default: return '未知状态'
  }
}

// 获取包裹标签
const getPackageTag = (row: any) => {
  const key = `${row.orderNo}_${row.skc}_${row.sku}`
  if (!packageTagMap.has(key)) {
    const tag = String.fromCharCode(65 + packageTagMap.size % 26) // A, B, C...
    packageTagMap.set(key, tag)
  }
  return packageTagMap.get(key)
}

// 获取包裹数量
const getPackageCount = (row: any) => {
  // 获取同一订单号下的所有订单
  const sameOrderItems = formData.orders.filter(item => item.orderNo === row.orderNo)
  // 使用Set来统计不同的包裹组合
  const uniquePackages = new Set(
    sameOrderItems.map(item => `${item.skc}_${item.sku}`)
  )
  return uniquePackages.size
}

// 获取产品数量
const getProductCount = (row: any) => {
  // 获取同一订单号下的所有订单
  const sameOrderItems = formData.orders.filter(item => item.orderNo === row.orderNo)
  // 累加所有订单的官网数量
  return sameOrderItems.reduce((sum, item) => sum + (item.originalQuantity || 0), 0)
}

// 获取总包裹数量
const getTotalPackageCount = () => {
  const uniquePackages = new Set(
    formData.orders.map(item => `${item.skc}_${item.sku}`)
  )
  return uniquePackages.size
}

// 获取总产品数量
const getTotalProductCount = () => {
  return formData.orders.reduce((sum, item) => sum + (item.originalQuantity || 0), 0)
}


/** 批量打印面单 */
const handlerPrintBatchExpress = async () => {

  try {
    // 获取所有选中的物流单号下的订单
    const allOrders = formData.orders as any[];

    // 检查是否有订单的面单为空
    const ordersWithoutExpress = allOrders.filter(
      (order) => !order.expressImageUrl
    )
    if (ordersWithoutExpress.length > 0) {
      // 按店铺分组并去重SKC
      const groupedByShop = ordersWithoutExpress.reduce((acc, order) => {
        const shopName = order.shopName || '未知店铺'
        if (!acc[shopName]) {
          acc[shopName] = new Set()
        }
        if (order.skc) {
          acc[shopName].add(order.skc)
        }
        return acc
      }, {} as Record<string, Set<string>>)

      const missingInfo = Object.entries(groupedByShop)
        .map(
          ([shopName, skcs]) => `
          <div style="margin-bottom: 16px;">
            <div style="color: #606266; font-weight: bold; margin-bottom: 8px;">${shopName}</div>
            <div style="padding-left: 16px;">
              ${Array.from(skcs)
                .map(
                  (skc) => `
                <div style="color: #409EFF; margin-bottom: 4px;">
                  ${skc}
                </div>
              `
                )
                .join('')}
            </div>
          </div>
        `
        )
        .join('')

      ElNotification({
        title: '无法批量打印',
        message: `
          <div style="margin-bottom: 10px; color: #303133;">以下SKC缺少面单，请联系相关人员及时补充：</div>
          <div style="max-height: 300px; overflow-y: auto; padding-right: 10px;">${missingInfo}</div>
        `,
        type: 'warning',
        duration: 0,
        dangerouslyUseHTMLString: true,
        offset: 60
      })
      return
    }

    // 创建一个新的PDF文档
    const mergedPdf = await PDFDocument.create()
    let successCount = 0
    let failCount = 0

    // 获取唯一的订单号及其对应的面单URL
    const uniqueOrderNos = new Map<string, string>()
    allOrders.forEach(order => {
      if (order.orderNo && order.expressImageUrl && !uniqueOrderNos.has(order.orderNo)) {
        uniqueOrderNos.set(order.orderNo, order.expressImageUrl)
      }
    })

    // 加载并合并所有PDF文件
    for (const [_, url] of uniqueOrderNos) {
      const printUrl = url.startsWith('@') ? url.substring(1) : url
      try {
        if (printUrl.toLowerCase().endsWith('.pdf')) {
          const response = await fetch(printUrl)
          if (!response.ok) {
            console.error(`加载PDF失败: ${printUrl}`)
            failCount++
            continue
          }
          const pdfBytes = await response.arrayBuffer()
          const pdf = await PDFDocument.load(pdfBytes)
          const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
          copiedPages.forEach((page) => {
            mergedPdf.addPage(page)
          })
          successCount++
        } else {
          // 如果是图片，直接使用print-js打印
          printJS({
            printable: printUrl,
            type: 'image',
            showModal: true
          })
          successCount++
        }
      } catch (error) {
        console.error(`加载文件失败: ${printUrl}`, error)
        failCount++
      }
    }

    // 如果有PDF文件，打印合并后的PDF
    if (mergedPdf.getPageCount() > 0) {
      const mergedPdfBytes = await mergedPdf.save()
      const mergedPdfBlob = new Blob([mergedPdfBytes], { type: 'application/pdf' })
      const mergedPdfUrl = URL.createObjectURL(mergedPdfBlob)

      printJS({
        printable: mergedPdfUrl,
        type: 'pdf',
        showModal: true
      })

      // 清理资源
      setTimeout(() => {
        URL.revokeObjectURL(mergedPdfUrl)
      }, 10000)
    }

    // 显示处理结果
    if (failCount > 0) {
      ElMessage.warning(`成功处理${successCount}个订单，${failCount}个订单处理失败`)
    } else {
      ElMessage.success(`成功处理${successCount}个订单`)
    }
  } catch (error) {
    console.error('批量打印面单失败:', error)
    ElMessage.error(
      '批量打印面单失败：' + (error instanceof Error ? error.message : '未知错误')
    )
  }
}

// 打印条码+合规单
const handlePrint = async (url: string) => {
  // const url = order.complianceGoodsMergedUrl;
  // 检查URL是否存在
  if (!url) {
    ElMessage.error('打印失败：未找到打印文件')
    return
  }

  // 处理URL中的@前缀
  const printUrl = url.startsWith('@') ? url.substring(1) : url

  try {
    // 判断是否为PDF文件
    const isPDF = printUrl.toLowerCase().endsWith('.pdf')

    if (isPDF) {
      // PDF文件直接使用print-js打印
      printJS({
        printable: printUrl,
        type: 'pdf',
        showModal: true
      })
    } else {
      // 图片文件使用print-js的image类型打印
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

// 添加打印全部功能
const handlePrintAll = async () => {
  try {
    // 获取所有订单
    const allOrders = formData.orders as any[];
    
    // 按订单号分组
    const orderGroups = new Map<string, any[]>();
    allOrders.forEach(order => {
      if (!orderGroups.has(order.orderNo)) {
        orderGroups.set(order.orderNo, []);
      }
      orderGroups.get(order.orderNo)?.push(order);
    });

    // 创建一个新的PDF文档
    const mergedPdf = await PDFDocument.create();
    let successCount = 0;
    let failCount = 0;

    // 首先处理加急单（只打印一次）
    if (allOrders[0]?.expressOutsideImageUrl) {
      const urgentUrl = allOrders[0].expressOutsideImageUrl.startsWith('@') 
        ? allOrders[0].expressOutsideImageUrl.substring(1) 
        : allOrders[0].expressOutsideImageUrl;
      await addPdfToMerged(mergedPdf, urgentUrl);
    }

    // 遍历每个订单组
    for (const [orderNo, orders] of orderGroups) {
      try {
        // 打印物流面单（如果存在）
        if (orders[0].expressImageUrl) {
          const expressUrl = orders[0].expressImageUrl.startsWith('@')
            ? orders[0].expressImageUrl.substring(1)
            : orders[0].expressImageUrl;
          await addPdfToMerged(mergedPdf, expressUrl);
        }

        // 打印条码+合规单（根据官网数量打印）
        for (const order of orders) {
          if (order.complianceGoodsMergedUrl) {
            const mergedUrl = order.complianceGoodsMergedUrl.startsWith('@')
              ? order.complianceGoodsMergedUrl.substring(1)
              : order.complianceGoodsMergedUrl;
            
            // 根据官网数量复制对应份数
            const copies = order.originalQuantity || 1;
            for (let i = 0; i < copies; i++) {
              await addPdfToMerged(mergedPdf, mergedUrl);
            }
          }
        }
        successCount++;
      } catch (error) {
        console.error(`处理订单 ${orderNo} 失败:`, error);
        failCount++;
      }
    }

    // 如果有成功合并的PDF，则打印
    if (mergedPdf.getPageCount() > 0) {
      const mergedPdfBytes = await mergedPdf.save();
      const mergedPdfBlob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const mergedPdfUrl = URL.createObjectURL(mergedPdfBlob);

      printJS({
        printable: mergedPdfUrl,
        type: 'pdf',
        showModal: true
      });

      // 清理资源
      setTimeout(() => {
        URL.revokeObjectURL(mergedPdfUrl);
      }, 10000);
    }

    // 显示处理结果
    if (failCount > 0) {
      ElMessage.warning(`成功处理${successCount}个订单，${failCount}个订单处理失败`);
    } else {
      ElMessage.success(`成功处理${successCount}个订单`);
    }
  } catch (error) {
    console.error('打印全部失败:', error);
    ElMessage.error('打印全部失败：' + (error instanceof Error ? error.message : '未知错误'));
  }
};

// 添加辅助函数用于将PDF添加到合并文档中
const addPdfToMerged = async (mergedPdf: PDFDocument, url: string) => {
  try {
    if (url.toLowerCase().endsWith('.pdf')) {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`加载PDF失败: ${url}`);
      }
      const pdfBytes = await response.arrayBuffer();
      const pdf = await PDFDocument.load(pdfBytes);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => {
        mergedPdf.addPage(page);
      });
    } else {
      // 如果是图片，直接使用print-js打印
      printJS({
        printable: url,
        type: 'image',
        showModal: true
      });
    }
  } catch (error) {
    throw new Error(`处理文件失败: ${url}`);
  }
};

// 添加批量打印条码+合规单功能
const handlerPrintBatchMerged = async () => {
  try {
    // 获取所有订单
    const allOrders = formData.orders as any[]

    // 检查是否有订单的合并文件为空
    const ordersWithoutMerged = allOrders.filter(
      (order) => !order.complianceGoodsMergedUrl
    )
    if (ordersWithoutMerged.length > 0) {
      // 按店铺分组并去重SKC
      const groupedByShop = ordersWithoutMerged.reduce((acc, order) => {
        const shopName = order.shopName || '未知店铺'
        if (!acc[shopName]) {
          acc[shopName] = new Set()
        }
        if (order.skc) {
          acc[shopName].add(order.skc)
        }
        return acc
      }, {} as Record<string, Set<string>>)

      const missingInfo = Object.entries(groupedByShop)
        .map(
          ([shopName, skcs]) => `
          <div style="margin-bottom: 16px;">
            <div style="color: #606266; font-weight: bold; margin-bottom: 8px;">${shopName}</div>
            <div style="padding-left: 16px;">
              ${Array.from(skcs)
                .map(
                  (skc) => `
                <div style="color: #409EFF; margin-bottom: 4px;">
                  ${skc}
                </div>
              `
                )
                .join('')}
            </div>
          </div>
        `
        )
        .join('')

      ElNotification({
        title: '无法批量打印',
        message: `
          <div style="margin-bottom: 10px; color: #303133;">以下SKC缺少合并文件，请联系相关人员及时补充：</div>
          <div style="max-height: 300px; overflow-y: auto; padding-right: 10px;">${missingInfo}</div>
        `,
        type: 'warning',
        duration: 0,
        dangerouslyUseHTMLString: true,
        offset: 60
      })
      return
    }

    // 创建一个新的PDF文档
    const mergedPdf = await PDFDocument.create()
    let successCount = 0
    let failCount = 0

    // 加载并合并所有PDF文件
    for (const order of allOrders) {
      if (!order.complianceGoodsMergedUrl) continue
      const url = order.complianceGoodsMergedUrl.startsWith('@')
        ? order.complianceGoodsMergedUrl.substring(1)
        : order.complianceGoodsMergedUrl
      try {
        const response = await fetch(url)
        if (!response.ok) {
          console.error(`加载PDF失败: ${url}`)
          failCount++
          continue
        }
        const pdfBytes = await response.arrayBuffer()
        const pdf = await PDFDocument.load(pdfBytes)
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
        
        // 根据官网数量复制对应份数
        const copies = order.originalQuantity || 1
        for (let i = 0; i < copies; i++) {
          copiedPages.forEach((page) => {
            mergedPdf.addPage(page)
          })
        }
        successCount++
      } catch (error) {
        console.error(`加载PDF失败: ${url}`, error)
        failCount++
      }
    }

    if (mergedPdf.getPageCount() === 0) {
      ElMessage.error('没有可打印的合并文件PDF')
      return
    }

    // 保存合并后的PDF
    const mergedPdfBytes = await mergedPdf.save()
    const mergedPdfBlob = new Blob([mergedPdfBytes], { type: 'application/pdf' })
    const mergedPdfUrl = URL.createObjectURL(mergedPdfBlob)

    // 使用print-js打印PDF
    printJS({
      printable: mergedPdfUrl,
      type: 'pdf',
      showModal: true,
      onLoadingEnd: () => {
        // 清理资源
        URL.revokeObjectURL(mergedPdfUrl)
      }
    })

    // 显示处理结果
    if (failCount > 0) {
      ElMessage.warning(`成功处理${successCount}个订单，${failCount}个订单处理失败`)
    } else {
      ElMessage.success(`成功处理${successCount}个订单`)
    }
  } catch (error) {
    console.error('批量打印合并文件失败:', error)
    ElMessage.error(
      '批量打印合并文件失败：' + (error instanceof Error ? error.message : '未知错误')
    )
  }
}
</script>

<style lang="scss" scoped>
.shipping-info-container {
  padding: 24px;
  background-color: var(--el-bg-color);
  height: 100%;
  overflow-y: auto;
  position: relative;

  .package-info-panel {
    position: fixed;
    bottom: 0;
    right: 0;
    width: 100%;
    background-color: var(--el-bg-color-overlay);
    box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.08);
    z-index: 100;
    border-top: 1px solid var(--el-border-color-lighter);

    .panel-header {
      display: none; // 隐藏标题
    }

    .panel-content {
      padding: 20px 40px;
      display: flex;
      justify-content: flex-start;
      align-items: center;
      width: 100%;
      margin: 0;
      gap: 32px;
      overflow-x: auto;
      white-space: nowrap;
      scrollbar-width: none;  /* Firefox */
      -ms-overflow-style: none;  /* IE and Edge */
      &::-webkit-scrollbar {
        display: none;  /* Chrome, Safari, Opera */
      }

      .info-item {
        margin: 0;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 24px;
        background: var(--el-fill-color-light);
        border-radius: 8px;
        transition: all 0.3s ease;
        min-width: 280px;
        flex-shrink: 0;

        &:hover {
          background: var(--el-fill-color);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .label {
          font-size: 15px;
          color: var(--el-text-color-secondary);
          font-weight: 500;
          white-space: nowrap;
        }

        .value {
          font-size: 16px;
          color: var(--el-text-color-primary);
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 300px;
        }

        &:last-child {
          margin-left: auto;
          background: none;
          padding: 0;
          min-width: auto;
          flex-shrink: 0;

          &:hover {
            background: none;
            transform: none;
            box-shadow: none;
          }

          .el-button {
            font-size: 15px;
            padding: 12px 24px;
            height: auto;
            border-radius: 8px;
            transition: all 0.3s ease;
            white-space: nowrap;
            
            &:hover {
              transform: translateY(-2px);
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
            
            .el-icon {
              font-size: 16px;
              margin-right: 6px;
            }
          }
        }
      }
    }
  }

  .info-section {
    margin: 24px 0 120px;
    background-color: var(--el-bg-color-overlay);
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);

    .section-header {
      display: flex;
      gap: 32px;
      align-items: center;
      font-size: 14px;

      .label {
        color: var(--el-text-color-secondary);
        margin-right: 8px;
      }

      .value {
        color: var(--el-text-color-primary);
        font-weight: 500;
      }
    }
  }

  .package-tag-wrapper {
    text-align: center;
    margin-bottom: 20px;
    
    .tag-label {
      font-size: 16px;
      color: #d9001b;
      font-weight: 600;
      margin-bottom: 8px;
      letter-spacing: 2px;
    }
    
    .package-tag {
      font-size: 36px;
      font-weight: 600;
      padding: 12px 36px;
      height: auto;
      line-height: 1.1;
      background: linear-gradient(135deg, #fffbe6 0%, #ffeaea 100%);
      color: #0070d9;
      border: 2px solid #0070d9;
      border-radius: 12px;
      display: inline-block;
      letter-spacing: 10px;
      box-shadow: 0 4px 20px rgba(217, 0, 27, 0.15);
      margin-bottom: 8px;
      text-shadow: 1px 1px 6px #fff, 0 1px 6px rgba(217, 0, 27, 0.2);
      transition: all 0.3s ease;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 24px rgba(217, 0, 27, 0.2);
      }
    }
  }

  .order-list {
    .order-item {
      background-color: var(--el-bg-color-overlay);
      border-radius: 12px;
      margin-bottom: 24px;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      }

      .order-header {
        background-color: var(--el-fill-color-light);
        padding: 16px 24px;
        border-bottom: 1px solid var(--el-border-color-lighter);

        .order-basic-info {
          display: flex;
          align-items: center;
          gap: 32px;
          font-size: 14px;

          .order-number {
            .label {
              color: var(--el-text-color-secondary);
              margin-right: 8px;
              font-size: 16px;
            }

            .value {
              color: var(--el-color-primary);
              font-weight: 600;
              font-size: 20px;
            }
          }

          .order-status {
            :deep(.el-tag) {
              font-size: 16px;
              padding: 8px 16px;
              font-weight: 600;
              border-radius: 8px;
            }
          }
        }
      }

      .order-content {
        padding: 24px;

        .content-wrapper {
          display: flex;
          gap: 32px;

          .info-section {
            flex: 0 0 35%;
            margin: 0;
            padding: 0;

            .important-info {
              margin-bottom: 24px;
              padding: 20px;
              background-color: var(--el-fill-color-light);
              border-radius: 12px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

              .info-item {
                margin-bottom: 24px;
                display: flex;
                flex-direction: column;
                gap: 8px;

                &:last-child {
                  margin-bottom: 0;
                }

                .label {
                  font-size: 14px;
                  font-weight: 500;
                  color: var(--el-text-color-secondary);
                }

                .value {
                  font-size: 16px;
                  font-weight: 600;
                  color: var(--el-text-color-primary);
                }

                &.sku-info {
                  display: flex;
                  flex-direction: row;
                  align-items: center;
                  gap: 24px;
                }

                &.quantity-info {
                  display: flex;
                  flex-direction: row;
                  align-items: center;
                  gap: 24px;
                  margin-bottom: 0;

                  .quantity-group {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                  }

                  .value {
                    font-size: 20px;
                    font-weight: 600;
                    color: var(--el-color-success);
                  }
                }
              }
            }

            .product-info {
              margin-bottom: 24px;
              padding: 20px;
              background-color: var(--el-fill-color-light);
              border-radius: 12px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

              .info-item {
                margin-bottom: 16px;
                display: flex;
                flex-direction: column;
                gap: 8px;

                &:last-child {
                  margin-bottom: 0;
                }

                .label {
                  font-size: 14px;
                  font-weight: 500;
                  color: var(--el-text-color-secondary);
                }

                .value {
                  font-size: 15px;
                  color: var(--el-text-color-primary);
                  line-height: 1.5;
                }
              }
            }

            .custom-info {
              padding: 20px;
              background-color: var(--el-fill-color-light);
              border-radius: 12px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

              .info-item {
                display: flex;
                flex-direction: column;
                gap: 8px;

                .label {
                  font-size: 14px;
                  font-weight: 500;
                  color: var(--el-text-color-secondary);
                }

                .value {
                  font-size: 15px;
                  color: var(--el-text-color-primary);
                  line-height: 1.5;
                }
              }
            }

            .print-buttons {
              margin-top: 24px;
              display: flex;
              flex-direction: column;
              gap: 12px;

              .el-button {
                width: 100%;
                justify-content: center;
                border-radius: 8px;
                transition: all 0.3s ease;
                
                &:hover {
                  transform: translateY(-2px);
                  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }
                
                .el-icon {
                  margin-right: 8px;
                }
              }
            }
          }

          .image-section {
            flex: 0 0 65%;
            display: flex;
            flex-direction: column;
            gap: 32px;

            .image-group {
              display: flex;
              flex-flow: row wrap;
              gap: 24px;
              padding: 20px;
              background-color: var(--el-fill-color-light);
              border-radius: 12px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

              :deep(.el-image) {
                width: 300px;
                height: 300px;
                background-color: #fff;
                border-radius: 8px;
                padding: 12px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
                transition: all 0.3s ease;

                &:hover {
                  transform: translateY(-2px);
                  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                }
              }
            }
          }
        }
      }
    }
  }
}
</style>
