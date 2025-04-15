<template>
  <el-dialog v-model="dialogVisible" title="批量下单" width="60%" :before-close="handleClose">
    <div class="max-h-40vh overflow-y-auto overflow-x-hidden">
      <el-form :model="formData" ref="formRef">
        <el-form-item label="" v-for="(item, index) in formData.orderList" :key="index">
          <div class="flex flex-col">
            <div class="text-shadow-color-blueGray text-xl">{{ `订单号:${item.orderNo}` }}</div>
            <div class="flex flex-col">
              <!--产品名称-->
              <el-form-item label="产品名称：" class="mb-2 cursor-pointer">
                <div class="text-left" :title="item.productTitle" v-if="item.productTitle">
                  {{ item.productTitle }}
                </div>
              </el-form-item>
              <!--产品属性描述-->
              <el-form-item label="属性描述：" class="mb-2 cursor-pointer">
                <div class="" :title="item.productProperties" v-if="item.productProperties">
                  {{ item.productProperties }}
                </div>
              </el-form-item>
              <!--  定制图片-->
              <el-form-item label="定制图片：" class="mb-2 cursor-pointer">
                <div class="text-left flex" v-if="item.customImageUrls">
                  <div
                    v-for="(_item, _index) in item.customImageUrls.split(',')"
                    :key="_index"
                    class="mr-1"
                  >
                    <el-image
                      class="w-10 h-10"
                      :hide-on-click-modal="true"
                      :preview-teleported="true"
                      :src="_item"
                      :preview-src-list="[_item]"
                    />
                  </div>
                </div>
              </el-form-item>
              <!--  定制文字-->
              <el-form-item label="定制文字：" class="mb-2 cursor-pointer">
                <div
                  class="text-left truncate"
                  :title="item.customTextList"
                  v-if="item.customTextList"
                >
                  {{ item.customTextList }}
                </div>
              </el-form-item>
              <!--  分类名称-->
              <el-form-item label="类目名称：" class="mb-2 cursor-pointer">
                <div class="text-left" :title="item.categoryName" v-if="item.categoryName">
                  {{ item.categoryName }}
                </div>
              </el-form-item>
              <!--  数量-->
              <el-form-item
                label="数量："
                class="mb-2 cursor-pointer"
                :prop="`orderList.${index}.quantity`"
                :rules="[{ required: true, message: '请输入数量', trigger: 'blur' }]"
              >
                <el-input v-model.number="item.quantity" class="!w-240px" clearable />
              </el-form-item>
            </div>
          </div>
          <el-divider />
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirm"> 确认 </el-button>
      </span>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { OrderApi } from '@/api/temu/order'
import {ElMessage} from "element-plus";
// ##########################变量区###################################################

const formEl = useTemplateRef('formRef')
const emit = defineEmits(['confirm', 'visible-event'])
defineOptions({
  name: 'BatchOrderPopup'
})
// ##########################方法区###################################################

// 按照的规则过滤订单的数量
const filterOrderQuantity = (list: any[]) => {
  list.forEach((item) => {
    const properties = item.productProperties.toLowerCase()
    // 特殊情况处理：包含"熊"或"baer"字样，或包含尺寸单位"in"/"cm"
    if (
      properties.includes('熊') ||
      properties.includes('baer') ||
      properties.includes('in') ||
      properties.includes('cm')
    ) {
      item.quantity = 1
      return
    }

    // 尝试匹配数量信息，如"1pc"、"2set"等
    const quantityMatch = properties.match(/(\d+)\s*(pc|pcs|set|sets)/i)
    if (quantityMatch) {
      item.quantity = parseInt(quantityMatch[1], 10)
    }
  })
}
// 传入订单数据
const setOrderList = (list: any[]) => {
  console.log('>>>>>>>>>>>>>订单数据', list)
  filterOrderQuantity(list)
  formData.orderList = list
}
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})
const dialogVisible = ref(false)
const formData = reactive({
  orderList: [] as any[]
})

const handleClose = () => {
  dialogVisible.value = false
}
const handleConfirm = () => {
  if (formEl && formEl.value) {
    formEl.value.validate(async (valid) => {
      if (valid) {
        await OrderApi.batchCreateOrder(
          formData.orderList.map((item) => {
            return {
              id: item.id,
              quantity: item.quantity
            }
          })
        )
        ElMessage.success('操作成功')
        console.log('>>>>>>>>>>>触达确认事件')
        emit('confirm')
        dialogVisible.value = false
      }
    })
    return
  }
}
// ##########################事件监听处理区###################################################
onMounted(() => {
  dialogVisible.value = props.visible
})
watch(dialogVisible, (val) => {
  if (!val) {
    emit('visible-event', false)
  }
})
// 组件对外暴露方法
defineExpose({
  setOrderList
})
</script>

<style scoped lang="scss"></style>
