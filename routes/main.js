/** Dependencies */
const express = require('express');

const router = express.Router();
const validate = require('express-validation');
const validation = require('../validation/main');

/** A list of errors */
router.get('/error_list', (req, res) => {
  res.send(ERROR_TYPE);
});

const ERROR_TYPE = {
  NOT_FOUND_ERROR: {
    en: 'Not found',
    ru: 'Страница не найдена',
  },
  NO_ACCESS_ERROR: {
    en: 'No acess',
    ru: 'Доступ ограничен'
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
    ru: 'Ошибка ключа API',
  },
  USER_NOT_FOUND_ERROR: {
    en: 'No user found',
    ru: 'Пользователь не найден',
  },
  PASSWORD_ALREADY_EXIST_ERROR: {
    en: 'You already have a password',
    ru: 'У Вас уже есть пароль',
  },
  PASSWORD_NOT_FOUND_ERROR: {
    en: 'You haven\'t set password yet. We sent you an email to set it.',
    ru: 'Пароль не установлен. Мы отправили Вам email для создания пароля.',
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
    ru: 'Объект клиента не был создан',
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
    ru: 'Текущее состояние не может превышать 250 символов',
  },
  NOT_AUTHORIZED_ERROR: {
    en: 'Not authorized',
    ru: 'Вход не выполнен',
  },
  MAGIC_LINK_ALREADY_USED_ERROR: {
    en: 'Magic link can be used only once',
    ru: 'Magic link может быть использован только один раз',
  },
  DEMO_ERROR: {
    en: 'You cannot do this as a demo account',
    ru: 'Вы не можете это сделать используя демо аккаунт',
  },
  ADD_DEMO_AS_OWNER_ERROR: {
    en: 'You cannot create project using a demo account',
    ru: 'Вы не можете создавать проекты используя демо аккаунт',
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
    ru: 'Этот пользователь не является Вашим менеджером',
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
    ru: 'Вы не можете покидать проекты используя демо аккаунт',
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
    ru: 'Ошибка аутентификации токена',
  },
  NOT_ENOUGH_PROJECTS_ERROR: {
    en: 'Please upgrade your plan in settings',
    ru: 'Пожалуйста, обновите Ваш план в настройках',
  },
  TOKEN_EXPIRED_ERROR: {
    en: 'Token expired',
    ru: 'Время действия этого токена истекло',
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
  }
};

/** A list of features to enable in iOS app */
router.get('/feature_list', (req, res) => {
  res.send({ 0: true, 1: true });
});

const apple = {
  applinks: {
    apps: [],
    details: [
      {
        appID: '9VUB6L23QH.BorodutchStudio.Controlio',
        paths: ['/magic', '/public/resetPassword', '/public/setPassword'],
      },
    ],
  },
};

const google = [{
  relation: ['delegate_permission/common.handle_all_urls'],
  target: {
    namespace: 'android_app',
    package_name: 'ru.adonixis.controlio',
    sha256_cert_fingerprints:
    ['07:26:B2:FD:BD:DC:5F:C2:0A:28:E4:EB:82:B9:B9:49:3B:63:27:FC:40:4F:32:E0:83:A6:F9:B1:47:90:32:36'],
  },
}];

/** Allows iOS to use magic links */
router.get('/.well-known/apple-app-site-association', (req, res) => {
  res.send(apple);
});

/** Allows iOS to use magic links */
router.get('/apple-app-site-association', (req, res) => {
  res.send(apple);
});

/** Allows Android to use magic links */
router.get('/assetlinks.json', (req, res) => {
  res.set('Content-Type', 'application/json');
  res.status(200);
  res.send(google);
});

/** Allows Android to use magic links */
router.get('/.well-known/assetlinks.json', (req, res) => {
  res.set('Content-Type', 'application/json');
  res.status(200);
  res.send(google);
});

/** Show magic link login page */
router.get('/magic', validate(validation.magic), (req, res) => {
  const token = req.query.token;
  res.render('magic', { token });
});

/** Export */
module.exports = router;
