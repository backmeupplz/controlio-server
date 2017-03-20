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
  userId: string 
   ```

---
### Доступные методы
* [Login / SignUp](#login--signup)
  * [POST /users/login](#post-userslogin)
  * [POST /users/signUp](#post-userssignup)
  * [POST /users/requestMagicLink](#post-usersrequestmagiclink)
  * [POST /users/loginMagicLink](#post-loginmagiclink)
  * [POST /users/logout](#post-userslogout)
* [Users](#users)
  * [GET /users/profile](#get-usersprofile)
  * [POST /users/profile](#post-usersprofile)
* [Projects](#projects)

---
### Login / SignUp
---
#### POST /users/login `Public`

[User](./models/user.js) login.

#####=> email, password, (iosPushToken), (androidPushToken), (webPushToken)
#####<= [User](./models/user.js)
---
#### POST /users/signUp `Public`

[User](./models/user.js) signup.

#####=> email, password, (iosPushToken), (androidPushToken), (webPushToken)
#####<= [User](./models/user.js)
---
#### POST /users/recoverPassword `Public`

Нужно просто сделать запрос – дальше юзеру придет email на почту и в веб форме он меняет пароль. Все уже сделано, от клиента нужно только сделать запрос в нужное время, все остальное делается на сервере, в том числе и формы ресета пароля.

#####=> email
#####<= OK
---
#### POST /users/requestMagicLink `Public`

Можно посмотреть, как работают Magic Links, например, в приложении Slack. Вызов этого метода присылает юзеру на имеил линк формата `example.com/magic?userid=12345&token=6789`. Благодаря существованию `Universal links` в iOS, ссылка сразу ведет в приложение Controlio, передает ему `userId` и `token`, нужные для следующего метода.

#####=> email
#####<= OK
---
#### POST /users/loginMagicLink `Public`

[User](./models/user.js) login with magic link. Вызывается уже внутри приложения, после открытия с `userid` и `token` из магической ссылки.

#####=> userid, token, (iosPushToken), (androidPushToken), (webPushToken)
#####<= [User](./models/user.js)
---
#### POST /users/logout

Используется для стирания пуш токенов. Вызывать, конечно, не обязательно при логауте, но желательно. Главное, незаметно для пользователя.

#####=> (iosPushToken), (androidPushToken), (webPushToken)
#####<= OK
---
### Users
---
#### GET /users/profile

Returns json data about a single [User](./models/user.js). Нужен, чтобы получить профиль любого юзера (или себя, если id не указан).

#####=> (id)
#####<= [User](./models/user.js)
---
#### POST /users/profile

Простое редактирование профиля пользователя. Нужно отсылать все три поля, даже те, что не отредактированы (можно отсылать пустые значения)

#####=> name, phone, photo
#####<= [User](./models/user.js)
---
### Projects
---
#### POST /projects

Create a [Project](./models/project.js). Создание проекта. Либо его создает клиент — тогда указывает один managerEmail, либо менеджер — тогда он указывает массив имейлов клиентов.
#####=> title, type [`manager`, `client`], (image), (status), (description), (managerEmail), (clientEmails)
#####<= [Project](./models/project.js)
---
#### GET /projects

Возвращает все [Project](./models/project.js) юзера.

#####=> (skip), (limit)
#####<= [[Project](./models/project.js)]
---
#### GET /invites

Получение списка [Invite](./models/invite.js) юзера.

#####<= [[Invite](./models/invite.js)]
---
#### GET /projects/project

Returns json data about a single [Project](./models/project.js).

#####=> projectid
#####<= [Project](./models/project.js)
---
#### POST /projects/clients

Добавление новых клиентов по email.

#####=> projectid, clients
#####<= [Project](./models/project.js)
---
#### DELETE /projects/client

Удаление клиента из проекта.

#####=> projectid, clientid
#####<= [Project](./models/project.js)
---
#### POST /projects/managers

Добавление новых менеджеров по email.

#####=> projectid, managers
#####<= [Project](./models/project.js)
---
#### DELETE /projects/manager `Private`

Удаление менеджера из проекта

#####=> projectid, managerid
#####<= [Project](./models/project.js)
---
#### PUT /projects

Редактирование [Project](./models/project.js).

#####=> projectid, title, (description), (image)
#####<= [Project](./models/project.js)
---
#### POST /projects/archive

Archive [Project](./models/project.js).

#####=> projectid
#####<= [Project](./models/project.js)
---
#### POST /projects/unarchive

Unarchive [Project](./models/project.js).

#####=> projectid
#####<= [Project](./models/project.js)
---
#### POST /projects/leave

Leave [Project](./models/project.js).
#####=> projectid
#####<= OK
---
#### DELETE /projects

Delete [Project](./models/project.js).

#####=> projectid
#####<= OK
---
#### POST /projects/invite

Accept or reject an [Invite](./models/invite.js).

#####=> inviteid, accept
#####<= OK
---
#### DELETE /projects/invite

Delete [Invite](./models/invite.js).

#####=> inviteid
#####<= OK
---
### Posts
---
#### POST /posts

Create a [Post](./models/post.js). Добавление поста в проект либо смена статуса проекта. Attachments – массив объектов класса String, ключи для Amazon S3.

#####=> projectid, (text), (attachments), type [`post`, `status`]
#####<= [Post](./models/post.js)
---
#### GET /posts

Получение списка [Post](./models/post.js) проекта.

#####=> projectid
#####<= [[Post](./models/post.js)]
---
#### PUT /posts

Edit [Post](./models/post.js).

#####=> projectid, postid, (text), (attachments)
#####<= [Post](./models/post.js)
---
#### Delete /posts

Удаление поста.

#####=> projectid, postid
#####<= OK
---
### Payments
---
#### GET /payments/customer

Returns json data about a [Stipe Customer](https://stripe.com/docs/api#customers).

#####=> customerid
#####<= [Stipe Customer](https://stripe.com/docs/api#customers)
---
#### POST /payments/customer/sources 

Adds a `StripeSource`. Stripe API: [Stipe API](https://stripe.com/docs/api)

#####=> customerid, source
#####<= StripeSource
---
#### POST /payments/customer/default_source

Метод для установки дефолтного платежного метода юзера Stripe

#####=> customerid, source
#####<= [Stipe Customer](https://stripe.com/docs/api#customers)
---
#### POST /payments/customer/subscription

Подписка юзера на определенный план. 

#####=> userid, planid ['0', '1', '2', '3']
#####<= OK
---
#### POST /payments/customer/coupon

Применение к юзеру купона.

#####=> userid, coupon
#####<= OK
---
#### Delete /customer/card

Удаление карточки оплаты у пользователя

#####=> customerid, cardid
#####<= OK