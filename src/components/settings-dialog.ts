/**
 * Settings Dialog Component
 *
 * A modal dialog for configuring application settings, including CORS proxy
 */

import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import {
  getSettings,
  updateSettings,
  resetSettings,
} from "../services/settings";
import { closeIcon } from "./icons";

@customElement("settings-dialog")
export class SettingsDialog extends LitElement {
  @state()
  private isOpen = false;

  @state()
  private corsProxy = "";

  @state()
  private hasChanges = false;

  connectedCallback(): void {
    super.connectedCallback();
    this.loadSettings();
  }

  /**
   * Opens the settings dialog
   */
  open(): void {
    this.isOpen = true;
    this.loadSettings();
  }

  /**
   * Closes the settings dialog
   */
  close(): void {
    this.isOpen = false;
    this.hasChanges = false;
  }

  private loadSettings(): void {
    const settings = getSettings();
    this.corsProxy = settings.corsProxy;
    this.hasChanges = false;
  }

  private handleCorsProxyInput(e: Event): void {
    const input = e.target as HTMLInputElement;
    this.corsProxy = input.value;
    this.hasChanges = true;
  }

  private handleSave(): void {
    updateSettings({ corsProxy: this.corsProxy });
    this.hasChanges = false;
    this.close();

    // Notify user
    this.dispatchEvent(
      new CustomEvent("settings-saved", {
        detail: { corsProxy: this.corsProxy },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private handleReset(): void {
    if (confirm("Are you sure you want to reset all settings to defaults?")) {
      resetSettings();
      this.loadSettings();
    }
  }

  private handleCancel(): void {
    if (this.hasChanges) {
      if (
        confirm("You have unsaved changes. Are you sure you want to close?")
      ) {
        this.close();
      }
    } else {
      this.close();
    }
  }

  private handleBackdropClick(e: MouseEvent): void {
    if (e.target === e.currentTarget) {
      this.handleCancel();
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.key === "Escape") {
      this.handleCancel();
    }
  }

  render() {
    if (!this.isOpen) return html``;

    return html`
      <div
        class="backdrop"
        @click=${this.handleBackdropClick}
        @keydown=${this.handleKeyDown}
      >
        <div class="dialog" role="dialog" aria-labelledby="dialog-title">
          <div class="dialog-header">
            <h2 id="dialog-title">Settings</h2>
            <button
              class="close-button"
              @click=${this.handleCancel}
              aria-label="Close"
            >
              ${closeIcon()}
            </button>
          </div>

          <div class="dialog-content">
            <div class="setting-group">
              <label for="cors-proxy">
                <strong>CORS Proxy URL</strong>
                <span class="help-text">
                  Optional proxy server to bypass CORS restrictions when loading
                  models from external sources.
                </span>
              </label>
              <input
                id="cors-proxy"
                type="text"
                .value=${this.corsProxy}
                @input=${this.handleCorsProxyInput}
                placeholder="https://corsproxy.io/?url=<url>"
              />

              <div class="info-box">
                <div class="info-title">Supported URL formats:</div>
                <ul>
                  <li>
                    <code>https://proxy.com/&lt;url&gt;</code> - Direct URL
                    substitution
                  </li>
                  <li>
                    <code>https://proxy.com/&lt;encoded_url&gt;</code> - Encoded
                    URL substitution
                  </li>
                  <li>
                    <code>https://proxy.com/</code> - URL will be appended
                  </li>
                </ul>
                <div class="info-note">
                  <strong>Popular CORS proxies:</strong>
                  <ul>
                    <li>
                      <code>https://corsproxy.io/?&lt;encoded_url&gt;</code>
                    </li>
                    <li>
                      <code
                        >https://api.allorigins.win/raw?url=&lt;encoded_url&gt;</code
                      >
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div class="dialog-footer">
            <button class="btn-secondary" @click=${this.handleReset}>
              Reset to Defaults
            </button>
            <div class="button-group">
              <button class="btn-secondary" @click=${this.handleCancel}>
                Cancel
              </button>
              <button
                class="btn-primary"
                @click=${this.handleSave}
                ?disabled=${!this.hasChanges}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  static styles = css`
    :host {
      display: contents;
    }

    .backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .dialog {
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 600px;
      width: 90%;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      animation: slideUp 0.3s ease-out;
    }

    @keyframes slideUp {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem;
      border-bottom: 1px solid #e0e0e0;
    }

    .dialog-header h2 {
      margin: 0;
      font-size: 1.5rem;
      color: #333;
    }

    .close-button {
      background: none;
      border: none;
      padding: 0.5rem;
      cursor: pointer;
      color: #666;
      border-radius: 4px;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-button:hover {
      background: #f0f0f0;
      color: #333;
    }

    .dialog-content {
      padding: 1.5rem;
      overflow-y: auto;
      flex: 1;
    }

    .setting-group {
      margin-bottom: 1.5rem;
    }

    .setting-group:last-child {
      margin-bottom: 0;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      color: #333;
    }

    .help-text {
      display: block;
      font-size: 0.9rem;
      color: #666;
      margin-top: 0.25rem;
      font-weight: normal;
    }

    input[type="text"] {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 1rem;
      font-family: "Courier New", monospace;
      transition: border-color 0.2s;
      box-sizing: border-box;
    }

    input[type="text"]:focus {
      outline: none;
      border-color: #667eea;
    }

    .info-box {
      margin-top: 1rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
      font-size: 0.9rem;
      color: #555;
    }

    .info-title {
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: #333;
    }

    .info-box ul {
      margin: 0.5rem 0;
      padding-left: 1.5rem;
    }

    .info-box li {
      margin: 0.25rem 0;
    }

    .info-note {
      margin-top: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px solid #e0e0e0;
    }

    code {
      background: #e8e8e8;
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      font-family: "Courier New", monospace;
      font-size: 0.85em;
    }

    .dialog-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem;
      border-top: 1px solid #e0e0e0;
      gap: 1rem;
    }

    .button-group {
      display: flex;
      gap: 0.75rem;
    }

    button {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #f0f0f0;
      color: #333;
    }

    .btn-secondary:hover {
      background: #e0e0e0;
    }

    @media (max-width: 768px) {
      .dialog {
        width: 95%;
        max-height: 95vh;
      }

      .dialog-header {
        padding: 1rem;
      }

      .dialog-content {
        padding: 1rem;
      }

      .dialog-footer {
        flex-direction: column;
        align-items: stretch;
      }

      .button-group {
        width: 100%;
      }

      button {
        flex: 1;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "settings-dialog": SettingsDialog;
  }
}
