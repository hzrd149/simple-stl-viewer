# STL Viewer

A modern, web-based STL model viewer built with Lit and Three.js. Perfect for previewing 3D printing models directly in your browser.

## Features

- 🎨 Beautiful, modern UI with gradient design
- 📁 Load STL files from URL or local upload
- 🔗 URL parameter support for direct linking
- 📦 Embeddable web component for external use
- 🎮 Interactive 3D controls (rotate, pan, zoom)
- 📱 Responsive design
- 🌐 CORS proxy support for loading models from restricted sources
- ⚙️ Settings dialog for easy configuration

## Development

### Install Dependencies

```bash
pnpm install
```

### Run Development Server

```bash
pnpm run dev
```

### Build for Production

```bash
pnpm run build
```

## Usage

### Main Application

The main application provides a full UI for loading and viewing STL files:

1. **Via URL**: Enter a URL to an STL file and click "Load URL"
2. **Via Upload**: Click the file input to upload a local STL file
3. **Via Query Parameter**: Add `?src=https://example.com/model.stl` to the URL

Example:

```
http://localhost:5173/?src=https://example.com/model.stl
```

When a model is loaded, it displays in full-page mode with no margins or padding for maximum viewing area. A "Back" button in the upper left corner returns you to the controls.

### CORS Proxy Configuration

If you need to load STL files from sources that have CORS restrictions, you can configure a CORS proxy:

1. Click the **Settings** button (gear icon) in the header
2. Enter your CORS proxy URL in the settings dialog
3. Click **Save**

#### Supported Proxy URL Formats

The CORS proxy URL can use one of three formats:

1. **Direct URL substitution**: `https://proxy.com/<url>`
   - Example: `https://corsproxy.io/?<url>`

2. **Encoded URL substitution**: `https://proxy.com/<encoded_url>`
   - Example: `https://corsproxy.io/?<encoded_url>`
   - Example: `https://api.allorigins.win/raw?url=<encoded_url>`

3. **URL concatenation**: `https://proxy.com/`
   - The target URL will be appended to the proxy URL
   - Example: `https://proxy.com/` → `https://proxy.com/https://example.com/model.stl`

#### Popular CORS Proxies

- `https://corsproxy.io/?<encoded_url>`
- `https://api.allorigins.win/raw?url=<encoded_url>`

#### How It Works

When a CORS proxy is configured:

- For `.onion` and `.i2p` domains: Proxy is tried first, with fallback to direct connection
- For previously failed hosts: Proxy is used directly
- For other hosts: Direct connection is tried first, with automatic fallback to proxy on CORS errors

Settings are persisted in localStorage and will be remembered across sessions.

### Embeddable Component

The viewer can be embedded in any web page using the `<stl-viewer>` web component.

#### Installation

Include the `component.js` file in your HTML:

```html
<script type="module" src="https://hzrd149.github.io/simple-stl-viewer/component.js"></script>
```

#### Basic Usage

The viewer automatically fills its container by default:

```html
<div style="width: 800px; height: 600px;">
  <stl-viewer src="https://example.com/model.stl"></stl-viewer>
</div>
```

Or disable auto-resize to use fixed dimensions:

```html
<stl-viewer
  src="https://example.com/model.stl"
  width="800"
  height="600"
  auto-resize="false"
>
</stl-viewer>
```

#### Properties

- `src` (string): URL of the STL file to load
- `width` (number): Width of the viewer in pixels (default: 800, ignored when auto-resize is enabled)
- `height` (number): Height of the viewer in pixels (default: 600, ignored when auto-resize is enabled)
- `cors-proxy` (string, optional): CORS proxy URL for loading models from restricted sources
- `auto-resize` (boolean, optional): Automatically adjust canvas size to match container dimensions (default: true)

#### Complete Example

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>STL Viewer Demo</title>
    <script type="module" src="https://hzrd149.github.io/simple-stl-viewer/component.js"></script>
  </head>
  <body>
    <h1>My 3D Model</h1>
    <stl-viewer src="https://example.com/model.stl" width="800" height="600">
    </stl-viewer>
  </body>
</html>
```

#### Using with CORS Proxy

If you need to load STL files from sources with CORS restrictions, you can provide a CORS proxy URL directly to the component:

```html
<stl-viewer
  src="https://example.com/model.stl"
  width="800"
  height="600"
  cors-proxy="https://corsproxy.io/?<encoded_url>"
>
</stl-viewer>
```

The `cors-proxy` attribute supports the same three formats as the main application:

1. **Direct URL substitution**: `https://proxy.com/<url>`
2. **Encoded URL substitution**: `https://proxy.com/<encoded_url>`
3. **URL concatenation**: `https://proxy.com/`

When provided, the component will use this proxy for fetching the STL file, with automatic fallback behavior for optimal loading.

#### Auto-Resize Feature (Default)

By default, the viewer automatically adjusts to its container's dimensions. This makes it perfect for flex layouts and responsive designs:

```html
<!-- Works great with flexbox -->
<div style="display: flex; height: 100vh;">
  <div style="flex: 1;">
    <stl-viewer src="https://example.com/model.stl"></stl-viewer>
  </div>
</div>

<!-- Or with grid -->
<div style="display: grid; grid-template-columns: 1fr 1fr; height: 600px;">
  <stl-viewer src="https://example.com/model1.stl"></stl-viewer>
  <stl-viewer src="https://example.com/model2.stl"></stl-viewer>
</div>
```

When `auto-resize` is enabled (default):

- The viewer monitors its container size using `ResizeObserver`
- Canvas dimensions automatically update when the container resizes
- The 3D scene adjusts accordingly to maintain proper aspect ratio
- No need to manually set `width` and `height` attributes
- Works seamlessly with flexbox, grid, and other CSS layouts

To disable auto-resize and use fixed dimensions instead:

```html
<stl-viewer
  src="https://example.com/model.stl"
  width="800"
  height="600"
  auto-resize="false"
>
</stl-viewer>
```

## 3D Scene Features

The viewer includes:

- **Lighting**: Hemisphere, ambient, and directional lights for optimal model visibility
- **Grid & Floor**: Visual reference grid and floor plane
- **Auto-scaling**: Models are automatically scaled and centered
- **Fog**: Depth perception enhancement
- **Shadows**: Shadow casting and receiving for realistic rendering
- **Material**: Phong material with blue color (#1a5fb4) and flat shading

## Technology Stack

- **Lit**: Web components framework
- **Three.js**: 3D rendering engine
- **Vite**: Build tool and dev server
- **TypeScript**: Type-safe development

## Browser Support

Modern browsers with ES2022 and Web Components support:

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## License

MIT
