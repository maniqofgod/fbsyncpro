#!/usr/bin/env node

/**
 * Create Icon Script
 * Membuat icon PNG yang valid untuk aplikasi
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function createIcon() {
    try {
        console.log('🎨 Creating application icon...');

        // Create a simple PNG icon with text
        const svgBuffer = `
        <svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
            <rect width="256" height="256" fill="#1877f2"/>
            <text x="128" y="140" font-family="Arial, sans-serif" font-size="100" font-weight="bold" text-anchor="middle" fill="white">R</text>
        </svg>
        `;

        await sharp(Buffer.from(svgBuffer))
            .png()
            .toFile('assets/icon.png');

        console.log('✅ Icon created successfully: assets/icon.png');

        // Also create ICO file for Windows
        await sharp(Buffer.from(svgBuffer))
            .resize(256, 256)
            .png()
            .toFile('assets/icon-256.png');

        await sharp(Buffer.from(svgBuffer))
            .resize(128, 128)
            .png()
            .toFile('assets/icon-128.png');

        await sharp(Buffer.from(svgBuffer))
            .resize(64, 64)
            .png()
            .toFile('assets/icon-64.png');

        await sharp(Buffer.from(svgBuffer))
            .resize(32, 32)
            .png()
            .toFile('assets/icon-32.png');

        console.log('✅ Icon variants created successfully');

    } catch (error) {
        console.error('❌ Error creating icon:', error.message);

        // Fallback: create a minimal valid PNG
        try {
            const minimalPNG = Buffer.from([
                0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
                0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
                0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 pixel
                0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0xF3, 0xFF,
                0x61, 0x00, 0x00, 0x00, 0x0B, 0x49, 0x44, 0x41, // IDAT chunk
                0x54, 0x78, 0x9C, 0x62, 0x00, 0x01, 0x00, 0x00,
                0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
                0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, // IEND chunk
                0x42, 0x60, 0x82
            ]);

            fs.writeFileSync('assets/icon.png', minimalPNG);
            console.log('✅ Minimal PNG icon created as fallback');
        } catch (fallbackError) {
            console.error('❌ Fallback icon creation failed:', fallbackError.message);
        }
    }
}

if (require.main === module) {
    createIcon().catch(error => {
        console.error('💥 Script failed:', error);
        process.exit(1);
    });
}

module.exports = { createIcon };