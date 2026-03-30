const app = getApp();
const db = require('../../utils/db.js');

Page({
  data: {
    content: '',
    photos: []
  },

  onLoad() {
    // 页面加载
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value });
  },

  // 选择照片
  choosePhoto() {
    const that = this;
    const remainCount = 3 - this.data.photos.length;
    if (remainCount <= 0) {
      wx.showToast({ title: '最多上传3张照片', icon: 'none' });
      return;
    }
    wx.chooseMedia({
      count: remainCount,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success(res) {
        const newPhotos = res.tempFiles.map(f => f.tempFilePath);
        that.setData({
          photos: [...that.data.photos, ...newPhotos]
        });
      }
    });
  },

  // 预览照片
  previewPhoto(e) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({
      current: url,
      urls: this.data.photos
    });
  },

  // 删除照片
  deletePhoto(e) {
    const index = e.currentTarget.dataset.index;
    const photos = this.data.photos;
    photos.splice(index, 1);
    this.setData({ photos });
  },

  async onSubmit() {
    const { content, photos } = this.data;

    // 校验
    if (!content.trim()) {
      wx.showToast({ title: '请输入内容', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认发布',
      content: '确认发布这条动态吗？',
      confirmColor: '#FFBAA3',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '发布中...', mask: true });

          try {
            let mediaUrls = [];

            // 上传照片（如果有）
            if (photos.length > 0) {
              for (let i = 0; i < photos.length; i++) {
                wx.showLoading({ title: `上传图片 ${i + 1}/${photos.length}`, mask: true });
                const fileID = await db.uploadImage(photos[i], `talks/${Date.now()}-${i}.jpg`);
                if (fileID) mediaUrls.push(fileID);
              }
            }

            const userInfo = app.globalData.userInfo || {};

            // 创建动态
            const postData = {
              title: content.trim().substring(0, 30),  // 取前30字作为标题
              content: content.trim(),
              mediaType: 'image',
              images: mediaUrls,
              video: '',
              videoCover: '',
              videoDuration: 0,
              category: 'talk',  // 交流类别
              catId: '',
              catName: '',
              topics: [],
              visibility: 'public',
              userId: userInfo._id || '',
              userName: userInfo.name || '匿名',
              userAvatar: userInfo.avatar || '',
              imgRatio: 100,
              postType: 'talk'  // 标记为交流帖子
            };

            const postId = await db.addPost(postData);

            wx.hideLoading();

            if (postId) {
              wx.showToast({ title: '发布成功！', icon: 'success' });
              setTimeout(() => {
                wx.navigateBack();
              }, 1500);
            } else {
              wx.showToast({ title: '发布失败', icon: 'none' });
            }
          } catch (err) {
            wx.hideLoading();
            console.error('发布失败:', err);
            wx.showToast({ title: '发布失败，请重试', icon: 'none' });
          }
        }
      }
    });
  }
});
