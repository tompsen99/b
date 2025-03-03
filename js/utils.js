/**
 * 无毛绒标样管理系统 - 工具函数
 * 包含各种辅助功能
 */

// 工具函数对象
const Utils = {
    /**
     * 格式化日期时间
     * @param {string} dateString ISO格式的日期字符串
     * @param {boolean} includeTime 是否包含时间
     * @returns {string} 格式化后的日期时间字符串
     */
    formatDate(dateString, includeTime = true) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        
        // 检查日期是否有效
        if (isNaN(date.getTime())) {
            return dateString;
        }
        
        // 格式化日期部分
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        const dateFormatted = `${year}-${month}-${day}`;
        
        // 如果不需要时间部分，直接返回日期
        if (!includeTime) {
            return dateFormatted;
        }
        
        // 格式化时间部分
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${dateFormatted} ${hours}:${minutes}`;
    },

    /**
     * 格式化文件大小
     * @param {number} bytes 文件大小（字节）
     * @returns {string} 格式化后的文件大小
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * 生成唯一ID
     * @returns {string} 唯一ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * 防抖函数
     * @param {Function} func 要执行的函数
     * @param {number} wait 等待时间（毫秒）
     * @returns {Function} 防抖处理后的函数
     */
    debounce(func, wait) {
        let timeout;
        
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * 节流函数
     * @param {Function} func 要执行的函数
     * @param {number} limit 限制时间（毫秒）
     * @returns {Function} 节流处理后的函数
     */
    throttle(func, limit) {
        let inThrottle;
        
        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => {
                    inThrottle = false;
                }, limit);
            }
        };
    },

    /**
     * 深拷贝对象
     * @param {Object} obj 要拷贝的对象
     * @returns {Object} 拷贝后的新对象
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        
        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }
        
        if (obj instanceof Array) {
            return obj.map(item => this.deepClone(item));
        }
        
        if (obj instanceof Object) {
            const copy = {};
            Object.keys(obj).forEach(key => {
                copy[key] = this.deepClone(obj[key]);
            });
            return copy;
        }
        
        throw new Error('无法复制的对象类型');
    },

    /**
     * 将对象转换为FormData
     * @param {Object} obj 要转换的对象
     * @returns {FormData} 转换后的FormData对象
     */
    objectToFormData(obj) {
        const formData = new FormData();
        
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                formData.append(key, obj[key]);
            }
        }
        
        return formData;
    },

    /**
     * 从表单元素获取数据
     * @param {HTMLFormElement} form 表单元素
     * @returns {Object} 表单数据对象
     */
    getFormData(form) {
        const data = {};
        
        // 获取所有表单元素
        Array.from(form.elements).forEach(element => {
            if (element.name) {
                switch (element.type) {
                    case 'file':
                        // 文件输入框单独处理
                        break;
                    case 'checkbox':
                        data[element.name] = element.checked;
                        break;
                    case 'radio':
                        if (element.checked) {
                            data[element.name] = element.value;
                        }
                        break;
                    case 'select-multiple':
                        data[element.name] = Array.from(element.selectedOptions).map(option => option.value);
                        break;
                    default:
                        // 对于普通输入框，如果值为空字符串，则设置为null
                        data[element.name] = element.value.trim() || null;
                }
            }
        });

        // 添加必要的字段
        if (!data.id) {
            data.id = this.generateId();
        }
        data.createTime = data.createTime || new Date().toISOString();
        data.updateTime = new Date().toISOString();
        
        return data;
    },

    /**
     * 将数据填充到表单
     * @param {HTMLFormElement} form 表单元素
     * @param {Object} data 数据对象
     */
    fillFormData(form, data) {
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                const input = form.elements[key];
                
                if (input) {
                    switch (input.type) {
                        case 'checkbox':
                            input.checked = data[key];
                            break;
                        case 'radio':
                            const radio = form.querySelector(`input[name="${key}"][value="${data[key]}"]`);
                            if (radio) {
                                radio.checked = true;
                            }
                            break;
                        case 'select-multiple':
                            if (Array.isArray(data[key])) {
                                Array.from(input.options).forEach(option => {
                                    option.selected = data[key].includes(option.value);
                                });
                            }
                            break;
                        default:
                            input.value = data[key] || '';
                    }
                }
            }
        }
    },

    /**
     * 显示提示消息
     * @param {string} message 消息内容
     * @param {string} type 消息类型（success, error, warning, info）
     * @param {number} duration 显示时间（毫秒）
     */
    showMessage(message, type = 'info', duration = 3000) {
        // 创建消息元素
        const messageElement = document.createElement('div');
        messageElement.className = `message message-${type}`;
        messageElement.textContent = message;
        
        // 添加到页面
        document.body.appendChild(messageElement);
        
        // 显示动画
        setTimeout(() => {
            messageElement.classList.add('show');
        }, 10);
        
        // 自动关闭
        setTimeout(() => {
            messageElement.classList.remove('show');
            
            // 移除元素
            setTimeout(() => {
                document.body.removeChild(messageElement);
            }, 300);
        }, duration);
    },

    /**
     * 确认对话框
     * @param {string} message 确认消息
     * @returns {Promise} 返回Promise对象，用户确认为resolve，取消为reject
     */
    confirm(message) {
        return new Promise((resolve, reject) => {
            const confirmed = window.confirm(message);
            
            if (confirmed) {
                resolve();
            } else {
                reject();
            }
        });
    },

    /**
     * 下载文件
     * @param {string} content 文件内容
     * @param {string} fileName 文件名
     * @param {string} contentType 内容类型
     */
    downloadFile(content, fileName, contentType) {
        const a = document.createElement('a');
        const file = new Blob([content], { type: contentType });
        
        a.href = URL.createObjectURL(file);
        a.download = fileName;
        a.click();
        
        URL.revokeObjectURL(a.href);
    },

    /**
     * 读取文件内容
     * @param {File} file 文件对象
     * @returns {Promise} 返回Promise对象，包含文件内容
     */
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                resolve(event.target.result);
            };
            
            reader.onerror = (error) => {
                reject(error);
            };
            
            reader.readAsText(file);
        });
    },

    /**
     * 生成二维码数据
     * @param {Object} data 要编码的数据
     * @returns {string} 编码后的字符串
     */
    generateQRCodeData(data) {
        // 将数据转换为JSON字符串
        return JSON.stringify(data);
    },

    /**
     * 解析二维码数据
     * @param {string} qrData 二维码数据
     * @returns {Object} 解析后的数据对象
     */
    parseQRCodeData(qrData) {
        try {
            return JSON.parse(qrData);
        } catch (error) {
            console.error('解析二维码数据失败:', error);
            return null;
        }
    },

    /**
     * 验证密码
     * @param {string} password 输入的密码
     * @param {string} correctPassword 正确的密码
     * @returns {boolean} 密码是否正确
     */
    validatePassword(password, correctPassword) {
        return password === correctPassword;
    },

    /**
     * 获取URL参数
     * @param {string} name 参数名
     * @returns {string|null} 参数值，不存在则返回null
     */
    getUrlParam(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    },

    /**
     * 设置URL参数
     * @param {string} name 参数名
     * @param {string} value 参数值
     */
    setUrlParam(name, value) {
        const url = new URL(window.location.href);
        url.searchParams.set(name, value);
        window.history.replaceState({}, '', url);
    },

    /**
     * 删除URL参数
     * @param {string} name 参数名
     */
    removeUrlParam(name) {
        const url = new URL(window.location.href);
        url.searchParams.delete(name);
        window.history.replaceState({}, '', url);
    },

    /**
     * 检查浏览器是否支持IndexedDB
     * @returns {boolean} 是否支持
     */
    isIndexedDBSupported() {
        return 'indexedDB' in window;
    },

    /**
     * 检查浏览器是否支持本地存储
     * @returns {boolean} 是否支持
     */
    isLocalStorageSupported() {
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            return true;
        } catch (e) {
            return false;
        }
    },

    /**
     * 获取浏览器语言
     * @returns {string} 浏览器语言代码
     */
    getBrowserLanguage() {
        return navigator.language || navigator.userLanguage;
    },

    /**
     * 检查是否是移动设备
     * @returns {boolean} 是否是移动设备
     */
    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },

    /**
     * 获取设备类型
     * @returns {string} 设备类型（mobile, tablet, desktop）
     */
    getDeviceType() {
        const ua = navigator.userAgent;
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
            return 'tablet';
        }
        if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
            return 'mobile';
        }
        return 'desktop';
    }
};

// 导出工具函数对象
window.Utils = Utils; 