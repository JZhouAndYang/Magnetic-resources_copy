/**
 * api/search.js — Vercel + Netlify 双平台通用
 *
 * 部署:
 *   - Vercel:  直接推到 GitHub,根目录有 api/ 文件夹自动识别 /api/*
 *   - Netlify: 配 netlify.toml 里 functions = "api",或放到 netlify/functions/
 *   - 本地测试: node -e "const h = require('./api/search.js'); h({query:{q:'ubuntu'}},{json:console.log,status:(c)=>console.log('status',c)}).then(r=>console.log('done'))"
 *
 * 请求:
 *   GET /api/search?q=关键词&safe=1
 *
 * 返回:
 *   { success, query, count, time, perSourceCount, results }
 */

// ==================== NSFW 黑名单 ====================
const NSFW_KEYWORDS = [
    '色情', '黄色', '成人', 'av', 'a片', '毛片', '三级', '无码', '有码',
    '中出', '口交', '后庭', '自慰', 'sm', '捆绑', '调教', 'hentai',
    'xxx', 'porn', 'porno', 'nsfw', '18+', 'adult', 'erotic', 'camgirl',
    'manyvids', 'chaturbate', 'stripchat', 'brazzers', 'realitykings',
    'phub', 'pornhub', 'xnxx', 'xhamster', 'spankbang', 'redtube',
    'jav', 'fc2', 'uncensored', 'censored', 'creampie', 'blowjob',
    'anal', 'dildo', 'vibrator', 'bondage', 'dungeon', 'mistress',
    'cumshot', 'bukkake', 'gangbang', 'orgy', 'threesome', 'swinger',
    'pedo', 'child', 'underage', 'lolita', 'loli', 'shota',
    'sex', 'nude', 'naked', 'sensual', 'provocative',
    'amateur', 'homemade', 'private', 'leaked'
];
const NSFW_REGEX = new RegExp(NSFW_KEYWORDS.join('|'), 'i');

function isNSFW(text) {
    if (!text) return false;
    return NSFW_REGEX.test(text);
}

// ==================== 数据源 ====================
const SOURCES = [
    {
        id: 'bitsearch',
        name: 'Bitsearch',
        enabled: true,
        weight: 1.2,
        pages: 3,
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
                category: guessCategory(r.title),
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
        pages: 1,
        perPage: 100,
        buildUrl: (q) => `https://apibay.org/q.php?q=${encodeURIComponent(q)}`,
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
                category: guessCategory(r.name),
                magnet: r.info_hash
                    ? `magnet:?xt=urn:btih:${r.info_hash}&dn=${encodeURIComponent(r.name)}`
                    : null
            })).filter(r => r.magnet);
        }
    }
];

// ==================== 工具函数 ====================
function formatBytes(bytes) {
    if (!bytes || bytes < 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    let i = 0, val = bytes;
    while (val >= 1024 && i < units.length - 1) { val /= 1024; i++; }
    return `${val.toFixed(val >= 100 ? 0 : val >= 10 ? 1 : 2)} ${units[i]}`;
}

function guessCategory(title) {
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
    if (/游戏|game|steam|switch|ps5|xbox|epic/.test(lower)) return '游戏';
    if (/动漫|anime|ova|oad/.test(lower)) return '动漫';
    if (/电视剧|tv|series|season|s\d+e\d+/.test(lower)) return '电视剧';
    return '其他';
}

function isRelevant(name, query) {
    if (!name || !query) return true;
    const nL = name.toLowerCase(), qL = query.toLowerCase().trim();
    if (nL.includes(qL)) return true;
    const chars = Array.from(new Set(qL.split('')));
    const hit = chars.filter(c => c.trim() && nL.includes(c)).length;
    return hit / chars.length >= 0.4;
}

// ==================== 请求 ====================
async function fetchOnePage(source, query, page) {
    const pageSize = source.perPage || 100;
    try {
        const url = source.buildUrl.length >= 3
            ? source.buildUrl(query, pageSize, page)
            : source.buildUrl(query, pageSize);
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'MagnetHunter/1.0 (+https://github.com/)',
                'Accept': 'application/json, */*'
            }
        });
        if (!res.ok) return [];
        const json = await res.json();
        return source.parse(json);
    } catch {
        return [];
    }
}

