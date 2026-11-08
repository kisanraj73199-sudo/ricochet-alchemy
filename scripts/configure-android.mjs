/**
 * Phase 9: Automated AndroidManifest.xml Configurator
 * Injects AdMob APPLICATION_ID & Portrait Orientation lock automatically
 * so local builds and GitHub Actions never crash on Android.
 */
import fs from 'fs';
import path from 'path';

const manifestPath = path.join(process.cwd(), 'android', 'app', 'src', 'main', 'AndroidManifest.xml');

if (!fs.existsSync(manifestPath)) {
    console.log('AndroidManifest.xml not found yet. Skipping auto-patch.');
    process.exit(0);
}

let xml = fs.readFileSync(manifestPath, 'utf-8');

// 1. Lock MainActivity to Portrait mode for one-handed mobile gameplay
if (!xml.includes('android:screenOrientation="portrait"')) {
    xml = xml.replace(
        'android:name=".MainActivity"',
        'android:name=".MainActivity"\n            android:screenOrientation="portrait"'
    );
}

// 2. Inject Google AdMob App ID (Uses official Google Test App ID by default; replace with live ID before Play Store launch)
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