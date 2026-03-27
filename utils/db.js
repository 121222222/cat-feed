/**
 * 云数据库操作工具
 * 使用方法: const db = require('../../utils/db.js');
 */

const database = wx.cloud.database();
const _ = database.command;

// 集合引用
const usersCol = database.collection('users');
const catsCol = database.collection('cats');
const needsCol = database.collection('needs');
const appliesCol = database.collection('applies');
const messagesCol = database.collection('messages');
const postsCol = database.collection('posts');
const helpsCol = database.collection('helps');
const commentsCol = database.collection('comments');
const announcementsCol = database.collection('announcements');

module.exports = {
  db: database,
  _,

  // ========== 用户相关 ==========

  /** 获取当前用户信息（根据 _openid 自动匹配） */
  async getCurrentUser() {
    try {
      const res = await usersCol.where({}).get();
      return res.data.length > 0 ? res.data[0] : null;
    } catch (err) {
      console.error('getCurrentUser 失败:', err);
      return null;
    }
  },

  /** 创建用户 */
  async createUser(userInfo) {
    try {
      const res = await usersCol.add({
        data: {
          ...userInfo,
          rating: 5.0,
          serviceCount: 0,
          certified: false,
          createTime: database.serverDate()
        }
      });
      return { _id: res._id, ...userInfo, rating: 5.0, serviceCount: 0, certified: false };
    } catch (err) {
      console.error('createUser 失败:', err);
      return null;
    }
  },

  /** 更新用户信息 */
  async updateUser(userId, data) {
    try {
      await usersCol.doc(userId).update({ data });
      return true;
    } catch (err) {
      console.error('updateUser 失败:', err);
      return false;
    }
  },

  // ========== 猫咪相关 ==========

  /** 获取我的猫咪列表（依赖数据库权限：仅创建者可读写） */
  async getMyCats() {
    try {
      const res = await catsCol.orderBy('createTime', 'desc').get();
      return res.data;
    } catch (err) {
      console.error('getMyCats 失败:', err);
      return [];
    }
  },

  /** 根据ID获取猫咪 */
  async getCatById(catId) {
    try {
      const res = await catsCol.doc(catId).get();
      return res.data;
    } catch (err) {
      console.error('getCatById 失败:', err);
      return null;
    }
  },

  /** 添加猫咪 */
  async addCat(catData) {
    try {
      const res = await catsCol.add({
        data: {
          ...catData,
          createTime: database.serverDate()
        }
      });
      return res._id;
    } catch (err) {
      console.error('addCat 失败:', err);
      return null;
    }
  },

  /** 更新猫咪信息 */
  async updateCat(catId, data) {
    try {
      await catsCol.doc(catId).update({ data });
      return true;
    } catch (err) {
      console.error('updateCat 失败:', err);
      return false;
    }
  },

  /** 删除猫咪 */
  async deleteCat(catId) {
    try {
      await catsCol.doc(catId).remove();
      return true;
    } catch (err) {
      console.error('deleteCat 失败:', err);
      return false;
    }
  },

  // ========== 动态/帖子相关 ==========

  /** 获取动态列表（支持分页和搜索） */
  async getPosts(options = {}) {
    try {
      const { category, page = 1, pageSize = 20, keyword } = options;
      
      // 如果是简单调用（传入字符串作为category）
      if (typeof options === 'string') {
        let conditions = {};
        if (options && options !== 'all') {
          conditions.category = options;
        }
        const res = await postsCol.where(conditions)
          .orderBy('createTime', 'desc')
          .limit(20)
          .get();
        // 过滤已删除的帖子
        return res.data.filter(p => !p.deleted);
      }
      
      // 基础条件
      let conditions = {};
      
      // 分类筛选
      if (category && category !== 'all') {
        conditions.category = category;
      }
      
      // 关键词搜索（简单模糊匹配）
      if (keyword) {
        conditions.content = database.RegExp({
          regexp: keyword,
          options: 'i'
        });
      }
      
      const res = await postsCol.where(conditions)
        .orderBy('createTime', 'desc')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get();
      // 过滤已删除的帖子
      return res.data.filter(p => !p.deleted);
    } catch (err) {
      console.error('getPosts 失败:', err);
      return [];
    }
  },

  /** 根据ID获取动态详情 */
  async getPostById(postId) {
    try {
      const res = await postsCol.doc(postId).get();
      return res.data;
    } catch (err) {
      console.error('getPostById 失败:', err);
      return null;
    }
  },

  /** 获取我发布的动态（通过 userId 过滤） */
  async getMyPosts(userId) {
    try {
      let query = postsCol.orderBy('createTime', 'desc');
      if (userId) {
        query = postsCol.where({ userId }).orderBy('createTime', 'desc');
      }
      const res = await query.get();
      return res.data;
    } catch (err) {
      console.error('getMyPosts 失败:', err);
      return [];
    }
  },

  /** 发布动态 */
  async addPost(postData) {
    try {
      const res = await postsCol.add({
        data: {
          ...postData,
          likes: 0,
          comments: 0,
          views: 0,
          createTime: database.serverDate()
        }
      });
      return res._id;
    } catch (err) {
      console.error('addPost 失败:', err);
      return null;
    }
  },

  /** 点赞/取消点赞 */
  async togglePostLike(postId, isLiked) {
    try {
      await postsCol.doc(postId).update({
        data: {
          likes: isLiked ? _.inc(1) : _.inc(-1)
        }
      });
      return true;
    } catch (err) {
      console.error('togglePostLike 失败:', err);
      return false;
    }
  },

  /** 删除动态（通过云函数，管理员可删除任何帖子） */
  async deletePost(postId) {
    try {
      // 调用云函数执行删除
      const res = await wx.cloud.callFunction({
        name: 'adminDeletePost',
        data: {
          postId: postId,
          action: 'delete'  // 软删除
        }
      });
      
      if (res.result && res.result.success) {
        return true;
      } else {
        console.error('云函数删除失败:', res.result && res.result.error);
        return false;
      }
    } catch (err) {
      console.error('deletePost 失败:', err);
      return false;
    }
  },

  // ========== 评论相关 ==========

  /** 获取帖子的评论列表 */
  async getComments(postId) {
    try {
      const res = await commentsCol.where({ postId })
        .orderBy('createTime', 'desc')
        .limit(50)
        .get();
      return res.data;
    } catch (err) {
      console.error('getComments 失败:', err);
      return [];
    }
  },

  /** 添加评论 */
  async addComment(commentData) {
    try {
      const res = await commentsCol.add({
        data: {
          ...commentData,
          createTime: database.serverDate()
        }
      });
      // 更新帖子评论数
      if (commentData.postId) {
        await postsCol.doc(commentData.postId).update({
          data: { comments: _.inc(1) }
        });
      }
      return res._id;
    } catch (err) {
      console.error('addComment 失败:', err);
      return null;
    }
  },

  /** 删除评论 */
  async deleteComment(commentId, postId) {
    try {
      await commentsCol.doc(commentId).remove();
      // 更新帖子评论数
      if (postId) {
        await postsCol.doc(postId).update({
          data: { comments: _.inc(-1) }
        });
      }
      return true;
    } catch (err) {
      console.error('deleteComment 失败:', err);
      return false;
    }
  },

  // ========== 互助相关 ==========

  /** 获取互助列表 */
  async getHelps(filter, limit = 20) {
    try {
      let query = helpsCol.where({ status: 'open' }).orderBy('createTime', 'desc');
      if (filter && filter !== 'all') {
        query = helpsCol.where({ status: 'open', type: filter }).orderBy('createTime', 'desc');
      }
      const res = await query.limit(limit).get();
      return res.data;
    } catch (err) {
      console.error('getHelps 失败:', err);
      return [];
    }
  },

  /** 根据ID获取互助详情 */
  async getHelpById(helpId) {
    try {
      const res = await helpsCol.doc(helpId).get();
      return res.data;
    } catch (err) {
      console.error('getHelpById 失败:', err);
      return null;
    }
  },

  /** 获取我发布的互助（通过 userId 过滤） */
  async getMyHelps(userId) {
    try {
      let query = helpsCol.orderBy('createTime', 'desc');
      if (userId) {
        query = helpsCol.where({ userId }).orderBy('createTime', 'desc');
      }
      const res = await query.get();
      return res.data;
    } catch (err) {
      console.error('getMyHelps 失败:', err);
      return [];
    }
  },

  /** 发布互助 */
  async addHelp(helpData) {
    try {
      const res = await helpsCol.add({
        data: {
          ...helpData,
          status: 'open',
          createTime: database.serverDate()
        }
      });
      return res._id;
    } catch (err) {
      console.error('addHelp 失败:', err);
      return null;
    }
  },

  /** 更新互助状态 */
  async updateHelpStatus(helpId, status) {
    try {
      await helpsCol.doc(helpId).update({
        data: { status, updateTime: database.serverDate() }
      });
      return true;
    } catch (err) {
      console.error('updateHelpStatus 失败:', err);
      return false;
    }
  },

  /** 删除互助 */
  async deleteHelp(helpId) {
    try {
      await helpsCol.doc(helpId).remove();
      return true;
    } catch (err) {
      console.error('deleteHelp 失败:', err);
      return false;
    }
  },

  // ========== 需求相关（保留兼容） ==========

  /** 获取所有待接单需求（所有人可见） */
  async getPendingNeeds() {
    try {
      const res = await needsCol.where({ status: 'pending' })
        .orderBy('createTime', 'desc')
        .get();
      return res.data;
    } catch (err) {
      console.error('getPendingNeeds 失败:', err);
      return [];
    }
  },

  /** 获取最近需求（首页用，取前N条） */
  async getRecentNeeds(limit = 4) {
    try {
      const res = await needsCol.where({ status: 'pending' })
        .orderBy('createTime', 'desc')
        .limit(limit)
        .get();
      return res.data;
    } catch (err) {
      console.error('getRecentNeeds 失败:', err);
      return [];
    }
  },

  /** 获取所有需求（不限状态） */
  async getAllNeeds() {
    try {
      const res = await needsCol.orderBy('createTime', 'desc').get();
      return res.data;
    } catch (err) {
      console.error('getAllNeeds 失败:', err);
      return [];
    }
  },

  /** 获取我发布的需求 */
  async getMyNeeds() {
    try {
      const res = await needsCol.orderBy('createTime', 'desc').get();
      return res.data;
    } catch (err) {
      console.error('getMyNeeds 失败:', err);
      return [];
    }
  },

  /** 根据ID获取需求 */
  async getNeedById(needId) {
    try {
      const res = await needsCol.doc(needId).get();
      return res.data;
    } catch (err) {
      console.error('getNeedById 失败:', err);
      return null;
    }
  },

  /** 发布需求 */
  async addNeed(needData) {
    try {
      const res = await needsCol.add({
        data: {
          ...needData,
          status: 'pending',
          createTime: database.serverDate()
        }
      });
      return res._id;
    } catch (err) {
      console.error('addNeed 失败:', err);
      return null;
    }
  },

  /** 更新需求状态 */
  async updateNeedStatus(needId, status) {
    try {
      await needsCol.doc(needId).update({
        data: { status, updateTime: database.serverDate() }
      });
      return true;
    } catch (err) {
      console.error('updateNeedStatus 失败:', err);
      return false;
    }
  },

  // ========== 申请相关 ==========

  /** 提交喂养申请 */
  async addApply(applyData) {
    try {
      const res = await appliesCol.add({
        data: {
          ...applyData,
          status: 'reviewing',
          createTime: database.serverDate()
        }
      });
      return res._id;
    } catch (err) {
      console.error('addApply 失败:', err);
      return null;
    }
  },

  /** 获取我的申请 */
  async getMyApplies() {
    try {
      const res = await appliesCol.orderBy('createTime', 'desc').get();
      return res.data;
    } catch (err) {
      console.error('getMyApplies 失败:', err);
      return [];
    }
  },

  // ========== 消息相关 ==========

  /** 获取我的消息 */
  async getMyMessages() {
    try {
      const res = await messagesCol.orderBy('createTime', 'desc').get();
      return res.data;
    } catch (err) {
      console.error('getMyMessages 失败:', err);
      return [];
    }
  },

  /** 添加消息 */
  async addMessage(msgData) {
    try {
      const res = await messagesCol.add({
        data: {
          ...msgData,
          read: false,
          createTime: database.serverDate()
        }
      });
      return res._id;
    } catch (err) {
      console.error('addMessage 失败:', err);
      return null;
    }
  },

  /** 添加系统通知（管理员用） */
  async addSystemNotice(noticeData) {
    try {
      const res = await messagesCol.add({
        data: {
          ...noticeData,
          type: 'system',
          icon: '🔔',
          avatarBg: '#E6F7FF',
          read: false,
          isGlobal: true, // 全局通知
          createTime: database.serverDate()
        }
      });
      return res._id;
    } catch (err) {
      console.error('addSystemNotice 失败:', err);
      return null;
    }
  },

  /** 获取系统通知列表 */
  async getSystemNotices(limit = 20) {
    try {
      const res = await messagesCol.where({ type: 'system', isGlobal: true })
        .orderBy('createTime', 'desc')
        .limit(limit)
        .get();
      return res.data;
    } catch (err) {
      console.error('getSystemNotices 失败:', err);
      return [];
    }
  },

  // ========== 社区公告相关 ==========

  /** 获取公告列表 */
  async getAnnouncements(limit = 20) {
    try {
      const res = await announcementsCol
        .orderBy('createTime', 'desc')
        .limit(limit)
        .get();
      return res.data.map(item => ({
        ...item,
        id: item._id,
        createTime: this.formatDate(item.createTime)
      }));
    } catch (err) {
      console.error('getAnnouncements 失败:', err);
      return [];
    }
  },

  /** 获取最新公告（社区顶部显示） */
  async getLatestAnnouncement() {
    try {
      const res = await announcementsCol
        .orderBy('createTime', 'desc')
        .limit(1)
        .get();
      return res.data.length > 0 ? res.data[0] : null;
    } catch (err) {
      console.error('getLatestAnnouncement 失败:', err);
      return null;
    }
  },

  /** 添加公告 */
  async addAnnouncement(data) {
    try {
      const res = await announcementsCol.add({
        data: {
          ...data,
          createTime: database.serverDate()
        }
      });
      return res._id;
    } catch (err) {
      console.error('addAnnouncement 失败:', err);
      return null;
    }
  },

  /** 删除公告 */
  async deleteAnnouncement(id) {
    try {
      await announcementsCol.doc(id).remove();
      return true;
    } catch (err) {
      console.error('deleteAnnouncement 失败:', err);
      return false;
    }
  },

  /** 格式化日期 */
  formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${month}-${day} ${hours}:${minutes}`;
  },

  // ========== 管理员后台相关 ==========

  /** 获取统计数据 */
  async getStatistics() {
    try {
      const [usersRes, postsRes, helpsRes, catsRes] = await Promise.all([
        usersCol.count(),
        postsCol.count(),
        helpsCol.count(),
        catsCol.count()
      ]);
      
      // 获取今日数据
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const [todayUsersRes, todayPostsRes] = await Promise.all([
        usersCol.where({
          createTime: _.gte(database.serverDate({ offset: -24 * 60 * 60 * 1000 }))
        }).count(),
        postsCol.where({
          createTime: _.gte(database.serverDate({ offset: -24 * 60 * 60 * 1000 }))
        }).count()
      ]);

      // 获取进行中和已完成的互助数
      const [openHelpsRes, closedHelpsRes] = await Promise.all([
        helpsCol.where({ status: 'open' }).count(),
        helpsCol.where({ status: 'closed' }).count()
      ]);

      return {
        totalUsers: usersRes.total || 0,
        todayUsers: todayUsersRes.total || 0,
        totalPosts: postsRes.total || 0,
        todayPosts: todayPostsRes.total || 0,
        totalHelps: helpsRes.total || 0,
        openHelps: openHelpsRes.total || 0,
        closedHelps: closedHelpsRes.total || 0,
        totalCats: catsRes.total || 0
      };
    } catch (err) {
      console.error('getStatistics 失败:', err);
      return {
        totalUsers: 0, todayUsers: 0,
        totalPosts: 0, todayPosts: 0,
        totalHelps: 0, openHelps: 0, closedHelps: 0,
        totalCats: 0
      };
    }
  },

  /** 获取所有用户列表（管理员用） */
  async getAllUsers(options = {}) {
    try {
      const { page = 1, pageSize = 20, keyword } = options;
      let query = usersCol;
      
      if (keyword) {
        query = usersCol.where({
          name: database.RegExp({
            regexp: keyword,
            options: 'i'
          })
        });
      }
      
      const res = await query
        .orderBy('createTime', 'desc')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get();
      return res.data;
    } catch (err) {
      console.error('getAllUsers 失败:', err);
      return [];
    }
  },

  /** 禁用/启用用户 */
  async toggleUserStatus(userId, disabled) {
    try {
      await usersCol.doc(userId).update({
        data: { disabled, updateTime: database.serverDate() }
      });
      return true;
    } catch (err) {
      console.error('toggleUserStatus 失败:', err);
      return false;
    }
  },

  /** 获取所有帖子（管理员用，包括已删除） */
  async getAllPosts(options = {}) {
    try {
      const { page = 1, pageSize = 20, keyword, status } = options;
      let conditions = {};
      
      if (keyword) {
        conditions.content = database.RegExp({
          regexp: keyword,
          options: 'i'
        });
      }
      if (status) {
        conditions.status = status;
      }
      
      let query = Object.keys(conditions).length > 0 
        ? postsCol.where(conditions) 
        : postsCol;
      
      const res = await query
        .orderBy('createTime', 'desc')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get();
      return res.data;
    } catch (err) {
      console.error('getAllPosts 失败:', err);
      return [];
    }
  },

  /** 置顶/取消置顶帖子 */
  async togglePostTop(postId, isTop) {
    try {
      await postsCol.doc(postId).update({
        data: { isTop, updateTime: database.serverDate() }
      });
      return true;
    } catch (err) {
      console.error('togglePostTop 失败:', err);
      return false;
    }
  },

  /** 获取所有互助请求（管理员用） */
  async getAllHelps(options = {}) {
    try {
      const { page = 1, pageSize = 20, status } = options;
      let query = helpsCol;
      
      if (status && status !== 'all') {
        query = helpsCol.where({ status });
      }
      
      const res = await query
        .orderBy('createTime', 'desc')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get();
      return res.data;
    } catch (err) {
      console.error('getAllHelps 失败:', err);
      return [];
    }
  },

  /** 获取所有评论（管理员用） */
  async getAllComments(options = {}) {
    try {
      const { page = 1, pageSize = 20 } = options;
      const res = await commentsCol
        .orderBy('createTime', 'desc')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get();
      return res.data;
    } catch (err) {
      console.error('getAllComments 失败:', err);
      return [];
    }
  },

  /** 获取所有猫咪（管理员用） */
  async getAllCats(options = {}) {
    try {
      const { page = 1, pageSize = 20, keyword } = options;
      let query = catsCol;
      
      if (keyword) {
        query = catsCol.where({
          name: database.RegExp({
            regexp: keyword,
            options: 'i'
          })
        });
      }
      
      const res = await query
        .orderBy('createTime', 'desc')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get();
      return res.data;
    } catch (err) {
      console.error('getAllCats 失败:', err);
      return [];
    }
  },

  /** 获取举报列表 */
  async getReports(options = {}) {
    try {
      const { page = 1, pageSize = 20, status } = options;
      const reportsCol = database.collection('reports');
      let query = reportsCol;
      
      if (status && status !== 'all') {
        query = reportsCol.where({ status });
      }
      
      const res = await query
        .orderBy('createTime', 'desc')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get();
      return res.data;
    } catch (err) {
      console.error('getReports 失败:', err);
      return [];
    }
  },

  /** 处理举报 */
  async handleReport(reportId, result, remark) {
    try {
      const reportsCol = database.collection('reports');
      await reportsCol.doc(reportId).update({
        data: {
          status: 'handled',
          result,
          remark,
          handleTime: database.serverDate()
        }
      });
      return true;
    } catch (err) {
      console.error('handleReport 失败:', err);
      return false;
    }
  },

  /** 获取话题列表 */
  async getTopics() {
    try {
      const topicsCol = database.collection('topics');
      const res = await topicsCol.orderBy('sort', 'asc').get();
      return res.data;
    } catch (err) {
      console.error('getTopics 失败:', err);
      return [];
    }
  },

  /** 添加话题 */
  async addTopic(topicData) {
    try {
      const topicsCol = database.collection('topics');
      const res = await topicsCol.add({
        data: {
          ...topicData,
          sort: 0,
          createTime: database.serverDate()
        }
      });
      return res._id;
    } catch (err) {
      console.error('addTopic 失败:', err);
      return null;
    }
  },

  /** 删除话题 */
  async deleteTopic(topicId) {
    try {
      const topicsCol = database.collection('topics');
      await topicsCol.doc(topicId).remove();
      return true;
    } catch (err) {
      console.error('deleteTopic 失败:', err);
      return false;
    }
  },

  /** 获取操作日志 */
  async getOperationLogs(options = {}) {
    try {
      const { page = 1, pageSize = 20 } = options;
      const logsCol = database.collection('operation_logs');
      const res = await logsCol
        .orderBy('createTime', 'desc')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get();
      return res.data;
    } catch (err) {
      console.error('getOperationLogs 失败:', err);
      return [];
    }
  },

  /** 添加操作日志 */
  async addOperationLog(logData) {
    try {
      const logsCol = database.collection('operation_logs');
      await logsCol.add({
        data: {
          ...logData,
          createTime: database.serverDate()
        }
      });
      return true;
    } catch (err) {
      console.error('addOperationLog 失败:', err);
      return false;
    }
  },

  /** 获取轮播图配置 */
  async getBanners() {
    try {
      const configCol = database.collection('config');
      const res = await configCol.where({ key: 'banners' }).get();
      return res.data.length > 0 ? res.data[0].value : [];
    } catch (err) {
      console.error('getBanners 失败:', err);
      return [];
    }
  },

  /** 更新轮播图配置 */
  async updateBanners(banners) {
    try {
      const configCol = database.collection('config');
      const res = await configCol.where({ key: 'banners' }).get();
      if (res.data.length > 0) {
        await configCol.doc(res.data[0]._id).update({
          data: { value: banners, updateTime: database.serverDate() }
        });
      } else {
        await configCol.add({
          data: { key: 'banners', value: banners, createTime: database.serverDate() }
        });
      }
      return true;
    } catch (err) {
      console.error('updateBanners 失败:', err);
      return false;
    }
  },

  // ========== 图片上传 ==========

  /** 上传图片到云存储 */
  async uploadImage(filePath, cloudPath) {
    try {
      const res = await wx.cloud.uploadFile({
        cloudPath: cloudPath || `images/${Date.now()}-${Math.random().toString(36).substr(2)}.jpg`,
        filePath
      });
      return res.fileID;
    } catch (err) {
      console.error('uploadImage 失败:', err);
      return null;
    }
  },

  /** 将云存储 fileID 转换为临时链接 */
  async getImageUrls(fileIDs) {
    if (!fileIDs || fileIDs.length === 0) return [];
    try {
      const res = await wx.cloud.getTempFileURL({
        fileList: fileIDs
      });
      return res.fileList.map(f => f.tempFileURL || f.fileID);
    } catch (err) {
      console.error('getImageUrls 失败:', err);
      return fileIDs; // 失败时返回原始 fileID
    }
  }
};
