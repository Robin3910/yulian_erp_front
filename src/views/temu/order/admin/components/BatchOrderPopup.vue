<template>
  <el-dialog v-model="dialogVisible" title="批量下单" width="60%" :before-close="handleClose">
    <div class="max-h-50vh overflow-y-auto overflow-x-hidden">
      <el-form :model="formData" ref="formRef">
        <el-form-item label="" v-for="(item, index) in formData.orderList" :key="index">
          <div class="flex flex-col">
            <div class="text-shadow-color-blueGray text-xl">{{ `订单号:${item.orderNo}` }}</div>
            <!--店铺名称-->
            <el-form-item label="店铺名称：" class="mb-2 cursor-pointer">
              <div class="text-left" :title="item.shopName" v-if="item.shopName"
                style="font-weight: bolder;font-size: 18px">
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
                  <div v-for="(_item, _index) in item.customImageUrls.split(',')" :key="_index" class="mr-1">
                    <el-image class="w-10 h-10" :hide-on-click-modal="true" :preview-teleported="true" :src="_item+ '?x-oss-process=image/resize,w_200'"
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
                    <div v-for="(_rule, _index) in sortRulePrice(
                      (item.categoryPriceRule as RulePriceByNumber).unitPrice
                    )" :key="_index">
                      <div>数量：
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
                        <el-tag size="small">¥{{ parseFloat((_rule.price as any) || 0).toFixed(2) }}
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
                      <div>单个产品的价格:
                        <el-tag size="small">¥{{
                          parseFloat(
                            ((item.categoryPriceRule as RulePriceByLayout).singlePrice as any) ||
                            0
                          ).toFixed(2)
                        }}
                        </el-tag>
                      </div>
                    </div>
                    <div v-if="item.categoryPriceRule as RulePriceByLayout">
                      <div>单个版面可以制作的产品数量:
                        <el-tag size="small">
                          {{ (item.categoryPriceRule as RulePriceByLayout).singleLayoutCount }}
                        </el-tag>
                      </div>
                    </div>
                    <div v-for="(_rule, _index) in sortRulePrice(
                      (item.categoryPriceRule as RulePriceByLayout).unitPrice
                    )" :key="_index">
                      <div>版面数量：
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
                        <el-tag size="small">¥{{ parseFloat((_rule.price as any) || 0).toFixed(2) }}
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
              <el-form-item label="制作数量：" class="mb-2 cursor-pointer" :prop="`orderList.${index}.quantity`"
                :rules="[{ required: true, message: '请输入数量', trigger: 'blur' }]">
                <el-input v-model.number="item.quantity" class="!w-240px" clearable />
              </el-form-item>
              <!-- 单价 -->
              <el-form-item label="单价：" class="mb-2 cursor-pointer">
                <div class="text-left">
                  <span v-if="item.isReturnOrder === 1" class="text-orange-500">此订单为返单，无需付费</span>
                  <span v-else>¥{{ calculateUnitPrice(item) ? _.round(calculateUnitPrice(item), 4) : '0.00' }}</span>
                  <!-- ¥{{ calculateUnitPrice(item) ? _.round(calculateUnitPrice(item), 4) : '0.00' }} -->
                </div>
              </el-form-item>

              <!-- 总价 -->
              <el-form-item label="总价：" class="mb-2 cursor-pointer">
                <div class="text-left">
                  <span v-if="item.isReturnOrder === 1" class="text-orange-500">此订单为返单，无需付费</span>
                  <span v-else>¥{{ _.round(calculateUnitPrice(item) * item.quantity, 6).toFixed(2) || '0.00' }}</span>
                  <!-- ¥{{ _.round(calculateUnitPrice(item) * item.quantity, 6).toFixed(2) || '0.00' }} -->
                </div>
              </el-form-item>
              
              <!-- SKU确认按钮 -->
              <el-form-item label="SKU确认：" class="mb-2 cursor-pointer">
                <div class="text-left">
                  <el-button 
                    type="success" 
                    :disabled="item.skuConfirmed"
                    @click="handleConfirmSku(item)"
                  >
                    {{ item.skuConfirmed ? '已确认' : '确认该SKU' }}
                  </el-button>
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
          <span class="ml-2">总价：¥{{
            _.round(formData.orderList
              .filter(item => item.isReturnOrder !== 1)
              .reduce((acc, item) => acc + calculateUnitPrice(item) * item.quantity, 0), 3).toFixed(2)
          }}</span>
        </div>
        <div>
          <el-button @click="dialogVisible = false" :disabled="loading">取消</el-button>
          <el-button type="primary" @click="handleConfirm" :loading="loading">
            {{ loading ? '处理中...' : '确认' }}
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { OrderApi } from '@/api/temu/order'
import { rulePrice, RulePriceByNumber, RulePriceByLayout } from '@/api/temu/product-category'
import { ElMessage, ElMessageBox } from 'element-plus'
import _ from 'lodash'
import { SkuConfirmationApi } from '@/api/temu/sku-confirmation'
import ConfirmedSkuListPopup from './ConfirmedSkuListPopup.vue'
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
    const shopName = item.shopName;
    const productTitle = item.productTitle.toLowerCase()
    const productCategoryName = item.productCategoryName.toLowerCase()
    const originalQuantity = item.quantity || 1 // 保存原始订单数量

    console.log('处理商品属性:', properties)

    // 特殊处理带有 + 号的多个数量情况（如 70pcs+70pcs）
    if (properties.includes('+')) {
      console.log('发现带+号的属性:', properties)
      const parts = properties.split('+')
      console.log('分割后的部分:', parts)

      // 检查是否每个部分都包含数量
      const validParts = parts.filter(part => {
        const match = part.trim().match(/(\d+)[\s\u00A0-]*(|cps|pc|pcs|set|sets|个|件|片|张)/i)
        console.log('部分匹配结果:', part.trim(), match ? '匹配成功' : '匹配失败')
        return match !== null
      })

      if (validParts.length >= 2) {
        console.log('找到多个有效部分，设置数量为:', validParts.length)
        item.quantity = validParts.length * originalQuantity
        return
      }
    }

    // 特殊处理宣传单类目
    if (productCategoryName.includes('宣传单')) {
      // 尝试从类目名称中提取张数信息，格式如"宣传单A5-200张"
      const categoryMatch = item.categoryName && item.categoryName.match(/宣传单[A|a]\d+-(\d+)张/);
      if (categoryMatch) {
        const sheetQuantity = parseInt(categoryMatch[1], 10);
        item.quantity = sheetQuantity * originalQuantity;
        return;
      }
      
      // 尝试从属性描述中提取数量信息，格式如"A5-200PCS"
      const propertyMatch = properties.match(/[A|a]\d+-(\d+)pcs/i);
      if (propertyMatch) {
        const propertyQuantity = parseInt(propertyMatch[1], 10);
        item.quantity = propertyQuantity * originalQuantity;
        return;
      }
      
      // 如果没有匹配到具体数量，则使用默认值1
      item.quantity = 1 * originalQuantity;
      return;
    }

     // 针对LeZdz店铺的特殊处理逻辑  ---提高了LeZdz店铺优先级
     if (shopName.includes("LeZdz")) {
        // 匹配产品名称中形如"6pcs Personalized"或"6pcsPersonalized"的格式
        const titlePcsMatch = productTitle.match(/^(\d+)pcs/i);
        if (titlePcsMatch) {
          const pcsQuantity = parseInt(titlePcsMatch[1], 10);
          item.quantity = pcsQuantity * originalQuantity;
          return;
        }
      
      
    // 匹配产品名称中形如"2pcs Crown"的格式
      const pcsMatch2= productTitle.match(/^(\d+)\s*pcs/i);
      if (pcsMatch2) {
        const pcsQuantity = parseInt(pcsMatch2[1], 10);
        item.quantity = pcsQuantity * originalQuantity;
        return;
      }

      // 匹配产品名称中形如"定制4件"的格式
      const customPieceMatch = productTitle.match(/定制(\d+)件/i);
      if (customPieceMatch) {
        const pieceQuantity = parseInt(customPieceMatch[1], 10);
        item.quantity = pieceQuantity * originalQuantity;
        return;
      }
      
      // 匹配形如"10pcs-5cm/2in"的格式
      const pcsMatch = properties.match(/(\d+)pcs-\d+cm\/\d+in/i);
      if (pcsMatch) {
        const propertyQuantity = parseInt(pcsMatch[1], 10);
        item.quantity = propertyQuantity * originalQuantity;
        return;
      }
      
      // 匹配标题中形如"DIY 3件"的格式
      const diyMatch = productTitle.match(/diy\s*(\d+)\s*件/i);
      if (diyMatch) {
        const diyQuantity = parseInt(diyMatch[1], 10);
        item.quantity = diyQuantity * originalQuantity;
        return;
      }

      // 当LeZdz店铺的属性描述包含"g Jar Label"或"kg Jar Label"格式时，使用官网数量
      if (properties.match(/\d+g jar label/i) || properties.match(/\d+kg jar label/i)) {
        item.quantity = originalQuantity;
        return;
      }
      
      // 当属性描述包含"Font size"时，使用官网数量，避免将字体大小误认为是制作数量
      if (properties.match(/font\s+size\s+\d+/i)) {
        item.quantity = originalQuantity;
        return;
      }
    }

    // 特殊处理 Text 开头的情况
    if (properties.toLowerCase().startsWith('text')) {
      item.quantity = 1 * originalQuantity
      return
    }

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

    if (properties.includes("多色-s") && shopName.includes("LEKUDZ")) {
      item.quantity = 5 * originalQuantity
      return
    }
    if (properties.includes("多色-m") && shopName.includes("LEKUDZ")) {
      item.quantity = 20 * originalQuantity
      return
    }
    if (properties.includes("多色-l") && shopName.includes("LEKUDZ")) {
      item.quantity = 40 * originalQuantity
      return
    }
    // 针对SJDZ店铺的特殊处理逻辑
    if (shopName.includes("SJDZ")) {
      // 匹配属性描述中形如"5.4in*2.12in-80pcs"的格式
      const dimensionPcsMatch = properties.match(/\d+\.\d+in\*\d+\.\d+in-(\d+)pcs/i);
      if (dimensionPcsMatch) {
        const pcsQuantity = parseInt(dimensionPcsMatch[1], 10);
        item.quantity = pcsQuantity * originalQuantity;
        return;
      }
      
      // 匹配产品名称中形如"【定制】200张"的格式
      const customSheetMatch = productTitle.match(/【定制】(\d+)张/i);
      if (customSheetMatch) {
        const sheetQuantity = parseInt(customSheetMatch[1], 10);
        item.quantity = sheetQuantity * originalQuantity;
        return;
      }
      
      // 当类目名称包含"五件套"时，使用官网数量
      if (item.categoryName && item.categoryName.includes("五件套")) {
        item.quantity = originalQuantity;
        return;
      }

      // 从产品名称中提取数量信息，如"【定制】200pcs/set"中的200
      const titlePcsMatch = productTitle.match(/(\d+)pcs\/set/i);
      if (titlePcsMatch) {
        const propertyQuantity = parseInt(titlePcsMatch[1], 10);
        item.quantity = propertyQuantity * originalQuantity;
        return;
      }
    }

    // 针对LECODZ店铺的特殊处理逻辑
    if (shopName.includes("LECODZ")) {
      // 当属性描述为"7 piece set"时，使用官网数量
      if (properties.trim() === "7 piece set") {
        item.quantity = originalQuantity;
        return;
      }
        // 匹配形如"style1 5pcs"或"style4 5pcs"的格式，提取数量并与官网数量相乘
      const stylePcsMatch = properties.match(/style\s*\d+\s*(\d+)\s*pcs/i);
      if (stylePcsMatch) {
        const propertyQuantity = parseInt(stylePcsMatch[1], 10);
        item.quantity = propertyQuantity * originalQuantity;
        return;
      }
      // 当LECODZ店铺的属性描述为"style 数字"格式时，使用官网数量
      if (properties.match(/style\s*\d+/i)) {
        item.quantity = originalQuantity;
        return;
      }
    }

    // 针对BLDDZ店铺的特殊处理逻辑
    if (shopName.includes("BLDDZ")) {
      // 匹配形如"1.97inch/30片"的格式
      const inchPieceMatch = properties.match(/\d+\.?\d*inch\/(\d+)(片|pcs|个|张)/i);
      if (inchPieceMatch) {
        const pieceQuantity = parseInt(inchPieceMatch[1], 10);
        item.quantity = pieceQuantity * originalQuantity;
        return;
      }

      // 匹配形如"3.15inch/24set"的格式
      const inchSetMatch = properties.match(/\d+\.\d+inch\/(\d+)set/i);
      if (inchSetMatch) {
        const propertyQuantity = parseInt(inchSetMatch[1], 10);
        item.quantity = propertyQuantity * originalQuantity;
        return;
      }
      // 当BLDDZ店铺的属性描述为"style 数字"格式时，使用官网数量
      if (properties.match(/style\s*\d+/i)) {
        item.quantity = originalQuantity;
        return;
      }
    }

    // 针对HZLZDZ店铺的特殊处理逻辑
    if (shopName.includes("HZLZDZ") && properties.match(/style\s*\d+/i)) {
      // 当HZLZDZ店铺的属性描述为"style 数字"格式时，使用官网数量
      item.quantity = originalQuantity;
      return;
    }

    // 针对YPLDZ店铺的特殊处理逻辑 - 放在特殊情况处理之前，确保优先级
    if (shopName.includes("YPLDZ")) {
      // 专门匹配形如"Style5-2pcs"的格式
      let styleMatch = properties.match(/style\d+-(\d+)pcs/i);
      if (styleMatch) {
        const propertyQuantity = parseInt(styleMatch[1], 10);
        item.quantity = propertyQuantity * originalQuantity;
        return;
      }

      // 专门匹配形如"3.54*2.12in-30pcs"的格式
      let pcsMatch = properties.match(/\d+\.\d+[\*x×]\d+\.\d+in-(\d+)pcs/i)

      // 如果上面的特定格式匹配不成功，尝试匹配 -30pcs 或直接 30pcs 这样的格式
      if (!pcsMatch) {
        pcsMatch = properties.match(/[-\s](\d+)[\s\u00A0]*pcs/i)
      }

      // 如果上面的匹配还不成功，尝试更宽松的匹配方式
      if (!pcsMatch) {
        pcsMatch = properties.match(/(\d+)[\s\u00A0]*pcs/i)
      }

      if (pcsMatch) {
        const propertyQuantity = parseInt(pcsMatch[1], 10)
        item.quantity = propertyQuantity * originalQuantity
        return
      }
    }

    if (productTitle.includes("5件") && shopName.includes("QTLK")) {
      item.quantity = 5 * originalQuantity
      return
    }

    // 针对LeTongDZ店铺的特殊处理逻辑
    if (shopName.includes("LeTongDZ")) {
      // 匹配产品名称中形如"个性化10pcs"的格式
      const personalizedMatch = productTitle.match(/个性化(\d+)pcs/i);
      if (personalizedMatch) {
        const pcsQuantity = parseInt(personalizedMatch[1], 10);
        item.quantity = pcsQuantity * originalQuantity;
        return;
      }
    }
    
    // 针对QTLK店铺的特殊处理逻辑
    if (shopName.includes("QTLK")) {
      // 匹配产品名称中形如"【客制化】20pcs"的格式
      const customPcsMatch = productTitle.match(/【客制化】(\d+)pcs/i);
      if (customPcsMatch) {
        const pcsQuantity = parseInt(customPcsMatch[1], 10);
        item.quantity = pcsQuantity * originalQuantity;
        return;
      }

      // 当属性描述为"19.7"时，使用官网数量
      if (properties.trim() === "19.7") {
        item.quantity = originalQuantity;
        return;
      }

      // 匹配形如"style 数字"的格式
      const styleMatch = properties.match(/style\s*(\d+)/i);
      if (styleMatch) {
        // 当属性描述为"style 数字"格式时，使用官网数量
        item.quantity = originalQuantity;
        return;
      }

      // 匹配形如"pink-10pcs"或"green-20pcs"这样的格式
      const colorPcsMatch = properties.match(/[a-z]+-(\d+)pcs/i);
      if (colorPcsMatch) {
        const propertyQuantity = parseInt(colorPcsMatch[1], 10);
        item.quantity = propertyQuantity * originalQuantity;
        return;
      }
    }
   // 针对BLDQT店铺的特殊处理逻辑
   if (shopName.includes("BLDQT")) {
      // 当属性描述为"style 数字"格式时，使用官网数量
      if (properties.match(/^style\s*\d+$/i)) {
        item.quantity = originalQuantity;
        return;
      }
      
      // 匹配形如"6in/3pcs"的格式
      const inPcsMatch = properties.match(/\d+in\/(\d+)pcs/i);
      if (inPcsMatch) {
        const propertyQuantity = parseInt(inPcsMatch[1], 10);
        item.quantity = propertyQuantity * originalQuantity;
        return;
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
      minPrice = singleTotalPrice
      // 然后计算产品最大可以需要几个版面
      let maxLayoutCount = Math.ceil((item.quantity / (priceRule.singleLayoutCount as number)) as number)
      for (let index = 1; index <= maxLayoutCount; index++) {
        let currentTotalPrice = 0
        let remainPrice = 0
        // 当前整版的价格
        let currentLayoutTotalPrice = calcLayoutUnitPrice(index) * index;
        //检查是是否存在剩余的单个产品 没有就是0  有就加上单个产品*价格
        let remainder = item.quantity - index * (priceRule.singleLayoutCount as number)
        if (remainder > 0) {
          remainPrice = priceRule.singlePrice as number * remainder
        } else {
          remainPrice = 0
        }
        currentTotalPrice = currentLayoutTotalPrice + remainPrice
        if (currentTotalPrice <= minPrice) {
          minPrice = currentTotalPrice
          console.log(`产品数量${item.quantity},
         方案1(直接按产品计价)：按单个单品价格算是${singleTotalPrice},
         方案2(购买版面+产品)：购买${index}个版面完成制作${index * (priceRule.singleLayoutCount as number)}个产品花费价格：${index * calcLayoutUnitPrice(index)},
         剩余${remainder}个产品
         价格是${remainder > 0 ? priceRule.singlePrice as number * remainder : 0},
         方案2总价是:${currentTotalPrice},由版面总价${currentLayoutTotalPrice}+剩余产品的总价${remainPrice}组成,

        `)
        }

      }
      return minPrice / item.quantity || 0
    }
    return 0
  }
})
// 传入订单数据
const setOrderList = async (list: any[]) => {
  let newList = _.cloneDeep(list)
  filterOrderQuantity(newList)
  formData.orderList = newList
  
  // 检查SKU确认状态
  await checkSkuConfirmation(formData.orderList)
}
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})
const dialogVisible = ref(false)
const loading = ref(false)
const formData = reactive({
  orderList: [] as any[]
})
const confirmedSkuListVisible = ref(false)

