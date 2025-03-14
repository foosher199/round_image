// 在文件顶部添加当前语言变量
let currentLang = getBrowserLanguage(); // 使用函数获取浏览器语言

// 获取DOM元素
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const uploadContainer = document.getElementById('uploadContainer');
const editorContainer = document.getElementById('editorContainer');
const previewImage = document.getElementById('previewImage');
const radiusSlider = document.getElementById('radiusSlider');
const radiusInput = document.getElementById('radiusInput');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');
const imageList = document.getElementById('imageList');
const imageCount = document.getElementById('imageCount');
const downloadAllBtn = document.getElementById('downloadAllBtn');

// 当前上传的图片
let currentImage = null;

// 存储所有上传的图片
let images = [];
let currentImageIndex = 0;

// 获取语言切换按钮
const langButtons = document.querySelectorAll('.lang-btn');

// 添加获取浏览器语言的函数
function getBrowserLanguage() {
    // 获取浏览器语言
    const browserLang = navigator.language || navigator.userLanguage;
    
    // 获取语言代码的前两个字符（例如 'zh-CN' 变成 'zh'）
    const langCode = browserLang.toLowerCase().split('-')[0];
    
    // 检查是否支持该语言，如果不支持则返回英文
    return i18n[langCode] ? langCode : 'en';
}

// 初始化事件监听
function init() {
    // 立即更新语言，确保标题正确显示
    updateLanguage();

    // 点击上传区域触发文件选择
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    // 文件选择变化时处理上传
    fileInput.addEventListener('change', handleFileSelect);

    // 拖放事件处理
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);

    // 圆角滑块变化时更新输入框和预览
    radiusSlider.addEventListener('input', () => {
        radiusInput.value = radiusSlider.value;
        updatePreview();
    });

    // 圆角输入框变化时更新滑块和预览
    radiusInput.addEventListener('input', () => {
        // 只限制最小值为0，不限制最大值
        let value = parseInt(radiusInput.value);
        if (isNaN(value)) value = 0;
        if (value < 0) value = 0;
        
        radiusInput.value = value;
        
        // 如果值超过滑块最大值，将滑块设为最大值
        if (value > 100) {
            radiusSlider.value = 100;
        } else {
            radiusSlider.value = value;
        }
        
        updatePreview();
    });

    // 下载按钮点击事件
    downloadBtn.addEventListener('click', downloadImage);

    // 重置按钮点击事件
    resetBtn.addEventListener('click', resetEditor);

    // 添加下载所有图片按钮事件
    downloadAllBtn.addEventListener('click', downloadAllImages);

    // 添加语言切换事件
    langButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.dataset.lang;
            if (lang !== currentLang) {
                currentLang = lang;
                updateLanguage();
                
                // 更新按钮状态
                langButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            }
        });
    });

    // 设置初始语言按钮状态
    langButtons.forEach(btn => {
        if (btn.dataset.lang === currentLang) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// 处理文件选择
function handleFileSelect(event) {
    const files = event.target.files;
    if (files.length > 0) {
        processMultipleImages(files);
    }
}

// 处理拖拽悬停
function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    uploadArea.classList.add('drag-over');
}

// 处理拖拽离开
function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    uploadArea.classList.remove('drag-over');
}

// 处理拖放
function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    uploadArea.classList.remove('drag-over');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        processMultipleImages(files);
    }
}

// 处理多张图片
function processMultipleImages(files) {
    // 清空之前的图片
    images = [];
    imageList.innerHTML = '';
    
    // 显示编辑器，隐藏上传区域
    uploadContainer.style.display = 'none';
    editorContainer.style.display = 'flex';
    
    // 处理每张图片
    Array.from(files).forEach((file, index) => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const img = new Image();
                img.src = e.target.result;
                
                img.onload = function() {
                    // 添加到图片数组
                    images.push({
                        original: img,
                        processed: null,
                        file: file
                    });
                    
                    // 更新图片计数
                    imageCount.textContent = images.length;
                    
                    // 添加到图片列表
                    addImageToList(img, images.length - 1);
                    
                    // 如果是第一张图片，显示预览
                    if (index === 0) {
                        currentImageIndex = 0;
                        currentImage = img;
                        updatePreview();
                    }
                };
            };
            
            reader.readAsDataURL(file);
        }
    });
}

