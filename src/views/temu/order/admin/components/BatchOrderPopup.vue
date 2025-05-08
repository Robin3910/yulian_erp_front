<template>
  <el-dialog v-model="dialogVisible" title="批量下单" width="60%" :before-close="handleClose">
    <div class="max-h-50vh overflow-y-auto overflow-x-hidden">
      <el-form :model="formData" ref="formRef">
        <el-form-item label="" v-for="(item, index) in formData.orderList" :key="index">
          <div class="flex flex-col">
            <div class="text-shadow-color-blueGray text-xl">{{ `订单号:${item.orderNo}` }}</div>
            <!--店铺名称-->
            <el-form-item label="店铺名称：" class="mb-2 cursor-pointer">
              <div class="text-left" :title="item.shopName" v-if="item.shopName"  style="font-weight: bolder;font-size: 18px">
                {{ item.shopName }}
              </div>
            </el-form-item>
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
              <!-- 官网原始数量 -->
              <el-form-item label="官网数量：" class="mb-2 cursor-pointer">
                <div class="text-left">
                  {{ item.originalQuantity }}
                </div>
              </el-form-item>
              <!--  分类名称-->
              <el-form-item label="类目名称：" class="mb-2 cursor-pointer">
                <div class="text-left" :title="item.categoryName" v-if="item.categoryName">
                  {{ item.categoryName }}
                </div>
              </el-form-item>
              <!--计价规则-->
              <el-form-item label="计价规则：" class="mb-2 cursor-pointer">
                <div class="text-left" v-if="item.categoryRuleType">
                  <span v-if="item.categoryRuleType === 1">按数量计价</span>
                  <span v-if="item.categoryRuleType === 2">按版面计价</span>
                </div>
              </el-form-item>
              <template v-if="item.categoryRuleType === 1">
                <!-- 分类价格 -->
                <el-form-item label="分类价格：" class="mb-2 cursor-pointer">
                  <div class="text-left" v-if="item.categoryPriceRule">
                    <div
                      v-for="(_rule, _index) in sortRulePrice(
                        (item.categoryPriceRule as RulePriceByNumber).unitPrice
                      )"
                      :key="_index"
                    >
                      <div
                        >数量：
                        <el-tag size="small">
                          {{
                            sortRulePrice((item.categoryPriceRule as RulePriceByNumber).unitPrice)[
                              _index - 1
                            ]
                              ? sortRulePrice(
                                  (item.categoryPriceRule as RulePriceByNumber).unitPrice
                                )[_index - 1].max
                              : 0
                          }}
                        </el-tag>
                        ~
                        <el-tag size="small">{{ _rule.max }}</el-tag>
                        价格：
                        <el-tag size="small"
                          >¥{{ parseFloat((_rule.price as any) || 0).toFixed(2) }}
                        </el-tag>
                      </div>
                    </div>
                    <div v-if="(item.categoryPriceRule as RulePriceByNumber).defaultPrice">
                      <div>
                        数量大于{{
                          sortRulePrice((item.categoryPriceRule as RulePriceByNumber).unitPrice)[
                            sortRulePrice((item.categoryPriceRule as RulePriceByNumber).unitPrice)
                              .length - 1
                          ].max
                        }}价格是：
                        <el-tag size="small">
                          ¥{{
                            parseFloat(
                              ((item.categoryPriceRule as RulePriceByNumber).defaultPrice as any) ||
                                0
                            ).toFixed(2)
                          }}
                        </el-tag>
                      </div>
                    </div>
                  </div>
                </el-form-item>
              </template>
              <template v-if="item.categoryRuleType === 2">
                <!-- 分类价格 -->
                <el-form-item label="分类价格：" class="mb-2 cursor-pointer">
                  <div class="text-left" v-if="item.categoryPriceRule">
                    <div v-if="item.categoryPriceRule as RulePriceByLayout">
                      <div
                        >单个产品的价格:
                        <el-tag size="small"
                          >¥{{
                            parseFloat(
                              ((item.categoryPriceRule as RulePriceByLayout).singlePrice as any) ||
                                0
                            ).toFixed(2)
                          }}
                        </el-tag>
                      </div>
                    </div>
                    <div v-if="item.categoryPriceRule as RulePriceByLayout">
                      <div
                        >单个版面可以制作的产品数量:
                        <el-tag size="small">
                          {{ (item.categoryPriceRule as RulePriceByLayout).singleLayoutCount }}
                        </el-tag>
                      </div>
                    </div>
                    <div
                      v-for="(_rule, _index) in sortRulePrice(
                        (item.categoryPriceRule as RulePriceByLayout).unitPrice
                      )"
                      :key="_index"
                    >
                      <div
                        >版面数量：
                        <el-tag size="small">
                          {{
                            sortRulePrice((item.categoryPriceRule as RulePriceByLayout).unitPrice)[
                              _index - 1
                            ]
                              ? sortRulePrice(
                                  (item.categoryPriceRule as RulePriceByLayout).unitPrice
                                )[_index - 1].max
                              : 0
                          }}
                        </el-tag>
                        ~
                        <el-tag size="small">{{ _rule.max }}</el-tag>
                        价格：
                        <el-tag size="small"
                          >¥{{ parseFloat((_rule.price as any) || 0).toFixed(2) }}
                        </el-tag>
                      </div>
                    </div>
                    <div v-if="(item.categoryPriceRule as RulePriceByLayout).defaultPrice">
                      <div>
                        版面数量大于{{
                          sortRulePrice((item.categoryPriceRule as RulePriceByLayout).unitPrice)[
                            sortRulePrice((item.categoryPriceRule as RulePriceByLayout).unitPrice)
                              .length - 1
                          ].max
                        }}价格是：
                        <el-tag size="small">
                          ¥{{
                            parseFloat(
                              ((item.categoryPriceRule as RulePriceByLayout).defaultPrice as any) ||
                                0
                            ).toFixed(2)
                          }}
                        </el-tag>
                      </div>
                    </div>
                  </div>
                </el-form-item>
              </template>
              <!--  数量-->
              <el-form-item
                label="制作数量："
                class="mb-2 cursor-pointer"
                :prop="`orderList.${index}.quantity`"
                :rules="[{ required: true, message: '请输入数量', trigger: 'blur' }]"
              >
                <el-input v-model.number="item.quantity" class="!w-240px" clearable />
              </el-form-item>
              <!-- 单价 -->
              <el-form-item label="单价：" class="mb-2 cursor-pointer">
                <div class="text-left">
                  ¥{{ calculateUnitPrice(item) ? _.round(calculateUnitPrice(item), 4) : '0.00' }}
                </div>
              </el-form-item>

              <!-- 总价 -->
              <el-form-item label="总价：" class="mb-2 cursor-pointer">
                <div class="text-left">
                  ¥{{ _.round(calculateUnitPrice(item) * item.quantity,6).toFixed(2)||'0.00' }}
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
        <div class="text-left text-orange-500">
          <span>订单数：{{ formData.orderList.length || 0 }} </span>
          <span class="ml-2"
            >总价：¥{{
              _.round(formData.orderList
                .reduce((acc, item) => acc + calculateUnitPrice(item) * item.quantity, 0),3).toFixed(2)
            }}</span
          >
        </div>
        <div>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleConfirm"> 确认</el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { OrderApi } from '@/api/temu/order'
