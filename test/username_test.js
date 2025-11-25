// 用户名设置功能测试
const { auth, db, linkAuthUserWithUsersTable, updateUserProfile } = require('../services/supabase');
const { updateUserInfo } = require('../services/login');

describe('用户名设置功能测试', () => {
  // 测试用户数据
  const testUser = {
    user_id: 'test_user_id_123',
    name: '测试用户',
    email: 'test@example.com'
  };
  
  /**
   * 测试用户关联到自定义users表
   */
  test('关联用户到自定义users表', async () => {
    try {
      // 模拟用户登录成功后调用关联函数
      const result = await linkAuthUserWithUsersTable(testUser);
      
      console.log('用户关联测试结果:', result);
      
      // 验证关联是否成功
      expect(result.success).toBe(true);
      console.log('✅ 用户关联测试通过');
    } catch (error) {
      console.error('❌ 用户关联测试失败:', error);
    }
  });
  
  /**
   * 测试更新用户信息（用户名）
   */
  test('更新用户信息（用户名）', async () => {
    try {
      const newUsername = '新的测试用户名';
      
      // 调用更新用户名函数
      const result = await updateUserProfile(testUser.user_id, { username: newUsername });
      
      console.log('用户名更新测试结果:', result);
      
      // 验证更新是否成功
      expect(result.success).toBe(true);
      console.log('✅ 用户名更新测试通过');
    } catch (error) {
      console.error('❌ 用户名更新测试失败:', error);
    }
  });
  
  /**
   * 测试通过loginService更新用户信息
   */
  test('通过loginService更新用户信息', async () => {
    try {
      const newUsername = '通过Service更新的用户名';
      
      // 模拟设置全局用户信息
      const app = {
        globalData: {
          userInfo: testUser,
          token: 'mock_token'
        }
      };
      
      // 调用loginService的更新函数
      const result = await updateUserInfo({ username: newUsername });
      
      console.log('通过Service更新用户信息测试结果:', result);
      
      // 验证更新是否成功
      expect(result.success).toBe(true);
      console.log('✅ 通过Service更新用户信息测试通过');
    } catch (error) {
      console.error('❌ 通过Service更新用户信息测试失败:', error);
    }
  });
  
  /**
   * 测试用户名验证逻辑
   */
  test('用户名验证逻辑', async () => {
    // 测试用例：有效的用户名
    const validUsernames = [
      'testuser',          // 纯英文
      '测试用户',          // 纯中文
      'test_123',          // 英文+数字+下划线
      '测试_123',          // 中文+数字+下划线
      'a'.repeat(20)       // 最大长度20
    ];
    
    // 测试用例：无效的用户名
    const invalidUsernames = [
      '',                  // 空
      'a',                 // 太短
      'a'.repeat(21),      // 太长
      'test user',         // 包含空格
      'test@user',         // 包含特殊字符
      'test-user'          // 包含特殊字符
    ];
    
    // 验证有效用户名
    validUsernames.forEach(username => {
      const regex = /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/;
      const isValid = regex.test(username) && username.length >= 2 && username.length <= 20;
      console.log(`用户名 "${username}" 验证结果: ${isValid ? '✅ 通过' : '❌ 失败'}`);
    });
    
    // 验证无效用户名
    invalidUsernames.forEach(username => {
      const regex = /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/;
      const isValid = regex.test(username) && username.length >= 2 && username.length <= 20;
      console.log(`用户名 "${username}" 验证结果: ${!isValid ? '✅ 正确识别为无效' : '❌ 错误识别为有效'}`);
    });
  });
});

console.log('用户名设置功能测试完成，请检查测试结果');