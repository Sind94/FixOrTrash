export const deviceTypes = [
    { id: 'smartphone', label: 'Smartphone' },
    { id: 'tablet', label: 'Tablet' },
    { id: 'pc', label: 'PC / Laptop' },
    { id: 'console', label: 'Console' },
    { id: 'other', label: 'Altro' },
];

export const componentsList = [
    { id: 'screen', label: 'Schermo / LCD' },
    { id: 'battery', label: 'Batteria' },
    { id: 'charging_port', label: 'Connettore Ricarica' },
    { id: 'camera_rear', label: 'Fotocamera Posteriore' },
    { id: 'camera_front', label: 'Fotocamera Anteriore' },
    { id: 'back_cover', label: 'Scocca Posteriore' },
    { id: 'speaker', label: 'Altoparlante / Speaker' },
    { id: 'microphone', label: 'Microfono' },
    { id: 'buttons', label: 'Tasti Volume/Accensione' },
];

// Expanded database (GSMArena - 2016-2024+)
export const brandData = {
    smartphone: {
        apple: {
            label: 'Apple',
            models: [
                'iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15 Plus', 'iPhone 15',
                'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14 Plus', 'iPhone 14', 'iPhone SE (2022)',
                'iPhone 13 Pro Max', 'iPhone 13 Pro', 'iPhone 13', 'iPhone 13 mini',
                'iPhone 12 Pro Max', 'iPhone 12 Pro', 'iPhone 12', 'iPhone 12 mini', 'iPhone SE (2020)',
                'iPhone 11 Pro Max', 'iPhone 11 Pro', 'iPhone 11',
                'iPhone XS Max', 'iPhone XS', 'iPhone XR', 'iPhone X',
                'iPhone 8 Plus', 'iPhone 8', 'iPhone 7 Plus', 'iPhone 7',
                'iPhone 6s Plus', 'iPhone 6s', 'iPhone 6 Plus', 'iPhone 6', 'iPhone SE'
            ]
        },
        samsung: {
            label: 'Samsung',
            models: [
                'Galaxy S24 Ultra', 'Galaxy S24+', 'Galaxy S24',
                'Galaxy S23 Ultra', 'Galaxy S23+', 'Galaxy S23', 'Galaxy S23 FE',
                'Galaxy S22 Ultra', 'Galaxy S22+', 'Galaxy S22',
                'Galaxy S21 Ultra', 'Galaxy S21+', 'Galaxy S21', 'Galaxy S21 FE 5G',
                'Galaxy S20 Ultra', 'Galaxy S20+', 'Galaxy S20', 'Galaxy S20 FE', 'Galaxy S20 FE 5G',
                'Galaxy S10+', 'Galaxy S10', 'Galaxy S10e', 'Galaxy S10 Lite', 'Galaxy S10 5G',
                'Galaxy S9+', 'Galaxy S9', 'Galaxy S8+', 'Galaxy S8', 'Galaxy S7 edge', 'Galaxy S7',
                'Galaxy Note 20 Ultra', 'Galaxy Note 20',
                'Galaxy Note 10+', 'Galaxy Note 10', 'Galaxy Note 10 Lite',
                'Galaxy Note 9', 'Galaxy Note 8',
                'Galaxy Z Fold 5', 'Galaxy Z Flip 5',
                'Galaxy Z Fold 4', 'Galaxy Z Flip 4',
                'Galaxy Z Fold 3', 'Galaxy Z Flip 3',
                'Galaxy Z Fold 2', 'Galaxy Z Flip',
                'Galaxy A55', 'Galaxy A35',
                'Galaxy A54', 'Galaxy A34', 'Galaxy A24', 'Galaxy A14',
                'Galaxy A53', 'Galaxy A33', 'Galaxy A23', 'Galaxy A13', 'Galaxy A04s', 'Galaxy A04',
                'Galaxy A52s 5G', 'Galaxy A52', 'Galaxy A72', 'Galaxy A32', 'Galaxy A22', 'Galaxy A12', 'Galaxy A02s',
                'Galaxy A71', 'Galaxy A51', 'Galaxy A41', 'Galaxy A31', 'Galaxy A21s', 'Galaxy A11',
                'Galaxy A70', 'Galaxy A50', 'Galaxy A40', 'Galaxy A30', 'Galaxy A20e', 'Galaxy A10',
                'Galaxy A9 (2018)', 'Galaxy A7 (2018)',
                'Galaxy M55', 'Galaxy M34', 'Galaxy M14', 'Galaxy M52 5G', 'Galaxy M32', 'Galaxy M22', 'Galaxy M12',
                'Galaxy M51', 'Galaxy M31s', 'Galaxy M31', 'Galaxy M21', 'Galaxy M11',
                'Galaxy J7 (2017)', 'Galaxy J5 (2017)', 'Galaxy J3 (2017)', 'Galaxy J6', 'Galaxy J4+'
            ]
        },
        xiaomi: {
            label: 'Xiaomi / Redmi / POCO',
            models: [
                'Xiaomi 14 Ultra', 'Xiaomi 14',
                'Xiaomi 13 Ultra', 'Xiaomi 13 Pro', 'Xiaomi 13', 'Xiaomi 13 Lite',
                'Xiaomi 12T Pro', 'Xiaomi 12T',
                'Xiaomi 12 Pro', 'Xiaomi 12', 'Xiaomi 12X', 'Xiaomi 12 Lite',
                'Xiaomi 11T Pro', 'Xiaomi 11T', 'Mi 11 Ultra', 'Mi 11', 'Mi 11 Lite 5G NE', 'Mi 11 Lite',
                'Mi 10T Pro', 'Mi 10T', 'Mi 10T Lite',
                'Mi 10 Pro', 'Mi 10', 'Mi 10 Lite', 'Mi Note 10 Pro', 'Mi Note 10', 'Mi Note 10 Lite',
                'Mi 9', 'Mi 9T Pro', 'Mi 9T', 'Mi 9 SE', 'Mi 9 Lite',
                'Mi 8 Pro', 'Mi 8', 'Mi 8 Lite', 'Mi A3', 'Mi A2', 'Mi A2 Lite',
                'Redmi Note 13 Pro+', 'Redmi Note 13 Pro', 'Redmi Note 13',
                'Redmi Note 12 Pro+', 'Redmi Note 12 Pro', 'Redmi Note 12', 'Redmi Note 12 5G',
                'Redmi Note 11 Pro+', 'Redmi Note 11 Pro', 'Redmi Note 11', 'Redmi Note 11S',
                'Redmi Note 10 Pro', 'Redmi Note 10', 'Redmi Note 10S', 'Redmi Note 10 5G',
                'Redmi Note 9 Pro', 'Redmi Note 9S', 'Redmi Note 9', 'Redmi Note 9T',
                'Redmi Note 8 Pro', 'Redmi Note 8T', 'Redmi Note 8', 'Redmi Note 8 (2021)',
                'Redmi Note 7', 'Redmi Note 6 Pro', 'Redmi Note 5',
                'Redmi 13C', 'Redmi 12', 'Redmi 10', 'Redmi 9', 'Redmi 9A', 'Redmi 9C', 'Redmi 8', 'Redmi 8A', 'Redmi 7', 'Redmi 7A',
                'POCO F5 Pro', 'POCO F5', 'POCO F4 GT', 'POCO F4', 'POCO F3', 'POCO F2 Pro', 'POCO F1',
                'POCO X6 Pro', 'POCO X6', 'POCO X5 Pro', 'POCO X5', 'POCO X4 GT', 'POCO X4 Pro 5G', 'POCO X3 Pro', 'POCO X3 NFC',
                'POCO M6 Pro', 'POCO M5', 'POCO M4 Pro', 'POCO M3', 'POCO C65', 'POCO C40'
            ]
        },
        google: {
            label: 'Google',
            models: [
                'Pixel 8 Pro', 'Pixel 8',
                'Pixel 7 Pro', 'Pixel 7', 'Pixel 7a',
                'Pixel 6 Pro', 'Pixel 6', 'Pixel 6a',
                'Pixel 5', 'Pixel 4a 5G', 'Pixel 4a', 'Pixel 4 XL', 'Pixel 4',
                'Pixel 3a XL', 'Pixel 3a', 'Pixel 3 XL', 'Pixel 3',
                'Pixel 2 XL', 'Pixel 2'
            ]
        },
        oneplus: {
            label: 'OnePlus',
            models: [
                'OnePlus 12', 'OnePlus 12R',
                'OnePlus 11', 'OnePlus 10 Pro', 'OnePlus 10T',
                'OnePlus 9 Pro', 'OnePlus 9',
                'OnePlus 8 Pro', 'OnePlus 8T', 'OnePlus 8',
                'OnePlus 7T Pro', 'OnePlus 7T', 'OnePlus 7 Pro', 'OnePlus 7',
                'OnePlus 6T', 'OnePlus 6', 'OnePlus 5T', 'OnePlus 5',
                'OnePlus Nord 3', 'OnePlus Nord 2T', 'OnePlus Nord 2', 'OnePlus Nord CE 3', 'OnePlus Nord CE 2', 'OnePlus Nord N10', 'OnePlus Nord N100', 'OnePlus Nord'
            ]
        },
        oppo: {
            label: 'Oppo',
            models: [
                'Find X7 Ultra', 'Find X6 Pro', 'Find X5 Pro', 'Find X5', 'Find X5 Lite',
                'Find X3 Pro', 'Find X3 Neo', 'Find X3 Lite',
                'Find X2 Pro', 'Find X2',
                'Reno 10 Pro', 'Reno 10', 'Reno 8 Pro', 'Reno 8', 'Reno 8 Lite',
                'Reno 6 Pro', 'Reno 6 5G', 'Reno 4 Pro', 'Reno 4 Z', 'Reno 2',
                'A98', 'A78', 'A58', 'A96', 'A76', 'A94', 'A74', 'A54', 'A53', 'A16', 'A15'
            ]
        },
        realme: {
            label: 'Realme',
            models: [
                'Realme GT 6', 'Realme GT 5', 'Realme GT 2 Pro', 'Realme GT Neo 3', 'Realme GT Master',
                'Realme 12 Pro+', 'Realme 12 Pro', 'Realme 11 Pro+', 'Realme 11 Pro',
                'Realme 10', 'Realme 9 Pro+', 'Realme 9', 'Realme 8 Pro', 'Realme 8',
                'Realme 7 Pro', 'Realme 7', 'Realme 6 Pro', 'Realme 6'
            ]
        },
        huawei: {
            label: 'Huawei',
            models: [
                'Pura 70 Ultra', 'Pura 70',
                'P60 Pro', 'P50 Pro', 'P40 Pro', 'P40 Lite', 'P30 Pro', 'P30', 'P30 Lite', 'P20 Pro', 'P20', 'P20 Lite',
                'Mate 60 Pro', 'Mate 50 Pro', 'Mate 40 Pro', 'Mate 20 Pro', 'Mate 20 Lite', 'Mate 10 Pro',
                'Nova 11', 'Nova 10', 'Nova 9', 'Nova 5T', 'P Smart 2021', 'P Smart 2019'
            ]
        },
        honor: {
            label: 'Honor',
            models: [
                'Magic 6 Pro', 'Magic 5 Pro', 'Magic 4 Pro',
                'Honor 90', 'Honor 70', 'Honor 50', 'Honor 20', 'Honor 10',
                'Honor Magic V2', 'Honor X8', 'Honor X7'
            ]
        },
        sony: {
            label: 'Sony',
            models: [
                'Xperia 1 VI', 'Xperia 1 V', 'Xperia 1 IV', 'Xperia 1 III', 'Xperia 1 II', 'Xperia 1',
                'Xperia 5 V', 'Xperia 5 IV', 'Xperia 5 III', 'Xperia 5 II', 'Xperia 5',
                'Xperia 10 VI', 'Xperia 10 V', 'Xperia 10 IV', 'Xperia 10 III', 'Xperia 10 II'
            ]
        },
        motorola: {
            label: 'Motorola',
            models: [
                'Edge 50 Ultra', 'Edge 50 Pro', 'Edge 40 Pro', 'Edge 40', 'Edge 30 Ultra', 'Edge 30 Fusion', 'Edge 30', 'Edge 20 Pro',
                'Razr 40 Ultra', 'Razr 40', 'Razr 2022',
                'Moto G84', 'Moto G54', 'Moto G82', 'Moto G72', 'Moto G52', 'Moto G42', 'Moto G22',
                'Moto G9 Plus', 'Moto G8 Power', 'Moto G7 Power'
            ]
        },
        nokia: {
            label: 'Nokia',
            models: [
                'Nokia G42', 'Nokia X30', 'Nokia G60', 'Nokia G21', 'Nokia G11',
                'Nokia 7.2', 'Nokia 6.2', 'Nokia 5.4', 'Nokia 3.4', 'Nokia 3310 (2017)'
            ]
        },
        nothing: {
            label: 'Nothing',
            models: [
                'Phone (2)', 'Phone (2a)', 'Phone (1)'
            ]
        },
        asus: {
            label: 'Asus',
            models: [
                'Zenfone 11 Ultra', 'Zenfone 10', 'Zenfone 9', 'Zenfone 8', 'Zenfone 7 Pro', 'Zenfone 6',
                'ROG Phone 8 Pro', 'ROG Phone 7 Ultimate', 'ROG Phone 6', 'ROG Phone 5', 'ROG Phone 3'
            ]
        },
        other: {
            label: 'Altro',
            models: ['Altro']
        }
    },
    tablet: {
        apple: {
            label: 'Apple',
            models: [
                'iPad Pro 13 (M4)', 'iPad Pro 11 (M4)',
                'iPad Pro 12.9 (6th Gen)', 'iPad Pro 11 (4th Gen)',
                'iPad Pro 12.9 (5th Gen)', 'iPad Pro 11 (3rd Gen)',
                'iPad Pro 12.9 (4th Gen)', 'iPad Pro 11 (2nd Gen)',
                'iPad Air 13 (M2)', 'iPad Air 11 (M2)',
                'iPad Air (5th Gen)', 'iPad Air (4th Gen)', 'iPad Air (3rd Gen)',
                'iPad (10th Gen)', 'iPad (9th Gen)', 'iPad (8th Gen)', 'iPad (7th Gen)',
                'iPad mini (6th Gen)', 'iPad mini (5th Gen)'
            ]
        },
        samsung: {
            label: 'Samsung',
            models: [
                'Galaxy Tab S9 Ultra', 'Galaxy Tab S9+', 'Galaxy Tab S9', 'Galaxy Tab S9 FE',
                'Galaxy Tab S8 Ultra', 'Galaxy Tab S8+', 'Galaxy Tab S8',
                'Galaxy Tab S7+', 'Galaxy Tab S7', 'Galaxy Tab S6 Lite',
                'Galaxy Tab A9+', 'Galaxy Tab A9', 'Galaxy Tab A8', 'Galaxy Tab A7'
            ]
        },
        lenovo: {
            label: 'Lenovo',
            models: [
                'Tab P12 Pro', 'Tab P11 Pro Gen 2', 'Tab P11 Gen 2', 'Tab M10 Plus Gen 3'
            ]
        },
        amazon: {
            label: 'Amazon',
            models: [
                'Fire Max 11', 'Fire HD 10', 'Fire HD 8', 'Fire 7'
            ]
        },
        other: {
            label: 'Altro',
            models: ['Altro']
        }
    },
    pc: {
        apple: {
            label: 'Apple',
            models: [
                'MacBook Pro 16 (M3)', 'MacBook Pro 14 (M3)', 'MacBook Pro 16 (M2)', 'MacBook Pro 14 (M2)',
                'MacBook Air 15 (M3)', 'MacBook Air 13 (M3)', 'MacBook Air 15 (M2)', 'MacBook Air 13 (M2)', 'MacBook Air (M1)',
                'iMac 24 (M3)', 'Mac mini (M2)', 'Mac Studio'
            ]
        },
        hp: {
            label: 'HP',
            models: ['Pavilion 15', 'Envy x360', 'Spectre x360', 'Omen 16', 'Victus 15', 'EliteBook 840']
        },
        lenovo: {
            label: 'Lenovo',
            models: ['ThinkPad X1 Carbon', 'IdeaPad 5', 'Legion Pro 7i', 'Yoga 9i', 'ThinkBook 15']
        },
        dell: {
            label: 'Dell',
            models: ['XPS 15', 'XPS 13', 'Inspiron 15', 'Alienware m16', 'Latitude 5440']
        },
        asus: {
            label: 'Asus',
            models: ['ZenBook 14', 'Vivobook 15', 'ROG Strix G16', 'TUF Gaming A15', 'Zephyrus G14']
        },
        acer: {
            label: 'Acer',
            models: ['Swift Go 14', 'Nitro 5', 'Predator Helios', 'Aspire 5']
        },
        msi: {
            label: 'MSI',
            models: ['Titan 18 HX', 'Raider GE78', 'Katana 15', 'Cyborg 15', 'Prestige 14']
        },
        microsoft: {
            label: 'Microsoft',
            models: ['Surface Laptop 6', 'Surface Pro 10', 'Surface Laptop Studio 2', 'Surface Go 4']
        },
        other: {
            label: 'Altro',
            models: ['Altro']
        }
    },
    console: {
        nintendo: {
            label: 'Nintendo',
            models: ['Switch OLED', 'Switch', 'Switch Lite', 'Wii U', 'Wii', '3DS', '2DS XL', '2DS', 'NDS']
        },
        sony: {
            label: 'Sony',
            models: ['PlayStation 5 Pro', 'PlayStation 5 Slim', 'PlayStation 5', 'PlayStation 4 Pro', 'PlayStation 4 Slim', 'PlayStation 4', 'PlayStation 3', 'PS Vita', 'PSP']
        },
        microsoft: {
            label: 'Microsoft',
            models: ['Xbox Series X', 'Xbox Series S', 'Xbox One X', 'Xbox One S', 'Xbox One', 'Xbox 360']
        },
        valve: {
            label: 'Valve',
            models: ['Steam Deck OLED', 'Steam Deck']
        },
        asus: {
            label: 'Asus',
            models: ['ROG Ally X', 'ROG Ally']
        },
        lenovo: {
            label: 'Lenovo',
            models: ['Legion Go']
        },
        other: {
            label: 'Altro',
            models: ['Altro']
        }
    },
    other: {
        other: {
            label: 'Altro',
            models: ['Altro']
        }
    }
};
