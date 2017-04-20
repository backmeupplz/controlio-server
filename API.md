# Controlio server API

### Важная информация:

* Все запросы идут на базовый URL: <https://api.controlio.co> — либо на ваш локальный сервер, например: <http://localhost:3000>.
* Коллекция в `Postman` с примерами всех запросов: <https://www.getpostman.com/collections/a1022f5ec37de87107f6>.
* Со всеми моделями данных на сервере можно ознакомиться в папке [models в репозитории сервера](./models).
* Оплата проходит через `Stripe`, большинство методов на сервере — просто прокси на сервера Stripe.
* Если метод не требует параметров, значит ему достаточно информации из хедеров. Если ответ метода описан, как **OK**, значит он может вернуть либо `{ success: true }`, либо ошибку.
* В некоторых методах есть пагинация типа `skip & limit`:
    * `Skip` – сколько объектов надо пропустить перед началом списка
    * `Limit` – максимальное количество объектов в выдаче.
* Все картинки хранятся в виде ключей (`keys`) для `Amazon S3`, не URL. Там с этим сервисом черт ногу сломит, для ознакомления могу посоветовать файлик `S3.swift` в iOS проекте.
* Headers Parameters
   * Required for All requests:
   ```
  apiKey: string
   ```
   * Required for Private requests:
   ```
  token: string 
   ```
   
