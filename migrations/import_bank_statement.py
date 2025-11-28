#!/usr/bin/env python3
"""
Script para importar extrato bancário BPI para a base de dados
Cria transações com categorias e vincula a membros e períodos financeiros
"""

import csv
import re
from datetime import datetime
from decimal import Decimal

# Mapeamento de nomes no extrato para IDs de membros (vou buscar da BD)
MEMBER_MAPPING = {
    'VITOR MANUEL SEBASTIAN RODRIGUES': 'vitor',
    'VITOR RODRIGUES': 'vitor',
    'JOAO MANUEL FERNANDES LONGO': 'joao',
    'Joao Longo': 'joao',
    'ANTONIO MANUEL CARACA BAIAO': 'antonio',
    'Antonio Beirao': 'antonio',
    'CRISTINA MARIA BERTOLO GOUVEIA': 'cristina',
    'Cristina Gouveia': 'cristina',
    'ALEXANDRE MARTINS DA SILVA': 'cristina',  # Pagamento por outra pessoa
    'CARLOTA LOPES BERTOLO GOUVEIA': 'cristina',  # Família
    'MARIA ALDINA SEQUEIRA': 'aldina',
    'Aldina Sequeira': 'aldina',
    'DEPOSITO EM NUMERARIO ALINA': 'aldina',
    'JOSE MANUEL COSTA RICARDO': 'jose',
    'Jose Ricardo': 'jose',
}

# Categorias de despesas
EXPENSE_CATEGORIES = {
    'SU Eletricidade': 'Luz',
    'SU ELETRICIDADE': 'Luz',
    'COBR SEPA SU ELETRICIDADE': 'Luz',
    'Manutenção Conta': 'Despesas Bancárias',
    'MANUTENCAO DE CONTA': 'Despesas Bancárias',
    'Inposto Selo Conta': 'Despesas Bancárias',
    'IMPOSTO DE SELO': 'Despesas Bancárias',
    'FIDELIDADE': 'Seguros',
    'Allianz': 'Seguros',
    'ALLIANZ': 'Seguros',
    'Vicencia': 'Limpeza',
    'Copimatica': 'Administração',
    'Jose Rodrigues': 'Manutenção',
    'Cartao': 'Despesas Bancárias'
}

def parse_date(date_str):
    """Converte data DD/MM/YYYY para YYYY-MM-DD"""
    try:
        dt = datetime.strptime(date_str, '%d/%m/%Y')
        return dt.strftime('%Y-%m-%d')
    except:
        return None

def parse_amount(amount_str):
    """Converte string de valor para Decimal"""
    try:
        # Remove espaços e troca vírgula por ponto
        amount = amount_str.replace(' ', '').replace(',', '.')
        return Decimal(amount)
    except:
        return Decimal('0')

def identify_member(description, beneficiary):
    """Identifica o membro baseado na descrição e beneficiário"""
    text = f"{description} {beneficiary}".upper()

    for name_pattern, member_key in MEMBER_MAPPING.items():
        if name_pattern.upper() in text:
            return member_key

    return None

def identify_category(description, beneficiary, transferencia):
    """Identifica a categoria da despesa"""
    text = f"{description} {beneficiary} {transferencia}".upper()

    for pattern, category in EXPENSE_CATEGORIES.items():
        if pattern.upper() in text:
            return category

    # Se não identificou, tentar padrões genéricos
    if 'ELETRICIDADE' in text or 'EL-E' in text:
        return 'Luz'
    elif 'IMPOSTO' in text or 'SELO' in text:
        return 'Despesas Bancárias'
    elif 'MANUTENCAO' in text or 'COMISSAO' in text:
        return 'Despesas Bancárias'
    elif 'SEGURO' in text or 'FIDELIDADE' in text or 'ALLIANZ' in text:
        return 'Seguros'
    elif 'LIMPEZA' in text or 'VICENCIA' in text:
        return 'Limpeza'

    return 'Outros'

def is_quota_payment(description, categoria):
    """Verifica se é pagamento de quota"""
    quota_keywords = ['QUOTA', 'TRF CR', 'TRANSFERENCIA', 'NUMERARIO']
    categoria_keywords = ['Quota', 'INICIO', 'Prestamos > Socios', 'Reembolsos Anulaciones']

    desc_upper = description.upper()

    # Se tem palavra-chave de categoria de quota, é quota
    for keyword in categoria_keywords:
        if keyword in categoria:
            return True

    # Se tem palavra-chave na descrição E é receita (valor positivo)
    for keyword in quota_keywords:
        if keyword in desc_upper:
            return True

    return False

def generate_sql_from_csv(csv_content):
    """Gera SQL a partir do conteúdo CSV"""

    lines = csv_content.strip().split('\n')
    reader = csv.DictReader(lines)

    transactions_income = []
    transactions_expense = []

    for row in reader:
        date = parse_date(row['Fecha'])
        if not date:
            continue

        amount = parse_amount(row['Importe'])
        if amount == 0:
            continue

        description = row['Descripción']
        beneficiary = row['Beneficiario']
        transferencia = row['Transferencias']
        categoria = row['Categoría']
        memoria = row['Memoria']

        # Determinar tipo (income ou expense)
        is_income = amount > 0

        # Identificar membro (para income)
        member_key = identify_member(description, beneficiary) if is_income else None

        # Determinar se é pagamento de quota
        is_fee = is_quota_payment(description, categoria) if is_income else False

        # Categoria para despesas
        expense_category = identify_category(description, beneficiary, transferencia) if not is_income else None

        # Montar descrição completa
        full_description = description
        if memoria and memoria.strip() and memoria != description:
            full_description += f" - {memoria}"

        transaction = {
            'date': date,
            'type': 'income' if is_income else 'expense',
            'description': full_description,
            'amount': abs(amount),
            'member_key': member_key,
            'is_fee_payment': is_fee,
            'category': expense_category,
            'beneficiary': beneficiary,
            'original_categoria': categoria
        }

        if is_income:
            transactions_income.append(transaction)
        else:
            transactions_expense.append(transaction)

    return transactions_income, transactions_expense

# Conteúdo do CSV (colado aqui para processar)
CSV_CONTENT = """... (CSV será inserido no próximo passo)"""

if __name__ == '__main__':
    income, expenses = generate_sql_from_csv(CSV_CONTENT)

    print(f"Transações processadas:")
    print(f"  Receitas (Income): {len(income)}")
    print(f"  Despesas (Expense): {len(expenses)}")

    # Estatísticas por membro
    member_stats = {}
    for t in income:
        if t['member_key']:
            if t['member_key'] not in member_stats:
                member_stats[t['member_key']] = {'count': 0, 'total': Decimal('0')}
            member_stats[t['member_key']]['count'] += 1
            member_stats[t['member_key']]['total'] += t['amount']

    print(f"\nPagamentos por membro:")
    for member, stats in sorted(member_stats.items()):
        print(f"  {member}: {stats['count']} pagamentos, Total: €{stats['total']:.2f}")
