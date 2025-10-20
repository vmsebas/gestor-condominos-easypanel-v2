import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UserCheck, UserX, Users, Search, Loader2, Pen, Download, FileText, CheckCircle2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getMembers } from '@/lib/api';
import SignaturePad from '@/components/ui/signature-pad';

interface Member {
  id: string;
  name: string;
  apartment: string;
  coefficient: number;
  present: boolean;
  represented: boolean;
  representedBy?: string;
  signature?: string;
}

interface ControlAsistenciaStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const ControlAsistenciaStep: React.FC<ControlAsistenciaStepProps> = ({
  data,
  onUpdate,
  onPrevious,
  onNext
}) => {
  // Cargar miembros REALES desde la base de datos
  const { data: membersResponse, isLoading: membersLoading } = useQuery({
    queryKey: ['members'],
    queryFn: () => getMembers(),
  });

  const apiMembers = membersResponse?.data?.members || [];
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [attendanceData, setAttendanceData] = useState(data.attendance || {});
  const [signatures, setSignatures] = useState<Record<string, string>>(data.signatures || {});
  const [signingMember, setSigningMember] = useState<Member | null>(null);
  const [showAttendanceSheet, setShowAttendanceSheet] = useState(false);
  const attendanceSheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (apiMembers.length > 0) {
      const transformedMembers = apiMembers.map((member: any, index: number) => ({
        id: member.id,
        name: member.name,
        apartment: member.fraction || `Fração ${index + 1}`,
        coefficient: parseFloat(member.permilage) || 0,
        present: attendanceData[member.id]?.present || false,
        represented: attendanceData[member.id]?.represented || false,
        representedBy: attendanceData[member.id]?.representedBy,
        signature: signatures[member.id]
      }));
      setMembers(transformedMembers);
    }
  }, [apiMembers, attendanceData, signatures]);

  const handleAttendanceChange = (memberId: string, field: keyof Member, value: any) => {
    const updatedData = {
      ...attendanceData,
      [memberId]: {
        ...attendanceData[memberId],
        [field]: value
      }
    };
    setAttendanceData(updatedData);
    onUpdate({ attendance: updatedData, signatures });
  };

  const handleSignature = (memberId: string, signatureData: string) => {
    const updatedSignatures = {
      ...signatures,
      [memberId]: signatureData
    };
    setSignatures(updatedSignatures);
    onUpdate({ attendance: attendanceData, signatures: updatedSignatures });
    setSigningMember(null);
  };

  const handleContinue = () => {
    onUpdate({ attendees: attendanceData, signatures });
    onNext();
  };

  const handlePrintAttendanceSheet = () => {
    if (attendanceSheetRef.current) {
      const printContent = attendanceSheetRef.current.innerHTML;
      const printWindow = window.open('', '', 'height=800,width=1000');

      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Folha de Presenças - ${data.building_name || 'Assembleia'}</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  padding: 20px;
                  font-size: 12px;
                }
                h1 {
                  text-align: center;
                  font-size: 18px;
                  margin-bottom: 5px;
                }
                h2 {
                  text-align: center;
                  font-size: 14px;
                  color: #666;
                  margin-bottom: 20px;
                }
                table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-top: 20px;
                }
                th, td {
                  border: 1px solid #000;
                  padding: 8px;
                  text-align: left;
                }
                th {
                  background-color: #f0f0f0;
                  font-weight: bold;
                }
                .signature-cell {
                  height: 60px;
                  vertical-align: middle;
                }
                .signature-img {
                  max-width: 150px;
                  max-height: 50px;
                }
                .header-info {
                  margin-bottom: 20px;
                }
                .info-line {
                  margin: 5px 0;
                }
                @media print {
                  body { padding: 10px; }
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              ${printContent}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.apartment.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const presentMembers = members.filter(m => attendanceData[m.id]?.present || m.present);
  const representedMembers = members.filter(m => attendanceData[m.id]?.represented || m.represented);
  const totalCoefficient = members.reduce((sum, m) => sum + m.coefficient, 0);
  const presentCoefficient = presentMembers.reduce((sum, m) => sum + m.coefficient, 0);
  const representedCoefficient = representedMembers.reduce((sum, m) => sum + m.coefficient, 0);
  const totalRepresentedCoefficient = presentCoefficient + representedCoefficient;

  const attendingMembers = members.filter(m =>
    (attendanceData[m.id]?.present || attendanceData[m.id]?.represented)
  );
  const signedCount = attendingMembers.filter(m => signatures[m.id]).length;
  const allSigned = attendingMembers.length > 0 && signedCount === attendingMembers.length;

  if (membersLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">A carregar condóminos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-foreground mb-2">Controlo de Presenças</h2>
          <p className="text-muted-foreground">
            Registe a presença, representações e recolha de assinaturas
          </p>
        </div>
        {data?.minute_number && (
          <div className="text-right ml-4">
            <Badge variant="outline" className="text-lg px-4 py-2">
              Acta #{data.minute_number}
            </Badge>
            {data?.assembly_type && (
              <p className="text-sm text-muted-foreground mt-2">
                {data.assembly_type === 'ordinary' ? 'Assembleia Ordinária' : 'Assembleia Extraordinária'}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Resumen de asistencia */}
      <div className="grid md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <UserCheck className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{presentMembers.length}</p>
                <p className="text-sm text-muted-foreground">Presentes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Users className="h-6 w-6 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{representedMembers.length}</p>
                <p className="text-sm text-muted-foreground">Representados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <UserX className="h-6 w-6 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{members.length - presentMembers.length - representedMembers.length}</p>
                <p className="text-sm text-muted-foreground">Ausentes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-lg font-bold">{((totalRepresentedCoefficient / totalCoefficient) * 100).toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground">Permilagem total</p>
              <p className="text-xs text-muted-foreground mt-1">
                {totalRepresentedCoefficient.toFixed(1)}‰ / {totalCoefficient.toFixed(1)}‰
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className={allSigned ? 'border-green-500 bg-green-50/50 dark:bg-green-950/20' : 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20'}>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Pen className={`h-6 w-6 ${allSigned ? 'text-green-600' : 'text-orange-600'}`} />
              <div>
                <p className="text-2xl font-bold">{signedCount}/{attendingMembers.length}</p>
                <p className="text-sm text-muted-foreground">Assinaturas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botões de ação */}
      <div className="flex justify-between items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Procurar proprietário ou apartamento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button
          onClick={() => setShowAttendanceSheet(true)}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <FileText className="h-4 w-4" />
          <span>Ver Folha de Presenças</span>
        </Button>
      </div>

      {/* Lista de propietarios */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Proprietários</CardTitle>
          <CardDescription>
            Marque a presença, representações e recolha assinaturas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredMembers.map((member) => {
              const memberData = attendanceData[member.id] || member;
              const isAttending = memberData.present || memberData.represented;
              const hasSigned = !!signatures[member.id];

              return (
                <div
                  key={member.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    isAttending ? 'bg-blue-50/30 dark:bg-blue-950/10 border-blue-200' : 'bg-muted/30'
                  }`}
                >
                  <div className="flex items-start space-x-4 w-full">
                    <div className="flex flex-col space-y-3 min-w-[140px]">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`present-${member.id}`}
                          checked={memberData.present || false}
                          onCheckedChange={(checked) =>
                            handleAttendanceChange(member.id, 'present', checked)
                          }
                        />
                        <Label htmlFor={`present-${member.id}`} className="text-sm font-medium cursor-pointer">
                          Presente
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`represented-${member.id}`}
                          checked={memberData.represented || false}
                          onCheckedChange={(checked) =>
                            handleAttendanceChange(member.id, 'represented', checked)
                          }
                        />
                        <Label htmlFor={`represented-${member.id}`} className="text-sm font-medium cursor-pointer">
                          Representado
                        </Label>
                      </div>
                    </div>

                    <div className="flex-1">
                      <h3 className="font-medium">{member.name}</h3>
                      <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                        <span>Apartamento {member.apartment}</span>
                        <span>•</span>
                        <span>Permilagem: {member.coefficient.toFixed(1)}‰</span>
                      </div>
                      {memberData.representedBy && (
                        <div className="mt-1">
                          <Badge variant="outline" className="text-xs">
                            Representado por: {memberData.representedBy}
                          </Badge>
                        </div>
                      )}
                      {hasSigned && (
                        <div className="mt-2">
                          <img
                            src={signatures[member.id]}
                            alt="Assinatura"
                            className="h-10 border border-green-300 rounded px-2 bg-white"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {memberData.present && (
                      <Badge variant="success">Presente</Badge>
                    )}
                    {memberData.represented && (
                      <Badge variant="info">Representado</Badge>
                    )}
                    {!memberData.present && !memberData.represented && (
                      <Badge variant="destructive">Ausente</Badge>
                    )}
                    {isAttending && (
                      <Button
                        size="sm"
                        variant={hasSigned ? "outline" : "default"}
                        onClick={() => setSigningMember(member)}
                        className="ml-2"
                      >
                        {hasSigned ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-1 text-green-600" />
                            Assinado
                          </>
                        ) : (
                          <>
                            <Pen className="h-4 w-4 mr-1" />
                            Assinar
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredMembers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum proprietário encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de assinatura */}
      <Dialog open={!!signingMember} onOpenChange={() => setSigningMember(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Pen className="h-5 w-5" />
              <span>Assinatura Digital</span>
            </DialogTitle>
            <DialogDescription>
              {signingMember?.name} - Fração {signingMember?.apartment}
              <br />
              Use o dedo (iPad/tablet) ou rato para assinar no espaço abaixo
            </DialogDescription>
          </DialogHeader>
          <SignaturePad
            onSave={(signature) => signingMember && handleSignature(signingMember.id, signature)}
            width={700}
            height={300}
          />
        </DialogContent>
      </Dialog>

      {/* Modal da Folha de Presenças */}
      <Dialog open={showAttendanceSheet} onOpenChange={setShowAttendanceSheet}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Folha de Presenças</span>
              </span>
              <Button onClick={handlePrintAttendanceSheet} size="sm" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Imprimir / PDF
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div ref={attendanceSheetRef} className="bg-white p-8 text-black">
            <h1 className="text-center text-xl font-bold mb-1">FOLHA DE PRESENÇAS</h1>
            <h2 className="text-center text-base text-gray-600 mb-6">
              ASSEMBLEIA {data?.assembly_type === 'ordinary' ? 'ORDINÁRIA' : 'EXTRAORDINÁRIA'} DE CONDÓMINOS
            </h2>

            <div className="header-info mb-6 text-sm">
              <div className="info-line"><strong>Edifício:</strong> {data?.building_name || 'N/D'}</div>
              <div className="info-line"><strong>Morada:</strong> {data?.building_address || 'N/D'}</div>
              <div className="info-line"><strong>Data:</strong> {data?.meeting_date ? new Date(data.meeting_date).toLocaleDateString('pt-PT') : 'N/D'}</div>
              <div className="info-line"><strong>Hora:</strong> {data?.meeting_time || 'N/D'}</div>
              <div className="info-line"><strong>Local:</strong> {data?.location || 'N/D'}</div>
            </div>

            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border border-black p-2 bg-gray-100 text-center w-12">Nº</th>
                  <th className="border border-black p-2 bg-gray-100 text-left">Nome do Proprietário</th>
                  <th className="border border-black p-2 bg-gray-100 text-center w-24">Fração</th>
                  <th className="border border-black p-2 bg-gray-100 text-center w-24">Permilagem</th>
                  <th className="border border-black p-2 bg-gray-100 text-center w-32">Condição</th>
                  <th className="border border-black p-2 bg-gray-100 text-center w-48">Assinatura</th>
                </tr>
              </thead>
              <tbody>
                {attendingMembers.map((member, index) => {
                  const memberData = attendanceData[member.id] || {};
                  const status = memberData.present ? 'Presente' : 'Representado';

                  return (
                    <tr key={member.id}>
                      <td className="border border-black p-2 text-center">{index + 1}</td>
                      <td className="border border-black p-2">{member.name}</td>
                      <td className="border border-black p-2 text-center">{member.apartment}</td>
                      <td className="border border-black p-2 text-center">{member.coefficient.toFixed(1)}‰</td>
                      <td className="border border-black p-2 text-center">
                        <strong>{status}</strong>
                        {memberData.representedBy && (
                          <div className="text-xs mt-1">por {memberData.representedBy}</div>
                        )}
                      </td>
                      <td className="border border-black p-2 text-center signature-cell">
                        {signatures[member.id] ? (
                          <img
                            src={signatures[member.id]}
                            alt="Assinatura"
                            className="signature-img mx-auto"
                          />
                        ) : (
                          <span className="text-gray-400">_______________</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-gray-50">
                  <td colSpan={3} className="border border-black p-2 text-right font-bold">TOTAL:</td>
                  <td className="border border-black p-2 text-center font-bold">
                    {totalRepresentedCoefficient.toFixed(1)}‰
                  </td>
                  <td colSpan={2} className="border border-black p-2 text-center font-bold">
                    {attendingMembers.length} condóminos ({((totalRepresentedCoefficient / totalCoefficient) * 100).toFixed(1)}%)
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="mt-6 text-xs text-gray-600">
              <p><strong>Nota:</strong> Esta folha de presenças foi gerada digitalmente e contém assinaturas eletrónicas recolhidas durante a assembleia.</p>
              <p className="mt-2">As assinaturas eletrónicas têm validade legal conforme previsto no Dec-Lei n.º 290-D/99 e Regulamento (UE) n.º 910/2014.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quórum info */}
      <Card className={`border-2 ${
        (totalRepresentedCoefficient / totalCoefficient) >= 0.5
          ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20'
          : 'border-yellow-200 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-950/20'
      }`}>
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="font-semibold mb-2">Estado do Quórum</h3>
            <div className="space-y-2">
              <p className="text-sm">
                <strong>Primeira convocatória:</strong> Requer &gt;50% de permilagem ({(totalCoefficient * 0.5).toFixed(1)}‰)
              </p>
              <p className="text-sm">
                <strong>Segunda convocatória:</strong> Requer &gt;25% de permilagem ({(totalCoefficient * 0.25).toFixed(1)}‰)
              </p>
              <div className={`mt-4 p-3 rounded-lg ${
                (totalRepresentedCoefficient / totalCoefficient) >= 0.5
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                  : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
              }`}>
                <p className="font-medium">
                  {(totalRepresentedCoefficient / totalCoefficient) >= 0.5
                    ? '✓ Quórum válido para primeira convocatória'
                    : '⚠️ Quórum insuficiente para primeira convocatória'
                  }
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrevious}>
          Anterior
        </Button>
        <Button onClick={handleContinue} variant="workflow" size="lg">
          Continuar com verificação
        </Button>
      </div>
    </div>
  );
};

export default ControlAsistenciaStep;
