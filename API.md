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
  apiKey: String
   ```
   * Required for Private requests:
   ```
  token: String
  userId: String 
   ```

### Доступные методы
* [Login / SignUp](#login_/_signup)

### Login / SignUp

#### POST /users/login

Returns json data about a single user. [Model User](./models/user.js)

* **Method:**

  `POST /users/login`

* **Headers Params**

   *Required*:

   ```
  apiKey: string      
   ```

* **Body Params**

   *Required*:

   ```
  email: string      
  password: string (length > 6)
   ```

   *Optional*:

   ```
  iosPushToken: string
  androidPushToken: string
  webPushToken: string
   ```

* **Success Response:**

  *Code*: **200**
  Content: 
  ```json
  { "message": "Add sample content" }
  ```

* **Error Response:** (**Sample**)

  *Code*: **401** UNAUTHORIZED
  Content: 
  ```json
  { "error": "Log in" }
  ```
  OR

  *Code*: **422** UNPROCESSABLE ENTRY
  Content: 
  ```json
  { "error": "Email Invalid" }
  ```



### POST /users/signUp ###

Returns json data about a single user. [Model User](./models/user.js)

* **Method:**

  `POST /users/signUp`

* **Headers Params**

   *Required*:

   ```
  apiKey: string      
   ```

* **Body Params**

   *Required*:

   ```
  email: string      
  password: string (length > 6)
   ```

   *Optional*:

   ```
  iosPushToken: string
  androidPushToken: string
  webPushToken: string
   ```

* **Success Response:**

  *Code*: **200**
  Content: 
  ```json
  User Model
  ```




### POST /users/recoverPassword

Return OK. 

Нужно просто сделать запрос – дальше юзеру придет email на почту и в веб форме он меняет пароль. Все уже сделано, от клиента нужно только сделать запрос в нужное время, все остальное делается на сервере, в том числе и формы ресета пароля.

- **Method:**

  `POST /users/recoverPassword`

- **Headers Params**

   *Required*:

  ```
  apiKey: string      
  ```

- **Body Params**

   *Required*:

  ```
  email: string      
  ```

- **Success Response:**

  *Code*: **200**
  Content: 

  ```json
  OK
  ```




### POST /users/requestMagicLink

Return OK. 

Можно посмотреть, как работают Magic Links, например, в приложении Slack. Вызов этого метода присылает юзеру на имеил линк формата `example.com/magic?userid=12345&token=6789`. Благодаря существованию `Universal links` в iOS, ссылка сразу ведет в приложение Controlio, передает ему `userId` и `token`, нужные для следующего метода.

- **Method:**

  `POST /users/requestMagicLink`

- **Headers Params**

   *Required*:

  ```
  apiKey: string      
  ```

- **Body Params**

   *Required*:

  ```
  email: string      
  ```

- **Success Response:**

  *Code*: **200**
  Content: 

  ```json
  OK
  ```




### POST /users/loginMagicLink

Returns json data about a single user. [Model User](./models/user.js)

Вызывается уже внутри приложения, после открытия при помощи magic link.

- **Method:**

  `POST /users/loginMagicLink`

- **Headers Params**

   *Required*:

  ```
  apiKey: string      
  ```

- **Body Params**

   *Required*:

  ```
  token: string   
  userId: string 
  ```

   *Optional*:

   ```
  iosPushToken: string
  androidPushToken: string
  webPushToken: string
   ```

- **Success Response:**

  *Code*: **200**
  Content: 

  ```json
  User Model
  ```

  ​



### POST /users/logout `Private`

Returns json data about a single user. [Model User](./models/user.js)

Используется для стирания пуш токенов. Вызывать, конечно, не обязательно при логауте, но желательно. Главное, незаметно для пользователя.

- **Method:**

  `POST /users/loginMagicLink`

- **Headers Params**

   *Required*:

  ```
  apiKey: string  
  token: string   
  userId: string 
  ```

- **Body Params**

   *Optional*:

   ```
  iosPushToken: string
  androidPushToken: string
  webPushToken: string
   ```

- **Success Response:**

  *Code*: **200**
  Content: 

  ```json
  User Model
  ```



## User
### GET /users/profile `Private`

Returns json data about a single user. [Model User](./models/user.js)

Нужен, чтобы получить профиль любого юзера (или себя, если id не указан)

- **Method:**

  `GET /users/profile`

- **Headers Params**

   *Required*:

  ```
  apiKey: string  
  token: string   
  userId: string 
  ```

- **Body Params**

   *Optional*:

   ```
  id: string
   ```

- **Success Response:**

  *Code*: **200**
  Content: 

  ```json
  User Model
  ```


### POST /users/profile `Private`

Returns json data about a single user. [Model User](./models/user.js)

Простое редактирование профиля пользователя. Нужно отсылать все три поля, даже те, что не отредактированы (можно отсылать пустые значения)

- **Method:**

  `POST /users/profile`

- **Headers Params**

   *Required*:

  ```
  apiKey: string  
  token: string   
  userId: string 
  ```

- **Body Params**

   Required:

  ```
  name: string  
  phone: string   
  photo: string (Key Amazon S3)
  ```
   *Optional*:

   ```
  id: string
   ```

- **Success Response:**

  *Code*: **200**
  Content: 

  ```json
  User Model
  ```




## Projects

### POST /projects `Private`

Create project. [Model Project](./models/project.js)

Создание проекта. Либо его создает клиент — тогда указывает один managerEmail, либо менеджер — тогда он указывает массив имейлов клиентов.

- **Method:**

  `POST /projects`

- **Headers Params**

   *Required*:

  ```
  apiKey: string  
  token: string   
  userId: string 
  ```

- **Body Params**
   *Required*:

  ```
  title: string  
  type: string (value: "manager" OR "client")
  ```
   *Optional*:

   ```
  image: string (Key Amazon S3)
  status: string
  description: string
  managerEmail: string 
   ```

- **Success Response:**

  *Code*: **200**
  Content: 

  ```json
  Project
  ```




### GET /projects `Private`

Returns json data about projects. [Model Project](./models/project.js)

Простое редактирование профиля пользователя. Нужно отсылать все три поля, даже те, что не отредактированы (можно отсылать пустые значения)

- **Method:**

  `GET /projects`

- **Headers Params**

   *Required*:

  ```
  apiKey: string  
  token: string   
  userId: string 
  ```

- **Body Params**

   *Optional*:

   ```
  skip: number
  limit: number
   ```

- **Success Response:**

  *Code*: **200**
  Content: 

  ```json
  [Project]
  ```




### GET /invites `Private`

Returns json data about invites. [Model Invite](./models/invite.js)

Получение списка инвайтов.

- **Method:**

  `GET /invites`

- **Headers Params**

   *Required*:

  ```
  apiKey: string  
  token: string   
  userId: string 
  ```

- **Success Response:**

  *Code*: **200**
  Content: 

  ```json
  [Invite]
  ```



### GET /projects/project `Private`

Returns json data about a single project. [Model Project](./models/project.js)

Получение проекта по id.

- **Method:**

  `GET /projects/project`

- **Headers Params**

   *Required*:

  ```
  apiKey: string  
  token: string   
  userId: string 
  ```

- **Body Params**

   *Required*:

   ```
  projectid: string
   ```

- **Success Response:**

  *Code*: **200**
  Content: 

  ```json
  [Project]
  ```




### POST /projects/clients `Private`

Returns json data about a single project. [Model Project](./models/project.js)

Добавление новых клиентов.

- **Method:**

  `POST /projects/clients`

- **Headers Params**

   *Required*:

  ```
  apiKey: string  
  token: string   
  userId: string 
  ```

- **Body Params**

   *Required*:

   ```
  projectid: string
  clients: [string] (array email)
   ```

- **Success Response:**

  *Code*: **200**
  Content: 

  ```json
  [Project]
  ```

### DELETE /projects/client `Private`

Return OK.

Удаление клиента из проекта

- **Method:**

  `DELETE /projects/client`

- **Headers Params**

   *Required*:

  ```
  apiKey: string  
  token: string   
  userId: string 
  ```

- **Body Params**

   *Required*:

   ```
  projectid: string
  clientid: string
   ```

- **Success Response:**

  *Code*: **200**
  Content: 

  ```json
  OK
  ```




### POST /projects/managers `Private`

Returns json data about a single project. [Model Project](./models/project.js)

Добавление новых менеджеров.

- **Method:**

  `POST /projects/managers`

- **Headers Params**

   *Required*:

  ```
  apiKey: string  
  token: string   
  userId: string 
  ```

- **Body Params**

   *Required*:

   ```
  projectid: string
  managers: [string] (array email)
   ```

- **Success Response:**

  *Code*: **200**
  Content: 

  ```json
  [Project]
  ```

### DELETE /projects/manager `Private`

Returns json data about a single project. [Model Project](./models/project.js)

Удаление клиента из проекта

- **Method:**

  `DELETE /projects/manager`

- **Headers Params**

   *Required*:

  ```
  apiKey: string  
  token: string   
  userId: string 
  ```

- **Body Params**

   *Required*:

   ```
  projectid: string
  managerid: string
   ```

- **Success Response:**

  *Code*: **200**
  Content: 

  ```json
  OK
  ```


### PUT /projects `Private`

Edit project. [Model Project](./models/project.js)

Создание проекта. Либо его создает клиент — тогда указывает один managerEmail, либо менеджер — тогда он указывает массив имейлов клиентов.

- **Method:**

  `PUT /projects`

- **Headers Params**

   *Required*:

  ```
  apiKey: string  
  token: string   
  userId: string 
  ```

- **Body Params**
   *Required*:

  ```
  projectid: string
  title: string  
  type: string (value: "manager" OR "client")
  image: string (Key Amazon S3)
  description: string
  ```

- **Success Response:**

  *Code*: **200**
  Content: 

  ```json
  Project
  ```

### POST /projects/archive `Private`

Archive project. [Model Project](./models/project.js)

Архивирование проекта

- **Method:**

  `POST /projects/archive`

- **Headers Params**

   *Required*:

  ```
  apiKey: string  
  token: string   
  userId: string 
  ```

- **Body Params**
   *Required*:

  ```
  projectid: string
  ```

- **Success Response:**

  *Code*: **200**
  Content: 

  ```json
  Project
  ```

### POST /projects/unarchive `Private`

Unarchive project. [Model Project](./models/project.js)

Разархивирование проекта

- **Method:**

  `POST /projects/unarchive`

- **Headers Params**

   *Required*:

  ```
  apiKey: string  
  token: string   
  userId: string 
  ```

- **Body Params**
   *Required*:

  ```
  projectid: string
  ```

- **Success Response:**

  *Code*: **200**
  Content: 

  ```json
  Project
  ```
### POST /projects/leave `Private`

leave project. [Model Project](./models/project.js)

Выйти из проекта

- **Method:**

  `POST /projects/leave`

- **Headers Params**

   *Required*:

  ```
  apiKey: string  
  token: string   
  userId: string 
  ```

- **Body Params**
   *Required*:

  ```
  projectid: string
  ```

- **Success Response:**

  *Code*: **200**
  Content: 

  ```json
  OK
  ```

### DELETE /projects `Private`

Delete project. [Model Project](./models/project.js)

Удаление проекта

- **Method:**

  `DELETE /projects`

- **Headers Params**

   *Required*:

  ```
  apiKey: string  
  token: string   
  userId: string 
  ```

- **Body Params**
   *Required*:

  ```
  projectid: string
  ```

- **Success Response:**

  *Code*: **200**
  Content: 

  ```json
  OK
  ```

### POST /projects/invite `Private`

Accept or reject invite. [Model Invite](./models/invite.js)

Принять или отклонить инвайт

- **Method:**

  `POST /projects/invite`

- **Headers Params**

   *Required*:

  ```
  apiKey: string  
  token: string   
  userId: string 
  ```

- **Body Params**
   *Required*:

  ```
  inviteid: string 
  accept: boolean
  ```

- **Success Response:**

  *Code*: **200**
  Content: 

  ```json
  OK
  ```

### DELETE /projects/invite `Private`

Delete invite. [Model Invite](./models/invite.js)

Удаление полученного инвайта

- **Method:**

  `DELETE /projects/invite`

- **Headers Params**

   *Required*:

  ```
  apiKey: string  
  token: string   
  userId: string 
  ```

- **Body Params**
   *Required*:

  ```
  inviteid: string
  ```

- **Success Response:**

  *Code*: **200**
  Content: 

  ```json
  OK
  ```

## Post ##
### POST /posts `Private`

Create post. [Model Post](./models/post.js)

Добавление поста в проект либо смена статуса проекта. Attachments – массив объектов класса String, ключи для Amazon S3

- **Method:**

  `POST /posts`

- **Headers Params**

   *Required*:

  ```
  apiKey: string  
  token: string   
  userId: string 
  ```

- **Body Params**
   *Required*:

  ```
  projectid: string
  text: string
  attachments: [string] (Keys Amazon S3)
  type: string (value: "post" or "status")
  ```

- **Success Response:**

  *Code*: **200**
  Content: 

  ```json
  Post
  ```

### GET /posts `Private`

Returns json data about posts.  [Model Post](./models/post.js)

Получение списка постов на проект

- **Method:**

  `GET /posts`

- **Headers Params**

   *Required*:

  ```
  apiKey: string  
  token: string   
  userId: string 
  ```

- **Body Params**


  *Required*:

  ```
  projectid: string
  ```

   *Optional*:

   ```
  skip: number
  limit: number
   ```
- **Success Response:**

  *Code*: **200**
  Content: 

  ```json
  [Post]
  ```

### PUT /posts `Private`

Edit post. [Model Post](./models/post.js)

Редактирование поста

- **Method:**

  `PUT /posts`

- **Headers Params**

   *Required*:

  ```
  apiKey: string  
  token: string   
  userId: string 
  ```

- **Body Params**
   *Required*:

  ```
  projectid: string
  text: string
  attachments: [string] (Keys Amazon S3)
  type: string (value: "post" or "status")
  ```

- **Success Response:**

  *Code*: **200**
  Content: 

  ```json
  Post
  ```

### Delete /posts `Private`

Return OK.

Удаление поста

- **Method:**

  `Delete /posts`

- **Headers Params**

   *Required*:

  ```
  apiKey: string  
  token: string   
  userId: string 
  ```

- **Body Params**

   *Required*:

   ```
  projectid: string
  postid: string
   ```

- **Success Response:**

  *Code*: **200**
  Content: 

  ```json
  OK
  ```

## Payments ##
### GET /payments/customer `Private`

Returns json data about a ` StripeCustomer`.  API Stripe: [Stipe Customer](https://stripe.com/docs/api#customers)

Получение юзера stripe по customerid из strip’а

- **Method:**

  `GET /payments/customer`

- **Headers Params**

   *Required*:

  ```
  apiKey: string  
  token: string   
  userId: string 
  ```

- **Body Params**


  *Required*:

  ```
  customerid: string
  ```

- **Success Response:**

  *Code*: **200**
  Content: 

  ```json
  StripeCustomer
  ```

### POST /payments/customer/sources `Private`

Returns json data about a ` StripeSource`.  API Stripe: [Stipe API](https://stripe.com/docs/api)

Добавление способа оплаты в страйпе

- **Method:**

  `POST /payments/customer/sources`

- **Headers Params**

   *Required*:

  ```
  apiKey: string  
  token: string   
  userId: string 
  ```

- **Body Params**
   *Required*:

  ```
  customerid: string
  source: StripeSource
  ```

- **Success Response:**

  *Code*: **200**
  Content: 

  ```json
  StripeSource
  ```

### POST /payments/customer/default_source `Private`

Create post. [Model Post](./models/post.js)

Метод для установки дефолтного платежного метода юзера Stripe

- **Method:**

  `POST /payments/customer/default_source`

- **Headers Params**

   *Required*:

  ```
  apiKey: string  
  token: string   
  userId: string 
  ```

- **Body Params**
   *Required*:

  ```
  customerid: string
  source: StripeSource
  ```

- **Success Response:**

  *Code*: **200**
  Content: 

  ```json
  StripeCustomer
  ```

### POST /payments/customer/subscription `Private`

Подписка юзера на определенный план. 

* Plans: 
  * 0: free
  * 1:  $20 
  * 2:  $50
  * 3: $100



* **Method:**

  `POST /payments/customer/subscription`

* **Headers Params**

   *Required*:

  ```
  apiKey: string  
  token: string   
  userId: string 
  ```

* **Body Params**
   *Required*:

  ```
  coupon: number (value is one of [0, 1, 2, 3])
  ```

* **Success Response:**

  *Code*: **200**
  Content: 

  ```json
  User
  ```

### POST /payments/customer/coupon `Private`

Применение к юзеру купона.

- **Method:**

  `POST /payments/customer/coupon`

- **Headers Params**

   *Required*:

  ```
  apiKey: string  
  token: string   
  userId: string 
  ```

- **Body Params**
   *Required*:

  ```
  coupon: string (ID coupon)
  ```

- **Success Response:**

  *Code*: **200**
  Content: 

  ```json
  Post
  ```


### Delete /customer/card `Private`

Return OK.

Удаление карточки оплаты у пользователя

- **Method:**

  `Delete /customer/card`

- **Headers Params**

   *Required*:

  ```
  apiKey: string  
  token: string   
  userId: string 
  ```

- **Body Params**

   *Required*:

   ```
  customerid: string
  cardid: string
   ```

- **Success Response:**

  *Code*: **200**
  Content: 

  ```json
  OK
  ```
