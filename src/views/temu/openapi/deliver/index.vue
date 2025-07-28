<template>
  <div class="delivery-order-table-wrap">
    <!-- 添加隐藏的打印 iframe -->
    <iframe id="printFrame" style="display: none;"></iframe>
    <div class="filter-bar">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="SKC">
          <el-input v-model="filters.productSkcIdList" placeholder="多个以逗号、空格或换行分隔" clearable />
        </el-form-item>
        <el-form-item label="备货单号">
          <el-input v-model="filters.subPurchaseOrderSnList" placeholder="多个以逗号、空格或换行分隔" clearable />
        </el-form-item>
        <el-form-item label="物流单号">
          <el-input v-model="filters.expressDeliverySnList" placeholder="多个以逗号、空格或换行分隔" clearable />
        </el-form-item>
        <el-form-item label="发货时间">
          <el-date-picker
            v-model="filters.deliverTimeRange"
            type="datetimerange"
            range-separator="~"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="x"
            style="width: 320px;"
            @calendar-change="onCalendarChange"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleFilter">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button 
            type="primary" 
            :disabled="selectedRows.length === 0"
            @click="handleBatchPrint"
          >
            批量打印物流面单
          </el-button>
          <el-button 
            type="primary" 
            :disabled="selectedRows.length === 0"
            @click="handleBatchPrintBarcode"
          >
            打印商品条码
          </el-button>
        </el-form-item>
      </el-form>
    </div>
    <!-- 状态Tab区域 -->
    <div class="status-tabs">
      <el-tabs v-model="filters.status" @tab-change="handleFilter">
        <el-tab-pane label="全部" name=""/>
        <el-tab-pane label="待仓库收货" name="1"/>
        <el-tab-pane label="已收货" name="2"/>
      </el-tabs>
    </div>
    <el-table 
      :data="orderList" 
      border 
      stripe 
      style="width: 100%" 
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" fixed />
      <el-table-column prop="deliveryOrderSn" label="发货单号" width="220" fixed>
        <template #default="{ row }">
          <div>{{ row.deliveryOrderSn }}</div>
          <!-- 紧急标识 -->
          <div v-if="row.urgencyType === 1" style="color: red; font-weight: bold;">加急</div>
          <!-- 时间块 -->
          <div class="time-block">
            <div>
              <span>🚚 前发货</span>
              <span>{{ formatTime(addDays(row.purchaseTime, 2)) }}</span>
            </div>
            <div>
              <span>🚚 需到货</span>
              <span>{{ formatTime(addDays(row.purchaseTime, 5)) }}</span>
            </div>
            <div style="color: orange;">
              {{ getCountdown(addDays(row.purchaseTime, 5)) }}后逾期
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="商品信息" min-width="220">
        <template #default="{ row }">
          <div class="product-info-cell">
            <img v-if="row.productSkcPicture" :src="row.productSkcPicture" alt="商品图片" class="product-img" />
            <div class="product-info-text">
              <div>
                备货单号：<b>{{ row.subPurchaseOrderSn }}</b>
              </div>
              <div>SKC：{{ row.productSkcId }}</div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="发货批次" prop="expressBatchSn" min-width="120">
        <template #default="{ row }">
          <span>{{ row.expressBatchSn }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="expressCompany" label="物流信息" min-width="200">
        <template #default="{ row }">
          <div>快递公司：{{ row.expressCompany }}</div>
          <div>快递单号：{{ row.expressDeliverySn }}</div>
          <div v-if="row.expectPickUpGoodsTime">
              预约取货时间：{{ formatTime(row.expectPickUpGoodsTime) }}
    </div>
        </template>
      </el-table-column>
      <el-table-column label="发货信息" min-width="180">
        <template #default="{ row }">
          <div>发货数量：{{ row.purchaseQuantity }}件</div>
          <div>收货仓库：{{ row.subWarehouseName }}</div>
        </template>
      </el-table-column>
      <el-table-column label="包裹号" min-width="180">
        <template #default="{ row }">
          <div v-for="pkg in row.packageList" :key="pkg.packageSn">
            {{ pkg.packageSn }} | {{ pkg.skcNum }}件
          </div>
        </template>
      </el-table-column>
      <el-table-column label="状态" min-width="100">
        <template #default="{ row }">
          <span v-if="row.status === 1">待仓库收货</span>
          <span v-else>{{ row.status }}</span>
        </template>
      </el-table-column>
      <el-table-column label="发货/收货时间" min-width="150">
        <template #default="{ row }">
          <div>发货：{{ formatTime(row.deliverTime) }}</div>
          <div>收货：{{ formatTime(row.receiveTime) }}</div>
        </template>
      </el-table-column>
      <el-table-column label="收货信息" min-width="180">
        <template #default="{ row }">
          <div>{{ row.receiveAddressInfo.receiverName }}，{{ row.receiveAddressInfo.phone }}</div>
          <div>{{ row.receiveAddressInfo.provinceName }}{{ row.receiveAddressInfo.cityName }}{{ row.receiveAddressInfo.districtName }}{{ row.receiveAddressInfo.detailAddress }}</div>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="handlePrint(row)">
            打印物流面单
          </el-button>
          <el-button type="primary" link @click="handleSinglePrintBarcode(row)" style="margin-left: 0px;">
            打印商品条码
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="pagination-wrap">
      <el-pagination
        v-model:current-page="pagination.pageNo"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElLoading } from 'element-plus'