async function fetchFromSource(source, query) {
    const pages = source.pages || 1;
    const pageResults = await Promise.all(
        Array.from({ length: pages }, (_, i) => fetchOnePage(source, query, i + 1))
    );
    let all = pageResults.flat();
    if (source.id !== 'bitsearch') {
        all = all.filter(r => isRelevant(r.name, query));
    }
    return all;
}

// ==================== 核心处理逻辑 ====================
async function doSearch(q, safe) {
    const startTime = Date.now();

    const enabledSources = SOURCES.filter(s => s.enabled);
    const resultsArrays = await Promise.all(enabledSources.map(s => fetchFromSource(s, q)));

    let all = resultsArrays.flat();

    if (safe) {
        all = all.filter(r => !isNSFW(r.name) && !isNSFW(r.category));
    }

    // 去重
    const seen = new Set();
    const deduped = all.filter(r => {
        const m = r.magnet && r.magnet.match(/btih:([a-fA-F0-9]+)/);
        const hash = m ? m[1].toLowerCase() : r.name;
        if (seen.has(hash)) return false;
        seen.add(hash);
        return true;
    });

    // 打分排序
    const queryLower = q.toLowerCase();
    const scored = deduped.map(r => {
        let score = (r.seeds || 0);
        if (r.name.toLowerCase().includes(queryLower)) score *= 2;
        score *= 1 + Math.min((r.seeds || 0) / 5000, 3);
        if (r.verified) score *= 1.1;
        const src = SOURCES.find(s => s.name === r.source);
        if (src) score *= src.weight;
        return { ...r, _score: score };
    });

    scored.sort((a, b) => b._score - a._score);
    const final = scored.map(r => { delete r._score; return r; });

    const elapsed = Date.now() - startTime;

    const perSourceCount = {};
    deduped.forEach(r => { perSourceCount[r.source] = (perSourceCount[r.source] || 0) + 1; });

    return {
        success: true,
        query: q,
        total: deduped.length,
        count: final.length,
        time: elapsed,
        sources: enabledSources.map(s => s.name),
        perSourceCount,
        results: final
    };
}

// ==================== Vercel 适配:handler(req, res) ====================
async function handleVercel(req, res) {
    // Vercel req.query 或 req.url 都可能有参数
    let q = '';
    let safe = true;
    if (req.query && req.query.q) {
        q = String(req.query.q).trim();
        safe = req.query.safe !== '0';
    } else if (req.url) {
        try {
            const url = new URL(req.url, 'https://vercel.app');
            q = (url.searchParams.get('q') || '').trim();
            safe = url.searchParams.get('safe') !== '0';
        } catch {}
    }

    if (!q) {
        res.status(400).json({ success: false, error: '缺少搜索关键词 q' });
        return;
    }

    const data = await doSearch(q, safe);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(200).json(data);
}

// ==================== Netlify 适配:handler(event, context) ====================
async function handleNetlify(event) {
    let q = '';
    let safe = true;
    const params = event.queryStringParameters || {};
    q = (params.q || '').trim();
    safe = params.safe !== '0';

    if (!q) {
        return {
            statusCode: 400,
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ success: false, error: '缺少搜索关键词 q' })
        };
    }

    const data = await doSearch(q, safe);
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        },
        body: JSON.stringify(data)
    };
}

// ==================== 统一导出 ====================
// Netlify / AWS Lambda:   exports.handler(event, context)
// Vercel (Express):        module.exports = handler(req, res)
// 两边都要正确,否则会报 "handler is undefined or not exported"
function handler(arg1, arg2) {
    // Vercel Express 风格:第二个参数有 .json() 和 .status()
    if (arg2 && typeof arg2.json === 'function' && typeof arg2.status === 'function') {
        return handleVercel(arg1, arg2);
    }
    // Netlify Lambda 风格
    return handleNetlify(arg1 || {});
}

// 关键!Netlify 找 module.exports.handler,而不是 module.exports 本身
// 所以必须同时赋值到 exports.handler 和 module.exports.handler
exports.handler = handler;
module.exports = handler;
module.exports.handler = handler;
