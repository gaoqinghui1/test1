// 获取DOM元素
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const previewContainer = document.getElementById('previewContainer');
const originalPreview = document.getElementById('originalPreview');
const compressedPreview = document.getElementById('compressedPreview');
const originalSize = document.getElementById('originalSize');
const compressedSize = document.getElementById('compressedSize');
const qualitySlider = document.getElementById('qualitySlider');
const qualityValue = document.getElementById('qualityValue');
const downloadBtn = document.getElementById('downloadBtn');

let originalFile = null;

// 上传区域点击事件
uploadArea.addEventListener('click', () => {
    fileInput.click();
});

// 文件拖拽事件
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#007AFF';
});

uploadArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#c7c7c7';
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#c7c7c7';
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

// 文件选择事件
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

// 处理上传的文件
function handleFile(file) {
    if (!file.type.match(/image\/(png|jpeg)/)) {
        alert('请上传PNG或JPG格式的图片！');
        return;
    }

    originalFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
        originalPreview.src = e.target.result;
        originalSize.textContent = formatFileSize(file.size);
        previewContainer.style.display = 'block';
        compressImage(e.target.result);
    };
    reader.readAsDataURL(file);
}

// 压缩图片
function compressImage(base64) {
    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 保持原始尺寸
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // 压缩图片
        const quality = qualitySlider.value / 100;
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        
        compressedPreview.src = compressedDataUrl;
        
        // 计算压缩后文件大小
        const compressedSize = Math.round((compressedDataUrl.length - 22) * 3 / 4);
        document.getElementById('compressedSize').textContent = formatFileSize(compressedSize);
    };
    img.src = base64;
}

// 质量滑块变化事件
qualitySlider.addEventListener('input', (e) => {
    qualityValue.textContent = e.target.value + '%';
    if (originalFile) {
        const reader = new FileReader();
        reader.onload = (e) => {
            compressImage(e.target.result);
        };
        reader.readAsDataURL(originalFile);
    }
});

// 下载按钮点击事件
downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'compressed_image.jpg';
    link.href = compressedPreview.src;
    link.click();
});

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 标签页切换逻辑
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        // 移除所有活动状态
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // 添加当前活动状态
        button.classList.add('active');
        const tabId = button.dataset.tab + 'Tab';
        document.getElementById(tabId).classList.add('active');
    });
});

// PDF转换相关代码
const pdfUploadArea = document.getElementById('pdfUploadArea');
const pdfInput = document.getElementById('pdfInput');
const conversionContainer = document.getElementById('conversionContainer');
const pdfFileName = document.getElementById('pdfFileName');
const pdfFileSize = document.getElementById('pdfFileSize');
const pdfPageCount = document.getElementById('pdfPageCount');
const conversionProgress = document.getElementById('conversionProgress');
const conversionStatus = document.getElementById('conversionStatus');
const convertBtn = document.getElementById('convertBtn');
const downloadWordBtn = document.getElementById('downloadWordBtn');

// PDF上传区域点击事件
pdfUploadArea.addEventListener('click', () => {
    pdfInput.click();
});

// PDF文件拖拽事件
pdfUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    pdfUploadArea.style.borderColor = '#007AFF';
});

pdfUploadArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    pdfUploadArea.style.borderColor = '#c7c7c7';
});

pdfUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    pdfUploadArea.style.borderColor = '#c7c7c7';
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handlePdfFile(files[0]);
    }
});

// PDF文件选择事件
pdfInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handlePdfFile(e.target.files[0]);
    }
});

// 处理PDF文件
async function handlePdfFile(file) {
    // 检查文件大小
    if (!checkFileSize(file)) {
        return;
    }

    if (file.type !== 'application/pdf') {
        alert('请上传PDF格式的文件！');
        return;
    }

    // 显示文件信息
    pdfFileName.textContent = file.name;
    pdfFileSize.textContent = formatFileSize(file.size);
    pdfPageCount.textContent = '计算中...';
    conversionContainer.style.display = 'block';
    
    // 保存文件引用
    originalFile = file;
    
    // 更新步骤状态
    document.getElementById('step1').classList.add('active');
    
    // 启用转换按钮
    convertBtn.disabled = false;
    // 移除之前的事件监听器
    convertBtn.removeEventListener('click', startConversion);
    convertBtn.addEventListener('click', startConversion);
}

