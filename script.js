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
const fontSelect = document.getElementById('fontSelect');
const layoutSelect = document.getElementById('layoutSelect');
const decorationSelect = document.getElementById('decorationSelect');

// 调用Deepseek API生成诗词
async function callDeepseekAPI(theme, style, emotion) {
    try {
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
                        content: "你是一位专业的诗词创作大师，精通各种诗词风格。请根据用户提供的主题、风格和情感创作一首诗词。"
                    },
                    {
                        role: "user",
                        content: `请创作一首诗词，主题是"${theme}"，风格是"${style}"，情感基调是"${emotion}"。`
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

// 修改应用字体函数
function applyFont(font) {
    const poemDisplay = document.querySelector('.poem-display');
    if (poemDisplay) {
        // 移除所有字体类
        poemDisplay.classList.remove('font-default', 'font-songti', 'font-kaiti', 'font-fangsong');
        if (font !== 'default') {
            poemDisplay.classList.add(`font-${font}`);
        }
    }
    localStorage.setItem('font', font);
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
fontSelect.addEventListener('change', (e) => applyFont(e.target.value));
layoutSelect.addEventListener('change', (e) => applyLayout(e.target.value));
decorationSelect.addEventListener('change', (e) => applyDecoration(e.target.value, styleSelect.value));

// 加载保存的设置
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const savedFont = localStorage.getItem('font') || 'default';
    const savedLayout = localStorage.getItem('layout') || 'horizontal';
    const savedDecoration = localStorage.getItem('decoration') || 'none';
    
    themeSelect.value = savedTheme;
    fontSelect.value = savedFont;
    layoutSelect.value = savedLayout;
    decorationSelect.value = savedDecoration;
    
    applyTheme(savedTheme);
    applyFont(savedFont);
    applyLayout(savedLayout);
    applyDecoration(savedDecoration, savedDecoration);
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

// 修改事件监听器，使用防抖处理实时预览
let debounceTimer;
themeInput.addEventListener('input', () => {
    if (themeInput.value.length > 2) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            generatePoem();
        }, 1000); // 1秒后才调用API
    }
});

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