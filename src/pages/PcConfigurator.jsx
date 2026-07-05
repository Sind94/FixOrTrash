import React, { useState, useEffect, useRef } from 'react';
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
    X
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { libraryService } from '../services/libraryService';
import { dataManager } from '../services/dataManager';
import logoReport from '../assets/logo_denis.jpg';
import { pdfLayoutEngine } from '../services/pdfLayoutEngine';

const gamePresets = [
    {
        id: 'fortnite',
        name: 'Fortnite',
        min: {
            cpu: 'Intel Core i3-12100F',
            gpu: 'NVIDIA GeForce GTX 1050 Ti',
            ram: '8',
            ramType: 'DDR4',
            mobo: 'H610',
            psu: 450,
            storage: 'SSD 500GB'
        },
        rec: {
            cpu: 'AMD Ryzen 5 5600X',
            gpu: 'NVIDIA GeForce RTX 3060',
            ram: '16',
            ramType: 'DDR4',
            mobo: 'B550',
            psu: 550,
            storage: 'SSD 1TB'
        },
        ultra: {
            cpu: 'AMD Ryzen 7 7800X3D',
            gpu: 'NVIDIA GeForce RTX 4070 Ti Super',
            ram: '32',
            ramType: 'DDR5',
            mobo: 'B650',
            psu: 750,
            storage: 'SSD 2TB NVMe'
        }
    },
    {
        id: 'cyberpunk',
        name: 'Cyberpunk 2077',
        min: {
            cpu: 'Intel Core i5-10400F',
            gpu: 'NVIDIA GeForce GTX 1660 Super',
            ram: '16',
            ramType: 'DDR4',
            mobo: 'B460',
            psu: 500,
            storage: 'SSD 500GB'
        },
        rec: {
            cpu: 'AMD Ryzen 5 7600X',
            gpu: 'NVIDIA GeForce RTX 4060',
            ram: '16',
            ramType: 'DDR5',
            mobo: 'B650',
            psu: 600,
            storage: 'SSD 1TB'
        },
        ultra: {
            cpu: 'Intel Core i9-14900K',
            gpu: 'NVIDIA GeForce RTX 4090',
            ram: '32',
            ramType: 'DDR5',
            mobo: 'Z790',
            psu: 850,
            storage: 'SSD 2TB NVMe'
        }
    },
    {
        id: 'gtav',
        name: 'GTA V / GTA Online',
        min: {
            cpu: 'Intel Core i5-7400',
            gpu: 'AMD Radeon RX 580',
            ram: '8',
            ramType: 'DDR4',
            mobo: 'B250',
            psu: 450,
            storage: 'SSD 250GB'
        },
        rec: {
            cpu: 'AMD Ryzen 5 3600',
            gpu: 'NVIDIA GeForce GTX 1660 Super',
            ram: '16',
            ramType: 'DDR4',
            mobo: 'B450',
            psu: 500,
            storage: 'SSD 500GB'
        },
        ultra: {
            cpu: 'Intel Core i5-13400F',
            gpu: 'NVIDIA GeForce RTX 4060',
            ram: '32',
            ramType: 'DDR5',
            mobo: 'B760',
            psu: 600,
            storage: 'SSD 1TB NVMe'
        }
    },
    {
        id: 'cod_warzone',
        name: 'Call of Duty: Warzone',
        min: {
            cpu: 'Intel Core i3-12100F',
            gpu: 'NVIDIA GeForce GTX 1660 Super',
            ram: '12',
            ramType: 'DDR4',
            mobo: 'H610',
            psu: 500,
            storage: 'SSD 500GB'
        },
        rec: {
            cpu: 'AMD Ryzen 5 5600X',
            gpu: 'AMD Radeon RX 6700 XT',
            ram: '16',
            ramType: 'DDR4',
            mobo: 'B550',
            psu: 650,
            storage: 'SSD 1TB'
        },
        ultra: {
            cpu: 'AMD Ryzen 7 7800X3D',
            gpu: 'NVIDIA GeForce RTX 4070 Ti Super',
            ram: '32',
            ramType: 'DDR5',
            mobo: 'B650',
            psu: 750,
            storage: 'SSD 2TB NVMe'
        }
    },
    {
        id: 'valorant',
        name: 'Valorant',
        min: {
            cpu: 'Intel Core i3-12100F',
            gpu: 'NVIDIA GeForce GTX 1050 Ti',
            ram: '8',
            ramType: 'DDR4',
            mobo: 'H610',
            psu: 450,
            storage: 'SSD 500GB'
        },
        rec: {
            cpu: 'AMD Ryzen 5 5600X',
            gpu: 'NVIDIA GeForce GTX 1660 Super',
            ram: '16',
            ramType: 'DDR4',
            mobo: 'B550',
            psu: 500,
            storage: 'SSD 500GB'
        },
        ultra: {
            cpu: 'AMD Ryzen 7 7800X3D',
            gpu: 'NVIDIA GeForce RTX 4060',
            ram: '32',
            ramType: 'DDR5',
            mobo: 'B650',
            psu: 600,
            storage: 'SSD 1TB NVMe'
        }
    },
    {
        id: 'league_of_legends',
        name: 'League of Legends',
        min: {
            cpu: 'Intel Core i3-12100F',
            gpu: 'Grafica Integrata Intel/AMD',
            ram: '8',
            ramType: 'DDR4',
            mobo: 'H610',
            psu: 400,
            storage: 'SSD 250GB'
        },
        rec: {
            cpu: 'AMD Ryzen 5 5600X',
            gpu: 'NVIDIA GeForce GTX 1050 Ti',
            ram: '16',
            ramType: 'DDR4',
            mobo: 'B550',
            psu: 450,
            storage: 'SSD 500GB'
        },
        ultra: {
            cpu: 'AMD Ryzen 5 7600X',
            gpu: 'NVIDIA GeForce RTX 3060',
            ram: '16',
            ramType: 'DDR5',
            mobo: 'B650',
            psu: 550,
            storage: 'SSD 1TB NVMe'
        }
    },
    {
        id: 'minecraft',
        name: 'Minecraft',
        min: {
            cpu: 'Intel Core i3-12100F',
            gpu: 'Grafica Integrata Intel/AMD',
            ram: '8',
            ramType: 'DDR4',
            mobo: 'H610',
            psu: 400,
            storage: 'SSD 250GB'
        },
        rec: {
            cpu: 'AMD Ryzen 5 5600X',
            gpu: 'NVIDIA GeForce GTX 1660 Super',
            ram: '16',
            ramType: 'DDR4',
            mobo: 'B550',
            psu: 500,
            storage: 'SSD 500GB'
        },
        ultra: {
            cpu: 'AMD Ryzen 7 7800X3D',
            gpu: 'NVIDIA GeForce RTX 4070 Ti Super',
            ram: '32',
            ramType: 'DDR5',
            mobo: 'B650',
            psu: 750,
            storage: 'SSD 1TB NVMe'
        }
    },
    {
        id: 'hogwarts_legacy',
        name: 'Hogwarts Legacy',
        min: {
            cpu: 'Intel Core i5-10400F',
            gpu: 'NVIDIA GeForce GTX 1660 Super',
            ram: '16',
            ramType: 'DDR4',
            mobo: 'B460',
            psu: 500,
            storage: 'SSD 500GB'
        },
        rec: {
            cpu: 'AMD Ryzen 5 7600X',
            gpu: 'NVIDIA GeForce RTX 4060',
            ram: '16',
            ramType: 'DDR5',
            mobo: 'B650',
            psu: 600,
            storage: 'SSD 1TB NVMe'
        },
        ultra: {
            cpu: 'Intel Core i9-14900K',
            gpu: 'NVIDIA GeForce RTX 4080 Super',
            ram: '32',
            ramType: 'DDR5',
            mobo: 'Z790',
            psu: 850,
            storage: 'SSD 2TB NVMe'
        }
    },
    {
        id: 'rdr2',
        name: 'Red Dead Redemption 2',
        min: {
            cpu: 'Intel Core i3-12100F',
            gpu: 'NVIDIA GeForce GTX 1050 Ti',
            ram: '8',
            ramType: 'DDR4',
            mobo: 'H610',
            psu: 450,
            storage: 'SSD 500GB'
        },
        rec: {
            cpu: 'AMD Ryzen 5 5600X',
            gpu: 'NVIDIA GeForce RTX 3060',
            ram: '16',
            ramType: 'DDR4',
            mobo: 'B550',
            psu: 550,
            storage: 'SSD 1TB'
        },
        ultra: {
            cpu: 'AMD Ryzen 7 7800X3D',
            gpu: 'NVIDIA GeForce RTX 4070 Ti Super',
            ram: '32',
            ramType: 'DDR5',
            mobo: 'B650',
            psu: 750,
            storage: 'SSD 2TB NVMe'
        }
    },
    {
        id: 'cs2',
        name: 'Counter-Strike 2',
        min: {
            cpu: 'Intel Core i3-12100F',
            gpu: 'NVIDIA GeForce GTX 1050 Ti',
            ram: '8',
            ramType: 'DDR4',
            mobo: 'H610',
            psu: 450,
            storage: 'SSD 500GB'
        },
        rec: {
            cpu: 'AMD Ryzen 5 5600X',
            gpu: 'NVIDIA GeForce RTX 3060',
            ram: '16',
            ramType: 'DDR4',
            mobo: 'B550',
            psu: 550,
            storage: 'SSD 1TB'
        },
        ultra: {
            cpu: 'AMD Ryzen 7 7800X3D',
            gpu: 'NVIDIA GeForce RTX 4070 Ti Super',
            ram: '32',
            ramType: 'DDR5',
            mobo: 'B650',
            psu: 750,
            storage: 'SSD 2TB NVMe'
        }
    }
];