import { TemuCommonApi } from '@/api/temu/common'

const orderList = ref<any[]>([])
const pagination = ref({
  pageNo: 1,
  pageSize: 10,
  total: 0
})
const selectedRows = ref<any[]>([])

// 处理表格选择变化
function handleSelectionChange(selection: any[]) {
  selectedRows.value = selection
}

// 处理批量打印物流面单
async function handleBatchPrint() {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择需要打印的订单')
    return
  }

  const loading = ElLoading.service({
    lock: true,
    text: '正在获取打印数据...',
    background: 'rgba(0, 0, 0, 0.7)'
  })

  try {
    // 获取所有选中行的发货单号
    const deliveryNos = selectedRows.value.map(row => row.deliveryOrderSn)
    const res = await TemuCommonApi.printDeliveryLabel(deliveryNos.join(','))
    // 获取到数据后立即关闭加载提示
    loading.close()
    console.log('打印接口返回数据：', res)
    
    if (res && res.printUrl) {
      console.log('加载打印链接：', res.printUrl)
      
      // 创建一个临时的 iframe
      const printFrame = document.createElement('iframe')
      printFrame.style.display = 'none'
      document.body.appendChild(printFrame)

      // 使用 Promise 来处理 iframe 加载完成
      await new Promise((resolve, reject) => {
        let timeoutId: number | null = null

        const cleanup = () => {
          if (timeoutId) {
            clearTimeout(timeoutId)
          }
          printFrame.onload = null
          printFrame.onerror = null
        }

        // 设置 15 秒超时
        timeoutId = window.setTimeout(() => {
          cleanup()
          document.body.removeChild(printFrame)
          reject(new Error('加载打印页面超时'))
        }, 15000)

        printFrame.onload = () => {
          cleanup()
          // 给页面 1 秒时间初始化
          setTimeout(() => {
            // 等待打印窗口完全关闭后再移除 iframe
            const checkPrintInterval = setInterval(() => {
              try {
                const printWindow = printFrame.contentWindow
                if (!printWindow || printWindow.closed) {
                  clearInterval(checkPrintInterval)
                  document.body.removeChild(printFrame)
                  resolve(true)
                }
              } catch (e) {
                clearInterval(checkPrintInterval)
                document.body.removeChild(printFrame)
                resolve(true)
              }
            }, 1000)
          }, 1000)
        }

        printFrame.onerror = () => {
          cleanup()
          document.body.removeChild(printFrame)
          reject(new Error('加载打印页面失败'))
        }

        printFrame.src = res.printUrl
      })
    } else {
      console.log('打印失败，返回数据：', res)
      ElMessage.error('获取打印链接失败')
    }
  } catch (error: any) {
    loading.close()
    console.error('打印出错：', error)
    ElMessage.error('打印失败：' + (error.message || '未知错误'))
  }
}

