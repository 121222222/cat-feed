const app = getApp();
const db = require('../../utils/db.js');

Page({
  data: {
    form: {
      type: 'need',
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      catId: '',
      catName: '',
      catAvatar: '',
      building: '',
      roomNumber: '',
      location: '',
      latitude: '',
      longitude: '',
      address: ''
    },
    myCats: [],
    presetType: false,
    dormitoryOptions: ['1栋', '2栋', '3栋', '4栋', '5栋', '6栋', '7栋', '8栋', '9栋', '10栋', '11栋'],
    dormitoryIndex: -1,
    markers: []
  },

  onLoad(options) {
    if (options.type) {
      this.setData({ 
        'form.type': options.type,
        presetType: true
      });
    }
    this.loadMyCats();
  },

  async loadMyCats() {
    try {
      const catsRaw = await db.getMyCats();
      const cats = catsRaw.map(c => ({
        ...c,
        id: c._id
      }));
      this.setData({ myCats: cats });
    } catch (err) {
      console.error('加载猫咪失败:', err);
    }
  },

  setType(e) {
    this.setData({ 'form.type': e.currentTarget.dataset.type });
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
    
    // 如果是房间号输入，更新完整位置
    if (field === 'roomNumber') {
      this.updateLocation();
    }
  },

  onDateChange(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  onDormitoryChange(e) {
    const index = e.detail.value;
    const building = this.data.dormitoryOptions[index];
    this.setData({
      dormitoryIndex: index,
      'form.building': building
    });
    this.updateLocation();
  },

  // 更新完整位置信息
  updateLocation() {
    const { building, roomNumber } = this.data.form;
    let location = '';
    if (building) {
      location = building;
      if (roomNumber) {
        location += ' ' + roomNumber;
      }
    }
    this.setData({ 'form.location': location });
  },

  // 选择地图定位
  chooseLocation() {
    wx.chooseLocation({
      success: (res) => {
        this.setData({
          'form.latitude': res.latitude,
          'form.longitude': res.longitude,
          'form.address': res.address || res.name || '',
          markers: [{
            id: 1,
            latitude: res.latitude,
            longitude: res.longitude,
            iconPath: '/assets/images/location-marker.png',
            width: 30,
            height: 30
          }]
        });
      },
      fail: (err) => {
        console.error('选择位置失败:', err);
        if (err.errMsg && err.errMsg.includes('auth deny')) {
          wx.showModal({
            title: '定位授权',
            content: '请在设置中开启位置权限',
            confirmText: '去设置',
            success: (res) => {
              if (res.confirm) {
                wx.openSetting();
              }
            }
          });
        }
      }
    });
  },

  selectCat(e) {
    const { id, name, avatar } = e.currentTarget.dataset;
    this.setData({
      'form.catId': id,
      'form.catName': name,
      'form.catAvatar': avatar || ''
    });
  },

  goAddCat() {
    wx.navigateTo({ url: '/pages/add-cat/add-cat' });
  },

  async onSubmit() {
    const { form } = this.data;

    // 校验
    if (!form.title.trim()) {
      wx.showToast({ title: '请输入标题', icon: 'none' });
      return;
    }
    if (!form.description.trim()) {
      wx.showToast({ title: '请输入详细描述', icon: 'none' });
      return;
    }
    if (form.type === 'need' && (!form.startDate || !form.endDate)) {
      wx.showToast({ title: '请选择需要帮忙的时间', icon: 'none' });
      return;
    }
    if (!form.building) {
      wx.showToast({ title: '请选择楼栋', icon: 'none' });
      return;
    }
    if (!form.roomNumber || !form.roomNumber.trim()) {
      wx.showToast({ title: '请输入房间号', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认发布',
      content: '确认发布这条互助信息吗？',
      confirmColor: '#FF8A6B',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '发布中...', mask: true });

          try {
            const userInfo = app.globalData.userInfo || {};
            
            const helpData = {
              type: form.type,
              title: form.title.trim(),
              description: form.description.trim(),
              building: form.building,
              roomNumber: form.roomNumber.trim(),
              location: form.location.trim(),
              latitude: form.latitude || '',
              longitude: form.longitude || '',
              address: form.address || '',
              userName: userInfo.name || '匿名',
              userAvatar: userInfo.avatar || '',
              userId: userInfo._id || '',
              time: '刚刚'
            };

            // 求助类型添加日期和猫咪信息
            if (form.type === 'need') {
              helpData.startDate = form.startDate;
              helpData.endDate = form.endDate;
              helpData.dateRange = `${form.startDate} ~ ${form.endDate}`;
              if (form.catId) {
                helpData.catId = form.catId;
                helpData.catName = form.catName;
                helpData.catAvatar = form.catAvatar;
              }
            }

            const helpId = await db.addHelp(helpData);

            wx.hideLoading();

            if (helpId) {
              wx.showToast({ title: '发布成功！', icon: 'success' });
              setTimeout(() => {
                wx.navigateBack();
              }, 1500);
            } else {
              wx.showToast({ title: '发布失败', icon: 'none' });
            }
          } catch (err) {
            wx.hideLoading();
            console.error('发布失败:', err);
            wx.showToast({ title: '发布失败，请重试', icon: 'none' });
          }
        }
      }
    });
  }
});
