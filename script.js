// 示例诗句库
const poemTemplates = {
    happy: {
        spring: [
            "春风拂面暖，花开满园香",
            "春日和风起，心情格外明"
        ],
        friendship: [
            "相逢即是缘，相知更难得",
            "把酒言欢日，知交情更深"
        ]
    },
    sad: {
        homesick: [
            "月明故乡远，思绪满心间",
            "他乡度日月，思念故园情"
        ]
    }
};

// 获取DOM元素
const themeInput = document.getElementById('theme');
const styleSelect = document.getElementById('style');
const emotionSelect = document.getElementById('emotion');
const generateBtn = document.getElementById('generate');
const poemOutput = document.getElementById('poem-output');
const exampleCards = document.querySelectorAll('.example-card');

// Deepseek API配置
const API_CONFIG = {
    deepseek: {
        baseUrl: 'https://api.deepseek.com/v1',
        key: 'sk-cc80caa1c04844efb15324d359a1df4c',
        model: "deepseek-chat"
    },
    moonshot: {
        baseUrl: 'https://api.moonshot.cn/v1',
        key: 'sk-BEVbvTROZVQzpxkRgRzVEp6zMRdQF9avyOaudiuRar4t6ajt',
        model: "moonshot-v1-8k"
    },
    tongyi: {
        baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        key: 'sk-c41964b15abf42c3990942b2d2ad425e',
        model: "qwen-max"
    }
};

// 添加设置相关的DOM元素
const toggleSettings = document.getElementById('toggleSettings');
const settingsContent = document.querySelector('.settings-content');
const themeSelect = document.getElementById('themeSelect');
const layoutSelect = document.getElementById('layoutSelect');
const decorationSelect = document.getElementById('decorationSelect');

// 添加更多情感倾向选项
const emotions = {
    happy: "欢快",
    sad: "忧伤",
    peaceful: "平和",
    passionate: "热情",
    nostalgic: "怀旧",
    romantic: "浪漫",
    heroic: "豪迈",
    contemplative: "沉思"
};

// 添加模型选择相关的DOM元素
const modelSelect = document.getElementById('modelSelect');

// 更新情感选择下拉框
function updateEmotionSelect() {
    emotionSelect.innerHTML = Object.entries(emotions)
        .map(([value, label]) => 
            `<option value="${value}">${label}</option>`
        ).join('');
}

// 历史记录功能
const MAX_HISTORY = 10;

function addToHistory(poem, theme, style, emotion) {
    let history = JSON.parse(localStorage.getItem('poemHistory') || '[]');
    
    // 从诗词内容中提取标题
    const titleMatch = poem.match(/《([^》]+)》/);
    const title = titleMatch ? titleMatch[1] : '无题';
    
    const newEntry = {
        poem,
        theme,
        style,
        emotion,
        title,  // 添加标题字段
        timestamp: Date.now()
    };
    
    history.unshift(newEntry);
    if (history.length > MAX_HISTORY) {
        history = history.slice(0, MAX_HISTORY);
    }
    
    localStorage.setItem('poemHistory', JSON.stringify(history));
    updateHistoryDisplay();
}

function updateHistoryDisplay() {
    const historyList = document.getElementById('historyList');
    const history = JSON.parse(localStorage.getItem('poemHistory') || '[]');
    
    historyList.innerHTML = history.map((entry, index) => `
        <div class="history-item" data-poem='${JSON.stringify(entry)}'>
            <div class="history-meta">
                <span>${new Date(entry.timestamp).toLocaleString()}
                · ${emotions[entry.emotion]} · ${
                    entry.style === 'modern' ? '现代诗' : 
                    entry.style === 'ancient' ? '古风诗' : '俳句'
                }</span>
                <button class="delete-history" data-index="${index}" title="删除">
                    <svg viewBox="0 0 24 24" width="16" height="16">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
                    </svg>
                </button>
            </div>
            <div class="history-title">《${entry.title}》</div>
            <div class="history-theme">主题：${entry.theme}</div>
        </div>
    `).join('');
}

// 添加删除历史记录功能
function deleteHistoryItem(index) {
    let history = JSON.parse(localStorage.getItem('poemHistory') || '[]');
    history.splice(index, 1);
    localStorage.setItem('poemHistory', JSON.stringify(history));
    updateHistoryDisplay();
}