// 处理单个打印物流面单
async function handlePrint(row: any) {
  if (!row.deliveryOrderSn) {
    ElMessage.warning('该订单没有发货单号')
    return
  }

  const loading = ElLoading.service({
    lock: true,
    text: '正在获取打印数据...',
    background: 'rgba(0, 0, 0, 0.7)'
  })

  try {
    const res = await TemuCommonApi.printDeliveryLabel(row.deliveryOrderSn)
    // 获取到数据后立即关闭加载提示
    loading.close()
    console.log('打印接口返回数据：', res)
    
    if (res && res.printUrl) {
      console.log('加载打印链接：', res.printUrl)
      
      // 创建一个临时的 iframe
      const printFrame = document.createElement('iframe')
      printFrame.style.display = 'none'
      document.body.appendChild(printFrame)

      // 使用 Promise 来处理 iframe 加载完成
      await new Promise((resolve, reject) => {
        let timeoutId: number | null = null

        const cleanup = () => {
          if (timeoutId) {
            clearTimeout(timeoutId)
          }
          printFrame.onload = null
          printFrame.onerror = null
        }

        // 设置 15 秒超时
        timeoutId = window.setTimeout(() => {
          cleanup()
          document.body.removeChild(printFrame)
          reject(new Error('加载打印页面超时'))
        }, 15000)

        printFrame.onload = () => {
          cleanup()
          // 给页面 1 秒时间初始化
          setTimeout(() => {
            // 等待打印窗口完全关闭后再移除 iframe
            const checkPrintInterval = setInterval(() => {
              try {
                const printWindow = printFrame.contentWindow
                if (!printWindow || printWindow.closed) {
                  clearInterval(checkPrintInterval)
                  document.body.removeChild(printFrame)
                  resolve(true)
                }
              } catch (e) {
                clearInterval(checkPrintInterval)
                document.body.removeChild(printFrame)
                resolve(true)
              }
            }, 1000)
          }, 1000)
        }

        printFrame.onerror = () => {
          cleanup()
          document.body.removeChild(printFrame)
          reject(new Error('加载打印页面失败'))
        }

        printFrame.src = res.printUrl
      })
    } else {
      console.log('打印失败，返回数据：', res)
      ElMessage.error('获取打印链接失败')
    }
  } catch (error: any) {
    loading.close()
    console.error('打印出错：', error)
    ElMessage.error('打印失败：' + (error.message || '未知错误'))
  }
}

