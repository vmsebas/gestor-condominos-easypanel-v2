const Joi = require('joi');
const { ValidationError } = require('../utils/errors.cjs');

/**
 * Middleware para validar datos de entrada usando esquemas Joi
 * @param {Object} schema - Esquema de validación Joi
 * @param {string} property - Propiedad a validar ('body', 'query', 'params')
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // Obtener todos los errores, no solo el primero
      stripUnknown: true // Eliminar propiedades no definidas en el esquema
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return next(new ValidationError('Erro de validação', errors));
    }

    // Reemplazar los datos con los valores validados y transformados
    req[property] = value;
    next();
  };
};

// Esquemas de validación comunes
const schemas = {
  // Esquema para edificios
  building: {
    create: Joi.object({
      name: Joi.string().trim().min(3).max(100).required()
        .messages({
          'string.min': 'O nome do edifício deve ter pelo menos 3 caracteres',
          'string.max': 'O nome do edifício não pode exceder 100 caracteres',
          'any.required': 'O nome do edifício é obrigatório'
        }),
      address: Joi.string().trim().min(5).max(200).required()
        .messages({
          'string.min': 'A morada deve ter pelo menos 5 caracteres',
          'any.required': 'A morada é obrigatória'
        }),
      postal_code: Joi.string().trim().pattern(/^\d{4}-\d{3}$/).allow('', null)
        .messages({
          'string.pattern.base': 'O código postal deve estar no formato XXXX-XXX'
        }),
      city: Joi.string().trim().min(2).max(100).allow('', null),
      number_of_units: Joi.number().integer().min(0).default(0)
        .messages({
          'number.min': 'O número de unidades não pode ser negativo'
        }),
      administrator: Joi.string().trim().max(100).allow('', null),
      admin_contact: Joi.string().trim().max(20).allow('', null),
      admin_email: Joi.string().trim().email().allow('', null)
        .messages({
          'string.email': 'Formato de email inválido'
        }),
      iban: Joi.string().trim().uppercase().pattern(/^[A-Z]{2}\d{2}[A-Z0-9]+$/).allow('', null)
        .messages({
          'string.pattern.base': 'Formato de IBAN inválido'
        }),
      bank: Joi.string().trim().max(100).allow('', null),
      account_number: Joi.string().trim().max(50).allow('', null),
      swift: Joi.string().trim().uppercase().length(11).allow('', null)
        .messages({
          'string.length': 'O código SWIFT deve ter exatamente 11 caracteres'
        })
    }),
    
    update: Joi.object({
      name: Joi.string().trim().min(3).max(100),
      address: Joi.string().trim().min(5).max(200),
      postal_code: Joi.string().trim().pattern(/^\d{4}-\d{3}$/).allow('', null),
      city: Joi.string().trim().min(2).max(100).allow('', null),
      number_of_units: Joi.number().integer().min(0),
      administrator: Joi.string().trim().max(100).allow('', null),
      admin_contact: Joi.string().trim().max(20).allow('', null),
      admin_email: Joi.string().trim().email().allow('', null),
      iban: Joi.string().trim().uppercase().pattern(/^[A-Z]{2}\d{2}[A-Z0-9]+$/).allow('', null),
      bank: Joi.string().trim().max(100).allow('', null),
      account_number: Joi.string().trim().max(50).allow('', null),
      swift: Joi.string().trim().uppercase().length(11).allow('', null)
    }).min(1) // Al menos un campo debe estar presente
  },

  // Esquema para paginación
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(20),
    orderBy: Joi.string().valid('name', 'created_at', 'updated_at').default('name'),
    orderDesc: Joi.boolean().default(false),
    search: Joi.string().trim().min(2).max(50)
  }),

  // Esquema para ID en parámetros
  idParam: Joi.object({
    id: Joi.string().uuid().required()
      .messages({
        'string.guid': 'Formato de ID inválido',
        'any.required': 'ID é obrigatório'
      })
  }),

  // Esquema para miembros
  member: {
    create: Joi.object({
      building_id: Joi.string().uuid().required(),
      name: Joi.string().trim().min(3).max(100).required(),
      apartment: Joi.string().trim().max(20).required(),
      fraction: Joi.string().trim().max(20).allow('', null),
      votes: Joi.number().integer().min(0).default(0),
      email: Joi.string().trim().email().allow('', null),
      phone: Joi.string().trim().max(20).allow('', null),
      nif: Joi.string().trim().pattern(/^\d{9}$/).allow('', null)
        .messages({
          'string.pattern.base': 'O NIF deve ter 9 dígitos'
        }),
      is_active: Joi.boolean().default(true),
      permilage: Joi.number().min(0).max(1000).default(0),
      old_annual_fee: Joi.number().min(0).default(0),
      old_monthly_fee: Joi.number().min(0).default(0),
      new_annual_fee: Joi.number().min(0).default(0),
      new_monthly_fee: Joi.number().min(0).default(0),
      notes: Joi.string().max(1000).allow('', null)
    }),
    
    update: Joi.object({
      name: Joi.string().trim().min(3).max(100),
      apartment: Joi.string().trim().max(20),
      fraction: Joi.string().trim().max(20).allow('', null),
      votes: Joi.number().integer().min(0),
      email: Joi.string().trim().email().allow('', null),
      phone: Joi.string().trim().max(20).allow('', null),
      nif: Joi.string().trim().pattern(/^\d{9}$/).allow('', null),
      is_active: Joi.boolean(),
      permilage: Joi.number().min(0).max(1000),
      old_annual_fee: Joi.number().min(0),
      old_monthly_fee: Joi.number().min(0),
      new_annual_fee: Joi.number().min(0),
      new_monthly_fee: Joi.number().min(0),
      notes: Joi.string().max(1000).allow('', null)
    }).min(1),
    
    query: Joi.object({
      buildingId: Joi.string().uuid().allow('', null),
      isActive: Joi.string().valid('true', 'false'),
      search: Joi.string().trim().max(100),
      page: Joi.number().integer().min(1).default(1),
      pageSize: Joi.number().integer().min(1).max(100).default(20),
      orderBy: Joi.string().valid('name', 'apartment', 'monthly_fee', 'created_at').default('apartment'),
      orderDesc: Joi.boolean().default(false)
    }),
    
    fees: Joi.object({
      oldAnnualFee: Joi.number().min(0).required(),
      oldMonthlyFee: Joi.number().min(0).required(),
      newAnnualFee: Joi.number().min(0).required(),
      newMonthlyFee: Joi.number().min(0).required()
    })
  },

  // Esquema para transacciones
  transaction: {
    create: Joi.object({
      building_id: Joi.string().uuid().required(),
      transaction_date: Joi.date().iso().required(),
      transaction_type: Joi.string().valid('income', 'expense').required(),
      description: Joi.string().trim().min(3).max(500).required(),
      amount: Joi.number().positive().required()
        .messages({
          'number.positive': 'O valor deve ser maior que 0'
        }),
      category_id: Joi.string().uuid().allow(null),
      member_id: Joi.string().uuid().allow(null),
      payment_method: Joi.string().max(50).allow('', null),
      reference_number: Joi.string().max(100).allow('', null),
      notes: Joi.string().max(1000).allow('', null),
      is_recurring: Joi.boolean().default(false),
      recurring_months: Joi.array().items(Joi.number().min(1).max(12))
    })
  },

  // Esquemas de autenticación
  auth: {
    login: Joi.object({
      email: Joi.string().email().required()
        .messages({
          'string.email': 'Email inválido',
          'any.required': 'Email é obrigatório'
        }),
      password: Joi.string().min(6).required()
        .messages({
          'string.min': 'A palavra-passe deve ter pelo menos 6 caracteres',
          'any.required': 'Palavra-passe é obrigatória'
        }),
      deviceName: Joi.string().max(255).allow('', null)
    }),

    register: Joi.object({
      email: Joi.string().email().required()
        .messages({
          'string.email': 'Email inválido',
          'any.required': 'Email é obrigatório'
        }),
      password: Joi.string().min(6).max(100).required()
        .messages({
          'string.min': 'A palavra-passe deve ter pelo menos 6 caracteres',
          'any.required': 'Palavra-passe é obrigatória'
        }),
      name: Joi.string().trim().min(2).max(255).required()
        .messages({
          'string.min': 'O nome deve ter pelo menos 2 caracteres',
          'any.required': 'Nome é obrigatório'
        }),
      phone: Joi.string().trim().max(50).allow('', null),
      building_id: Joi.string().uuid().allow(null),
      member_id: Joi.string().uuid().allow(null)
    }),

    forgotPassword: Joi.object({
      email: Joi.string().email().required()
        .messages({
          'string.email': 'Email inválido',
          'any.required': 'Email é obrigatório'
        })
    }),

    resetPassword: Joi.object({
      token: Joi.string().required()
        .messages({
          'any.required': 'Token é obrigatório'
        }),
      password: Joi.string().min(6).max(100).required()
        .messages({
          'string.min': 'A palavra-passe deve ter pelo menos 6 caracteres',
          'any.required': 'Palavra-passe é obrigatória'
        })
    }),

    changePassword: Joi.object({
      currentPassword: Joi.string().required()
        .messages({
          'any.required': 'Palavra-passe atual é obrigatória'
        }),
      newPassword: Joi.string().min(6).max(100).required()
        .messages({
          'string.min': 'A nova palavra-passe deve ter pelo menos 6 caracteres',
          'any.required': 'Nova palavra-passe é obrigatória'
        })
    })
  },

  // Esquemas para convocatorias
  convocatoria: {
    create: Joi.object({
      building_id: Joi.string().uuid().required(),
      assembly_type: Joi.string().valid('ordinary', 'extraordinary').required(),
      date: Joi.date().iso().min('now').required()
        .messages({
          'date.min': 'A data não pode ser no passado'
        }),
      time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required()
        .messages({
          'string.pattern.base': 'Formato de hora inválido (HH:MM)'
        }),
      location: Joi.string().trim().max(500).allow('', null),
      second_call_enabled: Joi.boolean().default(false),
      second_call_date: Joi.when('second_call_enabled', {
        is: true,
        then: Joi.date().iso().min(Joi.ref('date')).required(),
        otherwise: Joi.date().allow(null)
      }),
      second_call_time: Joi.when('second_call_enabled', {
        is: true,
        then: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
        otherwise: Joi.string().allow('', null)
      }),
      administrator: Joi.string().trim().max(200).allow('', null),
      secretary: Joi.string().trim().max(200).allow('', null),
      legal_reference: Joi.string().trim().max(500).allow('', null),
      assembly_number: Joi.string().trim().max(50).allow('', null),
      agenda_items: Joi.array().items(
        Joi.object({
          title: Joi.string().trim().min(3).max(200).required(),
          description: Joi.string().trim().max(1000).allow('', null),
          order_number: Joi.number().integer().min(1)
        })
      ).default([])
    }),
    
    update: Joi.object({
      assembly_type: Joi.string().valid('ordinary', 'extraordinary'),
      date: Joi.date().iso().min('now'),
      time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      location: Joi.string().trim().max(500).allow('', null),
      second_call_enabled: Joi.boolean(),
      second_call_date: Joi.date().iso().allow(null),
      second_call_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).allow('', null),
      administrator: Joi.string().trim().max(200).allow('', null),
      secretary: Joi.string().trim().max(200).allow('', null),
      legal_reference: Joi.string().trim().max(500).allow('', null),
      assembly_number: Joi.string().trim().max(50).allow('', null),
      agenda_items: Joi.array().items(
        Joi.object({
          title: Joi.string().trim().min(3).max(200).required(),
          description: Joi.string().trim().max(1000).allow('', null),
          order_number: Joi.number().integer().min(1)
        })
      ),
      force_update: Joi.boolean().default(false)
    }).min(1),
    
    query: Joi.object({
      buildingId: Joi.string().uuid().allow('', null),
      assemblyType: Joi.string().valid('ordinary', 'extraordinary'),
      fromDate: Joi.date().iso(),
      toDate: Joi.date().iso()
    }),
    
    generateNumber: Joi.object({
      buildingId: Joi.string().uuid().required(),
      assemblyType: Joi.string().valid('ordinary', 'extraordinary').required()
    })
  },
  
  // Esquemas para documentos
  document: {
    list: Joi.object({
      building_id: Joi.string().uuid(),
      member_id: Joi.string().uuid(),
      category: Joi.string().max(50),
      subcategory: Joi.string().max(50),
      visibility: Joi.string().valid('public', 'building', 'members_only', 'admin_only'),
      is_confidential: Joi.boolean(),
      is_current_version: Joi.boolean(),
      file_type: Joi.string().max(10),
      tags: Joi.string().max(200), // Comma-separated tags
      search_query: Joi.string().max(200),
      date_from: Joi.date().iso(),
      date_to: Joi.date().iso(),
      page: Joi.number().integer().min(1),
      limit: Joi.number().integer().min(1).max(100),
      order_by: Joi.string().valid('uploaded_at', 'name', 'file_size', 'download_count'),
      order_dir: Joi.string().valid('asc', 'desc')
    }),
    
    upload: Joi.object({
      building_id: Joi.string().uuid().required(),
      member_id: Joi.string().uuid().allow('', null),
      name: Joi.string().trim().max(255),
      category: Joi.string().max(50).default('general'),
      subcategory: Joi.string().max(50).allow('', null),
      tags: Joi.string().max(500), // JSON string array
      description: Joi.string().max(1000).allow('', null),
      version: Joi.number().integer().min(1),
      parent_document_id: Joi.string().uuid().allow('', null),
      visibility: Joi.string().valid('public', 'building', 'members_only', 'admin_only').default('building'),
      is_confidential: Joi.string().valid('true', 'false'),
      access_level: Joi.string().valid('read', 'edit', 'admin').default('read')
    }),
    
    update: Joi.object({
      name: Joi.string().trim().max(255),
      category: Joi.string().max(50),
      subcategory: Joi.string().max(50).allow('', null),
      tags: Joi.array().items(Joi.string().trim()),
      description: Joi.string().max(1000).allow('', null),
      visibility: Joi.string().valid('public', 'building', 'members_only', 'admin_only'),
      is_confidential: Joi.boolean(),
      access_level: Joi.string().valid('read', 'edit', 'admin')
    }).min(1),
    
    version: Joi.object({
      name: Joi.string().trim().max(255),
      description: Joi.string().max(1000).allow('', null),
      tags: Joi.string().max(500) // JSON string array
    }),
    
    share: Joi.object({
      member_id: Joi.string().uuid().required(),
      permission: Joi.string().valid('read', 'edit').default('read'),
      expires_at: Joi.date().iso().min('now').allow(null)
    }),
    
    category: Joi.object({
      name: Joi.string().trim().min(2).max(50).required(),
      description: Joi.string().trim().max(200).allow('', null),
      color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).default('#6B7280'),
      icon: Joi.string().max(50).allow('', null),
      parent_category_id: Joi.string().uuid().allow(null),
      sort_order: Joi.number().integer().min(0)
    })
  },
  
  // Esquema para buildingId en params
  buildingIdParam: Joi.object({
    buildingId: Joi.string().uuid().required()
      .messages({
        'string.guid': 'Formato de ID do edifício inválido',
        'any.required': 'ID do edifício é obrigatório'
      })
  }),
  
  // Esquemas comunes para validación
  common: {
    idParam: (paramName = 'id') => Joi.object({
      [paramName]: Joi.alternatives().try(
        Joi.string().uuid(),
        Joi.number().integer().positive()
      ).required()
        .messages({
          'alternatives.match': `Formato de ${paramName} inválido`,
          'any.required': `${paramName} é obrigatório`
        })
    }),

    uuidParam: (paramName = 'id') => Joi.object({
      [paramName]: Joi.string().uuid().required()
        .messages({
          'string.guid': `Formato de ${paramName} inválido`,
          'any.required': `${paramName} é obrigatório`
        })
    })
  }
};

module.exports = {
  validate,
  schemas
};