const officePresets = [
    {
        id: 'base',
        name: 'Ufficio Base (Web/Word)',
        specs: {
            cpu: 'Intel Core i3-12100F',
            gpu: 'Grafica Integrata Intel/AMD',
            ram: '8',
            ramType: 'DDR4',
            mobo: 'H610',
            psu: 400,
            storage: 'SSD 500GB'
        },
        prices: {
            cpu: 75,
            gpu: 0,
            mobo: 65,
            ram: 35,
            psu: 40,
            cooler: 0,
            storage: 35,
            pcCase: 35
        }
    },
    {
        id: 'rec',
        name: 'Ufficio Medio (Gestionali/Excel)',
        specs: {
            cpu: 'AMD Ryzen 5 5600X',
            gpu: 'NVIDIA GeForce GTX 1050 Ti',
            ram: '16',
            ramType: 'DDR4',
            mobo: 'B550',
            psu: 450,
            storage: 'SSD 500GB'
        },
        prices: {
            cpu: 115,
            gpu: 95,
            mobo: 80,
            ram: 55,
            psu: 50,
            cooler: 0,
            storage: 35,
            pcCase: 45
        }
    },
    {
        id: 'ultra',
        name: 'Ufficio Avanzato (Multitasking)',
        specs: {
            cpu: 'AMD Ryzen 5 7600X',
            gpu: 'NVIDIA GeForce GTX 1660 Super',
            ram: '32',
            ramType: 'DDR5',
            mobo: 'B650',
            psu: 550,
            storage: 'SSD 1TB NVMe'
        },
        prices: {
            cpu: 185,
            gpu: 155,
            mobo: 135,
            ram: 105,
            psu: 60,
            cooler: 30,
            storage: 65,
            pcCase: 55
        }
    }
];

const workstationPresets = [
    {
        id: 'min',
        name: 'Workstation Entry-Level (Grafica 2D/CAD)',
        specs: {
            cpu: 'AMD Ryzen 7 7800X3D',
            gpu: 'NVIDIA GeForce RTX 4060',
            ram: '32',
            ramType: 'DDR5',
            mobo: 'B650',
            psu: 600,
            storage: 'SSD 1TB NVMe'
        },
        prices: {
            cpu: 340,
            gpu: 320,
            mobo: 140,
            ram: 110,
            psu: 75,
            cooler: 35,
            storage: 65,
            pcCase: 65
        }
    },
    {
        id: 'rec',
        name: 'Workstation Media (Editing/3D)',
        specs: {
            cpu: 'Intel Core i7-13700K',
            gpu: 'NVIDIA GeForce RTX 4070',
            ram: '32',
            ramType: 'DDR5',
            mobo: 'Z790',
            psu: 750,
            storage: 'SSD 2TB NVMe'
        },
        prices: {
            cpu: 320,
            gpu: 550,
            mobo: 180,
            ram: 110,
            psu: 95,
            cooler: 45,
            storage: 110,
            pcCase: 75
        }
    },
    {
        id: 'ultra',
        name: 'Workstation High-End (Calcolo/VM)',
        specs: {
            cpu: 'Intel Core i9-14900K',
            gpu: 'NVIDIA GeForce RTX 3060',
            ram: '64',
            ramType: 'DDR5',
            mobo: 'Z790',
            psu: 750,
            storage: 'SSD 2TB NVMe'
        },
        prices: {
            cpu: 480,
            gpu: 280,
            mobo: 190,
            ram: 200,
            psu: 95,
            cooler: 85,
            storage: 110,
            pcCase: 80
        }
    }
];

