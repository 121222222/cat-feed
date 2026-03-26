const db = require('../../utils/db.js');

Page({
  data: {
    isEdit: false,
    editId: '',
    form: {
      avatar: '',
      name: '',
      breed: '',
      age: '',
      gender: '公',
      vaccinated: true,
      character: '',
      notes: ''
    }
  },

  async onLoad(options) {
    if (options.id) {
      this.setData({ isEdit: true, editId: options.id });
      wx.setNavigationBarTitle({ title: '编辑猫咪' });
      // 从云数据库加载猫咪数据
      const cat = await db.getCatById(options.id);
      if (cat) {
        this.setData({
          form: {
            avatar: cat.avatar || '',
            name: cat.name || '',
            breed: cat.breed || '',
            age: cat.age || '',
            gender: cat.gender || '公',
            vaccinated: cat.vaccinated !== false,
            character: cat.character || '',
            notes: cat.notes || ''
          }
        });
      }
    }
  },

  onChoosePhoto() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: async (res) => {
        const tempPath = res.tempFiles[0].tempFilePath;
        wx.showLoading({ title: '上传中...' });
        const fileID = await db.uploadImage(tempPath, `cats/${Date.now()}.jpg`);
        wx.hideLoading();
        if (fileID) {
          this.setData({ 'form.avatar': fileID });
        } else {
          // 上传失败，使用本地路径（仅预览）
          this.setData({ 'form.avatar': tempPath });
        }
      }
    });
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  setGender(e) {
    this.setData({ 'form.gender': e.currentTarget.dataset.gender });
  },

  onSwitch(e) {
    this.setData({ 'form.vaccinated': e.detail.value });
  },

  async onSave() {
    const { form, isEdit, editId } = this.data;
    if (!form.name) {
      wx.showToast({ title: '请输入猫咪名字', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '保存中...' });

    if (isEdit) {
      // 编辑模式：更新云数据库
      const ok = await db.updateCat(editId, {
        avatar: form.avatar,
        name: form.name,
        breed: form.breed,
        age: form.age,
        gender: form.gender,
        vaccinated: form.vaccinated,
        character: form.character,
        notes: form.notes
      });
      wx.hideLoading();
      if (ok) {
        wx.showToast({ title: '保存成功！', icon: 'success' });
        setTimeout(() => wx.navigateBack(), 1500);
      } else {
        wx.showToast({ title: '保存失败', icon: 'none' });
      }
    } else {
      // 新增模式：添加到云数据库
      const catId = await db.addCat({
        avatar: form.avatar,
        name: form.name,
        breed: form.breed,
        age: form.age,
        gender: form.gender,
        vaccinated: form.vaccinated,
        character: form.character,
        notes: form.notes
      });
      wx.hideLoading();
      if (catId) {
        wx.showToast({ title: '保存成功！', icon: 'success' });
        setTimeout(() => wx.navigateBack(), 1500);
      } else {
        wx.showToast({ title: '保存失败', icon: 'none' });
      }
    }
  }
});
