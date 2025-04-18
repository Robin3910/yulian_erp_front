<template>
  <el-dialog v-model="dialogVisible" title="批量下单" width="60%" :before-close="handleClose">
    <div class="max-h-50vh overflow-y-auto overflow-x-hidden">
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
                  <div v-for="(_item, _index) in item.customImageUrls.split(',')" :key="_index" class="mr-1">
                    <el-image
class="w-10 h-10" :hide-on-click-modal="true" :preview-teleported="true" :src="_item"
                      :preview-src-list="[_item]" />
                  </div>
                </div>
              </el-form-item>
              <!--  定制文字-->
              <el-form-item label="定制文字：" class="mb-2 cursor-pointer">
                <div class="text-left truncate" :title="item.customTextList" v-if="item.customTextList">
                  {{ item.customTextList }}
                </div>
              </el-form-item>
              <!--  分类名称-->
              <el-form-item label="类目名称：" class="mb-2 cursor-pointer">
                <div class="text-left" :title="item.categoryName" v-if="item.categoryName">
                  {{ item.categoryName }}
                </div>
              </el-form-item>
              <!-- 默认价格 -->
              <el-form-item :label="`数量超过${item.categoryPriceRule.sort((a, b) => a.max - b.max)[item.categoryPriceRule.sort((a, b) => a.max - b.max).length - 1]?item.categoryPriceRule.sort((a, b) => a.max - b.max)[item.categoryPriceRule.sort((a, b) => a.max - b.max).length - 1].max:0}价格是：`" class="mb-2 cursor-pointer">
                <div class="text-left" v-if="item.defaultPrice">
                  ¥{{ item.defaultPrice?item.defaultPrice.toFixed(2):'0.00' }}
                </div>
              </el-form-item>
              <!-- 分类价格 -->
              <el-form-item label="分类价格：" class="mb-2 cursor-pointer">
                <div class="text-left" v-if="item.categoryPriceRule">
                  <div v-for="(_rule, _index) in item.categoryPriceRule.sort((a, b) => a.max - b.max)" :key="_index">
                    <div>数量：<el-tag size="small">{{ item.categoryPriceRule.sort((a, b) => a.max - b.max)[_index-1]?item.categoryPriceRule.sort((a, b) => a.max - b.max)[_index-1].max:0}}</el-tag>~<el-tag size="small">{{ _rule.max }}</el-tag>价格：<el-tag size="small">¥{{ _rule.price.toFixed(2) }}</el-tag></div>
                  </div>
                </div>
              </el-form-item>
              <!--  数量-->
              <el-form-item
label="数量：" class="mb-2 cursor-pointer" :prop="`orderList.${index}.quantity`"
                :rules="[{ required: true, message: '请输入数量', trigger: 'blur' }]">
                <el-input v-model.number="item.quantity" class="!w-240px" clearable />
              </el-form-item>
              <!-- 单价 -->
              <el-form-item label="单价：" class="mb-2 cursor-pointer">
                <div class="text-left" >
                  ¥{{ calculateUnitPrice(item)?calculateUnitPrice(item):'0.00' }}
                </div>

              </el-form-item>

              <!-- 总价 -->
              <el-form-item label="总价：" class="mb-2 cursor-pointer">
                <div class="text-left" >
                  ¥{{ (calculateUnitPrice(item)*item.quantity).toFixed(2) }}
                </div>
              </el-form-item>
            </div>
          </div>
          <el-divider />
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer flex items-center justify-between">
        <!-- 订单数 -->
        <div class="text-left text-orange-500" >
          <span>订单数：{{ formData.orderList.length||0 }} </span>
          <span class="ml-2">总价：¥{{ formData.orderList.reduce((acc, item) => acc + (calculateUnitPrice(item)*item.quantity), 0).toFixed(2) }}</span>
        </div>
        <div>
          <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirm"> 确认 </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { OrderApi } from '@/api/temu/order'
import { ElMessage } from "element-plus";
import _ from 'lodash'
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
// 根据传入的规则计算单价
const calculateUnitPrice = computed(() => {
  return (item) => {

   // 设置默认价格
   let unitPrice = item.defaultPrice
    // 分类价格按照数量从小到大排序
    item.categoryPriceRule.sort((a, b) => a.max - b.max)
    //检查分类定价规则
    for (let index = 0; index < item.categoryPriceRule.length; index++) {
      const rule = item.categoryPriceRule[index]
      if (item.quantity <= rule.max) {
        unitPrice = rule.price
        break
      }
    }
    console.log('>>>>>>>>>>>>>计算单价',unitPrice.toFixed(2))
    return unitPrice.toFixed(2)
}
})
// 传入订单数据
const setOrderList =  (list: any[]) => {
  let newList = _.cloneDeep(list)
  filterOrderQuantity(newList)
  formData.orderList = newList
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
