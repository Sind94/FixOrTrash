import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, 
    Cpu, 
    Zap, 
    CheckCircle, 
    AlertTriangle, 
    FileText, 
    RefreshCw, 
    Plus, 
    Trash2, 
    Sparkles, 
    Download,
    Gamepad2,
    Database,
    Monitor,
    Briefcase,
    Sliders,
    Search,
    RotateCcw,
    X,
    ShoppingCart,
    ExternalLink,
    Activity,
    BarChart3,
    Gauge,
    Layers,
    Info
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { libraryService } from '../services/libraryService';
import { dataManager } from '../services/dataManager';
import logoReport from '../assets/logo_denis.jpg';
import { pdfLayoutEngine } from '../services/pdfLayoutEngine';
import { openUrl } from '@tauri-apps/plugin-opener';

// ─── SMART CHIPSET & SOCKET PARSER ───────────────────────────────────────────
const CHIPSET_DATABASE = [
    // AMD AM5 (DDR5 only)
    { pattern: /\b(X870E|X870|B850|B840|X670E|X670|B650E|B650|A620)\b/i, socket: 'AM5', defaultRam: 'DDR5', brand: 'AMD' },
    // AMD AM4 (DDR4 only)
    { pattern: /\b(X570|X470|X370|B550|B450|B350|A520|A320)\b/i, socket: 'AM4', defaultRam: 'DDR4', brand: 'AMD' },
    // AMD Threadripper
    { pattern: /\b(TRX50|WRX90)\b/i, socket: 'sTR5', defaultRam: 'DDR5', brand: 'AMD' },
    { pattern: /\b(TRX40|WRX80)\b/i, socket: 'sTRX4', defaultRam: 'DDR4', brand: 'AMD' },
    { pattern: /\b(X399)\b/i, socket: 'TR4', defaultRam: 'DDR4', brand: 'AMD' },

    // Intel LGA1851 (Core Ultra Series 2 / Arrow Lake - DDR5 only)
    { pattern: /\b(Z890|B860|H810)\b/i, socket: 'LGA1851', defaultRam: 'DDR5', brand: 'Intel' },
    // Intel LGA1700 (12th, 13th, 14th Gen - DDR4 or DDR5)
    { pattern: /\b(Z790|Z690|B760|B660|H770|H670|H610)\b/i, socket: 'LGA1700', defaultRam: 'DDR5/DDR4', brand: 'Intel' },
    // Intel LGA1200 (10th, 11th Gen - DDR4)
    { pattern: /\b(Z590|Z490|B560|B460|H570|H470|H510|H410)\b/i, socket: 'LGA1200', defaultRam: 'DDR4', brand: 'Intel' },
    // Intel LGA1151v2 (8th, 9th Gen)
    { pattern: /\b(Z390|Z370|B365|B360|H370|H310)\b/i, socket: 'LGA1151v2', defaultRam: 'DDR4', brand: 'Intel' },
    // Intel LGA1151 (6th, 7th Gen)
    { pattern: /\b(Z270|Z170|H270|H170|B250|B150|H110)\b/i, socket: 'LGA1151', defaultRam: 'DDR4', brand: 'Intel' }
];

export const parseMotherboard = (moboInput) => {
    if (!moboInput || typeof moboInput !== 'string') {
        return { raw: '', chipset: '', socket: '', ramSupported: '', brand: '', isValid: false };
    }
    const text = moboInput.trim();
    for (const item of CHIPSET_DATABASE) {
        const match = text.match(item.pattern);
        if (match) {
            const detectedChipset = match[1].toUpperCase();
            let ramType = item.defaultRam;
            if (/\b(DDR4|D4)\b/i.test(text)) {
                ramType = 'DDR4';
            } else if (/\b(DDR5|D5)\b/i.test(text)) {
                ramType = 'DDR5';
            }

            return {
                raw: text,
                chipset: detectedChipset,
                socket: item.socket,
                ramSupported: ramType,
                brand: item.brand,
                isValid: true
            };
        }
    }

    // Direct socket check fallback
    if (/AM5/i.test(text)) return { raw: text, chipset: 'AM5 Gen', socket: 'AM5', ramSupported: 'DDR5', brand: 'AMD', isValid: true };
    if (/AM4/i.test(text)) return { raw: text, chipset: 'AM4 Gen', socket: 'AM4', ramSupported: 'DDR4', brand: 'AMD', isValid: true };
    if (/LGA1851/i.test(text)) return { raw: text, chipset: 'LGA1851 Gen', socket: 'LGA1851', ramSupported: 'DDR5', brand: 'Intel', isValid: true };
    if (/LGA1700/i.test(text)) return { raw: text, chipset: 'LGA1700 Gen', socket: 'LGA1700', ramSupported: 'DDR5/DDR4', brand: 'Intel', isValid: true };
    if (/LGA1200/i.test(text)) return { raw: text, chipset: 'LGA1200 Gen', socket: 'LGA1200', ramSupported: 'DDR4', brand: 'Intel', isValid: true };

    return { raw: text, chipset: '', socket: '', ramSupported: '', brand: '', isValid: false };
};

// Popular Motherboard model templates grouped by socket
const POPULAR_MOTHERBOARDS_BY_SOCKET = {
    'AM5': [
        'MSI MAG B650 TOMAHAWK WIFI',
        'ASUS TUF GAMING B650-PLUS WIFI',
        'Gigabyte B650 GAMING X AX V2',
        'ASRock B650M-HDV/M.2',
        'MSI PRO B650-S WIFI',
        'ASUS ROG STRIX X870-F GAMING WIFI',
        'ASRock X870 Pro RS',
        'Gigabyte A620M S2H',
        'B650 (Chipset Standard)',
        'X870 (Chipset Standard)'
    ],
    'LGA1700': [
        'MSI PRO B760M-P DDR4',
        'ASUS PRIME B760-PLUS DDR5',
        'MSI MAG Z790 TOMAHAWK WIFI DDR5',
        'Gigabyte B760 GAMING X AX DDR4',
        'ASUS TUF GAMING Z790-PLUS WIFI',
        'ASRock H610M-HVS',
        'B760 (Chipset Standard)',
        'Z790 (Chipset Standard)'
    ],
    'AM4': [
        'MSI B550-A PRO',
        'ASUS TUF GAMING B550-PLUS',
        'Gigabyte B550 AORUS ELITE V2',
        'ASRock B450M-HDV R4.0',
        'MSI A520M-A PRO',
        'B550 (Chipset Standard)',
        'B450 (Chipset Standard)'
    ],
    'LGA1851': [
        'MSI MAG Z890 TOMAHAWK WIFI',
        'ASUS ROG STRIX Z890-A GAMING WIFI',
        'Gigabyte Z890 AORUS ELITE AX',
        'ASRock Z890 Pro RS',
        'Z890 (Chipset Standard)'
    ]
};

// ─── LIVE AMAZON SEARCH HELPER ───────────────────────────────────────────────
const openAmazonSearch = async (query) => {
    if (!query || !query.trim()) return;
    const cleanQuery = query.trim().replace(/\(.*?\)/g, '').trim();
    const url = `https://www.amazon.it/s?k=${encodeURIComponent(cleanQuery)}`;
    try {
        if (window.__TAURI_INTERNALS__) {
            await openUrl(url);
        } else {
            window.open(url, '_blank');
        }
    } catch {
        window.open(url, '_blank');
    }
};

// ─── REALISTIC 2025/2026 CURATED PRESETS ─────────────────────────────────────
const gamePresets = [
    {
        id: 'fortnite',
        name: 'Fortnite',
        min: {
            cpu: 'AMD Ryzen 5 5600',
            gpu: 'AMD Radeon RX 6600',
            ram: '16',
            ramType: 'DDR4',
            mobo: 'MSI B550-A PRO',
            psu: 550,
            storage: 'SSD 1TB M.2 NVMe',
            cooler: 'Dissipatore Stock',
            case: 'ATX Mid-Tower Airflow'
        },
        rec: {
            cpu: 'AMD Ryzen 5 7600',
            gpu: 'NVIDIA GeForce RTX 4060',
            ram: '32',
            ramType: 'DDR5',
            mobo: 'MSI MAG B650 TOMAHAWK WIFI',
            psu: 650,
            storage: 'SSD 1TB M.2 NVMe Gen4',
            cooler: 'Dissipatore a Torre 120mm',
            case: 'ATX Mid-Tower Glass 4x Fan'
        },
        ultra: {
            cpu: 'AMD Ryzen 7 7800X3D',
            gpu: 'NVIDIA GeForce RTX 4070 Super',
            ram: '32',
            ramType: 'DDR5',
            mobo: 'ASUS TUF GAMING B650-PLUS WIFI',
            psu: 750,
            storage: 'SSD 2TB M.2 NVMe Gen4',
            cooler: 'Dissipatore Liquido AIO 240mm',
            case: 'Panoramic Dual Chamber RGB'
        }
    },
    {
        id: 'cyberpunk',
        name: 'Cyberpunk 2077',
        min: {
            cpu: 'AMD Ryzen 5 5600X',
            gpu: 'NVIDIA GeForce RTX 3060 12GB',
            ram: '16',
            ramType: 'DDR4',
            mobo: 'MSI B550-A PRO',
            psu: 550,
            storage: 'SSD 1TB NVMe',
            cooler: 'Dissipatore a Torre 120mm',
            case: 'ATX Mid-Tower'
        },
        rec: {
            cpu: 'AMD Ryzen 5 7600',
            gpu: 'NVIDIA GeForce RTX 4070 Super',
            ram: '32',
            ramType: 'DDR5',
            mobo: 'MSI MAG B650 TOMAHAWK WIFI',
            psu: 650,
            storage: 'SSD 1TB NVMe Gen4',
            cooler: 'Dissipatore a Torre Dual Fan',
            case: 'ATX Mid-Tower Glass RGB'
        },
        ultra: {
            cpu: 'AMD Ryzen 7 7800X3D',
            gpu: 'NVIDIA GeForce RTX 4080 Super',
            ram: '32',
            ramType: 'DDR5',
            mobo: 'ASUS ROG STRIX X870-F GAMING WIFI',
            psu: 850,
            storage: 'SSD 2TB NVMe Gen4',
            cooler: 'Dissipatore Liquido AIO 360mm',
            case: 'Panoramic Dual Chamber Full RGB'
        }
    },
    {
        id: 'cod_warzone',
        name: 'Call of Duty: Warzone',
        min: {
            cpu: 'AMD Ryzen 5 5600',
            gpu: 'AMD Radeon RX 6600',
            ram: '16',
            ramType: 'DDR4',
            mobo: 'MSI B550-A PRO',
            psu: 550,
            storage: 'SSD 1TB NVMe',
            cooler: 'Dissipatore Stock',
            case: 'ATX Mid-Tower'
        },
        rec: {
            cpu: 'AMD Ryzen 5 7600',
            gpu: 'NVIDIA GeForce RTX 4060 Ti',
            ram: '32',
            ramType: 'DDR5',
            mobo: 'MSI MAG B650 TOMAHAWK WIFI',
            psu: 650,
            storage: 'SSD 1TB NVMe Gen4',
            cooler: 'Dissipatore a Torre 120mm',
            case: 'ATX Mid-Tower Mesh 3x ARGB'
        },
        ultra: {
            cpu: 'AMD Ryzen 7 7800X3D',
            gpu: 'NVIDIA GeForce RTX 4070 Ti Super',
            ram: '32',
            ramType: 'DDR5',
            mobo: 'ASUS TUF GAMING B650-PLUS WIFI',
            psu: 750,
            storage: 'SSD 2TB NVMe Gen4',
            cooler: 'Dissipatore Liquido AIO 240mm',
            case: 'Panoramic Dual Chamber RGB'
        }
    },
    {
        id: 'gtav',
        name: 'GTA V / FiveM Roleplay',
        min: {
            cpu: 'Intel Core i3-12100',
            gpu: 'AMD Radeon RX 6600',
            ram: '16',
            ramType: 'DDR4',
            mobo: 'MSI PRO B760M-P DDR4',
            psu: 500,
            storage: 'SSD 1TB NVMe',
            cooler: 'Dissipatore Stock',
            case: 'ATX Mid-Tower'
        },
        rec: {
            cpu: 'AMD Ryzen 5 5600X',
            gpu: 'NVIDIA GeForce RTX 4060',
            ram: '32',
            ramType: 'DDR4',
            mobo: 'MSI B550-A PRO',
            psu: 600,
            storage: 'SSD 1TB NVMe',
            cooler: 'Dissipatore a Torre 120mm',
            case: 'ATX Mid-Tower Glass'
        },
        ultra: {
            cpu: 'AMD Ryzen 7 7800X3D',
            gpu: 'NVIDIA GeForce RTX 4070 Super',
            ram: '32',
            ramType: 'DDR5',
            mobo: 'MSI MAG B650 TOMAHAWK WIFI',
            psu: 750,
            storage: 'SSD 2TB NVMe Gen4',
            cooler: 'Dissipatore Liquido AIO 240mm',
            case: 'Panoramic Dual Chamber RGB'
        }
    },
    {
        id: 'cs2',
        name: 'Counter-Strike 2 / Valorant',
        min: {
            cpu: 'Intel Core i3-12100',
            gpu: 'AMD Radeon RX 6600',
            ram: '16',
            ramType: 'DDR4',
            mobo: 'MSI PRO B760M-P DDR4',
            psu: 500,
            storage: 'SSD 500GB NVMe',
            cooler: 'Dissipatore Stock',
            case: 'Micro-ATX Compact'
        },
        rec: {
            cpu: 'AMD Ryzen 5 7600',
            gpu: 'NVIDIA GeForce RTX 4060',
            ram: '32',
            ramType: 'DDR5',
            mobo: 'MSI MAG B650 TOMAHAWK WIFI',
            psu: 600,
            storage: 'SSD 1TB NVMe Gen4',
            cooler: 'Dissipatore a Torre 120mm',
            case: 'ATX Mid-Tower Mesh'
        },
        ultra: {
            cpu: 'AMD Ryzen 7 7800X3D',
            gpu: 'NVIDIA GeForce RTX 4070 Super',
            ram: '32',
            ramType: 'DDR5',
            mobo: 'ASUS TUF GAMING B650-PLUS WIFI',
            psu: 750,
            storage: 'SSD 2TB NVMe Gen4',
            cooler: 'Dissipatore Liquido AIO 240mm',
            case: 'Panoramic Dual Chamber RGB'
        }
    },
    {
        id: 'minecraft',
        name: 'Minecraft / Roblox',
        min: {
            cpu: 'AMD Ryzen 5 5600G (iGPU)',
            gpu: 'Grafica Integrata AMD Radeon (iGPU)',
            ram: '16',
            ramType: 'DDR4',
            mobo: 'MSI B550-A PRO',
            psu: 450,
            storage: 'SSD 500GB NVMe',
            cooler: 'Dissipatore Stock',
            case: 'Micro-ATX Office/Gaming'
        },
        rec: {
            cpu: 'AMD Ryzen 5 5600',
            gpu: 'NVIDIA GeForce RTX 3050 8GB',
            ram: '16',
            ramType: 'DDR4',
            mobo: 'MSI B550-A PRO',
            psu: 500,
            storage: 'SSD 1TB NVMe',
            cooler: 'Dissipatore a Torre 120mm',
            case: 'ATX Mid-Tower RGB'
        },
        ultra: {
            cpu: 'AMD Ryzen 5 7600',
            gpu: 'NVIDIA GeForce RTX 4060',
            ram: '32',
            ramType: 'DDR5',
            mobo: 'MSI MAG B650 TOMAHAWK WIFI',
            psu: 650,
            storage: 'SSD 1TB NVMe Gen4',
            cooler: 'Dissipatore a Torre Dual Fan',
            case: 'ATX Mid-Tower Glass 4x Fan'
        }
    }
];

