const db = require('../../utils/db.js');
const app = getApp();

Page({
  data: {
    posts: []
  },

  onShow() {
    this.loadPosts();
  },

  async loadPosts() {
    wx.showLoading({ title: '加载中...' });
    try {
      const userInfo = app.globalData.userInfo || {};
      const userId = userInfo._id || '';
      const postsRaw = await db.getMyPosts(userId);
      
      // 收集所有图片和视频封面 fileID
      const allFileIDs = [];
      postsRaw.forEach(p => {
        if (p.images && p.images.length > 0) {
          allFileIDs.push(...p.images);
        }
        // 收集视频封面
        if (p.videoCover) {
          allFileIDs.push(p.videoCover);
        }
      });
      
      // 批量获取临时链接
      let fileUrlMap = {};
      if (allFileIDs.length > 0) {
        try {
          const tempUrls = await db.getImageUrls(allFileIDs);
          allFileIDs.forEach((id, index) => {
            fileUrlMap[id] = tempUrls[index] || id;
          });
        } catch (e) {
          console.error('获取临时链接失败:', e);
        }
      }
      
      // 替换图片链接和视频封面
      const posts = postsRaw.map(p => ({
        ...p,
        id: p._id,
        images: (p.images || []).map(img => fileUrlMap[img] || img),
        videoCover: fileUrlMap[p.videoCover] || p.videoCover || '',
        // 计算视频时长文本
        videoDurationText: p.videoDuration ? 
          (Math.floor(p.videoDuration / 60) > 0 ? 
            `${Math.floor(p.videoDuration / 60)}:${(p.videoDuration % 60).toString().padStart(2, '0')}` : 
            `0:${p.videoDuration.toString().padStart(2, '0')}`) : ''
      }));
      
      this.setData({ posts });
    } catch (err) {
      console.error('加载动态失败:', err);
    }
    wx.hideLoading();
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/post-detail/post-detail?id=${id}` });
  },

  goPublish() {
    wx.navigateTo({ url: '/pages/publish/publish' });
  },

  deletePost(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除动态',
      content: '确定要删除这条动态吗？',
      confirmColor: '#FF4D4F',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' });
          const success = await db.deletePost(id);
          wx.hideLoading();
          if (success) {
            wx.showToast({ title: '删除成功', icon: 'success' });
            this.loadPosts();
          } else {
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  }
});
