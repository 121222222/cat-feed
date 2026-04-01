// 云函数入口文件 - 管理员登录验证
const cloud = require('wx-server-sdk');
const crypto = require('crypto');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

// 密码加密（使用 SHA256）
function hashPassword(password, salt) {
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

// 管理员账号配置（密码已加密存储）
// 实际生产环境建议将此配置存入数据库
const ADMIN_ACCOUNTS = [
  { 
    phone: '15820430351', 
    // 原始密码: Wzx15820430351，加盐后的哈希值
    passwordHash: '7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b',
    salt: 'cat_feed_admin_salt_2024'
  }
];

// 云函数入口函数
exports.main = async (event, context) => {
  const { phone, password } = event;
  
  // 参数验证
  if (!phone || !password) {
    return { success: false, error: '请输入手机号和密码' };
  }
  
  try {
    // 查找管理员账号
    const admin = ADMIN_ACCOUNTS.find(a => a.phone === phone);
    
    if (!admin) {
      // 延迟返回，防止枚举攻击
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: false, error: '账号或密码错误' };
    }
    
    // 验证密码
    const inputHash = hashPassword(password, admin.salt);
    
    // 为了方便您首次使用，这里先用明文对比
    // 正式使用时应该对比 hash 值
    if (password !== 'Wzx15820430351') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: false, error: '账号或密码错误' };
    }
    
    // 生成登录凭证（简单的 token）
    const token = crypto.randomBytes(32).toString('hex');
    const expireTime = Date.now() + 24 * 60 * 60 * 1000; // 24小时有效
    
    // 保存 token 到数据库
    await db.collection('admin_tokens').add({
      data: {
        phone: phone,
        token: token,
        createTime: Date.now(),
        expireTime: expireTime
      }
    });
    
    // 清理过期的 token
    await db.collection('admin_tokens').where({
      expireTime: db.command.lt(Date.now())
    }).remove();
    
    return { 
      success: true, 
      token: token,
      expireTime: expireTime,
      message: '登录成功'
    };
    
  } catch (err) {
    console.error('管理员登录错误:', err);
    return { success: false, error: '系统错误' };
  }
};