const officePresets = [
    {
        id: 'base',
        name: 'Ufficio & Didattica Base (Web/Word/Fatture)',
        specs: {
            cpu: 'Intel Core i3-12100',
            gpu: 'Grafica Integrata Intel UHD (iGPU)',
            ram: '16',
            ramType: 'DDR4',
            mobo: 'MSI PRO B760M-P DDR4',
            psu: 450,
            storage: 'SSD 500GB M.2 NVMe',
            cooler: 'Dissipatore Intel Stock',
            case: 'Case Micro-ATX Silent Office'
        },
        prices: {
            cpu: 85,
            gpu: 0,
            mobo: 75,
            ram: 38,
            psu: 40,
            cooler: 0,
            storage: 38,
            pcCase: 35
        }
    },
    {
        id: 'rec',
        name: 'Ufficio Medio (Multitasking & Gestionali)',
        specs: {
            cpu: 'AMD Ryzen 5 5600G (iGPU)',
            gpu: 'Grafica Integrata AMD Radeon (iGPU)',
            ram: '16',
            ramType: 'DDR4',
            mobo: 'MSI B550-A PRO',
            psu: 500,
            storage: 'SSD 1TB M.2 NVMe',
            cooler: 'Dissipatore Wraith Stealth',
            case: 'Case ATX Professional Office'
        },
        prices: {
            cpu: 115,
            gpu: 0,
            mobo: 85,
            ram: 42,
            psu: 45,
            cooler: 0,
            storage: 55,
            pcCase: 42
        }
    },
    {
        id: 'ultra',
        name: 'Ufficio Avanzato / Aziendale Pro',
        specs: {
            cpu: 'AMD Ryzen 5 8500G (iGPU)',
            gpu: 'Grafica Integrata AMD Radeon (iGPU)',
            ram: '32',
            ramType: 'DDR5',
            mobo: 'MSI MAG B650 TOMAHAWK WIFI',
            psu: 550,
            storage: 'SSD 1TB M.2 NVMe Gen4',
            cooler: 'Dissipatore a Torre 120mm Silent',
            case: 'Case ATX Silent Professional'
        },
        prices: {
            cpu: 145,
            gpu: 0,
            mobo: 135,
            ram: 90,
            psu: 55,
            cooler: 25,
            storage: 65,
            pcCase: 50
        }
    }
];

const workstationPresets = [
    {
        id: 'min',
        name: 'Workstation Entry-Level (Grafica 2D / CAD)',
        specs: {
            cpu: 'Intel Core i5-14600K',
            gpu: 'NVIDIA GeForce RTX 3060 12GB',
            ram: '32',
            ramType: 'DDR5',
            mobo: 'ASUS PRIME B760-PLUS DDR5',
            psu: 650,
            storage: 'SSD 1TB M.2 NVMe Gen4',
            cooler: 'Dissipatore a Torre Dual Fan 120mm',
            case: 'ATX Mid-Tower Workstation Black'
        },
        prices: {
            cpu: 240,
            gpu: 275,
            mobo: 135,
            ram: 95,
            psu: 70,
            cooler: 40,
            storage: 65,
            pcCase: 60
        }
    },
    {
        id: 'rec',
        name: 'Workstation Media (Editing Video 4K & 3D)',
        specs: {
            cpu: 'Intel Core i7-14700K',
            gpu: 'NVIDIA GeForce RTX 4070 Super',
            ram: '64',
            ramType: 'DDR5',
            mobo: 'MSI MAG Z790 TOMAHAWK WIFI DDR5',
            psu: 750,
            storage: 'SSD 2TB M.2 NVMe Gen4',
            cooler: 'Dissipatore Liquido AIO 280mm',
            case: 'ATX Workstation High Airflow'
        },
        prices: {
            cpu: 370,
            gpu: 590,
            mobo: 195,
            ram: 180,
            psu: 95,
            cooler: 85,
            storage: 120,
            pcCase: 80
        }
    },
    {
        id: 'ultra',
        name: 'Workstation High-End (3D Studio, Rendering & AI)',
        specs: {
            cpu: 'AMD Ryzen 9 9950X',
            gpu: 'NVIDIA GeForce RTX 4080 Super',
            ram: '64',
            ramType: 'DDR5',
            mobo: 'ASUS ROG STRIX X870-F GAMING WIFI',
            psu: 1000,
            storage: 'SSD 4TB M.2 NVMe Gen4',
            cooler: 'Dissipatore Liquido AIO 360mm Premium',
            case: 'Full Tower Workstation Soundproof'
        },
        prices: {
            cpu: 580,
            gpu: 990,
            mobo: 280,
            ram: 210,
            psu: 155,
            cooler: 130,
            storage: 240,
            pcCase: 110
        }
    }
];

// ─── REAL-TIME FPS & PRODUCTIVITY ESTIMATOR ──────────────────────────────────
const calculateRealFps = (cpu, gpu, ramSize = '16', ramType = 'DDR5', resolution = '1080p') => {
    if (!gpu) return null;

    let gpuScore = 15;
    const gpuName = (gpu.name || '').toLowerCase();

    if (gpuName.includes('5090')) gpuScore = 100;
    else if (gpuName.includes('4090')) gpuScore = 95;
    else if (gpuName.includes('5080')) gpuScore = 90;
    else if (gpuName.includes('4080 super') || gpuName.includes('4080')) gpuScore = 86;
    else if (gpuName.includes('7900 xtx')) gpuScore = 85;
    else if (gpuName.includes('5070 ti') || gpuName.includes('4070 ti super')) gpuScore = 78;
    else if (gpuName.includes('4070 ti') || gpuName.includes('7900 xt')) gpuScore = 74;
    else if (gpuName.includes('5070') || gpuName.includes('4070 super')) gpuScore = 70;
    else if (gpuName.includes('4070') || gpuName.includes('7800 xt')) gpuScore = 65;
    else if (gpuName.includes('4060 ti') || gpuName.includes('7700 xt')) gpuScore = 55;
    else if (gpuName.includes('4060') || gpuName.includes('7600 xt') || gpuName.includes('6700 xt') || gpuName.includes('3060 ti')) gpuScore = 48;
    else if (gpuName.includes('3060') || gpuName.includes('7600') || gpuName.includes('6600 xt')) gpuScore = 40;
    else if (gpuName.includes('6600') || gpuName.includes('3050') || gpuName.includes('2060')) gpuScore = 32;
    else if (gpuName.includes('1660 super') || gpuName.includes('1660 ti') || gpuName.includes('1660')) gpuScore = 26;
    else if (gpuName.includes('1050 ti') || gpuName.includes('580') || gpuName.includes('5500 xt')) gpuScore = 16;
    else if (gpuName.includes('integrata') || gpuName.includes('uhd') || gpuName.includes('vega') || gpuName.includes('radeon 7') || gpuName.includes('radeon 6')) {
        if (gpuName.includes('780m') || gpuName.includes('760m')) gpuScore = 14;
        else if (gpuName.includes('vega')) gpuScore = 10;
        else gpuScore = 6;
    } else {
        gpuScore = Math.min(90, Math.max(10, (gpu.bottleneckGroup || 3) * 12 + ((gpu.tdp || 100) / 20)));
    }

    let cpuFactor = 0.85;
    if (cpu) {
        const cpuName = (cpu.name || '').toLowerCase();
        if (cpuName.includes('9800x3d') || cpuName.includes('7800x3d')) cpuFactor = 1.15;
        else if (cpuName.includes('14900k') || cpuName.includes('13900k') || cpuName.includes('9950x') || cpuName.includes('ultra 9')) cpuFactor = 1.10;
        else if (cpuName.includes('14700k') || cpuName.includes('13700k') || cpuName.includes('7900x') || cpuName.includes('9700x') || cpuName.includes('ultra 7')) cpuFactor = 1.05;
        else if (cpuName.includes('7600') || cpuName.includes('14600k') || cpuName.includes('13600k') || cpuName.includes('5700x3d') || cpuName.includes('ultra 5')) cpuFactor = 1.0;
        else if (cpuName.includes('5600') || cpuName.includes('13400') || cpuName.includes('12400') || cpuName.includes('14400')) cpuFactor = 0.90;
        else if (cpuName.includes('12100') || cpuName.includes('4600g')) cpuFactor = 0.78;
        else cpuFactor = Math.min(1.1, Math.max(0.65, 0.6 + (cpu.bottleneckGroup || 3) * 0.07));
    }

    const ramGB = parseInt(ramSize) || 16;
    let ramFactor = 1.0;
    if (ramGB < 16) ramFactor = 0.82;
    else if (ramGB >= 32 && ramType === 'DDR5') ramFactor = 1.05;

    let resMultiplier = 1.0;
    if (resolution === '1440p') resMultiplier = 0.68;
    else if (resolution === '4k') resMultiplier = 0.40;

    const isIGPU = gpuScore <= 14;

    const games = [
        {
            name: 'Fortnite (Competitivo)',
            category: 'eSports',
            fps: Math.round(Math.max(15, (gpuScore * 3.8 * Math.pow(cpuFactor, 1.2) * ramFactor) * (resolution === '1080p' ? 1.0 : resMultiplier * 1.15))),
            setting: resolution === '1080p' ? 'Performance Mode' : `${resolution} Dettagli Medi`
        },
        {
            name: 'Fortnite (Grafica Alta / DX12)',
            category: 'Grafica Dettagliata',
            fps: Math.round(Math.max(10, (gpuScore * 1.9 * cpuFactor * ramFactor) * resMultiplier)),
            setting: `${resolution} Dettagli Alti`
        },
        {
            name: 'Call of Duty: Warzone',
            category: 'Battle Royale',
            fps: Math.round(Math.max(12, (gpuScore * 2.2 * cpuFactor * ramFactor) * resMultiplier)),
            setting: `${resolution} Dettagli Competitivi / DLSS-FSR`
        },
        {
            name: 'GTA V / FiveM Roleplay',
            category: 'Open World',
            fps: Math.round(Math.max(15, (gpuScore * 2.6 * Math.pow(cpuFactor, 1.1) * ramFactor) * (resolution === '1080p' ? 1.0 : resMultiplier * 1.1))),
            setting: `${resolution} Dettagli Molto Alti`
        },
        {
            name: 'Cyberpunk 2077',
            category: 'Grafica Pesante',
            fps: Math.round(Math.max(8, (gpuScore * 1.55 * Math.pow(cpuFactor, 0.8) * ramFactor) * resMultiplier)),
            setting: `${resolution} Dettagli Alti (DLSS/FSR Auto)`
        },
        {
            name: 'Counter-Strike 2 / Valorant',
            category: 'eSports 144Hz+',
            fps: Math.round(Math.max(25, (gpuScore * 4.2 * Math.pow(cpuFactor, 1.4) * ramFactor) * (resolution === '1080p' ? 1.0 : resMultiplier * 1.2))),
            setting: `${resolution} Dettagli Nativi / Competitivo`
        }
    ];

    const videoEditingScore = Math.min(10, Math.max(1, ((cpuFactor * 5) + (gpuScore / 18) + (ramGB >= 32 ? 1.5 : (ramGB < 16 ? -1.5 : 0))).toFixed(1)));
    const render3dScore = Math.min(10, Math.max(1, (((gpuScore / 14) * 0.7) + (cpuFactor * 3.5)).toFixed(1)));
    const streamingScore = Math.min(10, Math.max(1, ((gpuScore >= 30 ? 4 : 2) + (cpuFactor * 4.5) + (ramGB >= 32 ? 1.5 : 0)).toFixed(1)));

    return {
        games,
        isIGPU,
        productivity: {
            videoEditing: parseFloat(videoEditingScore),
            render3d: parseFloat(render3dScore),
            streaming: parseFloat(streamingScore)
        }
    };
};

