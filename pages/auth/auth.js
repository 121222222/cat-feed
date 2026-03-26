const app = getApp();
const db = require('../../utils/db.js');

Page({
  data: {
    certified: false
  },

  onLoad() {
    const userInfo = app.globalData.userInfo || {};
    this.setData({ certified: userInfo.certified || false });
  },

  async onSubmit() {
    wx.showModal({
      title: '提交认证',
      content: '认证信息提交后将由管理员审核，预计1-3个工作日内完成',
      confirmColor: '#FFBAA3',
      success: async (res) => {
        if (res.confirm) {
          const userId = app.globalData.userInfo && app.globalData.userInfo._id;
          if (userId) {
            await db.updateUser(userId, { certSubmitted: true });
          }
          wx.showToast({ title: '提交成功，请等待审核', icon: 'none' });
        }
      }
    });
  }
});
