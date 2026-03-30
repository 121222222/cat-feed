const app = getApp();
const db = require('../../utils/db.js');

Page({
  data: {
    buildingOptions: ['1栋', '2栋', '3栋', '4栋', '5栋', '6栋', '7栋', '8栋', '9栋', '10栋'],
    buildingIndex: -1,
    roomNumber: '',
    userInfo: null
  },

  onLoad() {
    const userInfo = app.globalData.userInfo;
    if (userInfo) {
      this.setData({ userInfo });
      // 如果用户已有楼栋信息，预填
      if (userInfo.building) {
        const idx = this.data.buildingOptions.indexOf(userInfo.building);
        if (idx >= 0) {
          this.setData({ buildingIndex: idx });
        }
      }
      if (userInfo.roomNumber) {
        this.setData({ roomNumber: userInfo.roomNumber });
      }
    }
  },

  // 选择楼栋
  onBuildingChange(e) {
    this.setData({ buildingIndex: parseInt(e.detail.value) });
  },

  // 输入房间号
  onInputRoom(e) {
    this.setData({ roomNumber: e.detail.value });
  },

  // 绑定房间号
  async onBind() {
    const { buildingIndex, buildingOptions, roomNumber, userInfo } = this.data;

    if (buildingIndex < 0) {
      wx.showToast({ title: '请选择楼栋', icon: 'none' });
      return;
    }

    if (!roomNumber.trim()) {
      wx.showToast({ title: '请输入房间号', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '验证中...', mask: true });

    try {
      const building = buildingOptions[buildingIndex];
      const room = roomNumber.trim();

      // 1. 验证房间号是否在有效列表中
      const validRoom = await db.verifyRoom(building, room);
      if (!validRoom) {
        wx.hideLoading();
        wx.showModal({
          title: '验证失败',
          content: '该房间号不在公司公寓名单中，请确认您的楼栋和房间号是否正确。如有疑问请联系管理员。',
          showCancel: false,
          confirmColor: '#FFBAA3'
        });
        return;
      }

      // 2. 检查房间号是否已被其他用户绑定
      const boundUser = await db.isRoomBound(building, room);
      if (boundUser && boundUser._id !== userInfo._id) {
        wx.hideLoading();
        wx.showModal({
          title: '房间号已被绑定',
          content: '该房间号已被其他用户绑定，如果您是该房间的新住户，请联系管理员解绑后再试。',
          showCancel: false,
          confirmColor: '#FFBAA3'
        });
        return;
      }

      // 3. 更新用户信息
      const dormitory = `${building} ${room}`;
      const updateData = {
        building: building,
        roomNumber: room,
        dormitory: dormitory,
        roomVerified: true,
        verifyTime: new Date().toISOString()
      };

      const success = await db.updateUser(userInfo._id, updateData);

      wx.hideLoading();

      if (success) {
        // 更新全局用户信息
        app.globalData.userInfo = {
          ...userInfo,
          ...updateData
        };
        wx.setStorageSync('userInfo', app.globalData.userInfo);

        wx.showModal({
          title: '绑定成功',
          content: '您的房间号已验证通过，现在可以使用所有功能了！',
          showCancel: false,
          confirmColor: '#FFBAA3',
          success: () => {
            wx.navigateBack();
          }
        });
      } else {
        wx.showToast({ title: '绑定失败，请重试', icon: 'none' });
      }
    } catch (err) {
      wx.hideLoading();
      console.error('绑定失败:', err);
      wx.showToast({ title: '绑定失败，请重试', icon: 'none' });
    }
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  }
});
