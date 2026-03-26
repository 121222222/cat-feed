const app = getApp();
const db = require('../../utils/db.js');

Page({
  data: {
    userInfo: {}
  },

  onLoad() {
    this.setData({ userInfo: { ...(app.globalData.userInfo || {}) } });
  },

  onChangeAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: async (res) => {
        const tempPath = res.tempFiles[0].tempFilePath;
        wx.showLoading({ title: '上传中...' });
        const fileID = await db.uploadImage(tempPath, `avatars/${Date.now()}.jpg`);
        wx.hideLoading();
        if (fileID) {
          this.setData({ 'userInfo.avatar': fileID });
        } else {
          this.setData({ 'userInfo.avatar': tempPath });
        }
      }
    });
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`userInfo.${field}`]: e.detail.value });
  },

  async onSave() {
    const { userInfo } = this.data;
    const userId = app.globalData.userInfo && app.globalData.userInfo._id;
    if (userId) {
      wx.showLoading({ title: '保存中...' });
      const ok = await db.updateUser(userId, {
        name: userInfo.name,
        avatar: userInfo.avatar,
        dormitory: userInfo.dormitory,
        phone: userInfo.phone,
        catExperience: userInfo.catExperience
      });
      wx.hideLoading();
      if (ok) {
        // 同步到全局
        Object.assign(app.globalData.userInfo, userInfo);
        wx.showToast({ title: '保存成功', icon: 'success' });
        setTimeout(() => wx.navigateBack(), 1000);
      } else {
        wx.showToast({ title: '保存失败', icon: 'none' });
      }
    } else {
      wx.showToast({ title: '用户信息异常', icon: 'none' });
    }
  }
});
