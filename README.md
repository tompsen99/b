# 无毛绒标样管理系统

## 项目概述
这是一个用于管理无毛绒标样的前端系统，采用苹果设计风格，所有数据存储在本地，不会上传到服务器。系统支持数据的导入导出、二维码分享，并且有密码保护功能。

## 功能特点
- **苹果设计风格**：简洁、美观的用户界面
- **本地数据存储**：使用浏览器的IndexedDB存储所有数据，保证数据安全
- **密码保护**：查看数据需要输入固定密码
- **数据导入导出**：支持将数据导出为JSON文件，也可以从JSON文件导入数据
- **二维码分享**：可以将数据生成二维码进行分享
- **数据搜索**：支持按多种条件搜索数据
- **修改历史记录**：记录所有修改操作，包括修改人姓名
- **图片上传**：支持上传多种格式的图片，不限制大小
- **响应式设计**：适配不同尺寸的设备

## 页面结构
1. **登录页面**：输入密码进入系统
2. **主页/列表页**：显示所有标样记录，支持搜索和筛选
3. **详情页**：查看单个标样的详细信息
4. **编辑页**：添加或编辑标样信息
5. **历史记录页**：查看修改历史
6. **设置页**：导入导出数据等功能

## 数据结构
标样记录包含以下字段：
- 批次
- 类型
- 道数
- 时间
- 重量
- 图片（多张）
- 存放地点
- 备注
- 具体数据：
  - 长度
  - 细度
  - CV
  - 离散
  - 含粗
  - 含杂
- 修改历史

## 技术实现
- HTML5 + CSS3 + JavaScript
- IndexedDB 用于本地数据存储
- QRCode.js 用于生成二维码
- 使用Flexbox和Grid布局
- 响应式设计适配不同设备

## 使用说明
1. 首次使用时，需要输入密码()进入系统
2. 在主页可以查看所有标样记录，使用搜索框搜索特定记录
3. 点击"添加"按钮添加新记录
4. 点击记录可以查看详情
5. 在详情页可以编辑或删除记录
6. 在设置页可以导出或导入数据

## 文件结构
- `index.html`: 主入口文件
- `css/`: 样式文件目录
  - `style.css`: 主样式文件
  - `apple-style.css`: 苹果风格样式
- `js/`: JavaScript文件目录
  - `app.js`: 主应用逻辑
  - `database.js`: 数据库操作
  - `qrcode.js`: 二维码生成
  - `utils.js`: 工具函数
- `img/`: 图片资源目录
- `favicon.ico`: 网站图标 
