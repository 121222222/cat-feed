const app = getApp();
const db = require('../../utils/db.js');

Page({
  data: {
    help: {}
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
        this.setData({
          help: { ...help, id: help._id }
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
    // 跳转到聊天页面
    wx.navigateTo({ 
      url: `/pages/chat/chat?id=${help.userId || help._id}&name=${help.userName || '用户'}` 
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
  }
});
