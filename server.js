/**
 * 磁力猎手 - 后端代理服务
 * 聚合多个公开磁力源 API,解决前端 CORS 问题
 *
 * 启动: node server.js
 * 前端访问: http://localhost:3000
 */

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== NSFW 关键词黑名单 ====================
const NSFW_KEYWORDS = [
    // 中文
    '色情', '黄色', '成人', 'av', 'a片', 'a片', '毛片', '三级', '无码', '有码',
    '中出', '口交', '后庭', '自慰', 'sm', '捆绑', '调教', 'hentai',
    // 英文
    'xxx', 'porn', 'porno', 'nsfw', '18+', 'adult', 'erotic', 'camgirl',
    'manyvids', 'chaturbate', 'stripchat', 'brazzers', 'realitykings',
    'phub', 'pornhub', 'xnxx', 'xhamster', 'spankbang', 'redtube',
    'jav', 'fc2', 'uncensored', 'censored', 'creampie', 'blowjob',
    'anal', 'dildo', 'vibrator', 'bondage', 'dungeon', 'mistress',
    'cumshot', 'bukkake', 'gangbang', 'orgy', 'threesome', 'swinger',
    'pedo', 'child', 'underage', 'lolita', 'loli', 'shota',
    // 常见成人站
    'sex', 'nude', 'naked', 'sensual', 'provocative',
    // 额外过滤
    'amateur', 'homemade', 'private', 'leaked'
];

const NSFW_REGEX = new RegExp(NSFW_KEYWORDS.join('|'), 'i');

function isNSFW(text) {
    if (!text) return false;
    return NSFW_REGEX.test(text);
}

// ==================== 数据源配置 ====================
// 每个源有独立的搜索请求逻辑和结果解析逻辑
// 每个源可以指定 pages 参数来翻多页
const SOURCES = [
    {
        id: 'bitsearch',
        name: 'Bitsearch',
        enabled: true,
        weight: 1.2,
        pages: 3, // Bitsearch 支持 page 参数,翻 3 页 = 最多 300 条
        perPage: 100,
        buildUrl: (q, limit, page) =>
            `https://bitsearch.eu/api/v1/search?q=${encodeURIComponent(q)}&limit=${limit}&page=${page}&verified=0`,
        parse: (raw) => {
            if (!raw || !raw.success || !Array.isArray(raw.results)) return [];
            return raw.results.map(r => ({
                name: r.title,
                sizeBytes: r.size || 0,
                size: formatBytes(r.size || 0),
                date: r.updatedAt ? new Date(r.updatedAt).toISOString().slice(0, 10) : '',
                seeds: r.seeders || 0,
                leechs: r.leechers || 0,
                verified: !!r.verified,
                source: 'Bitsearch',
                category: guessCategory(r.title, r.category),
                magnet: r.infohash
                    ? `magnet:?xt=urn:btih:${r.infohash}&dn=${encodeURIComponent(r.title)}`
                    : null
            })).filter(r => r.magnet);
        }
    },
    {
        id: 'tpb',
        name: 'ThePirateBay',
        enabled: true,
        weight: 1.0,
        pages: 1, // TPB API 不支持分页,最多一次 100 条
        perPage: 100,
        buildUrl: (q, limit) =>
            `https://apibay.org/q.php?q=${encodeURIComponent(q)}`,
        parse: (raw) => {
            if (!Array.isArray(raw)) return [];
            return raw.map(r => ({
                name: r.name,
                sizeBytes: parseInt(r.size, 10) || 0,
                size: formatBytes(parseInt(r.size, 10) || 0),
                date: r.added ? new Date(parseInt(r.added, 10) * 1000).toISOString().slice(0, 10) : '',
                seeds: parseInt(r.seeders, 10) || 0,
                leechs: parseInt(r.leechers, 10) || 0,
                verified: r.status === 'vip' || r.status === 'trusted',
                source: 'ThePirateBay',
                category: guessCategory(r.name, r.category),
                magnet: r.info_hash
                    ? `magnet:?xt=urn:btih:${r.info_hash}&dn=${encodeURIComponent(r.name)}`
                    : null
            })).filter(r => r.magnet);
        }
    }
];

// ==================== 工具函数 ====================

/**
 * 字节数友好格式化
 */
