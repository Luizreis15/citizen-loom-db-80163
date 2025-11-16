const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const INPUT_LOGO = path.join(__dirname, '../src/assets/logo-digital-hera.png');
const OUTPUT_DIR = path.join(__dirname, 'resources');
const SPLASH_BG_COLOR = '#8B5CF6';

// Android icon sizes
const ANDROID_ICON_SIZES = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192
};

// iOS icon sizes
const IOS_ICON_SIZES = [
  20, 29, 40, 58, 60, 76, 80, 87, 120, 152, 167, 180, 1024
];

// Android splash sizes
const ANDROID_SPLASH_SIZES = {
  'drawable-land-mdpi': { width: 480, height: 320 },
  'drawable-land-hdpi': { width: 800, height: 480 },
  'drawable-land-xhdpi': { width: 1280, height: 720 },
  'drawable-land-xxhdpi': { width: 1600, height: 960 },
  'drawable-land-xxxhdpi': { width: 1920, height: 1280 },
  'drawable-port-mdpi': { width: 320, height: 480 },
  'drawable-port-hdpi': { width: 480, height: 800 },
  'drawable-port-xhdpi': { width: 720, height: 1280 },
  'drawable-port-xxhdpi': { width: 960, height: 1600 },
  'drawable-port-xxxhdpi': { width: 1280, height: 1920 }
};

// iOS splash sizes
const IOS_SPLASH_SIZES = [
  { width: 2048, height: 2732, name: 'Default@2x~universal~anyany.png' },
  { width: 1668, height: 2388, name: 'Default@2x~universal~comany.png' },
  { width: 2732, height: 2048, name: 'Default@2x~universal~comcom.png' },
  { width: 1136, height: 640, name: 'Default-568h@2x~iphone.png' },
  { width: 1334, height: 750, name: 'Default-667h.png' },
  { width: 2208, height: 1242, name: 'Default-736h.png' },
  { width: 2436, height: 1125, name: 'Default-Landscape-2436h.png' },
  { width: 2048, height: 1536, name: 'Default-Landscape@2x~ipad.png' },
  { width: 1024, height: 768, name: 'Default-Landscape~ipad.png' },
  { width: 1536, height: 2048, name: 'Default-Portrait@2x~ipad.png' },
  { width: 768, height: 1024, name: 'Default-Portrait~ipad.png' },
  { width: 640, height: 960, name: 'Default@2x~iphone.png' },
  { width: 320, height: 480, name: 'Default~iphone.png' }
];

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function generateIcon() {
  console.log('📱 Gerando ícone principal (1024x1024)...');
  
  const iconPath = path.join(OUTPUT_DIR, 'icon.png');
  await ensureDir(OUTPUT_DIR);
  
  await sharp(INPUT_LOGO)
    .resize(1024, 1024, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toFile(iconPath);
  
  console.log('✅ Ícone principal criado:', iconPath);
  return iconPath;
}

async function generateSplash() {
  console.log('🎨 Gerando splash screen (2732x2732)...');
  
  const splashPath = path.join(OUTPUT_DIR, 'splash.png');
  await ensureDir(OUTPUT_DIR);
  
  // Criar imagem com fundo roxo
  const splashSize = 2732;
  const logoSize = Math.floor(splashSize * 0.4); // Logo ocupa 40% da altura
  
  // Redimensionar logo
  const logoBuffer = await sharp(INPUT_LOGO)
    .resize(logoSize, logoSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer();
  
  // Criar fundo roxo e compor com logo
  await sharp({
    create: {
      width: splashSize,
      height: splashSize,
      channels: 4,
      background: SPLASH_BG_COLOR
    }
  })
  .composite([{
    input: logoBuffer,
    gravity: 'center'
  }])
  .png()
  .toFile(splashPath);
  
  console.log('✅ Splash screen criado:', splashPath);
  return splashPath;
}

async function generateAndroidIcons(iconPath) {
  console.log('🤖 Gerando ícones Android...');
  
  for (const [folder, size] of Object.entries(ANDROID_ICON_SIZES)) {
    const outputDir = path.join(OUTPUT_DIR, 'android', folder);
    await ensureDir(outputDir);
    
    const outputPath = path.join(outputDir, 'ic_launcher.png');
    await sharp(iconPath)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    
    // Criar também ic_launcher_round
    const roundPath = path.join(outputDir, 'ic_launcher_round.png');
    await sharp(iconPath)
      .resize(size, size)
      .png()
      .toFile(roundPath);
    
    console.log(`  ✓ ${folder}: ${size}x${size}`);
  }
  
  console.log('✅ Ícones Android gerados');
}

async function generateAndroidSplashes(splashPath) {
  console.log('🤖 Gerando splash screens Android...');
  
  for (const [folder, { width, height }] of Object.entries(ANDROID_SPLASH_SIZES)) {
    const outputDir = path.join(OUTPUT_DIR, 'android', folder);
    await ensureDir(outputDir);
    
    const outputPath = path.join(outputDir, 'splash.png');
    
    // Calcular tamanho do logo proporcional
    const logoSize = Math.floor(Math.min(width, height) * 0.4);
    
    // Redimensionar logo
    const logoBuffer = await sharp(INPUT_LOGO)
      .resize(logoSize, logoSize, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toBuffer();
    
    // Criar splash com fundo roxo
    await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: SPLASH_BG_COLOR
      }
    })
    .composite([{
      input: logoBuffer,
      gravity: 'center'
    }])
    .png()
    .toFile(outputPath);
    
    console.log(`  ✓ ${folder}: ${width}x${height}`);
  }
  
  console.log('✅ Splash screens Android gerados');
}

