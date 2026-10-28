/**
 * 磁力猎手 - 全网磁力资源聚合搜索引擎
 * 纯前端实现 · 零后端依赖
 */

// ==================== 数据源配置 ====================
// 真实数据源由后端 server.js 管理,前端只做展示
const SOURCES = [
    {
        id: 'bitsearch',
        name: 'Bitsearch',
        url: 'https://bitsearch.eu',
        desc: '全球最大磁力索引之一,覆盖 BT DHT 全网',
        enabled: true
    },
    {
        id: 'backend-agg',
        name: '后端聚合',
        url: '#',
        desc: '由本地后端服务统一代理,自动聚合多个公开源',
        enabled: true
    }
];

// API 基础地址(相对路径,当前端由 Express serve 时直接命中后端)
const API_BASE = '/api';

// CORS 代理列表(用于解决跨域问题)
const CORS_PROXIES = [
    (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

// ==================== 模拟数据(演示用) ====================
const MOCK_RESULTS = [
    {
        name: '流浪地球2.2023.4K.HDR.国语中字.BluRay',
        magnet: 'magnet:?xt=urn:btih:a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0&dn=流浪地球2.4K&tr=http://tracker.example.com/announce',
        size: '45.8 GB',
        sizeBytes: 45.8 * 1024 * 1024 * 1024,
        date: '2024-01-15',
        source: 'Cili.Cat',
        seeds: 2847,
        leechs: 342,
        category: '电影'
    },
    {
        name: '满江红.2023.1080P.国语中字.WebDL',
        magnet: 'magnet:?xt=urn:btih:b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1&dn=满江红.1080P&tr=http://tracker.example.com/announce',
        size: '8.2 GB',
        sizeBytes: 8.2 * 1024 * 1024 * 1024,
        date: '2024-02-20',
        source: 'BT-SO',
        seeds: 1923,
        leechs: 156,
        category: '电影'
    },
    {
        name: '狂飙.2023.全39集.1080P.国语中字',
        magnet: 'magnet:?xt=urn:btih:c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2&dn=狂飙.全39集&tr=http://tracker.example.com/announce',
        size: '78.5 GB',
        sizeBytes: 78.5 * 1024 * 1024 * 1024,
        date: '2024-03-10',
        source: 'MagnetDB',
        seeds: 4521,
        leechs: 678,
        category: '电视剧'
    },
    {
        name: '三体.2023.全30集.4K.HDR.国语中字',
        magnet: 'magnet:?xt=urn:btih:d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3&dn=三体.全30集.4K&tr=http://tracker.example.com/announce',
        size: '156.3 GB',
        sizeBytes: 156.3 * 1024 * 1024 * 1024,
        date: '2024-03-25',
        source: 'Cili.Cat',
        seeds: 5892,
        leechs: 823,
        category: '电视剧'
    },
    {
        name: '肖申克的救赎.The Shawshank Redemption.1994.4K.Remastered',
        magnet: 'magnet:?xt=urn:btih:e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4&dn=肖申克的救赎.4K&tr=http://tracker.example.com/announce',
        size: '52.1 GB',
        sizeBytes: 52.1 * 1024 * 1024 * 1024,
        date: '2024-01-08',
        source: 'BT-SO',
        seeds: 3214,
        leechs: 189,
        category: '电影'
    },
    {
        name: '龙猫.となりのトトロ.1988.4K.日语中字.BluRay',
        magnet: 'magnet:?xt=urn:btih:f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5&dn=龙猫.4K&tr=http://tracker.example.com/announce',
        size: '18.7 GB',
        sizeBytes: 18.7 * 1024 * 1024 * 1024,
        date: '2024-02-01',
        source: '蛋蛋资源',
        seeds: 1876,
        leechs: 234,
        category: '动漫'
    },
    {
        name: 'Interstellar.星际穿越.2014.4K.IMAX.中英双语',
        magnet: 'magnet:?xt=urn:btih:a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6&dn=Interstellar.4K&tr=http://tracker.example.com/announce',
        size: '62.4 GB',
        sizeBytes: 62.4 * 1024 * 1024 * 1024,
        date: '2024-03-15',
        source: 'MagnetDB',
        seeds: 4123,
        leechs: 456,
        category: '电影'
    },
    {
        name: 'Ubuntu 24.04 LTS Desktop.64-bit.ISO',
        magnet: 'magnet:?xt=urn:btih:b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7&dn=Ubuntu.24.04.LTS&tr=http://tracker.example.com/announce',
        size: '5.8 GB',
        sizeBytes: 5.8 * 1024 * 1024 * 1024,
        date: '2024-04-20',
        source: 'BT-SO',
        seeds: 8934,
        leechs: 567,
        category: '软件'
    },
    {
        name: 'Photoshop 2024.v25.中文完整版本',
        magnet: 'magnet:?xt=urn:btih:c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8&dn=Photoshop.2024&tr=http://tracker.example.com/announce',
        size: '3.2 GB',
        sizeBytes: 3.2 * 1024 * 1024 * 1024,
        date: '2024-04-01',
        source: 'Cili.Cat',
        seeds: 2891,
        leechs: 345,
        category: '软件'
    },
    {
        name: '三体.刘慈欣.全集.epub.mobi.pdf',
        magnet: 'magnet:?xt=urn:btih:d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9&dn=三体.全集&tr=http://tracker.example.com/announce',
        size: '156 MB',
        sizeBytes: 156 * 1024 * 1024,
        date: '2024-02-15',
        source: 'MagnetDB',
        seeds: 1234,
        leechs: 89,
        category: '书籍'
    },
    {
        name: 'The Marvelous Mrs. Maisel.了不起的麦瑟尔夫人.全5季.1080P',
        magnet: 'magnet:?xt=urn:btih:e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0&dn=麦瑟尔夫人.全5季&tr=http://tracker.example.com/announce',
        size: '42.8 GB',
        sizeBytes: 42.8 * 1024 * 1024 * 1024,
        date: '2024-03-20',
        source: 'BT-SO',
        seeds: 1567,
        leechs: 178,
        category: '电视剧'
    },
    {
        name: '原神.Genshin Impact.4.5版本完整客户端',
        magnet: 'magnet:?xt=urn:btih:f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1&dn=原神.4.5&tr=http://tracker.example.com/announce',
        size: '78.2 GB',
        sizeBytes: 78.2 * 1024 * 1024 * 1024,
        date: '2024-04-10',
        source: '蛋蛋资源',
        seeds: 12453,
        leechs: 2341,
        category: '游戏'
    }
];

// ==================== 状态管理 ====================
const state = {
    theme: localStorage.getItem('theme') || 'light',
    selectedSources: SOURCES.filter(s => s.enabled).map(s => s.id),
    searchHistory: JSON.parse(localStorage.getItem('searchHistory') || '[]'),
    allResults: [],      // 完整结果集(后端一次返回全部,前端本地分页)
    results: [],          // 当前页展示的结果
    isSearching: false,
    page: 1,
    perPage: 10,
    lastMeta: null        // 后端返回的元信息(源统计等)
};

// ==================== 工具函数 ====================

/**
 * 显示 Toast 提示
 */
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️'
    };
    
    toast.innerHTML = `<span>${icons[type] || '💡'}</span><span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/**
 * 复制文本到剪贴板
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            document.body.removeChild(textarea);
            return true;
        } catch (e) {
            document.body.removeChild(textarea);
            return false;
        }
    }
}

/**
 * 根据文件名推断图标类型
 */
function getFileIcon(name) {
    const lower = name.toLowerCase();
    if (/\.(mp4|mkv|avi|mov|wmv|flv|ts|webm|264|265|hevc)/.test(lower)) return '🎬';
    if (/\.(mp3|flac|wav|aac|ogg|m4a)/.test(lower)) return '🎵';
    if (/\.(zip|rar|7z|tar|gz)/.test(lower)) return '📦';
    if (/\.(exe|msi|dmg|apk|iso)/.test(lower)) return '💿';
    if (/\.(pdf|epub|mobi|txt|doc|docx)/.test(lower)) return '📚';
    if (/\.(jpg|jpeg|png|gif|bmp|webp)/.test(lower)) return '🖼️';
    if (/4k|uhd|hdr|remux|bluray|blu-ray/.test(lower)) return '🎥';
    if (/动漫|anime|ova|oad/.test(lower)) return '🎌';
    if (/游戏|game|steam|switch|ps5|xbox/.test(lower)) return '🎮';
    return '📁';
}

/**
 * 从磁力链接提取 info hash
 */
function extractMagnetHash(magnet) {
    const match = magnet.match(/btih:([a-fA-F0-9]+)/);
    return match ? match[1].toLowerCase() : null;
}

/**
 * 生成短磁力链接(只显示 info hash)
 */
function getShortMagnet(magnet) {
    const hash = extractMagnetHash(magnet);
    if (hash) {
        return `magnet:?xt=urn:btih:${hash}`;
    }
    return magnet;
}

/**
 * 解析文件大小为字节数
 */
function parseSizeToBytes(sizeStr) {
    const match = sizeStr.match(/([\d.]+)\s*(B|KB|MB|GB|TB|PB)/i);
    if (!match) return 0;
    const num = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    const multipliers = { B: 1, KB: 1024, MB: 1024**2, GB: 1024**3, TB: 1024**4, PB: 1024**5 };
    return num * (multipliers[unit] || 1);
}

// ==================== 主题切换 ====================
function initTheme() {
    applyTheme(state.theme);
    
    document.getElementById('themeToggle').addEventListener('click', () => {
        state.theme = state.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', state.theme);
        applyTheme(state.theme);
        showToast(`已切换到${state.theme === 'dark' ? '深色' : '浅色'}主题`, 'success');
    });
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const icon = document.querySelector('.toggle-icon');
    icon.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// ==================== 数据源渲染 ====================
function renderSources() {
    // 更新数量
    document.getElementById('sourceCount').textContent = SOURCES.length;
    
    // 渲染搜索过滤器
    const chipsContainer = document.getElementById('sourceChips');
    chipsContainer.innerHTML = SOURCES.map(source => `
        <div class="source-chip ${state.selectedSources.includes(source.id) ? 'active' : ''}" 
             data-source="${source.id}">
            ${source.name}
        </div>
    `).join('');
    
    // 绑定点击事件
    chipsContainer.querySelectorAll('.source-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const id = chip.dataset.source;
            const idx = state.selectedSources.indexOf(id);
            if (idx > -1) {
                state.selectedSources.splice(idx, 1);
                chip.classList.remove('active');
            } else {
                state.selectedSources.push(id);
                chip.classList.add('active');
            }
        });
    });
    
    // 渲染数据源面板
    const sourcesGrid = document.getElementById('sourcesGrid');
    sourcesGrid.innerHTML = SOURCES.map(source => `
        <div class="source-card">
            <div class="source-name">
                ${source.name}
                <span class="source-status ${source.enabled ? 'online' : 'offline'}">
                    ${source.enabled ? '已启用' : '已禁用'}
                </span>
            </div>
            <div class="source-desc">${source.desc}</div>
        </div>
    `).join('');
}

// ==================== Tab 切换 ====================
function initTabs() {
    const links = document.querySelectorAll('.nav-link');
    const searchHero = document.getElementById('searchHero');
    const resultsSection = document.getElementById('resultsSection');
    const sourcesPanel = document.getElementById('sourcesPanel');
    const aboutPanel = document.getElementById('aboutPanel');
    
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tab = link.dataset.tab;
            
            // 更新激活状态
            links.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // 切换面板
            searchHero.style.display = tab === 'home' ? '' : 'none';
            resultsSection.style.display = tab === 'home' && state.results.length > 0 ? '' : 'none';
            sourcesPanel.style.display = tab === 'sources' ? '' : 'none';
            aboutPanel.style.display = tab === 'about' ? '' : 'none';
            
            // 滚动到顶部
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}

// ==================== 搜索功能 ====================

/**
 * 核心搜索:优先调本地后端 /api/search,后端会真实拉 Bitsearch + ThePirateBay 等公开 API
 * 如果后端不可用(比如直接用 file:// 打开 HTML),fallback 到 mock 演示数据
 *
 * 返回: { results, meta } meta = { total, time, sources, perSourceCount }
 */
async function searchMagnet(keyword) {
    // 尝试调用本地后端 API
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(keyword)}`, {
            signal: controller.signal
        });
        clearTimeout(timer);

        if (res.ok) {
            const json = await res.json();
            if (json.success && Array.isArray(json.results)) {
                console.log(`[搜索] 后端返回 ${json.count} 条 (去重前 ${json.total}), 用时 ${json.time}ms, 源: ${json.sources?.join(', ')}`);
                return {
                    results: json.results.map(r => ({
                        name: r.name,
                        magnet: r.magnet,
                        size: r.size,
                        sizeBytes: r.sizeBytes,
                        date: r.date,
                        source: r.source,
                        seeds: r.seeds,
                        leechs: r.leechs,
                        category: r.category,
                        verified: r.verified
                    })),
                    meta: {
                        total: json.total,
                        time: json.time,
                        sources: json.sources || [],
                        perSourceCount: json.perSourceCount || {}
                    }
                };
            }
        }
        console.warn(`[搜索] 后端返回异常,fallback 到 mock`);
    } catch (err) {
        console.warn(`[搜索] 后端不可用 (${err.message}),fallback 到 mock 数据`);
    }
    // fallback
    const mockResults = searchMock(keyword);
    return {
        results: mockResults,
        meta: {
            total: mockResults.length,
            time: Math.floor(Math.random() * 500) + 200,
            sources: ['本地演示'],
            perSourceCount: { '本地演示': mockResults.length }
        }
    };
}

