/**
 * Module to generate errors
 */

/**
 * Error factory
 * @param {Number} status Status number of the error
 * @param {String} message Message of the error
 * @param {String} type Type of the error
 * @return {Error} Resulting error
 */
function error(status, message, type) {
  const err = new Error();
  err.message = message;
  err.status = status;
  err.type = type;
  return err;
}

/** Methods to generate various errors */

function notFound() {
  return error(404, 'Not found', 'NOT_FOUND_ERROR');
}
function noAccess() {
  return error(403, 'No access', 'NO_ACCESS_ERROR');
}
function authEmailNotRegistered() {
  return error(403, 'Email not registered', 'EMAIL_NOT_REGISTERED_ERROR');
}
function validManagerEmail() {
  return error(403, 'Please provide a valid manager email', 'INVALID_MANAGER_EMAIL_ERROR');
}
function authWrongPassword() {
  return error(403, 'Wrong password', 'WRONG_PASSWORD_ERROR');
}
function authTokenFailed() {
  return error(403, 'Failed to authenticate token', 'AUTH_TOKEN_FAILED_ERROR');
}
function authUserAlreadyExists() {
  return error(403, 'User already exists', 'USER_ALREADY_EXIST_ERROR');
}
function noApiKey() {
  return error(403, 'No API key provided', 'NO_API_KEY_ERROR');
}
function noUserFound() {
  return error(500, 'No user found', 'USER_NOT_FOUND_ERROR');
}
function passwordAlreadyExist() {
  return error(500, 'You already have a password', 'PASSWORD_ALREADY_EXIST_ERROR');
}
function passwordNotExist() {
  return error(500, 'You haven\'t set password yet. We sent you an email to set it.', 'PASSWORD_NOT_FOUND_ERROR');
}
function noOwnerFound() {
  return error(500, 'No owner found', 'OWNER_NOT_FOUND_ERROR');
}
function noManagerFound() {
  return error(500, 'No manager found', 'MANAGER_NOT_FOUND_ERROR');
}
function noClientObjectsCreated() {
  return error(500, 'No client objects created', 'CLIENT_OBJECT_NOT_CREATED_ERROR');
}
function addSelfAsManager() {
  return error(400, 'You cannot add yourself as a manager', 'ADD_SELF_AS_MANAGER_ERROR');
}
function addSelfAsClient() {
  return error(400, 'You cannot add yourself as a client', 'ADD_SELF_AS_CLIENT_ERROR');
}
function alreadyManager() {
  return error(400, 'This user is already a manager', 'USER_ALREADY_MANAGER_ERROR');
}
function noProjectFound() {
  return error(400, 'No project found', 'PROJECT_NOT_FOUND_ERROR');
}
function noPostFound() {
  return error(400, 'No post found', 'POST_NOT_FOUND_ERROR');
}
function noInviteFound() {
  return error(400, 'No invite found', 'INVITE_NOT_FOUND_ERROR');
}
function errorInitialStatus() {
  return error(400, 'Initial status should be less than 250 symbols', 'INITIAL_STATUS_ERROR');
}
function notAuthorized() {
  return error(403, 'Not authorized', 'NOT_AUTHORIZED_ERROR');
}
function magicLinkOnlyOnce() {
  return error(403, 'Magic link can be used only once', 'MAGIC_LINK_ALREADY_USED_ERROR');
}
function demoError() {
  return error(403, 'You cannot do this as a demo account', 'DEMO_ERROR');
}
function addDemoAsOwner() {
  return error(403, 'You cannot create project using a demo account', 'ADD_DEMO_AS_OWNER_ERROR');
}
function addDemoAsClient() {
  return error(403, 'You cannot add demo account as a client', 'ADD_DEMO_AS_CLIENT_ERROR');
}
function addDemoAsManager() {
  return error(403, 'You cannot add demo account as a manager', 'ADD_DEMO_AS_MANAGER_ERROR');
}
function removeYourselfAsManager() {
  return error(403, 'You cannot remove yourself as a manager', 'REMOVE_YOURSELF_AS_MANAGER_ERROR');
}
function userNotManager() {
  return error(403, 'This user is not your manager', 'NOT_YOUR_MANAGER_ERROR');
}
function fieldNotFound(field) {
  return error(403, `Field '${field}' not found`, 'FIELD_NOT_FOUND_ERROR');
}
function leaveAsOwner() {
  return error(403, 'You cannot leave the project as an owner', 'LEAVE_AS_OWNER_ERROR');
}
function leaveAsDemo() {
  return error(403, 'You cannot leave the project as a demo account', 'LEAVE_AS_DEMO_ERROR');
}
function managersOverLimit() {
  return error(403, 'This project has reached it\'s manager limits', 'MANAGER_LIMIT_ERROR');
}
function usersOverLimit() {
  return error(403, 'This project has reached it\'s users limits', 'USER_LIMIT_ERROR');
}
function projectIsFinished() {
  return error(403, 'This project was finished.', 'FINISHED_ERROR');
}
function wrongResetToken() {
  return error(403, 'Failed to authenticate password reset token', 'AUTH_PASS_RESET_TOKEN_FAILED');
}
function notEnoughProjectsOnPlan() {
  return error(403, 'Please upgrade your plan in settings', 'NOT_ENOUGH_PROJECTS_ERROR');
}

