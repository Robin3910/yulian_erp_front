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
  //获取角色标识符关联的用户
  getUserListByRoleKey: async (roleCode: string) => {
    return await request.get({
      url: `/temu/common/role/get-user-by-role-code`,
      params: { roleCode }
    })
  }
}
