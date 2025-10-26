/**
 * RubricPad - Componente para capturar rubrica (assinatura reduzida)
 *
 * Diferenças da SignaturePad:
 * - Canvas menor (300x100 em vez de 500x200)
 * - Usado para páginas intermédias
 * - Normalmente apenas iniciais
 */

import React, { useRef, useState, useEffect } from 'react';
import { Button } from './button';
import { Eraser, Check, X } from 'lucide-react';

interface RubricPadProps {
  onSave: (rubric: string) => void;
  onCancel: () => void;
  existingRubric?: string;
}

const RubricPad: React.FC<RubricPadProps> = ({ onSave, onCancel, existingRubric }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurar canvas
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Carregar rubrica existente se houver
    if (existingRubric) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        setIsEmpty(false);
      };
      img.src = existingRubric;
    }
  }, [existingRubric]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setIsEmpty(false);

    let x, y;
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let x, y;
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || isEmpty) {
      alert('Por favor, assine antes de guardar');
      return;
    }

    // Converter canvas para Base64 PNG
    const rubricData = canvas.toDataURL('image/png');
    onSave(rubricData);
  };

  return (
    <div className="space-y-4">
      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Rubrica para páginas intermédias:</strong> Assine com suas iniciais ou uma versão simplificada da sua assinatura.
          Esta rubrica aparecerá no rodapé de cada página da acta (exceto a última).
        </p>
      </div>

      {/* Canvas */}
      <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
        <canvas
          ref={canvasRef}
          width={600}
          height={150}
          className="w-full cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>

      {/* Instruções */}
      <p className="text-xs text-muted-foreground text-center">
        Use o mouse ou toque (tablet/iPad) para criar sua rubrica
      </p>

      {/* Botões */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={clearCanvas} className="flex items-center gap-2">
          <Eraser className="h-4 w-4" />
          Limpar
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} className="flex items-center gap-2">
            <X className="h-4 w-4" />
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isEmpty}
            className="flex items-center gap-2"
          >
            <Check className="h-4 w-4" />
            Guardar Rubrica
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RubricPad;
