import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { UserCheck, UserX, Users, Search, Plus } from 'lucide-react';

interface Member {
  id: string;
  name: string;
  apartment: string;
  coefficient: number;
  present: boolean;
  represented: boolean;
  representedBy?: string;
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
  // Datos simulados de propietarios
  const [members] = useState<Member[]>([
    { id: '1', name: 'Juan Pérez', apartment: '1A', coefficient: 5.2, present: true, represented: false },
    { id: '2', name: 'María García', apartment: '1B', coefficient: 5.2, present: false, represented: true, representedBy: 'Ana García' },
    { id: '3', name: 'Carlos López', apartment: '2A', coefficient: 5.8, present: true, represented: false },
    { id: '4', name: 'Ana Martín', apartment: '2B', coefficient: 5.8, present: false, represented: false },
    { id: '5', name: 'Luis Ruiz', apartment: '3A', coefficient: 4.9, present: true, represented: false },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [attendanceData, setAttendanceData] = useState(data.attendance || {});

  const handleAttendanceChange = (memberId: string, field: keyof Member, value: any) => {
    const updatedData = {
      ...attendanceData,
      [memberId]: {
        ...attendanceData[memberId],
        [field]: value
      }
    };
    setAttendanceData(updatedData);
    onUpdate({ attendance: updatedData });
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

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Controlo de Presenças</h2>
        <p className="text-muted-foreground">
          Regista a presença e representações para a assembleia
        </p>
      </div>

      {/* Resumen de asistencia */}
      <div className="grid md:grid-cols-4 gap-4">
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
              <p className="text-sm text-muted-foreground">Coeficiente total</p>
              <p className="text-xs text-muted-foreground mt-1">
                {totalRepresentedCoefficient.toFixed(1)} / {totalCoefficient.toFixed(1)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Buscador */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Procurar proprietário ou apartamento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de propietarios */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Proprietários</CardTitle>
          <CardDescription>
            Marque a presença e gira as representações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredMembers.map((member) => {
              const memberData = attendanceData[member.id] || member;
              
              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-muted/30"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={memberData.present || false}
                          onCheckedChange={(checked) => 
                            handleAttendanceChange(member.id, 'present', checked)
                          }
                        />
                        <Label className="text-sm font-medium">Presente</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={memberData.represented || false}
                          onCheckedChange={(checked) => 
                            handleAttendanceChange(member.id, 'represented', checked)
                          }
                        />
                        <Label className="text-sm font-medium">Representado</Label>
                      </div>
                    </div>

                    <div className="flex-1">
                      <h3 className="font-medium">{member.name}</h3>
                      <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                        <span>Apartamento {member.apartment}</span>
                        <span>•</span>
                        <span>Coeficiente: {member.coefficient}%</span>
                      </div>
                      {memberData.representedBy && (
                        <div className="mt-1">
                          <Badge variant="outline" className="text-xs">
                            Representado por: {memberData.representedBy}
                          </Badge>
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
                <strong>Primeira convocatória:</strong> Requer &gt;50% de coeficientes ({(totalCoefficient * 0.5).toFixed(1)}%)
              </p>
              <p className="text-sm">
                <strong>Segunda convocatória:</strong> Requer &gt;25% de coeficientes ({(totalCoefficient * 0.25).toFixed(1)}%)
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
        <Button onClick={onNext} variant="workflow" size="lg">
          Continuar com verificação
        </Button>
      </div>
    </div>
  );
};

export default ControlAsistenciaStep;