// 处理打印商品条码
async function handlePrintBarcode() {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择需要打印的订单')
    return
  }

  const loading = ElLoading.service({
    lock: true,
    text: '正在获取打印数据...',
    background: 'rgba(0, 0, 0, 0.7)'
  })
  
  try {
    // 收集所有选中行的商品信息
    const packageDetailList: Array<{
      productSkuId: number;
      skuNum: number;
    }> = []

    // 遍历选中的行
    selectedRows.value.forEach(row => {
      // 检查是否有包裹信息
      if (row.packageList && Array.isArray(row.packageList)) {
        row.packageList.forEach((pkg: any) => {
          // 如果有 SKC 信息，添加到列表中
          if (pkg.productSkcId && pkg.skcNum) {
            packageDetailList.push({
              productSkuId: Number(pkg.productSkcId),
              skuNum: Number(pkg.skcNum)
            })
          }
        })
      }
    })

    if (packageDetailList.length === 0) {
      ElMessage.warning('所选订单中没有可打印的商品信息')
      return
    }

    // 只提取 productSkuId
    const productSkuIds = packageDetailList.map(item => Number(item.productSkuId))
    console.log('准备打印的商品ID：', productSkuIds)
    const res = await TemuCommonApi.printProductBarcode(productSkuIds)
    console.log('打印接口返回数据：', res)
    
    if (res && res.printUrl) {
      loading.setText('正在准备打印...')
      console.log('加载打印链接：', res.printUrl)
      
      // 创建一个临时的 iframe
      const printFrame = document.createElement('iframe')
      printFrame.style.display = 'none'
      document.body.appendChild(printFrame)

      // 使用 Promise 来处理 iframe 加载完成
      await new Promise((resolve, reject) => {
        let timeoutId: number | null = null

        const cleanup = () => {
          if (timeoutId) {
            clearTimeout(timeoutId)
          }
          printFrame.onload = null
          printFrame.onerror = null
        }

        // 设置 15 秒超时
        timeoutId = window.setTimeout(() => {
          cleanup()
          document.body.removeChild(printFrame)
          reject(new Error('加载打印页面超时'))
        }, 15000)

        printFrame.onload = () => {
          cleanup()
          // 给页面 1 秒时间初始化
          setTimeout(() => {
            // 等待打印窗口完全关闭后再移除 iframe
            const checkPrintInterval = setInterval(() => {
              try {
                const printWindow = printFrame.contentWindow
                if (!printWindow || printWindow.closed) {
                  clearInterval(checkPrintInterval)
                  document.body.removeChild(printFrame)
                  loading.close() // 关闭加载提示
                  resolve(true)
                }
              } catch (e) {
                clearInterval(checkPrintInterval)
                document.body.removeChild(printFrame)
                loading.close() // 关闭加载提示
                resolve(true)
              }
            }, 1000)
          }, 1000)
        }

        printFrame.onerror = () => {
          cleanup()
          document.body.removeChild(printFrame)
          loading.close() // 关闭加载提示
          reject(new Error('加载打印页面失败'))
        }

        printFrame.src = res.printUrl
      })
    } else {
      console.log('打印失败，返回数据：', res)
      ElMessage.error('获取打印链接失败')
    }
  } catch (error: any) {
    console.error('打印出错：', error)
    ElMessage.error('打印失败：' + (error.message || '未知错误'))
  } finally {
    // 移除这里的 loading.close()，因为我们在打印窗口关闭时才关闭加载提示
  }
}

// 处理单个订单打印商品条码
async function handleSinglePrintBarcode(row: any) {
  if (!row.packageDetailList || !row.packageDetailList.length) {
    ElMessage.warning('该订单没有商品信息')
    return
  }

  const loading = ElLoading.service({
    lock: true,
    text: '正在获取打印数据...',
    background: 'rgba(0, 0, 0, 0.7)'
  })
  
  try {
    // 只提取 productSkuId
    const productSkuIds = row.packageDetailList
      .filter((item: any) => item.productSkuId)
      .map((item: any) => Number(item.productSkuId))

    if (productSkuIds.length === 0) {
      loading.close()
      ElMessage.warning('该订单没有可打印的商品信息')
      return
    }

    console.log('准备打印的商品ID：', productSkuIds)
    const res = await TemuCommonApi.printProductBarcode(productSkuIds)
    // 获取到数据后立即关闭加载提示
    loading.close()
    console.log('打印接口返回数据：', res)
    
    if (res && res.printUrl) {
      console.log('加载打印链接：', res.printUrl)
      
      // 创建一个临时的 iframe
      const printFrame = document.createElement('iframe')
      printFrame.style.display = 'none'
      document.body.appendChild(printFrame)

      // 使用 Promise 来处理 iframe 加载完成
      await new Promise((resolve, reject) => {
        let timeoutId: number | null = null

        const cleanup = () => {
          if (timeoutId) {
            clearTimeout(timeoutId)
          }
          printFrame.onload = null
          printFrame.onerror = null
        }

        // 设置 15 秒超时
        timeoutId = window.setTimeout(() => {
          cleanup()
          document.body.removeChild(printFrame)
          reject(new Error('加载打印页面超时'))
        }, 15000)

        printFrame.onload = () => {
          cleanup()
          // 给页面 1 秒时间初始化
          setTimeout(() => {
            // 等待打印窗口完全关闭后再移除 iframe
            const checkPrintInterval = setInterval(() => {
              try {
                const printWindow = printFrame.contentWindow
                if (!printWindow || printWindow.closed) {
                  clearInterval(checkPrintInterval)
                  document.body.removeChild(printFrame)
                  resolve(true)
                }
              } catch (e) {
                clearInterval(checkPrintInterval)
                document.body.removeChild(printFrame)
                resolve(true)
              }
            }, 1000)
          }, 1000)
        }

        printFrame.onerror = () => {
          cleanup()
          document.body.removeChild(printFrame)
          reject(new Error('加载打印页面失败'))
        }

        printFrame.src = res.printUrl
      })
    } else {
      console.log('打印失败，返回数据：', res)
      ElMessage.error('获取打印链接失败')
    }
  } catch (error: any) {
    loading.close()
    console.error('打印出错：', error)
    ElMessage.error('打印失败：' + (error.message || '未知错误'))
  }
}

