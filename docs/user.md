# User API Spec

## Register User

Endpoint : POST /api/users

Request Body :

```json
{
  "no_pegawai": "123456, optional",
  "nik": "1234567890",
  "email": "johndoe@example.com",
  "name": "Jogn Doe",
  "password": "rahasia",
  "dinas": "TU"
}
```

Response Body (success) :

```json
{
  "code": "200",
  "status": "OK",
  "data": {
    "id": 1,
    "no_peg": "12345",
    "email": "johndoe@example.com",
    "name": "Jogn Doe",
    "dinas": "TU",
  }
}
```

Response Body (fail) :

```json
{
  "code": "400",
  "status": "BAD_REQUEST",
  "errors": {
    "id": [
      "",
      "",
    ],
    "name": [
      "",
      "",
    ],
  }
}
```

## Create User

Endpoint : POST /api/users

Headers :

- Authorization : token

Request Body :

```json
{
  "no_pegawai": "12345, optional",
  "nik": "1234567890, optional",
  "email": "johndoe@example.com",
  "name": "John Doe",
  "password": "rahasia",
  "dinas": "TU, optional",
  "roleId": 1
}
```

Response Body (success) :

```json
{
  "code": "200",
  "status": "OK",
  "data": {
    "id": 1,
    "email": "johndoe@example.com",
    "name": "Jogn Doe",
    "dinas": "TU",
    "roleId": 1,
    "no_peg": "12345",
    "token": "session_id_generated"
  }
}
```

Response Body (fail) :

```json
{
  "code": "500",
  "status": "SERVER_ERROR",
  "errors": "",
}
```

## Get User

Endpoint : GET /api/users/:userId

Headers :

- Authorization : token

Response Body (success) :

```json
{
  "code": "200",
  "status": "OK",
  "data": {
    "id": 1,
    "no_pegawai": "12345",
    "email": "johndoe@example.com",
    "name": "Jogn Doe",
    "dinas": "TU",
    "roleId": 4,
    "no_peg": "12345",
  }
}
```

Response Body (fail) :

```json
{
  "code": "401",
  "status": "UNAUTHORIZED",
  "errors": "",
}
```

## List User

Endpoint : GET /api/users/list

Headers :

- Authorization : token

Response Body (success) :

```json
{
  "code": "200",
  "status": "OK",
  "data": [
    {
      "id": 1,
      "no_pegawai": "12345",
      "email": "johndoe@example.com",
      "name": "Jogn Doe",
      "dinas": "TU",
      "role": 2,
    },
    {
      "id": 2,
      "no_pegawai": "12345",
      "email": "johndoe@example.com",
      "name": "Jogn Doe",
      "dinas": "TU",
      "role": 3,
    }
  ],
  "page": {
    "current_page": 1,
    "total_page": 10,
    "size": 100,
  }
}
```

Response Body (fail) :

```json
{
  "code": "403",
  "status": "FORBIDDEND",
  "errors": "",
}
```

## Update User

Endpoint : PATCH /api/users/:userId

Headers : 

- Authorization : token

Request Body :

```json
{
  "no_peg": "12345, optional",
  "email": "johndoe@example.com, optional",
  "name": "John Doe, optional",
  "password": "rahasia, optional",
  "dinas": "TU, optional",
  "role": "super admin, optional",
}
```

Response Body (success) :

```json
{
  "code": "200",
  "status": "OK",
  "data": {
    "id": 1,
    "email": "johndoe@example.com",
    "name": "Jogn Doe",
    "dinas": "TU",
    "role": "super admin",
    "no_peg": "12345",
  }
}
```

Response Body (fail) :

```json
{
  "code": "404",
  "status": "NOT_FOUND",
  "errors": {
    "id": [
      "",
    ],
    "name": [
      "",
    ],
  }
}
```

## Delete User

Endpoint : DELETE /api/users/:userId

Headers :

- Authorization : token

Response Body (success) :

```json
{
  "code": "200",
  "status": "OK",
  "data": true
}
```

Response Body (fail) :

```json
{
  "code": "500",
  "status": "SERVER_ERROR",
  "errors": "",
}
```

## Search User

Endpoint : GET api/users

Headers :

- Authorization : token

Query Parameter :
- No Pegawai: string, user no_pegawai, optional
- email : string, user email, optional
- name : string, user name, optional
- phone : string, user no_telp, optional
- dinas: string, user dinas, optional,
- role: string, user role, optional,
- page : number, default 1
- size : number, default 10

Request Header :
- X-API-TOKEN : token

Response Body (Success) :

```json
{
  "code": "200",
  "status": "OK",
  "data": [
    {
      "id": 1,
      "no_pegawai": "12345",
      "email": "johndoe@example.com",
      "name": "Jogn Doe",
      "dinas": "TU",
      "role": 2,
    },
    {
      "id": 2,
      "no_pegawai": "12345",
      "email": "johndoe@example.com",
      "name": "Jogn Doe",
      "dinas": "TU",
      "role": 3,
    }
  ],
  "page": {
    "current_page": 1,
    "total_page": 10,
    "size": 100,
  }
}
```

Response Body (Failed) :

```json
{
  "code": "500",
  "status": "SERVER_ERROR",
  "errors": "",
}
```