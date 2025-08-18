const { AppError } = require('../utils/errors');
const validate = (schema) => (req, _res, next) => {
  const { value, error } = schema.validate(
    { params: req.params, query: req.query, body: req.body },
    { abortEarly: false, stripUnknown: true }
  );
  if (error) return next(new AppError(error.details.map(d => d.message).join('; '), 422));
  req.valid = value;
  next();
};
module.exports = { validate };
