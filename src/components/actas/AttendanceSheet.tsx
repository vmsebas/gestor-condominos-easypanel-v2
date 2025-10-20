/**
 * Attendance Sheet Component
 * Professional attendance tracking with digital signatures
 * For condominium assemblies
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  UserCheck,
  UserX,
  Users,
  Download,
  Printer,
  CheckCircle2,
  AlertCircle,
  PenTool,
  Trash2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getMembers } from '@/lib/api';
import SignaturePad from '@/components/ui/signature-pad';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface Attendee {
  id: string;
  member_id: string;
  member_name: string;
  fraction: string;
  permilage: number;
  attendance_type: 'present' | 'represented' | 'absent';
  representative_name?: string;
  signature?: string;
  arrival_time?: string;
}

interface AttendanceSheetProps {
  buildingId: string;
  buildingName: string;
  buildingAddress: string;
  convocatoriaId?: string;
  minuteId?: string;
  meetingDate: string;
  assemblyType: 'ordinary' | 'extraordinary';
  assemblyNumber?: number;
  onSave?: (data: AttendanceSheetData) => void;
  existingAttendance?: Attendee[];
}

interface AttendanceSheetData {
  attendees: Attendee[];
  total_members: number;
  present_members: number;
  represented_members: number;
  absent_members: number;
  quorum_percentage: number;
  quorum_met: boolean;
}

const AttendanceSheet: React.FC<AttendanceSheetProps> = ({
  buildingId,
  buildingName,
  buildingAddress,
  convocatoriaId,
  minuteId,
  meetingDate,
  assemblyType,
  assemblyNumber,
  onSave,
  existingAttendance = []
}) => {
  // Load members from database
  const { data: membersResponse, isLoading: membersLoading } = useQuery({
    queryKey: ['members', buildingId],
    queryFn: () => getMembers({ buildingId }),
  });

  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [signingAttendee, setSigningAttendee] = useState<Attendee | null>(null);
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Initialize attendees from members
  useEffect(() => {
    if (membersResponse?.data?.members) {
      const members = membersResponse.data.members;

      // If we have existing attendance, use that
      if (existingAttendance.length > 0) {
        setAttendees(existingAttendance);
      } else {
        // Initialize with all members as absent
        const initialAttendees: Attendee[] = members.map((member: any) => ({
          id: `attendee-${member.id}`,
          member_id: member.id,
          member_name: member.name,
          fraction: member.fraction || member.apartment || 'N/A',
          permilage: parseFloat(member.permilage) || parseFloat(member.ownership_percentage) || 0,
          attendance_type: 'absent' as const,
          arrival_time: undefined
        }));
        setAttendees(initialAttendees);
      }
    }
  }, [membersResponse, existingAttendance]);

  // Calculate statistics
  const stats = React.useMemo(() => {
    const total = attendees.length;
    const present = attendees.filter(a => a.attendance_type === 'present').length;
    const represented = attendees.filter(a => a.attendance_type === 'represented').length;
    const absent = attendees.filter(a => a.attendance_type === 'absent').length;

    // Calculate quorum based on permilage
    const totalPermilage = attendees.reduce((sum, a) => sum + a.permilage, 0);
    const presentPermilage = attendees
      .filter(a => a.attendance_type === 'present' || a.attendance_type === 'represented')
      .reduce((sum, a) => sum + a.permilage, 0);

    const quorumPercentage = totalPermilage > 0 ? (presentPermilage / totalPermilage) * 100 : 0;
    const quorumMet = quorumPercentage > 50; // First call requires >50%

    return {
      total,
      present,
      represented,
      absent,
      totalPermilage,
      presentPermilage,
      quorumPercentage,
      quorumMet
    };
  }, [attendees]);

  // Mark attendance
  const markAttendance = (attendeeId: string, type: 'present' | 'represented' | 'absent') => {
    setAttendees(prev => prev.map(a => {
      if (a.id === attendeeId) {
        const now = new Date();
        return {
          ...a,
          attendance_type: type,
          arrival_time: type !== 'absent' ? now.toTimeString().slice(0, 5) : undefined,
          representative_name: type !== 'represented' ? undefined : a.representative_name
        };
      }
      return a;
    }));
  };

  // Update representative name
  const updateRepresentative = (attendeeId: string, name: string) => {
    setAttendees(prev => prev.map(a => {
      if (a.id === attendeeId) {
        return { ...a, representative_name: name };
      }
      return a;
    }));
  };

  // Open signature dialog
  const openSignatureDialog = (attendee: Attendee) => {
    if (attendee.attendance_type === 'absent') {
      toast.error('Marque a presença antes de assinar');
      return;
    }
    setSigningAttendee(attendee);
    setShowSignatureDialog(true);
  };

  // Save signature
  const saveSignature = (signatureData: string) => {
    if (!signingAttendee) return;

    setAttendees(prev => prev.map(a => {
      if (a.id === signingAttendee.id) {
        return { ...a, signature: signatureData };
      }
      return a;
    }));

    toast.success(`Assinatura guardada para ${signingAttendee.member_name}`);
    setShowSignatureDialog(false);
    setSigningAttendee(null);
  };

  // Clear signature
  const clearSignature = (attendeeId: string) => {
    setAttendees(prev => prev.map(a => {
      if (a.id === attendeeId) {
        return { ...a, signature: undefined };
      }
      return a;
    }));
  };

  // Save attendance data
  const handleSave = () => {
    const data: AttendanceSheetData = {
      attendees,
      total_members: stats.total,
      present_members: stats.present,
      represented_members: stats.represented,
      absent_members: stats.absent,
      quorum_percentage: stats.quorumPercentage,
      quorum_met: stats.quorumMet
    };

    onSave?.(data);
    toast.success('Folha de presenças guardada com sucesso');
  };

  // Generate PDF
  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('FOLHA DE PRESENÇAS', pageWidth / 2, 20, { align: 'center' });

    // Assembly info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${buildingName}`, pageWidth / 2, 30, { align: 'center' });
    doc.text(`${buildingAddress}`, pageWidth / 2, 36, { align: 'center' });
    doc.text(`Assembleia ${assemblyType === 'ordinary' ? 'Ordinária' : 'Extraordinária'} - ${meetingDate}`, pageWidth / 2, 42, { align: 'center' });

    // Table
    const tableData = attendees.map(a => [
      a.member_name,
      a.fraction,
      `${a.permilage.toFixed(2)}‰`,
      a.attendance_type === 'present' ? 'Presente' : a.attendance_type === 'represented' ? 'Representado' : 'Ausente',
      a.representative_name || '',
      a.arrival_time || '',
      '' // Signature column (empty for manual signing)
    ]);

    (doc as any).autoTable({
      head: [['Nome', 'Fração', 'Permilagem', 'Estado', 'Representado por', 'Hora', 'Assinatura']],
      body: tableData,
      startY: 50,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 66, 66] },
      columnStyles: {
        6: { cellWidth: 30 } // Signature column wider
      }
    });

    // Summary
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMO:', 14, finalY);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total de condóminos: ${stats.total}`, 14, finalY + 6);
    doc.text(`Presentes: ${stats.present}`, 14, finalY + 12);
    doc.text(`Representados: ${stats.represented}`, 14, finalY + 18);
    doc.text(`Ausentes: ${stats.absent}`, 14, finalY + 24);
    doc.text(`Quórum: ${stats.quorumPercentage.toFixed(2)}% ${stats.quorumMet ? '✓' : '✗'}`, 14, finalY + 30);

    // Footer
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Documento gerado eletronicamente', pageWidth / 2, pageHeight - 10, { align: 'center' });

    doc.save(`Folha_Presencas_${assemblyType}_${meetingDate}.pdf`);
    toast.success('PDF descarregado com sucesso');
  };

  // Print
  const handlePrint = () => {
    window.print();
  };

  if (membersLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">Carregando condóminos...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Users className="h-6 w-6" />
                Folha de Presenças
              </CardTitle>
              <CardDescription>
                {buildingName} - {assemblyType === 'ordinary' ? 'Assembleia Ordinária' : 'Assembleia Extraordinária'}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={generatePDF}>
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Quorum Status */}
          <div className={`p-4 rounded-lg border-2 ${stats.quorumMet ? 'bg-green-50 border-green-200 dark:bg-green-950/20' : 'bg-amber-50 border-amber-200 dark:bg-amber-950/20'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {stats.quorumMet ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-amber-600" />
                )}
                <div>
                  <p className="font-semibold">
                    {stats.quorumMet ? 'Quórum Atingido' : 'Quórum Não Atingido'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {stats.quorumPercentage.toFixed(2)}% dos coeficientes de permilagem
                  </p>
                </div>
              </div>
              <div className="flex gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.present}</div>
                  <div className="text-muted-foreground">Presentes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.represented}</div>
                  <div className="text-muted-foreground">Representados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">{stats.absent}</div>
                  <div className="text-muted-foreground">Ausentes</div>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Condómino</TableHead>
                  <TableHead>Fração</TableHead>
                  <TableHead className="text-right">Permilagem</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Representado por</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead className="text-center">Assinatura</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendees.map((attendee) => (
                  <TableRow key={attendee.id}>
                    <TableCell className="font-medium">{attendee.member_name}</TableCell>
                    <TableCell>{attendee.fraction}</TableCell>
                    <TableCell className="text-right">{attendee.permilage.toFixed(2)}‰</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant={attendee.attendance_type === 'present' ? 'default' : 'outline'}
                          onClick={() => markAttendance(attendee.id, 'present')}
                          className="h-7"
                        >
                          <UserCheck className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant={attendee.attendance_type === 'represented' ? 'default' : 'outline'}
                          onClick={() => markAttendance(attendee.id, 'represented')}
                          className="h-7"
                        >
                          <Users className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant={attendee.attendance_type === 'absent' ? 'default' : 'outline'}
                          onClick={() => markAttendance(attendee.id, 'absent')}
                          className="h-7"
                        >
                          <UserX className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {attendee.attendance_type === 'represented' && (
                        <Input
                          placeholder="Nome do representante"
                          value={attendee.representative_name || ''}
                          onChange={(e) => updateRepresentative(attendee.id, e.target.value)}
                          className="h-7 text-sm"
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{attendee.arrival_time || '-'}</TableCell>
                    <TableCell className="text-center">
                      {attendee.signature ? (
                        <div className="flex items-center justify-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => clearSignature(attendee.id)}
                            className="h-6 w-6 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openSignatureDialog(attendee)}
                          disabled={attendee.attendance_type === 'absent'}
                          className="h-7"
                        >
                          <PenTool className="h-3 w-3 mr-1" />
                          Assinar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowPrintPreview(true)}>
              <Download className="h-4 w-4 mr-2" />
              Pré-visualizar
            </Button>
            <Button onClick={handleSave}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Guardar Folha de Presenças
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Signature Dialog */}
      {showSignatureDialog && signingAttendee && (
        <Dialog open={showSignatureDialog} onOpenChange={setShowSignatureDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Assinatura Digital</DialogTitle>
              <DialogDescription>
                {signingAttendee.member_name} - Fração {signingAttendee.fraction}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <SignaturePad onSave={saveSignature} />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default AttendanceSheet;
