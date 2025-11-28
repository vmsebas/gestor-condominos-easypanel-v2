#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Procesar extracto bancário BPI - TODAS las transacciones desde 2021
"""

import csv
import io
from datetime import datetime
from decimal import Decimal

# CSV completo del extracto (proporcionado por el usuario)
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

# Mapeo de nombres a member keys
MEMBER_MAP = {
    'VITOR': 'vitor',
    'JOAO': 'joao',
    'JOÃO': 'joao',
    'JOSE': 'jose',
    'JOSÉ': 'jose',
    'ANTONIO': 'antonio',
    'ANTÓNIO': 'antonio',
    'CRISTINA': 'cristina',
    'ALDINA': 'aldina',
    'MARIA ALDINA': 'aldina',
}

# Mapeo de categorías
CATEGORY_MAP = {
    'luz': 'a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e04',  # Electricidade
    'limpeza': 'a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e03',  # Limpeza
    'seguros': 'a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e06',  # Seguros
    'banco': 'a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e07',  # Despesas Bancárias
    'admin': 'a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e08',  # Administração
}

def parse_date(date_str):
    """Converte DD/MM/YYYY para YYYY-MM-DD"""
    try:
        dt = datetime.strptime(date_str, '%d/%m/%Y')
        return dt.strftime('%Y-%m-%d')
    except:
        return None

def parse_amount(amount_str):
    """Converte string com vírgula para Decimal"""
    try:
        return Decimal(amount_str.replace(',', '.'))
    except:
        return Decimal('0')

def identify_member(text):
    """Identifica membro pelo nome no texto"""
    text_upper = text.upper()
    for name, key in MEMBER_MAP.items():
        if name in text_upper:
            return key
    return None

def identify_category(text):
    """Identifica categoria da despesa"""
    text_upper = text.upper()

    if 'ELETRICIDADE' in text_upper or 'SU ELETRICIDADE' in text_upper:
        return CATEGORY_MAP['luz']
    elif 'LIMPEZA' in text_upper or 'VICENCIA' in text_upper:
        return CATEGORY_MAP['limpeza']
    elif 'SEGUROS' in text_upper or 'FIDELIDADE' in text_upper or 'ALLIANZ' in text_upper:
        return CATEGORY_MAP['seguros']
    elif 'MANUTENCAO' in text_upper or 'IMPOSTO' in text_upper or 'BANCO' in text_upper:
        return CATEGORY_MAP['banco']
    elif 'COPIMATICA' in text_upper:
        return CATEGORY_MAP['admin']

    return None

def is_quota_payment(categoria, beneficiario):
    """Determina se é pagamento de quota"""
    quota_keywords = ['Quota', 'Fraçao', 'INICIO', 'Prestamos > Socios', 'Reembolsos Anulaciones']
    text = f"{categoria} {beneficiario}"
    return any(kw in text for kw in quota_keywords)

# Procesar CSV
reader = csv.DictReader(io.StringIO(CSV_DATA))

transactions = []
for idx, row in enumerate(reader, 1):
    date = parse_date(row['Fecha'])
    if not date:
        continue

    amount = parse_amount(row['Importe'])
    if amount == 0:
        continue

    year = int(date.split('-')[0])
    is_income = amount > 0

    desc = row['Descripción']
    beneficiario = row['Beneficiario']
    categoria = row['Categoría']
    memoria = row['Memoria']

    # Descripción completa
    full_desc = desc
    if memoria and memoria != desc:
        full_desc += f" - {memoria}"

    # Identificar membro (solo para income)
    member_key = None
    is_fee = False
    if is_income:
        member_key = identify_member(f"{desc} {beneficiario}")
        is_fee = is_quota_payment(categoria, beneficiario)

    # Identificar categoría (solo para expense)
    category_id = None
    if not is_income:
        category_id = identify_category(f"{desc} {beneficiario} {categoria}")

    transactions.append({
        'idx': idx,
        'date': date,
        'year': year,
        'type': 'income' if is_income else 'expense',
        'amount': abs(amount),
        'description': full_desc,
        'member_key': member_key,
        'is_fee': is_fee,
        'category_id': category_id,
        'beneficiario': beneficiario
    })

# =====================================================
# GENERAR SQL COMPLETO
# =====================================================

print("-- =====================================================")
print("-- IMPORTAÇÃO COMPLETA DO EXTRATO BPI (2024-2025)")
print(f"-- Total de transações: {len(transactions)}")
print(f"-- Período: {transactions[-1]['date']} a {transactions[0]['date']}")
print("-- =====================================================")
print()

# Estatísticas
income_count = sum(1 for t in transactions if t['type'] == 'income')
expense_count = sum(1 for t in transactions if t['type'] == 'expense')
print(f"-- Receitas: {income_count} transações")
print(f"-- Despesas: {expense_count} transações")
print()

# Agrupar por membro (para receitas)
member_stats = {}
for t in transactions:
    if t['type'] == 'income' and t['member_key']:
        if t['member_key'] not in member_stats:
            member_stats[t['member_key']] = {'count': 0, 'total': Decimal('0')}
        member_stats[t['member_key']]['count'] += 1
        member_stats[t['member_key']]['total'] += t['amount']

print("-- Resumo de pagamentos por membro:")
for member, stats in sorted(member_stats.items()):
    print(f"--   {member}: {stats['count']} pagamentos = €{stats['total']:.2f}")
print()

# =====================================================
# COMEÇAR BLOCO PL/pgSQL
# =====================================================
print("DO $$")
print("DECLARE")
print("    v_building_id UUID := 'fb0d83d3-fe04-47cb-ba48-f95538a2a7fc';")
print("    v_period_2024_id UUID;")
print("    v_period_2025_id UUID;")

# Declarar variáveis para membros
member_keys = list(set(t['member_key'] for t in transactions if t['member_key']))
for member_key in sorted(member_keys):
    print(f"    v_{member_key}_id UUID;")

print("BEGIN")
print()

# Buscar IDs de períodos
print("    -- Buscar IDs de períodos financeiros")
print("    SELECT id INTO v_period_2024_id FROM financial_periods WHERE year = 2024;")
print("    SELECT id INTO v_period_2025_id FROM financial_periods WHERE year = 2025;")
print()

# Buscar IDs de membros
print("    -- Buscar IDs de membros")
for member_key in sorted(member_keys):
    member_name_pattern = {
        'vitor': 'Vítor%',
        'joao': 'João%',
        'antonio': 'António%',
        'cristina': 'Cristina%',
        'aldina': 'Maria Albina%',
        'jose': 'José%'
    }.get(member_key, f'{member_key.title()}%')

    print(f"    SELECT id INTO v_{member_key}_id FROM members WHERE name LIKE '{member_name_pattern}';")
print()

# =====================================================
# GERAR INSERTS POR ANO
# =====================================================
transactions_by_year = {}
for t in transactions:
    year = t['year']
    if year not in transactions_by_year:
        transactions_by_year[year] = []
    transactions_by_year[year].append(t)

for year in sorted(transactions_by_year.keys()):
    year_transactions = transactions_by_year[year]

    print(f"    -- =============================================")
    print(f"    -- ANO {year} ({len(year_transactions)} transações)")
    print(f"    -- =============================================")
    print()

    # Separar income e expense
    income_trans = [t for t in year_transactions if t['type'] == 'income']
    expense_trans = [t for t in year_transactions if t['type'] == 'expense']

    # RECEITAS
    if income_trans:
        print(f"    -- Receitas {year}")
        print("    INSERT INTO transactions (")
        print("        id, building_id, period_id, member_id,")
        print("        transaction_date, transaction_type, description, amount,")
        print("        is_fee_payment, payment_method, year")
        print("    ) VALUES")

        for idx, t in enumerate(income_trans):
            member_var = f"v_{t['member_key']}_id" if t['member_key'] else "NULL"
            period_var = f"v_period_{year}_id"
            is_fee = 'true' if t['is_fee'] else 'false'

            # Escapar aspas na descrição
            desc = t['description'].replace("'", "''")

            comma = ',' if idx < len(income_trans) - 1 else ';'

            print(f"        (uuid_generate_v4(), v_building_id, {period_var}, {member_var}, '{t['date']}', 'income', '{desc}', {t['amount']}, {is_fee}, 'Transferência Bancária', {year}){comma}")

        print()

    # DESPESAS
    if expense_trans:
        print(f"    -- Despesas {year}")
        print("    INSERT INTO transactions (")
        print("        id, building_id, period_id, category_id,")
        print("        transaction_date, transaction_type, description, amount,")
        print("        is_fee_payment, payment_method, year")
        print("    ) VALUES")

        for idx, t in enumerate(expense_trans):
            category_var = f"'{t['category_id']}'" if t['category_id'] else "NULL"
            period_var = f"v_period_{year}_id"

            # Escapar aspas na descrição
            desc = t['description'].replace("'", "''")

            comma = ',' if idx < len(expense_trans) - 1 else ';'

            print(f"        (uuid_generate_v4(), v_building_id, {period_var}, {category_var}, '{t['date']}', 'expense', '{desc}', {t['amount']}, false, 'Débito Direto', {year}){comma}")

        print()

print("END $$;")
print()

# =====================================================
# RECALCULAR SALDOS
# =====================================================
print("-- Recalcular todos os saldos dos membros")
print("SELECT * FROM recalculate_all_period_balances();")
print()

# =====================================================
# VERIFICAÇÕES FINAIS
# =====================================================
print("-- Verificar totais por ano")
print("SELECT")
print("    year,")
print("    transaction_type,")
print("    COUNT(*) AS num_transacoes,")
print("    SUM(amount) AS total")
print("FROM transactions")
print("WHERE year IN (2024, 2025)")
print("  AND deleted_at IS NULL")
print("GROUP BY year, transaction_type")
print("ORDER BY year, transaction_type;")
print()

print("-- Verificar saldos dos membros em 2025")
print("SELECT")
print("    m.name,")
print("    mpb.quota_expected_annual,")
print("    mpb.quota_paid_total,")
print("    mpb.balance,")
print("    mpb.status")
print("FROM member_period_balance mpb")
print("JOIN members m ON mpb.member_id = m.id")
print("JOIN financial_periods fp ON mpb.period_id = fp.id")
print("WHERE fp.year = 2025")
print("ORDER BY m.name;")