---
### Доступные методы
* [Login / SignUp](#login--signup)
  * [POST /users/login](#post-userslogin-public)
  * [POST /users/signUp](#post-userssignup-public)
  * [POST /users/recoverPassword](#post-recoverpassword-public)
  * [POST /users/resetPassword](#post-resetpassword-public)
  * [POST /users/requestMagicLink](#post-usersrequestmagiclink-public)
  * [POST /users/loginMagicLink](#post-loginmagiclink-public)
  * [POST /users/logout](#post-userslogout)
* [Users](#users)
  * [GET /users/profile](#get-usersprofile)
  * [POST /users/profile](#post-usersprofile)
* [Projects](#projects)
  * [POST /projects](#post-projects)
  * [GET /projects](#get-projects)
  * [GET /invites](#get-invites)
  * [GET /projects/project](#get-projectsproject)
  * [POST /projects/clients](#post-projectsclients)
  * [DELETE /projects/client](#delete-projectsclient)
  * [POST /projects/managers](#post-projectsmanagers)
  * [DELETE /projects/manager](#delete-projectsmanager)
  * [PUT /projects/](#put-projects)
  * [POST /projects/finish](#post-projectsfinish)
  * [POST /projects/revive](#post-projectsrevive)
  * [POST /projects/leave](#post-projectsleave)
  * [DELETE /projects/](#delete-projects)
  * [POST /projects/invite](#post-projectsinvite)
  * [DELETE /projects/invite](#delete-projectsinvite)
* [Posts](#posts)
  * [POST /posts](#post-posts)
  * [GET /posts](#get-posts)
  * [PUT /posts](#put-posts)
  * [DELETE /posts](#delete-posts)
* [Payments](#payments)
  * [GET /payments/customer](#get-paymentscustomer)
  * [POST /payments/customer/sources](#post-paymentscustomersources)
  * [POST /payments/customer/default_source](#post-paymentscustomerdefault_source)
  * [POST /payments/customer/subscription](#post-paymentscustomersubscription)
  * [POST /payments/customer/coupon](#post-paymentscustomercoupon)
  * [DELETE /payments/customer/card](#delete-paymentscustomercard)
* [Error types](#errortypes)
  * [NOT_FOUND_ERROR](#notfounderror)
  * [NO_ACCESS_ERROR](#noaccesserror)
  * [EMAIL_NOT_REGISTERED_ERROR](#emailnotregisterederror)
  * [INVALID_MANAGER_EMAIL_ERROR](#invalidmanageremailerror)
  * [WRONG_PASSWORD_ERROR](#wrongpassworderror)
  * [AUTH_TOKEN_FAILED_ERROR](#authtokenfailederror)
  * [USER_ALREADY_EXIST_ERROR](#useralreadyexisterror)
  * [NO_API_KEY_ERROR](#noapikeyerror)
  * [USER_NOT_FOUND_ERROR](#usernotfounderror)
  * [PASSWORD_ALREADY_EXIST_ERROR](#passwordalreadyexisterror)
  * [PASSWORD_NOT_FOUND](#passwordnotfound)
  * [OWNER_NOT_FOUND_ERROR](#ownernotfounderror)
  * [MANAGER_NOT_FOUND_ERROR](#managernotfounderror)
  * [CLIENT_OBJECT_NOT_CREATED_ERROR](#clientobjectnotcreatederror)
  * [ADD_SELF_AS_MANAGER_ERROR](#addselfasmanagererror)
  * [ADD_SELF_AS_CLIENT_ERROR](#addselfasclienterror)
  * [USER_ALREADY_MANAGER_ERROR](#useralreadymanagererror)
  * [PROJECT_NOT_FOUND_ERROR](#projectnotfounderror)
  * [POST_NOT_FOUND_ERROR](#postnotfounderror)
  * [INVITE_NOT_FOUND_ERROR](#invitenotfounderror)
  * [INITIAL_STATUS_ERROR](#initialstatuserror)
  * [NOT_AUTHORIZED_ERROR](#notauthorizederror)
  * [MAGIC_LINK_ALREADY_USED_ERROR](#magiclinkalreadyuserderror)
  * [DEMO_ERROR](#demoerror)
  * [ADD_DEMO_AS_CLIENT_ERROR](#adddemoasclienterror)
  * [ADD_DEMO_AS_MANAGER_ERROR](#adddemoasmanagererror)
  * [REMOVE_YOURSELF_AS_MANAGER_ERROR](#removeyourselfasmanagererror)
  * [NOT_YOUR_MANAGER_ERROR](#notyourmanagererror)
  * [FIELD_NOT_FOUND_ERROR](#fieldnotfounderror)
  * [LEAVE_AS_OWNER_ERROR](#leaveasownererror)
  * [MANAGER_LIMIT_ERROR](#managerlimiterror)
  * [USER_LIMIT_ERROR](#userlimiterr)
  * [FINISHED_ERROR](#finishederror)
  * [NOT_ENOUGH_PROJECTS_ERROR](#notenoughprojectserror)
  * [AUTH_PASS_RESET_TOKEN_FAILED](#authpassresettokenfailed)
  * [TOKEN_EXPIRED_ERROR](#tokenexpirederror)

---
### Login / SignUp
---
### POST /users/login `Public`

[User](./models/user.js) login.

* => email, password, (iosPushToken), (androidPushToken), (webPushToken)
* <= [User](./models/user.js)

---
### POST /users/signUp `Public`

[User](./models/user.js) signup.

* => email, password, (iosPushToken), (androidPushToken), (webPushToken)
* <= [User](./models/user.js)

---
### POST /users/recoverPassword `Public`

Нужно просто сделать запрос – дальше юзеру придет email на почту и в веб форме он меняет пароль. Все уже сделано, от клиента нужно только сделать запрос в нужное время, все остальное делается на сервере, в том числе и формы ресета пароля.

* => email
* <= OK

---
### POST /users/resetPassword `Public`

Функция для измненения пароля при помощи reset password token и user id

* => token, password
* <= OK

---
### POST /users/requestMagicLink `Public`

Можно посмотреть, как работают Magic Links, например, в приложении Slack. Вызов этого метода присылает юзеру на имеил линк формата `example.com/magic?userid=12345&token=6789`. Благодаря существованию `Universal links` в iOS, ссылка сразу ведет в приложение Controlio, передает ему `userId` и `token`, нужные для следующего метода.

* => email
* <= OK

---
### POST /users/loginMagicLink `Public`

[User](./models/user.js) login with magic link. Вызывается уже внутри приложения, после открытия с `userid` и `token` из магической ссылки.

* => token, (iosPushToken), (androidPushToken), (webPushToken)
* <= [User](./models/user.js)

---
### POST /users/logout

Используется для стирания пуш токенов. Вызывать, конечно, не обязательно при логауте, но желательно. Главное, незаметно для пользователя.

* => (iosPushToken), (androidPushToken), (webPushToken)
* <= OK

---
### Users
---
### GET /users/profile

Returns json data about a single [User](./models/user.js). Нужен, чтобы получить профиль любого юзера (или себя, если id не указан).

* => (id)
* <= [User](./models/user.js)

---
### POST /users/profile

Простое редактирование профиля пользователя. Нужно отсылать все три поля, даже те, что не отредактированы (можно отсылать пустые значения)

* => name, phone, photo
* <= [User](./models/user.js)

---
### Projects
---
### POST /projects

Create a [Project](./models/project.js). Создание проекта. Либо его создает клиент — тогда указывает один managerEmail, либо менеджер — тогда он указывает массив имейлов клиентов.

* => title, type [`manager`, `client`], (image), (status), (description), (managerEmail), (clientEmails)
* <= [Project](./models/project.js)

---
### GET /projects

Возвращает все [Project](./models/project.js) юзера.

* => (skip), (limit), (type ['all', 'live', 'finished']), (query)
* <= [[Project](./models/project.js)]

---
### GET /invites

Получение списка [Invite](./models/invite.js) юзера.

* <= [[Invite](./models/invite.js)]

---
### GET /projects/project

Returns json data about a single [Project](./models/project.js).

* => projectid
* <= [Project](./models/project.js)

---
### POST /projects/clients

Добавление новых клиентов по email.

* => projectid, clients
* <= [Project](./models/project.js)

---
### DELETE /projects/client

Удаление клиента из проекта.

* => projectid, clientid
* <= [Project](./models/project.js)

---
### POST /projects/managers

Добавление новых менеджеров по email.

* => projectid, managers
* <= [Project](./models/project.js)

---
### DELETE /projects/manager

Удаление менеджера из проекта

* => projectid, managerid
* <= [Project](./models/project.js)

---
### PUT /projects

Редактирование [Project](./models/project.js).

* projectid, title, (description), (image)
* <= [Project](./models/project.js)

---
### POST /projects/finish

Finish [Project](./models/project.js).

* => projectid
* <= [Project](./models/project.js)

---
### POST /projects/revive

Revive [Project](./models/project.js).

* => projectid
* <= [Project](./models/project.js)

---
### POST /projects/leave

Leave [Project](./models/project.js).

* => projectid
* <= OK

---
### DELETE /projects

Delete [Project](./models/project.js).

* => projectid
* <= OK
---
### POST /projects/invite

Accept or reject an [Invite](./models/invite.js).

* => inviteid, accept
* <= OK

---
### DELETE /projects/invite

Delete [Invite](./models/invite.js).

* => inviteid
* <= OK

---
### Posts
---
### POST /posts

Create a [Post](./models/post.js). Добавление поста в проект либо смена статуса проекта. Attachments – массив объектов класса String, ключи для Amazon S3.

* => projectid, (text), (attachments), type [`post`, `status`]
* <= [Post](./models/post.js)

---
### GET /posts

Получение списка [Post](./models/post.js) проекта.

* => projectid
* <= [[Post](./models/post.js)]

---
### PUT /posts

Edit [Post](./models/post.js).

* => projectid, postid, (text), (attachments), (type [`post`, `status`])
* <= [Post](./models/post.js)

---
### DELETE /posts

Удаление поста.

* => projectid, postid
* <= OK

---
### Payments
---
### GET /payments/customer

Returns json data about a [Stipe Customer](https://stripe.com/docs/api#customers).

* => customerid
* <= [Stipe Customer](https://stripe.com/docs/api#customers)

---
### POST /payments/customer/sources 

Adds a `StripeSource`. Stripe API: [Stipe API](https://stripe.com/docs/api)

* => customerid, source
* <= StripeSource

---
### POST /payments/customer/default_source

Метод для установки дефолтного платежного метода юзера Stripe

* => customerid, source
* <= [Stipe Customer](https://stripe.com/docs/api#customers)

---
### POST /payments/customer/subscription

Подписка юзера на определенный план. 

* => userid, planid ['0', '1', '2', '3']
* <= OK

---
### POST /payments/customer/coupon

Применение к юзеру купона.

* => userid, coupon
* <= OK

---
### DELETE /payments/customer/card

Удаление карточки оплаты у пользователя

* => customerid, cardid
* <= OK

---
### Error types
---
### NOT_FOUND_ERROR

* status => 404
* message => Not found
* type => NOT_FOUND_ERROR

---
### NO_ACCESS_ERROR

* status => 403
* message => No access
* type => NO_ACCESS_ERROR

---
### EMAIL_NOT_REGISTERED_ERROR

* status => 403
* message => Email not registered
* type => EMAIL_NOT_REGISTERED_ERROR

---
### INVALID_MANAGER_EMAIL_ERROR

* status => 403
* message => Please provide a valid manager email
* type => INVALID_MANAGER_EMAIL_ERROR

---
### WRONG_PASSWORD_ERROR

* status => 403
* message => Wrong password
* type => WRONG_PASSWORD_ERROR

---
### AUTH_TOKEN_FAILED_ERROR

* status => 403
* message => Failed to authenticate token
* type => AUTH_TOKEN_FAILED_ERROR

---
### USER_ALREADY_EXIST_ERROR

* status => 403
* message => User already exists
* type => USER_ALREADY_EXIST_ERROR

---
### NO_API_KEY_ERROR

* status => 403
* message => No API key provided
* type => NO_API_KEY_ERROR

---
### USER_NOT_FOUND_ERROR

* status => 500
* message => No user found
* type => USER_NOT_FOUND_ERROR

---
### PASSWORD_ALREADY_EXIST_ERROR

* status => 500
* message => You already have a password
* type => PASSWORD_ALREADY_EXIST_ERROR

---
### PASSWORD_NOT_FOUND

* status => 500
* message => You haven't set password yet. We sent you an email to set it.
* type => PASSWORD_NOT_FOUND

---
### OWNER_NOT_FOUND_ERROR

* status => 500
* message => No owner found
* type => OWNER_NOT_FOUND_ERROR

---
### MANAGER_NOT_FOUND_ERROR

* status => 500
* message => No manager found
* type => MANAGER_NOT_FOUND_ERROR

---
### CLIENT_OBJECT_NOT_CREATED_ERROR

* status => 500
* message => No client objects created
* type => CLIENT_OBJECT_NOT_CREATED_ERROR

---
### ADD_SELF_AS_MANAGER_ERROR

* status => 400
* message => You cannot add yourself as a manager
* type => ADD_SELF_AS_MANAGER_ERROR

---
### ADD_SELF_AS_CLIENT_ERROR

* status => 400
* message => You cannot add yourself as a client
* type => ADD_SELF_AS_CLIENT_ERROR

---
### USER_ALREADY_MANAGER_ERROR

* status => 400
* message => This user is already a manager
* type => USER_ALREADY_MANAGER_ERROR

---
### PROJECT_NOT_FOUND_ERROR

* status => 400
* message => No project found
* type => PROJECT_NOT_FOUND_ERROR

---
### POST_NOT_FOUND_ERROR

* status => 400
* message => No post found
* type => POST_NOT_FOUND_ERROR

---
### INVITE_NOT_FOUND_ERROR

* status => 400
* message => No invite found
* type => INVITE_NOT_FOUND_ERROR

---
### INITIAL_STATUS_ERROR

* status => 400
* message => Initial status should be less than 250 symbols
* type => INITIAL_STATUS_ERROR

---
### NOT_AUTHORIZED_ERROR

* status => 403
* message => Not authorized
* type => NOT_AUTHORIZED_ERROR

---
### MAGIC_LINK_ALREADY_USED_ERROR

* status => 403
* message => Magic link can be used only once
* type => MAGIC_LINK_ALREADY_USED_ERROR

---
### DEMO_ERROR

* status => 403
* message => You cannot do this as a demo account
* type => DEMO_ERROR

---
### ADD_DEMO_AS_CLIENT_ERROR

* status => 403
* message => You cannot add demo account as a client
* type => ADD_DEMO_AS_CLIENT_ERROR

---
### ADD_DEMO_AS_MANAGER_ERROR

* status => 403
* message => You cannot add demo account as a manager
* type => ADD_DEMO_AS_MANAGER_ERROR

---
### REMOVE_YOURSELF_AS_MANAGER_ERROR

* status => 403
* message => You cannot remove yourself as a manager
* type => REMOVE_YOURSELF_AS_MANAGER_ERROR

---
### NOT_YOUR_MANAGER_ERROR

* status => 403
* message => This user is not your manager
* type => NOT_YOUR_MANAGER_ERROR

---
### FIELD_NOT_FOUND_ERROR

* status => 403
* message => Field <field> not found
* type => FIELD_NOT_FOUND_ERROR

---
### LEAVE_AS_OWNER_ERROR

* status => 403
* message => You cannot leave the project as an owner
* type => LEAVE_AS_OWNER_ERROR

---
### MANAGER_LIMIT_ERROR

* status => 403
* message => This project has reached it's manager limits
* type => MANAGER_LIMIT_ERROR

---
### USER_LIMIT_ERROR

* status => 403
* message => This project has reached it's users limits
* type => USER_LIMIT_ERROR

---
### FINISHED_ERROR

* status => 403
* message => This project was finished
* type => FINISHED_ERROR

---
### NOT_ENOUGH_PROJECTS_ERROR

* status => 403
* message => Your plan only includes <maxNumberOfProjects> <projectWord>. Please upgrade your plan in settings or finish or delete older projects.
* type => NOT_ENOUGH_PROJECTS_ERROR

---
### AUTH_PASS_RESET_TOKEN_FAILED

* status => 403
* message => Failed to authenticate password reset token.
* type => AUTH_PASS_RESET_TOKEN_FAILED

---
### TOKEN_EXPIRED_ERROR

* status => 403
* message => Token expired "${originalError.expiredAt}".
* type => TOKEN_EXPIRED_ERROR