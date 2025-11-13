import { LitElement, css, html } from "lit";
import { customElement, state, query } from "lit/decorators.js";
import "./stl-viewer.ts";
import "./components/settings-dialog.ts";
import type { SettingsDialog } from "./components/settings-dialog.ts";
import { backIcon, settingsIcon, boxIcon } from "./components/icons";

/**
 * STL Viewer App Component
 *
 * Main application component that provides UI for loading STL files
 * via URL input or file upload. Also supports loading from URL query parameter.
 */
@customElement("stl-viewer-app")
export class STLViewerApp extends LitElement {
  @state()
  private modelUrl = "";

  @state()
  private urlInput = "";

  @state()
  private errorMessage = "";

  @query("settings-dialog")
  private settingsDialog?: SettingsDialog;

  connectedCallback(): void {
    super.connectedCallback();
    this.loadFromQueryParams();
  }

  render() {
    if (this.modelUrl) {
      // Full page viewer mode
      return html`
        <div class="fullpage-viewer">
          <div class="viewer-controls">
            <button
              @click=${this.clearModel}
              class="back-button"
              title="Back to controls"
            >
              ${backIcon()} Back
            </button>
            <button
              @click=${this.openSettings}
              class="settings-button-viewer"
              title="Settings"
            >
              ${settingsIcon()}
            </button>
          </div>
          <stl-viewer
            src=${this.modelUrl}
            width=${window.innerWidth}
            height=${window.innerHeight}
          ></stl-viewer>
          <settings-dialog></settings-dialog>
        </div>
      `;
    }

    // Controls mode
    return html`
      <div class="container">
        <header>
          <div class="header-content">
            <div class="header-text">
              <h1>STL Viewer</h1>
              <p class="subtitle">Preview 3D printing models in your browser</p>
            </div>
            <button
              @click=${this.openSettings}
              class="settings-button"
              title="Settings"
            >
              ${settingsIcon()}
            </button>
          </div>
        </header>

        <div class="controls">
          <div class="input-group">
            <label for="url-input">Model URL</label>
            <div class="input-row">
              <input
                id="url-input"
                type="text"
                .value=${this.urlInput}
                @input=${this.handleUrlInput}
                @keydown=${this.handleKeyDown}
                placeholder="https://example.com/model.stl"
              />
              <button @click=${this.loadFromUrl} class="btn-primary">
                Load URL
              </button>
            </div>
          </div>

          <div class="divider">
            <span>or</span>
          </div>

          <div class="input-group">
            <label for="file-input">Upload File</label>
            <input
              id="file-input"
              type="file"
              accept=".stl"
              @change=${this.handleFileUpload}
            />
          </div>

          ${this.errorMessage
            ? html`<div class="error">${this.errorMessage}</div>`
            : ""}
        </div>

        <div class="placeholder">
          ${boxIcon(120)}
          <p>Enter a URL or upload an STL file to preview</p>
        </div>

        <settings-dialog></settings-dialog>
      </div>
    `;
  }

  private loadFromQueryParams(): void {
    const params = new URLSearchParams(window.location.search);
    const srcParam = params.get("src");

    if (srcParam) {
      this.urlInput = srcParam;
      this.modelUrl = srcParam;
      this.errorMessage = "";
    }
  }

