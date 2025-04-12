import request from "@/config/axios";

export const UserApi = {
  // 查询店铺分页
  bindShop: async (data: any) => {
    return await request.post({ url: `/temu/user/bind-shop`, data })
  },

}
