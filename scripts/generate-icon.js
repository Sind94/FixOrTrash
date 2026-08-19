import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import fs from 'fs';

const LOGO_PATH = 'src/assets/logo_denis.jpg';
const OUTPUT_ICO_PATH = 'correct_icon.ico';

async function generateIcon() {
    try {
        console.log(`Loading logo from ${LOGO_PATH}...`);
        
        // Bounding box of content: X: [60, 947], Y: [89, 916]
        // Width = 887, Height = 827
        // Extract and resize logo to 160x150, centering it on a white background with padding
        console.log("Extracting and resizing logo content...");
        const logoContent = await sharp(LOGO_PATH)
            .extract({ left: 60, top: 89, width: 887, height: 827 })
            .resize(160, 150, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
            .toBuffer();

        // Create the background SVG with shadow, gold border, and gloss reflection
        const svgOverlay = `
        <svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <!-- 5-Stop Metallic Gold gradient for borders -->
            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#bf953f" />
              <stop offset="25%" stop-color="#fcf6ba" />
              <stop offset="50%" stop-color="#b38728" />
              <stop offset="75%" stop-color="#fbf5b7" />
              <stop offset="100%" stop-color="#aa771c" />
            </linearGradient>
            
            <!-- Cream/Ivory radial gradient for card background (porcelain effect) -->
            <radialGradient id="ivoryGrad" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
              <stop offset="0%" stop-color="#ffffff" />
              <stop offset="70%" stop-color="#fffef6" />
              <stop offset="100%" stop-color="#fcf7e1" />
            </radialGradient>
            
            <!-- Glow filter for the outer border -->
            <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            
            <!-- Shadow for the inner card -->
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="#000000" flood-opacity="0.35"/>
            </filter>
          </defs>

          <!-- Ambient glow under the icon -->
          <circle cx="128" cy="128" r="114" fill="none" stroke="#f59e0b" stroke-width="10" opacity="0.35" filter="url(#goldGlow)" />

          <!-- Main card background (Ivory, shadowed) -->
          <circle cx="128" cy="128" r="114" fill="url(#ivoryGrad)" filter="url(#shadow)" />
          
          <!-- Elegant concentric gold hairline guides for premium details -->
          <circle cx="128" cy="128" r="102" fill="none" stroke="url(#goldGrad)" stroke-width="1" opacity="0.35" />
          <circle cx="128" cy="128" r="92" fill="none" stroke="url(#goldGrad)" stroke-width="0.5" opacity="0.2" />

          <!-- Outer Gold Border (Thick double ring) -->
          <circle cx="128" cy="128" r="114" fill="none" stroke="url(#goldGrad)" stroke-width="5.5" />
          <circle cx="128" cy="128" r="110" fill="none" stroke="url(#goldGrad)" stroke-width="1.2" opacity="0.85" />
        </svg>
        `;

        // Glass gloss highlight SVG
        const svgGloss = `
        <svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="glassGloss2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#ffffff" stop-opacity="0.45" />
              <stop offset="35%" stop-color="#ffffff" stop-opacity="0.2" />
              <stop offset="100%" stop-color="#ffffff" stop-opacity="0.0" />
            </linearGradient>
            <linearGradient id="glassReflection" x1="100%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stop-color="#ffffff" stop-opacity="0.08" />
              <stop offset="100%" stop-color="#ffffff" stop-opacity="0.0" />
            </linearGradient>
          </defs>
          <!-- Premium 3D glass gloss reflection overlays -->
          <path d="M 14 128 A 114 114 0 0 1 242 128 A 114 80 0 0 0 14 128 Z" fill="url(#glassGloss2)" />
          <path d="M 40 40 A 114 114 0 0 1 216 40 A 114 100 0 0 0 40 40 Z" fill="url(#glassReflection)" />
        </svg>
        `;

        console.log("Compositing components on base transparent canvas...");
        // Composite all elements on a transparent base canvas of 256x256
        const pngBuffer = await sharp({
            create: {
                width: 256,
                height: 256,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            }
        })
        .composite([
            { input: Buffer.from(svgOverlay), top: 0, left: 0 },
            { input: logoContent, top: 53, left: 48 }, // Centered: X: (256-160)/2 = 48, Y: (256-150)/2 = 53
            { input: Buffer.from(svgGloss), top: 0, left: 0 }
        ])
        .png()
        .toBuffer();

        console.log('Converting PNG buffer to ICO format...');
        const icoBuffer = await pngToIco(pngBuffer);

        fs.writeFileSync(OUTPUT_ICO_PATH, icoBuffer);
        console.log(`Success! Icon saved to ${OUTPUT_ICO_PATH}`);

    } catch (error) {
        console.error('Error generating icon:', error.message || error);
        if (error.stack) console.error(error.stack);
        process.exit(1);
    }
}

generateIcon();