// 添加图片到列表
function addImageToList(img, index) {
    const imageItem = document.createElement('div');
    imageItem.className = 'image-item';
    imageItem.dataset.index = index;
    
    if (index === currentImageIndex) {
        imageItem.classList.add('active');
    }
    
    const thumbnail = document.createElement('img');
    thumbnail.src = img.src;
    thumbnail.alt = `图片 ${index + 1}`;
    
    imageItem.appendChild(thumbnail);
    
    // 添加点击事件
    imageItem.addEventListener('click', () => {
        // 移除所有active类
        document.querySelectorAll('.image-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // 添加active类到当前项
        imageItem.classList.add('active');
        
        // 更新当前图片
        currentImageIndex = parseInt(imageItem.dataset.index);
        currentImage = images[currentImageIndex].original;
        
        // 如果已经处理过，显示处理后的图片
        if (images[currentImageIndex].processed) {
            previewImage.src = images[currentImageIndex].processed;
        } else {
            // 否则重新处理
            updatePreview();
        }
    });
    
    imageList.appendChild(imageItem);
}

// 更新预览
function updatePreview() {
    if (!currentImage) return;
    
    // 使用输入框的值而不是滑块的值
    const radius = parseInt(radiusInput.value);
    
    // 创建一个canvas来绘制圆角图片
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 设置canvas尺寸与图片相同
    canvas.width = currentImage.width;
    canvas.height = currentImage.height;
    
    // 绘制圆角矩形
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 计算圆角半径（相对于图片尺寸）
    const cornerRadius = (radius / 100) * Math.min(canvas.width, canvas.height);
    
    // 绘制圆角矩形路径
    ctx.beginPath();
    ctx.moveTo(cornerRadius, 0);
    ctx.lineTo(canvas.width - cornerRadius, 0);
    ctx.quadraticCurveTo(canvas.width, 0, canvas.width, cornerRadius);
    ctx.lineTo(canvas.width, canvas.height - cornerRadius);
    ctx.quadraticCurveTo(canvas.width, canvas.height, canvas.width - cornerRadius, canvas.height);
    ctx.lineTo(cornerRadius, canvas.height);
    ctx.quadraticCurveTo(0, canvas.height, 0, canvas.height - cornerRadius);
    ctx.lineTo(0, cornerRadius);
    ctx.quadraticCurveTo(0, 0, cornerRadius, 0);
    ctx.closePath();
    
    // 裁剪为圆角矩形
    ctx.clip();
    
    // 绘制图片
    ctx.drawImage(currentImage, 0, 0, canvas.width, canvas.height);
    
    // 更新预览图片
    const dataUrl = canvas.toDataURL();
    previewImage.src = dataUrl;
    
    // 保存处理后的图片
    if (images[currentImageIndex]) {
        images[currentImageIndex].processed = dataUrl;
        
        // 添加处理指示器
        const imageItem = document.querySelector(`.image-item[data-index="${currentImageIndex}"]`);
        if (imageItem && !imageItem.querySelector('.processed-indicator')) {
            const indicator = document.createElement('div');
            indicator.className = 'processed-indicator';
            imageItem.appendChild(indicator);
        }
    }
}

// 下载当前图片
function downloadImage() {
    if (!previewImage.src) return;
    
    const a = document.createElement('a');
    a.href = previewImage.src;
    
    // 使用原始文件名，但添加"rounded-"前缀
    let filename = 'rounded-image.png';
    if (images[currentImageIndex] && images[currentImageIndex].file) {
        const originalName = images[currentImageIndex].file.name;
        const extension = originalName.split('.').pop();
        const baseName = originalName.substring(0, originalName.lastIndexOf('.'));
        filename = `rounded-${baseName}.png`;
    }
    
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// 下载所有图片
async function downloadAllImages() {
    // 检查是否有未处理的图片
    const unprocessedImages = images.filter(img => !img.processed);
    
    // 如果有未处理的图片，先处理它们
    if (unprocessedImages.length > 0) {
        const originalIndex = currentImageIndex;
        
        // 处理所有未处理的图片
        unprocessedImages.forEach((img, i) => {
            currentImageIndex = images.findIndex(image => image === img);
            currentImage = img.original;
            updatePreview();
        });
        
        // 恢复原来选中的图片
        currentImageIndex = originalIndex;
        currentImage = images[currentImageIndex].original;
        previewImage.src = images[currentImageIndex].processed;
    }
    
    // 如果只有一张图片，直接下载
    if (images.length === 1) {
        downloadImage();
        return;
    }
    
    // 创建一个zip文件
    if (images.length > 1) {
        try {
            // 创建JSZip实例
            const zip = new JSZip();
            
            // 添加所有处理过的图片到zip
            const promises = images.map(async (img, index) => {
                if (img.processed) {
                    // 将base64图片数据转换为Blob
                    const response = await fetch(img.processed);
                    const blob = await response.blob();
                    
                    // 使用原始文件名，但添加"rounded-"前缀
                    let filename = `rounded-image-${index + 1}.png`;
                    if (img.file) {
                        const originalName = img.file.name;
                        const extension = originalName.split('.').pop();
                        const baseName = originalName.substring(0, originalName.lastIndexOf('.'));
                        filename = `rounded-${baseName}.png`;
                    }
                    
                    // 添加到zip
                    zip.file(filename, blob);
                }
            });
            
            // 等待所有图片添加完成
            await Promise.all(promises);
            
            // 生成zip文件
            const content = await zip.generateAsync({type: 'blob'});
            
            // 下载zip文件
            const a = document.createElement('a');
            a.href = URL.createObjectURL(content);
            a.download = 'rounded-images.zip';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            // 释放URL对象
            setTimeout(() => {
                URL.revokeObjectURL(a.href);
            }, 1000);
            
        } catch (error) {
            console.error('创建ZIP文件失败:', error);
            alert(i18n[currentLang].zipFailAlert);
            
            // 如果创建ZIP失败，回退到逐个下载
            images.forEach((img, index) => {
                if (img.processed) {
                    const a = document.createElement('a');
                    a.href = img.processed;
                    
                    // 使用原始文件名，但添加"rounded-"前缀
                    let filename = `rounded-image-${index + 1}.png`;
                    if (img.file) {
                        const originalName = img.file.name;
                        const extension = originalName.split('.').pop();
                        const baseName = originalName.substring(0, originalName.lastIndexOf('.'));
                        filename = `rounded-${baseName}.png`;
                    }
                    
                    a.download = filename;
                    
                    // 延迟下载，避免浏览器阻止多个下载
                    setTimeout(() => {
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                    }, index * 500);
                }
            });
        }
    }
}

// 重置编辑器
function resetEditor() {
    // 清空文件输入
    fileInput.value = '';
    
    // 隐藏编辑器，显示上传区域
    editorContainer.style.display = 'none';
    uploadContainer.style.display = 'flex';
    
    // 重置当前图片
    currentImage = null;
    previewImage.src = '';
    
    // 清空图片列表
    images = [];
    imageList.innerHTML = '';
    imageCount.textContent = '0';
}

// 添加更新语言的函数
function updateLanguage() {
    const texts = i18n[currentLang];
    
    // 更新页面标题
    document.title = texts.title;
    
    // 更新副标题
    document.querySelector('header p').textContent = texts.subtitle;
    
    // 更新上传区域文本
    document.querySelector('.upload-area p').textContent = texts.uploadText;
    
    // 更新图片列表标题
    const imageListTitle = document.querySelector('.image-list-container h3');
    if (imageListTitle) {
        imageListTitle.innerHTML = `${texts.imageListTitle} (<span id="imageCount">${imageCount.textContent}</span>)`;
    }
    
    // 更新控件标签
    document.querySelector('label[for="radiusSlider"]').textContent = texts.radiusLabel;
    
    // 更新按钮文本
    document.getElementById('downloadBtn').textContent = texts.downloadBtn;
    document.getElementById('downloadAllBtn').textContent = texts.downloadAllBtn;
    document.getElementById('resetBtn').textContent = texts.resetBtn;
}

// 初始化应用
init(); 