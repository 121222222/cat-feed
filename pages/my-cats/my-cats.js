const db = require('../../utils/db.js');

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

  async loadCats() {
    const cats = await db.getMyCats();
    this.setData({ cats: cats.map(c => ({ ...c, id: c._id })) });
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
      success: async (res) => {
        if (res.confirm) {
          const id = e.currentTarget.dataset.id;
          wx.showLoading({ title: '删除中...' });
          const ok = await db.deleteCat(id);
          wx.hideLoading();
          if (ok) {
            wx.showToast({ title: '已删除', icon: 'success' });
            this.loadCats();
          } else {
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  }
});
