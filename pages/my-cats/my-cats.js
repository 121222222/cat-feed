const app = getApp();

Page({
  data: {
    cats: []
  },

  onLoad() {
    this.loadCats();
  },

  onShow() {
    // 每次返回时重新加载（添加/编辑猫咪后刷新）
    this.loadCats();
  },

  loadCats() {
    this.setData({ cats: app.globalData.mockCats });
  },

  goAddCat() {
    wx.navigateTo({ url: '/pages/add-cat/add-cat' });
  },

  onEdit(e) {
    wx.navigateTo({ url: `/pages/add-cat/add-cat?id=${e.currentTarget.dataset.id}` });
  },

  onDelete(e) {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这只猫咪信息吗？',
      confirmColor: '#FF4D4F',
      success: (res) => {
        if (res.confirm) {
          const id = e.currentTarget.dataset.id;
          // 从全局数据中删除
          app.globalData.mockCats = app.globalData.mockCats.filter(c => c.id !== id);
          this.setData({ cats: app.globalData.mockCats });
          wx.showToast({ title: '已删除', icon: 'success' });
        }
      }
    });
  }
});
