<template>
  <div class="rework-container">
    <ContentWrap>
      <el-form :inline="true" :model="queryParams" class="mb-10px">
        <el-form-item label="订单号">
          <el-input v-model="queryParams.orderNo" placeholder="请输入订单号" clearable />
        </el-form-item>
        <el-form-item label="定制SKU">
          <el-input v-model="queryParams.customSku" placeholder="请输入定制SKU" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </ContentWrap>

    <ContentWrap>
      <el-table :data="list" v-loading="loading" style="width: 100%">
        <el-table-column label="订单号" prop="orderNo" min-width="120" />
        <el-table-column label="产品图片" prop="productImgUrl" min-width="110" align="center">
          <template #default="{ row }">
            <div v-if="row.productImgUrl" class="product-image-container">
              <el-image
                :hide-on-click-modal="true" 
                :preview-teleported="true" 
                :src="row.productImgUrl + '?x-oss-process=image/resize,w_200'" 
                :preview-src-list="[row.productImgUrl]"
                style="width: 80px; height: 80px" 
                fit="contain" 
                loading="lazy" 
                :initial-index="0" 
                :preview="false" 
              />
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="商品信息" min-width="180">
          <template #default="{ row }">
            <div>{{ row.productTitle }}</div>
            <div v-if="row.productProperties">属性：{{ row.productProperties }}</div>
          </template>
        </el-table-column>
        <el-table-column label="定制图片" prop="customImageUrls" min-width="150" align="center">
          <template #default="{ row }">
            <div class="custom-images-container" v-if="row.customImageUrls">
              <div v-for="(item, index) in row.customImageUrls.split(',')" :key="index" class="image-item">
                <el-image
                  :hide-on-click-modal="true" 
                  :preview-teleported="true" 
                  :src="item + '?x-oss-process=image/resize,w_200'" 
                  :preview-src-list="[item]"
                  style="width: 60px; height: 60px" 
                  fit="cover" 
                  loading="lazy" 
                  :initial-index="0" 
                  :preview="false" 
                />
              </div>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="定制文字" prop="customTextList" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">
            <div v-if="row.customTextList">{{ row.customTextList }}</div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="SKU信息" min-width="220">
          <template #default="{ row }">
            <div>SKU：{{ row.sku }}</div>
            <div>SKC：{{ row.skc }}</div>
            <div>
              <span>定制SKU：</span>
              <span style="background: #e6f7ff; color: #1890ff; padding: 2px 8px; border-radius: 4px; font-weight: bold;">{{ row.customSku }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="返工信息" min-width="260">
          <template #default="{ row }">
            <div>返工原因：{{ row.reworkReason }}</div>
            <div>返工发起人：<b>{{ row.reworkInitiatorName || '-' }}</b></div>
            <div>返工作图人：<b>{{ row.reworkDrawUserName || '-' }}</b></div>
            <div>上一次作图人：<b>{{ row.lastDrawUserName || '-' }}</b></div>
            <div>返工完成：
              <el-tag :type="row.isFinished ? 'success' : 'danger'" :style="row.isFinished ? {} : { backgroundColor: '#ff4d4f', color: 'white', fontWeight: 'bold' }">
                {{ row.isFinished ? '已完成' : '未完成' }}
              </el-tag>
              <span v-if="row.isFinished" style="color: #52c41a; font-weight: bold; margin-left: 8px;">已完成</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" align="center" min-width="200">
          <template #default="{ row }">
            <el-button size="small" type="success" plain :disabled="row.isFinished" @click="confirmReworkFinish(row)">返工完成确认</el-button>
          </template>
        </el-table-column>
      </el-table>
      <Pagination :total="total" v-model:page="queryParams.pageNo" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </ContentWrap>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { TemuOrderReworkApi } from '@/api/temu/rework'
import ReworkInitiateDialog from './ReworkInitiateDialog.vue'

const loading = ref(false)
const list = ref<any[]>([])
const total = ref(0)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  orderNo: '',
  customSku: ''
})

const getList = async () => {
  loading.value = true
  try {
    const res = await TemuOrderReworkApi.getReworkPage(queryParams)
    console.log('返工订单数据完整响应:', res)
    console.log('返工订单列表数据:', res.list)
    console.log('返工订单总数:', res.total)
    
    // 确保数据结构正确
    if (res && res.list) {
      // 对数据进行排序：未完成的订单前置，已完成的订单后置
      const sortedList = res.list.sort((a: any, b: any) => {
        // 未完成的排在前面（isFinished为false或undefined）
        if (!a.isFinished && b.isFinished) return -1
        if (a.isFinished && !b.isFinished) return 1
        return 0
      })
      
      list.value = sortedList
      total.value = res.total || 0
    } else {
      console.warn('后端返回的数据结构不符合预期:', res)
      list.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('获取返工订单数据失败:', error)
    ElMessage.error('获取数据失败')
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}
const handleReset = () => {
  queryParams.orderNo = ''
  queryParams.customSku = ''
  handleQuery()
}

const updateRowByCustomSku = (customSku: string, update: Partial<any>) => {
  const idx = list.value.findIndex(item => item.customSku === customSku)
  if (idx !== -1) {
    list.value[idx] = { ...list.value[idx], ...update }
  }
}

const confirmReworkFinish = async (row: any) => {
  try {
    // 添加确认提示
    const confirmMessage = `确认是定制SKU "${row.customSku}" 及其对应订单商品图吗？`
    await ElMessageBox.confirm(confirmMessage, '确认返工完成', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const resp = await TemuOrderReworkApi.finishRework({ customSku: row.customSku })
    if (resp && resp.customSku) {
      updateRowByCustomSku(resp.customSku, { isFinished: resp.isFinished })
    }
    ElMessage.success('返工完成已确认')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

onMounted(getList)
</script>

<style scoped>
.rework-container {
  padding: 20px;
}

.custom-images-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.image-item {
  border-radius: 4px;
  overflow: hidden;
}

.product-image-container {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style> 