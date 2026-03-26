const app = getApp();
const db = require('../../utils/db.js');
const util = require('../../utils/util.js');

Page({
  data: {
    userInfo: {},
    cats: [],
    catCount: 0,
    myNeeds: [],
    statusCount: { pending: 0, accepted: 0, in_progress: 0, completed: 0 }
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 });
    }
    // 每次显示时重新加载数据
    this.loadData();
  },

  async loadData() {
    const userInfo = app.globalData.userInfo || {};

    // 并行加载猫咪和需求数据
    const [catsRaw, needsList] = await Promise.all([
      db.getMyCats(),
      db.getMyNeeds()
    ]);
    const cats = catsRaw.map(c => ({ ...c, id: c._id }));

    const myNeeds = needsList.map(n => ({
      ...n,
      id: n._id,
      statusText: util.getStatusText(n.status)
    }));

    const statusCount = {
      pending: myNeeds.filter(n => n.status === 'pending').length,
      accepted: myNeeds.filter(n => n.status === 'accepted').length,
      in_progress: myNeeds.filter(n => n.status === 'in_progress').length,
      completed: myNeeds.filter(n => n.status === 'completed').length
    };

    this.setData({
      userInfo,
      cats,
      catCount: cats.length,
      myNeeds,
      statusCount
    });
  },

  onChangeAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: async (res) => {
        const avatarPath = res.tempFiles[0].tempFilePath;
        wx.showLoading({ title: '上传中...' });
        // 上传到云存储
        const fileID = await db.uploadImage(avatarPath, `avatars/${Date.now()}.jpg`);
        wx.hideLoading();
        if (fileID) {
          this.setData({ 'userInfo.avatar': fileID });
          // 同步到云数据库
          const userId = app.globalData.userInfo._id;
          if (userId) {
            await db.updateUser(userId, { avatar: fileID });
            app.globalData.userInfo.avatar = fileID;
          }
        }
      }
    });
  },

  goMyCats() {
    wx.navigateTo({ url: '/pages/my-cats/my-cats' });
  },

  goAddCat() {
    wx.navigateTo({ url: '/pages/add-cat/add-cat' });
  },

  goMyNeeds() {
    wx.navigateTo({ url: '/pages/my-needs/my-needs' });
  },

  goMyApplies() {
    wx.navigateTo({ url: '/pages/my-applies/my-applies' });
  },

  goAuth() {
    wx.navigateTo({ url: '/pages/auth/auth' });
  },

  goRating() {
    wx.showToast({ title: '评价功能开发中', icon: 'none' });
  },

  goProfile() {
    wx.navigateTo({ url: '/pages/profile/profile' });
  },

  goSettings() {
    wx.navigateTo({ url: '/pages/settings/settings' });
  },

  goHelp() {
    wx.navigateTo({ url: '/pages/help/help' });
  },

  goNeedDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/need-detail/need-detail?id=${id}` });
  }
});
