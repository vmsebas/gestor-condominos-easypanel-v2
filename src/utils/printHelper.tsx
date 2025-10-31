/**
 * Print Helper - Utilities for printing HTML content
 */

import React from 'react';
import ReactDOM from 'react-dom/client';

/**
 * Opens a new window with React component and triggers print
 */
export const printReactComponent = (component: React.ReactElement) => {
  // Create new window
  const printWindow = window.open('', '_blank', 'width=800,height=600');

  if (!printWindow) {
    console.error('Failed to open print window. Check if popups are blocked.');
    return;
  }

  // Write initial HTML structure
  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="pt-PT">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Convocatória - Impressão</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          margin: 0;
          padding: 0;
        }
      </style>
    </head>
    <body>
      <div id="print-root"></div>
      <div class="no-print" style="position: fixed; top: 20px; right: 20px; z-index: 1000;">
        <button
          onclick="window.print()"
          style="
            padding: 10px 20px;
            background: #0000FF;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
          "
        >
          🖨️ Imprimir / Salvar PDF
        </button>
        <button
          onclick="window.close()"
          style="
            padding: 10px 20px;
            background: #666;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            margin-left: 10px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
          "
        >
          ✕ Fechar
        </button>
      </div>
    </body>
    </html>
  `);

  printWindow.document.close();

  // Wait for window to load
  printWindow.addEventListener('load', () => {
    const rootElement = printWindow.document.getElementById('print-root');

    if (rootElement) {
      // Render React component
      const root = ReactDOM.createRoot(rootElement);
      root.render(component);

      // Auto-print after short delay (optional)
      // setTimeout(() => {
      //   printWindow.print();
      // }, 500);
    }
  });

  // Trigger load event manually in case it already fired
  if (printWindow.document.readyState === 'complete') {
    printWindow.dispatchEvent(new Event('load'));
  }
};

/**
 * Print current page
 */
export const printCurrentPage = () => {
  window.print();
};
