// 简单的前端认证服务
const authService = {
  // 从localStorage获取用户数据
  getUsers() {
    const usersJSON = localStorage.getItem('users');
    return usersJSON ? JSON.parse(usersJSON) : [];
  },

  // 保存用户数据
  saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
  },

  // 注册新用户
  register(username, email, password) {
    const users = this.getUsers();
    
    // 检查邮箱是否已被注册
    if (users.some(user => user.email === email)) {
      throw new Error('该邮箱已被注册');
    }
    
    // 创建新用户
    const newUser = {
      id: Date.now().toString(),
      username,
      email,
      password, // 注意：实际项目中应对密码进行哈希处理
      createdAt: new Date().toISOString()
    };
    
    // 添加到用户列表并保存
    users.push(newUser);
    this.saveUsers(users);
    
    // 设置当前用户
    const userToStore = { ...newUser };
    delete userToStore.password; // 不存储密码到会话
    
    localStorage.setItem('currentUser', JSON.stringify(userToStore));
    localStorage.setItem('isAuthenticated', 'true');
    
    return userToStore;
  },

  // 用户登录
  login(email, password) {
    const users = this.getUsers();
    
    // 查找匹配的用户
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      throw new Error('邮箱或密码不正确');
    }
    
    // 设置当前用户
    const userToStore = { ...user };
    delete userToStore.password; // 不存储密码到会话
    
    localStorage.setItem('currentUser', JSON.stringify(userToStore));
    localStorage.setItem('isAuthenticated', 'true');
    
    return userToStore;
  },

  // 用户登出
  logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isAuthenticated');
  },

  // 获取当前登录用户
  getCurrentUser() {
    const userJSON = localStorage.getItem('currentUser');
    return userJSON ? JSON.parse(userJSON) : null;
  },

  // 检查用户是否已登录
  isAuthenticated() {
    return localStorage.getItem('isAuthenticated') === 'true';
  },
  
  // 更新用户信息
  updateUser(userData) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return null;
    
    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    
    if (userIndex === -1) return null;
    
    // 更新用户数据
    const updatedUser = {
      ...users[userIndex],
      ...userData,
      updatedAt: new Date().toISOString()
    };
    
    users[userIndex] = updatedUser;
    this.saveUsers(users);
    
    // 更新当前用户
    const userToStore = { ...updatedUser };
    delete userToStore.password;
    
    localStorage.setItem('currentUser', JSON.stringify(userToStore));
    
    return userToStore;
  }
};

export default authService; 