// 修改导出图片功能
async function exportToImage() {
    const poemElement = document.querySelector('.poem-wrapper');
    try {
        // 等待字体完全加载
        await document.fonts.ready;
        
        // 创建临时容器以处理样式
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.top = '-9999px';
        document.body.appendChild(tempContainer);
        
        // 克隆诗词元素到临时容器
        const clonedElement = poemElement.cloneNode(true);
        tempContainer.appendChild(clonedElement);
        
        // 优化克隆元素的样式
        clonedElement.style.width = '800px';
        clonedElement.style.padding = '60px';
        clonedElement.style.background = getComputedStyle(document.body).getPropertyValue('--bg-primary');
        
        // 增加字体大小
        const titleElement = clonedElement.querySelector('.poem-title');
        const contentElement = clonedElement.querySelector('.poem-content');
        const analysisElement = clonedElement.querySelector('.poem-analysis');
        
        if (titleElement) {
            titleElement.style.fontSize = '32px';
            titleElement.style.marginBottom = '40px';
        }
        
        if (contentElement) {
            contentElement.style.fontSize = '24px';
            contentElement.style.lineHeight = '2';
        }
        
        if (analysisElement) {
            analysisElement.style.fontSize = '18px';
            analysisElement.style.lineHeight = '1.8';
        }
        
        // 使用更高的缩放比例生成图片
        const canvas = await html2canvas(clonedElement, {
            scale: 3,
            useCORS: true,
            logging: false,
            allowTaint: true,
            backgroundColor: null,
            imageTimeout: 0,
            onclone: (clonedDoc) => {
                return new Promise(resolve => {
                    setTimeout(resolve, 500);
                });
            }
        });
        
        // 清理临时元素
        tempContainer.remove();
        
        // 导出高质量图片
        const link = document.createElement('a');
        link.download = `诗词创作_${new Date().toLocaleString().replace(/[\/\s:]/g, '_')}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
    } catch (error) {
        console.error('导出图片失败：', error);
        alert('导出图片失败，请稍后重试');
    }
}

// 修改分享功能
async function sharePoem() {
    const poemElement = document.querySelector('.poem-wrapper');
    if (!poemElement) {
        alert('没有可复制的内容');
        return;
    }

    try {
        // 获取诗词内容
        const title = poemElement.querySelector('.poem-title')?.textContent || '';
        const content = poemElement.querySelector('.poem-content')?.textContent || '';
        const analysis = poemElement.querySelector('.poem-analysis')?.textContent || '';
        
        // 格式化文本
        const text = `${title}\n\n${content}\n\n${analysis}`;
        
        // 复制到剪贴板
        await navigator.clipboard.writeText(text);
        
        // 显示成功提示
        const shareBtn = document.getElementById('shareBtn');
        const originalText = shareBtn.innerHTML;
        shareBtn.innerHTML = `
            <svg viewBox="0 0 24 24" width="18" height="18">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
            </svg>
            已复制
        `;
        shareBtn.style.backgroundColor = 'var(--success-color)';
        
        // 3秒后恢复按钮状态
        setTimeout(() => {
            shareBtn.innerHTML = originalText;
            shareBtn.style.backgroundColor = '';
        }, 3000);
    } catch (error) {
        console.error('复制失败：', error);
        alert('复制失败，请手动复制');
    }
}

// 修改调用Deepseek API生成诗词的函数
async function callDeepseekAPI(theme, style, emotion) {
    try {
        const styleDesc = style === 'modern' ? '现代诗' : 
            style === 'ancient' ? '古风诗' : '俳句';
        
        const prompt = `请以"${theme}"为主题，创作一首原创${styleDesc}。
要求：
1. 必须是原创内容，可以借鉴但不能照搬现有诗词
2. 情感基调要体现"${emotions[emotion]}"
3. 意境要新颖独特，避免使用陈词滥调
4. ${style === 'ancient' ? '需要押韵，注意平仄' : 
     style === 'haiku' ? '需要符合5-7-5音节格式' : 
     '自由诗体，但要注意节奏感'}
5. 创作完成后，请附上简短的创作赏析，说明诗歌的意境和写作特点

格式要求：
1. 标题使用《》括起
2. 正文每句独立成行
3. 最后加上"赏析："并写出赏析内容`;

        const currentModel = modelSelect.value;
        const config = API_CONFIG[currentModel];
        
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.key}`
        };

        // 通义AI需要特殊处理
        if (currentModel === 'tongyi') {
            headers['X-DashScope-SSE'] = 'disable';
        }
        
        const response = await fetch(`${config.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                model: config.model,
                messages: [
                    {
                        role: "system",
                        content: `你是一位极具创造力的诗人，擅长创作原创诗词。
你的创作要求：
1. 每次创作都必须是全新的原创内容
2. 意境要新颖独特，避免老套
3. 用词要精准传神，不用滥词俗句
4. 要有独特的个人风格和创新表达`
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.9,
                top_p: 0.95,
                presence_penalty: 0.6,
                frequency_penalty: 0.8
            })
        });

        if (!response.ok) {
            throw new Error('API请求失败');
        }

        const data = await response.json();
        
        // 通义AI的返回格式可能不同，需要特殊处理
        if (currentModel === 'tongyi') {
            return data.output?.text || data.choices[0].message.content;
        }
        
        return data.choices[0].message.content;
    } catch (error) {
        console.error('调用API出错：', error);
        return null;
    }
}

// 格式化诗词内容
function formatPoem(content, style) {
    // 分离标题、正文和赏析
    const titleMatch = content.match(/《(.+?)》/);
    const title = titleMatch ? titleMatch[1] : '';
    
    // 分离诗句和赏析
    let [poem, analysis] = content.split('赏析：');
    
    // 处理诗句（去除标题）
    poem = poem.replace(/《(.+?)》/, '').trim();
    
    // 根据不同风格处理诗句
    let formattedContent = '';
    switch(style) {
        case 'modern':
            // 现代诗：按行分割，保留原有格式
            formattedContent = `
                <div class="poem-content modern-poem">
                    ${poem.split('\n').map(line => 
                        `<div class="poem-line">${line.trim()}</div>`
                    ).join('')}
                </div>
            `;
            break;
            
        case 'ancient':
            // 古风诗：按逗号、句号分行，每两句为一联
            const lines = poem.split(/[，。]/).filter(line => line.trim());
            const couplets = [];
            for (let i = 0; i < lines.length; i += 2) {
                if (lines[i + 1]) {
                    couplets.push(`
                        <div class="poem-couplet">
                            <div class="poem-line">${lines[i].trim()}，</div>
                            <div class="poem-line">${lines[i + 1].trim()}。</div>
                        </div>
                    `);
                } else {
                    couplets.push(`
                        <div class="poem-couplet">
                            <div class="poem-line">${lines[i].trim()}。</div>
                        </div>
                    `);
                }
            }
            formattedContent = `
                <div class="poem-content ancient-poem">
                    ${couplets.join('')}
                </div>
            `;
            break;
            
        case 'haiku':
            // 俳句：三行格式，5-7-5音节
            const haikuLines = poem.split(/[，。]/).filter(line => line.trim());
            formattedContent = `
                <div class="poem-content haiku-poem">
                    ${haikuLines.map(line => 
                        `<div class="poem-line">${line.trim()}</div>`
                    ).join('')}
                </div>
            `;
            break;
    }
    
    return `
        <div class="poem-wrapper ${style}-style">
            <div class="poem-title">${title}</div>
            ${formattedContent}
            ${analysis ? `
                <div class="poem-analysis">
                    <div class="analysis-title">赏析：</div>
                    <div class="analysis-content">${analysis.trim()}</div>
                </div>
            ` : ''}
        </div>
    `;
}

// 设置面板开关
toggleSettings.addEventListener('click', () => {
    settingsContent.classList.toggle('show');
});

// 修改应用主题函数
function applyTheme(theme) {
    // 移除所有主题类
    document.body.classList.remove('theme-light', 'theme-dark', 'theme-ink');
    // 添加新主题类
    document.body.classList.add(`theme-${theme}`);
    localStorage.setItem('theme', theme);
}

// 应用排版方向
function applyLayout(layout) {
    const poemContent = document.querySelector('.poem-content');
    if (poemContent) {
        poemContent.classList.toggle('vertical-text', 
            layout === 'vertical');
    }
    localStorage.setItem('layout', layout);
}

// 修改应用装饰风格函数
function applyDecoration(decoration, style) {
    const poemWrapper = document.querySelector('.poem-wrapper');
    if (poemWrapper) {
        // 移除所有装饰类
        poemWrapper.classList.remove('decoration-none', 'decoration-simple', 'decoration-traditional');
        poemWrapper.className = `poem-wrapper ${style}-style decoration-${decoration}`;
    }
    localStorage.setItem('decoration', decoration);
}

// 监听设置变化
themeSelect.addEventListener('change', (e) => applyTheme(e.target.value));
layoutSelect.addEventListener('change', (e) => applyLayout(e.target.value));
decorationSelect.addEventListener('change', (e) => applyDecoration(e.target.value, styleSelect.value));

// 加载保存的设置
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const savedLayout = localStorage.getItem('layout') || 'horizontal';
    const savedDecoration = localStorage.getItem('decoration') || 'none';
    
    themeSelect.value = savedTheme;
    layoutSelect.value = savedLayout;
    decorationSelect.value = savedDecoration;
    
    applyTheme(savedTheme);
    applyLayout(savedLayout);
    applyDecoration(savedDecoration, styleSelect.value);
    
    updateEmotionSelect();
    updateHistoryDisplay();
    
    // 加载保存的模型设置
    const savedModel = localStorage.getItem('model') || 'deepseek';
    modelSelect.value = savedModel;
});

// 修改生成诗词的函数
async function generatePoem() {
    const theme = themeInput.value;
    const style = styleSelect.value;
    const emotion = emotionSelect.value;
    
    if (!theme) {
        alert('请输入创作主题');
        return;
    }
    
    try {
        // 禁用生成按钮
        generateBtn.disabled = true;
        generateBtn.textContent = '正在创作...';
        
        // 显示加载状态
        poemOutput.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>正在创作诗词，请稍候...</p>
            </div>
        `;
        
        // 调用API
        const poem = await callDeepseekAPI(theme, style, emotion);
        
        if (poem) {
            poemOutput.innerHTML = formatPoem(poem, style);
            // 应用当前设置
            applyLayout(layoutSelect.value);
            applyDecoration(decorationSelect.value, style);
            // 添加到历史记录
            addToHistory(poem, theme, style, emotion);
        } else {
            throw new Error('生成诗词失败');
        }
    } catch (error) {
        console.error('生成诗词错误：', error);
        poemOutput.innerHTML = `
            <div class="error-state">
                <p>抱歉，生成诗词时出现错误。</p>
                <p>请重新尝试创作。</p>
            </div>
        `;
    } finally {
        // 恢复生成按钮
        generateBtn.disabled = false;
        generateBtn.textContent = '生成诗词';
    }
}

