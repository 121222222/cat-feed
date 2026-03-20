const app = getApp();

Page({
  data: {
    cats: []
  },

  onLoad() {
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
          const cats = this.data.cats.filter(c => c.id !== e.currentTarget.dataset.id);
          this.setData({ cats });
          wx.showToast({ title: '已删除', icon: 'success' });
        }
      }
    });
  }
});
