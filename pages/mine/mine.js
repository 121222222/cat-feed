const app = getApp();
const db = require('../../utils/db.js');

Page({
  data: {
    userInfo: {},
    cats: [],
    catCount: 0,
    postCount: 0,
    likeCount: 0
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 });
    }
    this.loadData();
  },

  async loadData() {
    wx.showLoading({ title: '加载中...' });
    try {
      const userInfo = app.globalData.userInfo || {};
      const userId = userInfo._id || '';
      
      // 并行加载猫咪和动态数据
      const [catsRaw, postsRaw] = await Promise.all([
        db.getMyCats(),
        db.getMyPosts(userId)
      ]);
      const cats = catsRaw.map(c => ({ ...c, id: c._id }));
      
      // 计算获赞总数
      let likeCount = 0;
      postsRaw.forEach(p => {
        likeCount += (p.likes || 0);
      });

      this.setData({
        userInfo,
        cats,
        catCount: cats.length,
        postCount: postsRaw.length,
        likeCount
      });
    } catch (err) {
      console.error('加载数据失败:', err);
    }
    wx.hideLoading();
  },

  onChangeAvatar() {
    wx.navigateTo({ url: '/pages/profile/profile' });
  },

  goMyCats() {
    wx.navigateTo({ url: '/pages/my-cats/my-cats' });
  },

  goAddCat() {
    wx.navigateTo({ url: '/pages/add-cat/add-cat' });
  },

  goMyPosts() {
    wx.navigateTo({ url: '/pages/my-posts/my-posts' });
  },

  goMyHelps() {
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },

  goMyLikes() {
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },

  goProfile() {
    wx.navigateTo({ url: '/pages/profile/profile' });
  },

  goSettings() {
    wx.navigateTo({ url: '/pages/settings/settings' });
  },

  goHelp() {
    wx.navigateTo({ url: '/pages/help/help' });
  }
});
