/**
 * STL Viewer Embeddable Component
 *
 * This file serves as the entry point for embedding the STL viewer
 * in external applications. Simply include this script and use the
 * <stl-viewer> web component.
 *
 * Usage:
 *   <script src="https://your-domain.com/previewer.js"></script>
 *   <stl-viewer src="https://example.com/model.stl" width="800" height="600"></stl-viewer>
 */

import "./stl-viewer.ts";

// Export the component class for advanced usage
export { STLViewer } from "./stl-viewer.ts";