async function generateIOSIcons(iconPath) {
  console.log('🍎 Gerando ícones iOS...');
  
  const outputDir = path.join(OUTPUT_DIR, 'ios', 'AppIcon.appiconset');
  await ensureDir(outputDir);
  
  for (const size of IOS_ICON_SIZES) {
    const outputPath = path.join(outputDir, `icon-${size}.png`);
    await sharp(iconPath)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    
    console.log(`  ✓ ${size}x${size}`);
  }
  
  // Criar Contents.json
  const contentsJson = {
    images: IOS_ICON_SIZES.map(size => ({
      size: `${size}x${size}`,
      idiom: 'universal',
      filename: `icon-${size}.png`,
      scale: '1x'
    })),
    info: {
      version: 1,
      author: 'xcode'
    }
  };
  
  fs.writeFileSync(
    path.join(outputDir, 'Contents.json'),
    JSON.stringify(contentsJson, null, 2)
  );
  
  console.log('✅ Ícones iOS gerados');
}

async function generateIOSSplashes(splashPath) {
  console.log('🍎 Gerando splash screens iOS...');
  
  const outputDir = path.join(OUTPUT_DIR, 'ios', 'Splash.imageset');
  await ensureDir(outputDir);
  
  for (const { width, height, name } of IOS_SPLASH_SIZES) {
    const outputPath = path.join(outputDir, name);
    
    // Calcular tamanho do logo proporcional
    const logoSize = Math.floor(Math.min(width, height) * 0.4);
    
    // Redimensionar logo
    const logoBuffer = await sharp(INPUT_LOGO)
      .resize(logoSize, logoSize, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toBuffer();
    
    // Criar splash com fundo roxo
    await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: SPLASH_BG_COLOR
      }
    })
    .composite([{
      input: logoBuffer,
      gravity: 'center'
    }])
    .png()
    .toFile(outputPath);
    
    console.log(`  ✓ ${name}: ${width}x${height}`);
  }
  
  // Criar Contents.json
  const contentsJson = {
    images: IOS_SPLASH_SIZES.map(({ name }) => ({
      idiom: 'universal',
      filename: name,
      scale: '1x'
    })),
    info: {
      version: 1,
      author: 'xcode'
    }
  };
  
  fs.writeFileSync(
    path.join(outputDir, 'Contents.json'),
    JSON.stringify(contentsJson, null, 2)
  );
  
  console.log('✅ Splash screens iOS gerados');
}

