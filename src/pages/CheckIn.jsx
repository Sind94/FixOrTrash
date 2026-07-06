import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Camera, Save, User, Smartphone, Wrench, Search, Upload, X, FileText, CheckCircle, Download, RotateCcw, Home, Plus, Trash2, ExternalLink, ClipboardList } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { deviceTypes, brandData, componentsList as componentsData } from '../services/mockData';
import { dataManager } from '../services/dataManager';
import logoReport from '../assets/logo_denis.jpg';
import { pdfLayoutEngine } from '../services/pdfLayoutEngine';

const checklistItems = {
    power: "Accensione",
    screen: "Schermo",
    touch: "Touchscreen",
    charging: "Ricarica",
    cameras: "Fotocamere",
    wifi: "Wi-Fi / BT",
    audio: "Audio (Mic/Spk)",
    buttons: "Tasti Fisici",
    proximity: "Sens. Prossimità",
    sim: "Lettore SIM",
    biometrics: "FaceID / Impronta"
};

const InteractivePatternGrid = ({ value, onChange }) => {
    const svgRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPath, setCurrentPath] = useState([]);
    const [cursorPos, setCursorPos] = useState(null);

    const points = [
        { x: 25, y: 25 }, { x: 75, y: 25 }, { x: 125, y: 25 },
        { x: 25, y: 75 }, { x: 75, y: 75 }, { x: 125, y: 75 },
        { x: 25, y: 125 }, { x: 75, y: 125 }, { x: 125, y: 125 }
    ];

    useEffect(() => {
        if (!value) {
            setCurrentPath([]);
            setCursorPos(null);
        } else {
            setCurrentPath(value.split(',').map(Number).filter(n => !isNaN(n)));
        }
    }, [value]);

    const handleStart = (clientX, clientY) => {
        if (!svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        const x = ((clientX - rect.left) / rect.width) * 150;
        const y = ((clientY - rect.top) / rect.height) * 150;

        points.forEach((pt, i) => {
            const dist = Math.sqrt((x - pt.x) ** 2 + (y - pt.y) ** 2);
            if (dist < 18) {
                setIsDrawing(true);
                const newPath = [i];
                setCurrentPath(newPath);
                onChange(newPath.join(','));
            }
        });
    };

    const handleMove = (clientX, clientY) => {
        if (!isDrawing || !svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        const x = ((clientX - rect.left) / rect.width) * 150;
        const y = ((clientY - rect.top) / rect.height) * 150;
        setCursorPos({ x, y });

        points.forEach((pt, i) => {
            const dist = Math.sqrt((x - pt.x) ** 2 + (y - pt.y) ** 2);
            if (dist < 18) {
                if (!currentPath.includes(i)) {
                    const newPath = [...currentPath, i];
                    setCurrentPath(newPath);
                    onChange(newPath.join(','));
                }
            }
        });
    };

    const handleEnd = () => {
        setIsDrawing(false);
        setCursorPos(null);
    };

    const onMouseDown = (e) => {
        e.preventDefault();
        handleStart(e.clientX, e.clientY);
    };

    const onMouseMove = (e) => {
        if (!isDrawing) return;
        e.preventDefault();
        handleMove(e.clientX, e.clientY);
    };

    const onTouchStart = (e) => {
        if (e.touches.length > 0) {
            handleStart(e.touches[0].clientX, e.touches[0].clientY);
        }
    };

    const onTouchMove = (e) => {
        if (!isDrawing) return;
        if (e.touches.length > 0) {
            handleMove(e.touches[0].clientX, e.touches[0].clientY);
        }
    };

    useEffect(() => {
        const handleGlobalMouseUp = () => {
            if (isDrawing) {
                handleEnd();
            }
        };
        window.addEventListener('mouseup', handleGlobalMouseUp);
        return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }, [isDrawing]);

    return (
        <svg
            ref={svgRef}
            width="180"
            height="180"
            viewBox="0 0 150 150"
            className="bg-[#171717] border border-theme-panelBorder rounded-lg cursor-pointer touch-none select-none"
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={handleEnd}
            onMouseUp={handleEnd}
        >
            {currentPath.map((dotIdx, idx) => {
                if (idx === 0) return null;
                const prevDot = points[currentPath[idx - 1]];
                const currDot = points[dotIdx];
                return (
                    <line
                        key={idx}
                        x1={prevDot.x}
                        y1={prevDot.y}
                        x2={currDot.x}
                        y2={currDot.y}
                        stroke="#eab308"
                        strokeWidth="5"
                        strokeLinecap="round"
                    />
                );
            })}

            {isDrawing && currentPath.length > 0 && cursorPos && (
                <line
                    x1={points[currentPath[currentPath.length - 1]].x}
                    y1={points[currentPath[currentPath.length - 1]].y}
                    x2={cursorPos.x}
                    y2={cursorPos.y}
                    stroke="#eab308"
                    strokeWidth="3"
                    strokeDasharray="4,4"
                    strokeLinecap="round"
                />
            )}

            {points.map((pt, i) => {
                const isActive = currentPath.includes(i);
                const orderIdx = currentPath.indexOf(i);
                return (
                    <g key={i}>
                        {isActive ? (
                            <circle
                                cx={pt.x}
                                cy={pt.y}
                                r="15"
                                fill="none"
                                stroke="#eab308"
                                strokeWidth="2.5"
                                strokeOpacity="0.5"
                            />
                        ) : (
                            <circle
                                cx={pt.x}
                                cy={pt.y}
                                r="18"
                                fill="transparent"
                            />
                        )}
                        <circle
                            cx={pt.x}
                            cy={pt.y}
                            r="8"
                            className={`${
                                isActive
                                    ? 'fill-yellow-500 scale-110'
                                    : 'fill-neutral-700 hover:fill-neutral-500'
                            }`}
                        />
                        {isActive && (
                            <text
                                x={pt.x}
                                y={pt.y + 3}
                                textAnchor="middle"
                                fill="#000"
                                fontSize="9"
                                fontWeight="bold"
                                className="pointer-events-none select-none"
                            >
                                {orderIdx + 1}
                            </text>
                        )}
                    </g>
                );
            })}
        </svg>
    );
};

const CheckIn = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Customer Data
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerSuggestions, setCustomerSuggestions] = useState([]);
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const allCustomers = React.useMemo(() => {
        try {
            const repairs = dataManager.getSync('repairs') || [];
            const map = {};
            repairs.forEach(r => {
                const key = r.customer?.phone || r.customer?.name;
                if (key && !map[key]) map[key] = r.customer;
            });
            return Object.values(map);
        } catch { return []; }
    }, []);

    const handlePhoneChange = (val) => {
        setCustomerPhone(val);
        if (val.length >= 3) {
            const matches = allCustomers.filter(c =>
                c.phone?.includes(val) || c.name?.toLowerCase().includes(val.toLowerCase())
            ).slice(0, 5);
            setCustomerSuggestions(matches);
            setShowCustomerDropdown(matches.length > 0);
        } else {
            setShowCustomerDropdown(false);
        }
    };

    const handleNameChange = (val) => {
        setCustomerName(val);
        if (val.length >= 2) {
            const matches = allCustomers.filter(c =>
                c.name?.toLowerCase().includes(val.toLowerCase())
            ).slice(0, 5);
            setCustomerSuggestions(matches);
            setShowCustomerDropdown(matches.length > 0);
        } else {
            setShowCustomerDropdown(false);
        }
    };

    const applyCustomer = (c) => {
        setCustomerName(c.name || '');
        setCustomerPhone(c.phone || '');
        setCustomerEmail(c.email || '');
        setShowCustomerDropdown(false);
    };

    // Device Data
    const [deviceInfo, setDeviceInfo] = useState(''); // e.g., "iPhone 13 Pro Max"
    const [imei, setImei] = useState(''); // New IMEI / Seriale field
    const [problemDescription, setProblemDescription] = useState('');
    const [notes, setNotes] = useState('');
    const [pdfIngressPath, setPdfIngressPath] = useState(null); // Path to the PDF file

    // New Fields
    const [priority, setPriority] = useState('medium');
    const [dueDate, setDueDate] = useState('');
    const [warrantyMonths, setWarrantyMonths] = useState(3); // default standard 3 months
    const [deposit, setDeposit] = useState(''); // deposit paid
    const [lockType, setLockType] = useState('none'); // 'none', 'pin', 'pattern'
    const [lockCode, setLockCode] = useState(''); // PIN or pattern sequence
    const [checklist, setChecklist] = useState({
        power: 'nt',
        screen: 'nt',
        touch: 'nt',
        charging: 'nt',
        cameras: 'nt',
        wifi: 'nt',
        audio: 'nt',
        buttons: 'nt',
        proximity: 'nt',
        sim: 'nt',
        biometrics: 'nt'
    });

    // Warehouse/Part Data
    const [inventory, setInventory] = useState([]);
    const [selectedParts, setSelectedParts] = useState([]); // Array of selected parts

    // Costs
    const [laborCost, setLaborCost] = useState(50); // Default, will load from settings
    const [markupPercent, setMarkupPercent] = useState(0);
    const [ivaPercent, setIvaPercent] = useState(0);
    const [totalCost, setTotalCost] = useState(0);
    const [discount, setDiscount] = useState(0);
    const [isEditingTotal, setIsEditingTotal] = useState(false);
    const [pdfStyle, setPdfStyle] = useState('classic');
    
    // PDF Config
    const [pdfTemplate, setPdfTemplate] = useState({});

    // Search and Autocomplete state
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Photos
    const [photos, setPhotos] = useState([]);

    // Success State
    const [checkInSuccess, setCheckInSuccess] = useState(false);
    const [lastTicket, setLastTicket] = useState(null);

    // Load Data
    useEffect(() => {
        try {
            const storedInventory = dataManager.getSync('inventory') || [];
            setInventory(storedInventory);

            const savedSettings = dataManager.getSync('settings') || {};
            if (savedSettings.laborCost !== undefined) setLaborCost(savedSettings.laborCost.toString());
            if (savedSettings.markupPercent !== undefined) setMarkupPercent(savedSettings.markupPercent);
            setIvaPercent(0); // Force 0% under Regime Forfettario
            if (savedSettings.pdfTemplate) setPdfTemplate(savedSettings.pdfTemplate);
            if (savedSettings.pdfStyle !== undefined) setPdfStyle(savedSettings.pdfStyle);
        } catch (e) {
            console.error(e);
        }

        // Check for passed state parameters for autocompilation
        if (location.state) {
            if (location.state.deviceInfo) {
                setDeviceInfo(location.state.deviceInfo);
            }
            if (location.state.customerName) {
                setCustomerName(location.state.customerName);
            }
            if (location.state.customerPhone) {
                setCustomerPhone(location.state.customerPhone);
            }
            if (location.state.customerEmail) {
                setCustomerEmail(location.state.customerEmail);
            }
        }
    }, [location.state]);

    // Calculate Total when Parts or Labor changes
    useEffect(() => {
        try {
            const labor = parseFloat(laborCost) || 0;
            
            let partsTotalWithMarkup = 0;
            selectedParts.forEach(part => {
                 const cost = parseFloat(part.cost) || 0;
                 const pMarkup = (part.markupPercent !== undefined && part.markupPercent !== '') ? parseFloat(part.markupPercent) : parseFloat(markupPercent);
                 const markupAmount = part.unlimited ? 0 : cost * (pMarkup / 100);
                 partsTotalWithMarkup += (cost + markupAmount);
            });

            const subtotal = labor + partsTotalWithMarkup;
            const ivaAmount = subtotal * (parseFloat(ivaPercent) / 100);
            
            const discVal = parseFloat(discount) || 0;
            const finalTotal = parseFloat(subtotal + ivaAmount) - discVal;
            if (!isEditingTotal && !isNaN(finalTotal)) {
                setTotalCost(Math.max(0, finalTotal));
            }
        } catch (e) {
            console.error(e);
        }
    }, [laborCost, selectedParts, markupPercent, ivaPercent, discount, isEditingTotal]);

    const filteredInventory = inventory.filter(item => 
        `${item.brand} ${item.model} ${item.component}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Handle adding a part from inventory
    const handleAddPart = (part) => {
        if (part) {
            const pMarkup = (part.markupPercent !== undefined && part.markupPercent !== null && part.markupPercent !== '')
                ? parseFloat(part.markupPercent)
                : parseFloat(markupPercent);

            setSelectedParts(prev => [...prev, {
                id: part.id,
                name: `${part.brand} ${part.model} - ${part.component} `,
                cost: part.cost || 0,
                unlimited: part.unlimited || false,
                markupPercent: pMarkup,
                atecoCode: part.atecoCode || (part.unlimited ? '95.11.00' : '47.41.00')
            }]);
            setSearchTerm('');
            setIsDropdownOpen(false);
        }
    };

    const handleRemovePart = (index) => {
        setSelectedParts(prev => prev.filter((_, i) => i !== index));
    };

    const handleTotalCostChange = (e) => {
        const val = e.target.value;
        setTotalCost(val);
        
        const newTotal = parseFloat(val) || 0;
        const discVal = parseFloat(discount) || 0;
        const targetSubtotal = (newTotal + discVal) / (1 + (parseFloat(ivaPercent) || 0) / 100);
        
        // Calculate parts total with markup
        let partsTotalWithMarkup = 0;
        selectedParts.forEach(part => {
             const cost = parseFloat(part.cost) || 0;
             const pMarkup = (part.markupPercent !== undefined && part.markupPercent !== '') ? parseFloat(part.markupPercent) : parseFloat(markupPercent);
             const markupAmount = part.unlimited ? 0 : cost * (pMarkup / 100);
             partsTotalWithMarkup += (cost + markupAmount);
        });

        // The remaining amount goes into labor cost
        const requiredLabor = targetSubtotal - partsTotalWithMarkup;
        setLaborCost(requiredLabor > 0 ? requiredLabor.toFixed(2) : '0');
    };

    const handleTotalBlur = () => {
        setIsEditingTotal(false);
        // Force recalculation to snap totalCost to correct rounded sum
        const labor = parseFloat(laborCost) || 0;
        let partsTotalWithMarkup = 0;
        selectedParts.forEach(part => {
             const cost = parseFloat(part.cost) || 0;
             const pMarkup = (part.markupPercent !== undefined && part.markupPercent !== '') ? parseFloat(part.markupPercent) : parseFloat(markupPercent);
             const markupAmount = part.unlimited ? 0 : cost * (pMarkup / 100);
             partsTotalWithMarkup += (cost + markupAmount);
        });
        const subtotal = labor + partsTotalWithMarkup;
        const ivaAmount = subtotal * ((parseFloat(ivaPercent) || 0) / 100);
        const discVal = parseFloat(discount) || 0;
        const finalTotal = subtotal + ivaAmount - discVal;
        if (!isNaN(finalTotal)) {
            setTotalCost(Math.max(0, finalTotal));
        }
    };

    // Handle Photo Upload
    const handlePhotoUpload = (e) => {
        const files = Array.from(e.target.files);

        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotos(prev => [...prev, reader.result]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removePhoto = (index) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
    };

    // Notification State
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });

    const showMessage = (message, type = 'error') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
    };

    const handleSave = async () => {
        if (!customerName || !deviceInfo) {
            showMessage('Per favore inserisci almeno Nome Cliente e Dispositivo.', 'error');
            return;
        }

        // Calculate total parts cost
        let partsTotalBase = 0;
        let partsTotalWithMarkup = 0;
        selectedParts.forEach(part => {
             const cost = parseFloat(part.cost) || 0;
             const pMarkup = (part.markupPercent !== undefined && part.markupPercent !== '') ? parseFloat(part.markupPercent) : parseFloat(markupPercent);
             const markupAmount = part.unlimited ? 0 : cost * (pMarkup / 100);
             partsTotalBase += cost;
             partsTotalWithMarkup += (cost + markupAmount);
        });

        // Save to tickets (create new array if needed)
        const existingRepairs = dataManager.getSync('repairs') || [];

        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const baseTimestampId = `${year}${month}${day}${hours}${minutes}`;

        // Prevent ID collisions if user creates multiple tickets in the SAME minute
        let finalTimestampId = baseTimestampId;
        let collisionCounter = 1;
        while (existingRepairs.some(t => t.id === finalTimestampId)) {
            finalTimestampId = `${baseTimestampId}-${collisionCounter}`;
            collisionCounter++;
        }

        const newTicket = {
            id: finalTimestampId,
            date: new Date().toISOString(),
            status: 'check_in',
            priority: priority,
            dueDate: dueDate,
            checklist: checklist,
            statusHistory: [
                {
                    status: 'check_in',
                    date: new Date().toISOString(),
                    note: 'Dispositivo registrato in ingresso.'
                }
            ],
            customer: {
                name: customerName,
                phone: customerPhone,
                email: customerEmail
            },
            device: {
                info: deviceInfo,
                imei: imei,
                problem: problemDescription,
                notes: notes,
                photos: photos,
                pdfIngress: pdfIngressPath,
                lockType: lockType,
                lockCode: lockCode
            },
            repair: {
                parts: selectedParts,
                partsTotalCost: partsTotalWithMarkup,
                laborCost: parseFloat(laborCost),
                laborAtecoCode: '95.11.00',
                markupPercent: markupPercent,
                ivaPercent: ivaPercent,
                discount: parseFloat(discount) || 0,
                totalCost: totalCost,
                warrantyMonths: parseInt(warrantyMonths) || 0,
                deposit: parseFloat(deposit) || 0
            }
        };

        const updatedRepairs = [newTicket, ...existingRepairs];
        dataManager.updateSlice('repairs', updatedRepairs);

        // Update Inventory (Reserve the parts)
        if (selectedParts.length > 0) {
            let updatedInventory = [...inventory];

            selectedParts.forEach(selectedPart => {
                // Find if the selected part is unlimited
                const originalItem = inventory.find(item => item.id === selectedPart.id);
                if (originalItem && originalItem.unlimited) {
                    // Bypass inventory decrement and committed increment for unlimited items
                    return;
                }
                updatedInventory = updatedInventory.map(item => {
                    if (item.id === selectedPart.id) {
                        return {
                            ...item,
                            quantity: (item.quantity || 0) - 1,
                            committed: (item.committed || 0) + 1
                        };
                    }
                    return item;
                });
            });

            dataManager.updateSlice('inventory', updatedInventory);
        }

        // ---------- CLOUD SYNC (GOOGLE SHEETS) ----------
        const savedSettings = dataManager.getSync('settings') || {};
        if (savedSettings.googleSheetsWebhook && !savedSettings.googleSheetsTestMode) {
            try {
                // Send silent POST to Google Apps Script
                await fetch(savedSettings.googleSheetsWebhook, {
                    method: 'POST',
                    mode: 'no-cors', // Essential for Apps Script webhooks without complex preflight
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: customerName,
                        phone: customerPhone,
                        email: customerEmail,
                        date: new Date().toLocaleDateString(),
                        device: deviceInfo,
                        problem: problemDescription
                    })
                });
                console.log("Dati inviati al Cloud con successo.");
            } catch (error) {
                console.error("Errore durante la sincronizzazione su Google Fogli:", error);
                // Si sceglie di non bloccare il Ticket in caso di fallimento Cloud
                showMessage("Riparazione salvata locale, ma Sincronizzazione Cloud fallita.", 'error');
            }
        }

        showMessage('Riparazione registrata con successo!', 'success');
        setLastTicket(newTicket);
        setCheckInSuccess(true);
    };

    const handleCheckImei = async () => {
        if (!imei) {
            showMessage("Inserisci prima un IMEI o Seriale per poterlo verificare.", "error");
            return;
        }
        const cleanImei = imei.replace(/\s/g, '');
        const targetUrl = `https://iunlocker.com/gsma_blacklist_check.php`;
        const injectJs = `
            const imeiInput = document.querySelector('input[name="imeip"]');
            if (imeiInput) {
                imeiInput.value = '${cleanImei}';
            }
        `;

        // Use Electron IPC if available
        if (window.require) {
            const { ipcRenderer } = window.require('electron');
            try {
                await ipcRenderer.invoke('open-adblocked-window', targetUrl, injectJs);
            } catch (err) {
                console.error("IPC Error opening window:", err);
                window.open(targetUrl, '_blank'); // fallback
            }
        } else {
            // Fallback for web mode
            window.open(targetUrl, '_blank');
        }
    };

    const createPDFDoc = () => {
        if (!lastTicket) return null;
        return pdfLayoutEngine.generate('checkin', { ticket: lastTicket, checklistItems });
    };

    const generateCheckInPDF = () => {
        const doc = createPDFDoc();
        if (doc) {
            doc.save(`Ticket_${lastTicket.id}_${lastTicket.customer.name.replace(/\s+/g, '_')}.pdf`);
        }
    };

    const handleOpenPDF = () => {
        const doc = createPDFDoc();
        if (doc) {
            pdfLayoutEngine.openPdf(doc, `ticket_${lastTicket.id}.pdf`);
        }
    };

    const handleReset = () => {
        setCheckInSuccess(false);
        setCustomerName('');
        setCustomerPhone('');
        setCustomerEmail('');
        setDeviceInfo('');
        setImei('');
        setProblemDescription('');
        setNotes('');
        setPhotos([]);
        setPdfIngressPath(null);
        setLockType('none');
        setLockCode('');
        setSelectedParts([]); // Reset parts array
        setLaborCost(50);
        setDiscount(0);
        setTotalCost(50); // Just labor default
        setLastTicket(null);
        setPriority('medium');
        setDueDate('');
        setWarrantyMonths(3);
        setDeposit('');
        setChecklist({
            power: 'nt',
            screen: 'nt',
            touch: 'nt',
            charging: 'nt',
            cameras: 'nt',
            wifi: 'nt',
            audio: 'nt',
            buttons: 'nt',
            proximity: 'nt',
            sim: 'nt',
            biometrics: 'nt'
        });
    };

    if (checkInSuccess) {
        return (
            <div className="min-h-screen p-8 animate-fade-in flex flex-col items-center justify-center relative z-10">
                <div className="glass-panel p-12 rounded-theme-panel text-center max-w-2xl w-full border border-green-500/30">
                    <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-green-400">
                        <CheckCircle size={48} />
                    </div>
                    <h1 className="text-4xl font-bold text-theme-text mb-4">Check-In Completato!</h1>
                    <p className="text-gray-400 mb-12 text-lg">
                        La riparazione per <span className="text-theme-text font-bold">{customerName}</span> è stata registrata correttamente.
                    </p>

                    <div className="flex justify-center">
                        <button
                            onClick={handleOpenPDF}
                            className="bg-theme-primary hover:bg-theme-primary text-theme-primaryContent font-bold py-4 px-8 rounded-theme-btn flex items-center justify-center gap-3 transition-all shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.5)] transform hover:-translate-y-1 w-full max-w-md"
                        >
                            <FileText size={24} />
                            Apri PDF
                        </button>
                    </div>

                    <div className="mt-8 flex justify-center">
                        <button
                            onClick={() => navigate('/')}
                            className="text-gray-400 hover:text-theme-text flex items-center gap-2 transition-colors py-2"
                        >
                            <Home size={18} />
                            Torna alla Home
                        </button>
                    </div>

                    <div className="mt-2 flex justify-center">
                        <button
                            onClick={handleReset}
                            className="text-gray-400 hover:text-theme-text flex items-center gap-2 transition-colors py-2"
                        >
                            <RotateCcw size={18} />
                            Registra un'altra riparazione
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-8 animate-fade-in pb-24">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate('/')}
                    className="p-3 bg-theme-panel border border-theme-panelBorder border border-theme-panelBorder rounded-theme-btn hover:bg-theme-panel brightness-110 border border-theme-panelBorder transition-colors text-theme-text"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-2xl font-bold text-theme-text flex items-center gap-2">
                    <Wrench className="text-[var(--color-primary)]" size={24} />
                    Check-In Riparazione
                </h1>
            </div>

            {/* Notification Toast */}
            {notification.show && (
                <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-theme-btn shadow-2xl flex items-center gap-3 animate-fade-in ${notification.type === 'error' ? 'bg-red-500/90 text-theme-text' : 'bg-green-500/90 text-theme-primaryContent font-bold'}`}>
                    {notification.type === 'error' ? <X size={20} /> : <Save size={20} />}
                    {notification.message}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* LEFT COLUMN - Customer & Device */}
                <div className="space-y-8">
                    {/* Customer Info */}
                    <div className="glass-panel p-6 rounded-theme-panel">
                        <h2 className="text-xl font-bold text-theme-text mb-4 flex items-center gap-2">
                            <User size={20} className="text-theme-primary" />
                            Dati Cliente
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-gray-400 ml-1">Nome e Cognome</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={customerName}
                                        onChange={(e) => handleNameChange(e.target.value)}
                                        onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 180)}
                                        onFocus={() => customerName.length >= 2 && handleNameChange(customerName)}
                                        placeholder="Mario Rossi"
                                        className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-4 text-theme-text focus:border-theme-primary/50 focus:outline-none"
                                    />
                                    {showCustomerDropdown && (
                                        <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-[var(--color-surface)] border border-theme-panelBorder rounded-lg shadow-xl overflow-hidden">
                                            <div className="px-3 py-1.5 text-[10px] text-gray-500 font-bold uppercase tracking-wider border-b border-theme-panelBorder bg-black/20">
                                                👤 Clienti già registrati
                                            </div>
                                            {customerSuggestions.map((c, i) => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onMouseDown={() => applyCustomer(c)}
                                                    className="w-full text-left px-4 py-3 hover:bg-[var(--color-primary)]/10 transition-colors flex justify-between items-center border-b border-theme-panelBorder/50 last:border-0"
                                                >
                                                    <div>
                                                        <div className="text-sm font-bold text-theme-text">{c.name}</div>
                                                        <div className="text-xs text-gray-400">{c.phone}{c.email ? ` · ${c.email}` : ''}</div>
                                                    </div>
                                                    <span className="text-[10px] bg-[var(--color-primary)]/15 text-[var(--color-primary)] px-2 py-0.5 rounded font-bold">Autofill →</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-gray-400 ml-1">Telefono</label>
                                    <div className="relative">
                                        <input
                                            type="tel"
                                            value={customerPhone}
                                            onChange={(e) => handlePhoneChange(e.target.value)}
                                            onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 180)}
                                            placeholder="Num. Cellulare..."
                                            className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-4 text-theme-text focus:border-theme-primary/50 focus:outline-none"
                                        />
                                        {showCustomerDropdown && (
                                            <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-[var(--color-surface)] border border-theme-panelBorder rounded-lg shadow-xl overflow-hidden">
                                                <div className="px-3 py-1.5 text-[10px] text-gray-500 font-bold uppercase tracking-wider border-b border-theme-panelBorder bg-black/20">
                                                    👤 Clienti già registrati
                                                </div>
                                                {customerSuggestions.map((c, i) => (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        onMouseDown={() => applyCustomer(c)}
                                                        className="w-full text-left px-4 py-3 hover:bg-[var(--color-primary)]/10 transition-colors flex justify-between items-center border-b border-theme-panelBorder/50 last:border-0"
                                                    >
                                                        <div>
                                                            <div className="text-sm font-bold text-theme-text">{c.name}</div>
                                                            <div className="text-xs text-gray-400">{c.phone}</div>
                                                        </div>
                                                        <span className="text-[10px] bg-[var(--color-primary)]/15 text-[var(--color-primary)] px-2 py-0.5 rounded font-bold">Autofill →</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-400 ml-1">Email</label>
                                    <input
                                        type="email"
                                        value={customerEmail}
                                        onChange={(e) => setCustomerEmail(e.target.value)}
                                        placeholder="Indirizzo Email..."
                                        className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-4 text-theme-text focus:border-theme-primary/50 focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>


                    {/* Device Info */}
                    <div className="glass-panel p-6 rounded-theme-panel">
                        <h2 className="text-xl font-bold text-theme-text mb-4 flex items-center gap-2">
                            <Smartphone size={20} className="text-theme-primary" />
                            Dati Dispositivo
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-gray-400 ml-1">Dispositivo (Modello)</label>
                                <input
                                    type="text"
                                    value={deviceInfo}
                                    onChange={(e) => setDeviceInfo(e.target.value)}
                                    placeholder="es. iPhone 13, Samsung S21..."
                                    className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-4 text-theme-text focus:border-theme-primary/50 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 ml-1">IMEI / Seriale (Opzionale)</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            value={imei}
                                            onChange={(e) => setImei(e.target.value)}
                                            className="w-full bg-theme-panel border border-theme-panelBorder text-theme-text px-4 py-4 rounded-theme-btn focus:border-[var(--color-primary)] focus:outline-none transition-colors"
                                            placeholder="Inserisci IMEI o Numero Seriale..."
                                        />
                                    </div>
                                    <button
                                        onClick={handleCheckImei}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-theme-btn font-medium flex items-center gap-2 transition-colors whitespace-nowrap"
                                        title="Controlla se il dispositivo è bloccato o rubato"
                                    >
                                        <ExternalLink size={18} />
                                        Verifica (Gratis)
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1 ml-1">Digita *#06# sul dispositivo per vedere l'IMEI, oppure controlla sim tray / scocca.</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 ml-1">Problema / Guasto</label>
                                <input
                                    type="text"
                                    value={problemDescription}
                                    onChange={(e) => setProblemDescription(e.target.value)}
                                    placeholder="es. Schermo rotto, Batteria..."
                                    className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-4 text-theme-text focus:border-theme-primary/50 focus:outline-none"
                                />
                                <div className="flex flex-wrap gap-1.5 mt-2 select-none">
                                    {['Vetro/LCD Rotto', 'Batteria Degradata', 'Non Carica', 'Non Si Accende', 'Danno da Liquido', 'Problema Software'].map(symptom => (
                                        <button
                                            key={symptom}
                                            type="button"
                                            onClick={() => {
                                                soundService.playClick();
                                                setProblemDescription(prev => {
                                                    const trimmed = prev.trim();
                                                    if (!trimmed) return symptom;
                                                    if (trimmed.toLowerCase().includes(symptom.toLowerCase())) return prev;
                                                    return `${trimmed}, ${symptom}`;
                                                });
                                            }}
                                            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-[11px] text-gray-400 hover:text-white rounded border border-white/5 transition-colors"
                                        >
                                            {symptom}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 ml-1">Note Aggiuntive</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Graffi presenti..."
                                    className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-4 text-theme-text focus:border-theme-primary/50 focus:outline-none h-24 resize-none"
                                />
                            </div>

                            {/* Blocco Dispositivo */}
                            <div className="border-t border-theme-panelBorder pt-4 mt-4 space-y-4">
                                <div>
                                    <label className="text-sm text-gray-400 ml-1 font-semibold block mb-2">Sicurezza / Sblocco Dispositivo</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => { setLockType('none'); setLockCode(''); }}
                                            className={`py-2 px-3 rounded-theme-btn text-xs font-bold transition-all border ${
                                                lockType === 'none'
                                                    ? 'bg-theme-primary text-theme-primaryContent border-theme-primary shadow-[0_0_10px_rgba(234,179,8,0.2)]'
                                                    : 'bg-theme-panel border-theme-panelBorder text-gray-400 hover:bg-white/5'
                                            }`}
                                        >
                                            Nessuno
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setLockType('pin'); setLockCode(''); }}
                                            className={`py-2 px-3 rounded-theme-btn text-xs font-bold transition-all border ${
                                                lockType === 'pin'
                                                    ? 'bg-theme-primary text-theme-primaryContent border-theme-primary shadow-[0_0_10px_rgba(234,179,8,0.2)]'
                                                    : 'bg-theme-panel border-theme-panelBorder text-gray-400 hover:bg-white/5'
                                            }`}
                                        >
                                            PIN / Password
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setLockType('pattern'); setLockCode(''); }}
                                            className={`py-2 px-3 rounded-theme-btn text-xs font-bold transition-all border ${
                                                lockType === 'pattern'
                                                    ? 'bg-theme-primary text-theme-primaryContent border-theme-primary shadow-[0_0_10px_rgba(234,179,8,0.2)]'
                                                    : 'bg-theme-panel border-theme-panelBorder text-gray-400 hover:bg-white/5'
                                            }`}
                                        >
                                            Segno Visivo
                                        </button>
                                    </div>
                                </div>

                                {lockType === 'pin' && (
                                    <div className="animate-fade-in">
                                        <label className="text-xs text-gray-400 ml-1">Inserisci PIN o Password</label>
                                        <input
                                            type="text"
                                            value={lockCode}
                                            onChange={(e) => setLockCode(e.target.value)}
                                            placeholder="es. 1234 o password..."
                                            className="w-full bg-[#171717] border border-theme-panelBorder rounded-theme-btn p-3 text-theme-text focus:border-theme-primary/50 focus:outline-none font-mono tracking-widest text-sm"
                                        />
                                    </div>
                                )}

                                {lockType === 'pattern' && (
                                    <div className="animate-fade-in flex flex-col items-center gap-3 p-4 bg-[#171717]/30 border border-theme-panelBorder rounded-theme-panel">
                                        <span className="text-xs text-gray-400">Trascina con il mouse o il dito per disegnare il segno</span>
                                        <InteractivePatternGrid
                                            onChange={(code) => setLockCode(code)}
                                            value={lockCode}
                                        />
                                        <div className="flex gap-2 w-full justify-between items-center mt-2">
                                            <span className="text-xs font-mono text-gray-400">Sequenza: {lockCode || 'Nessuna'}</span>
                                            <button
                                                type="button"
                                                onClick={() => setLockCode('')}
                                                className="text-xs px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded transition-all"
                                            >
                                                Pulisci
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="text-sm text-gray-400 ml-1">Priorità Riparazione</label>
                                    <select
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value)}
                                        className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-4 text-theme-text focus:border-theme-primary/50 focus:outline-none"
                                    >
                                        <option value="low">Bassa</option>
                                        <option value="medium">Media</option>
                                        <option value="high">Alta</option>
                                        <option value="urgent">Urgente</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-400 ml-1">Garanzia Intervento</label>
                                    <select
                                        value={warrantyMonths}
                                        onChange={(e) => setWarrantyMonths(e.target.value)}
                                        className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-4 text-theme-text focus:border-theme-primary/50 focus:outline-none font-semibold"
                                    >
                                        <option value="0">Nessuna</option>
                                        <option value="3">3 Mesi (Standard)</option>
                                        <option value="6">6 Mesi</option>
                                        <option value="12">12 Mesi</option>
                                        <option value="24">24 Mesi</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-400 ml-1">Consegna Prevista</label>
                                    <input
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-4 text-theme-text focus:border-theme-primary/50 focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Checklist Diagnostica (Pre-Riparazione) */}
                    <div className="glass-panel p-6 rounded-theme-panel">
                        <h2 className="text-xl font-bold text-theme-text mb-4 flex items-center gap-2">
                            <ClipboardList size={20} className="text-theme-primary" />
                            Checklist Diagnostica (Pre-Riparazione)
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {Object.entries(checklistItems).map(([key, label]) => (
                                <div key={key} className="flex flex-col justify-between p-3 bg-theme-panel border border-theme-panelBorder rounded-lg gap-2">
                                    <span className="text-sm font-medium text-theme-text">{label}</span>
                                    <div className="grid grid-cols-3 gap-1">
                                        <button
                                            type="button"
                                            onClick={() => setChecklist(prev => ({ ...prev, [key]: 'ok' }))}
                                            className={`py-1.5 rounded text-xs font-bold transition-colors ${checklist[key] === 'ok' ? 'bg-green-500 text-black shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-theme-panel border border-theme-panelBorder text-gray-400 hover:bg-white/5'}`}
                                        >
                                            OK
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setChecklist(prev => ({ ...prev, [key]: 'ko' }))}
                                            className={`py-1.5 rounded text-xs font-bold transition-colors ${checklist[key] === 'ko' ? 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.4)]' : 'bg-theme-panel border border-theme-panelBorder text-gray-400 hover:bg-white/5'}`}
                                        >
                                            KO
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setChecklist(prev => ({ ...prev, [key]: 'nt' }))}
                                            className={`py-1.5 rounded text-xs font-bold transition-colors ${checklist[key] === 'nt' ? 'bg-gray-600 text-white' : 'bg-theme-panel border border-theme-panelBorder text-gray-400 hover:bg-white/5'}`}
                                        >
                                            NT
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN - Repair & Photos */}
                <div className="space-y-8">

                    {/* Repair & Warehouse */}
                    <div className="glass-panel p-6 rounded-theme-panel border border-theme-primary/20">
                        <h2 className="text-xl font-bold text-theme-text mb-4 flex items-center gap-2">
                            <Search size={20} className="text-theme-primary" />
                            Preventivo & Ricambi
                        </h2>

                        <div className="space-y-6">
                            {/* Warehouse Selector Autocomplete */}
                            <div className="space-y-2 relative">
                                <label className="text-sm text-gray-400 ml-1">Cerca Ricambio da Magazzino</label>
                                <div className="relative z-20">
                                     <input
                                         type="text"
                                         value={searchTerm}
                                         onChange={(e) => {
                                             setSearchTerm(e.target.value);
                                             setIsDropdownOpen(true);
                                         }}
                                         onKeyDown={(e) => {
                                             if (e.key === 'Enter') {
                                                 e.preventDefault();
                                                 if (filteredInventory.length > 0) {
                                                     handleAddPart(filteredInventory[0]);
                                                 }
                                             }
                                         }}
                                         onFocus={() => setIsDropdownOpen(true)}
                                         onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                                         placeholder="Cerca ricambio (scrivi nome, marchio, componente...)"
                                         className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 pl-10 text-theme-text focus:border-theme-primary/50 focus:outline-none"
                                     />
                                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                     
                                     {isDropdownOpen && (
                                         <div className="absolute top-full left-0 right-0 mt-2 bg-theme-panel border border-theme-panelBorder rounded-theme-btn shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                                             {filteredInventory.length === 0 ? (
                                                 <div className="p-4 text-gray-500 text-center text-sm">Nessun ricambio trovato per "{searchTerm}".</div>
                                             ) : (
                                                 filteredInventory.map(item => (
                                                     <div
                                                         key={item.id}
                                                         onClick={() => handleAddPart(item)}
                                                         className="p-3 hover:bg-theme-primary/20 cursor-pointer border-b border-theme-panelBorder last:border-0 transition-colors"
                                                     >
                                                         <div className="font-bold text-theme-text text-sm">{item.brand} {item.model} - {item.component}</div>
                                                         <div className="text-xs text-gray-400 font-mono">Disponibilità: {item.unlimited ? 'Servizio (Illimitato)' : `${item.quantity || 0} pz`} - Costo Base: €{item.cost}</div>
                                                     </div>
                                                 ))
                                             )}
                                         </div>
                                     )}
                                </div>
                            </div>

                            {/* Selected Parts List */}
                            {selectedParts.length > 0 && (
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-400 ml-1">Ricambi Selezionati:</label>
                                    {selectedParts.map((part, index) => (
                                         <div key={index} className="flex justify-between items-center bg-theme-panel border border-theme-panelBorder p-3 rounded-lg border border-theme-panelBorder">
                                             <div>
                                                 <div className="text-sm text-theme-text font-medium">{part.name}</div>
                                                 <div className="text-xs text-gray-500">
                                                     Costo: € {part.cost}
                                                     {!part.unlimited && (
                                                         <span className="text-gray-400 ml-2">
                                                             (Ricaricato: € {(parseFloat(part.cost) * (1 + (parseFloat(part.markupPercent) || 0) / 100)).toFixed(2)})
                                                         </span>
                                                     )}
                                                 </div>
                                             </div>
                                             <div className="flex items-center gap-3">
                                                 {!part.unlimited && (
                                                     <div className="flex items-center gap-1">
                                                         <span className="text-[10px] text-gray-400">Ricarico:</span>
                                                         <input
                                                             type="number"
                                                             min="0"
                                                             value={part.markupPercent !== undefined ? part.markupPercent : ''}
                                                             onChange={(e) => {
                                                                 const val = e.target.value === '' ? '' : (parseFloat(e.target.value) || 0);
                                                                 setSelectedParts(prev => prev.map((p, i) => i === index ? { ...p, markupPercent: val } : p));
                                                             }}
                                                             className="w-16 bg-theme-bg border border-theme-panelBorder rounded p-1 text-center text-xs text-theme-text focus:outline-none focus:border-theme-primary font-bold"
                                                             placeholder="%"
                                                             title="Modifica percentuale ricarico"
                                                         />
                                                         <span className="text-xs text-gray-400">%</span>
                                                     </div>
                                                 )}
                                                 <button
                                                     onClick={() => handleRemovePart(index)}
                                                     className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                                 >
                                                     <Trash2 size={16} />
                                                 </button>
                                             </div>
                                         </div>
                                     ))}
                                </div>
                            )}

                            <hr className="border-theme-panelBorder" />

                            {/* Pricing Calculator */}
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-theme-panel p-3 rounded-lg border border-theme-panelBorder text-center col-span-2">
                                        <div className="text-xs text-gray-500 mb-1">Ricarico su Ricambi</div>
                                        <div className="font-bold text-theme-primary">{markupPercent}%</div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Manodopera (Unica)</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-500">€</span>
                                        <input
                                            type="number"
                                            value={laborCost}
                                            onChange={(e) => setLaborCost(e.target.value)}
                                            className="w-24 bg-theme-panel border border-theme-panelBorder rounded-lg p-2 text-right text-theme-text focus:border-theme-primary/50 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Sconto (€)</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-500">- €</span>
                                        <input
                                            type="number"
                                            min="0"
                                            value={discount}
                                            onChange={(e) => setDiscount(e.target.value)}
                                            className="w-24 bg-theme-panel border border-theme-panelBorder rounded-lg p-2 text-right text-theme-text focus:border-theme-primary/50 focus:outline-none font-semibold text-red-400"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400 font-semibold text-emerald-400">Acconto Versato</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-emerald-500 font-semibold">€</span>
                                        <input
                                            type="number"
                                            min="0"
                                            value={deposit}
                                            onChange={(e) => setDeposit(e.target.value)}
                                            className="w-24 bg-theme-panel border border-theme-panelBorder rounded-lg p-2 text-right text-emerald-400 font-semibold focus:border-theme-primary/50 focus:outline-none"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-between items-center text-xs text-gray-500 border-t border-white/5 pt-2">
                                    <span>Saldo da saldare al ritiro:</span>
                                    <span className="font-bold text-gray-300">€ {Math.max(0, (parseFloat(totalCost) || 0) - (parseFloat(deposit) || 0)).toFixed(2)}</span>
                                </div>

                                <div className="p-4 bg-theme-primary/10 rounded-theme-btn border border-theme-primary/20 flex justify-between items-center">
                                    <span className="font-bold text-theme-primary uppercase tracking-wider">Totale Stimato</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl font-bold text-theme-text">€</span>
                                        <input
                                            type="number"
                                            value={isEditingTotal ? totalCost : (parseFloat(totalCost) || 0).toFixed(2)}
                                            onChange={handleTotalCostChange}
                                            onFocus={() => setIsEditingTotal(true)}
                                            onBlur={handleTotalBlur}
                                            className="w-32 bg-theme-panel border border-theme-panelBorder rounded-lg p-2 text-right text-2xl font-bold text-theme-text focus:border-theme-primary/50 focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Photos & PDF */}
                    <div className="glass-panel p-6 rounded-theme-panel">
                        <h2 className="text-xl font-bold text-theme-text mb-4 flex items-center gap-2">
                            <Camera size={20} className="text-theme-primary" />
                            Foto & Documenti
                        </h2>

                        <div className="grid grid-cols-3 gap-4 mb-6">
                            {photos.map((photo, index) => (
                                <div key={index} className="aspect-square rounded-lg overflow-hidden relative group">
                                    <img src={photo} alt="Device preview" className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => removePhoto(index)}
                                        className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-theme-text opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                            <label className="aspect-square rounded-lg border-2 border-dashed border-theme-panelBorder hover:border-theme-primary/50 hover:bg-theme-panel border border-theme-panelBorder transition-all flex flex-col items-center justify-center cursor-pointer text-gray-500 hover:text-theme-text">
                                <Upload size={24} />
                                <span className="text-xs mt-2">Foto</span>
                                <input type="file" multiple accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                            </label>
                        </div>

                        {/* PDF Attachment */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Test Ingresso (PDF)</label>
                            <label className={`w-full flex items-center justify-between p-4 rounded-theme-btn border border-dashed cursor-pointer transition-colors ${pdfIngressPath ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-theme-panel border-theme-panelBorder text-gray-400 hover:border-theme-primary/50'}`}>
                                <div className="flex items-center gap-3">
                                    <FileText size={20} />
                                    <span className="truncate max-w-[200px]">{pdfIngressPath ? pdfIngressPath.name || "PDF Allegato" : "Allega Test Ingresso"}</span>
                                </div>
                                <input
                                    type="file"
                                    accept="application/pdf"
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files[0]) {
                                            // Store the full path if available (Electron) or just the file object to simulate
                                            // For this web view mock, we might only get the name, but in the real app with Electron we'd want the path.
                                            // We will stick to the file object/name for now as 'path' is security restricted in browser but available in Electron context often.
                                            // To ensure it works in the "Portable" build which is likely Electron-based:
                                            const file = e.target.files[0];
                                            setPdfIngressPath(file.path || file.name); // file.path works in Electron
                                        }
                                    }}
                                />
                                {pdfIngressPath && <CheckCircle size={18} />}
                            </label>
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        className="w-full bg-theme-primary hover:bg-theme-primary text-theme-primaryContent font-bold py-4 rounded-theme-btn transition-all active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(250,204,21,0.2)] hover:shadow-[0_0_30px_rgba(250,204,21,0.4)]"
                    >
                        <Save size={20} />
                        Registra Riparazione
                    </button>

                </div>
            </div>
        </div>
    );
};

export default CheckIn;
