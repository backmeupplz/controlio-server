const test = require('unit.js');
const errors = require('../../helpers/errors');

describe('helpers/errors.js', function () {
  it('creates a correct error', function () {
    const error = errors.notFound();
    test.object(error)
      .hasProperty('status', 404)
      .hasProperty('message', 'Not found')
      .hasProperty('type', 'NOT_FOUND_ERROR');
  });
  it('creates a correct error with field', function () {
    const error = errors.fieldNotFound('check');
    test.object(error)
      .hasProperty('status', 403)
      .hasProperty('message', 'Field \'check\' not found')
      .hasProperty('type', 'FIELD_NOT_FOUND_ERROR');
  });
  it('handles standartize of cast error', function () {
    const error = {
      name: 'CastError',
      message: 'check message',
      status: 1,
      type: 'check type',
    };
    test.object(errors.standardize(error))
      .hasProperty('status', 1)
      .hasProperty('message', 'check message')
      .hasProperty('type', 'check type');
  });
  it('handles standartize of empty cast error', function () {
    const error = {
      name: 'CastError',
    };
    test.object(errors.standardize(error))
      .hasProperty('status', 500)
      .hasProperty('message', 'Database error')
      .hasProperty('type', 'DB_ERROR');
  });
  it('handles standartize of validation error', function () {
    const error = {
      errors: [{
        field: 'check_field',
      },
      {
        field: 'check_field_2',
      }],
      message: 'validation error',
      status: 1,
      type: 'check type',
    };
    test.object(errors.standardize(error))
      .hasProperty('status', 1)
      .hasProperty('message', 'Something funky has happened at the "check_field" field.')
      .hasProperty('type', 'VALIDATION_ERROR');
  });
  it('handles standartize of empty validation error', function () {
    const error = {
      errors: [{
        field: 'check_field',
      },
      {
        field: 'check_field_2',
      }],
      message: 'validation error',
    };
    test.object(errors.standardize(error))
      .hasProperty('status', 500)
      .hasProperty('message', 'Something funky has happened at the "check_field" field.')
      .hasProperty('type', 'VALIDATION_ERROR');
  });
  it('handles standartize of other errors', function () {
    const error = {
      message: 'check message',
      status: 1,
      type: 'check type',
    };
    test.object(errors.standardize(error))
      .hasProperty('status', 1)
      .hasProperty('message', 'check message')
      .hasProperty('type', 'check type');
  });
  it('handles standartize of empty other errors', function () {
    const error = {};
    test.object(errors.standardize(error))
      .hasProperty('status', 500)
      .hasProperty('message', 'Server error')
      .hasProperty('type', 'UNDECLARED_ERROR');
  });
});