const handleClose = () => {
  dialogVisible.value = false
}
const handleConfirm = () => {
  if (formEl && formEl.value) {
    formEl.value.validate(async (valid) => {
      if (valid) {
        loading.value = true
        ElMessage({
          message: '正在处理订单中，请稍等...',
          type: 'info',
          duration: 0,
          showClose: true
        })
        try {
          await OrderApi.batchCreateOrder(
            formData.orderList.map((item) => {
              return {
                id: item.id,
                quantity: item.quantity
              }
            })
          )
          ElMessage.closeAll()
          ElMessage.success('操作成功')
          emit('confirm')
          dialogVisible.value = false
        } catch (error) {
          ElMessage.closeAll()
          ElMessage.error('操作失败')
        } finally {
          loading.value = false
        }
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
// SKU确认相关方法
const handleConfirmSku = (item: any) => {
  ElMessageBox.confirm('确认将该SKU标记为已确认状态吗？', '确认', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await SkuConfirmationApi.confirm({ orderId: item.id })
      ElMessage.success('SKU确认成功')
      item.skuConfirmed = true
    } catch (error) {
      ElMessage.error('SKU确认失败')
    }
  }).catch(() => {})
}

// 打开已确认SKU列表弹窗
const openConfirmedSkuList = () => {
  confirmedSkuListVisible.value = true
}

// 处理已确认SKU列表弹窗关闭
const handleConfirmedSkuListClose = () => {
  confirmedSkuListVisible.value = false
}

// 检查SKU是否已确认
const checkSkuConfirmation = async (orderList: any[]) => {
  for (const item of orderList) {
    if (item.shopId && item.sku) {
      try {
        const result = await SkuConfirmationApi.checkConfirmation({
          shopId: item.shopId,
          sku: item.sku
        })
        item.skuConfirmed = !!result
      } catch (error) {
        console.error('检查SKU确认状态失败', error)
        item.skuConfirmed = false
      }
    } else {
      item.skuConfirmed = false
    }
  }
}

// 检查SKU确认状态方法已合并到setOrderList中

// 组件对外暴露方法
defineExpose({
  setOrderList
})
</script>

<style scoped lang="scss"></style>

<!-- 已确认SKU列表弹窗 -->
<ConfirmedSkuListPopup
  v-model="confirmedSkuListVisible"
  :visible="confirmedSkuListVisible"
  @visible-event="handleConfirmedSkuListClose"
  @confirm="checkSkuConfirmation(formData.orderList)"
/>
