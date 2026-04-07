const app = getApp();
const db = require('../../utils/db.js');

Page({
  data: {
    help: {},
    isOwner: false  // 是否是自己发布的
  },

  onLoad(options) {
    if (options.id) {
      this.loadHelp(options.id);
    }
  },

  async loadHelp(helpId) {
    wx.showLoading({ title: '加载中...' });
    try {
      const help = await db.getHelpById(helpId);
      if (help) {
        // 判断是否是自己发布的
        const userInfo = app.globalData.userInfo || {};
        const currentUserId = userInfo._id || '';
        const isOwner = currentUserId && help.userId && currentUserId === help.userId;
        
        // 如果是自己发布的，使用当前最新的用户昵称和头像
        if (isOwner) {
          help.userName = userInfo.name || help.userName || '微信用户';
          help.userAvatar = userInfo.avatar || help.userAvatar || '';
        }
        
        this.setData({
          help: { ...help, id: help._id },
          isOwner: isOwner
        });
      }
    } catch (err) {
      console.error('加载互助详情失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
    wx.hideLoading();
  },

  copyContact() {
    const contact = this.data.help.contact;
    if (contact) {
      wx.setClipboardData({
        data: contact,
        success: () => {
          wx.showToast({ title: '已复制', icon: 'success' });
        }
      });
    }
  },

  onMessage() {
    const help = this.data.help;
    const app = getApp();
    
    // 检查登录状态
    if (!app.globalData.isLoggedIn) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再发起私信',
        confirmText: '去登录',
        confirmColor: '#FFBAA3',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/login/login' });
          }
        }
      });
      return;
    }
    
    // 不能给自己发私信
    const currentUser = app.globalData.userInfo;
    if (currentUser && (currentUser._id === help.userId || currentUser._id === help._openid)) {
      wx.showToast({ title: '不能给自己发私信', icon: 'none' });
      return;
    }
    
    // 跳转到聊天页面，传递对方用户信息
    wx.navigateTo({ 
      url: `/pages/chat/chat?targetId=${help.userId || help._openid}&targetName=${encodeURIComponent(help.userName || '用户')}&targetAvatar=${encodeURIComponent(help.userAvatar || '')}&from=help&helpId=${help._id}` 
    });
  },

  onContact() {
    const help = this.data.help;
    const contact = help.contact;
    const location = help.location;
    
    if (contact) {
      let content = contact;
      if (location) {
        content = `楼栋: ${location}\n联系方式: ${contact}`;
      }
      
      wx.showModal({
        title: '联系方式',
        content: content,
        confirmText: '复制',
        success: (res) => {
          if (res.confirm) {
            wx.setClipboardData({
              data: contact,
              success: () => {
                wx.showToast({ title: '已复制联系方式', icon: 'success' });
              }
            });
          }
        }
      });
    } else {
      wx.showToast({ title: '暂无联系方式', icon: 'none' });
    }
  },

  onShareAppMessage() {
    return {
      title: this.data.help.title,
      path: `/pages/help-detail/help-detail?id=${this.data.help.id}`
    };
  },

  // 删除自己发布的互助
  onDeleteHelp() {
    const that = this;
    wx.showModal({
      title: '确认删除',
      content: '删除后不可恢复，确定要删除这条互助信息吗？',
      confirmColor: '#FF6B6B',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' });
          try {
            const success = await db.deleteHelp(that.data.help._id);
            if (success) {
              wx.showToast({ title: '已删除', icon: 'success' });
              setTimeout(() => {
                wx.navigateBack();
              }, 1500);
            } else {
              wx.showToast({ title: '删除失败', icon: 'none' });
            }
          } catch (err) {
            console.error('删除失败:', err);
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
          wx.hideLoading();
        }
      }
    });
  }
});
