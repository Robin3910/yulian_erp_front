import request from '@/config/axios'

// OSS API
export const OssApi = {
  // 上传文件到OSS
  uploadFile: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return await request.post({ 
      url: '/temu/oss/upload', 
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
} 