/**
 * 本地 mock 搜索(仅在后端不可用时使用)
 */
function searchMock(keyword) {
    const lower = keyword.toLowerCase();
    const results = MOCK_RESULTS.filter(r =>
        r.name.toLowerCase().includes(lower) ||
        r.category.toLowerCase().includes(lower)
    );
    // 随机打乱几条,让 fallback 看起来不那么单调
    for (let i = results.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [results[i], results[j]] = [results[j], results[i]];
    }
    return results;
}

/**
 * 执行搜索
 */
async function doSearch(keyword) {
    if (state.isSearching) return;
    if (!keyword.trim()) {
        showToast('请输入搜索关键词', 'error');
        return;
    }
    
    state.isSearching = true;
    const startTime = Date.now();
    
    // UI 状态切换
    const hero = document.getElementById('searchHero');
    const resultsSection = document.getElementById('resultsSection');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const errorState = document.getElementById('errorState');
    const resultsGrid = document.getElementById('resultsGrid');
    
    hero.style.display = 'none';
    resultsSection.style.display = '';
    loadingState.style.display = '';
    emptyState.style.display = 'none';
    errorState.style.display = 'none';
    resultsGrid.innerHTML = '';
    
    // 滚动到结果区
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    try {
        // 保存搜索历史
        saveSearchHistory(keyword);
        
        // 执行搜索(优先后端真实 API,失败时自动 fallback 到 mock)
        const { results, meta } = await searchMagnet(keyword);
        
        // 存完整结果集,前端分页
        state.allResults = results;
        state.lastMeta = meta;
        state.page = 1;
        
        loadingState.style.display = 'none';
        
        if (results.length === 0) {
            emptyState.style.display = '';
            document.getElementById('totalCount').textContent = '0';
            document.getElementById('searchTime').textContent = meta.time || 0;
            const srcStats = document.getElementById('sourceStats');
            if (srcStats) srcStats.innerHTML = '';
            const pag = document.getElementById('paginationBar');
            if (pag) pag.innerHTML = '';
        } else {
            document.getElementById('totalCount').textContent = results.length;
            document.getElementById('searchTime').textContent = meta.time || 0;
            renderSourceStats(meta);
            renderPage();
            renderPagination();
        }
        
    } catch (err) {
        console.error('搜索出错:', err);
        loadingState.style.display = 'none';
        errorState.style.display = '';
        document.getElementById('errorMsg').textContent = err.message || '搜索过程中出现未知错误';
    }
    
    state.isSearching = false;
}