  private handleUrlInput(e: Event): void {
    const input = e.target as HTMLInputElement;
    this.urlInput = input.value;
    this.errorMessage = "";
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.key === "Enter") {
      this.loadFromUrl();
    }
  }

  private loadFromUrl(): void {
    if (!this.urlInput.trim()) {
      this.errorMessage = "Please enter a valid URL";
      return;
    }

    try {
      new URL(this.urlInput);
      this.modelUrl = this.urlInput;
      this.errorMessage = "";

      // Update URL without reloading page
      const url = new URL(window.location.href);
      url.searchParams.set("src", this.urlInput);
      window.history.pushState({}, "", url);
    } catch (error) {
      this.errorMessage = "Invalid URL format";
    }
  }

  private handleFileUpload(e: Event): void {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".stl")) {
      this.errorMessage = "Please select an STL file";
      return;
    }

    // Revoke previous object URL if it exists
    if (this.modelUrl.startsWith("blob:")) {
      URL.revokeObjectURL(this.modelUrl);
    }

    // Create object URL for the file
    this.modelUrl = URL.createObjectURL(file);
    this.urlInput = file.name;
    this.errorMessage = "";

    // Clear URL parameter when loading local file
    const url = new URL(window.location.href);
    url.searchParams.delete("src");
    window.history.pushState({}, "", url);
  }

  private clearModel(): void {
    // Revoke object URL if it exists
    if (this.modelUrl.startsWith("blob:")) {
      URL.revokeObjectURL(this.modelUrl);
    }

    this.modelUrl = "";
    this.errorMessage = "";

    // Clear URL parameter
    const url = new URL(window.location.href);
    url.searchParams.delete("src");
    window.history.pushState({}, "", url);
  }

  private openSettings(): void {
    this.settingsDialog?.open();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    // Clean up object URL if it exists
    if (this.modelUrl.startsWith("blob:")) {
      URL.revokeObjectURL(this.modelUrl);
    }
  }

  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .fullpage-viewer {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      margin: 0;
      padding: 0;
      background: #a0a0a0;
    }

    .viewer-controls {
      position: fixed;
      top: 1rem;
      left: 1rem;
      right: 1rem;
      z-index: 1000;
      display: flex;
      justify-content: space-between;
      align-items: center;
      pointer-events: none;
    }

    .viewer-controls > * {
      pointer-events: auto;
    }

    .back-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      background: rgba(255, 255, 255, 0.95);
      color: #333;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transition: all 0.2s;
    }

    .back-button:hover {
      background: white;
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    }

    .back-button:active {
      transform: translateY(0);
    }

    .back-button svg {
      flex-shrink: 0;
    }

    .settings-button-viewer {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.75rem;
      background: rgba(255, 255, 255, 0.95);
      color: #333;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transition: all 0.2s;
    }

    .settings-button-viewer:hover {
      background: white;
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    }

    .settings-button-viewer:active {
      transform: translateY(0);
    }

    .container {
      padding: 2rem;
      min-height: 100vh;
      max-width: 1200px;
      margin: 0 auto;
    }

    header {
      color: white;
      margin-bottom: 2rem;
    }

    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 2rem;
    }

    .header-text {
      text-align: center;
      flex: 1;
    }

    h1 {
      font-size: 3rem;
      margin: 0 0 0.5rem 0;
      font-weight: 700;
    }

    .subtitle {
      font-size: 1.2rem;
      margin: 0;
      opacity: 0.9;
    }

    .settings-button {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.75rem;
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      flex-shrink: 0;
    }

    .settings-button:hover {
      background: rgba(255, 255, 255, 0.3);
      border-color: rgba(255, 255, 255, 0.5);
      transform: translateY(-2px);
    }

    .settings-button:active {
      transform: translateY(0);
    }

    .controls {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      margin-bottom: 2rem;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }

    .input-group {
      margin-bottom: 1.5rem;
    }

    .input-group:last-child {
      margin-bottom: 0;
    }

    label {
      display: block;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: #333;
    }

    .input-row {
      display: flex;
      gap: 0.75rem;
    }

    input[type="text"] {
      flex: 1;
      padding: 0.75rem 1rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.2s;
    }

    input[type="text"]:focus {
      outline: none;
      border-color: #667eea;
    }

    input[type="file"] {
      padding: 0.75rem;
      border: 2px dashed #e0e0e0;
      border-radius: 8px;
      width: 100%;
      cursor: pointer;
      transition: border-color 0.2s;
    }

    input[type="file"]:hover {
      border-color: #667eea;
    }

    .btn-primary {
      padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition:
        transform 0.2s,
        box-shadow 0.2s;
      white-space: nowrap;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .btn-primary:active {
      transform: translateY(0);
    }

    .divider {
      text-align: center;
      margin: 1.5rem 0;
      position: relative;
    }

    .divider::before {
      content: "";
      position: absolute;
      left: 0;
      right: 0;
      top: 50%;
      height: 1px;
      background: #e0e0e0;
    }

    .divider span {
      position: relative;
      background: white;
      padding: 0 1rem;
      color: #999;
      font-weight: 500;
    }

    .error {
      background: #fee;
      color: #c33;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      border-left: 4px solid #c33;
      margin-top: 1rem;
    }

    .placeholder {
      background: white;
      border-radius: 12px;
      padding: 4rem 2rem;
      text-align: center;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      color: #999;
    }

    .placeholder svg {
      opacity: 0.3;
      margin-bottom: 1rem;
    }

    .placeholder p {
      font-size: 1.1rem;
      margin: 0;
    }

    @media (max-width: 768px) {
      :host {
        padding: 1rem;
      }

      .header-content {
        flex-direction: column;
        gap: 1rem;
      }

      .header-text {
        order: 1;
      }

      .settings-button {
        align-self: flex-end;
        order: 0;
      }

      h1 {
        font-size: 2rem;
      }

      .subtitle {
        font-size: 1rem;
      }

      .controls {
        padding: 1.5rem;
      }

      .input-row {
        flex-direction: column;
      }

      .viewer-container {
        padding: 1rem;
      }

      stl-viewer {
        max-width: 100%;
      }

      .viewer-controls {
        flex-wrap: wrap;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "stl-viewer-app": STLViewerApp;
  }
}