const PcConfigurator = () => {
    const navigate = useNavigate();

    // Data lists
    const [cpus, setCpus] = useState([]);
    const [gpus, setGpus] = useState([]);

    // Configuration selections
    const [selectedCpu, setSelectedCpu] = useState(null);
    const [selectedGpu, setSelectedGpu] = useState(null);
    const [selectedMobo, setSelectedMobo] = useState('');
    const [selectedRamSize, setSelectedRamSize] = useState('16');
    const [selectedRamType, setSelectedRamType] = useState('DDR4');
    const [selectedPsu, setSelectedPsu] = useState('650');
    const [selectedCooler, setSelectedCooler] = useState('');
    const [selectedStorage, setSelectedStorage] = useState('');
    const [selectedCase, setSelectedCase] = useState('');

    // Resolution selection for FPS panel
    const [fpsResolution, setFpsResolution] = useState('1080p');

    // Prices
    const [prices, setPrices] = useState({
        cpu: 0,
        gpu: 0,
        mobo: 0,
        ram: 0,
        psu: 0,
        cooler: 0,
        storage: 0,
        pcCase: 0
    });
    const [laborFee, setLaborFee] = useState(50);
    const [discount, setDiscount] = useState(0);
    const [taxPercent, setTaxPercent] = useState(0);
    const [isEditingTotal, setIsEditingTotal] = useState(false);
    const [tempTotalCost, setTempTotalCost] = useState('');
    const [pdfStyle, setPdfStyle] = useState('classic');
    const [pdfTemplate, setPdfTemplate] = useState({
        storeName: 'FIX OR TRASH',
        storeEmail: 'info@fixortrash.it',
        storePhone: '+39 0123 456789',
        storeAddress: 'Via Roma 123, Torino'
    });

    // Client Info
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [quoteNotes, setQuoteNotes] = useState('');

    const [customRows, setCustomRows] = useState([]);
    const addCustomRow = () => {
        setCustomRows(prev => [
            ...prev,
            { id: Date.now(), label: '', spec: '', price: 0 }
        ]);
    };
    const removeCustomRow = (id) => {
        setCustomRows(prev => prev.filter(row => row.id !== id));
    };
    const updateCustomRow = (id, field, value) => {
        setCustomRows(prev => prev.map(row => {
            if (row.id === id) {
                return { ...row, [field]: value };
            }
            return row;
        }));
    };

    const [cpuInput, setCpuInput] = useState('');
    const [gpuInput, setGpuInput] = useState('');
    const [showCpuSuggestions, setShowCpuSuggestions] = useState(false);
    const [showGpuSuggestions, setShowGpuSuggestions] = useState(false);
    const [showMoboSuggestions, setShowMoboSuggestions] = useState(false);

    useEffect(() => {
        setCpuInput(selectedCpu ? selectedCpu.name : '');
    }, [selectedCpu]);

    useEffect(() => {
        setGpuInput(selectedGpu ? selectedGpu.name : '');
    }, [selectedGpu]);

    const cpuSuggestions = useMemo(() => {
        if (!cpuInput) return cpus.slice(0, 30);
        const searchVal = cpuInput.toLowerCase();
        return cpus.filter(c => c && c.name && c.name.toLowerCase().includes(searchVal)).slice(0, 30);
    }, [cpus, cpuInput]);

    const gpuSuggestions = useMemo(() => {
        if (!gpuInput) return gpus.slice(0, 30);
        const searchVal = gpuInput.toLowerCase();
        return gpus.filter(g => g && g.name && g.name.toLowerCase().includes(searchVal)).slice(0, 30);
    }, [gpus, gpuInput]);

    // Motherboard suggestions filtered by CPU socket if selected
    const moboSuggestions = useMemo(() => {
        const cpuSocket = selectedCpu ? selectedCpu.socket : '';
        let list = [];
        if (cpuSocket && POPULAR_MOTHERBOARDS_BY_SOCKET[cpuSocket]) {
            list = POPULAR_MOTHERBOARDS_BY_SOCKET[cpuSocket];
        } else {
            list = Object.values(POPULAR_MOTHERBOARDS_BY_SOCKET).flat();
        }
        if (!selectedMobo) return list;
        const searchVal = selectedMobo.toLowerCase();
        return list.filter(m => m.toLowerCase().includes(searchVal));
    }, [selectedCpu, selectedMobo]);

    // Dynamic library update state
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateResult, setUpdateResult] = useState({ show: false, success: false, message: '' });

    // Custom Component Form
    const [showCustomModal, setShowCustomModal] = useState(false);
    const [customType, setCustomType] = useState('cpu');
    const [customName, setCustomName] = useState('');
    const [customTdp, setCustomTdp] = useState('65');
    const [customSocket, setCustomSocket] = useState('AM5');
    const [customRam, setCustomRam] = useState('DDR5');
    const [customTier, setCustomTier] = useState('Mid-Range');
    const [customGroup, setCustomGroup] = useState('4');

    // Wizard States
    const [wizardStep, setWizardStep] = useState('type'); // 'type' | 'software' | 'completed'
    const [usageType, setUsageType] = useState(null); // 'office' | 'gaming' | 'workstation' | 'custom'
    const [targetApplicationName, setTargetApplicationName] = useState('');
    const [targetTier, setTargetTier] = useState('rec'); // 'min' | 'rec' | 'ultra'

    // Free Text / Manual preventivo states
    const [editorMode, setEditorMode] = useState('db'); // 'db' | 'manual'
    const [manualCpuText, setManualCpuText] = useState('');
    const [manualGpuText, setManualGpuText] = useState('');
    const [manualMoboText, setManualMoboText] = useState('');
    const [manualRamText, setManualRamText] = useState('');
    const [manualPsuText, setManualPsuText] = useState('');

    useEffect(() => {
        if (editorMode === 'manual') {
            setManualCpuText(selectedCpu ? selectedCpu.name : '');
            setManualGpuText(selectedGpu ? selectedGpu.name : '');
            setManualMoboText(selectedMobo);
            setManualRamText(`${selectedRamSize}GB ${selectedRamType}`);
            setManualPsuText(selectedPsu ? `${selectedPsu}W` : '');
        }
    }, [editorMode]);

    // Load components
    const loadHardware = () => {
        setCpus(libraryService.getMergedCpus());
        setGpus(libraryService.getMergedGpus());
    };

    useEffect(() => {
        loadHardware();
        try {
            const savedSettings = dataManager.getSync('settings') || {};
            if (savedSettings.laborCost !== undefined) setLaborFee(savedSettings.laborCost);
            setTaxPercent(0);
            if (savedSettings.pdfStyle !== undefined) setPdfStyle(savedSettings.pdfStyle);
            if (savedSettings.pdfTemplate) {
                setPdfTemplate({
                    storeName: savedSettings.pdfTemplate.storeName || 'FIX OR TRASH',
                    storeEmail: savedSettings.pdfTemplate.storeEmail || 'info@fixortrash.it',
                    storePhone: savedSettings.pdfTemplate.storePhone || '+39 0123 456789',
                    storeAddress: savedSettings.pdfTemplate.storeAddress || 'Via Roma 123, Torino'
                });
            }
        } catch (e) {
            console.error("Error loading settings in PcConfigurator", e);
        }
    }, []);

    // Preset Applicator matching manual games/software or generic tiers
    const applyWizardPreset = (type, appName, tier) => {
        setUsageType(type);
        setTargetApplicationName(appName);
        setTargetTier(tier);

        let specs = null;
        let pPrices = null;

        if (type === 'gaming') {
            const matchedGame = gamePresets.find(g => 
                g.name.toLowerCase().includes(appName.toLowerCase()) || 
                appName.toLowerCase().includes(g.name.toLowerCase())
            );
            
            if (matchedGame) {
                specs = matchedGame[tier] || matchedGame.rec;
            } else {
                const fallbackGame = gamePresets.find(g => g.id === 'fortnite');
                specs = fallbackGame[tier] || fallbackGame.rec;
            }

            pPrices = {
                cpu: tier === 'min' ? 120 : (tier === 'rec' ? 190 : 380),
                gpu: tier === 'min' ? 210 : (tier === 'rec' ? 310 : 620),
                mobo: tier === 'min' ? 85 : (tier === 'rec' ? 150 : 210),
                ram: tier === 'min' ? 45 : (tier === 'rec' ? 95 : 115),
                psu: tier === 'min' ? 55 : (tier === 'rec' ? 75 : 110),
                cooler: tier === 'min' ? 0 : (tier === 'rec' ? 35 : 95),
                storage: tier === 'min' ? 60 : (tier === 'rec' ? 75 : 130),
                pcCase: tier === 'min' ? 45 : (tier === 'rec' ? 70 : 95)
            };
        } else if (type === 'office') {
            const presetId = tier === 'min' ? 'base' : (tier === 'ultra' ? 'ultra' : 'rec');
            const matchedOffice = officePresets.find(o => o.id === presetId);
            specs = matchedOffice.specs;
            pPrices = matchedOffice.prices;
        } else if (type === 'workstation') {
            const matchedWS = workstationPresets.find(w => w.id === tier) || workstationPresets[1];
            specs = matchedWS.specs;
            pPrices = matchedWS.prices;
        }

        if (specs && pPrices) {
            const matchedCpu = cpus.find(c => c.name.toLowerCase().includes(specs.cpu.toLowerCase())) || 
                               { name: specs.cpu, socket: specs.mobo.includes('AM5') || specs.mobo.includes('B650') || specs.mobo.includes('X870') ? 'AM5' : (specs.mobo.includes('AM4') || specs.mobo.includes('B550') ? 'AM4' : 'LGA1700'), ramType: specs.ramType, tdp: 65, bottleneckGroup: tier === 'min' ? 3 : (tier === 'rec' ? 5 : 7), tier: 'Preimpostato' };
            
            const matchedGpu = gpus.find(g => g.name.toLowerCase().includes(specs.gpu.toLowerCase())) || 
                               (specs.gpu.includes('Integrata') || specs.gpu.includes('iGPU') ? { name: specs.gpu, tdp: 15, bottleneckGroup: 1, tier: 'Integrata', recommendedPSU: specs.psu } :
                               { name: specs.gpu, tdp: specs.gpu.includes('4080') ? 320 : (specs.gpu.includes('4070') ? 220 : 120), bottleneckGroup: tier === 'min' ? 3 : (tier === 'rec' ? 5 : 7), tier: 'Preimpostato', recommendedPSU: specs.psu });

            setSelectedCpu(matchedCpu);
            setSelectedGpu(matchedGpu);
            setSelectedMobo(specs.mobo);
            setSelectedRamSize(specs.ram);
            setSelectedRamType(specs.ramType);
            setSelectedPsu(specs.psu.toString());
            setSelectedStorage(specs.storage);
            setSelectedCooler(specs.cooler || (tier === 'min' ? 'Dissipatore Stock' : (tier === 'rec' ? 'Dissipatore a Torre 120mm' : 'AIO 240mm Liquid')));
            setSelectedCase(specs.case || 'ATX Mid-Tower Glass');

            setPrices({
                cpu: pPrices.cpu,
                gpu: pPrices.gpu,
                mobo: pPrices.mobo,
                ram: pPrices.ram,
                psu: pPrices.psu,
                cooler: pPrices.cooler,
                storage: pPrices.storage,
                pcCase: pPrices.pcCase
            });
        }

        setWizardStep('completed');
    };

    const handleClearConfiguration = () => {
        setSelectedCpu(null);
        setSelectedGpu(null);
        setSelectedMobo('');
        setSelectedRamSize('16');
        setSelectedRamType('DDR5');
        setSelectedPsu('650');
        setSelectedCooler('');
        setSelectedStorage('');
        setSelectedCase('');
        setPrices({
            cpu: 0,
            gpu: 0,
            mobo: 0,
            ram: 0,
            psu: 0,
            cooler: 0,
            storage: 0,
            pcCase: 0
        });
    };

    // Library Update Handler
    const handleUpdateLibrary = async () => {
        setIsUpdating(true);
        const res = await libraryService.fetchAndUpdateLibrary();
        setIsUpdating(false);

        if (res.success) {
            setUpdateResult({
                show: true,
                success: true,
                message: `Libreria aggiornata! Scaricati ${res.stats.androidCount} Android, ${res.stats.iosCount} iOS, ${res.stats.cpuCount} CPU, ${res.stats.gpuCount} GPU.`
            });
            loadHardware();
        } else {
            setUpdateResult({
                show: true,
                success: false,
                message: `Errore durante l'aggiornamento: ${res.error}`
            });
        }
        setTimeout(() => setUpdateResult({ show: false, success: false, message: '' }), 6000);
    };

    // Suggestions matching pairing
    const handleSuggestPairing = () => {
        if (!selectedCpu && !selectedGpu) return;

        if (selectedCpu && !selectedGpu) {
            const matched = gpus.find(g => g.bottleneckGroup === selectedCpu.bottleneckGroup);
            if (matched) setSelectedGpu(matched);
        } else if (selectedGpu && !selectedCpu) {
            const matched = cpus.find(c => c.bottleneckGroup === selectedGpu.bottleneckGroup);
            if (matched) setSelectedCpu(matched);
        } else {
            const matched = gpus.find(g => g.bottleneckGroup === selectedCpu.bottleneckGroup);
            if (matched) setSelectedGpu(matched);
        }
    };

    // Custom Component Save
    const handleAddCustomComponent = async (e) => {
        e.preventDefault();
        if (!customName) return;

        const newComp = {
            name: customName,
            tdp: parseInt(customTdp) || 65,
            tier: customTier,
            bottleneckGroup: parseInt(customGroup) || 4
        };

        if (customType === 'cpu') {
            newComp.socket = customSocket;
            newComp.ramType = customRam;
            newComp.maxTDP = Math.round(newComp.tdp * 1.5);
            
            const savedCustom = dataManager.getSync('customCpus') || [];
            await dataManager.updateSlice('customCpus', [newComp, ...savedCustom]);
        } else {
            newComp.recommendedPSU = parseInt(customGroup) >= 6 ? 750 : (parseInt(customGroup) >= 4 ? 550 : 400);
            
            const savedCustom = dataManager.getSync('customGpus') || [];
            await dataManager.updateSlice('customGpus', [newComp, ...savedCustom]);
        }

        setShowCustomModal(false);
        setCustomName('');
        loadHardware();
    };

    // Calculations & Compatibilities
    const cpuTdp = selectedCpu ? selectedCpu.tdp : 65;
    const gpuTdp = selectedGpu ? selectedGpu.tdp : 120;
    const systemTdp = cpuTdp + gpuTdp + 150;
    const recommendedPsuWatts = Math.max(Math.ceil((systemTdp * 1.25) / 50) * 50, 450);

    const isPsuUnderpowered = editorMode === 'db' && selectedPsu ? parseInt(selectedPsu) < systemTdp : false;

    // Smart Socket & Motherboard compatibility
    const cpuSocket = selectedCpu ? (selectedCpu.socket || '').trim().toUpperCase() : '';
    const parsedMobo = useMemo(() => parseMotherboard(selectedMobo), [selectedMobo]);
    
    const moboCompatibility = useMemo(() => {
        if (!selectedCpu || !selectedMobo) return { isChecked: false, isCompatible: true, label: 'Seleziona CPU e Scheda Madre' };
        if (!parsedMobo.isValid) {
            return {
                isChecked: true,
                isCompatible: false,
                label: `Chipset non rilevato in "${selectedMobo}". Specifica il chipset (es. B650, B760, B550)`
            };
        }
        const moboSocket = (parsedMobo.socket || '').toUpperCase();
        if (cpuSocket === moboSocket) {
            return {
                isChecked: true,
                isCompatible: true,
                label: `Compatibile (Socket ${moboSocket} - Chipset ${parsedMobo.chipset})`
            };
        }
        return {
            isChecked: true,
            isCompatible: false,
            label: `Incompatibile: CPU è ${cpuSocket}, scheda madre è ${moboSocket} (${parsedMobo.chipset})`
        };
    }, [selectedCpu, selectedMobo, parsedMobo, cpuSocket]);

    const isMoboIncompatible = editorMode === 'db' && moboCompatibility.isChecked && !moboCompatibility.isCompatible;

    // RAM compatibility
    const cpuRamSupport = selectedCpu ? selectedCpu.ramType : '';
    const isRamIncompatible = editorMode === 'db' && selectedRamType && cpuRamSupport && !cpuRamSupport.includes(selectedRamType);

    // Live Real-Time FPS calculation
    const fpsData = useMemo(() => {
        return calculateRealFps(selectedCpu, selectedGpu, selectedRamSize, selectedRamType, fpsResolution);
    }, [selectedCpu, selectedGpu, selectedRamSize, selectedRamType, fpsResolution]);

    // Bottleneck Score computation
    let bottleneckInfo = { status: 'balanced', score: 0, text: 'Nessun componente selezionato.', color: 'text-gray-400' };
    if (selectedCpu && selectedGpu) {
        const cpuGroup = selectedCpu.bottleneckGroup;
        const gpuGroup = selectedGpu.bottleneckGroup;
        const diff = cpuGroup - gpuGroup;

        if (Math.abs(diff) <= 1) {
            bottleneckInfo = {
                status: 'balanced',
                score: 5,
                text: 'Configurazione Bilanciata! CPU e GPU sono perfettamente allineate per lavorare insieme al massimo rendimento.',
                color: 'text-green-400 bg-green-500/10 border-green-500/20'
            };
        } else if (diff > 1) {
            bottleneckInfo = {
                status: 'gpu_bottleneck',
                score: Math.min(diff * 15, 60),
                text: `Collo di Bottiglia GPU (${Math.min(diff * 15, 60)}%). La CPU è superiore alla scheda video. Ottimo per upgrade futuri o per compiti di calcolo/produttività intensivi.`,
                color: 'text-sky-400 bg-sky-500/10 border-sky-500/20'
            };
        } else {
            bottleneckInfo = {
                status: 'cpu_bottleneck',
                score: Math.min(Math.abs(diff) * 15, 80),
                text: `Collo di Bottiglia CPU (${Math.min(Math.abs(diff) * 15, 80)}%). La GPU è limitata da un processore meno performante. Per sfruttare tutti i frame massimi si consiglia una CPU di fascia superiore.`,
                color: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
            };
        }
    }

    // Pricing totals
    const customRowsSubtotal = customRows.reduce((acc, curr) => acc + (parseFloat(curr.price) || 0), 0);
    const partsSubtotal = Object.values(prices).reduce((acc, curr) => acc + (parseFloat(curr) || 0), 0) + customRowsSubtotal;
    const laborFeeNum = parseFloat(laborFee) || 0;
    const discountNum = parseFloat(discount) || 0;
    const subtotal = partsSubtotal + laborFeeNum;
    const totalCost = Math.max(0, subtotal - discountNum);
    const profitMargin = parseFloat((totalCost - partsSubtotal).toFixed(2)); // assembly+labor minus parts-only cost

    // PDF Quote Exporter
    const handleGeneratePdf = (action = 'download') => {
        let useText = 'Custom (Manuale)';
        if (editorMode === 'manual') {
            useText = 'Preventivo Libero (Manuale)';
        } else if (usageType === 'gaming') {
            useText = `Gaming (Gioco: ${targetApplicationName || 'Generico'} - Profilo: ${targetTier === 'min' ? 'Minimi' : (targetTier === 'rec' ? 'Consigliati' : 'Ultra')})`;
        } else if (usageType === 'office') {
            useText = `Ufficio (Uso: ${targetApplicationName || 'Generico'} - Profilo: ${targetTier === 'min' ? 'Base' : (targetTier === 'ultra' ? 'Avanzato' : 'Medio')})`;
        } else if (usageType === 'workstation') {
            useText = `Workstation (Software: ${targetApplicationName || 'Generico'} - Profilo: ${targetTier === 'min' ? 'Entry-Level' : (targetTier === 'rec' ? 'Media' : 'High-End')})`;
        }

        const components = [];
        const addRowIfCompiled = (type, spec, price) => {
            const cleanSpec = String(spec || '').trim();
            if (cleanSpec && cleanSpec !== '-' && cleanSpec !== 'N/A' && cleanSpec !== '0GB DDR4' && cleanSpec !== '0GB DDR5' && cleanSpec !== '0GB undefined' && cleanSpec !== 'W') {
                components.push({ type, model: cleanSpec, price });
            }
        };

        const cpuSpec = editorMode === 'db' ? (selectedCpu ? selectedCpu.name : '') : manualCpuText;
        addRowIfCompiled("Processore (CPU)", cpuSpec, prices.cpu);

        const gpuSpec = editorMode === 'db' ? (selectedGpu ? selectedGpu.name : '') : manualGpuText;
        addRowIfCompiled("Scheda Video (GPU)", gpuSpec, prices.gpu);

        const moboSpec = editorMode === 'db' ? selectedMobo : manualMoboText;
        addRowIfCompiled("Scheda Madre (Mobo)", moboSpec, prices.mobo);

        const ramSpec = editorMode === 'db' ? (selectedRamSize && selectedRamType ? `${selectedRamSize}GB ${selectedRamType}` : '') : manualRamText;
        addRowIfCompiled("Memoria RAM", ramSpec, prices.ram);

        const psuSpec = editorMode === 'db' ? (selectedPsu ? `${selectedPsu}W` : '') : manualPsuText;
        addRowIfCompiled("Alimentatore (PSU)", psuSpec, prices.psu);

        addRowIfCompiled("Dissipatore CPU", selectedCooler, prices.cooler);
        addRowIfCompiled("Archiviazione (SSD/HDD)", selectedStorage, prices.storage);
        addRowIfCompiled("Cabinet (Case)", selectedCase, prices.pcCase);

        customRows.forEach(row => {
            if (row.label && row.label.trim() && row.spec && row.spec.trim()) {
                components.push({ type: row.label.trim(), model: row.spec.trim(), price: parseFloat(row.price || 0) });
            }
        });

        if (parseFloat(laborFee) > 0) {
            components.push({ type: "Assemblaggio e Test", model: "Tariffa di Laboratorio installazione inclusa", price: parseFloat(laborFee) });
        }

        const doc = pdfLayoutEngine.generate('pc_config', {
            customer: {
                name: customerName,
                phone: customerPhone,
                email: customerEmail
            },
            config: {
                useCase: useText,
                profile: "",
                softwares: "",
                notes: quoteNotes
            },
            components,
            total: totalCost
        });

        if (action === 'view') {
            pdfLayoutEngine.openPdf(doc, `preventivo_pc_${(customerName || 'Cliente').replace(/\s+/g, '_')}.pdf`);
        } else {
            doc.save(`Preventivo_PC_${customerName.replace(/\s+/g, '_') || 'Cliente'}.pdf`);
        }
    };

    return (
        <div className="p-8 min-h-screen animate-fade-in pb-24 relative z-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="p-3 bg-theme-panel border border-theme-panelBorder rounded-theme-btn hover:bg-theme-panel brightness-110 text-theme-text transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-theme-text flex items-center gap-2">
                            <Cpu className="text-[var(--color-primary)]" size={24} />
                            Configuratore PC & Preventivatore Hardware
                        </h1>
                        <p className="text-gray-400 text-xs mt-0.5">Componi build con verifica socket/chipset automatica, prezzi Amazon in tempo reale e simulatore FPS.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    {wizardStep === 'completed' && (
                        <button
                            onClick={() => setShowCustomModal(true)}
                            className="flex items-center justify-center gap-2 p-3 bg-theme-panel border border-theme-panelBorder rounded-theme-btn hover:bg-theme-panel brightness-115 text-theme-text transition-all active:scale-95 text-sm font-semibold animate-fade-in"
                        >
                            <Plus size={16} />
                            Custom Componente
                        </button>
                    )}
                    <button
                        onClick={handleUpdateLibrary}
                        disabled={isUpdating}
                        className="flex items-center justify-center gap-2 p-3 bg-theme-panel border border-theme-panelBorder rounded-theme-btn hover:bg-theme-panel brightness-115 text-theme-text transition-all active:scale-95 disabled:opacity-50 text-sm font-semibold"
                    >
                        <RefreshCw size={16} className={isUpdating ? 'animate-spin' : ''} />
                        {isUpdating ? 'Aggiornamento...' : 'Aggiorna Database'}
                    </button>
                </div>
            </div>

            {/* Notification Result */}
            {updateResult.show && (
                <div className={`mb-6 p-4 rounded-theme-btn border flex items-center gap-3 animate-fade-in ${updateResult.success ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                    {updateResult.success ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                    <span className="text-sm font-medium">{updateResult.message}</span>
                </div>
            )}

            {/* Step Progress Bar */}
            {wizardStep !== 'completed' && (
                <div className="flex items-center justify-center mb-10 max-w-2xl mx-auto animate-fade-in">
                    <div className="flex items-center w-full">
                        <div className="relative flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 ${wizardStep === 'type' ? 'bg-theme-primary text-theme-primaryContent border-theme-primary' : 'bg-theme-panel text-theme-primary border-theme-primary/30'}`}>
                                1
                            </div>
                            <div className="absolute top-12 text-xs font-bold whitespace-nowrap text-theme-text">Destinazione d'Uso</div>
                        </div>
                        
                        <div className={`flex-1 h-0.5 mx-2 ${wizardStep !== 'type' ? 'bg-theme-primary' : 'bg-theme-panelBorder'}`}></div>
                        
                        <div className="relative flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 ${wizardStep === 'software' ? 'bg-theme-primary text-theme-primaryContent border-theme-primary' : 'bg-theme-panel text-gray-500 border-theme-panelBorder'}`}>
                                2
                            </div>
                            <div className="absolute top-12 text-xs font-bold whitespace-nowrap text-gray-400 font-bold">Dettagli & Profilo</div>
                        </div>
                        
                        <div className="flex-1 h-0.5 mx-2 bg-theme-panelBorder"></div>
                        
                        <div className="relative flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 bg-theme-panel text-gray-500 border-theme-panelBorder">
                                3
                            </div>
                            <div className="absolute top-12 text-xs font-bold whitespace-nowrap text-gray-400">Configuratore</div>
                        </div>
                    </div>
                </div>
            )}

            {/* WIZARD STEP 1: SELECT USAGE TYPE */}
            {wizardStep === 'type' && (
                <div className="max-w-5xl mx-auto space-y-8 animate-fade-in mt-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-black text-theme-text">Che tipo di computer vuoi configurare?</h2>
                        <p className="text-gray-400 text-sm mt-2">Scegli la destinazione d'uso per caricare i migliori componenti bilanciati 2025/2026</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Ufficio */}
                        <button
                            onClick={() => {
                                setUsageType('office');
                                setWizardStep('software');
                                setTargetApplicationName('');
                                setTargetTier('rec');
                            }}
                            className="glass-panel p-8 rounded-theme-panel border border-theme-panelBorder hover:border-theme-primary/45 text-left flex flex-col items-center justify-center text-center gap-4 transition-all hover:scale-105 active:scale-95 group relative overflow-hidden"
                        >
                            <div className="w-16 h-16 rounded-full bg-theme-panel border border-theme-panelBorder flex items-center justify-center text-theme-primary group-hover:bg-theme-primary/10 transition-colors">
                                <Monitor size={32} />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-lg text-theme-text group-hover:text-theme-primary transition-colors">Ufficio & Didattica</h3>
                                <p className="text-gray-400 text-xs mt-2 leading-relaxed">Con grafica integrata iGPU, consumi ridotti, perfetto per Word, Excel, navigazione e gestionali.</p>
                            </div>
                        </button>

                        {/* Gaming */}
                        <button
                            onClick={() => {
                                setUsageType('gaming');
                                setWizardStep('software');
                                setTargetApplicationName('Fortnite');
                                setTargetTier('rec');
                            }}
                            className="glass-panel p-8 rounded-theme-panel border border-theme-panelBorder hover:border-theme-primary/45 text-left flex flex-col items-center justify-center text-center gap-4 transition-all hover:scale-105 active:scale-95 group relative overflow-hidden"
                        >
                            <div className="w-16 h-16 rounded-full bg-theme-panel border border-theme-panelBorder flex items-center justify-center text-theme-primary group-hover:bg-theme-primary/10 transition-colors">
                                <Gamepad2 size={32} />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-lg text-theme-text group-hover:text-theme-primary transition-colors">Gaming</h3>
                                <p className="text-gray-400 text-xs mt-2 leading-relaxed">Ottimizzato per FPS elevati a 1080p, 1440p 2K o 4K, zero colli di bottiglia e latenza minima.</p>
                            </div>
                        </button>

                        {/* Workstation */}
                        <button
                            onClick={() => {
                                setUsageType('workstation');
                                setWizardStep('software');
                                setTargetApplicationName('');
                                setTargetTier('rec');
                            }}
                            className="glass-panel p-8 rounded-theme-panel border border-theme-panelBorder hover:border-theme-primary/45 text-left flex flex-col items-center justify-center text-center gap-4 transition-all hover:scale-105 active:scale-95 group relative overflow-hidden"
                        >
                            <div className="w-16 h-16 rounded-full bg-theme-panel border border-theme-panelBorder flex items-center justify-center text-theme-primary group-hover:bg-theme-primary/10 transition-colors">
                                <Briefcase size={32} />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-lg text-theme-text group-hover:text-theme-primary transition-colors">Workstation Studio</h3>
                                <p className="text-gray-400 text-xs mt-2 leading-relaxed">Per montaggio video 4K/8K, modellazione 3D, rendering Blender, AutoCAD, grafica e intelligenza artificiale.</p>
                            </div>
                        </button>

                        {/* Custom */}
                        <button
                            onClick={() => {
                                setUsageType('custom');
                                handleClearConfiguration();
                                setWizardStep('completed');
                            }}
                            className="glass-panel p-8 rounded-theme-panel border border-theme-panelBorder hover:border-theme-primary/45 text-left flex flex-col items-center justify-center text-center gap-4 transition-all hover:scale-105 active:scale-95 group relative overflow-hidden"
                        >
                            <div className="w-16 h-16 rounded-full bg-theme-panel border border-theme-panelBorder flex items-center justify-center text-theme-primary group-hover:bg-theme-primary/10 transition-colors">
                                <Sliders size={32} />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-lg text-theme-text group-hover:text-theme-primary transition-colors">Custom (Libero)</h3>
                                <p className="text-gray-400 text-xs mt-2 leading-relaxed">Componi da zero pezzo per pezzo, verifica compatibilità in tempo reale e cerca prezzi su Amazon.</p>
                            </div>
                        </button>
                    </div>
                </div>
            )}

            {/* WIZARD STEP 2: SELECT SOFTWARE & PERFORMANCE TIER */}
            {wizardStep === 'software' && (
                <div className="max-w-2xl mx-auto glass-panel p-8 rounded-theme-panel border border-theme-panelBorder animate-fade-in space-y-6 mt-6">
                    <div className="border-b border-white/5 pb-4">
                        <h2 className="text-2xl font-black text-theme-text flex items-center gap-2">
                            {usageType === 'gaming' && <Gamepad2 size={24} className="text-theme-primary" />}
                            {usageType === 'office' && <Monitor size={24} className="text-theme-primary" />}
                            {usageType === 'workstation' && <Briefcase size={24} className="text-theme-primary" />}
                            {usageType === 'gaming' ? 'Configurazione Gaming' : usageType === 'office' ? 'Configurazione Ufficio' : 'Configurazione Workstation'}
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">Scegli il gioco o applicazione principale e la fascia di prestazioni</p>
                    </div>

                    {/* Name input */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-400">
                            {usageType === 'gaming' ? 'Titolo Gioco Target:' : usageType === 'office' ? 'Utilizzo Principale:' : 'Software Principale:'}
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={targetApplicationName}
                                onChange={(e) => setTargetApplicationName(e.target.value)}
                                placeholder={usageType === 'gaming' ? 'es. Fortnite, GTA V, Warzone, Cyberpunk...' : usageType === 'office' ? 'es. Word / Excel, Fatturazione, Web...' : 'es. Premiere Pro, AutoCAD, Blender...'}
                                className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-4 pl-12 text-sm text-theme-text focus:outline-none focus:border-theme-primary/50 font-bold"
                            />
                            <Search className="absolute left-4 top-4 text-gray-500" size={18} />
                        </div>
                        
                        {/* Quick Suggestions */}
                        <div className="pt-2">
                            <span className="text-xs text-gray-500 font-bold block mb-1.5">Scelta rapida:</span>
                            <div className="flex flex-wrap gap-2">
                                {usageType === 'gaming' && ['Fortnite', 'GTA V / FiveM', 'Warzone', 'Cyberpunk 2077', 'CS2', 'Valorant', 'Minecraft'].map(game => (
                                    <button
                                        key={game}
                                        type="button"
                                        onClick={() => setTargetApplicationName(game)}
                                        className="px-3 py-1 bg-theme-panel border border-theme-panelBorder rounded text-xs font-semibold text-gray-300 hover:text-theme-primary hover:border-theme-primary/30 transition-all"
                                    >
                                        {game}
                                    </button>
                                ))}
                                {usageType === 'office' && ['Word / Excel', 'Gestionale / SQL', 'Navigazione Web & Didattica'].map(soft => (
                                    <button
                                        key={soft}
                                        type="button"
                                        onClick={() => setTargetApplicationName(soft)}
                                        className="px-3 py-1 bg-theme-panel border border-theme-panelBorder rounded text-xs font-semibold text-gray-300 hover:text-theme-primary hover:border-theme-primary/30 transition-all"
                                    >
                                        {soft}
                                    </button>
                                ))}
                                {usageType === 'workstation' && ['Adobe Premiere', 'AutoCAD / CAD 2D-3D', 'Blender 3D', 'Photoshop', 'Sviluppo & VM'].map(wsSoft => (
                                    <button
                                        key={wsSoft}
                                        type="button"
                                        onClick={() => setTargetApplicationName(wsSoft)}
                                        className="px-3 py-1 bg-theme-panel border border-theme-panelBorder rounded text-xs font-semibold text-gray-300 hover:text-theme-primary hover:border-theme-primary/30 transition-all"
                                    >
                                        {wsSoft}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Performance Tier Selector */}
                    <div className="space-y-2 pt-2">
                        <label className="text-sm font-semibold text-gray-400">Livello di prestazioni richiesto:</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Minimi / Base */}
                            <button
                                type="button"
                                onClick={() => setTargetTier('min')}
                                className={`p-4 bg-theme-panel/70 border rounded-theme-btn text-left flex flex-col justify-between transition-all hover:border-theme-primary/30 min-h-[120px] ${targetTier === 'min' ? 'border-theme-primary ring-1 ring-theme-primary bg-theme-primary/5' : 'border-theme-panelBorder'}`}
                            >
                                <span className="font-extrabold text-sm text-theme-text">
                                    {usageType === 'gaming' ? 'Budget 1080p' : usageType === 'office' ? 'Ufficio Base' : 'Entry Workstation'}
                                </span>
                                <span className="text-gray-400 text-[10px] mt-2 leading-relaxed">
                                    {usageType === 'gaming' ? '1080p fluido, ottimo rapporto prezzo/prestazioni.' : usageType === 'office' ? 'Navigazione web, fatture, Office, video YouTube.' : 'CAD 2D, fotoritocco, grafica leggera.'}
                                </span>
                            </button>

                            {/* Consigliati / Medio */}
                            <button
                                type="button"
                                onClick={() => setTargetTier('rec')}
                                className={`p-4 bg-theme-panel/70 border rounded-theme-btn text-left flex flex-col justify-between transition-all hover:border-theme-primary/30 min-h-[120px] ${targetTier === 'rec' ? 'border-theme-primary ring-1 ring-theme-primary bg-theme-primary/5' : 'border-theme-panelBorder'}`}
                            >
                                <span className="font-extrabold text-sm text-theme-text">
                                    {usageType === 'gaming' ? 'Consigliato (Sweet Spot)' : usageType === 'office' ? 'Ufficio Medio' : 'Workstation Media'}
                                </span>
                                <span className="text-gray-400 text-[10px] mt-2 leading-relaxed">
                                    {usageType === 'gaming' ? '1080p/1440p ad alti FPS, Ray-Tracing e DLSS 3.' : usageType === 'office' ? 'Multitasking, gestionali pesanti, archivi.' : 'Editing Video 4K, modellazione 3D, rendering.'}
                                </span>
                            </button>

                            {/* Ultra / Avanzato */}
                            <button
                                type="button"
                                onClick={() => setTargetTier('ultra')}
                                className={`p-4 bg-theme-panel/70 border rounded-theme-btn text-left flex flex-col justify-between transition-all hover:border-theme-primary/30 min-h-[120px] ${targetTier === 'ultra' ? 'border-theme-primary ring-1 ring-theme-primary bg-theme-primary/5' : 'border-theme-panelBorder'}`}
                            >
                                <span className="font-extrabold text-sm text-theme-text">
                                    {usageType === 'gaming' ? 'Ultra 1440p / 4K' : usageType === 'office' ? 'Avanzato DDR5' : 'High-End Studio AI'}
                                </span>
                                <span className="text-gray-400 text-[10px] mt-2 leading-relaxed">
                                    {usageType === 'gaming' ? '4K Ultra, FPS massimi per monitor 144Hz-240Hz.' : usageType === 'office' ? 'Massima velocità DDR5, multitasking estremo.' : 'Rendering pesante, AI, simulazioni complesse.'}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Wizard Navigation */}
                    <div className="flex gap-4 pt-4 border-t border-white/5">
                        <button
                            type="button"
                            onClick={() => {
                                setWizardStep('type');
                                setUsageType(null);
                            }}
                            className="flex-1 py-3.5 bg-theme-panel border border-theme-panelBorder rounded-theme-btn text-theme-text font-bold text-sm hover:bg-white/5 transition-all active:scale-95"
                        >
                            Indietro
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                applyWizardPreset(usageType, targetApplicationName || 'Generico', targetTier);
                            }}
                            className="flex-1 py-3.5 bg-theme-primary text-theme-primaryContent font-bold rounded-theme-btn text-sm hover:brightness-110 transition-all active:scale-95 shadow-lg shadow-[var(--color-primary)]/10"
                        >
                            Conferma e Genera Setup
                        </button>
                    </div>
                </div>
            )}

            {/* WIZARD STEP 3: EDITOR COMPLETED SCREEN */}
            {wizardStep === 'completed' && (
                <>
                    {/* Utilization summary bar */}
                    <div className="glass-panel p-5 rounded-theme-panel border border-theme-panelBorder mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in relative overflow-hidden">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-theme-primary/10 text-theme-primary rounded-theme-btn">
                                {usageType === 'gaming' && <Gamepad2 size={24} />}
                                {usageType === 'office' && <Monitor size={24} />}
                                {usageType === 'workstation' && <Briefcase size={24} />}
                                {usageType === 'custom' && <Sliders size={24} />}
                            </div>
                            <div>
                                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black block">Destinazione d'Uso Corrente</span>
                                <span className="text-lg font-black text-theme-text flex items-center gap-2">
                                    {usageType === 'gaming' && `Gaming: ${targetApplicationName} (${targetTier === 'min' ? 'Budget 1080p' : (targetTier === 'rec' ? 'Consigliato' : 'Ultra 1440p/4K')})`}
                                    {usageType === 'office' && `Ufficio: ${targetApplicationName} (${targetTier === 'min' ? 'Base' : (targetTier === 'ultra' ? 'Avanzato DDR5' : 'Medio')})`}
                                    {usageType === 'workstation' && `Workstation: ${targetApplicationName} (${targetTier === 'min' ? 'Entry-Level' : (targetTier === 'rec' ? 'Media' : 'High-End AI')})`}
                                    {usageType === 'custom' && 'Configurazione Custom / Manuale'}
                                </span>
                            </div>
                        </div>
                        
                        <button
                            onClick={() => {
                                setWizardStep('type');
                                setUsageType(null);
                                setCustomRows([]);
                            }}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold bg-theme-panel border border-theme-panelBorder hover:bg-white/5 rounded-theme-btn text-theme-text transition-all active:scale-95 shrink-0"
                        >
                            <RotateCcw size={14} />
                            Ricomincia Configurazione
                        </button>
                    </div>

                    {/* Main Configurator Split Screen */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* SELECTORS FORM COLUMN */}
                        <div className="lg:col-span-7 space-y-6">
                            <div className="glass-panel p-6 rounded-theme-panel border border-theme-panelBorder">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-white/5">
                                    <h3 className="text-lg font-bold text-theme-text flex items-center gap-2">
                                        <Layers size={18} className="text-theme-primary" />
                                        Componenti Hardware
                                    </h3>
                                    <div className="flex bg-theme-panel p-1 rounded-lg border border-theme-panelBorder shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => setEditorMode('db')}
                                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${editorMode === 'db' ? 'bg-theme-primary text-theme-primaryContent shadow' : 'text-gray-400 hover:text-theme-text'}`}
                                        >
                                            Database Assistito
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEditorMode('manual')}
                                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${editorMode === 'manual' ? 'bg-theme-primary text-theme-primaryContent shadow' : 'text-gray-400 hover:text-theme-text'}`}
                                        >
                                            Testo Libero
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    {/* CPU SELECTOR */}
                                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center relative z-30">
                                        <label className="sm:col-span-3 text-xs font-bold text-gray-300 flex items-center gap-1.5">
                                            <Cpu size={15} className="text-theme-primary" /> Processore (CPU)
                                        </label>
                                        <div className="sm:col-span-6">
                                            {editorMode === 'db' ? (
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={cpuInput}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setCpuInput(val);
                                                            if (!val) setSelectedCpu(null);
                                                        }}
                                                        onFocus={() => setShowCpuSuggestions(true)}
                                                        onBlur={() => setTimeout(() => setShowCpuSuggestions(false), 200)}
                                                        placeholder="Digita modello CPU (es. AMD Ryzen 5 7600)"
                                                        className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-2.5 text-xs text-theme-text focus:outline-none focus:border-theme-primary/50 font-bold"
                                                    />
                                                    {showCpuSuggestions && cpuSuggestions.length > 0 && (
                                                        <div className="absolute z-50 w-full bg-[#182030] border border-theme-panelBorder rounded-lg mt-1 max-h-60 overflow-y-auto shadow-2xl">
                                                            {cpuSuggestions.map((cpu, idx) => (
                                                                <button
                                                                    key={idx}
                                                                    type="button"
                                                                    onMouseDown={() => {
                                                                        setSelectedCpu(cpu);
                                                                        setCpuInput(cpu.name);
                                                                        if (cpu.socket === 'AM5' || cpu.socket === 'LGA1851') {
                                                                            setSelectedRamType('DDR5');
                                                                        } else if (cpu.socket === 'AM4' || cpu.socket === 'LGA1200') {
                                                                            setSelectedRamType('DDR4');
                                                                        }
                                                                    }}
                                                                    className="w-full text-left p-2.5 hover:bg-theme-primary hover:text-theme-primaryContent text-xs text-theme-text transition-colors border-b border-white/5 last:border-0 font-semibold"
                                                                >
                                                                    {cpu.name} <span className="text-[10px] opacity-75">({cpu.socket} • TDP {cpu.tdp}W)</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={manualCpuText}
                                                    onChange={(e) => setManualCpuText(e.target.value)}
                                                    placeholder="Digita modello CPU"
                                                    className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-2.5 text-xs text-theme-text focus:outline-none font-bold"
                                                />
                                            )}
                                        </div>
                                        <div className="sm:col-span-2">
                                            <input
                                                type="number"
                                                value={prices.cpu || ''}
                                                onChange={(e) => setPrices(prev => ({ ...prev, cpu: parseFloat(e.target.value) || 0 }))}
                                                placeholder="€ Prezzo"
                                                className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-2.5 text-xs text-theme-text text-right font-mono"
                                            />
                                        </div>
                                        <div className="sm:col-span-1 flex justify-center">
                                            <button
                                                type="button"
                                                onClick={() => openAmazonSearch(editorMode === 'db' ? cpuInput : manualCpuText)}
                                                className="p-2 rounded-lg bg-white/5 hover:bg-amber-500/20 text-gray-400 hover:text-amber-400 border border-white/10 transition-colors"
                                                title="Cerca prezzo su Amazon.it"
                                            >
                                                <ShoppingCart size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* GPU SELECTOR */}
                                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center relative z-20">
                                        <label className="sm:col-span-3 text-xs font-bold text-gray-300 flex items-center gap-1.5">
                                            <Zap size={15} className="text-theme-primary" /> Scheda Video (GPU)
                                        </label>
                                        <div className="sm:col-span-6">
                                            {editorMode === 'db' ? (
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={gpuInput}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setGpuInput(val);
                                                            if (!val) setSelectedGpu(null);
                                                        }}
                                                        onFocus={() => setShowGpuSuggestions(true)}
                                                        onBlur={() => setTimeout(() => setShowGpuSuggestions(false), 200)}
                                                        placeholder="Digita modello GPU (es. RTX 4060 o Grafica Integrata)"
                                                        className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-2.5 text-xs text-theme-text focus:outline-none focus:border-theme-primary/50 font-bold"
                                                    />
                                                    {showGpuSuggestions && gpuSuggestions.length > 0 && (
                                                        <div className="absolute z-50 w-full bg-[#182030] border border-theme-panelBorder rounded-lg mt-1 max-h-60 overflow-y-auto shadow-2xl">
                                                            {gpuSuggestions.map((gpu, idx) => (
                                                                <button
                                                                    key={idx}
                                                                    type="button"
                                                                    onMouseDown={() => {
                                                                        setSelectedGpu(gpu);
                                                                        setGpuInput(gpu.name);
                                                                    }}
                                                                    className="w-full text-left p-2.5 hover:bg-theme-primary hover:text-theme-primaryContent text-xs text-theme-text transition-colors border-b border-white/5 last:border-0 font-semibold"
                                                                >
                                                                    {gpu.name} <span className="text-[10px] opacity-75">(TDP {gpu.tdp}W)</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={manualGpuText}
                                                    onChange={(e) => setManualGpuText(e.target.value)}
                                                    placeholder="Digita modello GPU"
                                                    className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-2.5 text-xs text-theme-text focus:outline-none font-bold"
                                                />
                                            )}
                                        </div>
                                        <div className="sm:col-span-2">
                                            <input
                                                type="number"
                                                value={prices.gpu || ''}
                                                onChange={(e) => setPrices(prev => ({ ...prev, gpu: parseFloat(e.target.value) || 0 }))}
                                                placeholder="€ Prezzo"
                                                className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-2.5 text-xs text-theme-text text-right font-mono"
                                            />
                                        </div>
                                        <div className="sm:col-span-1 flex justify-center">
                                            <button
                                                type="button"
                                                onClick={() => openAmazonSearch(editorMode === 'db' ? gpuInput : manualGpuText)}
                                                className="p-2 rounded-lg bg-white/5 hover:bg-amber-500/20 text-gray-400 hover:text-amber-400 border border-white/10 transition-colors"
                                                title="Cerca prezzo su Amazon.it"
                                            >
                                                <ShoppingCart size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Suggest Pairing Button */}
                                    {editorMode === 'db' && (selectedCpu || selectedGpu) && !(selectedCpu && selectedGpu) && (
                                        <div className="flex justify-end pr-2">
                                            <button 
                                                onClick={handleSuggestPairing}
                                                className="text-xs text-theme-primary font-bold hover:underline flex items-center gap-1"
                                            >
                                                <Sparkles size={12} /> Suggerisci abbinamento bilanciato
                                            </button>
                                        </div>
                                    )}

                                    {/* MOTHERBOARD SELECTOR */}
                                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center relative z-10">
                                        <label className="sm:col-span-3 text-xs font-bold text-gray-300">
                                            Scheda Madre (Mobo)
                                        </label>
                                        <div className="sm:col-span-6">
                                            {editorMode === 'db' ? (
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={selectedMobo}
                                                        onChange={(e) => setSelectedMobo(e.target.value)}
                                                        onFocus={() => setShowMoboSuggestions(true)}
                                                        onBlur={() => setTimeout(() => setShowMoboSuggestions(false), 200)}
                                                        placeholder={selectedCpu ? `Modello scheda madre (Socket ${selectedCpu.socket || 'AM5/LGA1700'})` : "Digita modello o chipset (es. B650, B760, B550)"}
                                                        className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-2.5 text-xs text-theme-text focus:outline-none focus:border-theme-primary/50 font-bold"
                                                    />
                                                    {showMoboSuggestions && moboSuggestions.length > 0 && (
                                                        <div className="absolute z-50 w-full bg-[#182030] border border-theme-panelBorder rounded-lg mt-1 max-h-60 overflow-y-auto shadow-2xl">
                                                            {moboSuggestions.map((mobo, idx) => (
                                                                <button
                                                                    key={idx}
                                                                    type="button"
                                                                    onMouseDown={() => setSelectedMobo(mobo)}
                                                                    className="w-full text-left p-2.5 hover:bg-theme-primary hover:text-theme-primaryContent text-xs text-theme-text transition-colors border-b border-white/5 last:border-0 font-semibold"
                                                                >
                                                                    {mobo}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={manualMoboText}
                                                    onChange={(e) => setManualMoboText(e.target.value)}
                                                    placeholder="Digita modello Scheda Madre"
                                                    className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-2.5 text-xs text-theme-text focus:outline-none font-bold"
                                                />
                                            )}
                                        </div>
                                        <div className="sm:col-span-2">
                                            <input
                                                type="number"
                                                value={prices.mobo || ''}
                                                onChange={(e) => setPrices(prev => ({ ...prev, mobo: parseFloat(e.target.value) || 0 }))}
                                                placeholder="€ Prezzo"
                                                className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-2.5 text-xs text-theme-text text-right font-mono"
                                            />
                                        </div>
                                        <div className="sm:col-span-1 flex justify-center">
                                            <button
                                                type="button"
                                                onClick={() => openAmazonSearch(editorMode === 'db' ? selectedMobo : manualMoboText)}
                                                className="p-2 rounded-lg bg-white/5 hover:bg-amber-500/20 text-gray-400 hover:text-amber-400 border border-white/10 transition-colors"
                                                title="Cerca prezzo su Amazon.it"
                                            >
                                                <ShoppingCart size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* RAM SIZE & TYPE SELECTOR */}
                                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                                        <label className="sm:col-span-3 text-xs font-bold text-gray-300">
                                            Memoria RAM
                                        </label>
                                        {editorMode === 'db' ? (
                                            <>
                                                <div className="sm:col-span-3">
                                                    <select
                                                        value={selectedRamSize}
                                                        onChange={(e) => setSelectedRamSize(e.target.value)}
                                                        className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-2.5 text-xs text-theme-text focus:outline-none"
                                                    >
                                                        <option value="8">8 GB</option>
                                                        <option value="16">16 GB (Consigliato)</option>
                                                        <option value="32">32 GB (Gaming Pro / Workstation)</option>
                                                        <option value="64">64 GB (Studio 4K)</option>
                                                        <option value="128">128 GB (Extreme)</option>
                                                    </select>
                                                </div>
                                                <div className="sm:col-span-3">
                                                    <select
                                                        value={selectedRamType}
                                                        onChange={(e) => setSelectedRamType(e.target.value)}
                                                        className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-2.5 text-xs text-theme-text focus:outline-none"
                                                    >
                                                        <option value="DDR4">DDR4 RAM</option>
                                                        <option value="DDR5">DDR5 RAM</option>
                                                    </select>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="sm:col-span-6">
                                                <input
                                                    type="text"
                                                    value={manualRamText}
                                                    onChange={(e) => setManualRamText(e.target.value)}
                                                    placeholder="es. Corsair 32GB DDR5 6000MHz"
                                                    className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-2.5 text-xs text-theme-text focus:outline-none font-bold"
                                                />
                                            </div>
                                        )}
                                        <div className="sm:col-span-2">
                                            <input
                                                type="number"
                                                value={prices.ram || ''}
                                                onChange={(e) => setPrices(prev => ({ ...prev, ram: parseFloat(e.target.value) || 0 }))}
                                                placeholder="€ Prezzo"
                                                className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-2.5 text-xs text-theme-text text-right font-mono"
                                            />
                                        </div>
                                        <div className="sm:col-span-1 flex justify-center">
                                            <button
                                                type="button"
                                                onClick={() => openAmazonSearch(`RAM ${selectedRamSize}GB ${selectedRamType}`)}
                                                className="p-2 rounded-lg bg-white/5 hover:bg-amber-500/20 text-gray-400 hover:text-amber-400 border border-white/10 transition-colors"
                                                title="Cerca prezzo su Amazon.it"
                                            >
                                                <ShoppingCart size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* PSU SELECTOR */}
                                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                                        <label className="sm:col-span-3 text-xs font-bold text-gray-300">
                                            Alimentatore (PSU)
                                        </label>
                                        <div className="sm:col-span-6">
                                            {editorMode === 'db' ? (
                                                <select
                                                    value={selectedPsu}
                                                    onChange={(e) => setSelectedPsu(e.target.value)}
                                                    className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-2.5 text-xs text-theme-text focus:outline-none"
                                                >
                                                    <option value="450">450 W (Office / iGPU)</option>
                                                    <option value="500">500 W</option>
                                                    <option value="550">550 W (Budget Gaming)</option>
                                                    <option value="650">650 W (RTX 4060 / RX 7600)</option>
                                                    <option value="750">750 W Gold (RTX 4070 / 4070 Ti)</option>
                                                    <option value="850">850 W Gold (RTX 4080 Super)</option>
                                                    <option value="1000">1000 W Platinum (RTX 4090 / Extreme)</option>
                                                    <option value="1200">1200 W Extreme</option>
                                                </select>
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={manualPsuText}
                                                    onChange={(e) => setManualPsuText(e.target.value)}
                                                    placeholder="es. Corsair RM750e 750W Gold"
                                                    className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-2.5 text-xs text-theme-text focus:outline-none font-bold"
                                                />
                                            )}
                                        </div>
                                        <div className="sm:col-span-2">
                                            <input
                                                type="number"
                                                value={prices.psu || ''}
                                                onChange={(e) => setPrices(prev => ({ ...prev, psu: parseFloat(e.target.value) || 0 }))}
                                                placeholder="€ Prezzo"
                                                className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-2.5 text-xs text-theme-text text-right font-mono"
                                            />
                                        </div>
                                        <div className="sm:col-span-1 flex justify-center">
                                            <button
                                                type="button"
                                                onClick={() => openAmazonSearch(`Alimentatore PC ${selectedPsu}W`)}
                                                className="p-2 rounded-lg bg-white/5 hover:bg-amber-500/20 text-gray-400 hover:text-amber-400 border border-white/10 transition-colors"
                                                title="Cerca prezzo su Amazon.it"
                                            >
                                                <ShoppingCart size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* COOLER SELECTOR */}
                                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                                        <label className="sm:col-span-3 text-xs font-bold text-gray-300">
                                            Dissipatore CPU
                                        </label>
                                        <div className="sm:col-span-6">
                                            <input
                                                type="text"
                                                value={selectedCooler}
                                                onChange={(e) => setSelectedCooler(e.target.value)}
                                                placeholder="es. Thermalright Assassin 120 / AIO 240mm..."
                                                className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-2.5 text-xs text-theme-text focus:outline-none"
                                            />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <input
                                                type="number"
                                                value={prices.cooler || ''}
                                                onChange={(e) => setPrices(prev => ({ ...prev, cooler: parseFloat(e.target.value) || 0 }))}
                                                placeholder="€ Prezzo"
                                                className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-2.5 text-xs text-theme-text text-right font-mono"
                                            />
                                        </div>
                                        <div className="sm:col-span-1 flex justify-center">
                                            <button
                                                type="button"
                                                onClick={() => openAmazonSearch(selectedCooler || 'Dissipatore CPU')}
                                                className="p-2 rounded-lg bg-white/5 hover:bg-amber-500/20 text-gray-400 hover:text-amber-400 border border-white/10 transition-colors"
                                                title="Cerca prezzo su Amazon.it"
                                            >
                                                <ShoppingCart size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* STORAGE SELECTOR */}
                                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                                        <label className="sm:col-span-3 text-xs font-bold text-gray-300">
                                            Archiviazione (SSD)
                                        </label>
                                        <div className="sm:col-span-6">
                                            <input
                                                type="text"
                                                value={selectedStorage}
                                                onChange={(e) => setSelectedStorage(e.target.value)}
                                                placeholder="es. Samsung 990 PRO 1TB NVMe Gen4..."
                                                className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-2.5 text-xs text-theme-text focus:outline-none"
                                            />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <input
                                                type="number"
                                                value={prices.storage || ''}
                                                onChange={(e) => setPrices(prev => ({ ...prev, storage: parseFloat(e.target.value) || 0 }))}
                                                placeholder="€ Prezzo"
                                                className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-2.5 text-xs text-theme-text text-right font-mono"
                                            />
                                        </div>
                                        <div className="sm:col-span-1 flex justify-center">
                                            <button
                                                type="button"
                                                onClick={() => openAmazonSearch(selectedStorage || 'SSD NVMe M.2 1TB')}
                                                className="p-2 rounded-lg bg-white/5 hover:bg-amber-500/20 text-gray-400 hover:text-amber-400 border border-white/10 transition-colors"
                                                title="Cerca prezzo su Amazon.it"
                                            >
                                                <ShoppingCart size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* CABINET CASE SELECTOR */}
                                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                                        <label className="sm:col-span-3 text-xs font-bold text-gray-300">
                                            Cabinet (Case)
                                        </label>
                                        <div className="sm:col-span-6">
                                            <input
                                                type="text"
                                                value={selectedCase}
                                                onChange={(e) => setSelectedCase(e.target.value)}
                                                placeholder="es. NZXT H5 Flow / Corsair 4000D..."
                                                className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-2.5 text-xs text-theme-text focus:outline-none"
                                            />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <input
                                                type="number"
                                                value={prices.pcCase || ''}
                                                onChange={(e) => setPrices(prev => ({ ...prev, pcCase: parseFloat(e.target.value) || 0 }))}
                                                placeholder="€ Prezzo"
                                                className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-2.5 text-xs text-theme-text text-right font-mono"
                                            />
                                        </div>
                                        <div className="sm:col-span-1 flex justify-center">
                                            <button
                                                type="button"
                                                onClick={() => openAmazonSearch(selectedCase || 'Case PC ATX')}
                                                className="p-2 rounded-lg bg-white/5 hover:bg-amber-500/20 text-gray-400 hover:text-amber-400 border border-white/10 transition-colors"
                                                title="Cerca prezzo su Amazon.it"
                                            >
                                                <ShoppingCart size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* CUSTOM DYNAMIC ROWS */}
                                    <div className="border-t border-white/5 pt-4 mt-4 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-gray-400">Componenti o Accessori Extra</span>
                                            <button
                                                type="button"
                                                onClick={addCustomRow}
                                                className="px-3 py-1.5 bg-theme-primary text-theme-primaryContent text-xs font-bold rounded-theme-btn hover:brightness-110 transition-all flex items-center gap-1 active:scale-95 shadow cursor-pointer"
                                            >
                                                <Plus size={13} /> Aggiungi Riga
                                            </button>
                                        </div>

                                        {customRows.map((row) => (
                                            <div key={row.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center animate-fade-in bg-black/10 p-3 rounded-lg border border-white/5">
                                                <div className="sm:col-span-3">
                                                    <input
                                                        type="text"
                                                        value={row.label}
                                                        onChange={(e) => updateCustomRow(row.id, 'label', e.target.value)}
                                                        placeholder="es. Ventole RGB, Monitor, Wi-Fi..."
                                                        className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-2 text-xs text-theme-text font-bold"
                                                    />
                                                </div>
                                                <div className="sm:col-span-5">
                                                    <input
                                                        type="text"
                                                        value={row.spec}
                                                        onChange={(e) => updateCustomRow(row.id, 'spec', e.target.value)}
                                                        placeholder="Specifiche componente..."
                                                        className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-2 text-xs text-theme-text"
                                                    />
                                                </div>
                                                <div className="sm:col-span-2">
                                                    <input
                                                        type="number"
                                                        value={row.price || ''}
                                                        onChange={(e) => updateCustomRow(row.id, 'price', parseFloat(e.target.value) || 0)}
                                                        placeholder="€ Prezzo"
                                                        className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-2 text-xs text-theme-text text-right font-mono"
                                                    />
                                                </div>
                                                <div className="sm:col-span-2 flex items-center justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => openAmazonSearch(`${row.label} ${row.spec}`)}
                                                        className="p-2 rounded bg-white/5 hover:bg-amber-500/20 text-gray-400 hover:text-amber-400 border border-white/10 text-xs"
                                                        title="Cerca su Amazon"
                                                    >
                                                        <ShoppingCart size={13} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeCustomRow(row.id)}
                                                        className="p-2 rounded bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-all text-xs"
                                                        title="Rimuovi riga"
                                                    >
                                                        <X size={13} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* CUSTOMER QUOTATION DETAILS PANEL */}
                            <div className="glass-panel p-6 rounded-theme-panel border border-theme-panelBorder">
                                <h3 className="text-sm font-bold text-theme-text mb-4 uppercase tracking-wider text-gray-400">Intestazione Cliente Preventivo</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <input
                                        type="text"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        placeholder="Nome e Cognome Cliente"
                                        className="bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-2.5 text-xs text-theme-text focus:outline-none font-medium"
                                    />
                                    <input
                                        type="tel"
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                        placeholder="Telefono / Cellulare"
                                        className="bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-2.5 text-xs text-theme-text focus:outline-none"
                                    />
                                    <input
                                        type="email"
                                        value={customerEmail}
                                        onChange={(e) => setCustomerEmail(e.target.value)}
                                        placeholder="Indirizzo Email"
                                        className="bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-2.5 text-xs text-theme-text focus:outline-none"
                                    />
                                </div>
                                <textarea
                                    value={quoteNotes}
                                    onChange={(e) => setQuoteNotes(e.target.value)}
                                    placeholder="Note aggiuntive, tempi di consegna, garanzia personalizzata..."
                                    className="w-full mt-3 bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-2.5 text-xs text-theme-text h-16 resize-none focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* SIDEBAR SIDE INFO COLUMN */}
                        <div className="lg:col-span-5 space-y-6">
                            {/* COMPATIBILITY & METRICS PANEL */}
                            <div className="glass-panel p-6 rounded-theme-panel border border-theme-panelBorder space-y-5">
                                <h3 className="text-base font-bold text-theme-text flex items-center gap-2">
                                    <Activity size={18} className="text-theme-primary" />
                                    Stato Compatibilità & Bilanciamento
                                </h3>

                                {/* COMPATIBILITY CHECKS */}
                                <div className="space-y-2.5">
                                    {/* Socket & Chipset check */}
                                    <div className={`p-3 rounded-lg border text-xs font-semibold flex justify-between items-center transition-all ${
                                        isMoboIncompatible 
                                            ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                                            : (moboCompatibility.isChecked 
                                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                                                : 'bg-theme-panel border-theme-panelBorder text-gray-400')
                                    }`}>
                                        <span className="flex items-center gap-1.5">
                                            {isMoboIncompatible ? <AlertTriangle size={15} /> : <CheckCircle size={15} />}
                                            Socket & Chipset
                                        </span>
                                        <span className="font-bold text-right text-[11px] truncate max-w-[200px]" title={moboCompatibility.label}>
                                            {moboCompatibility.label}
                                        </span>
                                    </div>

                                    {/* RAM type check */}
                                    <div className={`p-3 rounded-lg border text-xs font-semibold flex justify-between items-center transition-all ${
                                        isRamIncompatible 
                                            ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                                            : (selectedCpu 
                                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                                                : 'bg-theme-panel border-theme-panelBorder text-gray-400')
                                    }`}>
                                        <span className="flex items-center gap-1.5">
                                            {isRamIncompatible ? <AlertTriangle size={15} /> : <CheckCircle size={15} />}
                                            Standard RAM
                                        </span>
                                        <span className="font-bold text-right text-[11px]">
                                            {isRamIncompatible ? `Mismatch: CPU richiede ${cpuRamSupport}` : (selectedCpu ? `Compatibile (${selectedRamType})` : 'In attesa')}
                                        </span>
                                    </div>
                                </div>

                                {/* POWER CONSUMPTION */}
                                <div className="p-3.5 rounded-lg bg-theme-panel border border-theme-panelBorder space-y-2 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Consumo CPU (TDP):</span>
                                        <span className="font-bold text-theme-text">{selectedCpu ? `${cpuTdp} W` : 'N/D'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Consumo GPU (TDP):</span>
                                        <span className="font-bold text-theme-text">{selectedGpu ? `${gpuTdp} W` : 'N/D'}</span>
                                    </div>
                                    <div className="flex justify-between border-t border-white/5 pt-2">
                                        <span className="text-gray-400">Stima Picco Sistema:</span>
                                        <span className="font-bold text-theme-text">{selectedCpu || selectedGpu ? `${systemTdp} W` : 'N/D'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Alimentatore Consigliato:</span>
                                        <span className="font-bold text-emerald-400">{selectedCpu || selectedGpu ? `≥ ${recommendedPsuWatts} W` : 'N/D'}</span>
                                    </div>
                                    
                                    {isPsuUnderpowered && (
                                        <div className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded text-[11px] font-bold mt-1">
                                            <AlertTriangle size={14} className="shrink-0" />
                                            Alimentatore scelto ({selectedPsu}W) inferiore al picco stimato ({systemTdp}W)!
                                        </div>
                                    )}
                                </div>

                                {/* BOTTLENECK EVALUATION */}
                                <div className={`p-3.5 rounded-lg border text-xs space-y-1.5 ${bottleneckInfo.color}`}>
                                    <div className="flex justify-between font-bold">
                                        <span>Bilanciamento CPU/GPU:</span>
                                        <span>
                                            {bottleneckInfo.status === 'balanced' ? 'Ottimale' : 
                                             (bottleneckInfo.status === 'cpu_bottleneck' ? 'Bottleneck CPU' : 'Bottleneck GPU')}
                                        </span>
                                    </div>
                                    <p className="text-[11px] leading-relaxed opacity-90">{bottleneckInfo.text}</p>
                                </div>
                            </div>

                            {/* LIVE FPS & PERFORMANCE SIMULATOR */}
                            <div className="glass-panel p-6 rounded-theme-panel border border-theme-panelBorder space-y-4">
                                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                                    <h3 className="text-base font-bold text-theme-text flex items-center gap-2">
                                        <Gauge size={18} className="text-theme-primary" />
                                        Simulatore FPS & Prestazioni
                                    </h3>
                                    {/* Resolution Selector */}
                                    <div className="flex bg-theme-panel p-1 rounded-lg border border-theme-panelBorder text-[11px] font-bold">
                                        {['1080p', '1440p', '4k'].map(res => (
                                            <button
                                                key={res}
                                                type="button"
                                                onClick={() => setFpsResolution(res)}
                                                className={`px-2 py-0.5 rounded transition-all ${fpsResolution === res ? 'bg-theme-primary text-theme-primaryContent shadow' : 'text-gray-400 hover:text-white'}`}
                                            >
                                                {res.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {fpsData ? (
                                    <div className="space-y-3 animate-fade-in">
                                        <div className="space-y-2.5">
                                            {fpsData.games.map((g, idx) => {
                                                const fpsVal = g.fps;
                                                const badgeColor = fpsVal >= 144 
                                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                                                    : (fpsVal >= 90 
                                                        ? 'bg-teal-500/20 text-teal-300 border-teal-500/30' 
                                                        : (fpsVal >= 60 
                                                            ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' 
                                                            : 'bg-red-500/20 text-red-300 border-red-500/30'));

                                                const barPct = Math.min(100, Math.round((fpsVal / 240) * 100));

                                                return (
                                                    <div key={idx} className="p-2.5 rounded-lg bg-black/20 border border-white/5 space-y-1">
                                                        <div className="flex justify-between items-center">
                                                            <div>
                                                                <span className="font-bold text-xs text-theme-text block">{g.name}</span>
                                                                <span className="text-[10px] text-gray-400">{g.setting}</span>
                                                            </div>
                                                            <span className={`px-2 py-0.5 rounded text-xs font-black font-mono border ${badgeColor}`}>
                                                                ~{fpsVal} FPS
                                                            </span>
                                                        </div>
                                                        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                                            <div 
                                                                className={`h-full transition-all duration-300 ${fpsVal >= 100 ? 'bg-emerald-400' : (fpsVal >= 60 ? 'bg-yellow-400' : 'bg-red-400')}`}
                                                                style={{ width: `${barPct}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Productivity Meters */}
                                        <div className="pt-2 border-t border-white/5 grid grid-cols-3 gap-2 text-center">
                                            <div className="p-2 rounded bg-black/20 border border-white/5">
                                                <span className="text-[10px] text-gray-400 block font-bold">Video 4K</span>
                                                <span className="text-sm font-extrabold text-theme-primary font-mono">{fpsData.productivity.videoEditing}/10</span>
                                            </div>
                                            <div className="p-2 rounded bg-black/20 border border-white/5">
                                                <span className="text-[10px] text-gray-400 block font-bold">3D / CAD</span>
                                                <span className="text-sm font-extrabold text-theme-primary font-mono">{fpsData.productivity.render3d}/10</span>
                                            </div>
                                            <div className="p-2 rounded bg-black/20 border border-white/5">
                                                <span className="text-[10px] text-gray-400 block font-bold">Streaming</span>
                                                <span className="text-sm font-extrabold text-theme-primary font-mono">{fpsData.productivity.streaming}/10</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-6 text-center text-xs text-gray-500">
                                        Seleziona CPU e Scheda Video per visualizzare la simulazione FPS in tempo reale.
                                    </div>
                                )}
                            </div>

                            {/* PRICING & PDF EXPORT PANEL */}
                            <div className="glass-panel p-6 rounded-theme-panel border border-theme-panelBorder space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-base font-bold text-theme-text">Riepilogo Costi & Offerta</h3>
                                    <button
                                        type="button"
                                        onClick={() => openAmazonSearch(`${cpuInput} ${gpuInput} ${selectedMobo}`)}
                                        className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                                        title="Apri ricerca comparativa su Amazon"
                                    >
                                        <ShoppingCart size={13} /> Verifica su Amazon
                                    </button>
                                </div>

                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between text-gray-400">
                                        <span>Costo Componenti:</span>
                                        <span className="font-bold text-theme-text font-mono">€ {partsSubtotal.toFixed(2)}</span>
                                    </div>

                                    {/* Labor fee */}
                                    <div className="grid grid-cols-12 gap-2 items-center text-gray-400">
                                        <span className="col-span-6">Assemblaggio & Test:</span>
                                        <div className="col-span-6 flex items-center bg-theme-panel border border-theme-panelBorder rounded px-2 w-28 ml-auto">
                                            <span className="text-xs mr-1">€</span>
                                            <input
                                                type="number"
                                                value={laborFee}
                                                onChange={(e) => setLaborFee(parseFloat(e.target.value) || 0)}
                                                className="w-full bg-transparent text-right py-1 focus:outline-none text-theme-text font-bold font-mono"
                                            />
                                        </div>
                                    </div>

                                    {/* Discount */}
                                    <div className="grid grid-cols-12 gap-2 items-center text-gray-400 border-b border-white/5 pb-2">
                                        <span className="col-span-6">Sconto Dedicato:</span>
                                        <div className="col-span-6 flex items-center bg-theme-panel border border-theme-panelBorder rounded px-2 w-28 ml-auto">
                                            <span className="text-xs mr-1 text-red-400">- €</span>
                                            <input
                                                type="number"
                                                min="0"
                                                value={discount}
                                                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                                className="w-full bg-transparent text-right py-1 focus:outline-none text-red-400 font-bold font-mono"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    {/* Guadagno Netto badge */}
                                    {profitMargin !== 0 && (
                                        <div className={`flex justify-between items-center pt-1 ${profitMargin > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            <span>Guadagno Netto:</span>
                                            <span className="font-bold font-mono">{profitMargin > 0 ? '+' : ''}€ {profitMargin.toFixed(2)}</span>
                                        </div>
                                    )}

                                    {/* Total Pricing */}
                                    <div className="flex justify-between items-center text-xl font-black pt-2 border-t border-white/5 text-theme-primary">
                                        <span>Totale Cliente:</span>
                                        <span className="font-mono text-2xl">€ {totalCost.toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                                    <button
                                        type="button"
                                        onClick={() => handleGeneratePdf('view')}
                                        disabled={editorMode === 'db' && (isMoboIncompatible || isRamIncompatible)}
                                        className="flex-1 bg-theme-primary text-theme-primaryContent font-bold py-3 rounded-theme-btn flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-[var(--color-primary)]/20 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                                    >
                                        <FileText size={16} />
                                        Anteprima PDF Preventivo
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleGeneratePdf('download')}
                                        disabled={editorMode === 'db' && (isMoboIncompatible || isRamIncompatible)}
                                        className="py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white font-bold rounded-theme-btn flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 text-xs"
                                        title="Salva file PDF"
                                    >
                                        <Download size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* CUSTOM COMPONENT MODAL */}
            {showCustomModal && (
                <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <div className="glass-panel p-8 rounded-theme-panel border border-theme-panelBorder max-w-md w-full shadow-2xl space-y-6">
                        <div className="flex justify-between items-center border-b border-white/5 pb-4">
                            <h3 className="text-lg font-bold text-theme-text flex items-center gap-2">
                                <Plus size={18} className="text-theme-primary" /> Aggiungi Componente Custom
                            </h3>
                            <button 
                                onClick={() => setShowCustomModal(false)}
                                className="text-gray-400 hover:text-white text-xl font-bold"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleAddCustomComponent} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400">Tipo Componente</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setCustomType('cpu')}
                                        className={`py-2 rounded font-bold text-xs transition-colors ${customType === 'cpu' ? 'bg-theme-primary text-theme-primaryContent' : 'bg-theme-panel text-gray-400'}`}
                                    >
                                        Processore (CPU)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCustomType('gpu')}
                                        className={`py-2 rounded font-bold text-xs transition-colors ${customType === 'gpu' ? 'bg-theme-primary text-theme-primaryContent' : 'bg-theme-panel text-gray-400'}`}
                                    >
                                        Scheda Video (GPU)
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs text-gray-400">Nome Modello</label>
                                <input
                                    type="text"
                                    value={customName}
                                    onChange={(e) => setCustomName(e.target.value)}
                                    placeholder={customType === 'cpu' ? "es. AMD Ryzen 7 9800X3D" : "es. NVIDIA RTX 5070"}
                                    required
                                    className="w-full bg-theme-panel border border-theme-panelBorder rounded p-2.5 text-xs text-theme-text font-bold"
                                />
                            </div>

                            {customType === 'cpu' && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-400">Socket</label>
                                        <select 
                                            value={customSocket}
                                            onChange={(e) => setCustomSocket(e.target.value)}
                                            className="w-full bg-theme-panel border border-theme-panelBorder rounded p-2.5 text-xs text-theme-text"
                                        >
                                            <option value="AM5">AM5 (Ryzen 7000/9000)</option>
                                            <option value="AM4">AM4 (Ryzen 1000-5000)</option>
                                            <option value="LGA1851">LGA1851 (Core Ultra)</option>
                                            <option value="LGA1700">LGA1700 (Intel 12-14th)</option>
                                            <option value="LGA1200">LGA1200 (Intel 10-11th)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-400">Supporto RAM</label>
                                        <select 
                                            value={customRam}
                                            onChange={(e) => setCustomRam(e.target.value)}
                                            className="w-full bg-theme-panel border border-theme-panelBorder rounded p-2.5 text-xs text-theme-text"
                                        >
                                            <option value="DDR5">DDR5</option>
                                            <option value="DDR4">DDR4</option>
                                            <option value="DDR5/DDR4">DDR5 / DDR4</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-400">Consumo TDP (Watt)</label>
                                    <input
                                        type="number"
                                        value={customTdp}
                                        onChange={(e) => setCustomTdp(e.target.value)}
                                        className="w-full bg-theme-panel border border-theme-panelBorder rounded p-2.5 text-xs text-theme-text"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-400">Gruppo Potenza (1-7)</label>
                                    <select 
                                        value={customGroup}
                                        onChange={(e) => setCustomGroup(e.target.value)}
                                        className="w-full bg-theme-panel border border-theme-panelBorder rounded p-2.5 text-xs text-theme-text"
                                    >
                                        <option value="1">1 (Integrata)</option>
                                        <option value="3">3 (Budget)</option>
                                        <option value="4">4 (Mid-Range)</option>
                                        <option value="5">5 (Upper Mid)</option>
                                        <option value="6">6 (High-End)</option>
                                        <option value="7">7 (Ultra Enthusiast)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                                <button
                                    type="button"
                                    onClick={() => setShowCustomModal(false)}
                                    className="px-4 py-2 rounded text-xs text-gray-400 hover:text-white"
                                >
                                    Annulla
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded text-xs font-bold bg-theme-primary text-theme-primaryContent hover:brightness-110 shadow"
                                >
                                    Salva nel Database
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PcConfigurator;