import { rulePrice, RulePriceByNumber, RulePriceByLayout } from '@/api/temu/product-category'
import { ElMessage } from 'element-plus'
import _ from 'lodash'
// ##########################变量区###################################################

const formEl = useTemplateRef('formRef')
const emit = defineEmits(['confirm', 'visible-event'])
defineOptions({
  name: 'BatchOrderPopup'
})
// ##########################方法区###################################################
// 排序规则价格
const sortRulePrice = (arr: rulePrice[]) => {
  if (!arr) {
    return []
  }
  // 确保a.max和b.max都存在,否则返回0进行安全比较
  return arr.sort((a, b) => {
    const maxA = a?.max ?? 0
    const maxB = b?.max ?? 0
    return maxA - maxB
  })
}
// 按照的规则过滤订单的数量
const filterOrderQuantity = (list: any[]) => {
  list.forEach((item) => {
  
    const properties = item.productProperties.toLowerCase()
    const productTitle = item.productTitle.toLowerCase()
    const productCategoryName = item.productCategoryName.toLowerCase()
    const originalQuantity = item.quantity || 1 // 保存原始订单数量
    
    // 特殊处理 rainbow 情况 - 移到最前面
    if (properties.includes('rainbow')) {
     
      // 使用更宽松的匹配模式
      const rainbowMatch = properties.match(/(\d+)[\s\u00A0-]*(|cps|pc|pcs|set|sets|个|件|片|张)/i)
    
      if (rainbowMatch) {
        const propertyQuantity = parseInt(rainbowMatch[1], 10)
        item.quantity = propertyQuantity * originalQuantity
        return
      } else {
    
        // 尝试其他匹配方式
        const altMatch = properties.match(/(\d+)\s*(|cps|pc|pcs|set|sets|个|件|片|张)/i)
    
        if (altMatch) {
          const propertyQuantity = parseInt(altMatch[1], 10)
          item.quantity = propertyQuantity * originalQuantity

          return
        }
      }
    }

    // 特殊情况处理：包含"熊"或"baer"字样，或包含尺寸单位"in"/"cm"
    if (
      properties.includes('熊') || properties.includes('象') || productCategoryName.includes("件套") ||
      properties.includes('baer') || productTitle.includes("拼图") ||
      properties.includes('in') ||
      properties.includes('cm')
    ) {
      console.log('匹配到特殊情况（熊/象/件套/baer/拼图/in/cm）')
      item.quantity = 1 * originalQuantity
      return
    }

    // 尝试匹配数量信息，如"30pcs"、"2set"等
    const quantityMatch = properties.match(/(\d+)[\s\u00A0-]*(|cps|pc|pcs|set|sets|个|件|片|张)/i)
    console.log('常规匹配结果:', quantityMatch)
    if (quantityMatch) {
      const propertyQuantity = parseInt(quantityMatch[1], 10)
      console.log('常规匹配提取到的数量:', propertyQuantity)
      // 将商品属性中的数量与订单数量相乘
      item.quantity = propertyQuantity * originalQuantity
      console.log(`最终计算结果: ${propertyQuantity} * ${originalQuantity} = ${item.quantity}`)
    } else {
      // 如果没有匹配到数量信息，保持原始订单数量
      item.quantity = originalQuantity
      console.log('未匹配到数量信息，使用原始数量:', item.quantity)
    }
  })
}
// 根据传入的规则计算单价
const calculateUnitPrice = computed(() => {
  return (item): number => {
    if (item.categoryRuleType === 1) {
      let priceRule = _.cloneDeep(item.categoryPriceRule) as RulePriceByNumber
      // 设置默认价格
      let unitPrice = priceRule.defaultPrice || 0
      // 分类价格按照数量从小到大排序
      priceRule.unitPrice.sort((a, b) => (a?.max ?? 0) - (b?.max ?? 0))
      //检查分类定价规则
      for (let index = 0; index < priceRule.unitPrice.length; index++) {
        const rule = priceRule.unitPrice[index]
        if (item.quantity <= (rule?.max ?? 0)) {
          unitPrice = rule.price || 0
          break
        }
      }
      return unitPrice
    }
    if (item.categoryRuleType === 2) {
      let priceRule = _.cloneDeep(item.categoryPriceRule) as RulePriceByLayout
      // 计算版面价格
      let calcLayoutUnitPrice = (count: number) => {
        let unitPrice = priceRule.defaultPrice as number
        priceRule.unitPrice.sort((a, b) => (a?.max ?? 0) - (b?.max ?? 0))
        for (let index = 0; index < priceRule.unitPrice.length; index++) {
          const rule = priceRule.unitPrice[index]
          if (count <= (rule?.max ?? 0)) {
            unitPrice = rule.price || 0
            break
          }
        }
        return unitPrice
      }
      let minPrice = 0
      //首先计算出 单个产品的单价*数量的价格
      let singleTotalPrice = (priceRule.singlePrice as number) * item.quantity
      minPrice= singleTotalPrice
      // 然后计算产品最大可以需要几个版面
      let maxLayoutCount = Math.ceil((item.quantity / (priceRule.singleLayoutCount as number)) as number)
      for (let index = 1; index <= maxLayoutCount; index++) {
        let currentTotalPrice = 0
        let remainPrice=0
        // 当前整版的价格
        let  currentLayoutTotalPrice=calcLayoutUnitPrice(index)*index;
        //检查是是否存在剩余的单个产品 没有就是0  有就加上单个产品*价格
        let  remainder=item.quantity-index * (priceRule.singleLayoutCount as number)
        if (remainder > 0){
          remainPrice=priceRule.singlePrice as number * remainder
        }else {
          remainPrice=0
        }
        currentTotalPrice=currentLayoutTotalPrice+remainPrice
        if (currentTotalPrice <= minPrice) {
          minPrice = currentTotalPrice
          console.log(`产品数量${item.quantity },
         方案1(直接按产品计价)：按单个单品价格算是${singleTotalPrice},
         方案2(购买版面+产品)：购买${index}个版面完成制作${index*(priceRule.singleLayoutCount as number)}个产品花费价格：${index*calcLayoutUnitPrice(index)},
         剩余${remainder}个产品
         价格是${remainder>0?priceRule.singlePrice as number * remainder:0},
         方案2总价是:${currentTotalPrice},由版面总价${currentLayoutTotalPrice}+剩余产品的总价${remainPrice}组成,

        `)
        }

      }
      return minPrice/item.quantity||0
    }
    return 0
  }
})
// 传入订单数据
const setOrderList = (list: any[]) => {
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
