/**
 * 无毛绒标样管理系统 - 主应用逻辑
 * 包含系统的核心功能实现
 */

// 应用主类
class App {
    constructor() {
        // 系统配置
        this.config = {
            password: '20770', // 系统密码
            version: '1.0.0'   // 系统版本
        };

        // 状态管理
        this.state = {
            currentPage: 'login',  // 当前页面
            currentSample: null,   // 当前查看的样品
            isEditing: false,      // 是否处于编辑状态
            searchQuery: '',       // 搜索关键词
            editorName: ''         // 当前修改人姓名
        };

        // 缓存DOM元素
        this.elements = {
            // 登录页面元素
            loginPage: document.getElementById('login-page'),
            password: document.getElementById('password'),
            loginBtn: document.getElementById('login-btn'),
            loginError: document.getElementById('login-error'),
            
            // 主应用容器
            app: document.getElementById('app'),
            
            // 导航按钮
            homeBtn: document.getElementById('home-btn'),
            historyBtn: document.getElementById('history-btn'),
            settingsBtn: document.getElementById('settings-btn'),
            
            // 页面容器
            homePage: document.getElementById('home-page'),
            detailPage: document.getElementById('detail-page'),
            editPage: document.getElementById('edit-page'),
            historyPage: document.getElementById('history-page'),
            settingsPage: document.getElementById('settings-page'),
            
            // 搜索相关元素
            searchInput: document.getElementById('search-input'),
            searchBtn: document.getElementById('search-btn'),
            addBtn: document.getElementById('add-btn'),
            
            // 列表和详情容器
            samplesContainer: document.getElementById('samples-container'),
            detailContainer: document.getElementById('detail-container'),
            
            // 返回按钮
            backToList: document.getElementById('back-to-list'),
            backFromEdit: document.getElementById('back-from-edit'),
            
            // 详情页按钮
            editSample: document.getElementById('edit-sample'),
            shareSample: document.getElementById('share-sample'),
            deleteSample: document.getElementById('delete-sample'),
            
            // 编辑页元素
            editTitle: document.getElementById('edit-title'),
            sampleForm: document.getElementById('sample-form'),
            saveSample: document.getElementById('save-sample'),
            images: document.getElementById('images'),
            imagePreview: document.getElementById('image-preview'),
            
            // 编辑者信息弹窗
            editorModal: document.getElementById('editor-modal'),
            editorName: document.getElementById('editor-name'),
            confirmEdit: document.getElementById('confirm-edit'),
            cancelEdit: document.getElementById('cancel-edit'),
            
            // 删除确认弹窗
            confirmModal: document.getElementById('confirm-modal'),
            confirmDelete: document.getElementById('confirm-delete'),
            cancelDelete: document.getElementById('cancel-delete'),
            
            // 二维码弹窗
            qrcodeModal: document.getElementById('qrcode-modal'),
            qrcodeContainer: document.getElementById('qrcode-container'),
            closeQrcode: document.getElementById('close-qrcode'),
            
            // 历史记录页面元素
            historyList: document.getElementById('history-list'),
            historySearch: document.getElementById('history-search'),
            historySearchBtn: document.getElementById('history-search-btn'),
            
            // 设置页面元素
            storageUsage: document.getElementById('storage-usage'),
            recordCount: document.getElementById('record-count'),
            exportData: document.getElementById('export-data'),
            importData: document.getElementById('import-data'),
            importFile: document.getElementById('import-file')
        };
        
        // 初始化数据库
        this.db = null;
        this.currentSample = null;
        this.hasUnsavedChanges = false;
        
        // 初始化应用
        this.init();
    }

    /**
     * 初始化应用
     */
    async init() {
        try {
            // 绑定事件处理器
            this.bindEvents();
            
            // 显示登录页面
            this.elements.loginPage.classList.remove('hidden');
            
            console.log('应用初始化成功');
            
        } catch (error) {
            console.error('应用初始化失败:', error);
            alert('应用初始化失败: ' + error.message);
        }
    }

    /**
     * 初始化数据库
     */
    async initDatabase() {
        try {
            // 初始化数据库
            this.db = await DB.init();
            console.log('数据库初始化成功');
            
            // 加载样品列表
            await this.loadSamples();
            
        } catch (error) {
            console.error('数据库初始化失败:', error);
            throw new Error('数据库初始化失败，请刷新页面重试');
        }
    }