// 使用 docx.js 创建 Word 文档
async function startConversion() {
    try {
        // 设置 PDF.js worker
        const pdfjsLib = window['pdfjs-dist/build/pdf'];
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        
        // 显示转换状态
        convertBtn.disabled = true;
        document.getElementById('step2').classList.add('active');
        conversionStatus.textContent = '正在转换...';
        conversionStatus.classList.add('converting');

        // 读取PDF
        const arrayBuffer = await originalFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        
        // 更新页数
        pdfPageCount.textContent = pdf.numPages + '页';
        document.getElementById('step3').classList.add('active');
        
        // 提取并格式化文本
        let sections = [];
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            
            // 按位置排序文本项
            const textItems = content.items.sort((a, b) => {
                if (Math.abs(a.transform[5] - b.transform[5]) > 5) {
                    return b.transform[5] - a.transform[5]; // y坐标
                }
                return a.transform[4] - b.transform[4]; // x坐标
            });
            
            // 分析文本结构
            let currentY = null;
            let currentLine = [];
            let paragraphs = [];
            
            for (const item of textItems) {
                if (currentY === null || Math.abs(item.transform[5] - currentY) > 5) {
                    if (currentLine.length > 0) {
                        paragraphs.push(currentLine.join(''));
                        currentLine = [];
                    }
                    currentY = item.transform[5];
                }
                currentLine.push(item.str);
            }
            if (currentLine.length > 0) {
                paragraphs.push(currentLine.join(''));
            }
            
            sections.push(paragraphs);
        }

        // 使用 docx.js 创建 Word 文档
        const doc = new window.docxjs.Document({
            sections: [{
                properties: {},
                children: [
                    // 添加标题样式
                    new window.docxjs.Paragraph({
                        heading: 1,  // 使用数字 1 代替 HEADING_1
                        children: [
                            new window.docxjs.TextRun({
                                text: pdfFileName.textContent.replace('.pdf', ''),
                                bold: true,
                                size: 32,
                            }),
                        ],
                    }),
                    // 添加段落
                    ...sections.flatMap((section, pageIndex) => {
                        return section.map(paragraph => {
                            // 判断是否为标题（基于文本特征）
                            const isHeading = paragraph.length < 100 && 
                                            !/[.。]$/.test(paragraph) &&
                                            paragraph.trim().length > 0;
                            
                            return new window.docxjs.Paragraph({
                                heading: isHeading ? 2 : undefined,  // 使用数字 2 代替 HEADING_2
                                spacing: {
                                    before: 200,
                                    after: 200,
                                    line: 360,
                                },
                                children: [
                                    new window.docxjs.TextRun({
                                        text: paragraph,
                                        size: isHeading ? 24 : 22,
                                        bold: isHeading,
                                    }),
                                ],
                            });
                        });
                    }),
                ],
            }],
            styles: {
                paragraphStyles: [
                    {
                        id: "Normal",
                        name: "Normal",
                        run: {
                            size: 22,
                            font: "Microsoft YaHei",
                        },
                        paragraph: {
                            spacing: {
                                line: 360,
                            },
                        },
                    },
                    {
                        id: "Heading1",
                        name: "Heading 1",
                        run: {
                            size: 32,
                            bold: true,
                            font: "Microsoft YaHei",
                        },
                        paragraph: {
                            spacing: {
                                before: 240,
                                after: 120,
                            },
                        },
                    },
                    {
                        id: "Heading2",
                        name: "Heading 2",
                        run: {
                            size: 24,
                            bold: true,
                            font: "Microsoft YaHei",
                        },
                        paragraph: {
                            spacing: {
                                before: 240,
                                after: 120,
                            },
                        },
                    },
                ],
            },
        });
        
        // 生成 Word 文档
        const buffer = await window.docxjs.Packer.toBlob(doc);
        
        const url = URL.createObjectURL(buffer);
        downloadWordBtn.dataset.downloadUrl = url;
        downloadWordBtn.style.display = 'block';
        convertBtn.style.display = 'none';
        document.getElementById('step4').classList.add('active');
        conversionStatus.textContent = '转换完成！';
        conversionStatus.classList.remove('converting');

    } catch (error) {
        handleApiError(error);
        conversionStatus.classList.remove('converting');
        // 重置按钮状态
        convertBtn.disabled = false;
        convertBtn.style.display = 'block';
        downloadWordBtn.style.display = 'none';
    }
}

// 修改下载按钮点击事件
downloadWordBtn.addEventListener('click', async () => {
    const downloadUrl = downloadWordBtn.dataset.downloadUrl;
    if (downloadUrl) {
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = pdfFileName.textContent.replace('.pdf', '.docx');
        link.click();
        URL.revokeObjectURL(downloadUrl);
    }
});

// 添加文件拖放效果
function updateDropZoneStyle(isDragging) {
    const uploadArea = document.getElementById('pdfUploadArea');
    if (isDragging) {
        uploadArea.classList.add('dragging');
    } else {
        uploadArea.classList.remove('dragging');
    }
}

// 添加转换限制提示
function showConversionLimit() {
    const limitInfo = document.createElement('div');
    limitInfo.className = 'limit-info';
    limitInfo.innerHTML = `
        <p>转换限制：</p>
        <ul>
            <li>文件大小：最大10MB</li>
            <li>页数限制：最多50页</li>
            <li>格式支持：标准PDF文档</li>
        </ul>
    `;
    document.querySelector('.conversion-container').prepend(limitInfo);
}

// 添加文件大小检查
function checkFileSize(file) {
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
        alert('文件大小不能超过10MB');
        return false;
    }
    return true;
}

// 修改错误处理函数
function handleApiError(error) {
    let message = '转换失败';
    console.error('API错误:', error);

    if (error.response) {
        switch (error.response.status) {
            case 401:
                message = 'API密钥无效，请检查密钥是否正确';
                break;
            case 429:
                message = '超出API调用限制，请稍后再试';
                break;
            case 413:
                message = '文件太大，请上传小于10MB的文件';
                break;
            case 500:
                message = '服务器内部错误，请稍后重试';
                break;
            case 503:
                message = '服务暂时不可用，请稍后重试';
                break;
            default:
                message = `服务器错误 (${error.response.status})，请稍后重试`;
        }
    } else if (error.message) {
        message = error.message;
    } else {
        message = '网络错误，请检查网络连接';
    }

    conversionStatus.textContent = message;
    convertBtn.disabled = false;
    // 显示错误状态
    conversionStatus.classList.add('error');
    // 3秒后移除错误状态
    setTimeout(() => {
        conversionStatus.classList.remove('error');
    }, 3000);
} 