function standardize(originalError) {
  const resultError = new Error();
  if (originalError.name === 'CastError') {
    resultError.message = originalError.message || 'Database error';
    resultError.status = originalError.status || 500;
    resultError.type = originalError.type || 'DB_ERROR';
  } else if (originalError.message === 'validation error') {
    resultError.message = `Something funky has happened at the "${originalError.errors[0].field}" field.`;
    resultError.status = originalError.status || 500;
    resultError.type = 'VALIDATION_ERROR';
  } else if (originalError.name === 'TokenExpiredError') {
    resultError.message = `Token expired "${originalError.expiredAt}".`;
    resultError.status = 403;
    resultError.type = 'TOKEN_EXPIRED_ERROR';
  } else {
    resultError.message = originalError.message || 'Server error';
    resultError.status = originalError.status || 500;
    resultError.type = originalError.type || 'UNDECLARED_ERROR';
  }
  return resultError;
}

/** Localization */
const localizedList = {
  NOT_FOUND_ERROR: {
    en: 'Not found',
    ru: 'Ресурс не найден',
  },
  NO_ACCESS_ERROR: {
    en: 'No acess',
    ru: 'Нет доступа',
  },
  EMAIL_NOT_REGISTERED_ERROR: {
    en: 'Email not registered',
    ru: 'Email не зарегистрирован',
  },
  INVALID_MANAGER_EMAIL_ERROR: {
    en: 'Please provide a valid manager email',
    ru: 'Пожалуйста, введите корректный email менеджера',
  },
  WRONG_PASSWORD_ERROR: {
    en: 'Wrong password',
    ru: 'Неверный пароль',
  },
  AUTH_TOKEN_FAILED_ERROR: {
    en: 'Failed to authenticate token',
    ru: 'Ошибка аутентификации токена',
  },
  USER_ALREADY_EXIST_ERROR: {
    en: 'User already exists',
    ru: 'Пользователь с таким email уже существует',
  },
  NO_API_KEY_ERROR: {
    en: 'No API key provided',
    ru: 'Ошибка API ключа',
  },
  USER_NOT_FOUND_ERROR: {
    en: 'No user found',
    ru: 'Пользователь не найден',
  },
  PASSWORD_ALREADY_EXIST_ERROR: {
    en: 'You already have a password',
    ru: 'У вас уже есть пароль',
  },
  PASSWORD_NOT_FOUND_ERROR: {
    en: 'You haven\'t set password yet. We sent you an email to set it.',
    ru: 'Пароль не установлен. Мы отправили вам email для создания пароля.',
  },
  OWNER_NOT_FOUND_ERROR: {
    en: 'No owner found',
    ru: 'Владелец не найден',
  },
  MANAGER_NOT_FOUND_ERROR: {
    en: 'No manager found',
    ru: 'Менеджер не найден',
  },
  CLIENT_OBJECT_NOT_CREATED_ERROR: {
    en: 'No client objects created',
    ru: 'Не получилось создать объект клиента',
  },
  ADD_SELF_AS_MANAGER_ERROR: {
    en: 'You cannot add yourself as a manager',
    ru: 'Вы не можете добавить себя в список менеджеров',
  },
  ADD_SELF_AS_CLIENT_ERROR: {
    en: 'You cannot add yourself as a client',
    ru: 'Вы не можете добавить себя в список клиентов',
  },
  USER_ALREADY_MANAGER_ERROR: {
    en: 'This user is already a manager',
    ru: 'Этот пользователь уже добавлен в список менеджеров',
  },
  PROJECT_NOT_FOUND_ERROR: {
    en: 'No project found',
    ru: 'Проект не найден',
  },
  POST_NOT_FOUND_ERROR: {
    en: 'No post found',
    ru: 'Пост не найден',
  },
  INVITE_NOT_FOUND_ERROR: {
    en: 'No invite found',
    ru: 'Приглашение не найдено',
  },
  INITIAL_STATUS_ERROR: {
    en: 'Initial status should be less than 250 symbols',
    ru: 'Статус не может превышать 250 символов',
  },
  NOT_AUTHORIZED_ERROR: {
    en: 'Not authorized',
    ru: 'Ошибка авторизации',
  },
  MAGIC_LINK_ALREADY_USED_ERROR: {
    en: 'Magic link can be used only once',
    ru: 'Магическая ссылка может быть использована только один раз',
  },
  DEMO_ERROR: {
    en: 'You cannot do this as a demo account',
    ru: 'Демо аккаунт так не умеет',
  },
  ADD_DEMO_AS_OWNER_ERROR: {
    en: 'You cannot create project using a demo account',
    ru: 'Вы не можете создавать проекты, используя демо аккаунт',
  },
  ADD_DEMO_AS_CLIENT_ERROR: {
    en: 'You cannot add demo account as a client',
    ru: 'Вы не можете добавить демо аккаунт в список клентов',
  },
  ADD_DEMO_AS_MANAGER_ERROR: {
    en: 'You cannot add demo account as a manager',
    ru: 'Вы не можете добавить демо аккаунт в список менеджеров',
  },
  REMOVE_YOURSELF_AS_MANAGER_ERROR: {
    en: 'You cannot remove yourself as a manager',
    ru: 'Вы не можете удалить себя из списка менеджеров',
  },
  NOT_YOUR_MANAGER_ERROR: {
    en: 'This user is not your manager',
    ru: 'Этот пользователь не является вашим менеджером',
  },
  FIELD_NOT_FOUND_ERROR: {
    en: 'Required field not found',
    ru: 'Нужно заполнить все необходимые поля',
  },
  LEAVE_AS_OWNER_ERROR: {
    en: 'You cannot leave the project as an owner',
    ru: 'Владелец не может покинуть проект',
  },
  LEAVE_AS_DEMO_ERROR: {
    en: 'You cannot leave the project as a demo account',
    ru: 'Вы не можете покидать проекты, используя демо аккаунт',
  },
  MANAGER_LIMIT_ERROR: {
    en: 'This project has reached it\'s manager limits',
    ru: 'Лимит менеджеров достигнут',
  },
  USER_LIMIT_ERROR: {
    en: 'This project has reached it\'s users limits',
    ru: 'Лимит клиентов достигнут',
  },
  FINISHED_ERROR: {
    en: 'This project was finished.',
    ru: 'Этот проект был завершен',
  },
  AUTH_PASS_RESET_TOKEN_FAILED: {
    en: 'Failed to authenticate password reset token',
    ru: 'Ошибка аутентификации токена сброса пароля',
  },
  NOT_ENOUGH_PROJECTS_ERROR: {
    en: 'Please upgrade your plan in settings',
    ru: 'Пожалуйста, увеличьте ваш план в настройках',
  },
  TOKEN_EXPIRED_ERROR: {
    en: 'Token expired',
    ru: 'Токен просрочился',
  },
  VALIDATION_ERROR: {
    en: 'Validation error',
    ru: 'Ошибка валидации',
  },
  DB_ERROR: {
    en: 'Database error',
    ru: 'Ошибка базы данных',
  },
  UNDECLARED_ERROR: {
    en: 'Undeclared error',
    ru: 'Неизвестная ошибка',
  },
};

/** Exports */
module.exports = {
  notFound,
  noAccess,
  authEmailNotRegistered,
  validManagerEmail,
  authWrongPassword,
  authTokenFailed,
  authUserAlreadyExists,
  noApiKey,
  noUserFound,
  passwordAlreadyExist,
  passwordNotExist,
  noOwnerFound,
  noManagerFound,
  noClientObjectsCreated,
  addSelfAsManager,
  addSelfAsClient,
  alreadyManager,
  noProjectFound,
  noPostFound,
  noInviteFound,
  notAuthorized,
  errorInitialStatus,
  magicLinkOnlyOnce,
  demoError,
  addDemoAsOwner,
  addDemoAsClient,
  addDemoAsManager,
  removeYourselfAsManager,
  userNotManager,
  leaveAsOwner,
  leaveAsDemo,
  managersOverLimit,
  usersOverLimit,
  notEnoughProjectsOnPlan,
  fieldNotFound,
  projectIsFinished,
  wrongResetToken,
  standardize,
  localizedList,
};
