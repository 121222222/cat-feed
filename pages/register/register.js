const app = getApp();
const db = require('../../utils/db.js');

Page({
  data: {
    avatar: '',
    name: '',
    phone: '',
    buildingOptions: ['1栋', '2栋', '3栋', '4栋', '5栋', '6栋', '7栋', '8栋', '9栋', '10栋'],
    buildingIndex: -1,
    roomNumber: '',
    catExperience: ''
  },

  // 选择头像
  chooseAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.setData({ avatar: tempFilePath });
      }
    });
  },

  // 输入昵称
  onInputName(e) {
    this.setData({ name: e.detail.value });
  },

  // 输入手机号
  onInputPhone(e) {
    this.setData({ phone: e.detail.value });
  },

  // 选择楼栋
  onBuildingChange(e) {
    this.setData({ buildingIndex: parseInt(e.detail.value) });
  },

  // 输入房间号
  onInputRoom(e) {
    this.setData({ roomNumber: e.detail.value });
  },

  // 选择养猫经验
  selectExp(e) {
    const exp = e.currentTarget.dataset.exp;
    this.setData({ catExperience: exp });
  },

  // 注册
  async onRegister() {
    const { avatar, name, phone, buildingIndex, buildingOptions, roomNumber, catExperience } = this.data;

    // 校验
    if (!name.trim()) {
      wx.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }

    if (!phone.trim()) {
      wx.showToast({ title: '请输入手机号', icon: 'none' });
      return;
    }

    // 验证手机号格式
    const phoneReg = /^1[3-9]\d{9}$/;
    if (!phoneReg.test(phone)) {
      wx.showToast({ title: '手机号格式不正确', icon: 'none' });
      return;
    }

    // 校验公寓信息
    if (buildingIndex < 0) {
      wx.showToast({ title: '请选择楼栋', icon: 'none' });
      return;
    }

    if (!roomNumber.trim()) {
      wx.showToast({ title: '请输入房间号', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '注册中...', mask: true });

    try {
      let avatarUrl = '';

      // 上传头像
      if (avatar) {
        wx.showLoading({ title: '上传头像...', mask: true });
        avatarUrl = await db.uploadImage(avatar, `avatars/${Date.now()}.jpg`);
      }

      // 组合公寓地址
      const dormitory = `${buildingOptions[buildingIndex]} ${roomNumber.trim()}`;

      // 创建用户
      const userInfo = {
        name: name.trim(),
        phone: phone.trim(),
        dormitory: dormitory,
        building: buildingOptions[buildingIndex],
        roomNumber: roomNumber.trim(),
        avatar: avatarUrl || '',
        catExperience: catExperience || 'none',
        certified: false
      };

      const newUser = await db.createUser(userInfo);

      wx.hideLoading();

      if (newUser) {
        // 注册成功，保存登录状态
        app.loginSuccess(newUser);
        
        wx.showToast({ title: '注册成功', icon: 'success' });
        setTimeout(() => {
          wx.switchTab({ url: '/pages/index/index' });
        }, 1500);
      } else {
        wx.showToast({ title: '注册失败，请重试', icon: 'none' });
      }
    } catch (err) {
      wx.hideLoading();
      console.error('注册失败:', err);
      wx.showToast({ title: '注册失败，请重试', icon: 'none' });
    }
  },

  // 返回登录页
  goLogin() {
    wx.navigateBack();
  }
});
