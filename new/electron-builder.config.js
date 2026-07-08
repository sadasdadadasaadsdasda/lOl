/** @type {import('electron-builder').Configuration} */
const config = {
  appId: 'com.ollama.desktop',
  productName: 'Ollama Desktop',
  directories: {
    output: 'dist',
  },
  files: [
    'dist/**/*',
    'resources/**/*',
  ],
  extraResources: [
    {
      from: 'resources/**/*',
      to: 'resources',
    },
  ],
  win: {
    target: ['nsis', 'portable'],
    icon: 'resources/icon.ico',
  },
  mac: {
    target: ['dmg', 'zip'],
    icon: 'resources/icon.icns',
    entitlements: {
      'com.apple.security.cs.allow-unsigned-executable-memory': true,
    },
    extendInfo: {
      NSRequiresAqua: true,
    },
  },
  linux: {
    target: ['AppImage', 'deb', 'rpm'],
    icon: 'resources/icon.png',
    category: 'Development',
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    installerIcon: 'resources/icon.ico',
    uninstallerIcon: 'resources/icon.ico',
    installerHeaderIcon: 'resources/icon.ico',
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'Ollama Desktop',
  },
  dmg: {
    icon: 'resources/icon.icns',
    iconSize: 128,
    contents: [
      {
        x: 410,
        y: 150,
        type: 'link',
        path: '/Applications',
      },
      {
        x: 130,
        y: 150,
        type: 'file',
      },
    ],
  },
  portable: {
    artifactName: 'Ollama-Desktop-Portable-${version}.${ext}',
  },
  publish: null,
};

export default config;