/**
 * 渲染多源统计条
 */
function renderSourceStats(meta) {
    const container = document.getElementById('sourceStats');
    if (!container) return;
    const counts = meta.perSourceCount || {};
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    if (!total) { container.innerHTML = ''; return; }

    const colors = {
        'Bitsearch': '#6366f1',
        'ThePirateBay': '#ec4899',
        '本地演示': '#06b6d4'
    };

    container.innerHTML = Object.entries(counts).map(([src, n]) => {
        const pct = total > 0 ? Math.round(n / total * 100) : 0;
        const color = colors[src] || '#64748b';
        return `
            <div class="source-stat-chip" style="border-color: ${color}40; background: ${color}10;">
                <span class="stat-dot" style="background: ${color};"></span>
                <span class="stat-name">${src}</span>
                <span class="stat-count">${n}</span>
                <span class="stat-pct">(${pct}%)</span>
            </div>
        `;
    }).join('');
}

/**
 * 渲染搜索结果
 */
function renderResults(results) {
    const grid = document.getElementById('resultsGrid');
    const icon = getFileIcon(results[0]?.name || '');
    
    // 去重(按 info hash)
    const seenHashes = new Set();
    const uniqueResults = results.filter(r => {
        const hash = extractMagnetHash(r.magnet);
        if (!hash || seenHashes.has(hash)) return true;
        seenHashes.add(hash);
        return true;
    });
    
    grid.innerHTML = uniqueResults.map((item, idx) => {
        const fileIcon = getFileIcon(item.name);
        const shortMagnet = getShortMagnet(item.magnet);
        
        return `
            <div class="result-card" style="animation-delay: ${idx * 0.05}s">
                <div class="card-header">
                    <div class="card-icon">${fileIcon}</div>
                    <div class="card-title" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</div>
                </div>
                
                <div class="card-meta">
                    ${item.size ? `<span class="meta-tag size">📦 ${item.size}</span>` : ''}
                    ${item.date ? `<span class="meta-tag date">📅 ${item.date}</span>` : ''}
                    ${item.source ? `<span class="meta-tag source">🔗 ${item.source}</span>` : ''}
                    ${item.seeds ? `<span class="meta-tag size">🌱 ${item.seeds}</span>` : ''}
                    ${item.verified ? `<span class="meta-tag verified">✅ 已验证</span>` : ''}
                </div>
                
                <div class="magnet-link" data-full="${escapeHtml(item.magnet)}" title="点击展开/收起">
                    ${escapeHtml(shortMagnet)}
                </div>
                
                <div class="card-actions">
                    <button class="action-btn primary" data-action="copy" data-magnet="${escapeHtml(item.magnet)}">
                        📋 复制磁力
                    </button>
                    <button class="action-btn secondary" data-action="open" data-magnet="${escapeHtml(item.magnet)}">
                        🧲 打开
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    // 绑定卡片事件
    grid.querySelectorAll('.result-card').forEach(card => {
        // 磁力链接展开/收起
        const magnetLink = card.querySelector('.magnet-link');
        magnetLink.addEventListener('click', () => {
            magnetLink.classList.toggle('expanded');
            if (magnetLink.classList.contains('expanded')) {
                magnetLink.textContent = magnetLink.dataset.full;
            } else {
                magnetLink.textContent = getShortMagnet(magnetLink.dataset.full);
            }
        });
        
        // 复制按钮
        card.querySelector('[data-action="copy"]').addEventListener('click', async (e) => {
            e.stopPropagation();
            const magnet = e.currentTarget.dataset.magnet;
            const ok = await copyToClipboard(magnet);
            showToast(ok ? '磁力链接已复制到剪贴板!' : '复制失败,请手动复制', ok ? 'success' : 'error');
            
            // 按钮反馈
            const btn = e.currentTarget;
            const original = btn.innerHTML;
            btn.innerHTML = '✅ 已复制';
            btn.style.background = '#22c55e';
            setTimeout(() => {
                btn.innerHTML = original;
                btn.style.background = '';
            }, 1500);
        });
        
        // 打开按钮
        card.querySelector('[data-action="open"]').addEventListener('click', (e) => {
            e.stopPropagation();
            const magnet = e.currentTarget.dataset.magnet;
            window.location.href = magnet;
        });
    });
}

/**
 * HTML 转义
 */
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * 渲染当前页结果(从 allResults slice 出一页)
 */
function renderPage() {
    const { allResults, page, perPage } = state;
    const start = (page - 1) * perPage;
    const end = start + perPage;
    state.results = allResults.slice(start, end);
    renderResults(state.results);
    // 滚到结果区顶部
    document.getElementById('resultsSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * 渲染分页组件
 */
function renderPagination() {
    const bar = document.getElementById('paginationBar');
    if (!bar) return;

    const { allResults, page, perPage } = state;
    const total = allResults.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    if (totalPages <= 1) { bar.innerHTML = ''; return; }

    // 计算显示哪些页码:首页、尾页、当前页附近
    const pages = new Set([1, totalPages]);
    for (let i = page - 2; i <= page + 2; i++) {
        if (i >= 1 && i <= totalPages) pages.add(i);
    }
    const sortedPages = [...pages].sort((a, b) => a - b);

    let html = `<div class="pagination-info">第 ${page} / ${totalPages} 页 · 共 ${total} 条</div>`;
    html += `<div class="pagination-controls">`;

    // 上一页
    html += `<button class="pg-btn ${page === 1 ? 'disabled' : ''}" data-page="${page - 1}" ${page === 1 ? 'disabled' : ''}>‹ 上一页</button>`;

    // 页码
    let last = 0;
    sortedPages.forEach(p => {
        if (p - last > 1) html += `<span class="pg-ellipsis">…</span>`;
        const active = p === page ? 'active' : '';
        html += `<button class="pg-btn ${active}" data-page="${p}">${p}</button>`;
        last = p;
    });

    // 下一页
    html += `<button class="pg-btn ${page === totalPages ? 'disabled' : ''}" data-page="${page + 1}" ${page === totalPages ? 'disabled' : ''}>下一页 ›</button>`;

    // 跳转输入
    html += `<span class="pg-jump">跳至 <input type="number" min="1" max="${totalPages}" id="pgJumpInput"> 页</span>`;

    html += `</div>`;
    bar.innerHTML = html;

    // 绑定事件
    bar.querySelectorAll('.pg-btn[data-page]').forEach(btn => {
        btn.addEventListener('click', () => {
            const p = parseInt(btn.dataset.page, 10);
            if (!isNaN(p)) goToPage(p);
        });
    });

    const jumpInput = document.getElementById('pgJumpInput');
    if (jumpInput) {
        jumpInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const val = parseInt(jumpInput.value, 10);
                if (!isNaN(val)) goToPage(val);
            }
        });
    }
}

/**
 * 跳转到指定页
 */
function goToPage(p) {
    const totalPages = Math.max(1, Math.ceil(state.allResults.length / state.perPage));
    p = Math.max(1, Math.min(p, totalPages));
    if (p === state.page) return;
    state.page = p;
    renderPage();
    renderPagination();
}

/**
 * 排序全部结果集并刷新当前页
 */
function sortResults(sortBy) {
    if (!state.allResults.length) return;
    
    const sorted = [...state.allResults];
    
    switch (sortBy) {
        case 'size_desc':
            sorted.sort((a, b) => (b.sizeBytes || 0) - (a.sizeBytes || 0));
            break;
        case 'size_asc':
            sorted.sort((a, b) => (a.sizeBytes || 0) - (b.sizeBytes || 0));
            break;
        case 'name_asc':
            sorted.sort((a, b) => a.name.localeCompare(b.name, 'zh'));
            break;
        case 'date_desc':
            sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
    }
    
    state.allResults = sorted;
    state.page = 1;
    renderPage();
    renderPagination();
}

// ==================== 搜索历史 ====================
function saveSearchHistory(keyword) {
    state.searchHistory = state.searchHistory.filter(k => k !== keyword);
    state.searchHistory.unshift(keyword);
    state.searchHistory = state.searchHistory.slice(0, 10);
    localStorage.setItem('searchHistory', JSON.stringify(state.searchHistory));
}

// ==================== 热门搜索 ====================
function initHotSearches() {
    const tags = document.querySelectorAll('.hot-tag');
    tags.forEach(tag => {
        tag.addEventListener('click', (e) => {
            e.preventDefault();
            const keyword = tag.textContent.trim();
            document.getElementById('searchInput').value = keyword;
            doSearch(keyword);
        });
    });
}

// ==================== 搜索框交互 ====================
function initSearchBox() {
    const form = document.getElementById('searchForm');
    const input = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearBtn');
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        doSearch(input.value);
    });
    
    input.addEventListener('input', () => {
        clearBtn.style.display = input.value ? 'flex' : 'none';
    });
    
    clearBtn.addEventListener('click', () => {
        input.value = '';
        input.focus();
        clearBtn.style.display = 'none';
    });
    
    // ESC 清空
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            input.value = '';
            clearBtn.style.display = 'none';
        }
    });
}

// ==================== 滚动监听 ====================
function initScrollListener() {
    let lastScroll = 0;
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            navbar.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
        } else {
            navbar.style.boxShadow = 'none';
        }
        
        lastScroll = currentScroll;
    });
}

// ==================== 键盘快捷键 ====================
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // '/' 聚焦搜索框
        if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
            e.preventDefault();
            document.getElementById('searchInput').focus();
        }
        // 'Ctrl/Cmd + K' 聚焦搜索框
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            document.getElementById('searchInput').focus();
        }
    });
}

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initTabs();
    renderSources();
    initHotSearches();
    initSearchBox();
    initScrollListener();
    initKeyboardShortcuts();
    
    // 排序选择器
    document.getElementById('sortSelect').addEventListener('change', (e) => {
        sortResults(e.target.value);
    });
    
    console.log('%c🧲 磁力猎手 v1.0','font-size:24px;font-weight:bold;color:#6366f1;');
    console.log('%c一个简单、快速、免费的磁力资源搜索引擎','font-size:14px;color:#64748b;');
    console.log('%c按 "/" 或 "Ctrl+K" 快速聚焦搜索框','font-size:12px;color:#94a3b8;');
});
