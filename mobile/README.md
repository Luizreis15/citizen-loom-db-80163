# 📱 Hera Demandas - Mobile App (Android + iOS)

Este diretório contém a configuração mobile do aplicativo **Hera Demandas** usando **Capacitor**, permitindo executar o SaaS como aplicativo nativo Android e iOS.

---

## 📋 Índice

- [Requisitos do Sistema](#-requisitos-do-sistema)
- [Instalação Inicial](#-instalação-inicial)
- [Desenvolvimento Local](#-desenvolvimento-local)
- [Build para Produção](#-build-para-produção)
- [Publicação nas Lojas](#-publicação-nas-lojas)
- [Atualização de Assets](#-atualização-de-assets)
- [Troubleshooting](#-troubleshooting)

---

## 🔧 Requisitos do Sistema

### Para desenvolvimento Android:

- **Node.js** 20.x ou superior
- **JDK** 17 (recomendado)
- **Android Studio** (última versão estável)
- **Gradle** 8.x (incluído no Android Studio)

### Para desenvolvimento iOS (apenas macOS):

- **Node.js** 20.x ou superior
- **Xcode** 15+ (App Store)
- **CocoaPods** (`sudo gem install cocoapods`)
- **Conta Apple Developer** (para publicação)

---

## 🚀 Instalação Inicial

### 1. Clone o projeto e instale dependências

```bash
git clone https://github.com/Luizreis15/citizen-loom-db-80163.git
cd citizen-loom-db-80163
npm install
```

### 2. Inicialize o Capacitor (já configurado)

O Capacitor já está configurado via `capacitor.config.ts`. Não é necessário rodar `npx cap init`.

### 3. Adicione as plataformas nativas

**Android:**
```bash
npm run mobile:add:android
```

**iOS (apenas macOS):**
```bash
npm run mobile:add:ios
```

### 4. Gere os assets (ícones e splash screens)

```bash
node mobile/generate-assets.js
```

Este comando criará automaticamente:
- Ícones em todas as resoluções para Android e iOS
- Splash screens com fundo roxo (#8B5CF6) e logo centralizado
- Assets organizados em `mobile/resources/`

### 5. Sincronize os assets com os projetos nativos

```bash
npx cap sync
```

---

## 💻 Desenvolvimento Local

### Rodar no Android (Emulador ou Dispositivo)

**Opção 1: Via linha de comando**
```bash
npm run mobile:run:android
```

**Opção 2: Via Android Studio**
```bash
npm run mobile:open:android
```
Então clique em **Run** (▶️) no Android Studio.

### Rodar no iOS (apenas macOS)

**Opção 1: Via linha de comando**
```bash
npm run mobile:run:ios
```

**Opção 2: Via Xcode**
```bash
npm run mobile:open:ios
```
Então clique em **Run** (▶️) no Xcode.

### Live Reload durante desenvolvimento

O app está configurado para carregar a versão online do SaaS:
```
https://citizen-loom-db-80163.public.lovable.app
```

**Vantagens:**
- ✅ Qualquer alteração no SaaS reflete automaticamente no app
- ✅ Não precisa recompilar o app a cada mudança
- ✅ Login e dados sincronizados com a web

**Para alterar a URL:**
Edite `capacitor.config.ts` e rode `npx cap sync`.

---

## 📦 Build para Produção

### Android

#### APK (para testes internos)

```bash
# 1. Build do frontend
npm run build

# 2. Sincronizar com Android
npx cap sync android

# 3. Abrir Android Studio
npm run mobile:open:android

# 4. No Android Studio:
#    - Build > Generate Signed Bundle / APK
#    - Escolha "APK"
#    - Configure keystore (criar se não tiver)
#    - Build > assembleRelease
```

**OU via linha de comando:**
```bash
cd android
./gradlew assembleRelease
# APK gerado em: android/app/build/outputs/apk/release/app-release.apk
```

#### AAB (para Google Play Store)

```bash
cd android
./gradlew bundleRelease
# AAB gerado em: android/app/build/outputs/bundle/release/app-release.aab
```

### iOS (apenas macOS)

```bash
# 1. Build do frontend
npm run build

# 2. Sincronizar com iOS
npx cap sync ios

# 3. Abrir Xcode
npm run mobile:open:ios

# 4. No Xcode:
#    - Selecione "Any iOS Device (arm64)"
#    - Product > Archive
#    - Distribute App > App Store Connect
#    - Siga o assistente de upload
```

---

## 🏪 Publicação nas Lojas

### Google Play Store

#### 1. Criar keystore (primeira vez)

```bash
cd android/app
keytool -genkey -v -keystore hera-release-key.keystore -alias hera-key -keyalg RSA -keysize 2048 -validity 10000
```

#### 2. Configurar assinatura

Edite `android/gradle.properties`:
```properties
HERA_RELEASE_STORE_FILE=hera-release-key.keystore
HERA_RELEASE_KEY_ALIAS=hera-key
HERA_RELEASE_STORE_PASSWORD=sua-senha
HERA_RELEASE_KEY_PASSWORD=sua-senha
```

Edite `android/app/build.gradle`:
```gradle
android {
    signingConfigs {
        release {
            storeFile file(HERA_RELEASE_STORE_FILE)
            storePassword HERA_RELEASE_STORE_PASSWORD
            keyAlias HERA_RELEASE_KEY_ALIAS
            keyPassword HERA_RELEASE_KEY_PASSWORD
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

#### 3. Gerar AAB e publicar

```bash
cd android
./gradlew bundleRelease
```

#### 4. Upload no Google Play Console

1. Acesse: https://play.google.com/console
2. Crie novo app ou selecione existente
3. Produção > Criar nova versão
4. Upload do AAB gerado
5. Preencha metadados (descrição, screenshots, etc.)
6. Enviar para revisão

**Checklist de metadados:**
- [ ] Título: Hera Demandas
- [ ] Descrição curta (80 caracteres)
- [ ] Descrição completa
- [ ] Screenshots (mínimo 2, recomendado 8)
- [ ] Ícone 512x512
- [ ] Feature graphic 1024x500
- [ ] Categoria: Produtividade
- [ ] Classificação etária
- [ ] Política de privacidade (URL)

### App Store (iOS)

#### 1. Configurar certificados

No Xcode:
1. Preferences > Accounts
2. Adicione sua conta Apple Developer
3. Manage Certificates > + > Apple Distribution

#### 2. Configurar App ID

1. Acesse: https://developer.apple.com/account
2. Certificates, IDs & Profiles > Identifiers
3. Registre: `com.heradigital.demandas`

#### 3. Criar app no App Store Connect

1. Acesse: https://appstoreconnect.apple.com
2. My Apps > + > New App
3. Preencha informações:
   - Nome: Hera Demandas
   - Bundle ID: com.heradigital.demandas
   - SKU: herademandas001
   - Idioma principal: Português (Brasil)

#### 4. Build e upload

```bash
# 1. Build e sincronizar
npm run build
npx cap sync ios

# 2. Abrir Xcode
npm run mobile:open:ios

# 3. No Xcode:
#    - Selecione "Generic iOS Device"
#    - Product > Archive
#    - Aguarde build
#    - Distribute App
#    - App Store Connect
#    - Upload
```

#### 5. Enviar para revisão

1. App Store Connect > Meu App > TestFlight
2. Verifique se o build apareceu
3. Preencha metadados na aba "App Store"
4. Enviar para revisão

**Checklist de metadados:**
- [ ] Nome: Hera Demandas
- [ ] Subtítulo (30 caracteres)
- [ ] Descrição
- [ ] Screenshots iPhone (6.5", 5.5")
- [ ] Screenshots iPad (opcional)
- [ ] Ícone 1024x1024 (sem transparência)
- [ ] Categoria: Produtividade
- [ ] Classificação etária
- [ ] Política de privacidade (URL)
- [ ] Termos de uso (URL)

---

## 🎨 Atualização de Assets

### Regenerar ícones e splash screens

Se você alterar o logo (`src/assets/logo-digital-hera.png`):

```bash
# 1. Regenerar assets
node mobile/generate-assets.js

# 2. Sincronizar com projetos nativos
npx cap sync

# 3. Rebuild
npm run mobile:build:android
npm run mobile:build:ios
```

### Alterar cores da splash screen

Edite `mobile/generate-assets.js`:
```javascript
const SPLASH_BG_COLOR = '#8B5CF6'; // Altere aqui
```

Edite `capacitor.config.ts`:
```typescript
SplashScreen: {
  backgroundColor: '#8B5CF6', // Altere aqui
}
```

---

## 🔄 Atualizar URL do servidor

Se você migrar o SaaS para outro domínio (ex: VPS própria):

### Opção 1: Carregar URL online (atual)

Edite `capacitor.config.ts`:
```typescript
server: {
  url: 'https://seu-novo-dominio.com',
  cleartext: true,
  androidScheme: 'https'
}
```

```bash
npx cap sync
```

### Opção 2: Carregar build estático (offline)

Edite `capacitor.config.ts`:
```typescript
server: {
  // Remova a propriedade 'url'
  androidScheme: 'https'
}
```

```bash
npm run build
npx cap sync
```

---

## 🐛 Troubleshooting

### Erro: "Could not find or load main class org.gradle.wrapper.GradleWrapperMain"

**Solução:**
```bash
cd android
./gradlew wrapper --gradle-version 8.4
```

### Erro: "SDK location not found" (Android)

**Solução:**
Crie `android/local.properties`:
```properties
sdk.dir=/Users/SEU_USUARIO/Library/Android/sdk
```
Ou no Windows:
```properties
sdk.dir=C:\\Users\\SEU_USUARIO\\AppData\\Local\\Android\\Sdk
```

### Erro: "No signing certificate iOS" (Xcode)

**Solução:**
1. Xcode > Preferences > Accounts
2. Clique no seu Apple ID
3. Manage Certificates > + > Apple Development
4. Volte ao projeto e selecione o Team

### App não atualiza após mudanças

**Solução:**
```bash
# Limpar cache
npm run build
npx cap sync

# Android
cd android
./gradlew clean

# iOS
cd ios/App
xcodebuild clean
```

### Splash screen não aparece

**Solução:**
```bash
# Regenerar assets
node mobile/generate-assets.js
npx cap sync

# Verificar capacitor.config.ts
# Confirmar que SplashScreen está configurado
```

### Login não persiste

**Causa:** O app usa WebView, então cookies/localStorage funcionam automaticamente.

**Verificar:**
1. A URL do servidor está correta no `capacitor.config.ts`
2. Cookies estão habilitados (já configurado)
3. HTTPS está funcionando

### Performance ruim

**Soluções:**
1. Habilite WebView debug (Android):
   ```bash
   adb shell setprop debug.chromium.webview_devtools_enabled 1
   ```
2. Teste no dispositivo físico (emuladores são mais lentos)
3. Considere usar build estático em vez de carregar URL online

---

## 📊 Estrutura de pastas

```
mobile/
├── README.md                  # Este arquivo
├── generate-assets.js         # Script de geração de assets
├── resources/                 # Assets gerados
│   ├── icon.png              # Ícone principal (1024x1024)
│   ├── splash.png            # Splash principal (2732x2732)
│   ├── android/              # Assets Android
│   │   ├── mipmap-*/         # Ícones
│   │   └── drawable-*/       # Splashes
│   └── ios/                  # Assets iOS
│       ├── AppIcon.appiconset/
│       └── Splash.imageset/
├── android/                  # Projeto Android nativo
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml
│   │   │   ├── res/
│   │   │   │   ├── values/
│   │   │   │   │   ├── strings.xml
│   │   │   │   │   ├── colors.xml
│   │   │   │   │   └── styles.xml
│   │   │   │   ├── mipmap-*/
│   │   │   │   └── drawable-*/
│   │   │   └── java/
│   │   └── build.gradle
│   ├── gradle/
│   ├── build.gradle
│   └── settings.gradle
└── ios/                      # Projeto iOS nativo
    └── App/
        ├── App/
        │   ├── Info.plist
        │   ├── Assets.xcassets/
        │   │   ├── AppIcon.appiconset/
        │   │   └── Splash.imageset/
        │   └── config.xml
        ├── App.xcodeproj/
        └── Podfile
```

---

## 🔗 Links Úteis

- [Documentação Capacitor](https://capacitorjs.com/docs)
- [Google Play Console](https://play.google.com/console)
- [App Store Connect](https://appstoreconnect.apple.com)
- [Android Studio](https://developer.android.com/studio)
- [Xcode](https://developer.apple.com/xcode/)
- [Capacitor Assets Generator](https://github.com/ionic-team/capacitor-assets)

---

## 📝 Notas Importantes

### Sobre a arquitetura:

- **WebView:** O app carrega a versão web do SaaS dentro de um WebView nativo
- **Vantagens:**
  - ✅ Atualizações automáticas (qualquer mudança no SaaS reflete no app)
  - ✅ Código unificado (mesma base para web e mobile)
  - ✅ Login e dados sincronizados
  - ✅ Performance quase nativa (WebView otimizado)

- **Limitações:**
  - ⚠️ Requer conexão com internet (a menos que use build estático + offline)
  - ⚠️ Algumas APIs nativas podem precisar de plugins Capacitor
  - ⚠️ Performance pode variar entre dispositivos

### Sobre atualizações:

**Atualizações de conteúdo (código web):**
- Refletem automaticamente no app (carrega URL online)
- Não precisa republicar nas lojas

**Atualizações de configuração nativa:**
- Mudanças em `capacitor.config.ts`
- Novos ícones/splash
- Novas permissões
- **Requer:** novo build e republicação nas lojas

---

## ✉️ Suporte

Para dúvidas ou problemas:
1. Verifique a seção [Troubleshooting](#-troubleshooting)
2. Consulte a [documentação oficial do Capacitor](https://capacitorjs.com/docs)
3. Abra uma issue no repositório do projeto

---

**Desenvolvido com ❤️ para Hera Digital**
