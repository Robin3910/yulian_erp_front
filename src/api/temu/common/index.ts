import request from '@/config/axios'
//产品分类api
export const TemuCommonApi = {
  // 查询产品分类列表
  getProductCategoryList: async () => {
    return await request.get({ url: `/temu/common/category/list` })
  },
  // 获取无分页店铺列表
  getShopList: async () => {
    const data=await request.get({ url: `/temu/common/shop/list` })

    if(data&&data.list&&data.list.length>0){
      data.list.forEach((item:any) => {
        if(item.aliasName){
          item.shopName=`【${item.aliasName}】`+item.shopName;
        }
      });
    }

    return  data;
  },
  // 分页查询店铺列表
  getShopPage: async (params: {
    pageNum: number;
    pageSize: number;
    shopName?: string;
    platform?: string;
  }) => {
    return await request.get({ 
      url: `/temu/common/temu-open-api/shopapi/page`,
      params 
    })
  },
  // 新增店铺
  addShop: async (data: {
    shopName: string;
    shopId: string;
    token: string;
    owner: string;
    platform: string;
    appKey: string;
    appSecret: string;
  }) => {
    return await request.post({ 
      url: `/temu/common/temu-open-api/shopapi`,
      data 
    })
  },
  //获取角色标识符关联的用户
  getUserListByRoleKey: async (roleCode: string) => {
    return await request.get({
      url: `/temu/common/role/get-user-by-role-code`,
      params: { roleCode }
    })
  },
  // 查询物流发货单列表
  logisticsQuery: async (params: {
    pageNo: number;
    pageSize: number;
  }) => {
    return await request.post({
      url: `/temuApi/delivery/page`,
      data: params  // 修改这里，将 params 改为 data，确保参数通过请求体发送
    })
  },
  // 打印物流面单
  printDeliveryLabel: async (deliveryNo: string) => {
    const res = await request.postOriginal({
      url: `/temuApi/delivery/boxmark/print`,
      data: {
        deliveryOrderSnList: deliveryNo.split(',')
      }
    })
    return res.data
  },
  // 打印商品条码
  printProductBarcode: async (productSkuIds: number[]) => {
    const res = await request.postOriginal({
      url: `/temuApi/delivery/custom-label/print`,
      data: {
        personalProductSkuIdList: productSkuIds
      }
    })
    return res.data
  }
}
