/**
 * Phase 9+: Automated AndroidManifest.xml + Custom Launcher Icon Installer
 */
import fs from 'fs';
import path from 'path';

const manifestPath = path.join(process.cwd(), 'android', 'app', 'src', 'main', 'AndroidManifest.xml');

if (fs.existsSync(manifestPath)) {
    let xml = fs.readFileSync(manifestPath, 'utf-8');

    if (!xml.includes('android:screenOrientation="portrait"')) {
        xml = xml.replace(
            'android:name=".MainActivity"',
            'android:name=".MainActivity"\n            android:screenOrientation="portrait"'
        );
    }

    const admobAppId = process.env.ADMOB_APP_ID || 'ca-app-pub-3940256099942544~3347511713';
    const metaTag = `
        <meta-data
            android:name="com.google.android.gms.ads.APPLICATION_ID"
            android:value="${admobAppId}"/>
    </application>`;

    if (!xml.includes('com.google.android.gms.ads.APPLICATION_ID')) {
        xml = xml.replace('</application>', metaTag);
    }

    fs.writeFileSync(manifestPath, xml, 'utf-8');
    console.log('Successfully configured AndroidManifest.xml (Portrait Lock + AdMob App ID)!');
}

// Automatically install icon.png into all Android mipmap launcher folders if present
const customIconPath = path.join(process.cwd(), 'icon.png');
const resDir = path.join(process.cwd(), 'android', 'app', 'src', 'main', 'res');

if (fs.existsSync(customIconPath) && fs.existsSync(resDir)) {
    const mipmapDirs = ['mipmap-mdpi', 'mipmap-hdpi', 'mipmap-xhdpi', 'mipmap-xxhdpi', 'mipmap-xxxhdpi'];
    for (const dir of mipmapDirs) {
        const targetDir = path.join(resDir, dir);
        if (fs.existsSync(targetDir)) {
            fs.copyFileSync(customIconPath, path.join(targetDir, 'ic_launcher.png'));
            fs.copyFileSync(customIconPath, path.join(targetDir, 'ic_launcher_round.png'));
            fs.copyFileSync(customIconPath, path.join(targetDir, 'ic_launcher_foreground.png'));
        }
    }
    console.log('Successfully installed custom Launcher Icon (icon.png) into all Android mipmap folders!');
}