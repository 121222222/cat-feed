const app = getApp();

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

  onLoad(options) {
    if (options.id) {
      this.setData({ isEdit: true, editId: options.id });
      wx.setNavigationBarTitle({ title: '编辑猫咪' });
      // 加载已有猫咪数据
      const cat = app.globalData.mockCats.find(c => c.id === options.id);
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
    const { form, isEdit, editId } = this.data;
    if (!form.name) {
      wx.showToast({ title: '请输入猫咪名字', icon: 'none' });
      return;
    }

    if (isEdit) {
      // 编辑模式：更新已有猫咪
      const cats = app.globalData.mockCats;
      const idx = cats.findIndex(c => c.id === editId);
      if (idx !== -1) {
        cats[idx] = {
          ...cats[idx],
          avatar: form.avatar,
          name: form.name,
          breed: form.breed,
          age: form.age,
          gender: form.gender,
          vaccinated: form.vaccinated,
          character: form.character,
          notes: form.notes
        };
      }
    } else {
      // 新增模式：创建新猫咪并加入全局数据
      const newCat = {
        id: 'c' + Date.now(),
        avatar: form.avatar,
        name: form.name,
        breed: form.breed,
        age: form.age,
        gender: form.gender,
        vaccinated: form.vaccinated,
        character: form.character,
        notes: form.notes
      };
      app.globalData.mockCats.push(newCat);
    }

    wx.showToast({ title: '保存成功！', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 1500);
  }
});
