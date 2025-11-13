import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { createRef, ref, type Ref } from "lit/directives/ref.js";
import {
  AmbientLight,
  BufferGeometry,
  Color,
  DirectionalLight,
  Fog,
  GridHelper,
  HemisphereLight,
  Mesh,
  MeshPhongMaterial,
  type NormalBufferAttributes,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three-stdlib";
import { STLLoader } from "three-stdlib";
import { fetchWithProxy } from "./utils/cors-proxy";

interface STLWorld {
  renderer: WebGLRenderer;
  scene: Scene;
  camera: PerspectiveCamera;
  object: Mesh;
  grid: GridHelper;
  floor: Mesh;
  dirLight: DirectionalLight;
  ambientLight: AmbientLight;
  hemiLight: HemisphereLight;
  controls: OrbitControls;
  animate: () => void;
  resize: () => void;
  setSTLGeometry: (geometry: BufferGeometry<NormalBufferAttributes>) => void;
}

function createSTLWorld(canvas: HTMLCanvasElement): STLWorld {
  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    preserveDrawingBuffer: true,
    alpha: true,
  });
  renderer.shadowMap.enabled = true;

  const scene = new Scene();
  scene.background = new Color(0xa0a0a0);
  scene.fog = new Fog(0xa0a0a0, 4, 20);

  const camera = new PerspectiveCamera(
    75,
    canvas.width / canvas.height,
    0.1,
    1000,
  );
  camera.position.set(-2, 2, -2.5);
  scene.add(camera);

  const hemiLight = new HemisphereLight(0xffffff, 0x444444, 3);
  hemiLight.position.set(0, 20, 0);
  scene.add(hemiLight);

  const ambientLight = new AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const dirLight = new DirectionalLight(0xffffff);
  dirLight.position.set(-5, 15, 10);
  dirLight.castShadow = true;
  scene.add(dirLight);

  const floor = new Mesh(
    new PlaneGeometry(40, 40),
    new MeshPhongMaterial({ color: 0xbbbbbb, depthWrite: false }),
  );
  floor.rotation.set(-Math.PI / 2, 0, 0);
  floor.receiveShadow = true;
  scene.add(floor);

  const grid = new GridHelper(40, 40, 0x000000, 0x000000);
  grid.material.transparent = true;
  grid.material.opacity = 0.2;
  scene.add(grid);

  const object = new Mesh(
    new BufferGeometry(),
    new MeshPhongMaterial({
      color: 0x1a5fb4,
      shininess: 60,
      flatShading: true,
    }),
  );
  object.castShadow = true;
  object.receiveShadow = true;
  scene.add(object);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.update();

  controls.enableDamping = true;
  controls.enablePan = true;
  controls.enableRotate = true;
  controls.enableZoom = true;

  function setSTLGeometry(geometry: BufferGeometry<NormalBufferAttributes>) {
    if (!geometry.boundingBox) geometry.computeBoundingBox();
    if (!geometry.boundingSphere) geometry.computeBoundingSphere();

    const objectScale = 2 / geometry.boundingSphere!.radius;
    const bb = geometry.boundingBox!;
    const center = bb.getCenter(new Vector3()).multiplyScalar(objectScale);

    // update object
    object.geometry = geometry;
    object.scale.set(objectScale, objectScale, objectScale);
    object.rotation.set(Math.PI * -0.5, 0, 0);
    object.position.set(-center.x, -center.z, center.y);

    // update floor
    grid.position.set(0, ((bb.min.z - bb.max.z) / 2) * objectScale, 0);
    floor.position.set(0, ((bb.min.z - bb.max.z) / 2) * objectScale, 0);

    console.log("STL model loaded:", object);
  }

  function resize() {
    camera.aspect = canvas.width / canvas.height;
    camera.updateProjectionMatrix();
  }

  function animate() {
    controls.update();
    renderer.render(scene, camera);
  }

  return {
    renderer,
    scene,
    camera,
    object,
    grid,
    floor,
    dirLight,
    ambientLight,
    hemiLight,
    controls,
    animate,
    resize,
    setSTLGeometry,
  };
}

/**
 * STL Viewer Component
 *
 * A web component for displaying 3D STL models using Three.js
 *
 * @property {string} src - URL of the STL file to load
 * @property {number} width - Width of the viewer in pixels (default: 800, ignored when autoResize is true)
 * @property {number} height - Height of the viewer in pixels (default: 600, ignored when autoResize is true)
 * @property {string} corsProxy - Optional CORS proxy URL for loading models from restricted sources
 * @property {boolean} autoResize - Automatically adjust canvas size to match container dimensions (default: true)
 */
@customElement("stl-viewer")
export class STLViewer extends LitElement {
  @property({ type: String })
  src = "";

  @property({ type: Number })
  width = 800;

  @property({ type: Number })
  height = 600;

  @property({ type: String, attribute: "cors-proxy" })
  corsProxy = "";

  @property({ type: Boolean, attribute: "auto-resize" })
  autoResize = true;

  @state()
  private loadingState: "idle" | "loading" | "loaded" | "error" = "idle";

  @state()
  private loadingMessage = "";

  @state()
  private errorMessage = "";

  private canvasRef: Ref<HTMLCanvasElement> = createRef();
  private world?: STLWorld;
  private animationFrameId?: number;
  private isAnimating = false;
  private resizeObserver?: ResizeObserver;

