import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface PrintButtonProps extends ButtonProps {
  contentSelector?: string;
  title?: string;
}

const PrintButton: React.FC<PrintButtonProps> = ({ 
  contentSelector, 
  title = 'Print',
  children,
  ...props 
}) => {
  const handlePrint = () => {
    if (contentSelector) {
      const content = document.querySelector(contentSelector);
      if (!content) {
        console.error('Content not found for printing');
        return;
      }

      // Create a temporary window for printing
      const printWindow = window.open('', '', 'width=800,height=600');
      if (!printWindow) return;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
        </html>
      `);
      
      printWindow.document.close();
      printWindow.print();
      
      // Close the window after a delay
      setTimeout(() => {
        printWindow.close();
      }, 1000);
    } else {
      // Print the entire page
      window.print();
    }
  };

  return (
    <Button onClick={handlePrint} {...props}>
      {children || (
        <>
          <Printer className="h-4 w-4 mr-2" />
          Imprimir
        </>
      )}
    </Button>
  );
};

export default PrintButton;