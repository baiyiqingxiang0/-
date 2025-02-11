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
const DEEPSEEK_API = {
    baseUrl: 'https://api.deepseek.com/v1',
    key: 'sk-cc80caa1c04844efb15324d359a1df4c'
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
    const newEntry = {
        poem,
        theme,
        style,
        emotion,
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
            <div class="history-theme">${entry.theme}</div>
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

// 分享功能
const shareModal = document.getElementById('shareModal');
const closeBtn = document.querySelector('.close');

function showShareModal() {
    shareModal.style.display = 'block';
}

function hideShareModal() {
    shareModal.style.display = 'none';
}

function sharePoem(type) {
    const poemText = document.querySelector('.poem-wrapper').textContent;
    
    switch(type) {
        case 'copy':
            navigator.clipboard.writeText(poemText)
                .then(() => alert('诗词已复制到剪贴板'))
                .catch(() => alert('复制失败，请手动复制'));
            break;
        case 'weixin':
            // 实现微信分享
            window.open(`https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxcheckurl?url=${
                encodeURIComponent(window.location.href)
            }`);
            break;
        case 'weibo':
            // 实现微博分享
            window.open(`http://service.weibo.com/share/share.php?url=${
                encodeURIComponent(window.location.href)
            }&title=${encodeURIComponent(poemText)}`);
            break;
    }
    hideShareModal();
}

// 调用Deepseek API生成诗词
async function callDeepseekAPI(theme, style, emotion) {
    try {
        const prompt = `请创作一首${style === 'modern' ? '现代诗' : 
            style === 'ancient' ? '古风诗' : '俳句'}，
            主题是"${theme}"，情感基调是"${emotion}"。
            ${style === 'haiku' ? '请使用5-7-5音节格式。' : ''}
            请包含标题和赏析。`;

        const response = await fetch(`${DEEPSEEK_API.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API.key}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    {
                        role: "system",
                        content: "你是一位专业的诗词创作大师，精通各种诗词风格。"
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error('API请求失败');
        }

        const data = await response.json();
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
                <p>使用备用模板：</p>
                <div class="poem-content">
                    ${emotion === 'happy' ? 
                        '春风拂面暖，花开满园香。\n心情愉悦处，万物皆芬芳。' : 
                        '独坐窗前望，思绪满心间。\n何时再相见，明月照客颜。'}
                </div>
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

// 绑定事件
document.getElementById('shareBtn').addEventListener('click', showShareModal);
document.getElementById('exportBtn').addEventListener('click', exportToImage);
closeBtn.addEventListener('click', hideShareModal);

document.querySelectorAll('.share-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        sharePoem(btn.dataset.type);
    });
});

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