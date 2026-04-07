App({
  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'cloud1-9gefok5210204284',
        traceUser: true
      });
    }

    // 检查登录状态
    const isLoggedIn = wx.getStorageSync('isLoggedIn');
    if (isLoggedIn) {
      this.globalData.isLoggedIn = true;
      // 从云数据库加载用户信息
      this.loadUserFromCloud();
    }
  },

  globalData: {
    userInfo: null,
    isLoggedIn: false,
    baseUrl: 'https://api.example.com'
  },

  /** 从云数据库加载当前用户信息 */
  async loadUserFromCloud() {
    const db = require('./utils/db.js');
    const user = await db.getCurrentUser();
    if (user) {
      this.globalData.userInfo = user;
    }
  },

  // 检查登录状态，未登录则跳转登录页
  checkLogin() {
    if (!this.globalData.isLoggedIn) {
      wx.redirectTo({ url: '/pages/login/login' });
      return false;
    }
    return true;
  },

  // 检查房间号是否已验证（用于需要身份验证的功能）
  checkRoomVerified(showTip = true) {
    const userInfo = this.globalData.userInfo;
    
    // 未登录
    if (!this.globalData.isLoggedIn || !userInfo) {
      if (showTip) {
        wx.showModal({
          title: '请先登录',
          content: '您需要登录后才能使用此功能',
          confirmText: '去登录',
          confirmColor: '#FFBAA3',
          success: (res) => {
            if (res.confirm) {
              wx.redirectTo({ url: '/pages/login/login' });
            }
          }
        });
      }
      return false;
    }
    
    // 已登录但房间号未验证
    if (!userInfo.roomVerified) {
      if (showTip) {
        wx.showModal({
          title: '身份验证',
          content: '您需要绑定有效的公寓房间号才能使用此功能，请完善您的公寓信息。',
          confirmText: '去绑定',
          confirmColor: '#FFBAA3',
          success: (res) => {
            if (res.confirm) {
              wx.navigateTo({ url: '/pages/bind-room/bind-room' });
            }
          }
        });
      }
      return false;
    }
    
    return true;
  },

  // 登录成功后调用
  async loginSuccess(userInfo) {
    const db = require('./utils/db.js');
    // 尝试获取已有用户
    let user = await db.getCurrentUser();
    if (!user) {
      // 新用户，创建记录
      user = await db.createUser(userInfo || {
        name: '新用户',
        avatar: '',
        dormitory: '',
        phone: '',
        certified: false,
        catExperience: '',
        roomVerified: false
      });
    }
    this.globalData.isLoggedIn = true;
    this.globalData.userInfo = user;
    wx.setStorageSync('isLoggedIn', true);
  },

  // 更新 TabBar 的未读消息数（供各页面调用）
  async updateTabBarMsgCount(tabBar) {
    if (!this.globalData.isLoggedIn || !this.globalData.userInfo) {
      if (tabBar) {
        tabBar.setData({ msgCount: 0 });
      }
      return;
    }

    try {
      const db = require('./utils/db.js');
      const currentUser = this.globalData.userInfo;
      const currentUserId = currentUser._id || currentUser.openid || '';
      
      if (!currentUserId) {
        if (tabBar) tabBar.setData({ msgCount: 0 });
        return;
      }

      // 获取聊天会话未读数
      let chatUnread = 0;
      try {
        const res = await wx.cloud.callFunction({
          name: 'chatService',
          data: {
            action: 'getConversations',
            data: { userId: currentUserId }
          }
        });
        if (res.result && res.result.success) {
          const conversations = res.result.data || [];
          conversations.forEach(conv => {
            const unreadCount = conv.unreadCount ? (conv.unreadCount[currentUserId] || 0) : 0;
            chatUnread += unreadCount;
          });
        }
      } catch (err) {
        // 降级方案：使用本地方法
        const conversations = await db.getMyConversations(currentUserId);
        conversations.forEach(conv => {
          const unreadCount = conv.unreadCount ? (conv.unreadCount[currentUserId] || 0) : 0;
          chatUnread += unreadCount;
        });
      }

      // 获取系统消息未读数
      let sysUnread = 0;
      try {
        const messages = await db.getMyMessages();
        sysUnread = messages.filter(msg => (msg.type === 'system' || !msg.type) && !msg.read).length;
      } catch (err) {
        console.error('获取系统消息失败:', err);
      }

      const totalUnread = chatUnread + sysUnread;
      
      if (tabBar) {
        tabBar.setData({ msgCount: totalUnread });
      }
      
      // 同时存到全局变量，便于其他地方使用
      this.globalData.unreadMsgCount = totalUnread;
    } catch (err) {
      console.error('更新未读消息数失败:', err);
      if (tabBar) tabBar.setData({ msgCount: 0 });
    }
  }
});