function formatBytes(bytes) {
    if (!bytes || bytes < 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    let i = 0;
    let val = bytes;
    while (val >= 1024 && i < units.length - 1) {
        val /= 1024;
        i++;
    }
    return `${val.toFixed(val >= 100 ? 0 : val >= 10 ? 1 : 2)} ${units[i]}`;
}

/**
 * 根据标题和 API 分类号猜测资源类型
 * Bitsearch category: 1=Video, 3=TV, 10=XXX 等
 */
function guessCategory(title, apiCategory) {
    const lower = (title || '').toLowerCase();
    if (/\.(mp4|mkv|avi|mov|wmv|flv|ts|webm|264|265|hevc|iso)/.test(lower)) {
        if (/4k|uhd|hdr|remux|bluray|blu-ray|1080p|720p/.test(lower)) return '电影/视频';
        return '视频';
    }
    if (/\.(mp3|flac|wav|aac|ogg|m4a|ape)/.test(lower)) return '音乐';
    if (/\.(zip|rar|7z|tar|gz|arj)/.test(lower)) return '压缩包';
    if (/\.(exe|msi|dmg|apk|pkg)/.test(lower)) return '软件';
    if (/\.(pdf|epub|mobi|txt|doc|docx|azw3)/.test(lower)) return '书籍';
    if (/\.(jpg|jpeg|png|gif|bmp|webp|psd)/.test(lower)) return '图片';
    if (/\.(iso|cue|bin|ccd)/.test(lower)) return '光盘镜像';
    if (/\.(srt|ass|ssa|sub)/.test(lower)) return '字幕';
    if (/游戏|game|steam|switch|ps5|xbox|epic/.test(lower)) return '游戏';
    if (/动漫|anime|ova|oad/.test(lower)) return '动漫';
    if (/电视剧|tv|series|season|s\d+e\d+/.test(lower)) return '电视剧';
    return '其他';
}

/**
 * 关键词相关度打分
 * title 必须和 query 至少有部分字符重叠,否则过滤掉
 * 这样防止 ThePirateBay 返回一堆不相关的热门结果
 */
function isRelevant(name, query) {
    if (!name || !query) return true;
    const nameLower = name.toLowerCase();
    const queryLower = query.toLowerCase().trim();
    // query 本身是 title 的子串
    if (nameLower.includes(queryLower)) return true;
    // query 至少有 50% 的字符出现在 title 里(适合中文拆词)
    const chars = Array.from(new Set(queryLower.split('')));
    const hit = chars.filter(c => c.trim() && nameLower.includes(c)).length;
    return hit / chars.length >= 0.4;
}

/**
 * 单页请求(带超时)
 */
async function fetchOnePage(source, query, page) {
    const pageSize = source.perPage || 100;
    try {
        const url = source.buildUrl.length >= 3
            ? source.buildUrl(query, pageSize, page)
            : source.buildUrl(query, pageSize);
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'MagnetHunter/1.0 (+https://github.com/)',
                'Accept': 'application/json, */*'
            }
        });
        clearTimeout(timer);

        if (!res.ok) {
            console.warn(`[${source.name}] page=${page} HTTP ${res.status}`);
            return [];
        }
        const json = await res.json();
        return source.parse(json);
    } catch (err) {
        console.warn(`[${source.name}] page=${page} 失败: ${err.message}`);
        return [];
    }
}

/**
 * 多页聚合请求 — 翻 pages 页,每页 perPage 条
 */
async function fetchFromSource(source, query) {
    const pages = source.pages || 1;
    const pageSize = source.perPage || 100;

    // 并发翻所有页(比串行快)
    const pageResults = await Promise.all(
        Array.from({ length: pages }, (_, i) => fetchOnePage(source, query, i + 1))
    );

    let all = pageResults.flat();

    // 关键词相关度过滤
    if (source.id !== 'bitsearch') {
        all = all.filter(r => isRelevant(r.name, query));
    }

    console.log(`[${source.name}] 翻 ${pages} 页,共 ${all.length} 条`);
    return all;
}

// ==================== API 路由 ====================

/**
 * 判断是否包含中文字符
 */
function hasChinese(str) {
    return /[\u4e00-\u9fa5]/.test(str);
}

// 复用 api/search.js 的核心逻辑,后端只有一份
const searchApi = require('./api/search.js');
const sharedDoSearch = searchApi.doSearch;

/**
 * GET /api/search?q=关键词&safe=1&match=smart|fuzzy|exact
 * 转发到 api/search.js 的 doSearch,保持与 Netlify/Vercel 行为一致
 */
app.get('/api/search', async (req, res) => {
    const q = (req.query.q || '').toString().trim();
    const safe = req.query.safe !== '0';
    const match = req.query.match || 'smart';

    if (!q) {
        return res.json({ success: false, error: '缺少搜索关键词 q' });
    }

    try {
        const data = await sharedDoSearch(q, safe, match);
        res.json(data);
    } catch (err) {
        console.error('[/api/search] 错误:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/sources
 * 返回当前可用的数据源列表
 */
app.get('/api/sources', (req, res) => {
    res.json({
        sources: SOURCES.map(s => ({ id: s.id, name: s.name, enabled: s.enabled }))
    });
});

/**
 * GET /api/health
 * 健康检查
 */
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

// ==================== 静态文件 ====================
app.use(express.static(__dirname));

// 404 fallback
app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
        res.status(404).json({ success: false, error: 'API 不存在' });
    } else {
        res.status(404).sendFile(path.join(__dirname, 'index.html'));
    }
});

// ==================== 启动 ====================
app.listen(PORT, () => {
    console.log(`\n🧲 磁力猎手后端已启动`);
    console.log(`   地址: http://localhost:${PORT}`);
    console.log(`   API:  http://localhost:${PORT}/api/search?q=三体`);
    console.log(`   数据源: ${SOURCES.filter(s => s.enabled).map(s => s.name).join(', ')}`);
    console.log(`   安全过滤: 已开启\n`);
});