// 绑定事件
generateBtn.addEventListener('click', generatePoem);

// 示例卡片点击事件
exampleCards.forEach(card => {
    card.addEventListener('click', () => {
        const theme = card.getAttribute('data-theme');
        themeInput.value = theme;
        generatePoem();
    });
});

// 优化防抖函数
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// 使用优化后的防抖函数
themeInput.addEventListener('input', debounce(() => {
    if (themeInput.value.length > 2) {
        generatePoem();
    }
}, 1000));

// 添加点击外部关闭设置面板
document.addEventListener('click', (e) => {
    if (!settingsContent.contains(e.target) && 
        !toggleSettings.contains(e.target) && 
        settingsContent.classList.contains('show')) {
        settingsContent.classList.remove('show');
    }
});

// 阻止设置面板内部点击事件冒泡
settingsContent.addEventListener('click', (e) => {
    e.stopPropagation();
});

// 修改事件监听
document.getElementById('shareBtn').addEventListener('click', sharePoem);

// 修改历史记录点击事件处理
document.getElementById('historyList').addEventListener('click', (e) => {
    const deleteBtn = e.target.closest('.delete-history');
    if (deleteBtn) {
        e.stopPropagation(); // 阻止冒泡，避免触发历史记录加载
        const index = parseInt(deleteBtn.dataset.index);
        if (confirm('确定要删除这条创作历史吗？')) {
            deleteHistoryItem(index);
        }
        return;
    }

    const historyItem = e.target.closest('.history-item');
    if (historyItem) {
        const data = JSON.parse(historyItem.dataset.poem);
        themeInput.value = data.theme;
        styleSelect.value = data.style;
        emotionSelect.value = data.emotion;
        poemOutput.innerHTML = formatPoem(data.poem, data.style);
    }
});

// 添加模型选择的事件监听
modelSelect.addEventListener('change', (e) => {
    localStorage.setItem('model', e.target.value);
}); 