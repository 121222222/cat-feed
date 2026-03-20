Page({
  data: {
    form: {
      catName: '',
      catBreed: '',
      catCount: 1,
      catAge: '',
      vaccinated: true,
      character: '',
      notes: '',
      startDate: '',
      endDate: '',
      timeSlot: '',
      dormitory: '',
      roomNo: '',
      rewardType: 'free',
      rewardAmount: '',
      description: ''
    },
    catPhotos: [],
    breedOptions: ['中华田园猫', '英国短毛猫', '美国短毛猫', '布偶猫', '暹罗猫', '波斯猫', '缅因猫', '苏格兰折耳猫', '俄罗斯蓝猫', '孟加拉猫', '橘猫', '三花猫', '黑猫', '白猫', '奶牛猫', '狸花猫', '其他'],
    breedIndex: -1,
    serviceOptions: [
      { name: '喂食', icon: '🍲', checked: true },
      { name: '换水', icon: '💧', checked: true },
      { name: '铲屎', icon: '🧹', checked: false },
      { name: '陪玩', icon: '🎾', checked: false },
      { name: '喂药', icon: '💊', checked: false }
    ],
    dormOptions: ['1栋', '2栋', '3栋', '4栋', '5栋', '6栋', '7栋', '8栋', '9栋', '10栋'],
    dormIndex: 0
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  onCountChange(e) {
    const delta = Number(e.currentTarget.dataset.delta);
    let count = this.data.form.catCount + delta;
    if (count < 1) count = 1;
    if (count > 10) count = 10;
    this.setData({ 'form.catCount': count });
  },

  onSwitchChange(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  onDateChange(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  onDormChange(e) {
    const idx = e.detail.value;
    this.setData({
      dormIndex: idx,
      'form.dormitory': this.data.dormOptions[idx]
    });
  },

  onBreedChange(e) {
    const idx = e.detail.value;
    this.setData({
      breedIndex: idx,
      'form.catBreed': this.data.breedOptions[idx]
    });
  },

  toggleService(e) {
    const index = e.currentTarget.dataset.index;
    const key = `serviceOptions[${index}].checked`;
    this.setData({ [key]: !this.data.serviceOptions[index].checked });
  },

  setRewardType(e) {
    this.setData({ 'form.rewardType': e.currentTarget.dataset.type });
  },

  // 选择猫咪照片
  chooseCatPhoto() {
    const that = this;
    const remainCount = 9 - this.data.catPhotos.length;
    if (remainCount <= 0) {
      wx.showToast({ title: '最多上传9张照片', icon: 'none' });
      return;
    }
    wx.chooseMedia({
      count: remainCount,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success(res) {
        const newPhotos = res.tempFiles.map(f => f.tempFilePath);
        that.setData({
          catPhotos: [...that.data.catPhotos, ...newPhotos]
        });
      }
    });
  },

  // 预览猫咪照片
  previewPhoto(e) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({
      current: url,
      urls: this.data.catPhotos
    });
  },

  // 删除猫咪照片
  deletePhoto(e) {
    const index = e.currentTarget.dataset.index;
    const photos = this.data.catPhotos;
    photos.splice(index, 1);
    this.setData({ catPhotos: photos });
  },

  onSubmit() {
    const { form, serviceOptions } = this.data;
    
    if (!form.catName) {
      wx.showToast({ title: '请输入猫咪名字', icon: 'none' }); return;
    }
    if (!form.startDate || !form.endDate) {
      wx.showToast({ title: '请选择喂养时间', icon: 'none' }); return;
    }
    if (!form.dormitory) {
      wx.showToast({ title: '请选择宿舍楼栋', icon: 'none' }); return;
    }

    const services = serviceOptions.filter(s => s.checked).map(s => s.name);
    if (services.length === 0) {
      wx.showToast({ title: '请至少选择一项服务', icon: 'none' }); return;
    }

    wx.showModal({
      title: '确认发布',
      content: `确认发布「${form.catName}」的喂养需求吗？`,
      confirmColor: '#FF8C42',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({ title: '发布成功！', icon: 'success' });
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        }
      }
    });
  }
});
