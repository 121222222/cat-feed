Page({
  data: {
    drafts: []
  },

  onShow() {
    this.loadDrafts();
  },

  loadDrafts() {
    // 从本地存储加载草稿
    // 支持单个草稿和多个草稿
    const singleDraft = wx.getStorageSync('postDraft');
    const multipleDrafts = wx.getStorageSync('postDrafts') || [];
    
    let drafts = [...multipleDrafts];
    
    // 如果存在单个草稿，合并进来
    if (singleDraft && singleDraft.time) {
      // 检查是否已存在相同时间的草稿
      const exists = drafts.some(d => d.time === singleDraft.time);
      if (!exists) {
        drafts.push(singleDraft);
      }
    }
    
    // 按时间排序（最新在前）
    drafts.sort((a, b) => (b.time || 0) - (a.time || 0));
    
    // 格式化时间显示
    drafts = drafts.map(draft => ({
      ...draft,
      timeStr: this.formatTime(draft.time)
    }));
    
    this.setData({ drafts });
  },

  formatTime(timestamp) {
    if (!timestamp) return '未知时间';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // 1分钟内
    if (diff < 60 * 1000) {
      return '刚刚';
    }
    // 1小时内
    if (diff < 60 * 60 * 1000) {
      return Math.floor(diff / (60 * 1000)) + '分钟前';
    }
    // 24小时内
    if (diff < 24 * 60 * 60 * 1000) {
      return Math.floor(diff / (60 * 60 * 1000)) + '小时前';
    }
    // 超过24小时，显示日期
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    return `${month}月${day}日 ${hour}:${minute}`;
  },

  editDraft(e) {
    const index = e.currentTarget.dataset.index;
    const draft = this.data.drafts[index];
    
    if (!draft) return;
    
    // 将当前草稿存储为正在编辑的草稿
    wx.setStorageSync('editingDraft', draft);
    wx.setStorageSync('editingDraftIndex', index);
    
    // 跳转到发布页面
    wx.navigateTo({
      url: '/pages/publish/publish?fromDraft=true'
    });
  },

  deleteDraft(e) {
    const index = e.currentTarget.dataset.index;
    const draft = this.data.drafts[index];
    
    wx.showModal({
      title: '删除草稿',
      content: '确定要删除这份草稿吗？',
      confirmColor: '#FF4D4F',
      success: (res) => {
        if (res.confirm) {
          // 更新草稿列表
          const drafts = [...this.data.drafts];
          drafts.splice(index, 1);
          
          // 更新本地存储
          // 移除单个草稿存储
          const singleDraft = wx.getStorageSync('postDraft');
          if (singleDraft && singleDraft.time === draft.time) {
            wx.removeStorageSync('postDraft');
          }
          
          // 更新多草稿存储
          const multipleDrafts = wx.getStorageSync('postDrafts') || [];
          const newMultipleDrafts = multipleDrafts.filter(d => d.time !== draft.time);
          wx.setStorageSync('postDrafts', newMultipleDrafts);
          
          this.setData({ drafts });
          wx.showToast({ title: '已删除', icon: 'success' });
        }
      }
    });
  },

  goPublish() {
    wx.navigateTo({ url: '/pages/publish/publish' });
  }
});