async function copyAssetsToNativeProjects() {
  console.log('📦 Copiando assets para projetos nativos...');
  
  // Android
  const androidPath = path.join(__dirname, 'android');
  if (fs.existsSync(androidPath)) {
    // Copiar ícones
    for (const [folder] of Object.entries(ANDROID_ICON_SIZES)) {
      const srcDir = path.join(OUTPUT_DIR, 'android', folder);
      const destDir = path.join(androidPath, 'app', 'src', 'main', 'res', folder);
      
      if (fs.existsSync(srcDir)) {
        await ensureDir(destDir);
        fs.readdirSync(srcDir).forEach(file => {
          fs.copyFileSync(
            path.join(srcDir, file),
            path.join(destDir, file)
          );
        });
      }
    }
    
    // Copiar splashes
    for (const [folder] of Object.entries(ANDROID_SPLASH_SIZES)) {
      const srcDir = path.join(OUTPUT_DIR, 'android', folder);
      const destDir = path.join(androidPath, 'app', 'src', 'main', 'res', folder);
      
      if (fs.existsSync(srcDir)) {
        await ensureDir(destDir);
        fs.readdirSync(srcDir).forEach(file => {
          fs.copyFileSync(
            path.join(srcDir, file),
            path.join(destDir, file)
          );
        });
      }
    }
    
    console.log('✅ Assets Android copiados');
  } else {
    console.log('⚠️  Projeto Android não encontrado. Execute: npm run mobile:add:android');
  }
  
  // iOS
  const iosPath = path.join(__dirname, 'ios', 'App', 'App', 'Assets.xcassets');
  if (fs.existsSync(iosPath)) {
    // Copiar ícones
    const iconSrc = path.join(OUTPUT_DIR, 'ios', 'AppIcon.appiconset');
    const iconDest = path.join(iosPath, 'AppIcon.appiconset');
    
    if (fs.existsSync(iconSrc)) {
      await ensureDir(iconDest);
      fs.readdirSync(iconSrc).forEach(file => {
        fs.copyFileSync(
          path.join(iconSrc, file),
          path.join(iconDest, file)
        );
      });
    }
    
    // Copiar splashes
    const splashSrc = path.join(OUTPUT_DIR, 'ios', 'Splash.imageset');
    const splashDest = path.join(iosPath, 'Splash.imageset');
    
    if (fs.existsSync(splashSrc)) {
      await ensureDir(splashDest);
      fs.readdirSync(splashSrc).forEach(file => {
        fs.copyFileSync(
          path.join(splashSrc, file),
          path.join(splashDest, file)
        );
      });
    }
    
    console.log('✅ Assets iOS copiados');
  } else {
    console.log('⚠️  Projeto iOS não encontrado. Execute: npm run mobile:add:ios');
  }
}

async function main() {
  try {
    console.log('🚀 Iniciando geração de assets para mobile...\n');
    
    if (!fs.existsSync(INPUT_LOGO)) {
      console.error('❌ Logo não encontrado:', INPUT_LOGO);
      console.error('   Por favor, certifique-se de que o arquivo existe.');
      process.exit(1);
    }
    
    // Gerar assets principais
    const iconPath = await generateIcon();
    const splashPath = await generateSplash();
    
    console.log('');
    
    // Gerar assets Android
    await generateAndroidIcons(iconPath);
    await generateAndroidSplashes(splashPath);
    
    console.log('');
    
    // Gerar assets iOS
    await generateIOSIcons(iconPath);
    await generateIOSSplashes(splashPath);
    
    console.log('');
    
    // Copiar para projetos nativos
    await copyAssetsToNativeProjects();
    
    console.log('\n✨ Geração de assets concluída com sucesso!');
    console.log('\n📱 Próximos passos:');
    console.log('   1. Execute: npx cap sync');
    console.log('   2. Teste no emulador/dispositivo');
    console.log('   3. Os assets estão em: mobile/resources/\n');
    
  } catch (error) {
    console.error('❌ Erro ao gerar assets:', error.message);
    process.exit(1);
  }
}

main();