const socketMoboMap = {
    'AM5': ['A620', 'B650', 'X670', 'X870'],
    'AM4': ['A320', 'B450', 'B550', 'X570'],
    'LGA1851': ['Z890', 'B860'],
    'LGA1700': ['H610', 'B660', 'B760', 'Z690', 'Z790'],
    'LGA1200': ['H410', 'B460', 'H510', 'B560', 'Z490', 'Z590'],
    'LGA1151v2': ['H310', 'B360', 'Z370', 'Z390'],
    'LGA1151': ['H110', 'B150', 'B250', 'Z170', 'Z270']
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
    const [taxPercent, setTaxPercent] = useState(0); // Force 0% default IVA under Regime Forfettario
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

    useEffect(() => {
        setCpuInput(selectedCpu ? selectedCpu.name : '');
    }, [selectedCpu]);

    useEffect(() => {
        setGpuInput(selectedGpu ? selectedGpu.name : '');
    }, [selectedGpu]);

    const cpuSuggestions = React.useMemo(() => {
        if (!cpuInput) return cpus.slice(0, 30);
        const searchVal = cpuInput.toLowerCase();
        return cpus.filter(c => c && c.name && c.name.toLowerCase().includes(searchVal)).slice(0, 30);
    }, [cpus, cpuInput]);

    const gpuSuggestions = React.useMemo(() => {
        if (!gpuInput) return gpus.slice(0, 30);
        const searchVal = gpuInput.toLowerCase();
        return gpus.filter(g => g && g.name && g.name.toLowerCase().includes(searchVal)).slice(0, 30);
    }, [gpus, gpuInput]);

    // Dynamic library update state
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateResult, setUpdateResult] = useState({ show: false, success: false, message: '' });

    // Custom Component Form
    const [showCustomModal, setShowCustomModal] = useState(false);
    const [customType, setCustomType] = useState('cpu'); // 'cpu' or 'gpu'
    const [customName, setCustomName] = useState('');
    const [customTdp, setCustomTdp] = useState('65');
    const [customSocket, setCustomSocket] = useState('AM4');
    const [customRam, setCustomRam] = useState('DDR4');
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
            setTaxPercent(0); // Force 0% under Regime Forfettario
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
                specs = matchedGame[tier];
            } else {
                const fallbackGame = gamePresets.find(g => g.id === 'fortnite');
                specs = fallbackGame[tier];
            }

            pPrices = {
                cpu: tier === 'min' ? 90 : (tier === 'rec' ? 140 : 380),
                gpu: tier === 'min' ? 130 : (tier === 'rec' ? 320 : 850),
                mobo: tier === 'min' ? 60 : (tier === 'rec' ? 110 : 220),
                ram: tier === 'min' ? 35 : (tier === 'rec' ? 60 : 120),
                psu: tier === 'min' ? 45 : (tier === 'rec' ? 65 : 110),
                cooler: tier === 'min' ? 0 : (tier === 'rec' ? 30 : 90),
                storage: tier === 'min' ? 35 : (tier === 'rec' ? 65 : 120),
                pcCase: tier === 'min' ? 40 : (tier === 'rec' ? 60 : 100)
            };
        } else if (type === 'office') {
            const presetId = tier === 'min' ? 'base' : (tier === 'ultra' ? 'ultra' : 'rec');
            const matchedOffice = officePresets.find(o => o.id === presetId);
            specs = matchedOffice.specs;
            pPrices = matchedOffice.prices;
        } else if (type === 'workstation') {
            const matchedWS = workstationPresets.find(w => w.id === tier);
            specs = matchedWS.specs;
            pPrices = matchedWS.prices;
        }

        if (specs && pPrices) {
            const matchedCpu = cpus.find(c => c.name.toLowerCase().includes(specs.cpu.toLowerCase())) || 
                               { name: specs.cpu, socket: specs.mobo.includes('AM5') ? 'AM5' : (specs.mobo.includes('B650') ? 'AM5' : 'LGA1700'), ramType: specs.ramType, tdp: specs.cpu.includes('i9') ? 125 : (specs.cpu.includes('i7') ? 125 : 65), bottleneckGroup: tier === 'min' ? 2 : (tier === 'rec' ? 4 : 7), tier: 'Preimpostato' };
            
            const matchedGpu = gpus.find(g => g.name.toLowerCase().includes(specs.gpu.toLowerCase())) || 
                               (specs.gpu.includes('Integrata') ? { name: specs.gpu, tdp: 10, bottleneckGroup: 1, tier: 'Preimpostato', recommendedPSU: specs.psu } :
                               { name: specs.gpu, tdp: specs.gpu.includes('4090') ? 450 : (specs.gpu.includes('4080') ? 320 : (specs.gpu.includes('4070') ? 200 : 150)), bottleneckGroup: tier === 'min' ? 2 : (tier === 'rec' ? 4 : 7), tier: 'Preimpostato', recommendedPSU: specs.psu });

            setSelectedCpu(matchedCpu);
            setSelectedGpu(matchedGpu);
            
            const chipset = specs.mobo.split(' ')[0];
            setSelectedMobo(chipset);
            setSelectedRamSize(specs.ram);
            setSelectedRamType(specs.ramType);
            setSelectedPsu(specs.psu.toString());
            setSelectedStorage(specs.storage);
            setSelectedCooler(specs.cooler || (tier === 'min' ? 'Dissipatore Stock' : (tier === 'rec' ? 'Dissipatore Aria Premium' : 'AIO 240mm Liquid')));
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
        setSelectedRamType('DDR4');
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
            // Find GPU in same bottleneckGroup
            const matched = gpus.find(g => g.bottleneckGroup === selectedCpu.bottleneckGroup);
            if (matched) setSelectedGpu(matched);
        } else if (selectedGpu && !selectedCpu) {
            // Find CPU in same bottleneckGroup
            const matched = cpus.find(c => c.bottleneckGroup === selectedGpu.bottleneckGroup);
            if (matched) setSelectedCpu(matched);
        } else {
            // Unify to CPU tier
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
    const systemTdp = cpuTdp + gpuTdp + 150; // Safety margin for other parts
    const recommendedPsuWatts = Math.max(Math.ceil((systemTdp * 1.25) / 50) * 50, 450);

    const isPsuUnderpowered = editorMode === 'db' && selectedPsu ? parseInt(selectedPsu) < systemTdp : false;

    // Socket compatibility
    const cpuSocket = selectedCpu ? selectedCpu.socket : '';
    const validMotherboards = cpuSocket ? (socketMoboMap[cpuSocket] || []) : [];
    const isMoboIncompatible = editorMode === 'db' && selectedMobo && cpuSocket && !validMotherboards.includes(selectedMobo);

    // RAM compatibility
    const cpuRamSupport = selectedCpu ? selectedCpu.ramType : '';
    const isRamIncompatible = editorMode === 'db' && selectedRamType && cpuRamSupport && !cpuRamSupport.includes(selectedRamType);

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
                text: 'Configurazione Bilanciata! CPU e GPU sono ottimali per lavorare insieme, minimizzando qualsiasi cono di bottiglia.',
                color: 'text-green-400 bg-green-500/10 border-green-500/20'
            };
        } else if (diff > 1) {
            // CPU is much stronger than GPU -> GPU Bottleneck
            bottleneckInfo = {
                status: 'gpu_bottleneck',
                score: Math.min(diff * 15, 60),
                text: `Collo di Bottiglia GPU (${Math.min(diff * 15, 60)}%). La CPU è molto più potente della GPU. Nei giochi la scheda video lavorerà al 100%, limitando i frame massimi generati. Ottimo per upgrade futuri o workstation.`,
                color: 'text-blue-400 bg-blue-500/10 border-blue-500/20'
            };
        } else {
            // GPU is much stronger than CPU -> CPU Bottleneck
            bottleneckInfo = {
                status: 'cpu_bottleneck',
                score: Math.min(Math.abs(diff) * 15, 80),
                text: `Collo di Bottiglia CPU grave (${Math.min(Math.abs(diff) * 15, 80)}%). La GPU è bloccata da un processore troppo lento. Rischio di micro-scatti (stuttering) e framerate instabile. Si consiglia vivamente una CPU superiore.`,
                color: 'text-red-400 bg-red-500/10 border-red-500/20'
            };
        }
    }

    // Pricing totals
    const customRowsSubtotal = customRows.reduce((acc, curr) => acc + (parseFloat(curr.price) || 0), 0);
    const partsSubtotal = Object.values(prices).reduce((acc, curr) => acc + (parseFloat(curr) || 0), 0) + customRowsSubtotal;
    const subtotal = partsSubtotal + (parseFloat(laborFee) || 0);
    const vatAmount = 0; // Force 0% under Regime Forfettario
    const totalCost = Math.max(0, subtotal - (parseFloat(discount) || 0));

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

        const moboSpec = editorMode === 'db' ? (selectedMobo ? `${selectedMobo} Chipset (Socket ${cpuSocket})` : '') : manualMoboText;
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
                            Configuratore & Bilanciamento PC
                        </h1>
                        <p className="text-gray-400 text-xs mt-0.5">Componi preventivi verificando in tempo reale socket, TDP, colli di bottiglia e requisiti.</p>
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

            {/* Step Progress Bar (hidden when completed) */}
            {wizardStep !== 'completed' && (
                <div className="flex items-center justify-center mb-10 max-w-2xl mx-auto animate-fade-in">
                    <div className="flex items-center w-full">
                        {/* Step 1 */}
                        <div className="relative flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 ${wizardStep === 'type' ? 'bg-theme-primary text-theme-primaryContent border-theme-primary' : 'bg-theme-panel text-theme-primary border-theme-primary/30'}`}>
                                1
                            </div>
                            <div className="absolute top-12 text-xs font-bold whitespace-nowrap text-theme-text">Destinazione d'Uso</div>
                        </div>
                        
                        {/* Connector Line 1 */}
                        <div className={`flex-1 h-0.5 mx-2 ${wizardStep !== 'type' ? 'bg-theme-primary' : 'bg-theme-panelBorder'}`}></div>
                        
                        {/* Step 2 */}
                        <div className="relative flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 ${wizardStep === 'software' ? 'bg-theme-primary text-theme-primaryContent border-theme-primary' : 'bg-theme-panel text-gray-500 border-theme-panelBorder'}`}>
                                2
                            </div>
                            <div className="absolute top-12 text-xs font-bold whitespace-nowrap text-gray-400 font-bold">Dettagli Utilizzo</div>
                        </div>
                        
                        {/* Connector Line 2 */}
                        <div className="flex-1 h-0.5 mx-2 bg-theme-panelBorder"></div>
                        
                        {/* Step 3 */}
                        <div className="relative flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 bg-theme-panel text-gray-500 border-theme-panelBorder">
                                3
                            </div>
                            <div className="absolute top-12 text-xs font-bold whitespace-nowrap text-gray-400">Ottimizzazione</div>
                        </div>
                    </div>
                </div>
            )}

            {/* WIZARD STEP 1: SELECT USAGE TYPE */}
            {wizardStep === 'type' && (
                <div className="max-w-5xl mx-auto space-y-8 animate-fade-in mt-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-black text-theme-text">Che tipo di computer vuoi configurare?</h2>
                        <p className="text-gray-400 text-sm mt-2">Scegli la destinazione d'uso principale per avviare la procedura guidata</p>
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
                                <h3 className="font-extrabold text-lg text-theme-text group-hover:text-theme-primary transition-colors">Ufficio</h3>
                                <p className="text-gray-400 text-xs mt-2 leading-relaxed">Ideale per Word, Excel, navigazione web, contabilità e software gestionali.</p>
                            </div>
                        </button>

                        {/* Gaming */}
                        <button
                            onClick={() => {
                                setUsageType('gaming');
                                setWizardStep('software');
                                setTargetApplicationName('');
                                setTargetTier('rec');
                            }}
                            className="glass-panel p-8 rounded-theme-panel border border-theme-panelBorder hover:border-theme-primary/45 text-left flex flex-col items-center justify-center text-center gap-4 transition-all hover:scale-105 active:scale-95 group relative overflow-hidden"
                        >
                            <div className="w-16 h-16 rounded-full bg-theme-panel border border-theme-panelBorder flex items-center justify-center text-theme-primary group-hover:bg-theme-primary/10 transition-colors">
                                <Gamepad2 size={32} />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-lg text-theme-text group-hover:text-theme-primary transition-colors">Gaming</h3>
                                <p className="text-gray-400 text-xs mt-2 leading-relaxed">Ottimizzato per frame rate elevati, risoluzione e stabilità nei videogiochi.</p>
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
                                <h3 className="font-extrabold text-lg text-theme-text group-hover:text-theme-primary transition-colors">Workstation</h3>
                                <p className="text-gray-400 text-xs mt-2 leading-relaxed">Per carichi pesanti come modellazione 3D, editing video, CAD e sviluppo.</p>
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
                                <p className="text-gray-400 text-xs mt-2 leading-relaxed">Componi liberamente inserendo i componenti a mano ed esaminando i colli di bottiglia.</p>
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
                        <p className="text-gray-400 text-sm mt-1">Definisci i requisiti di utilizzo e il livello di prestazioni</p>
                    </div>

                    {/* Name input */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-400">
                            {usageType === 'gaming' ? 'Nome del Gioco (scritto a mano):' : usageType === 'office' ? 'Utilizzo / Software Principale (scritto a mano):' : 'Software Professionale (scritto a mano):'}
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={targetApplicationName}
                                onChange={(e) => setTargetApplicationName(e.target.value)}
                                placeholder={usageType === 'gaming' ? 'es. Minecraft, Flight Simulator, GTA VI...' : usageType === 'office' ? 'es. Pacchetto Office, Contabilità, Web Browsing...' : 'es. AutoCAD, Premiere Pro, SolidWorks...'}
                                className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-4 pl-12 text-sm text-theme-text focus:outline-none focus:border-theme-primary/50 font-medium font-bold"
                            />
                            <Search className="absolute left-4 top-4 text-gray-500" size={18} />
                        </div>
                        
                        {/* Quick Suggestions list */}
                        <div className="pt-2">
                            <span className="text-xs text-gray-500 font-bold block mb-1.5">Suggeriti frequenti (clicca per inserire):</span>
                            <div className="flex flex-wrap gap-2">
                                {usageType === 'gaming' && ['Fortnite', 'Minecraft', 'Valorant', 'GTA V', 'Cyberpunk 2077', 'CS2', 'Hogwarts Legacy', 'RDR2'].map(game => (
                                    <button
                                        key={game}
                                        type="button"
                                        onClick={() => setTargetApplicationName(game)}
                                        className="px-3 py-1 bg-theme-panel border border-theme-panelBorder rounded text-xs font-semibold text-gray-400 hover:text-theme-primary hover:border-theme-primary/30 transition-all"
                                    >
                                        {game}
                                    </button>
                                ))}
                                {usageType === 'office' && ['Word / Excel', 'Navigazione Web', 'Gestionale SAP / SQL', 'Fatturazione'].map(soft => (
                                    <button
                                        key={soft}
                                        type="button"
                                        onClick={() => setTargetApplicationName(soft)}
                                        className="px-3 py-1 bg-theme-panel border border-theme-panelBorder rounded text-xs font-semibold text-gray-400 hover:text-theme-primary hover:border-theme-primary/30 transition-all"
                                    >
                                        {soft}
                                    </button>
                                ))}
                                {usageType === 'workstation' && ['AutoCAD', 'Adobe Premiere', 'Blender 3D', 'Docker / VS Code', 'Photoshop'].map(wsSoft => (
                                    <button
                                        key={wsSoft}
                                        type="button"
                                        onClick={() => setTargetApplicationName(wsSoft)}
                                        className="px-3 py-1 bg-theme-panel border border-theme-panelBorder rounded text-xs font-semibold text-gray-400 hover:text-theme-primary hover:border-theme-primary/30 transition-all"
                                    >
                                        {wsSoft}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Performance Tier Selector */}
                    <div className="space-y-2 pt-2">
                        <label className="text-sm font-semibold text-gray-400">Seleziona il livello di prestazioni richiesto:</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Minimi / Base */}
                            <button
                                type="button"
                                onClick={() => setTargetTier('min')}
                                className={`p-4 bg-theme-panel/70 border rounded-theme-btn text-left flex flex-col justify-between transition-all hover:border-theme-primary/30 min-h-[120px] ${targetTier === 'min' ? 'border-theme-primary ring-1 ring-theme-primary bg-theme-primary/5' : 'border-theme-panelBorder'}`}
                            >
                                <span className="font-extrabold text-sm text-theme-text">
                                    {usageType === 'gaming' ? 'Requisiti Minimi' : usageType === 'office' ? 'Ufficio Base' : 'Workstation Entry'}
                                </span>
                                <span className="text-gray-400 text-[10px] mt-2 leading-relaxed">
                                    {usageType === 'gaming' ? 'Fascia Budget, dettagli medi/bassi, ideale per risparmio.' : usageType === 'office' ? 'Navigazione base, pacchetto Office standard, didattica.' : 'Grafica 2D, CAD leggero, fotoritocco non intensivo.'}
                                </span>
                            </button>

                            {/* Consigliati / Medio */}
                            <button
                                type="button"
                                onClick={() => setTargetTier('rec')}
                                className={`p-4 bg-theme-panel/70 border rounded-theme-btn text-left flex flex-col justify-between transition-all hover:border-theme-primary/30 min-h-[120px] ${targetTier === 'rec' ? 'border-theme-primary ring-1 ring-theme-primary bg-theme-primary/5' : 'border-theme-panelBorder'}`}
                            >
                                <span className="font-extrabold text-sm text-theme-text">
                                    {usageType === 'gaming' ? 'Consigliati' : usageType === 'office' ? 'Ufficio Medio' : 'Workstation Media'}
                                </span>
                                <span className="text-gray-400 text-[10px] mt-2 leading-relaxed">
                                    {usageType === 'gaming' ? 'Fascia bilanciata, gameplay fluido a 1080p/1440p.' : usageType === 'office' ? 'Multitasking, gestionali SQL, database locali leggeri.' : 'Editing Video 1080p/4K, rendering 3D medio, modellazione.'}
                                </span>
                            </button>

                            {/* Ultra / Avanzato */}
                            <button
                                type="button"
                                onClick={() => setTargetTier('ultra')}
                                className={`p-4 bg-theme-panel/70 border rounded-theme-btn text-left flex flex-col justify-between transition-all hover:border-theme-primary/30 min-h-[120px] ${targetTier === 'ultra' ? 'border-theme-primary ring-1 ring-theme-primary bg-theme-primary/5' : 'border-theme-panelBorder'}`}
                            >
                                <span className="font-extrabold text-sm text-theme-text">
                                    {usageType === 'gaming' ? 'Dettagli Ultra (4K)' : usageType === 'office' ? 'Ufficio Avanzato' : 'Workstation High-End'}
                                </span>
                                <span className="text-gray-400 text-[10px] mt-2 leading-relaxed">
                                    {usageType === 'gaming' ? 'Fascia estrema, massime performance, 4K e Ray-Tracing.' : usageType === 'office' ? 'Multitasking pesante, fogli Excel enormi, svariati applicativi.' : 'Rendering 3D pesanti, sviluppo VM massive, intelligenza artificiale.'}
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
                                    {usageType === 'gaming' && `Gaming: ${targetApplicationName} (${targetTier === 'min' ? 'Requisiti Minimi' : (targetTier === 'rec' ? 'Consigliati' : 'Dettaglio Ultra (4K)')})`}
                                    {usageType === 'office' && `Ufficio: ${targetApplicationName} (${targetTier === 'min' ? 'Ufficio Base' : (targetTier === 'ultra' ? 'Ufficio Avanzato' : 'Ufficio Medio')})`}
                                    {usageType === 'workstation' && `Workstation: ${targetApplicationName} (${targetTier === 'min' ? 'Entry-Level' : (targetTier === 'rec' ? 'Media' : 'High-End')})`}
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
                            <h3 className="text-lg font-bold text-theme-text">Componenti della Configurazione</h3>
                            <div className="flex bg-theme-panel p-1 rounded-lg border border-theme-panelBorder shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setEditorMode('db')}
                                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${editorMode === 'db' ? 'bg-theme-primary text-theme-primaryContent shadow' : 'text-gray-400 hover:text-theme-text'}`}
                                >
                                    Database
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditorMode('manual')}
                                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${editorMode === 'manual' ? 'bg-theme-primary text-theme-primaryContent shadow' : 'text-gray-400 hover:text-theme-text'}`}
                                >
                                    Preventivo Libero
                                </button>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            {/* CPU SELECTOR */}
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center relative z-30">
                                <label className="sm:col-span-3 text-sm font-semibold text-gray-400 flex items-center gap-1.5">
                                    <Cpu size={16} className="text-theme-primary" /> Processore (CPU)
                                </label>
                                <div className="sm:col-span-7">
                                    {editorMode === 'db' ? (
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={cpuInput}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setCpuInput(val);
                                                    if (!val) {
                                                        setSelectedCpu(null);
                                                    }
                                                }}
                                                onFocus={() => setShowCpuSuggestions(true)}
                                                onBlur={() => setTimeout(() => setShowCpuSuggestions(false), 200)}
                                                placeholder="Digita modello CPU (es. AMD Ryzen 5 7600X)"
                                                className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-sm text-theme-text focus:outline-none focus:border-theme-primary/50 font-bold"
                                            />
                                            {showCpuSuggestions && cpuSuggestions.length > 0 && (
                                                <div className="absolute z-50 w-full bg-[#182030] border border-theme-panelBorder rounded-lg mt-1 max-h-60 overflow-y-auto shadow-2xl" style={{ backgroundColor: '#182030', opacity: 1, backdropFilter: 'none', WebkitBackdropFilter: 'none' }}>
                                                    {cpuSuggestions.map((cpu, idx) => (
                                                        <button
                                                            key={idx}
                                                            type="button"
                                                            onMouseDown={() => {
                                                                setSelectedCpu(cpu);
                                                                setCpuInput(cpu.name);
                                                            }}
                                                            className="w-full text-left p-3 hover:bg-theme-primary hover:text-theme-primaryContent text-sm text-theme-text transition-colors border-b border-white/5 last:border-0 font-semibold"
                                                            style={{ backdropFilter: 'none', WebkitBackdropFilter: 'none', boxShadow: 'none' }}
                                                        >
                                                            {cpu.name} ({cpu.socket} - TDP {cpu.tdp}W)
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
                                            placeholder="Digita modello CPU (es. Intel Core i7-14700K)"
                                            className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-sm text-theme-text focus:outline-none focus:border-theme-primary/50 font-bold"
                                        />
                                    )}
                                </div>
                                <div className="sm:col-span-2">
                                    <input
                                        type="number"
                                        value={prices.cpu || ''}
                                        onChange={(e) => setPrices(prev => ({ ...prev, cpu: parseFloat(e.target.value) || 0 }))}
                                        placeholder="€ Prezzo"
                                        className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-sm text-theme-text text-right"
                                    />
                                </div>
                            </div>

                            {/* GPU SELECTOR */}
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center relative z-20">
                                <label className="sm:col-span-3 text-sm font-semibold text-gray-400 flex items-center gap-1.5">
                                    <Zap size={16} className="text-theme-primary" /> Scheda Video (GPU)
                                </label>
                                <div className="sm:col-span-7">
                                    {editorMode === 'db' ? (
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={gpuInput}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setGpuInput(val);
                                                    if (!val) {
                                                        setSelectedGpu(null);
                                                    }
                                                }}
                                                onFocus={() => setShowGpuSuggestions(true)}
                                                onBlur={() => setTimeout(() => setShowGpuSuggestions(false), 200)}
                                                placeholder="Digita modello GPU (es. NVIDIA GeForce RTX 4070)"
                                                className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-sm text-theme-text focus:outline-none focus:border-theme-primary/50 font-bold"
                                            />
                                            {showGpuSuggestions && gpuSuggestions.length > 0 && (
                                                <div className="absolute z-50 w-full bg-[#182030] border border-theme-panelBorder rounded-lg mt-1 max-h-60 overflow-y-auto shadow-2xl" style={{ backgroundColor: '#182030', opacity: 1, backdropFilter: 'none', WebkitBackdropFilter: 'none' }}>
                                                    {gpuSuggestions.map((gpu, idx) => (
                                                        <button
                                                            key={idx}
                                                            type="button"
                                                            onMouseDown={() => {
                                                                setSelectedGpu(gpu);
                                                                setGpuInput(gpu.name);
                                                            }}
                                                            className="w-full text-left p-3 hover:bg-theme-primary hover:text-theme-primaryContent text-sm text-theme-text transition-colors border-b border-white/5 last:border-0 font-semibold"
                                                            style={{ backdropFilter: 'none', WebkitBackdropFilter: 'none', boxShadow: 'none' }}
                                                        >
                                                            {gpu.name} (TDP {gpu.tdp}W)
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
                                            placeholder="Digita modello GPU (es. NVIDIA GeForce RTX 4070)"
                                            className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-sm text-theme-text focus:outline-none focus:border-theme-primary/50 font-bold"
                                        />
                                    )}
                                </div>
                                <div className="sm:col-span-2">
                                    <input
                                        type="number"
                                        value={prices.gpu || ''}
                                        onChange={(e) => setPrices(prev => ({ ...prev, gpu: parseFloat(e.target.value) || 0 }))}
                                        placeholder="€ Prezzo"
                                        className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-sm text-theme-text text-right"
                                    />
                                </div>
                            </div>

                            {/* Suggest Pairing Button */}
                            {editorMode === 'db' && (selectedCpu || selectedGpu) && !(selectedCpu && selectedGpu) && (
                                <div className="flex justify-end pr-2">
                                    <button 
                                        onClick={handleSuggestPairing}
                                        className="text-xs text-theme-primary font-bold hover:underline flex items-center gap-1"
                                    >
                                        <Sparkles size={12} /> Suggerisci abbinamento CPU/GPU equilibrato
                                    </button>
                                </div>
                            )}

                            {/* MOTHERBOARD SELECTOR */}
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center relative z-10">
                                <label className="sm:col-span-3 text-sm font-semibold text-gray-400">
                                    Scheda Madre (Mobo)
                                </label>
                                <div className="sm:col-span-7">
                                    {editorMode === 'db' ? (
                                        <select
                                            value={selectedMobo}
                                            onChange={(e) => setSelectedMobo(e.target.value)}
                                            className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-sm text-theme-text focus:outline-none focus:border-theme-primary/50"
                                        >
                                            <option value="">Seleziona Chipset...</option>
                                            {Object.values(socketMoboMap).flat().map((mobo, idx) => (
                                                <option key={idx} value={mobo}>{mobo}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            value={manualMoboText}
                                            onChange={(e) => setManualMoboText(e.target.value)}
                                            placeholder="Digita modello Scheda Madre (es. B650)"
                                            className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-sm text-theme-text focus:outline-none focus:border-theme-primary/50 font-bold"
                                        />
                                    )}
                                </div>
                                <div className="sm:col-span-2">
                                    <input
                                        type="number"
                                        value={prices.mobo || ''}
                                        onChange={(e) => setPrices(prev => ({ ...prev, mobo: parseFloat(e.target.value) || 0 }))}
                                        placeholder="€ Prezzo"
                                        className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-sm text-theme-text text-right"
                                    />
                                </div>
                            </div>

                            {/* RAM SIZE & TYPE SELECTOR */}
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                                <label className="sm:col-span-3 text-sm font-semibold text-gray-400">
                                    Memoria RAM
                                </label>
                                {editorMode === 'db' ? (
                                    <>
                                        <div className="sm:col-span-3">
                                            <select
                                                value={selectedRamSize}
                                                onChange={(e) => setSelectedRamSize(e.target.value)}
                                                className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-sm text-theme-text focus:outline-none focus:border-theme-primary/50"
                                            >
                                                <option value="8">8 GB</option>
                                                <option value="16">16 GB</option>
                                                <option value="32">32 GB</option>
                                                <option value="64">64 GB</option>
                                            </select>
                                        </div>
                                        <div className="sm:col-span-4">
                                            <select
                                                value={selectedRamType}
                                                onChange={(e) => setSelectedRamType(e.target.value)}
                                                className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-sm text-theme-text focus:outline-none"
                                            >
                                                <option value="DDR4">DDR4 RAM</option>
                                                <option value="DDR5">DDR5 RAM</option>
                                            </select>
                                        </div>
                                    </>
                                ) : (
                                    <div className="sm:col-span-7">
                                        <input
                                            type="text"
                                            value={manualRamText}
                                            onChange={(e) => setManualRamText(e.target.value)}
                                            placeholder="Digita memoria RAM (es. Corsair Vengeance 32GB DDR5 6000MHz)"
                                            className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-sm text-theme-text focus:outline-none focus:border-theme-primary/50 font-bold"
                                        />
                                    </div>
                                )}
                                <div className="sm:col-span-2">
                                    <input
                                        type="number"
                                        value={prices.ram || ''}
                                        onChange={(e) => setPrices(prev => ({ ...prev, ram: parseFloat(e.target.value) || 0 }))}
                                        placeholder="€ Prezzo"
                                        className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-sm text-theme-text text-right"
                                    />
                                </div>
                            </div>

                            {/* PSU SELECTOR */}
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                                <label className="sm:col-span-3 text-sm font-semibold text-gray-400">
                                    Alimentatore (PSU)
                                </label>
                                <div className="sm:col-span-7">
                                    {editorMode === 'db' ? (
                                        <select
                                            value={selectedPsu}
                                            onChange={(e) => setSelectedPsu(e.target.value)}
                                            className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-sm text-theme-text focus:outline-none focus:border-theme-primary/50"
                                        >
                                            <option value="400">400 W</option>
                                            <option value="450">450 W</option>
                                            <option value="500">500 W</option>
                                            <option value="550">550 W</option>
                                            <option value="600">600 W</option>
                                            <option value="650">650 W</option>
                                            <option value="700">700 W</option>
                                            <option value="750">750 W</option>
                                            <option value="850">850 W</option>
                                            <option value="1000">1000 W</option>
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            value={manualPsuText}
                                            onChange={(e) => setManualPsuText(e.target.value)}
                                            placeholder="Digita alimentatore (es. Corsair RM750x 750W)"
                                            className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-sm text-theme-text focus:outline-none focus:border-theme-primary/50 font-bold"
                                        />
                                    )}
                                </div>
                                <div className="sm:col-span-2">
                                    <input
                                        type="number"
                                        value={prices.psu || ''}
                                        onChange={(e) => setPrices(prev => ({ ...prev, psu: parseFloat(e.target.value) || 0 }))}
                                        placeholder="€ Prezzo"
                                        className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-sm text-theme-text text-right"
                                    />
                                </div>
                            </div>

                            {/* COOLER SELECTOR */}
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                                <label className="sm:col-span-3 text-sm font-semibold text-gray-400">
                                    Dissipatore CPU
                                </label>
                                <div className="sm:col-span-7">
                                    <input
                                        type="text"
                                        value={selectedCooler}
                                        onChange={(e) => setSelectedCooler(e.target.value)}
                                        placeholder="es. Dissipatore Liquido AIO 240mm..."
                                        className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-sm text-theme-text"
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <input
                                        type="number"
                                        value={prices.cooler || ''}
                                        onChange={(e) => setPrices(prev => ({ ...prev, cooler: parseFloat(e.target.value) || 0 }))}
                                        placeholder="€ Prezzo"
                                        className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-sm text-theme-text text-right"
                                    />
                                </div>
                            </div>

                            {/* STORAGE SELECTOR */}
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                                <label className="sm:col-span-3 text-sm font-semibold text-gray-400">
                                    Archiviazione SSD/HDD
                                </label>
                                <div className="sm:col-span-7">
                                    <input
                                        type="text"
                                        value={selectedStorage}
                                        onChange={(e) => setSelectedStorage(e.target.value)}
                                        placeholder="es. M.2 NVMe SSD 1TB PCIe 4.0..."
                                        className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-sm text-theme-text"
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <input
                                        type="number"
                                        value={prices.storage || ''}
                                        onChange={(e) => setPrices(prev => ({ ...prev, storage: parseFloat(e.target.value) || 0 }))}
                                        placeholder="€ Prezzo"
                                        className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-sm text-theme-text text-right"
                                    />
                                </div>
                            </div>

                            {/* CABINET CASE SELECTOR */}
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                                <label className="sm:col-span-3 text-sm font-semibold text-gray-400">
                                    Cabinet (Case)
                                </label>
                                <div className="sm:col-span-7">
                                    <input
                                        type="text"
                                        value={selectedCase}
                                        onChange={(e) => setSelectedCase(e.target.value)}
                                        placeholder="es. ATX Mid-Tower Black con Ventole ARGB..."
                                        className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-sm text-theme-text"
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <input
                                        type="number"
                                        value={prices.pcCase || ''}
                                        onChange={(e) => setPrices(prev => ({ ...prev, pcCase: parseFloat(e.target.value) || 0 }))}
                                        placeholder="€ Prezzo"
                                        className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-sm text-theme-text text-right"
                                    />
                                </div>
                            </div>

                            {/* CUSTOM DYNAMIC ROWS (+ TAB) */}
                            <div className="border-t border-white/5 pt-4 mt-4 space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-gray-400">Voci Personalizzate Aggiuntive</span>
                                    <button
                                        type="button"
                                        onClick={addCustomRow}
                                        className="px-3 py-1.5 bg-theme-primary text-theme-primaryContent text-xs font-bold rounded-theme-btn hover:brightness-110 transition-all flex items-center gap-1 active:scale-95 shadow cursor-pointer"
                                    >
                                        + TAB (Aggiungi)
                                    </button>
                                </div>

                                {customRows.map((row) => (
                                    <div key={row.id} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center animate-fade-in bg-black/10 p-3 rounded-lg border border-white/5">
                                        <div className="sm:col-span-3">
                                            <input
                                                type="text"
                                                value={row.label}
                                                onChange={(e) => updateCustomRow(row.id, 'label', e.target.value)}
                                                placeholder="es. Ventole, Monitor..."
                                                className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-2.5 text-xs text-theme-text font-bold"
                                            />
                                        </div>
                                        <div className="sm:col-span-6">
                                            <input
                                                type="text"
                                                value={row.spec}
                                                onChange={(e) => updateCustomRow(row.id, 'spec', e.target.value)}
                                                placeholder="Specifiche componente..."
                                                className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-2.5 text-xs text-theme-text"
                                            />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <input
                                                type="number"
                                                value={row.price || ''}
                                                onChange={(e) => updateCustomRow(row.id, 'price', parseFloat(e.target.value) || 0)}
                                                placeholder="€ Prezzo"
                                                className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-2.5 text-xs text-theme-text text-right"
                                            />
                                        </div>
                                        <div className="sm:col-span-1 flex justify-center">
                                            <button
                                                type="button"
                                                onClick={() => removeCustomRow(row.id)}
                                                className="p-2 rounded bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-all text-xs cursor-pointer"
                                                title="Rimuovi riga"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* CUSTOMER QUOTATION DETAILS PANEL */}
                    <div className="glass-panel p-6 rounded-theme-panel border border-theme-panelBorder">
                        <h3 className="text-lg font-bold text-theme-text mb-4">Dettagli Cliente Preventivo</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input
                                type="text"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                placeholder="Nome e Cognome"
                                className="bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-sm text-theme-text focus:outline-none"
                            />
                            <input
                                type="tel"
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value)}
                                placeholder="Telefono"
                                className="bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-sm text-theme-text focus:outline-none"
                            />
                            <input
                                type="email"
                                value={customerEmail}
                                onChange={(e) => setCustomerEmail(e.target.value)}
                                placeholder="Email"
                                className="bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-sm text-theme-text focus:outline-none"
                            />
                        </div>
                        <textarea
                            value={quoteNotes}
                            onChange={(e) => setQuoteNotes(e.target.value)}
                            placeholder="Note del preventivo o termini speciali..."
                            className="w-full mt-4 bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-sm text-theme-text h-20 resize-none focus:outline-none"
                        />
                    </div>
                </div>

                {/* SIDEBAR SIDE INFO COLUMN */}
                <div className="lg:col-span-5 space-y-6">
                    {/* SYSTEM METRICS PANEL */}
                    <div className="glass-panel p-6 rounded-theme-panel border border-theme-panelBorder space-y-6">
                        <h3 className="text-lg font-bold text-theme-text">Stato della Configurazione</h3>

                        {/* COMPATIBILITY METRICS */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Verifica Compatibilità</h4>
                            
                            {/* Socket check */}
                            <div className="flex justify-between items-center p-3 rounded-lg border text-sm font-semibold bg-theme-panel border-theme-panelBorder">
                                <span className="text-gray-400">Accoppiamento Socket</span>
                                {editorMode === 'manual' ? (
                                    <span className="text-gray-400 font-bold">N/A (Manuale)</span>
                                ) : isMoboIncompatible ? (
                                    <span className="text-red-500 flex items-center gap-1.5"><AlertTriangle size={16} /> Chipset Incompatibile</span>
                                ) : (selectedCpu && selectedMobo ? (
                                    <span className="text-green-400 flex items-center gap-1.5"><CheckCircle size={16} /> Compatibile ({cpuSocket})</span>
                                ) : (
                                    <span className="text-gray-400">Seleziona CPU/Mobo</span>
                                ))}
                            </div>

                            {/* RAM type check */}
                            <div className="flex justify-between items-center p-3 rounded-lg border text-sm font-semibold bg-theme-panel border-theme-panelBorder">
                                <span className="text-gray-400">Standard Memoria RAM</span>
                                {editorMode === 'manual' ? (
                                    <span className="text-gray-400 font-bold">N/A (Manuale)</span>
                                ) : isRamIncompatible ? (
                                    <span className="text-red-500 flex items-center gap-1.5"><AlertTriangle size={16} /> Mismatch RAM ({selectedRamType})</span>
                                ) : (selectedCpu ? (
                                    <span className="text-green-400 flex items-center gap-1.5"><CheckCircle size={16} /> Compatibile ({selectedRamType})</span>
                                ) : (
                                    <span className="text-gray-400">Seleziona CPU/RAM</span>
                                ))}
                            </div>
                        </div>

                        {/* POWER ENERGY DRAW */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Consumi & Alimentazione</h4>
                            <div className="p-4 rounded-lg bg-theme-panel border border-theme-panelBorder space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Consumo CPU (TDP):</span>
                                    <span className="font-bold text-theme-text">{editorMode === 'db' && selectedCpu ? `${cpuTdp} W` : 'N/D'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Consumo GPU (TDP):</span>
                                    <span className="font-bold text-theme-text">{editorMode === 'db' && selectedGpu ? `${gpuTdp} W` : 'N/D'}</span>
                                </div>
                                <div className="flex justify-between text-sm border-t border-white/5 pt-2">
                                    <span className="text-gray-400">Stima Picco Sistema:</span>
                                    <span className="font-bold text-theme-text">{editorMode === 'db' ? `${systemTdp} W` : 'N/D'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Alimentatore Consigliato:</span>
                                    <span className="font-bold text-green-400">{editorMode === 'db' ? `≥ ${recommendedPsuWatts} W` : 'N/D'}</span>
                                </div>
                                
                                {editorMode === 'db' && isPsuUnderpowered && (
                                    <div className="flex items-center gap-2 p-2.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded text-xs font-bold mt-2">
                                        <AlertTriangle size={14} className="shrink-0" />
                                        Alimentatore scelto ({selectedPsu}W) sottodimensionato per questo sistema!
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* BOTTLENECK ANALYSIS */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Collo di Bottiglia (CPU / GPU)</h4>
                            {editorMode === 'db' ? (
                                <div className={`p-4 rounded-lg border text-sm space-y-3 ${bottleneckInfo.color}`}>
                                    <div className="flex justify-between font-bold">
                                        <span>Bilanciamento Prestazioni:</span>
                                        <span>
                                            {bottleneckInfo.status === 'balanced' ? 'Bilanciato' : 
                                             (bottleneckInfo.status === 'cpu_bottleneck' ? 'Bottleneck CPU' : 'Bottleneck GPU')}
                                        </span>
                                    </div>
                                    <p className="text-xs text-opacity-80 leading-relaxed text-theme-text">{bottleneckInfo.text}</p>
                                </div>
                            ) : (
                                <div className="p-4 rounded-lg border border-theme-panelBorder text-sm text-gray-400 bg-theme-panel/30 text-center font-medium">
                                    Disattivato in modalità preventivo libero
                                </div>
                            )}
                        </div>
                    </div>

                    {/* PRICING & PDF EXPORT PANEL */}
                    <div className="glass-panel p-6 rounded-theme-panel border border-theme-panelBorder space-y-6">
                        <h3 className="text-lg font-bold text-theme-text">Riepilogo Costi</h3>
                                     {/* Component Subtotal */}
                            <div className="flex justify-between text-sm text-gray-400">
                                <span>Costo Componenti:</span>
                                <span className="font-bold text-theme-text">€ {partsSubtotal.toFixed(2)}</span>
                            </div>

                            {/* Labor fee */}
                            <div className="grid grid-cols-12 gap-2 items-center text-sm text-gray-400">
                                <span className="col-span-6">Manodopera & Assemblaggio:</span>
                                <div className="col-span-6 flex items-center bg-theme-panel border border-theme-panelBorder rounded px-2 w-32 ml-auto">
                                    <span className="text-xs mr-1">€</span>
                                    <input
                                        type="number"
                                        value={laborFee}
                                        onChange={(e) => setLaborFee(parseFloat(e.target.value) || 0)}
                                        className="w-full bg-transparent text-right py-1 focus:outline-none text-theme-text font-bold"
                                    />
                                </div>
                            </div>

                            {/* Discount */}
                            <div className="grid grid-cols-12 gap-2 items-center text-sm text-gray-400 border-b border-white/5 pb-3">
                                <span className="col-span-6">Sconto manuale (€):</span>
                                <div className="col-span-6 flex items-center bg-theme-panel border border-theme-panelBorder rounded px-2 w-32 ml-auto">
                                    <span className="text-xs mr-1 text-red-400">- €</span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={discount}
                                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                        className="w-full bg-transparent text-right py-1 focus:outline-none text-red-400 font-bold"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            {/* Total Pricing calculation */}
                            {parseFloat(discount) > 0 && (
                                <div className="flex justify-between text-sm text-red-400 font-semibold pt-2">
                                    <span>Sconto applicato:</span>
                                    <span>- € {parseFloat(discount).toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center text-2xl font-black border-t border-white/10 pt-3 text-theme-primary">
                                <span>Totale Preventivo:</span>
                                <div className="flex items-center gap-1 w-32 ml-auto">
                                    <span className="text-xl font-bold">€</span>
                                    <input
                                        type="number"
                                        value={isEditingTotal ? tempTotalCost : totalCost.toFixed(2)}
                                        onFocus={() => {
                                            setIsEditingTotal(true);
                                            setTempTotalCost(totalCost.toFixed(2));
                                        }}
                                        onBlur={() => {
                                            setIsEditingTotal(false);
                                        }}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setTempTotalCost(val);
                                            const newTotal = parseFloat(val) || 0;
                                            if (newTotal >= partsSubtotal) {
                                                setDiscount(0);
                                                const requiredLabor = newTotal - partsSubtotal;
                                                setLaborFee(requiredLabor > 0 ? parseFloat(requiredLabor.toFixed(2)) : 0);
                                            } else {
                                                setLaborFee(0);
                                                const requiredDiscount = partsSubtotal - newTotal;
                                                setDiscount(requiredDiscount > 0 ? parseFloat(requiredDiscount.toFixed(2)) : 0);
                                            }
                                        }}
                                        className="w-full bg-transparent text-right py-0.5 focus:outline-none text-theme-primary font-black border-b border-theme-primary/30 text-xl focus:border-theme-primary"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                        {/* Action buttons */}
                        <div className="pt-2 flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={() => handleGeneratePdf('view')}
                                disabled={editorMode === 'db' && (isMoboIncompatible || isRamIncompatible)}
                                className="flex-1 bg-theme-primary text-theme-primaryContent font-bold py-3.5 rounded-theme-btn flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-[var(--color-primary)]/10 disabled:opacity-50 disabled:cursor-not-allowed text-sm w-full"
                            >
                                <FileText size={18} />
                                Apri PDF
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            </>
        )}

            {/* CUSTOM COMPONENT MODAL/DRAWER */}
            {showCustomModal && (
                <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <div className="glass-panel p-8 rounded-theme-panel border border-theme-panelBorder max-w-md w-full shadow-2xl space-y-6">
                        <div className="flex justify-between items-center border-b border-white/5 pb-4">
                            <h3 className="text-xl font-bold text-theme-text flex items-center gap-2">
                                <Plus size={20} className="text-theme-primary" /> Aggiungi Componente Custom
                            </h3>
                            <button 
                                onClick={() => setShowCustomModal(false)}
                                className="text-gray-500 hover:text-theme-text text-xl font-black"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleAddCustomComponent} className="space-y-4">
                            {/* Component Type select */}
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400">Tipo Componente</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setCustomType('cpu')}
                                        className={`py-2 rounded font-bold text-sm transition-colors ${customType === 'cpu' ? 'bg-theme-primary text-theme-primaryContent' : 'bg-theme-panel text-gray-400'}`}
                                    >
                                        Processore (CPU)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCustomType('gpu')}
                                        className={`py-2 rounded font-bold text-sm transition-colors ${customType === 'gpu' ? 'bg-theme-primary text-theme-primaryContent' : 'bg-theme-panel text-gray-400'}`}
                                    >
                                        Scheda Video (GPU)
                                    </button>
                                </div>
                            </div>

                            {/* Name input */}
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400">Nome Modello</label>
                                <input
                                    type="text"
                                    value={customName}
                                    onChange={(e) => setCustomName(e.target.value)}
                                    placeholder="es. AMD Ryzen 7 9800X3D"
                                    required
                                    className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-sm text-theme-text focus:outline-none focus:border-theme-primary/50"
                                />
                            </div>

                            {/* TDP input */}
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400">Consumo Energetico (TDP W)</label>
                                <input
                                    type="number"
                                    value={customTdp}
                                    onChange={(e) => setCustomTdp(e.target.value)}
                                    placeholder="es. 120"
                                    required
                                    className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-sm text-theme-text focus:outline-none"
                                />
                            </div>

                            {customType === 'cpu' && (
                                <>
                                    {/* Socket input */}
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-400">Socket Processore</label>
                                        <select
                                            value={customSocket}
                                            onChange={(e) => setCustomSocket(e.target.value)}
                                            className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-sm text-theme-text focus:outline-none"
                                        >
                                            {Object.keys(socketMoboMap).map(skt => (
                                                <option key={skt} value={skt}>{skt}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* RAM compatibility input */}
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-400">Standard Memorie Supportato</label>
                                        <select
                                            value={customRam}
                                            onChange={(e) => setCustomRam(e.target.value)}
                                            className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-sm text-theme-text focus:outline-none"
                                        >
                                            <option value="DDR4">Solo DDR4</option>
                                            <option value="DDR5">Solo DDR5</option>
                                            <option value="DDR5/DDR4">Entrambi (DDR5/DDR4)</option>
                                        </select>
                                    </div>
                                </>
                            )}

                            {/* Bottleneck Group / Tier input */}
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400">Fascia Prestazionale (Bottleneck Index 1-7)</label>
                                <select
                                    value={customGroup}
                                    onChange={(e) => {
                                        setCustomGroup(e.target.value);
                                        const labels = {
                                            '1': 'Legacy Entry-Level',
                                            '2': 'Entry-Level',
                                            '3': 'Budget',
                                            '4': 'Mid-Range',
                                            '5': 'Upper Mid-Range',
                                            '6': 'High-End',
                                            '7': 'Ultra High-End'
                                        };
                                        setCustomTier(labels[e.target.value] || 'Mid-Range');
                                    }}
                                    className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-sm text-theme-text focus:outline-none"
                                >
                                    <option value="7">Fascia 7 - Ultra High-End (es. i9-14900K, RTX 4090)</option>
                                    <option value="6">Fascia 6 - High-End (es. i7-13700K, RTX 4070Ti)</option>
                                    <option value="5">Fascia 5 - Upper Mid-Range (es. Ryzen 5 7600X, RTX 4070)</option>
                                    <option value="4">Fascia 4 - Mid-Range (es. Ryzen 5 5600X, RTX 3060)</option>
                                    <option value="3">Fascia 3 - Budget (es. Core i3-12100F, GTX 1660S)</option>
                                    <option value="2">Fascia 2 - Entry-Level (es. Ryzen 3 3100, GTX 1050Ti)</option>
                                    <option value="1">Fascia 1 - Legacy / Integrated (es. Grafica Integrata)</option>
                                </select>
                            </div>

                            {/* Actions submit */}
                            <div className="flex gap-3 pt-4 border-t border-white/5">
                                <button
                                    type="button"
                                    onClick={() => setShowCustomModal(false)}
                                    className="flex-1 py-3 bg-theme-panel border border-theme-panelBorder rounded-theme-btn text-theme-text font-bold text-sm hover:bg-white/5 active:scale-95 transition-all"
                                >
                                    Annulla
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-theme-primary text-theme-primaryContent rounded-theme-btn font-bold text-sm hover:brightness-110 active:scale-95 transition-all"
                                >
                                    Aggiungi
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
