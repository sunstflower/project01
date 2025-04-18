// 前端项目管理服务
import authService from './authService';

const projectService = {
  // 获取当前用户的所有项目
  getUserProjects() {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) return [];
    
    const projectsJSON = localStorage.getItem(`projects_${currentUser.id}`);
    return projectsJSON ? JSON.parse(projectsJSON) : [];
  },
  
  // 保存项目列表
  saveProjects(projects) {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) return false;
    
    localStorage.setItem(`projects_${currentUser.id}`, JSON.stringify(projects));
    return true;
  },
  
  // 创建新项目
  createProject(projectData) {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error('未登录');
    
    const projects = this.getUserProjects();
    
    const newProject = {
      id: Date.now().toString(),
      userId: currentUser.id,
      createdAt: new Date().toISOString(),
      ...projectData
    };
    
    projects.push(newProject);
    this.saveProjects(projects);
    
    return newProject;
  },
  
  // 获取单个项目
  getProject(projectId) {
    const projects = this.getUserProjects();
    return projects.find(p => p.id === projectId);
  },
  
  // 更新项目
  updateProject(projectId, projectData) {
    const projects = this.getUserProjects();
    const index = projects.findIndex(p => p.id === projectId);
    
    if (index === -1) throw new Error('项目不存在');
    
    const updatedProject = {
      ...projects[index],
      ...projectData,
      updatedAt: new Date().toISOString()
    };
    
    projects[index] = updatedProject;
    this.saveProjects(projects);
    
    return updatedProject;
  },
  
  // 删除项目
  deleteProject(projectId) {
    let projects = this.getUserProjects();
    projects = projects.filter(p => p.id !== projectId);
    return this.saveProjects(projects);
  },
  
  // 导出项目为JSON文件
  exportProject(projectId) {
    console.log('准备导出项目，ID:', projectId);
    
    const project = this.getProject(projectId);
    console.log('找到的项目:', project);
    
    if (!project) {
      console.error('项目不存在，ID:', projectId);
      throw new Error('项目不存在');
    }
    
    try {
      const dataStr = JSON.stringify(project, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `${project.name || 'project'}_${new Date().toISOString().slice(0,10)}.json`;
      
      console.log('正在创建下载链接...');
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      
      // 添加到DOM并模拟点击
      document.body.appendChild(linkElement);
      linkElement.click();
      
      // 清理
      setTimeout(() => {
        document.body.removeChild(linkElement);
      }, 100);
      
      console.log('项目导出成功:', exportFileDefaultName);
      return true;
    } catch (error) {
      console.error('导出过程中出错:', error);
      throw error;
    }
  },
  
  // 导出当前未保存的状态
  exportCurrentState(stateData) {
    console.log('导出当前未保存状态...');
    
    try {
      // 创建临时项目对象
      const tempProject = {
        name: stateData.name || 'Untitled_Project',
        description: stateData.description || '',
        flowData: stateData.flowData,
        edgesData: stateData.edgesData,
        configData: stateData.configData,
        exportedAt: new Date().toISOString(),
        isTemporary: true
      };
      
      const dataStr = JSON.stringify(tempProject, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `${tempProject.name}_${new Date().toISOString().slice(0,10)}.json`;
      
      console.log('正在创建下载链接...');
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      
      // 添加到DOM并模拟点击
      document.body.appendChild(linkElement);
      linkElement.click();
      
      // 清理
      setTimeout(() => {
        document.body.removeChild(linkElement);
      }, 100);
      
      console.log('当前状态导出成功:', exportFileDefaultName);
      return true;
    } catch (error) {
      console.error('导出过程中出错:', error);
      throw error;
    }
  },
  
  // 导入项目
  importProject(jsonData) {
    try {
      const projectData = JSON.parse(jsonData);
      
      // 验证基本数据结构
      if (!projectData.name) {
        throw new Error('无效的项目数据');
      }
      
      // 创建新的项目ID并保留原始数据
      return this.createProject({
        name: projectData.name,
        description: projectData.description,
        flowData: projectData.flowData,
        edgesData: projectData.edgesData,
        configData: projectData.configData,
        importedAt: new Date().toISOString(),
        originalId: projectData.id
      });
    } catch (error) {
      throw new Error('导入项目失败: ' + error.message);
    }
  }
};

export default projectService; 