    // 绑定事件处理器
    bindEvents() {
        // 登录相关
        this.elements.loginBtn.addEventListener('click', () => this.handleLogin());
        this.elements.password.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });

        // 导航按钮
        this.elements.homeBtn.addEventListener('click', () => this.showPage('home'));
        this.elements.historyBtn.addEventListener('click', () => this.showPage('history'));
        this.elements.settingsBtn.addEventListener('click', () => this.showPage('settings'));

        // 搜索相关
        this.elements.searchBtn.addEventListener('click', () => this.handleSearch());
        this.elements.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });
        this.elements.historySearchBtn.addEventListener('click', () => this.handleHistorySearch());
        this.elements.historySearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleHistorySearch();
        });

        // 添加样品按钮
        this.elements.addBtn.addEventListener('click', () => this.handleEdit());

        // 返回按钮
        this.elements.backToList.addEventListener('click', () => this.showPage('home'));
        this.elements.backFromEdit.addEventListener('click', () => this.handleCancelEdit());

        // 详情页按钮
        this.elements.editSample.addEventListener('click', () => this.handleEdit());
        this.elements.shareSample.addEventListener('click', () => this.handleShare());
        this.elements.deleteSample.addEventListener('click', () => this.handleDelete());

        // 编辑页按钮
        this.elements.saveSample.addEventListener('click', (e) => {
            e.preventDefault(); // 阻止默认行为
            this.handleSave();
        });

        // 表单提交处理
        this.elements.sampleForm.addEventListener('submit', (e) => {
            e.preventDefault(); // 阻止表单默认提交
            this.handleSave();
        });

        // 设置页按钮
        this.elements.exportData.addEventListener('click', () => this.handleExport());
        this.elements.importData.addEventListener('click', () => {
            this.elements.importFile.click();
        });
        this.elements.importFile.addEventListener('change', (e) => this.handleImport(e));

        // 修改人信息弹窗按钮
        this.elements.cancelEdit.addEventListener('click', () => this.hideEditorModal());
        this.elements.confirmEdit.addEventListener('click', () => this.handleEditorConfirm());

        // 确认删除弹窗按钮
        this.elements.cancelDelete.addEventListener('click', () => this.hideConfirmModal());
        this.elements.confirmDelete.addEventListener('click', () => this.handleDeleteConfirm());

        // 二维码弹窗按钮
        this.elements.closeQrcode.addEventListener('click', () => this.hideQrcodeModal());

        // 图片上传处理
        this.elements.images.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            Promise.all(files.map(file => Utils.readFile(file)))
                .then(images => {
                    this.state.currentSample = this.state.currentSample || {};
                    this.state.currentSample.images = this.state.currentSample.images || [];
                    this.state.currentSample.images.push(...images);
                    this.renderImagePreviews(this.state.currentSample.images);
                })
                .catch(error => {
                    console.error('图片上传失败:', error);
                    Utils.showMessage('图片上传失败', 'error');
                });
        });
    }

    /**
     * 显示指定页面
     * @param {string} pageName 页面名称：'home'|'detail'|'edit'|'history'|'settings'
     */
    async showPage(pageName) {
        try {
            // 隐藏所有页面
            const pages = ['home', 'detail', 'edit', 'history', 'settings'];
            pages.forEach(page => {
                const element = this.elements[page + 'Page'];
                if (element) {
                    element.classList.add('hidden');
                }
            });
            
            // 移除所有导航按钮的激活状态
            ['home', 'history', 'settings'].forEach(nav => {
                const button = this.elements[nav + 'Btn'];
                if (button) {
                    button.classList.remove('active');
                }
            });
            
            // 显示目标页面
            const targetPage = this.elements[pageName + 'Page'];
            if (!targetPage) {
                throw new Error(`页面 ${pageName} 不存在`);
            }
            targetPage.classList.remove('hidden');
            
            // 激活对应的导航按钮
            if (['home', 'history', 'settings'].includes(pageName)) {
                const navButton = this.elements[pageName + 'Btn'];
                if (navButton) {
                    navButton.classList.add('active');
                }
            }
            
            // 根据页面类型执行特定操作
            switch (pageName) {
                case 'home':
                    await this.loadSamples();
                    break;
                case 'history':
                    await this.loadHistory();
                    break;
                case 'settings':
                    await this.loadSettings();
                    break;
            }
        } catch (error) {
            console.error('切换页面失败:', error);
            alert('切换页面时发生错误: ' + error.message);
        }
    }

    /**
     * 处理登录
     */
    async handleLogin() {
        try {
            const password = this.elements.password.value;
            
            if (!password) {
                this.elements.loginError.textContent = '请输入密码';
                return;
            }
            
            if (password !== this.config.password) {
                this.elements.loginError.textContent = '密码错误';
                return;
            }
            
            // 隐藏登录页面
            this.elements.loginPage.classList.add('hidden');
            
            // 显示主应用
            this.elements.app.classList.remove('hidden');
            
            // 初始化数据库
            await this.initDatabase();
            
            // 显示主页
            await this.showPage('home');
            
        } catch (error) {
            console.error('登录失败:', error);
            this.elements.loginError.textContent = '登录失败，请重试';
        }
    }

    /**
     * 加载样品列表
     */
    async loadSamples() {
        try {
            // 获取所有样品
            const samples = await DB.getAllSamples();
            
            // 清空容器
            this.elements.samplesContainer.innerHTML = '';
            
            if (samples.length === 0) {
                // 显示空状态
                this.elements.samplesContainer.innerHTML = `
                    <div class="empty-message">暂无标样记录，请点击"添加标样"按钮添加</div>
                `;
                return;
            }
            
            // 创建样品列表
            const list = document.createElement('div');
            list.className = 'samples-grid';
            
            // 渲染每个样品
            samples.forEach(sample => {
                const card = document.createElement('div');
                card.className = 'sample-card';
                card.innerHTML = `
                    <div class="sample-info">
                        <h3>${sample.batch || '未知批次'}</h3>
                        <p>类型: ${sample.type || '未知'}</p>
                        <p>道数: ${sample.track || '未知'}</p>
                        <p>存放地点: ${sample.location || '未知'}</p>
                    </div>
                `;
                
                // 添加点击事件
                card.addEventListener('click', () => this.showSampleDetail(sample.id));
                
                list.appendChild(card);
            });
            
            this.elements.samplesContainer.appendChild(list);
            
        } catch (error) {
            console.error('加载样品列表失败:', error);
            alert('加载样品列表失败: ' + error.message);
        }
    }

    // 处理搜索
    async handleSearch() {
        const query = this.elements.searchInput.value.trim();
        this.state.searchQuery = query;
        
        try {
            const samples = await DB.searchSamples(query);
            this.renderSamples(samples);
        } catch (error) {
            console.error('搜索样品失败:', error);
            Utils.showMessage('搜索失败', 'error');
        }
    }

    // 显示样品详情
    async showSampleDetail(id) {
        try {
            const sample = await DB.getSampleById(id);
            if (!sample) {
                Utils.showMessage('样品不存在', 'error');
                return;
            }

            this.state.currentSample = sample;
            this.elements.detailContainer.innerHTML = `
                <div class="detail-header">
                    <h2>${sample.name}</h2>
                    <div class="detail-meta">
                        <span>编号: ${sample.id}</span>
                        <span>创建时间: ${Utils.formatDate(sample.createTime)}</span>
                        <span>最后更新: ${Utils.formatDate(sample.updateTime)}</span>
                    </div>
                </div>
                <div class="detail-content">
                    <div class="detail-images">
                        ${sample.images.map(img => `
                            <div class="detail-image">
                                <img src="${img}" alt="样品图片" onclick="app.showImagePreview('${img}')">
                            </div>
                        `).join('')}
                    </div>
                    <div class="detail-info">
                        <p class="detail-description">${sample.description || '暂无描述'}</p>
                        <div class="detail-properties">
                            ${Object.entries(sample.properties || {}).map(([key, value]) => `
                                <div class="property-item">
                                    <span class="property-label">${key}:</span>
                                    <span class="property-value">${value}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;

            this.showPage('detail');
        } catch (error) {
            console.error('加载样品详情失败:', error);
            Utils.showMessage('加载样品详情失败', 'error');
        }
    }

    // 显示图片预览
    showImagePreview(imageUrl) {
        const modal = document.createElement('div');
        modal.className = 'image-preview-modal';
        modal.innerHTML = `
            <div class="image-preview-content">
                <img src="${imageUrl}" alt="预览图片">
                <button class="close-preview">&times;</button>
            </div>
        `;
        
        modal.querySelector('.close-preview').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        document.body.appendChild(modal);
    }

    /**
     * 显示编辑页面
     * @param {Object} [sample] 要编辑的样品数据，如果不提供则为新增模式
     */
    showEditPage(sample = null) {
        // 更新标题
        this.elements.editTitle.textContent = sample ? '编辑标样' : '添加标样';
        
        // 重置表单
        this.elements.sampleForm.reset();
        this.elements.imagePreview.innerHTML = '';
        
        // 如果是编辑模式，填充表单数据
        if (sample) {
            this.state.currentSample = sample;
            Utils.fillFormData(this.elements.sampleForm, sample);
            if (sample.images && sample.images.length > 0) {
                this.renderImagePreviews(sample.images);
            }
        } else {
            this.state.currentSample = null;
        }
        
        // 重置未保存更改标志
        this.state.isEditing = true;
        
        // 显示编辑页面
        this.showPage('edit');
    }

    // 渲染图片预览
    renderImagePreviews(images) {
        const container = this.elements.imagePreview;
        container.innerHTML = '';
        
        images.forEach((imageUrl, index) => {
            const preview = document.createElement('div');
            preview.className = 'preview-item';
            preview.innerHTML = `
                <img src="${imageUrl}" alt="预览图片">
                <button type="button" class="remove-image" data-index="${index}">&times;</button>
            `;
            
            preview.querySelector('.remove-image').addEventListener('click', () => {
                this.removeImage(index);
            });
            
            container.appendChild(preview);
        });
    }

    // 移除图片
    removeImage(index) {
        const sample = this.state.currentSample;
        if (sample && sample.images) {
            sample.images.splice(index, 1);
            this.renderImagePreviews(sample.images);
        }
    }

    // 处理编辑操作
    handleEdit() {
        this.showEditorModal();
    }

    // 显示修改人信息输入框
    showEditorModal() {
        this.elements.editorModal.classList.remove('hidden');
        this.elements.editorName.focus();
    }

    // 隐藏修改人信息输入框
    hideEditorModal() {
        this.elements.editorModal.classList.add('hidden');
        this.elements.editorName.value = '';
    }

    // 处理修改人信息确认
    handleEditorConfirm() {
        const editorName = this.elements.editorName.value.trim();
        if (!editorName) {
            Utils.showMessage('请输入修改人姓名', 'error');
            return;
        }
        
        this.state.editorName = editorName;
        this.hideEditorModal();
        
        if (this.state.currentSample) {
            this.showEditPage(this.state.currentSample);
        } else {
            this.showEditPage();
        }
    }

    // 处理保存操作
    async handleSave() {
        if (!this.state.editorName) {
            this.showEditorModal();
            return;
        }

        const formData = Utils.getFormData(this.elements.sampleForm);
        if (!formData.batch) {
            Utils.showMessage('请输入批次号', 'error');
            return;
        }

        try {
            // 确保图片数据被包含在表单数据中
            if (this.state.currentSample && this.state.currentSample.images) {
                formData.images = this.state.currentSample.images;
            }

            if (this.state.currentSample && this.state.currentSample.id) {
                // 更新样品
                await DB.updateSample(
                    this.state.currentSample.id,
                    formData,
                    this.state.editorName
                );
                Utils.showMessage('样品更新成功', 'success');
            } else {
                // 添加新样品
                formData.images = formData.images || [];
                await DB.addSample(formData, this.state.editorName);
                Utils.showMessage('样品添加成功', 'success');
            }

            // 重置状态
            this.state.currentSample = null;
            this.state.isEditing = false;
            this.state.editorName = '';

            // 返回主页并刷新列表
            this.showPage('home');
        } catch (error) {
            console.error('保存样品失败:', error);
            Utils.showMessage('保存失败，请重试', 'error');
        }
    }

    // 处理取消编辑
    handleCancelEdit() {
        if (this.state.isEditing) {
            if (confirm('确定要取消编辑吗？未保存的修改将会丢失。')) {
                this.state.currentSample = null;
                this.state.isEditing = false;
                this.state.editorName = '';
                this.showPage('home');
            }
        } else {
            this.showPage('home');
        }
    }

    // 处理删除操作
    handleDelete() {
        this.elements.confirmModal.style.display = 'block';
    }

    // 隐藏确认删除对话框
    hideConfirmModal() {
        this.elements.confirmModal.style.display = 'none';
    }

    // 处理删除确认
    async handleDeleteConfirm() {
        if (!this.state.currentSample) {
            return;
        }

        try {
            await DB.deleteSample(this.state.currentSample.id, this.state.editorName);
            Utils.showMessage('样品删除成功', 'success');
            this.hideConfirmModal();
            this.showPage('home');
        } catch (error) {
            console.error('删除样品失败:', error);
            Utils.showMessage('删除失败，请重试', 'error');
        }
    }

    // 加载历史记录
    async loadHistory() {
        try {
            const history = await DB.getAllHistory();
            this.renderHistory(history);
        } catch (error) {
            console.error('加载历史记录失败:', error);
            Utils.showMessage('加载历史记录失败', 'error');
        }
    }

    // 渲染历史记录
    renderHistory(history) {
        const container = this.elements.historyList;
        container.innerHTML = '';

        if (history.length === 0) {
            container.innerHTML = '<div class="empty-message">暂无历史记录</div>';
            return;
        }

        history.forEach(record => {
            const item = document.createElement('div');
            item.className = 'history-item';
            item.innerHTML = `
                <div class="history-header">
                    <span class="history-time">${Utils.formatDate(record.time, true)}</span>
                    <span class="history-editor">${record.editor}</span>
                </div>
                <div class="history-content">
                    <span class="history-type ${record.type}">${this.getHistoryTypeText(record.type)}</span>
                    <span class="history-sample-name">${record.sampleName}</span>
                    ${record.changes ? `
                        <div class="history-changes">
                            ${this.formatHistoryChanges(record.changes)}
                        </div>
                    ` : ''}
                </div>
            `;
            
            item.addEventListener('click', () => {
                if (record.sampleId) {
                    this.showSampleDetail(record.sampleId);
                }
            });
            
            container.appendChild(item);
        });
    }

    // 获取历史记录类型文本
    getHistoryTypeText(type) {
        const types = {
            'add': '新增',
            'update': '更新',
            'delete': '删除'
        };
        return types[type] || type;
    }

    // 格式化历史记录变更内容
    formatHistoryChanges(changes) {
        if (!changes) return '';
        
        return Object.entries(changes)
            .map(([key, value]) => {
                if (Array.isArray(value)) {
                    return `<div class="change-item">
                        <span class="change-key">${key}</span>
                        <span class="change-value">${value[0]} → ${value[1]}</span>
                    </div>`;
                }
                return `<div class="change-item">
                    <span class="change-key">${key}</span>
                    <span class="change-value">${value}</span>
                </div>`;
            })
            .join('');
    }

    // 处理历史记录搜索
    async handleHistorySearch() {
        const query = this.elements.historySearch.value.trim();
        
        try {
            const history = await DB.searchHistory(query);
            this.renderHistory(history);
        } catch (error) {
            console.error('搜索历史记录失败:', error);
            Utils.showMessage('搜索失败', 'error');
        }
    }

    /**
     * 加载设置页面信息
     */
    async loadSettings() {
        try {
            // 获取存储空间使用情况
            const bytes = await DB.getStorageUsage();
            this.elements.storageUsage.textContent = Utils.formatBytes(bytes);
            
            // 获取记录数量
            const samples = await DB.getAllSamples();
            const history = await DB.getAllHistory();
            this.elements.recordCount.textContent = `样品: ${samples.length} | 历史记录: ${history.length}`;
            
        } catch (error) {
            console.error('加载设置信息失败:', error);
            alert('加载设置信息失败: ' + error.message);
        }
    }

    // 处理数据导出
    async handleExport() {
        try {
            const data = await DB.exportData();
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `无毛绒标样管理系统数据备份_${Utils.formatDate(new Date())}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            Utils.showMessage('数据导出成功', 'success');
        } catch (error) {
            console.error('数据导出失败:', error);
            Utils.showMessage('数据导出失败', 'error');
        }
    }

    // 处理数据导入
    async handleImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    await DB.importData(data, this.state.editorName || '系统');
                    Utils.showMessage('数据导入成功', 'success');
                    this.loadSettings();
                    this.showPage('home');
                } catch (error) {
                    console.error('数据导入失败:', error);
                    Utils.showMessage('数据导入失败，请检查文件格式', 'error');
                }
            };
            reader.readAsText(file);
        } catch (error) {
            console.error('读取文件失败:', error);
            Utils.showMessage('读取文件失败', 'error');
        } finally {
            event.target.value = ''; // 清空文件输入框
        }
    }

    // 处理分享
    handleShare() {
        if (!this.state.currentSample) return;

        const qrcode = new QRCode(this.elements.qrcodeContainer, {
            text: JSON.stringify(this.state.currentSample),
            width: 256,
            height: 256,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });

        this.elements.qrcodeModal.style.display = 'block';
    }

    // 隐藏二维码弹窗
    hideQrcodeModal() {
        this.elements.qrcodeModal.style.display = 'none';
        this.elements.qrcodeContainer.innerHTML = ''; // 清除二维码
    }
}

// 创建应用实例
const app = new App();
