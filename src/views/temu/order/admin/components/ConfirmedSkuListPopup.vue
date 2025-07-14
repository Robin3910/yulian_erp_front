<template>
  <el-dialog v-model="dialogVisible" title="已确认的SKU列表" width="50%" :before-close="handleClose">
    <div class="max-h-50vh overflow-y-auto overflow-x-hidden">
      <el-form :inline="true" class="mb-4">
        <div class="flex items-center">
          <el-form-item label="店铺">
            <el-select v-model="queryParams.shopId" placeholder="请选择店铺" clearable @change="handleQuery" style="width: 300px;">
              <el-option v-for="(item, index) in shopList" :key="index" :label="item.shopName" :value="item.shopId" />
            </el-select>
          </el-form-item>
          <el-form-item class="ml-2">
            <el-button type="primary" @click="handleQuery">查询</el-button>
          </el-form-item>
        </div>
      </el-form>
      
      <!-- 一键复制SKU列表 -->
      <div v-if="list.length > 0" class="mb-4 p-3 border rounded">
        <div class="flex justify-between items-center mb-2">
          <div class="font-bold">已确认SKU列表（可复制）：</div>
          <el-button type="primary" size="small" @click="copyAllSkus">一键复制</el-button>
        </div>
        <el-input
          type="textarea"
          v-model="skuListText"
          :rows="4"
          readonly
          placeholder="暂无已确认SKU"
        />
      </div>

      <el-table v-loading="loading" :data="list" border stripe>
        <el-table-column label="SKU" prop="sku" align="center" />
        <el-table-column label="操作" align="center" width="120">
          <template #default="{ row }">
            <el-button type="danger" size="small" @click="handleCancel(row)">取消确认</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="mt-4 text-center" v-if="list.length === 0 && !loading">
        <el-empty description="暂无已确认的SKU" />
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { SkuConfirmationApi } from '@/api/temu/sku-confirmation'
import { TemuCommonApi } from '@/api/temu/common'
import { ElMessage, ElMessageBox } from 'element-plus'

defineOptions({
  name: 'ConfirmedSkuListPopup'
})

const emit = defineEmits(['confirm', 'visible-event'])

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

// 数据相关
const dialogVisible = ref(false)
const loading = ref(false)
const list = ref<any[]>([])
const shopList = ref<any[]>([])
const skuListText = ref('') // 用于一键复制的SKU列表文本
const queryParams = reactive({
  shopId: ''
})

// 获取店铺列表
const getShopList = async () => {
  try {
    const res = await TemuCommonApi.getShopList()
    // 确保返回的数据结构正确
    if (res && res.list && Array.isArray(res.list)) {
      shopList.value = res.list
    } else {
      console.error('获取到的店铺列表数据结构不正确', res)
      shopList.value = []
    }
  } catch (error) {
    console.error('获取店铺列表失败', error)
    shopList.value = []
  }
}

// 获取已确认的SKU列表
const getConfirmedSkuList = async () => {
  loading.value = true
  try {
    const res = await SkuConfirmationApi.getList({ shopId: queryParams.shopId || '' })
    list.value = res
    
    // 更新SKU列表文本，用于一键复制
    if (res && res.length > 0) {
      skuListText.value = res.map((item: any) => item.sku).join('\n')
    } else {
      skuListText.value = ''
    }
  } catch (error) {
    console.error('获取已确认的SKU列表失败', error)
    list.value = []
    skuListText.value = ''
  } finally {
    loading.value = false
  }
}

// 复制所有SKU
const copyAllSkus = () => {
  if (!skuListText.value) {
    ElMessage.warning('没有可复制的SKU')
    return
  }
  
  // 复制到剪贴板
  navigator.clipboard.writeText(skuListText.value)
    .then(() => {
      ElMessage.success('SKU列表已复制到剪贴板')
    })
    .catch(() => {
      ElMessage.error('复制失败，请手动复制')
    })
}

// 取消确认
const handleCancel = (row: any) => {
  ElMessageBox.confirm('确定要取消确认该SKU吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await SkuConfirmationApi.cancel(row.id)
      ElMessage.success('取消确认成功')
      getConfirmedSkuList()
      emit('confirm')
    } catch (error) {
      ElMessage.error('取消确认失败')
    }
  }).catch(() => {})
}

// 查询
const handleQuery = () => {
  getConfirmedSkuList()
}

// 关闭弹窗
const handleClose = () => {
  dialogVisible.value = false
}

// 监听弹窗显示状态
watch(dialogVisible, (val) => {
  if (!val) {
    emit('visible-event', false)
  }
})

// 监听props.visible变化
watch(() => props.visible, (val) => {
  dialogVisible.value = val
  if (val) {
    // 清除之前的数据
    list.value = []
    skuListText.value = ''
    queryParams.shopId = ''
    
    // 重新获取数据
    getShopList()
  }
})

// 组件挂载时
onMounted(() => {
  dialogVisible.value = props.visible
  if (props.visible) {
    // 清除之前的数据
    list.value = []
    skuListText.value = ''
    queryParams.shopId = ''
    
    // 获取数据
    getShopList()
  }
})

// 对外暴露方法
defineExpose({
  open: () => {
    // 清除之前的数据
    list.value = []
    skuListText.value = ''
    queryParams.shopId = ''
    
    dialogVisible.value = true
    getShopList()
  }
})
</script>

<style scoped lang="scss"></style> 