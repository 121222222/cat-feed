Page({
  data: {
    isEdit: false,
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

  onLoad(options) {
    if (options.id) {
      this.setData({ isEdit: true });
      wx.setNavigationBarTitle({ title: '编辑猫咪' });
    }
  },

  onChoosePhoto() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: (res) => {
        this.setData({ 'form.avatar': res.tempFiles[0].tempFilePath });
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

  onSave() {
    if (!this.data.form.name) {
      wx.showToast({ title: '请输入猫咪名字', icon: 'none' }); return;
    }
    wx.showToast({ title: '保存成功！', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 1500);
  }
});
