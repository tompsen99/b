/**
 * 无毛绒标样管理系统 - 数据库操作
 * 使用IndexedDB实现本地数据存储
 */

// 数据库对象
const DB = {
    // 数据库名称和版本
    name: 'WoolSampleDB',
    version: 1,
    db: null,

    /**
     * 初始化数据库
     * @returns {Promise} 返回Promise对象
     */
    init() {
        return new Promise((resolve, reject) => {
            // 打开数据库连接
            const request = indexedDB.open(this.name, this.version);

            // 数据库升级事件（首次创建或版本更新时触发）
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // 创建样品存储对象
                if (!db.objectStoreNames.contains('samples')) {
                    const sampleStore = db.createObjectStore('samples', { keyPath: 'id', autoIncrement: true });
                    // 创建索引以便搜索
                    sampleStore.createIndex('batch', 'batch', { unique: false });
                    sampleStore.createIndex('type', 'type', { unique: false });
                    sampleStore.createIndex('location', 'location', { unique: false });
                    sampleStore.createIndex('date', 'date', { unique: false });
                }
                
                // 创建历史记录存储对象
                if (!db.objectStoreNames.contains('history')) {
                    const historyStore = db.createObjectStore('history', { keyPath: 'id', autoIncrement: true });
                    historyStore.createIndex('sampleId', 'sampleId', { unique: false });
                    historyStore.createIndex('date', 'date', { unique: false });
                    historyStore.createIndex('editor', 'editor', { unique: false });
                }
            };

            // 成功打开数据库
            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('数据库连接成功');
                resolve();
            };

            // 打开数据库失败
            request.onerror = (event) => {
                console.error('数据库连接失败:', event.target.error);
                reject(event.target.error);
            };
        });
    },

    /**
     * 添加新样品
     * @param {Object} sample 样品数据对象
     * @param {string} editor 编辑者姓名
     * @returns {Promise} 返回Promise对象，包含新样品的ID
     */
    addSample(sample, editor) {
        return new Promise((resolve, reject) => {
            // 添加创建时间和修改时间
            const now = new Date().toISOString();
            const newSample = {
                ...sample,
                createTime: sample.createTime || now,
                updateTime: now,
                images: this._processImages(sample.images || [])
            };

            // 开始事务
            const transaction = this.db.transaction(['samples', 'history'], 'readwrite');
            const sampleStore = transaction.objectStore('samples');
            const historyStore = transaction.objectStore('history');

            // 添加样品记录
            const sampleRequest = sampleStore.add(newSample);

            sampleRequest.onsuccess = (event) => {
                const sampleId = event.target.result;
                
                // 添加历史记录
                const historyRecord = {
                    type: 'add',
                    sampleId: sampleId,
                    sampleName: newSample.name,
                    editor: editor,
                    time: now,
                    changes: newSample
                };

                const historyRequest = historyStore.add(historyRecord);
                
                historyRequest.onsuccess = () => {
                    resolve(sampleId);
                };
                
                historyRequest.onerror = () => {
                    reject(new Error('添加历史记录失败'));
                };
            };

            sampleRequest.onerror = () => {
                reject(new Error('添加样品失败'));
            };

            transaction.oncomplete = () => {
                console.log('样品添加成功');
            };

            transaction.onerror = () => {
                reject(new Error('事务失败'));
            };
        });
    },

    /**
     * 更新样品信息
     * @param {number} id 样品ID
     * @param {Object} updates 更新的字段
     * @param {string} editor 编辑者姓名
     * @returns {Promise} 返回Promise对象
     */
    updateSample(id, updates, editor) {
        return new Promise((resolve, reject) => {
            // 开始事务
            const transaction = this.db.transaction(['samples', 'history'], 'readwrite');
            const sampleStore = transaction.objectStore('samples');
            const historyStore = transaction.objectStore('history');

            // 先获取原始数据
            const getRequest = sampleStore.get(id);

            getRequest.onsuccess = (event) => {
                const sample = event.target.result;
                if (!sample) {
                    reject(new Error('样品不存在'));
                    return;
                }

                // 记录修改前的数据
                const oldData = { ...sample };
                
                // 更新数据
                const now = new Date().toISOString();
                const updatedSample = {
                    ...sample,
                    ...updates,
                    updatedAt: now
                };
                
                // 处理图片数据
                if (updates.images) {
                    updatedSample.images = this._processImages(updates.images);
                }

                // 保存更新后的数据
                const updateRequest = sampleStore.put(updatedSample);
                
                updateRequest.onsuccess = () => {
                    // 添加历史记录
                    const changes = {};
                    
                    // 记录变更的字段
                    for (const key in updates) {
                        if (key !== 'images') { // 图片单独处理
                            changes[key] = {
                                old: oldData[key],
                                new: updates[key]
                            };
                        }
                    }
                    
                    // 如果有图片变更
                    if (updates.images) {
                        changes.images = {
                            old: `${oldData.images ? oldData.images.length : 0}张图片`,
                            new: `${updatedSample.images.length}张图片`
                        };
                    }
                    
                    const historyRecord = {
                        sampleId: id,
                        date: now,
                        editor,
                        action: 'update',
                        changes
                    };
                    
                    const historyRequest = historyStore.add(historyRecord);
                    
                    historyRequest.onsuccess = () => {
                        resolve();
                    };
                    
                    historyRequest.onerror = (event) => {
                        reject(event.target.error);
                    };
                };
                
                updateRequest.onerror = (event) => {
                    reject(event.target.error);
                };
            };

            getRequest.onerror = (event) => {
                reject(event.target.error);
            };
        });
    },

    /**
     * 删除样品
     * @param {number} id 样品ID
     * @param {string} editor 编辑者姓名
     * @returns {Promise} 返回Promise对象
     */
    deleteSample(id, editor) {
        return new Promise((resolve, reject) => {
            // 开始事务
            const transaction = this.db.transaction(['samples', 'history'], 'readwrite');
            const sampleStore = transaction.objectStore('samples');
            const historyStore = transaction.objectStore('history');

            // 先获取原始数据（用于历史记录）
            const getRequest = sampleStore.get(id);

            getRequest.onsuccess = (event) => {
                const sample = event.target.result;
                if (!sample) {
                    reject(new Error('样品不存在'));
                    return;
                }

                // 删除样品
                const deleteRequest = sampleStore.delete(id);
                
                deleteRequest.onsuccess = () => {
                    // 添加历史记录
                    const now = new Date().toISOString();
                    const historyRecord = {
                        sampleId: id,
                        date: now,
                        editor,
                        action: 'delete',
                        changes: { deletedSample: sample }
                    };
                    
                    const historyRequest = historyStore.add(historyRecord);
                    
                    historyRequest.onsuccess = () => {
                        resolve();
                    };
                    
                    historyRequest.onerror = (event) => {
                        reject(event.target.error);
                    };
                };
                
                deleteRequest.onerror = (event) => {
                    reject(event.target.error);
                };
            };

            getRequest.onerror = (event) => {
                reject(event.target.error);
            };
        });
    },

    /**
     * 获取所有样品
     * @returns {Promise} 返回Promise对象，包含样品数组
     */
    getAllSamples() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['samples'], 'readonly');
            const sampleStore = transaction.objectStore('samples');
            const request = sampleStore.getAll();

            request.onsuccess = (event) => {
                resolve(event.target.result);
            };

            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    },

    /**
     * 根据ID获取样品
     * @param {number} id 样品ID
     * @returns {Promise} 返回Promise对象，包含样品数据
     */
    getSampleById(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['samples'], 'readonly');
            const sampleStore = transaction.objectStore('samples');
            const request = sampleStore.get(id);

            request.onsuccess = (event) => {
                resolve(event.target.result);
            };

            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    },

    /**
     * 搜索样品
     * @param {string} query 搜索关键词
     * @returns {Promise} 返回Promise对象，包含匹配的样品数组
     */
    searchSamples(query) {
        return new Promise((resolve, reject) => {
            // 先获取所有样品
            this.getAllSamples()
                .then(samples => {
                    if (!query || query.trim() === '') {
                        resolve(samples);
                        return;
                    }

                    // 转为小写以便不区分大小写搜索
                    const lowerQuery = query.toLowerCase();
                    
                    // 过滤匹配的样品
                    const results = samples.filter(sample => {
                        // 搜索多个字段
                        return (
                            (sample.batch && sample.batch.toLowerCase().includes(lowerQuery)) ||
                            (sample.type && sample.type.toLowerCase().includes(lowerQuery)) ||
                            (sample.location && sample.location.toLowerCase().includes(lowerQuery)) ||
                            (sample.notes && sample.notes.toLowerCase().includes(lowerQuery))
                        );
                    });
                    
                    resolve(results);
                })
                .catch(error => reject(error));
        });
    },

    /**
     * 获取样品的历史记录
     * @param {number} sampleId 样品ID
     * @returns {Promise} 返回Promise对象，包含历史记录数组
     */
    getSampleHistory(sampleId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['history'], 'readonly');
            const historyStore = transaction.objectStore('history');
            const index = historyStore.index('sampleId');
            const request = index.getAll(sampleId);

            request.onsuccess = (event) => {
                // 按日期排序（最新的在前）
                const history = event.target.result.sort((a, b) => {
                    return new Date(b.date) - new Date(a.date);
                });
                resolve(history);
            };

            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    },

    /**
     * 获取所有历史记录
     * @returns {Promise} 返回Promise对象，包含所有历史记录
     */
    getAllHistory() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['history'], 'readonly');
            const historyStore = transaction.objectStore('history');
            const request = historyStore.getAll();

            request.onsuccess = (event) => {
                // 按日期排序（最新的在前）
                const history = event.target.result.sort((a, b) => {
                    return new Date(b.date) - new Date(a.date);
                });
                resolve(history);
            };

            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    },

    /**
     * 搜索历史记录
     * @param {string} query 搜索关键词
     * @returns {Promise} 返回Promise对象，包含匹配的历史记录
     */
    searchHistory(query) {
        return new Promise((resolve, reject) => {
            this.getAllHistory()
                .then(history => {
                    if (!query || query.trim() === '') {
                        resolve(history);
                        return;
                    }

                    const lowerQuery = query.toLowerCase();
                    
                    // 过滤匹配的历史记录
                    const results = history.filter(record => {
                        return (
                            (record.editor && record.editor.toLowerCase().includes(lowerQuery)) ||
                            (record.changes && JSON.stringify(record.changes).toLowerCase().includes(lowerQuery))
                        );
                    });
                    
                    resolve(results);
                })
                .catch(error => reject(error));
        });
    },

    /**
     * 导出所有数据
     * @returns {Promise} 返回Promise对象，包含所有数据
     */
    exportData() {
        return new Promise((resolve, reject) => {
            Promise.all([
                this.getAllSamples(),
                this.getAllHistory()
            ])
            .then(([samples, history]) => {
                const exportData = {
                    samples,
                    history,
                    exportDate: new Date().toISOString(),
                    version: this.version
                };
                resolve(exportData);
            })
            .catch(error => reject(error));
        });
    },

    /**
     * 导入数据
     * @param {Object} data 要导入的数据
     * @param {string} editor 执行导入的人员姓名
     * @returns {Promise} 返回Promise对象
     */
    importData(data, editor) {
        return new Promise((resolve, reject) => {
            if (!data || !data.samples || !data.history) {
                reject(new Error('导入数据格式不正确'));
                return;
            }

            // 清空现有数据并导入新数据
            const transaction = this.db.transaction(['samples', 'history'], 'readwrite');
            const sampleStore = transaction.objectStore('samples');
            const historyStore = transaction.objectStore('history');

            // 清空样品数据
            const clearSamplesRequest = sampleStore.clear();
            
            clearSamplesRequest.onsuccess = () => {
                // 清空历史记录
                const clearHistoryRequest = historyStore.clear();
                
                clearHistoryRequest.onsuccess = () => {
                    // 导入样品数据
                    let sampleCount = 0;
                    for (const sample of data.samples) {
                        sampleStore.add(sample);
                        sampleCount++;
                    }
                    
                    // 导入历史记录
                    let historyCount = 0;
                    for (const record of data.history) {
                        historyStore.add(record);
                        historyCount++;
                    }
                    
                    // 添加导入操作的历史记录
                    const now = new Date().toISOString();
                    const importRecord = {
                        date: now,
                        editor,
                        action: 'import',
                        changes: {
                            importedSamples: sampleCount,
                            importedHistory: historyCount,
                            importDate: now
                        }
                    };
                    
                    historyStore.add(importRecord);
                    
                    transaction.oncomplete = () => {
                        resolve({
                            sampleCount,
                            historyCount
                        });
                    };
                };
                
                clearHistoryRequest.onerror = (event) => {
                    reject(event.target.error);
                };
            };
            
            clearSamplesRequest.onerror = (event) => {
                reject(event.target.error);
            };
            
            transaction.onerror = (event) => {
                reject(event.target.error);
            };
        });
    },

    /**
     * 获取数据库使用的存储空间（估计值）
     * @returns {Promise} 返回Promise对象，包含存储空间大小（字节）
     */
    getStorageUsage() {
        return new Promise((resolve, reject) => {
            this.exportData()
                .then(data => {
                    // 将数据转换为JSON字符串，计算其大小
                    const jsonString = JSON.stringify(data);
                    const bytes = new Blob([jsonString]).size;
                    resolve(bytes);
                })
                .catch(error => reject(error));
        });
    },

    /**
     * 处理图片数据（转换为Base64存储）
     * @private
     * @param {Array} images 图片文件数组或已有的Base64图片数组
     * @returns {Array} 处理后的图片数据数组
     */
    _processImages(images) {
        // 如果已经是处理过的图片数据，直接返回
        if (images.length > 0 && typeof images[0] === 'object' && images[0].data) {
            return images;
        }

        // 处理File对象，转换为Base64
        const processedImages = [];
        
        for (const image of images) {
            // 如果是File对象，需要转换
            if (image instanceof File) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    processedImages.push({
                        name: image.name,
                        type: image.type,
                        size: image.size,
                        data: e.target.result,
                        date: new Date().toISOString()
                    });
                };
                reader.readAsDataURL(image);
            } else {
                // 已经是处理过的数据，直接添加
                processedImages.push(image);
            }
        }
        
        return processedImages;
    }
};

// 导出数据库对象
window.DB = DB; 
window.DB = DB; 