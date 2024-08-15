## Auth API Spec

## Login User

Endpoint : POST /api/users/login

Request Body :

```json
{
  "identifier": "johndoe@example.com, 12345",
  "password": "rahasia"
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
    "token": "session_id_generated"
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

## Get User Current

Endpoint : GET /api/users/me

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

## Update User Current

Endpoint : PATCH /api/users/me

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

## Logout User

Endpoint : DELETE /api/users/me

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