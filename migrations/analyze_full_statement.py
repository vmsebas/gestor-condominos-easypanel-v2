#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Análise COMPLETA do extracto bancário BPI 2021-2025
Calcula saldos reais ano a ano com dados 100% do extracto
"""

import csv
import io
from datetime import datetime
from decimal import Decimal
from collections import defaultdict

# CSV completo fornecido pelo utilizador
CSV_DATA = """Cuentas","Transferencias","Descripción","Beneficiario","Categoría","Fecha","Hora","Memoria","Importe","Moneda","Número de cheque","Etiquetas"
"BPI COND. BURACA","","TRF CR INTRAB 492 DE VITOR MANUEL SEBASTIAN RODRIGUES","Trf Cr Intrab","Prestamos > Socios","13/11/2025","12:00","TRF CR INTRAB 492 DE VITOR MANUEL SEBASTIAN RODRIGUES","26,13","EUR","",""
"BPI COND. BURACA","","TRF CR SEPA+ 0000030 DE JOAO MANUEL FERNANDES LONGO","Trf Cr Sepa+","Reembolsos Anulaciones","10/11/2025","12:00","TRF CR SEPA+ 0000030 DE JOAO MANUEL FERNANDES LONGO","43,54","EUR","",""
"BPI COND. BURACA","","IMPOSTO DE SELO OUT 2025","Imposto De Selo Out 202","","07/11/2025","12:00","","-0,32","EUR","",""
"BPI COND. BURACA","","MANUTENCAO DE CONTA VALOR NEGOCIOS OUT 2025","Manutencao De Conta Valor Negocios","GASTOS FINANCIEROS > BANCOS > Tarifa banco","07/11/2025","12:00","MANUTENCAO DE CONTA VALOR NEGOCIOS OUT 2025","-7,99","EUR","",""
"BPI COND. BURACA","","DD SU ELETRICIDADE, S.A. 100000862991","SU Eletricidade","Despesas de condomínio > LUZ","27/10/2025","12:00","DD SU ELETRICIDADE, S.A. 100000862991","-6,82","EUR","",""
"BPI COND. BURACA","","TRF CR INTRAB 492 DE VITOR MANUEL SEBASTIAN RODRIGUES","Trf Cr Intrab","Prestamos > Socios","13/10/2025","12:00","TRF CR INTRAB 492 DE VITOR MANUEL SEBASTIAN RODRIGUES","26,13","EUR","",""
"BPI COND. BURACA","","TRF CR SEPA+ 0000029 DE JOAO MANUEL FERNANDES LONGO","Trf Cr Sepa+","Reembolsos Anulaciones","08/10/2025","12:00","TRF CR SEPA+ 0000029 DE JOAO MANUEL FERNANDES LONGO","43,54","EUR","",""
"BPI COND. BURACA","","MANUTENCAO DE CONTA VALOR NEGOCIOS SET 2025","Manutencao De Conta Valor Negocios","GASTOS FINANCIEROS > BANCOS > Tarifa banco","07/10/2025","12:00","MANUTENCAO DE CONTA VALOR NEGOCIOS SET 2025","-7,99","EUR","",""
"BPI COND. BURACA","","IMPOSTO DE SELO SET 2025","Imposto De Selo Set 202","","07/10/2025","12:00","","-0,32","EUR","",""
"BPI COND. BURACA","","DD SU ELETRICIDADE, S.A. 100000862991","SU Eletricidade","Despesas de condomínio > LUZ","26/09/2025","12:00","DD SU ELETRICIDADE, S.A. 100000862991","-6,59","EUR","",""
"BPI COND. BURACA","","TRF CR INTRAB 492 DE VITOR MANUEL SEBASTIAN RODRIGUES","VITOR RODRIGUES","Quota > Fraçao A - RC/DTO","15/09/2025","12:00","TRF CR INTRAB 492 DE VITOR MANUEL SEBASTIAN RODRIGUES","26,13","EUR","",""
"BPI COND. BURACA","","TRF CR SEPA+ 0000028 DE JOAO MANUEL FERNANDES LONGO","Joao Longo","Quota > Fraçao E - 2º DTO","08/09/2025","12:00","TRF CR SEPA+ 0000028 DE JOAO MANUEL FERNANDES LONGO","43,54","EUR","",""
"BPI COND. BURACA","","MANUTENCAO DE CONTA VALOR NEGOCIOS AGO 2025","Manutenção Conta","Despesas de condomínio > BANCO","05/09/2025","12:00","MANUTENCAO DE CONTA VALOR NEGOCIOS AGO 2025","-7,99","EUR","",""
"BPI COND. BURACA","","IMPOSTO DE SELO AGO 2025","Inposto Selo Conta","Despesas de condomínio > BANCO","05/09/2025","12:00","","-0,32","EUR","",""
"BPI COND. BURACA","","DEPOSITO EM NUMERARIO","Aldina Sequeira","Quota > Fraçao B - RC/ESQ","29/08/2025","12:00","","156,78","EUR","",""
"BPI COND. BURACA","","DD SU ELETRICIDADE, S.A. 100000862991","SU Eletricidade","Despesas de condomínio > LUZ","28/08/2025","12:00","DD SU ELETRICIDADE, S.A. 100000862991","-6,93","EUR","",""
"BPI COND. BURACA","","TRF CR INTRAB 492 DE VITOR MANUEL SEBASTIAN RODRIGUES","VITOR RODRIGUES","Quota > Fraçao A - RC/DTO","13/08/2025","12:00","TRF CR INTRAB 492 DE VITOR MANUEL SEBASTIAN RODRIGUES","26,13","EUR","",""
"BPI COND. BURACA","","TRF CR SEPA+ 0000027 DE JOAO MANUEL FERNANDES LONGO","Joao Longo","Quota > Fraçao E - 2º DTO","08/08/2025","12:00","TRF CR SEPA+ 0000027 DE JOAO MANUEL FERNANDES LONGO","43,54","EUR","",""
"BPI COND. BURACA","","MANUTENCAO DE CONTA VALOR NEGOCIOS JUL 2025","Manutenção Conta","Despesas de condomínio > BANCO","07/08/2025","12:00","MANUTENCAO DE CONTA VALOR NEGOCIOS JUL 2025","-7,99","EUR","",""
"BPI COND. BURACA","","IMPOSTO DE SELO JUL 2025","Inposto Selo Conta","Despesas de condomínio > BANCO","07/08/2025","12:00","","-0,32","EUR","",""
"BPI COND. BURACA","","DD SU ELETRICIDADE, S.A. 100000862991","SU Eletricidade","Despesas de condomínio > LUZ","28/07/2025","12:00","DD SU ELETRICIDADE, S.A. 100000862991","-6,65","EUR","",""
"BPI COND. BURACA","","TRF CR INTRAB 492 DE VITOR MANUEL SEBASTIAN RODRIGUES","VITOR RODRIGUES","Quota > Fraçao A - RC/DTO","14/07/2025","12:00","TRF CR INTRAB 492 DE VITOR MANUEL SEBASTIAN RODRIGUES","26,13","EUR","",""
"BPI COND. BURACA","","TRF CR SEPA+ 0000026 DE JOAO MANUEL FERNANDES LONGO","Joao Longo","Quota > Fraçao E - 2º DTO","08/07/2025","12:00","TRF CR SEPA+ 0000026 DE JOAO MANUEL FERNANDES LONGO","43,54","EUR","",""
"BPI COND. BURACA","","MANUTENCAO DE CONTA VALOR NEGOCIOS JUN 2025","Manutenção Conta","Despesas de condomínio > BANCO","08/07/2025","12:00","MANUTENCAO DE CONTA VALOR NEGOCIOS JUN 2025","-7,99","EUR","",""
"BPI COND. BURACA","","IMPOSTO DE SELO JUN 2025","Inposto Selo Conta","Despesas de condomínio > BANCO","08/07/2025","12:00","","-0,32","EUR","",""
"BPI COND. BURACA","","DD SU ELETRICIDADE, S.A. 100000862991","SU Eletricidade","Despesas de condomínio > LUZ","30/06/2025","12:00","DD SU ELETRICIDADE, S.A. 100000862991","-6,93","EUR","",""
"BPI COND. BURACA","","TRF CR INTRAB 492 DE VITOR MANUEL SEBASTIAN RODRIGUES","VITOR RODRIGUES","Quota > Fraçao A - RC/DTO","13/06/2025","12:00","TRF CR INTRAB 492 DE VITOR MANUEL SEBASTIAN RODRIGUES","26,13","EUR","",""
"BPI COND. BURACA","","MANUTENCAO DE CONTA VALOR NEGOCIOS MAI 2025","Manutenção Conta","Despesas de condomínio > BANCO","10/06/2025","12:00","MANUTENCAO DE CONTA VALOR NEGOCIOS MAI 2025","-7,99","EUR","",""
"BPI COND. BURACA","","IMPOSTO DE SELO MAI 2025","Inposto Selo Conta","Despesas de condomínio > BANCO","10/06/2025","12:00","","-0,32","EUR","",""
"BPI COND. BURACA","","TRF CR SEPA+ 0000025 DE JOAO MANUEL FERNANDES LONGO","Joao Longo","Quota > Fraçao E - 2º DTO","09/06/2025","12:00","TRF CR SEPA+ 0000025 DE JOAO MANUEL FERNANDES LONGO","43,54","EUR","",""
"BPI COND. BURACA","","COBR SEPA SU ELETRICIDADE S.A.","SU Eletricidade","Despesas de condomínio > LUZ","29/05/2025","12:00","","-6,65","EUR","",""
"BPI COND. BURACA","","IMPOSTO DE SELO ABR 2025","Inposto Selo Conta","Despesas de condomínio > BANCO","13/05/2025","12:00","","-0,32","EUR","",""
"BPI COND. BURACA","","MANUTENCAO DE CONTA VALOR NEGOCIOS ABR 2025","Manutenção Conta","Despesas de condomínio > BANCO","09/05/2025","12:00","","-7,99","EUR","",""
"BPI COND. BURACA","","TRF CR INTRAB 492 DE VITOR MANUEL SEBASTIAN RODRIGUES","VITOR RODRIGUES","Quota > Fraçao A - RC/DTO","08/05/2025","12:00","","26,13","EUR","",""
"BPI COND. BURACA","","TRF CR SEPA+ 0000024 DE JOAO MANUEL FERNANDES LONGO","Joao Longo","Quota > Fraçao E - 2º DTO","08/05/2025","12:00","","43,54","EUR","",""
"BPI COND. BURACA","","TRF CR INTRAB 492 DE VITOR MANUEL SEBASTIAN RODRIGUES","VITOR RODRIGUES","Quota > Fraçao A - RC/DTO","30/04/2025","12:00","","26,13","EUR","",""
"BPI COND. BURACA","","TRF CR SEPA+ 0000023 DE JOAO MANUEL FERNANDES LONGO","Joao Longo","Quota > Fraçao E - 2º DTO","14/04/2025","12:00","","43,54","EUR","",""
"BPI COND. BURACA","","IMPOSTO DE SELO MAR 2025","Inposto Selo Conta","Despesas de condomínio > BANCO","08/04/2025","12:00","","-0,32","EUR","",""
"BPI COND. BURACA","","MANUTENCAO DE CONTA VALOR NEGOCIOS MAR 2025","Manutenção Conta","Despesas de condomínio > BANCO","07/04/2025","12:00","","-7,99","EUR","",""
"BPI COND. BURACA","","COBR SEPA SU ELETRICIDADE S.A.","SU Eletricidade","Despesas de condomínio > LUZ","05/04/2025","12:00","","-6,93","EUR","",""
"BPI COND. BURACA","","TRF CR SEPA+ 0000022 DE JOAO MANUEL FERNANDES LONGO","Joao Longo","Quota > Fraçao E - 2º DTO","01/04/2025","12:00","","130,62","EUR","",""
"BPI COND. BURACA","","TRF 21 DE JOAO MANUEL FERNANDES LONGO","Aldina Sequeira","Quota > Fraçao B - RC/ESQ","30/03/2025","12:00","","156,78","EUR","",""
"BPI COND. BURACA","","TRF CR INTRAB 492 DE VITOR MANUEL SEBASTIAN RODRIGUES","VITOR RODRIGUES","Quota > Fraçao A - RC/DTO","26/03/2025","12:00","","26,13","EUR","",""
"BPI COND. BURACA","","IMPOSTO DE SELO FEV 2025","Inposto Selo Conta","Despesas de condomínio > BANCO","13/03/2025","12:00","","-0,32","EUR","",""
"BPI COND. BURACA","","MANUTENCAO DE CONTA VALOR NEGOCIOS FEV 2025","Manutenção Conta","Despesas de condomínio > BANCO","10/03/2025","12:00","","-7,99","EUR","",""
"BPI COND. BURACA","","COBR SEPA SU ELETRICIDADE S.A.","SU Eletricidade","Despesas de condomínio > LUZ","08/03/2025","12:00","","-6,47","EUR","",""
"BPI COND. BURACA","","TRF 20 DE JOSE MANUEL COSTA RICARDO","Jose Ricardo","Quota > Fraçao F - 2º ESQ","26/02/2025","12:00","","1629,24","EUR","",""
"BPI COND. BURACA","","TRF CR SEPA+ 0000019 DE ANTONIO MANUEL CARACA BAIAO","Antonio Beirao","Quota > Fraçao C - 1º DTO","24/02/2025","12:00","","487,62","EUR","",""
"BPI COND. BURACA","","TRF CR INTRAB 125 DE CRISTINA MARIA BERTOLO GOUVEIA","Cristina Gouveia","Quota > Fraçao D - 1º ESQ","13/02/2025","12:00","","684,24","EUR","",""
"BPI COND. BURACA","","COBR SEPA SU ELETRICIDADE S.A.","SU Eletricidade","Despesas de condomínio > LUZ","11/02/2025","12:00","","-5,89","EUR","",""
"BPI COND. BURACA","","LEVANTAMENTO EM ATM BPI","Vicencia","Limpeza","11/02/2025","12:00","","-50,00","EUR","",""
"BPI COND. BURACA","","IMPOSTO DE SELO JAN 2025","Inposto Selo Conta","Despesas de condomínio > BANCO","10/02/2025","12:00","","-0,32","EUR","",""
"BPI COND. BURACA","","MANUTENCAO DE CONTA VALOR NEGOCIOS JAN 2025","Manutenção Conta","Despesas de condomínio > BANCO","07/02/2025","12:00","","-7,99","EUR","",""
"BPI COND. BURACA","","COBR SEPA FIDELIDADE COMPANHIA DE SEGUROS","FIDELIDADE","Despesas de condomínio > SEGUROS","07/02/2025","12:00","","-807,15","EUR","",""
"BPI COND. BURACA","","COMPRA COPIMATICA LDA","Copimatica","Administração","03/02/2025","12:00","","-12,13","EUR","",""
"BPI COND. BURACA","","TRF CR INTRAB 492 DE VITOR MANUEL SEBASTIAN RODRIGUES","VITOR RODRIGUES","Quota > Fraçao A - RC/DTO","02/02/2025","12:00","","26,13","EUR","",""
"BPI COND. BURACA","","TRF CR INTRAB 657 DE VITOR MANUEL SEBASTIAN RODRIGUES","VITOR RODRIGUES","Quota > Fraçao A - RC/DTO","31/01/2025","12:00","","156,78","EUR","",""
"BPI COND. BURACA","","TRF CRED SEPA+ TRANSFERENCIA ATM","Vicencia","Limpeza","31/01/2025","12:00","","-753,13","EUR","",""
"BPI COND. BURACA","","PAGAMENTO DE SERVICOS 696752477","SU Eletricidade","Despesas de condomínio > LUZ","13/01/2025","12:00","","-1,04","EUR","",""
"BPI COND. BURACA","","IMPOSTO DE SELO DEZ 2024","Inposto Selo Conta","Despesas de condomínio > BANCO","13/01/2025","12:00","","-0,32","EUR","",""
"BPI COND. BURACA","","PAGAMENTO DE SERVICOS 576954380","SU Eletricidade","Despesas de condomínio > LUZ","08/01/2025","12:00","","-9,26","EUR","",""
"BPI COND. BURACA","","TRF CR INTRAB 492 DE VITOR MANUEL SEBASTIAN RODRIGUES","VITOR RODRIGUES","Quota > Fraçao A - RC/DTO","08/01/2025","12:00","","26,13","EUR","",""
"BPI COND. BURACA","","MANUTENCAO DE CONTA VALOR NEGOCIOS DEZ 2024","Manutenção Conta","Despesas de condomínio > BANCO","08/01/2025","12:00","","-7,99","EUR","",""
"""

# Continuarei com resto do CSV...

print("🔍 ANÁLISE COMPLETA DO EXTRACTO BPI")
print("=" * 80)
print()
print("Script criado. A adicionar resto do CSV...")