// 处理批量打印商品条码
async function handleBatchPrintBarcode() {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择需要打印的订单')
    return
  }

  const loading = ElLoading.service({
    lock: true,
    text: '正在获取打印数据...',
    background: 'rgba(0, 0, 0, 0.7)'
  })
  
  try {
    // 收集所有选中行的商品ID
    const productSkuIds: number[] = []
    selectedRows.value.forEach(row => {
      if (row.packageDetailList && Array.isArray(row.packageDetailList)) {
        row.packageDetailList.forEach((item: any) => {
          if (item.productSkuId) {
            productSkuIds.push(Number(item.productSkuId))
          }
        })
      }
    })

    if (productSkuIds.length === 0) {
      loading.close()
      ElMessage.warning('所选订单中没有可打印的商品信息')
      return
    }

    console.log('准备打印的商品ID：', productSkuIds)
    const res = await TemuCommonApi.printProductBarcode(productSkuIds)
    // 获取到数据后立即关闭加载提示
    loading.close()
    console.log('打印接口返回数据：', res)
    
    if (res && res.printUrl) {
      console.log('加载打印链接：', res.printUrl)
      
      // 创建一个临时的 iframe
      const printFrame = document.createElement('iframe')
      printFrame.style.display = 'none'
      document.body.appendChild(printFrame)

      // 使用 Promise 来处理 iframe 加载完成
      await new Promise((resolve, reject) => {
        let timeoutId: number | null = null

        const cleanup = () => {
          if (timeoutId) {
            clearTimeout(timeoutId)
          }
          printFrame.onload = null
          printFrame.onerror = null
        }

        // 设置 15 秒超时
        timeoutId = window.setTimeout(() => {
          cleanup()
          document.body.removeChild(printFrame)
          reject(new Error('加载打印页面超时'))
        }, 15000)

        printFrame.onload = () => {
          cleanup()
          // 给页面 1 秒时间初始化
          setTimeout(() => {
            // 等待打印窗口完全关闭后再移除 iframe
            const checkPrintInterval = setInterval(() => {
              try {
                const printWindow = printFrame.contentWindow
                if (!printWindow || printWindow.closed) {
                  clearInterval(checkPrintInterval)
                  document.body.removeChild(printFrame)
                  resolve(true)
                }
              } catch (e) {
                clearInterval(checkPrintInterval)
                document.body.removeChild(printFrame)
                resolve(true)
              }
            }, 1000)
          }, 1000)
        }

        printFrame.onerror = () => {
          cleanup()
          document.body.removeChild(printFrame)
          reject(new Error('加载打印页面失败'))
        }

        printFrame.src = res.printUrl
      })
    } else {
      console.log('打印失败，返回数据：', res)
      ElMessage.error('获取打印链接失败')
    }
  } catch (error: any) {
    loading.close()
    console.error('打印出错：', error)
    ElMessage.error('打印失败：' + (error.message || '未知错误'))
  }
}

