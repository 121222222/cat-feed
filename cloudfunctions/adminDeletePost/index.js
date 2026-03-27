// 云函数：管理员删除帖子
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const { postId, action } = event;
  
  if (!postId) {
    return { success: false, error: '缺少帖子ID' };
  }
  
  try {
    // 软删除：标记帖子为已删除
    if (action === 'delete') {
      await db.collection('posts').doc(postId).update({
        data: {
          deleted: true,
          deleteTime: db.serverDate()
        }
      });
      return { success: true, message: '删除成功' };
    }
    
    // 硬删除：彻底删除帖子
    if (action === 'remove') {
      await db.collection('posts').doc(postId).remove();
      return { success: true, message: '彻底删除成功' };
    }
    
    return { success: false, error: '未知操作' };
  } catch (err) {
    console.error('删除帖子失败:', err);
    return { success: false, error: err.message };
  }
};