  render() {
    return html`
      <div class="viewer-container">
        <canvas
          ${ref(this.canvasRef)}
          width=${this.width}
          height=${this.height}
        ></canvas>
        ${this.renderOverlay()}
      </div>
    `;
  }

  private renderOverlay() {
    if (this.loadingState === "idle" || this.loadingState === "loaded") {
      return null;
    }

    return html`
      <div class="loading-overlay">
        <div class="loading-content">
          ${this.loadingState === "loading"
            ? html`
                <div class="spinner"></div>
                <div class="loading-title">Loading STL Model</div>
                <div class="loading-url">${this.src}</div>
                ${this.loadingMessage
                  ? html`<div class="loading-message">
                      ${this.loadingMessage}
                    </div>`
                  : null}
              `
            : html`
                <div class="error-icon">⚠️</div>
                <div class="error-title">Failed to Load Model</div>
                <div class="error-url">${this.src}</div>
                <div class="error-message">${this.errorMessage}</div>
              `}
        </div>
      </div>
    `;
  }

  protected firstUpdated(): void {
    this.initializeWorld();
    this.setupResizeObserver();
  }

  protected updated(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has("src") && this.src) {
      this.loadSTL(this.src);
    }

    if (changedProperties.has("width") || changedProperties.has("height")) {
      this.handleResize();
    }

    if (changedProperties.has("autoResize")) {
      this.setupResizeObserver();
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.cleanup();
  }

  private initializeWorld(): void {
    const canvas = this.canvasRef.value;
    if (!canvas) return;

    canvas.width = this.width;
    canvas.height = this.height;

    this.world = createSTLWorld(canvas);
    this.startAnimation();

    // Note: loadSTL will be called by updated() lifecycle method
    // when src property is set, so we don't need to call it here
  }

  private async loadSTL(url: string): Promise<void> {
    if (!this.world) return;

    this.loadingState = "loading";
    this.loadingMessage = "Fetching model...";
    this.errorMessage = "";

    try {
      const loader = new STLLoader();

      // Use custom fetch with CORS proxy support
      // Pass the component's corsProxy property if provided
      const response = await fetchWithProxy(url, undefined, this.corsProxy);
      if (!response.ok) {
        throw new Error(
          `Failed to load STL: ${response.status} ${response.statusText}`,
        );
      }

      this.loadingMessage = "Parsing geometry...";
      const arrayBuffer = await response.arrayBuffer();
      const geometry = loader.parse(arrayBuffer);

      this.loadingMessage = "Rendering model...";
      this.world.setSTLGeometry(geometry);

      this.loadingState = "loaded";
      this.loadingMessage = "";
    } catch (error) {
      console.error("Error loading STL file:", error);

      this.loadingState = "error";
      this.errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown error occurred while loading the model";

      // Dispatch error event so parent components can handle it
      this.dispatchEvent(
        new CustomEvent("load-error", {
          detail: { error, url },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  private handleResize(): void {
    if (!this.world) return;

    const canvas = this.canvasRef.value;
    if (!canvas) return;

    canvas.width = this.width;
    canvas.height = this.height;
    this.world.resize();
  }

  private setupResizeObserver(): void {
    // Clean up existing observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = undefined;
    }

    if (!this.autoResize) return;

    const container = this.shadowRoot?.querySelector(
      ".viewer-container",
    ) as HTMLElement;
    if (!container) return;

    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          this.width = Math.floor(width);
          this.height = Math.floor(height);
          this.handleResize();
        }
      }
    });

    this.resizeObserver.observe(container);
  }

  private startAnimation(): void {
    if (this.isAnimating || !this.world) return;

    this.isAnimating = true;
    const animate = () => {
      if (this.isAnimating && this.world) {
        this.world.animate();
        this.animationFrameId = requestAnimationFrame(animate);
      }
    };
    animate();
  }

  private cleanup(): void {
    this.isAnimating = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.world) {
      this.world.renderer.dispose();
    }
  }

  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      min-width: 0;
      min-height: 0;
    }

    .viewer-container {
      position: relative;
      width: 100%;
      height: 100%;
    }

    canvas {
      display: block;
      width: 100%;
      height: 100%;
    }

    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(4px);
      z-index: 1000;
    }

    .loading-content {
      text-align: center;
      color: white;
      padding: 2rem;
      max-width: 500px;
    }

    .spinner {
      width: 50px;
      height: 50px;
      margin: 0 auto 1rem;
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-top-color: #1a5fb4;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    .loading-title {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }

    .loading-url {
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.7);
      word-break: break-all;
      margin-bottom: 0.5rem;
      font-family: monospace;
    }

    .loading-message {
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.9);
      margin-top: 1rem;
      font-style: italic;
    }

    .error-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .error-title {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 1rem;
      color: #ff6b6b;
    }

    .error-url {
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.7);
      word-break: break-all;
      margin-bottom: 1rem;
      font-family: monospace;
    }

    .error-message {
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.9);
      background: rgba(255, 107, 107, 0.2);
      padding: 1rem;
      border-radius: 8px;
      border-left: 4px solid #ff6b6b;
      text-align: left;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "stl-viewer": STLViewer;
  }
}