const filters = ref({
  productSkcIdList: '',
  subPurchaseOrderSnList: '',
  expressDeliverySnList: '',
  deliverTimeRange: [] as [number, number] | [],
  status: '' // 添加状态字段
})

function formatTime(ts: number|null) {
  if (!ts) return '-'
  const date = new Date(ts)
  return `${date.getMonth() + 1}-${date.getDate()} ${date.toLocaleTimeString('zh-CN', { hour12: false })}`
}
function addDays(ts: number|null, days: number) {
  return ts ? ts + days * 24 * 60 * 60 * 1000 : null
}
function getCountdown(targetTs: number|null) {
  if (!targetTs) return '-'
  const now = Date.now()
  let diff = targetTs - now
  if (diff < 0) diff = 0
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return `${hours}小时${minutes}分`
}

function handleFilter() {
  pagination.value.pageNo = 1
  fetchOrders()
}
function handleReset() {
  filters.value = {
    productSkcIdList: '',
    subPurchaseOrderSnList: '',
    expressDeliverySnList: '',
    deliverTimeRange: [],
    status: '' // 重置时也重置状态
  }
  pagination.value.pageNo = 1
  fetchOrders()
}

function onCalendarChange(val) {
  if (val && val.length === 2 && val[1]) {
    const end = new Date(val[1])
    end.setHours(23, 59, 59, 999)
    filters.value.deliverTimeRange = [
      val[0].getTime(), // 数字
      end.getTime()     // 数字
    ]
  }
}

async function fetchOrders() {
  try {
    // 处理多值输入为数组
    const parseList = (val: string) => val ? val.split(/[,\s\n]+/).filter(Boolean) : undefined
    const params: any = {
      pageNo: pagination.value.pageNo,
      pageSize: pagination.value.pageSize,
      productSkcIdList: parseList(filters.value.productSkcIdList),
      subPurchaseOrderSnList: parseList(filters.value.subPurchaseOrderSnList),
      expressDeliverySnList: parseList(filters.value.expressDeliverySnList),
    }
    // 添加状态过滤
    if (filters.value.status) {
      params.status = Number(filters.value.status)
    }
    if (filters.value.deliverTimeRange && filters.value.deliverTimeRange.length === 2) {
      params.deliverTimeFrom = filters.value.deliverTimeRange[0]
      params.deliverTimeTo = filters.value.deliverTimeRange[1]
    }
    const res = await TemuCommonApi.logisticsQuery(params)
    const data = res?.data || res
    orderList.value = data.list || []
    pagination.value.total = data.total || 0
  } catch (e) {
    ElMessage.error('获取物流发货单失败')
  }
}

function handleSizeChange(size: number) {
  pagination.value.pageSize = size
  pagination.value.pageNo = 1
  fetchOrders()
}
function handleCurrentChange(page: number) {
  pagination.value.pageNo = page
  fetchOrders()
}

onMounted(() => {
  fetchOrders()
})
</script>

<style scoped>
.delivery-order-table-wrap {
  padding: 24px;
  background: #f5f6fa;
  min-height: 100vh;
  padding-bottom: 70px;
}
.time-block {
  background: #f7f7f7;
  border-radius: 6px;
  padding: 8px;
  margin-top: 4px;
  font-size: 13px;
}
.product-info-cell {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.product-img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #eee;
}
.product-info-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 13px;
}
.pagination-wrap {
  position: sticky;
  bottom: 0;
  background: #fff;
  box-shadow: 0 -2px 8px #0000000d;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 12px 24px;
  z-index: 10;
}
.filter-bar {
  background: #fff;
  border-radius: 8px;
  padding: 16px 24px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px #0000000d;
}
.status-tabs {
  background: #fff;
  border-radius: 8px;
  padding: 0 24px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px #0000000d;
}
.operation-bar {
  background: #fff;
  border-radius: 8px;
  padding: 16px 24px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px #0000000d;
  display: flex;
  gap: 12px;
}
.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 24px;
}
</style> 
