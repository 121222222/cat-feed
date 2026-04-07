const app = getApp();
const db = require('../../utils/db.js');

// 管理员手机号列表（可配置）
const ADMIN_PHONES = ['15235682953', '15257082563'];

Page({
  data: {
    userInfo: {},
    cats: [],
    catCount: 0,
    postCount: 0,
    likeCount: 0,
    isAdmin: false,
    draftCount: 0,
    isLoggedIn: false
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 });
      // 更新 TabBar 未读消息数
      app.updateTabBarMsgCount(this.getTabBar());
    }
    
    // 检查登录状态
    const isLoggedIn = app.globalData.isLoggedIn;
    this.setData({ isLoggedIn });
    
    if (isLoggedIn) {
      this.loadData();
    }
  },

  // 跳转登录
  goLogin() {
    wx.navigateTo({ url: '/pages/login/login' });
  },

  async loadData() {
    wx.showLoading({ title: '加载中...' });
    try {
      const userInfo = app.globalData.userInfo || {};
      const userId = userInfo._id || '';
      
      // 判断是否是管理员
      const isAdmin = ADMIN_PHONES.includes(userInfo.phone);
      
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

      // 计算草稿数量
      let draftCount = 0;
      const singleDraft = wx.getStorageSync('postDraft');
      const multipleDrafts = wx.getStorageSync('postDrafts') || [];
      if (singleDraft && singleDraft.time) {
        draftCount = 1;
      }
      draftCount += multipleDrafts.length;

      this.setData({
        userInfo,
        cats,
        catCount: cats.length,
        postCount: postsRaw.length,
        likeCount,
        isAdmin,
        draftCount
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

  goMyDrafts() {
    wx.navigateTo({ url: '/pages/my-drafts/my-drafts' });
  },

  goMyHelps() {
    wx.navigateTo({ url: '/pages/my-needs/my-needs' });
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
  },

  goAdmin() {
    wx.navigateTo({ url: '/pages/admin/admin' });
  },

  onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      confirmColor: '#FF6B6B',
      success: (res) => {
        if (res.confirm) {
          // 清除登录状态
          app.globalData.isLoggedIn = false;
          app.globalData.userInfo = null;
          wx.removeStorageSync('isLoggedIn');
          wx.removeStorageSync('userInfo');
          
          wx.showToast({ title: '已退出登录', icon: 'success' });
          
          // 退出后跳转到首页（而非登录页），用户可以继续浏览
          setTimeout(() => {
            wx.switchTab({ url: '/pages/index/index' });
          }, 1500);
        }
      }
    });
  }
});
